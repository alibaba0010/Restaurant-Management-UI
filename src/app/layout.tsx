import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import AuthProvider from "../components/providers/auth-provider";
import { cookies } from "next/headers";
import { getCurrentUser } from "../lib/api";

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
  const token = cookieStore.get("access_token")?.value;
  let user = null;

  if (token) {
    try {
      user = await getCurrentUser(token);
    } catch (error) {
      console.error("Failed to fetch user in layout", error);
      // Optional: invalid token, maybe we should clear cookie but we can't do it in Server Component easily without middleware.
      // For now, just treat as null user.
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
