"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Determine provider from previous context or generic assumption (simplified)
    // In many setups, the callback URL indicates provider.
    // For this generic callback, let's assume 'google' if generic, or better, we could have
    // separate pages /auth/google/callback if providers differ significantly.
    // Given the previous setup: backend returns redirect_uri ending in /auth/callback.
    // Let's assume we can try verifying against 'google' for now or inspect a cookie if we set one for "pending_provider".
    // Alternatively, the prompt implies "google" in example url. Let's try to verify with "google" first or "facebook".
    // A robust way: Set a "pre_auth_provider" cookie in frontend before redirect.
    // For simplicity here, I will verify against 'google' if not specified,
    // BUT the backend handler takes {provider}, so we need to match it.

    // HACK: Try Google first (most common).
    // Better User Experience: Backend redirect should probably be /auth/{provider}/callback.
    // BUT config.go set GOOGLE_REDIRECT_URI to .../auth/callback.
    // We can just verify against "google" since we only really implemented google backend exchange fully.

    const verifyLogin = async () => {
      if (!code || !state) {
        router.push("/signin?error=Missing+parameters");
        return;
      }

      try {
        // Try google verified
        const res = await fetch(`${API_BASE_URL}/auth/google/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          // Assuming data.data holds the user & token info similar to signin
          if (data.data) {
            setUser(data.data);
            router.push("/dashboard");
          } else {
            throw new Error("Invalid response format");
          }
        } else {
          // If google fails (maybe it was facebook?), handle error.
          // For now, redirect to error.
          const errData = await res.json().catch(() => ({}));
          router.push(
            `/signin?error=${encodeURIComponent(
              errData.message || "Verification failed"
            )}`
          );
        }
      } catch (error) {
        console.error("Verification error", error);
        router.push("/signin?error=Verification+error");
      }
    };

    verifyLogin();
  }, [router, searchParams, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying login...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
