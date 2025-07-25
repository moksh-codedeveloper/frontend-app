/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cloudinary_upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import type { NextRequest } from "next/server"; // Ensure NextRequest is imported

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

    // --- Get the userId by calling your own Next.js API route (/api/user/get-id) ---
    let userId: string;
    try {
        // Hardcode Next.js app URL for simplicity during development.
        const nextjsApiBaseUrl = "http://localhost:3000";
        const getUserIdApiUrl = `${nextjsApiBaseUrl}/api/user/get-id`;

        const userResponse = await axios.get<{ userId: string; message: string }>(
            getUserIdApiUrl,
            {
                // Forward original request's cookies and headers to /api/user/get-id
                // This is how /api/user/get-id will get the 'token' cookie
                headers: {
                    'Cookie': request.headers.get('Cookie') || '',
                    'X-CSRF-Token': request.headers.get('X-CSRF-Token') || '', // Forward CSRF if present
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

    } catch (error) {
        let errorMessage = "Authentication required for upload: An error occurred getting user ID.";
        let statusCode = 401;
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || error.message;
            statusCode = error.response?.status || 401;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Error getting userId for upload (from /api/user/get-id proxy):", errorMessage);
        return NextResponse.json({ message: errorMessage }, { status: statusCode });
    }

    const uploadFolder = `user_files/${userId}`;

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

    // --- Call Node.js backend to save file metadata ---
    // Hardcode backend URL for simplicity during development.
    const backendApiUrl = "http://localhost:5000";
    try {
        const csrfToken = request.headers.get('X-CSRF-Token'); // Get CSRF token from original frontend request

        const saveResponse = await axios.post(
            `${backendApiUrl}/api/files/save`, // Your Node.js backend endpoint
            {
                userId: userId,
                files: uploadedFilesData.map(file => ({
                    url: file.url,
                    publicId: file.public_id,
                    name: file.name,
                    size: file.size,
                })),
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || '', // Crucial: Send CSRF token for POST requests
                },
                withCredentials: true,
                validateStatus: (status) => status >= 200 && status < 500,
            }
        );

        if (saveResponse.status !== 200) {
            console.error("Backend failed to save file metadata:", saveResponse.status, saveResponse.data);
            return NextResponse.json({ message: "Files uploaded, but failed to save metadata to database." }, { status: 500 });
        }

    } catch (saveError) {
        let saveErrorMessage = "Failed to communicate with backend to save file metadata.";
        let statusCode = 500;
        if (axios.isAxiosError(saveError)) {
            saveErrorMessage = saveError.response?.data?.message || saveError.message;
            statusCode = saveError.response?.status || 500;
        } else if (saveError instanceof Error) {
            saveErrorMessage = saveError.message;
        }
        console.error("Error saving file metadata to backend:", saveErrorMessage);
        return NextResponse.json({ message: `Files uploaded, but an error occurred saving metadata: ${saveErrorMessage}` }, { status: statusCode });
    }

    return NextResponse.json({
      status: 200,
      message: "Files uploaded and metadata saved successfully",
      files: uploadedFilesData,
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