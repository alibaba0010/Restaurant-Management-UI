"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { verifyUser } from "../../lib/api";
import { useAuthStore } from "../../lib/store";

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const setUser = useAuthStore((state) => state.setUser);
  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const processVerification = async () => {
      try {
        const response = await verifyUser(token);

        // Check if response has data and access_token
        if (response && response.data) {
          const { access_token, refresh_token, ...user } = response.data;

          // Store access token
          if (access_token) {
            localStorage.setItem("accessToken", access_token);
          }

          // Update Auth Store
          setUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          });
        }

        setStatus("success");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (err) {
        console.error("Verification failed", err);
        setStatus("error");
      }
    };
    processVerification();
  }, [token, router, setUser]);

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-headline text-accent">
          Account Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center space-y-6 pt-6">
        {status === "verifying" && (
          <>
            <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Verifying your account, please wait...
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CircleCheck className="h-16 w-16 text-green-500" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                Account Verified!
              </p>
              <p className="text-muted-foreground">
                Your account has been successfully verified. Redirecting...
              </p>
            </div>
            <Link href="/" className="text-primary hover:underline pt-4">
              Proceed to Home
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <CircleX className="h-16 w-16 text-destructive" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-destructive">
                Verification Failed
              </p>
              <p className="text-muted-foreground">
                The link may be invalid or expired.
              </p>
            </div>
            <Link href="/signup" className="text-primary hover:underline pt-4">
              Return to Sign Up
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
