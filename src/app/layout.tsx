import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import AuthProvider from "../components/providers/auth-provider";
import { headers } from "next/headers";
import { getCurrentUser, refreshSession } from "../lib/api";
import { getServerTokens } from "../lib/server-tokens";
import { useAuthStore } from "@/lib/store";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "GourmetHub",
  description: "Discover and share amazing recipes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { accessToken: access_token, refreshToken: refresh_token } =
    await getServerTokens();
  const headersList = await headers();
  const { accessToken } = useAuthStore.getState();

  // First check if accessToken from store is not null, if null use accessToken from cookie
  const finalAccessToken = accessToken || access_token;

  const userAgent = headersList.get("user-agent") || "";
  const cookieHeader = headersList.get("cookie") || "";
  let user = null;

  // 1. Try to get user with existing access token
  if (finalAccessToken) {
    try {
      const response = await getCurrentUser(
        finalAccessToken,
        userAgent,
        cookieHeader
      );
      user = response.data;
    } catch (error: any) {
      if (error.status !== 401) {
        console.error("Failed to fetch user:", error);
      }
    }
  }

  // 2. If no user (missing or expired access token) AND we have a refresh token, try to refresh
  // This serves as a secondary check if middleware didn't catch it
  if (!user && refresh_token) {
    try {
      const refresh = await refreshSession(cookieHeader, userAgent);
      if (refresh.success && refresh.token) {
        // 3. Retry fetching user with the NEW access token
        const response = await getCurrentUser(
          refresh.token,
          userAgent,
          cookieHeader
        );
        user = response.data;
      }
    } catch (e) {
      console.error("Session refresh failed:", e);
    }
  }

  // 3. Reroute to "/" if no user found and not already on a public page
  // We use the 'x-url' header set in middleware to check the current path
  const url = headersList.get("x-url");
  let pathname = "";
  try {
    pathname = url ? new URL(url).pathname : "";
  } catch (e) {
    // Handle invalid URLs if any
  }

  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/forgot-password");
  // pathname.startsWith("/dashboard") ||

  if (!user && !isPublicPath) {
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
        <AuthProvider user={user}>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
