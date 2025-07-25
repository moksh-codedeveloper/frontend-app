/* eslint-disable @typescript-eslint/no-unused-vars */
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register"]; // Routes accessible without authentication
const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/file_upload", "/profile"]; // Routes that explicitly require authentication

// Helper function to check if a route is protected
function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  const accessToken = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  console.log("Middleware Debug:", { 
    path, 
    hasAccessToken: !!accessToken, 
    hasRefreshToken: !!refreshToken,
    isPublicRoute: PUBLIC_ROUTES.includes(path),
    isProtectedRoute: isProtectedRoute(path)
  });

  // --- Core Logic Flow ---

  // 1. Allow public routes without any checks (including home page)
  if (PUBLIC_ROUTES.includes(path)) {
    // But if user is authenticated and trying to access login/register, redirect to dashboard
    if (accessToken && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2. For protected routes - enforce authentication
  if (isProtectedRoute(path)) {
    // If no tokens at all, redirect to login
    if (!accessToken && !refreshToken) {
      console.log("No tokens found, redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // If we have an access token, check if it's valid
    if (accessToken) {
      const isExpired = isJwtExpired(accessToken);
      
      if (!isExpired) {
        // Access token is valid, allow access
        console.log("Access token is valid, proceeding");
        return NextResponse.next();
      }
      
      console.log("Access token is expired, attempting refresh");
    }

    // If access token is missing or expired, try to refresh using refresh token
    if (refreshToken) {
      try {
        console.log("Attempting token refresh...");
        
        // Create the backend URL - make sure this matches your backend
        const backendRefreshTokenUrl = process.env.NODE_ENV === 'production' 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refreshToken`
          : "http://localhost:5000/api/auth/refreshToken";

        const refreshResponse = await fetch(backendRefreshTokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `refreshToken=${refreshToken}`,
          },
        });

        console.log("Refresh response status:", refreshResponse.status);

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          console.error("Refresh token failed:", refreshResponse.status, errorText);
          throw new Error(`Refresh failed with status: ${refreshResponse.status}`);
        }

        // Parse the response to get new tokens
        const refreshData = await refreshResponse.json();
        console.log("Refresh successful, got new tokens");

        // Create response and set new cookies with proper configuration
        const response = NextResponse.next();
        
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? "strict" as const : "lax" as const,
          path: '/',
        };
        
        // Set new access token
        if (refreshData.accessToken) {
          response.cookies.set("token", refreshData.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60, // 15 minutes
          });
          console.log("Set new access token in middleware");
        }

        // Set new refresh token if provided
        if (refreshData.refreshToken) {
          response.cookies.set("refreshToken", refreshData.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
          console.log("Set new refresh token in middleware");
        }

        console.log("New tokens set in cookies, proceeding with request");
        return response;

      } catch (error) {
        console.error("Token refresh failed:", error);
        
        // Clear invalid tokens and redirect to login
        const loginResponse = NextResponse.redirect(new URL("/login", req.url));
        loginResponse.cookies.delete("token");
        loginResponse.cookies.delete("refreshToken");
        return loginResponse;
      }
    } else {
      console.log("No refresh token available, redirecting to login");
      const loginResponse = NextResponse.redirect(new URL("/login", req.url));
      loginResponse.cookies.delete("token");
      loginResponse.cookies.delete("refreshToken");
      return loginResponse;
    }
  }

  // 3. For all other routes (neither public nor explicitly protected)
  // Allow access but don't enforce authentication
  return NextResponse.next();
}

// Helper function to check JWT expiry
function isJwtExpired(token?: string): boolean {
  if (!token) return true;
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid JWT format");
      return true;
    }

    const [, payloadBase64] = parts;
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payloadBase64.padEnd(
      payloadBase64.length + (4 - (payloadBase64.length % 4)) % 4, 
      '='
    );
    
    const payload = JSON.parse(atob(paddedPayload));
    
    if (!payload.exp) {
      console.warn("JWT does not contain expiry claim");
      return true;
    }
    
    const isExpired = Date.now() >= payload.exp * 1000;
    console.log("Token expiry check:", { 
      exp: payload.exp, 
      now: Math.floor(Date.now() / 1000), 
      isExpired 
    });
    
    return isExpired;
  } catch (e) {
    console.error("Error decoding JWT:", e);
    return true;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};