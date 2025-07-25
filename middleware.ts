/* eslint-disable @typescript-eslint/no-unused-vars */
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
import { isAxiosError } from "axios";

// Define the pages that are publicly accessible without authentication
const PUBLIC_ROUTES = ["/", "/login", "/register"];

// Define the prefix for routes that *require* authentication
// Any path starting with these prefixes will be protected
const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/files", "/settings", "/profile"]; // Add more as needed

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  const accessToken = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // Determine user's authentication status based on access token presence
  const isAuthenticated = !!accessToken;
  const isAuthPage = PUBLIC_ROUTES.includes(path); // These are pages like /login, /register, /

  // Check if the current path requires authentication
  // A path is protected if it starts with any of the PROTECTED_ROUTE_PREFIXES
  const isProtectedPath = PROTECTED_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix));

  // --- Logic Flow ---

  // 1. If the user is authenticated AND trying to access an authentication-related page (/login, /register)
  //    Redirect them away from login/register to a default authenticated page (e.g., dashboard).
  if (isAuthenticated && isAuthPage) {
    url.pathname = "/dashboard"; // Redirect to your main app page
    return NextResponse.redirect(url);
  }

  // 2. If the path is a public route (excluding login/register if already handled above)
  //    Allow access without further checks.
  //    Note: "/" is typically public, but if "/login" and "/register" are also here,
  //    the isAuthenticated check above will handle redirection for logged-in users.
  if (PUBLIC_ROUTES.includes(path)) {
      return NextResponse.next();
  }


  // 3. For all other routes (which are implicitly protected by default unless in PUBLIC_ROUTES):
  //    Ensure the user has an access token or can get one via refresh.

  // If NO access token AND NO refresh token, redirect to login
  if (!accessToken && !refreshToken) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Initialize a response object. This will be returned at the end of successful authentication
  // or after a successful token refresh. It's crucial for automatically forwarding `Set-Cookie`
  // headers from the backend's refresh response.
  const res = NextResponse.next();

  // If an access token exists, check if it's expired
  if (accessToken) {
    const isExpired = isJwtExpired(accessToken);

    if (!isExpired) {
      // Access token is valid and not expired, proceed to the requested page
      return res;
    }
    // If accessToken is expired, proceed to refresh token logic
  }

  // If access token is expired or missing, and a refresh token is present, try to refresh
  if (refreshToken) {
    try {
      const backendRefreshTokenUrl = "http://localhost:5000/api/auth/refreshToken"; // Fallback for dev

      const refreshResponse = await axios.post(
        backendRefreshTokenUrl,
        {}, // No request body needed for refresh token endpoint
        {
          headers: {
            'Cookie': `refreshToken=${refreshToken}`, // Send refresh token as a cookie
          },
          withCredentials: true, // Allow cookies to be sent/received cross-origin
          // Ensure Axios doesn't throw on non-2xx responses so we can check status manually
          validateStatus: (status) => status >= 200 && status < 500,
        }
      );

      // Check if the backend refresh token request was successful (HTTP 200 OK)
      if (refreshResponse.status !== 200) {
        // Backend indicated refresh token was invalid, expired, etc.
        const errorData = refreshResponse.data;
        console.error("Backend refresh token error:", refreshResponse.status, errorData);
        // Throw an error to trigger the catch block and redirect to login
        throw new Error(errorData.message || "Refresh token failed on backend.");
      }

      // If refresh was successful (status 200), the backend has set new
      // 'token' and 'refreshToken' cookies in its response headers.
      // `NextResponse.next()` (assigned to `res`) will automatically forward these
      // `Set-Cookie` headers to the client's browser.
      return res; // Proceed with the request, now authenticated with fresh tokens

    } catch (error) {
      // Handle any errors during the refresh token process (network issues, backend errors, etc.)
      let errorMessage = "An unknown error occurred during token refresh.";
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error("Refresh token failed in middleware:", errorMessage);

      // On refresh failure, clear existing tokens and redirect to login
      const redirectRes = NextResponse.redirect(new URL("/login", req.url));
      redirectRes.cookies.delete("token");
      redirectRes.cookies.delete("refreshToken");
      return redirectRes;
    }
  }

  // Fallback: If execution reaches here, it means:
  // - No access token
  // - No refresh token OR refresh token failed
  // - And the current path is NOT a public route (already handled above)
  // In this case, redirect to login.
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
    return Date.now() >= exp * 1000; // Check if current time is past expiry
  } catch (e) {
    console.warn("Error decoding or parsing JWT expiry:", e);
    return true; // Treat as expired or invalid if parsing fails
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|css|js)$).*)"],
  runtime: "nodejs", // Required for axios
};