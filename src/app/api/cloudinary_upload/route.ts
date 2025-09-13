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

    // ✅ Upload files to Cloudinary with timeout handling and retry logic
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { message: `${file.name} exceeds the 20MB limit` },
          { status: 400 }
        );
      }

      // ✅ Retry logic for failed uploads
      let uploadSuccess = false;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (!uploadSuccess && retryCount <= maxRetries) {
        try {
          console.log(`Uploading ${file.name} (attempt ${retryCount + 1}/${maxRetries + 1})`);
          
          const buffer = Buffer.from(await file.arrayBuffer());

          // ✅ Determine resource type based on file type
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          const resourceType = isPdf ? 'raw' : 'auto';
          
          console.log(`File type: ${file.type}, Resource type: ${resourceType}`);

          // ✅ Create upload promise with longer timeout
          const uploadResult: any = await Promise.race([
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: uploadFolder,
                  resource_type: resourceType, // ✅ FIXED: Use 'raw' for PDFs, 'auto' for others
                  use_filename: true,
                  unique_filename: true,
                  timeout: 120000, // ✅ 2 minutes timeout for large files
                  chunk_size: 6000000, // ✅ 6MB chunks for better reliability
                },
                (error, result) => {
                  if (error) {
                    console.error(`Cloudinary upload error for ${file.name} (attempt ${retryCount + 1}):`, error);
                    reject(error);
                  } else {
                    console.log(`Successfully uploaded ${file.name} as ${resourceType} on attempt ${retryCount + 1}`);
                    resolve(result);
                  }
                }
              );
              stream.end(buffer);
            }),
            // ✅ Custom timeout promise (3 minutes total)
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Upload timeout after 3 minutes')), 180000)
            )
          ]);

          uploadedFilesData.push({
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            name: file.name,
            size: file.size,
          });
          
          uploadSuccess = true;
          
        } catch (uploadError: any) {
          retryCount++;
          console.error(`Upload attempt ${retryCount} failed for ${file.name}:`, uploadError);
          
          // ✅ If it's a timeout and we have retries left, wait and try again
          if ((uploadError.name === 'TimeoutError' || uploadError.message?.includes('timeout')) && retryCount <= maxRetries) {
            console.log(`Retrying upload for ${file.name} in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            continue;
          }
          
          // ✅ If all retries failed or it's a different error
          if (retryCount > maxRetries) {
            console.error(`All upload attempts failed for ${file.name}`);
            return NextResponse.json(
              { 
                message: `Failed to upload ${file.name} after ${maxRetries + 1} attempts. This might be due to file size or network issues. Please try uploading a smaller file or check your connection.`,
                error: uploadError.message || 'Upload timeout'
              },
              { status: 500 }
            );
          }
        }
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