import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import AuthProvider from "../components/providers/auth-provider";
import { headers } from "next/headers";
import { getCurrentUser, refreshSession } from "../lib/api";
import { getServerTokens } from "../lib/server-tokens";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "GourmetHub",
  description: "Discover and share amazing recipes.",
};

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/signin",
  "/signup",
  "/verify",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/health",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { accessToken: access_token, refreshToken: refresh_token } =
    await getServerTokens();
  const headersList = await headers();

  const userAgent = headersList.get("user-agent") || "";
  const cookieHeader = headersList.get("cookie") || "";
  let user = null;
  let effectiveAccessToken = access_token || null;

  // Step 1: Try to get user with existing access token
  if (effectiveAccessToken) {
    try {
      const response = await getCurrentUser(
        effectiveAccessToken,
        userAgent,
        cookieHeader,
      );
      user = response.data;
    } catch (error: any) {
      if (error.status === 401) {
        // Access token is invalid/expired, clear it so we try refresh next
        effectiveAccessToken = null;
      } else {
        console.error("Failed to fetch user:", error);
      }
    }
  }

  // Step 2: If no user yet but refresh token exists, attempt server-side refresh
  if (!user && refresh_token) {
    try {
      const refreshResult = await refreshSession(cookieHeader, userAgent);
      if (refreshResult.success && refreshResult.token) {
        effectiveAccessToken = refreshResult.token;
        // Now try fetching the user with the new token
        try {
          const response = await getCurrentUser(
            effectiveAccessToken,
            userAgent,
            cookieHeader,
          );
          user = response.data;
        } catch (e) {
          console.error("Failed to fetch user after token refresh:", e);
        }
      }
    } catch (err) {
      console.error("Server-side token refresh failed:", err);
    }
  }

  // Step 3: Determine the current path
  const url = headersList.get("x-url");
  let pathname = "";
  try {
    pathname = url ? new URL(url).pathname : "";
  } catch (e) {
    // Handle invalid URLs
  }

  // Step 4: If no user and the route is protected, redirect to "/"
  if (!user && pathname && !isPublicPath(pathname)) {
    redirect("/");
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider user={user} accessToken={effectiveAccessToken}>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
