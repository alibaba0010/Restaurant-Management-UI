"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Loader2, Mail, Clock, ArrowLeft } from "lucide-react";
import { withToast, showErrorToast } from "../../lib/api-toast";
import Link from "next/link";

interface ResendVerificationProps {
  initialEmail?: string;
}

export function ResendVerification({
  initialEmail = "",
}: ResendVerificationProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    // Check localStorage for last resend time
    const lastResendTime = localStorage.getItem("lastResendTime");
    if (lastResendTime) {
      const elapsed = Math.floor(
        (Date.now() - parseInt(lastResendTime)) / 1000
      );
      const remaining = 60 - elapsed;
      if (remaining > 0) {
        setCountdown(remaining);
        setCanResend(false);
      }
    }

    // Load email from localStorage if not provided
    if (!initialEmail) {
      const storedEmail = localStorage.getItem("pendingVerificationEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [initialEmail]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResend = async () => {
    if (!email) {
      showErrorToast(
        new Error("Email is required"),
        "Please enter your email address"
      );
      return;
    }

    try {
      setLoading(true);

      await withToast(
        async () => {
          const res = await fetch("/api/v1/auth/resend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include",
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(
              error.message || "Failed to resend verification email"
            );
          }

          return res.json();
        },
        {
          successMessage: "Verification email sent! Please check your inbox.",
        }
      );

      // Set countdown and store timestamp
      setCountdown(60);
      setCanResend(false);
      localStorage.setItem("lastResendTime", Date.now().toString());
      localStorage.setItem("pendingVerificationEmail", email);
    } catch (error) {
      // Error toast already shown by withToast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/10 shadow-lg">
      <CardHeader className="bg-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Resend Verification Email
        </CardTitle>
        <CardDescription>
          Didn't receive the verification email? We can send it again.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Email Display (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {email || "No email found"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            This is the email address you used to sign up
          </p>
        </div>

        <Button
          onClick={handleResend}
          disabled={!canResend || loading || !email}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : !canResend ? (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Resend in {countdown}s
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Resend Verification Email
            </>
          )}
        </Button>

        {!canResend && (
          <p className="text-sm text-muted-foreground text-center">
            You can request another email in {countdown} seconds
          </p>
        )}

        {/* Go Back to Signup */}
        <div className="pt-4 border-t">
          <Link href="/signup">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back to Sign Up
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Want to use a different email address?
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
