import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import AuthProvider from "../components/providers/auth-provider";
import { cookies, headers } from "next/headers";
import { getCurrentUser, refreshSession } from "../lib/api";

export const metadata: Metadata = {
  title: "GourmetHub",
  description: "Discover and share amazing recipes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;
  const refresh_token = cookieStore.get("refresh_token")?.value;
  const headersList = await headers();
  const { accessToken } = useAuthStore.getState();
  console.log("Access Token in Layout", accessToken);
  const userAgent = headersList.get("user-agent") || "";
  const cookieHeader = headersList.get("cookie") || "";
  let user = null;

  // 1. Try to get user with existing access token
  if (access_token) {
    try {
      const response = await getCurrentUser(
        access_token,
        userAgent,
        cookieHeader
      );
      user = response.data;
    } catch (error: any) {
      if (error.status !== 401) {
        console.error("Failed to fetch user:", error);
      }
      // If 401, we will fall through to refresh logic below
    }
  }

  // 2. If no user (missing or expired access token) AND we have a refresh token, try to refresh
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
        <AuthProvider user={user} accessToken={validToken}>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
