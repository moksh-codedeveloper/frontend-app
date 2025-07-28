/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import axios from "axios";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // ✅ Get query params for pagination & filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type"); // "image" or "pdf"
    
    // ✅ Get userId from internal auth API
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
        throw new Error(userResponse.data.message || "Failed to get user ID");
      }

      userId = userResponse.data.userId;
    } catch (error) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
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

    // ✅ Call Cloudinary API
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
        },
      }
    );

    const files = response.data.resources.map((file: any) => ({
      public_id: file.public_id,
      url: file.secure_url,
      format: file.format,
      size: file.bytes,
    }));

    return NextResponse.json({
      files,
      next_cursor: response.data.next_cursor || null,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cloudinary Fetch Error:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
