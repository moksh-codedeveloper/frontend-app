import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

interface BackendUserProfile {
  id: string;
  email: string;
  name?: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");

    if (!tokenCookie) {
      return NextResponse.json(
        { message: "Authentication token missing." },
        { status: 401 }
      );
    }

    const token = tokenCookie.value;
    const backendApiUrl = "http://localhost:5000";

    // ✅ Forward the cookie instead of using Authorization header
    const response = await axios.get<BackendUserProfile | { message: string }>(
      `${backendApiUrl}/api/auth/profile`,
      {
        headers: {
          'Cookie': `token=${token}`, // Forward token as cookie
        },
        withCredentials: true,
        validateStatus: (status) => status >= 200 && status < 500,
      }
    );

    if (response.status !== 200) {
      const errorData = response.data as { message: string };
      console.error("Backend /profile error response:", response.status, errorData);
      return NextResponse.json(
        {
          message: errorData.message || "Failed to fetch user profile from backend.",
        },
        { status: response.status }
      );
    }

    const userProfile = response.data as BackendUserProfile;
    console.log(userProfile);
    
    return NextResponse.json(
      {
        message: "User ID fetched successfully",
        userId: userProfile.id,
        user: userProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    let errorMessage = "An unknown error occurred while fetching user ID.";
    let statusCode = 500;
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
      statusCode = error.response?.status || 500;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes("Authentication token missing")) {
        statusCode = 401;
      }
    }
    console.error("Error in /api/user/get-id route:", errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}
