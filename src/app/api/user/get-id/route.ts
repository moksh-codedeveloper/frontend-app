// app/api/user/get-id/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

// Define expected backend response types
interface BackendUserProfile {
  id: string;
  email: string;
  name?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) { // Ensure NextRequest is imported here for headers
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");

    if (!tokenCookie) {
      return NextResponse.json({ message: "Authentication token missing." }, { status: 401 });
    }

    const token = tokenCookie.value;
    // Hardcode backend URL for simplicity during development.
    const backendApiUrl = "http://localhost:5000";

    const response = await axios.get<BackendUserProfile | { message: string }>(
      `${backendApiUrl}/api/auth/profile`, // Calls your Node.js backend's profile endpoint
      {
        headers: {
          'Cookie': `token=${token}`, // Send the 'token' cookie to your backend
          // No X-CSRF-Token header needed here, as it's a GET request
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

    const userProfile = (response.data as unknown as { user: BackendUserProfile }).user;

    return NextResponse.json({
      message: "User ID fetched successfully",
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
      if (errorMessage.includes("Authentication token missing")) {
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