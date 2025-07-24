/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
import { isAxiosError } from "axios"; // Import isAxiosError for better type checking

const AUTH_PAGES = ["/login", "/register"]; // Pages related to authentication
const PROTECTED_ROUTES_PREFIX = "/dashboard"; // Example: All routes under /dashboard are protected

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  const accessToken = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  const isAuthenticated = !!accessToken; // Simple check for presence of access token
  const isAuthPage = AUTH_PAGES.includes(path);
  const isProtectedPath = path.startsWith(PROTECTED_ROUTES_PREFIX);
  const isPublicRoute = ["/"].includes(path); // Only root is truly public for now, or add more as needed

  // --- Core Logic Flow ---

  // 1. If trying to access Auth Pages while authenticated
  if (isAuthPage && isAuthenticated) {
    url.pathname = PROTECTED_ROUTES_PREFIX;
    return NextResponse.redirect(url);
  }

  // 2. Allow truly public routes
  if (isPublicRoute) {
      return NextResponse.next();
  }

  // 3. For all other routes (potentially protected): Check authentication
  // If no tokens (both access and refresh), redirect to login
  if (!accessToken && !refreshToken) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();

  // If access token exists, check if it's expired
  if (accessToken) {
    const isExpired = isJwtExpired(accessToken);

    if (!isExpired) {
      return res;
    }
  }

  // If access token is expired or missing, and a refresh token is present, try to refresh
  if (refreshToken) {
    try {
      const backendRefreshTokenUrl = "http://localhost:5000/api/auth/refreshToken";

      const refreshResponse = await axios.post(
        backendRefreshTokenUrl,
        {},
        {
          headers: {
            'Cookie': `refreshToken=${refreshToken}`,
          },
          withCredentials: true,
          validateStatus: (status) => status >= 200 && status < 500,
        }
      );

      if (refreshResponse.status !== 200) {
        const errorData = refreshResponse.data;
        console.error("Backend refresh token error response:", refreshResponse.status, errorData);
        throw new Error(errorData.message || "Refresh token failed on backend.");
      }
      
      return res;
    } catch (error) {
      // --- FIX STARTS HERE ---
      let errorMessage = "An unknown error occurred during token refresh.";
      if (isAxiosError(error)) {
        // If it's an Axios error, error.response?.data might have a message
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        // If it's a standard JavaScript Error object
        errorMessage = error.message;
      }
      // If it's something else, errorMessage remains "An unknown error occurred..."
      
      console.error("Refresh token failed in middleware:", errorMessage);
      // --- FIX ENDS HERE ---

      const redirectRes = NextResponse.redirect(new URL("/login", req.url));
      redirectRes.cookies.delete("token");
      redirectRes.cookies.delete("refreshToken");
      return redirectRes;
    }
  }

  url.pathname = "/login";
  return NextResponse.redirect(url);
}

// Helper function to check JWT expiry (client-side safe)
function isJwtExpired(token?: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid JWT format (not 3 parts).");
      return true;
    }
    const [, payloadBase64] = parts;
    const { exp } = JSON.parse(atob(payloadBase64)); // Decode base64 and parse JSON
    return Date.now() >= exp * 1000;
  } catch (e) {
    console.warn("Error decoding or parsing JWT expiry:", e);
    return true; // Treat as expired or invalid if parsing fails
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
};