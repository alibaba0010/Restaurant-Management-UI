import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import AuthProvider from "../components/providers/auth-provider";
import { cookies } from "next/headers";
import { getCurrentUser, apiRefreshToken } from "../lib/api";

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

  if (access_token) {
    try {
      user = await getCurrentUser(access_token);
    } catch (error: any) {
      if (error.status === 401 && refresh_token) {
        // Access token expired/invalid but refresh token exists, try to refresh
        try {
          const allCookies = cookieStore.toString();
          const refreshRes = await apiRefreshToken(allCookies);

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData.access_token;
            if (newToken) {
              user = await getCurrentUser(newToken);
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed", refreshError);
        }
      }
    }
  } else if (refresh_token) {
    // No access token but refresh token exists
    try {
      const allCookies = cookieStore.toString();
      const refreshRes = await apiRefreshToken(allCookies);

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.access_token;
        if (newToken) {
          user = await getCurrentUser(newToken);
        }
      }
    } catch (refreshError) {
      console.error("Token refresh failed", refreshError);
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
