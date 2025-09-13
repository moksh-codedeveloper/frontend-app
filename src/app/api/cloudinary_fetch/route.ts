/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cloudinary_upload/route.ts - Fixed version
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

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
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get("token");
    
    if (!files.length) {
      return NextResponse.json({ message: "No files uploaded" }, { status: 400 });
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB limit
    const uploadedFilesData: { url: string; public_id: string; name: string; size: number }[] = [];

    // ✅ Get userId by calling your Node.js auth backend
    let userId: string;
    try {
        const getUserIdApiUrl = `http://localhost:5000/api/auth/profile`;
        const token = cookieValue?.value;
        
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        const userResponse = await axios.get(
            getUserIdApiUrl,
            {
              headers: {
                'Cookie': `token=${token}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true,
              validateStatus: (status) => status >= 200 && status < 500,
            }
        );

        if (userResponse.status !== 200) {
            const errorData = userResponse.data as { message: string };
            throw new Error(errorData.message || "Failed to get user ID for upload from internal API.");
        }
        
        console.log("Profile response:", userResponse.data);
        
        // ✅ FIXED: Handle both response formats from your updated backend
        userId = userResponse.data?.id || userResponse.data?.user?.id;
        
        if (!userId) {
          throw new Error("User ID not found in response");
        }
        
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

    // ✅ Upload files to Cloudinary with better error handling
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { message: `${file.name} exceeds the 20MB limit` },
          { status: 400 }
        );
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadResult: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: uploadFolder,
              resource_type: "raw",
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) {
                console.error(`Cloudinary upload error for ${file.name}:`, error);
                reject(error);
              } else {
                resolve(result);
              }
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
        
      } catch (uploadError) {
        console.error(`Failed to upload ${file.name}:`, uploadError);
        return NextResponse.json(
          { message: `Failed to upload ${file.name}` },
          { status: 500 }
        );
      }
    }

    console.log("Files uploaded successfully to Cloudinary");
    console.log("File metadata:", uploadedFilesData);

    return NextResponse.json({
      message: "Files uploaded successfully to Cloudinary",
      files: uploadedFilesData,
      userId: userId,
    }, { status: 200 });
    
  } catch (error) {
    console.error("Upload process error:", error);
    
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}