"use client";

import { useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../lib/store";
import { refreshSession, getCurrentUser } from "../../lib/api";

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

export default function AuthProvider({
  user,
  accessToken,
  children,
}: {
  user: any;
  accessToken?: string | null;
  children: React.ReactNode;
}) {
  const initialized = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  if (!initialized.current) {
    useAuthStore.setState({
      user: user,
      accessToken: accessToken || null,
      isAuthenticated: !!user,
    });
    initialized.current = true;
  }

  useEffect(() => {
    // If opened in a new page (e.g. typing URL, new tab), delete all session storage
    // (Note: refresh_token is an HttpOnly cookie, so it's not actually in sessionStorage!)
    const navEntries = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    const navType = navEntries.length > 0 ? navEntries[0].type : "navigate";

    if (navType === "navigate") {
      sessionStorage.clear();
    }

    const { user: currentUser, accessToken: currentAccessToken } =
      useAuthStore.getState();

    // If we already have a user, no need to do anything
    if (currentUser) {
      sessionStorage.setItem("session_active", "true");
      return;
    }

    // Since the refresh_token is an HttpOnly cookie, JavaScript cannot read it.
    // Instead, we just attempt a refresh session. The browser will automatically send
    // the HttpOnly cookie in the request (because of credentials: "include" in fetch).
    if (!currentUser && !currentAccessToken) {
      refreshSession()
        .then(async (res) => {
          if (res.success && res.token) {
            useAuthStore.getState().setAccessToken(res.token);
            try {
              const userRes = await getCurrentUser(res.token);
              if (userRes.data) {
                useAuthStore.getState().setUser(userRes.data);
              } else if (!isPublicPath(pathname)) {
                // Refresh succeeded but no user data - redirect to home
                router.replace("/");
              }
            } catch (e) {
              console.error("Failed to fetch user after refresh", e);
              if (!isPublicPath(pathname)) {
                router.replace("/");
              }
            }
          } else if (!isPublicPath(pathname)) {
            // Refresh failed - redirect to home on protected routes
            router.replace("/");
          }
        })
        .catch((err) => {
          console.error("Failed to refresh session", err);
          if (!isPublicPath(pathname)) {
            router.replace("/");
          }
        });
    }

    // Mark the session as active in sessionStorage.
    // sessionStorage is cleared when the tab or window is closed.
    sessionStorage.setItem("session_active", "true");
  }, [pathname, router]);

  return <>{children}</>;
}
