/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cloudinary_upload/route.ts - Fixed version
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import type { NextRequest } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});



export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ message: "No files uploaded" }, { status: 400 });
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB limit
    const uploadedFilesData: { url: string; public_id: string; name: string; size: number }[] = [];

    // ✅ Get userId by calling your Node.js auth backend (the RIGHT way)
    let userId: string;
    try {
        const getUserIdApiUrl = `http://localhost:3000/api/user/get-id`;

        const userResponse = await axios.get<{ userId: string; message: string }>(
            getUserIdApiUrl,
            {
                headers: {
                    'Cookie': request.headers.get('Cookie') || '',
                },
                withCredentials: true,
                validateStatus: (status) => status >= 200 && status < 500,
            }
        );

        if (userResponse.status !== 200) {
            const errorData = userResponse.data as { message: string };
            throw new Error(errorData.message || "Failed to get user ID for upload from internal API.");
        }
        userId = userResponse.data.userId;
        console.log("Successfully got userId from auth backend:", userId);

    } catch (error) {
        let errorMessage = "Authentication required for upload.";
        let statusCode = 401;
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
            statusCode = error.response?.status || 401;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Error getting userId:", errorMessage);
        return NextResponse.json({ message: errorMessage }, { status: statusCode });
    }

    const uploadFolder = `uploads/${userId}`;

    // Upload files to Cloudinary
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
          {
            folder: uploadFolder,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      uploadedFilesData.push({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        name: file.name,
        size: file.size,
      });
    }

    // ✅ File metadata saved to Cloudinary only - no database needed
    console.log("Files uploaded successfully to Cloudinary");
    console.log("File metadata:", uploadedFilesData);

    return NextResponse.json({
      status: 200,
      message: "Files uploaded successfully to Cloudinary",
      files: uploadedFilesData,
      userId: userId, // Include userId for frontend reference
    });
    
  } catch (error) {
    console.error("Upload process error:", error);
    
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}