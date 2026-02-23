import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Pass the current URL to the layout via a custom header
  const response = NextResponse.next();
  response.headers.set("x-url", request.url);
  return response;
}

export default proxy;

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
