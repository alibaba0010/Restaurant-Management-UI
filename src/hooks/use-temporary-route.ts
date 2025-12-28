"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * useTemporaryRoute is a hook that redirects the user to the home page
 * if they land on a page after a fresh browser/tab session (e.g., reopening the tab).
 *
 * It relies on sessionStorage which is cleared when the browser or tab is closed.
 * Internal navigation within the same session will have 'session_active' set to true.
 */
export function useTemporaryRoute() {
  const router = useRouter();

  useEffect(() => {
    // Check if the session is active.
    // Since AuthProvider sets this in its own useEffect, and child useEffects
    // run before parent useEffects on mount, this will be null if it's a fresh load.
    const isSessionActive = sessionStorage.getItem("session_active");

    if (!isSessionActive) {
      // Reopening the browser tab to this route — redirect to home.
      router.push("/");
    }
  }, [router]);
}
