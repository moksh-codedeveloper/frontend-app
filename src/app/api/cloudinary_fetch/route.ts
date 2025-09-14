/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cloudinary_fetch/route.ts - Fixed version
import { NextResponse } from "next/server";
import axios from "axios";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // ✅ Get query params for pagination & filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type"); // "image" or "pdf"
    
    // ✅ Get userId from your Node.js auth backend (CONSISTENT with upload)
    let userId: string;
    try {
      const cookieStore = await cookies();
      const cookieValue = cookieStore.get("token");
      
      if (!cookieValue?.value) {
        throw new Error("No authentication token found");
      }

      // ✅ FIXED: Use same auth endpoint as upload
      const getUserIdApiUrl = `http://localhost:5000/api/auth/profile`;
      const token = cookieValue.value;

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
        throw new Error(errorData.message || "Failed to get user ID");
      }

      // ✅ FIXED: Handle both response formats from your updated backend
      userId = userResponse.data?.id || userResponse.data?.user?.id;
      
      if (!userId) {
        throw new Error("User ID not found in response");
      }

      console.log("Successfully got userId for fetch:", userId);
      
    } catch (error) {
      let errorMessage = "Authentication required";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("Auth error in fetch:", errorMessage);
      return NextResponse.json({ message: errorMessage }, { status: 401 });
    }

    // ✅ Build Cloudinary Search Expression
    let expression = `folder=uploads/${userId}`;
    if (type === "image") {
      expression += " AND resource_type=image";
    } else if (type === "pdf") {
      expression += " AND format=pdf";
    } else {
      // Only allow image or pdf
      expression += " AND (resource_type=image OR format=pdf)";
    }

    // ✅ Call Cloudinary API with better error handling
    try {
      const response = await axios.get(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/search`,
        {
          auth: {
            username: process.env.CLOUDINARY_API_KEY!,
            password: process.env.CLOUDINARY_API_SECRET!,
          },
          params: {
            expression,
            max_results: limit,
            next_cursor: searchParams.get("cursor") || undefined,
            sort_by: [["created_at", "desc"]], // ✅ Sort by newest first
          },
          timeout: 10000, // ✅ Add timeout
        }
      );

      // ✅ Enhanced file mapping with more metadata
      const files = response.data.resources.map((file: any) => ({
        public_id: file.public_id,
        url: file.secure_url,
        format: file.format,
        size: file.bytes,
        created_at: file.created_at,
        resource_type: file.resource_type,
        display_name: file.display_name || file.public_id.split('/').pop(),
      }));

      return NextResponse.json({
        files,
        total_count: response.data.total_count || files.length,
        next_cursor: response.data.next_cursor || null,
        page,
        limit,
      }, { status: 200 });

    } catch (cloudinaryError) {
      console.error("Cloudinary API Error:", cloudinaryError);
      
      if (axios.isAxiosError(cloudinaryError)) {
        const status = cloudinaryError.response?.status || 500;
        const message = cloudinaryError.response?.data?.error?.message || "Failed to fetch files from Cloudinary";
        return NextResponse.json({ message }, { status });
      }
      
      return NextResponse.json({ message: "Failed to fetch files" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Cloudinary Fetch Error:", error);
    return NextResponse.json({ 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}