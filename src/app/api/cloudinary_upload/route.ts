/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cloudinary_upload/route.ts
import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios"; // Ensure Axios and AxiosError are imported

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

    // --- NEW: Get the userId by calling your own Next.js API route ---
    let userId: string;
    try {
        // Call your own Next.js API route /api/user/get-id
        // This route will handle reading the 'token' cookie and proxying to your Node.js backend
        const userResponse = await axios.get<{ userId: string; message: string }>(
            `/api/user/get-id`,
            {
                headers: {
                    'Cookie': request.headers.get('token') || '',
                },
                withCredentials: true, // Important for Axios to send cookies to your own domain
                validateStatus: (status) => status >= 200 && status < 500, // Don't throw on 4xx errors
            }
        );

        if (userResponse.status !== 200) {
            const errorData = userResponse.data as { message: string };
            throw new Error(errorData.message || "Failed to get user ID for upload from internal API.");
        }
        userId = userResponse.data.userId;

    } catch (error) {
        let errorMessage = "Authentication required for upload: An error occurred getting user ID.";
        let statusCode = 401; // Default to 401 if auth fails
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
            statusCode = error.response?.status || 401;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Error getting userId for upload (from /api/user/get-id proxy):", errorMessage);
        return NextResponse.json({ message: errorMessage }, { status: statusCode });
    }
    // --- END NEW ---

    const uploadFolder = `uploads/${userId}`; // Dynamic folder per user

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
    }
    return NextResponse.json({
      status: 200,
      message: "Files uploaded and metadata saved successfully",
    });
  } catch (error) {
    let errorMessage = "Internal Server Error";
    let statusCode = 500;
    if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
        statusCode = error.response?.status || 500;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("Upload process error:", errorMessage);
    return NextResponse.json(
      { message: errorMessage },
      { status: statusCode }
    );
  }
}