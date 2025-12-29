import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { refreshSession } from "./lib/api";

// Helper to check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true;
    // Check if expired (with 10s buffer)
    return Date.now() >= payload.exp * 1000 - 10000;
  } catch (e) {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const access_token = request.cookies.get("access_token")?.value;
  const refresh_token = request.cookies.get("refresh_token")?.value;

  const response = NextResponse.next();

  // If we have no refresh token, we can't refresh, just return
  if (!refresh_token) return response;

  const shouldRefresh = !access_token || isTokenExpired(access_token);

  if (shouldRefresh && refresh_token) {
    try {
      const userAgent = request.headers.get("user-agent") || "";
      const cookieHeader = request.headers.get("cookie") || "";
      const refresh = await refreshSession(cookieHeader, userAgent);

      if (refresh.success) {
        // 2. Propagate Set-Cookie headers from backend (e.g. rotated refresh token)
        if (refresh.setCookies) {
        refresh.setCookies.forEach((cookieString) => {
          const [nameValue] = cookieString.split(";");
          const [name, value] = nameValue.split("=");
          });
        });
      }
    } catch (error) {
      console.error("Middleware refresh failed", error);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
