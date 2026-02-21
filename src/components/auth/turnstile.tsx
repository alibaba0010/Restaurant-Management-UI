"use client";

import React, { useCallback } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

interface TurnstileWrapperProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: any) => void;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "ooooooo";

console.log("SITE KEY............ ", SITE_KEY);
/**
 * A production-ready wrapper for Cloudflare Turnstile.
 * Automatically handles development vs production behavior.
 */
export function TurnstileWrapper({
  onVerify,
  onExpire,
  onError,
}: TurnstileWrapperProps) {
  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify],
  );

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  if (!SITE_KEY) {
    console.warn(
      "[Security] Turnstile Site Key missing. Security challenge disabled.",
    );
    return null;
  }

  return (
    <div className="flex justify-center my-4 overflow-hidden rounded-md">
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={handleVerify}
        onExpire={handleExpire}
        onError={onError}
        options={{
          theme: "light",
          size: "normal",
        }}
      />
    </div>
  );
}
