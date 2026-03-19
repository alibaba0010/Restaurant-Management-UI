"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTurnstileStore } from "@/lib/store";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * A custom hook to manage Cloudflare Turnstile state and token.
 * Handles invisible challenges, token expiration, and global store synchronization.
 */
export function useTurnstile() {
  const globalToken = useTurnstileStore((state) => state.token);
  const setGlobalToken = useTurnstileStore((state) => state.setToken);
  const clearGlobalToken = useTurnstileStore((state) => state.clearToken);

  const [token, setToken] = useState<string | undefined>(globalToken ?? undefined);
  const [isReady, setIsReady] = useState<boolean>(!SITE_KEY || !!globalToken);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const tokenRef = useRef<string | undefined>(token);

  // Sync ref with state
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const handleVerify = useCallback(
    (newToken: string) => {
      setToken(newToken);
      setGlobalToken(newToken);
      setIsReady(true);
    },
    [setGlobalToken]
  );

  const handleExpire = useCallback(() => {
    setToken(undefined);
    clearGlobalToken();
    setIsReady(false);
    // Automatically reset to get a fresh token
    turnstileRef.current?.reset();
  }, [clearGlobalToken]);

  const reset = useCallback(() => {
    setToken(undefined);
    setIsReady(false);
    turnstileRef.current?.reset();
  }, []);

  const consume = useCallback(() => {
    setToken(undefined);
    clearGlobalToken();
    setIsReady(false);
    turnstileRef.current?.reset();
  }, [clearGlobalToken]);

  const [turnstileError, setTurnstileError] = useState<boolean>(false);

  const handleError = useCallback(() => {
    setTurnstileError(true);
    setIsReady(false);
  }, []);

  return {
    token,
    tokenRef,
    isReady,
    turnstileError,
    turnstileRef,
    siteKey: SITE_KEY,
    handleVerify,
    handleExpire,
    handleError,
    reset,
    consume,
  };
}
