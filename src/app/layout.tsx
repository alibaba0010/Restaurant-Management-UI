import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import AuthProvider from "../components/providers/auth-provider";
import { cookies } from "next/headers";
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
  let user = null;

  if (!access_token && refresh_token) {
    // No access token but refresh token exists, try to get a new one
    const refresh = await refreshSession(cookieStore.toString());
    if (refresh.success && refresh.token) {
      try {
        const response = await getCurrentUser(refresh.token);
        user = response.data;
      } catch (e) {
        console.error("Failed to get user after refresh", e);
      }
    }
  } else if (access_token) {
    try {
      const response = await getCurrentUser(access_token);
      user = response.data;
    } catch (error: any) {
      if (error.status === 401 && refresh_token) {
        // Access token expired, try to refresh
        const refresh = await refreshSession(cookieStore.toString());
        if (refresh.success && refresh.token) {
          try {
            const response = await getCurrentUser(refresh.token);
            user = response.data;
          } catch (e) {
            console.error("Failed to get user after layout refresh", e);
          }
        }
      }
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
        <AuthProvider user={user}>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
