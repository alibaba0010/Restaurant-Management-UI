"use client";

import { useRef, useEffect } from "react";
import { useAuthStore } from "../../lib/store";
import { refreshSession, getCurrentUser } from "../../lib/api";

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
              }
            } catch (e) {
              console.error("Failed to fetch user after refresh", e);
            }
          }
        })
        .catch((err) => console.error("Failed to refresh session", err));
    }

    // Mark the session as active in sessionStorage.
    // sessionStorage is cleared when the tab or window is closed.
    sessionStorage.setItem("session_active", "true");
  }, []);

  return <>{children}</>;
}
