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

  let effectiveAccessToken = finalAccessToken;

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

  const url = headersList.get("x-url");
  let pathname = "";
  try {
    pathname = url ? new URL(url).pathname : "";
  } catch (e) {
    // Handle invalid URLs if any
  }

  // const isPublicPath =
  //   pathname === "/" ||
  //   pathname.startsWith("/signin") ||
  //   pathname.startsWith("/signup") ||
  //   pathname.startsWith("/verify") ||
  //   pathname.startsWith("/auth/callback") ||
  //   pathname.startsWith("/forgot-password") ||
  //   pathname.startsWith("/reset-password") ||
  //   pathname.startsWith("/verify-email");

  // if (!user && !isPublicPath) {
  //   redirect("/");
  // }

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
