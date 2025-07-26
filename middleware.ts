// middleware.ts - Fixed version
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register"];
const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/file_upload", "/profile"];

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

  // 1. Allow public routes
  if (PUBLIC_ROUTES.includes(path)) {
    if (accessToken && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2. For protected routes - enforce authentication
  if (isProtectedRoute(path)) {
    if (!accessToken && !refreshToken) {
      console.log("No tokens found, redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (accessToken) {
      const isExpired = isJwtExpired(accessToken);
      
      if (!isExpired) {
        console.log("Access token is valid, proceeding");
        return NextResponse.next();
      }
      
      console.log("Access token is expired, attempting refresh");
    }

    // Token refresh with proper cookie handling
    if (refreshToken) {
      try {
        console.log("Attempting token refresh...");
        
        const backendRefreshTokenUrl = process.env.NODE_ENV === 'production' 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refreshToken`
          : "http://localhost:5000/api/auth/refreshToken";

        // ✅ Fixed: Forward ALL cookies instead of just refreshToken
        const refreshResponse = await fetch(backendRefreshTokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || '', // Forward all cookies
          },
        });

        console.log("Refresh response status:", refreshResponse.status);

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          console.error("Refresh token failed:", refreshResponse.status, errorText);
          throw new Error(`Refresh failed with status: ${refreshResponse.status}`);
        }

        const refreshData = await refreshResponse.json();
        console.log("Refresh successful, got new tokens");

        const response = NextResponse.next();
        
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? "strict" as const : "lax" as const,
          path: '/',
        };
        
        if (refreshData.accessToken) {
          response.cookies.set("token", refreshData.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60,
          });
        }

        if (refreshData.refreshToken) {
          response.cookies.set("refreshToken", refreshData.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60,
          });
        }

        return response;

      } catch (error) {
        console.error("Token refresh failed:", error);
        
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

  return NextResponse.next();
}

// Helper function remains the same
function isJwtExpired(token?: string): boolean {
  if (!token) return true;
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid JWT format");
      return true;
    }

    const [, payloadBase64] = parts;
    
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};