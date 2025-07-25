// app/api/user/get-id/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios"; // Ensure Axios and AxiosError are imported

// Define expected backend response types
interface BackendUserProfile {
  id: string;
  email: string;
  name?: string;
}

interface BackendProfileResponse {
  user: BackendUserProfile;
}

// This is the GET handler for /api/user/get-id
export async function GET() { // It's a GET request, so export GET
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");

    if (!tokenCookie) {
      // Changed to NextResponse.json as this is now a full API route
      return NextResponse.json({ message: "Authentication token missing." }, { status: 401 });
    }

    const token = tokenCookie.value;
    const backendApiUrl = process.env.NODE_BACKEND_URL || "http://localhost:5000";

    const response = await axios.get<BackendProfileResponse | { message: string }>(
      `${backendApiUrl}/api/auth/profile`, // The correct backend profile endpoint
      {
        headers: {
          'Cookie': `token=${token}`,
        },
        withCredentials: true,
        validateStatus: (status) => status >= 200 && status < 500
      }
    );

    if (response.status !== 200) {
      const errorData = response.data as { message: string };
      console.error("Backend /profile error response:", response.status, errorData);
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch user profile from backend." },
        { status: response.status }
      );
    }

    const userProfile = (response.data as BackendProfileResponse).user;

    return NextResponse.json({
      message: "User ID fetched successfully", // Added a success message
      userId: userProfile.id,
      user: userProfile
    }, { status: 200 });

  } catch (error) {
    let errorMessage = "An unknown error occurred while fetching user ID.";
    let statusCode = 500;
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
      statusCode = error.response?.status || 500;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes("Authentication token missing")) { // Specific check for the error thrown above
         statusCode = 401;
      }
    }
    console.error("Error in /api/user/get-id route:", errorMessage);
    return NextResponse.json(
      { message: errorMessage },
      { status: statusCode }
    );
  }
}