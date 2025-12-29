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
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
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
          const user = response.data;

          // Store Access Token in Zustand
          if (response.data.access_token) {
            setAccessToken(response.data.access_token);
          }

          // Update Auth Store with complete user data
          setUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            created_at: user.created_at,
            updated_at: user.updated_at,
            address: user.address,
            avatar_url: user.avatar_url,
            phone_number: user.phone_number,
          });
        }

        setStatus("success");

        // Clear verification email data from localStorage
        localStorage.removeItem("pendingVerificationEmail");
        localStorage.removeItem("lastResendTime");

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
