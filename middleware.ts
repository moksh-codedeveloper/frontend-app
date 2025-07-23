import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import axios from "axios";

const PUBLIC_ROUTES = ["/" ,"/login", "/register"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(path)) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // If no tokens, redirect to login
  if (!accessToken && !refreshToken) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isExpired = isJwtExpired(accessToken);

  if (!isExpired) {
    return NextResponse.next();
  }

  // If expired, try to refresh
  if (refreshToken) {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/refreshtoken",
        {},
        {
          headers: {
            Cookie: `refreshToken=${refreshToken}`,
          },
          withCredentials: true,
        }
      );

      const { accessToken: newAccessToken } = response.data;

      const res = NextResponse.next();
      // Set new token from backend response
      res.cookies.set("token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 15, // 15 minutes
      });

      // Do NOT rotate refresh token here; backend does it
      return res;
    } catch (error) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  url.pathname = "/login";
  return NextResponse.redirect(url);
}

function isJwtExpired(token?: string) {
  if (!token) return true;
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload));
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|css|js)).*)"],
  runtime: "nodejs", // Axios needs node runtime
};
