/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cloudinary_upload/route.ts
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

    // --- Get the userId by calling your own Next.js API route (/api/user/get-id) ---
    let userId: string;
    try {
        const nextjsApiBaseUrl = "http://localhost:3000";
        const getUserIdApiUrl = `${nextjsApiBaseUrl}/api/user/get-id`;

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

    // --- Call Node.js backend to save file metadata ---
    const backendApiUrl = "http://localhost:5000";
    try {
        // Get CSRF token from the original request
        const csrfToken = request.headers.get('X-CSRF-Token');
        
        if (!csrfToken) {
            console.error("No CSRF token found in request headers");
            return NextResponse.json({ 
              message: "CSRF token required for file metadata saving" 
            }, { status: 403 });
        }

        console.log("Using CSRF token for backend call:", csrfToken.substring(0, 20) + "...");

        const saveResponse = await axios.post(
            `${backendApiUrl}/api/files/save`,
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
                    'X-CSRF-Token': csrfToken,
                    // Forward cookies if needed for backend authentication
                    'Cookie': request.headers.get('Cookie') || '',
                },
                withCredentials: true,
                validateStatus: (status) => status >= 200 && status < 500,
            }
        );

        if (saveResponse.status !== 200) {
            console.error("Backend failed to save file metadata:", saveResponse.status, saveResponse.data);
            return NextResponse.json({ 
              message: "Files uploaded to Cloudinary, but failed to save metadata to database.",
              files: uploadedFilesData // Still return the uploaded files
            }, { status: 500 });
        }

        console.log("File metadata saved successfully to backend");

    } catch (saveError) {
        let saveErrorMessage = "Failed to communicate with backend to save file metadata.";
        let statusCode = 500;
        
        if (axios.isAxiosError(saveError)) {
            saveErrorMessage = saveError.response?.data?.message || saveError.message;
            statusCode = saveError.response?.status || 500;
            
            // Log detailed error for debugging
            console.error("Backend save error details:", {
                status: saveError.response?.status,
                data: saveError.response?.data,
                headers: saveError.response?.headers
            });
        } else if (saveError instanceof Error) {
            saveErrorMessage = saveError.message;
        }
        
        console.error("Error saving file metadata to backend:", saveErrorMessage);
        
        // If it's a CSRF error, return more specific message
        if (statusCode === 403 && saveErrorMessage.includes('CSRF')) {
            return NextResponse.json({ 
              message: "CSRF token validation failed. Please refresh and try again.",
              files: uploadedFilesData // Still return the uploaded files
            }, { status: 403 });
        }
        
        return NextResponse.json({ 
          message: `Files uploaded to Cloudinary, but metadata save failed: ${saveErrorMessage}`,
          files: uploadedFilesData // Still return the uploaded files
        }, { status: statusCode });
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