"use client";

import { useRef } from "react";
import { useAuthStore } from "../../lib/store";

export default function AuthProvider({
  user,
  children,
}: {
  user: any;
  children: React.ReactNode;
}) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useAuthStore.setState({ user: user, isAuthenticated: !!user });
    initialized.current = true;
  }
  return <>{children}</>;
}
