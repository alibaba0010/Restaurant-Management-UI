"use client";

import { useRef, useEffect } from "react";
import { useAuthStore } from "../../lib/store";

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
    // Mark the session as active in sessionStorage.
    // sessionStorage is cleared when the tab or window is closed.
    sessionStorage.setItem("session_active", "true");
  }, []);

  return <>{children}</>;
}
