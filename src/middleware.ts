import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { refreshSession } from "./lib/api";

export async function middleware(request: NextRequest) {
  const access_token = request.cookies.get("access_token")?.value;
  const refresh_token = request.cookies.get("refresh_token")?.value;

  const response = NextResponse.next();

  // If we have a refresh token but no access token, try to refresh
  if (!access_token && refresh_token) {
    try {
      const refresh = await refreshSession(`refresh_token=${refresh_token}`);

      if (refresh.success && refresh.setCookies) {
        // Propagate Set-Cookie headers from backend to browser
        refresh.setCookies.forEach((cookieString) => {
          const [nameValue] = cookieString.split(";");
          const [name, value] = nameValue.split("=");

          response.cookies.set({
            name: name.trim(),
            value: value.trim(),
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
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
