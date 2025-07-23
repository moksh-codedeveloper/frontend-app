/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ message: "No files uploaded" }, { status: 400 });
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB limit
    const results: { url: string; public_id: string }[] = [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { message: `${file.name} exceeds the 20MB limit` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "uploads" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      results.push({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      });
    }

    return NextResponse.json({
      status: 200,
      message: "Files uploaded successfully",
      files: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
