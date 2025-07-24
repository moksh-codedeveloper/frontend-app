/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { cookies } from "next/headers";
import axios from "axios"; // Using axios as per your original code, but fetch is often preferred for server-side
import { AxiosError } from "axios"; // Import AxiosError for better type safety

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Ensure these are public for client-side usage if any, otherwise just CLOUDINARY_CLOUD_NAME
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Define expected backend response types
interface BackendUserProfile {
  id: string;
  email: string;
  name?: string;
}

interface BackendProfileResponse {
  message: string;
  user: BackendUserProfile;
}

/**
 * Helper function to fetch the userId from the backend using the token cookie.
 * This function returns the userId directly or throws an error.
 */
async function getUserIdFromBackend(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token"); // Get the 'token' cookie

    if (!tokenCookie) {
      throw new Error("Authentication token missing.");
    }

    const token = tokenCookie.value;
    const backendApiUrl = "http://localhost:5000/api/auth/"; // Your backend base URL

    const response = await axios.get<BackendProfileResponse>(`${backendApiUrl}profile`, {
      headers: {
        // CORRECTED: Ensure 'Cookie' header is sent correctly
        'Cookie': `token=${token}`,
      },
    });

    if (response.status !== 200) {
      // Axios throws for 4xx/5xx by default if validateStatus is not set,
      // but explicitly checking helps.
      console.error("Backend /profile error response:", response.status, response.data);
      throw new Error(response.data.message || "Failed to fetch user profile from backend.");
    }

    const userId = response.data.user.id;
    return userId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // More specific error handling for Axios errors
      console.error("Axios error getting user ID:", error.response?.status, error.response?.data);
      throw new Error(`Failed to get user ID: ${error.response?.data?.message || error.message}`);
    } else if (error instanceof Error) {
      console.error("General error getting user ID:", error.message);
      throw new Error(`Failed to get user ID: ${error.message}`);
    } else {
      console.error("Unknown error getting user ID:", error);
      throw new Error("Failed to get user ID due to an unknown error.");
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ message: "No files uploaded" }, { status: 400 });
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB limit
    const results: { url: string; public_id: string }[] = [];

    // Attempt to get the userId before processing files
    let userId: string;
    try {
      userId = await getUserIdFromBackend();
    } catch (error: any) {
      // If unable to get userId, return an unauthorized/error response
      console.error("Error getting userId for upload:", error.message);
      return NextResponse.json(
        { message: error.message || "Authentication required for upload." },
        { status: 401 }
      );
    }

    // Now userId is available for use in the folder path
    const uploadFolder = `uploads/${userId}`;

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
            folder: uploadFolder, // Use the dynamically created folder
            // Add other options here if needed, e.g., resource_type: "auto"
          },
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
    console.error("Global upload error:", error); // Log the full error
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}