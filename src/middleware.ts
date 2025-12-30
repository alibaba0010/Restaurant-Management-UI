import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { refreshSession } from "./lib/api";
import { useAuthStore } from "./lib/store";

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

  // First check if accessToken from store is not null, if null use accessToken from cookie
  const { accessToken } = useAuthStore.getState();
  const finalAccessToken = accessToken || access_token;

  let refreshResult = { success: false, setCookies: [] as string[] };

  const shouldRefresh = !finalAccessToken || isTokenExpired(finalAccessToken);

  if (shouldRefresh && refresh_token) {
    try {
      const userAgent = request.headers.get("user-agent") || "";
      const cookieHeader = request.headers.get("cookie") || "";
      const refresh = await refreshSession(cookieHeader, userAgent);
      if (refresh.success) {
        refreshResult = refresh as any;
      }
    } catch (error) {
      console.error("Middleware refresh failed", error);
    }
  }

  // Create a new request with the updated headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", request.url);

  // Propagate Set-Cookie headers from backend to the new request as well
  if (refreshResult.success && refreshResult.setCookies) {
    refreshResult.setCookies.forEach((cookieString: string) => {
      requestHeaders.append("Set-Cookie", cookieString);
    });
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Re-apply Set-Cookie headers to the response so they reach the browser
  if (refreshResult.success && refreshResult.setCookies) {
    refreshResult.setCookies.forEach((cookieString: string) => {
      response.headers.append("Set-Cookie", cookieString);
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
