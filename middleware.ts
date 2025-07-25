/* eslint-disable @typescript-eslint/no-unused-vars */
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";
import { isAxiosError } from "axios";

const PUBLIC_ROUTES = ["/", "/login", "/register"]; // Routes accessible without authentication
const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/files", "/settings", "/profile"]; // Routes that explicitly require authentication

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  const accessToken = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  const isAuthenticated = !!accessToken;
  const isAuthPage = PUBLIC_ROUTES.includes(path);

  // --- Core Logic Flow ---

  // 1. If the user is authenticated AND trying to access an authentication-related page (/login, /register)
  //    Redirect them to the dashboard.
  if (isAuthenticated && isAuthPage) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 2. Allow truly public routes without any authentication checks.
  if (PUBLIC_ROUTES.includes(path)) {
      return NextResponse.next();
  }

  // 3. For all other routes (implicitly protected): Ensure authentication or perform refresh.

  // If NO access token AND NO refresh token, redirect to login.
  if (!accessToken && !refreshToken) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Initialize a response object. This will automatically forward Set-Cookie headers
  // from the backend's refresh response to the client.
  const res = NextResponse.next();

  // If an access token exists, check if it's expired.
  if (accessToken) {
    const isExpired = isJwtExpired(accessToken);

    if (!isExpired) {
      // Access token is valid, proceed to the requested page.
      return res;
    }
    // If accessToken is expired, fall through to refresh token logic.
  }

  // If access token is expired or missing, and a refresh token is present, try to refresh.
  if (refreshToken) {
    try {
      // Hardcode backend URL for simplicity during development.
      // Make sure your Node.js backend is running on port 5000.
      const backendRefreshTokenUrl = "http://localhost:5000/api/auth/refreshToken"; // Your backend's refresh endpoint

      const refreshResponse = await axios.post(
        backendRefreshTokenUrl,
        {}, // Empty body, as refresh token is sent via cookie
        {
          headers: {
            'Cookie': `refreshToken=${refreshToken}`, // Send the refresh token in the Cookie header
            // No X-CSRF-Token needed here because this is a server-to-server call (middleware to backend)
            // and the backend verifies the CSRF token on the original frontend request, not this internal one.
            // Also, typically refresh token endpoints don't have CSRF protection on the POST itself
            // if the token is in an HttpOnly cookie.
          },
          withCredentials: true,
          validateStatus: (status) => status >= 200 && status < 500, // Handle non-2xx statuses manually
        }
      );

      // Backend returns 401/403 if refresh token is invalid/expired/missing on its end
      if (refreshResponse.status !== 200) {
        const errorData = refreshResponse.data as { message: string };
        console.error("Backend refresh token error response:", refreshResponse.status, errorData);
        // Throwing error here will lead to the catch block below
        throw new Error(errorData.message || "Refresh token failed on backend.");
      }

      // If successful (status 200), your backend has already set the new 'token'
      // and 'refreshToken' cookies in the response headers.
      // NextResponse.next() (our `res` object) automatically forwards these to the client.
      return res; // Proceed with the request, now with fresh tokens

    } catch (error) {
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
  // - No valid access token
  // - Refresh token was missing or failed
  // - And the current path is NOT a public route
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
    const { exp } = JSON.parse(atob(payloadBase64));
    return Date.now() >= exp * 1000;
  } catch (e) {
    console.warn("Error decoding or parsing JWT expiry:", e);
    return true; // Treat as expired or invalid if parsing fails
  }
}

export const config = {
  // Match all routes except:
  // - API routes (`/api`) - these handle their own auth internally or expect it via proxy
  // - Next.js internal paths (`_next/static`, `_next/image`)
  // - Favicon (`favicon.ico`)
  // - Any static files (like .png, .jpg etc. that are not served through Next.js image component)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|jpeg|svg|gif|webp|css|js)$).*)"],
  runtime: "nodejs",
};