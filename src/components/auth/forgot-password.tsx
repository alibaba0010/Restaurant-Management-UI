"use client";

import { useActionState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { showErrorToast } from "../../lib/api-toast";
import Link from "next/link";
import { forgotPassword, ForgotPasswordState } from "../../lib/actions";
import { toast } from "../../hooks/use-toast";
import { TurnstileWrapper } from "./turnstile";
import { useState } from "react";

const initialState: ForgotPasswordState = {
  message: "",
  success: false,
};

export function ForgotPassword() {
  const [state, formAction, isPending] = useActionState(
    forgotPassword,
    initialState,
  );
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Success",
          description: state.message,
        });
      } else {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
      }
    }
  }, [state]);

  if (state.success) {
    return (
      <div className="space-y-4 pt-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <p className="text-sm text-green-800">{state.message}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            The link will expire in <strong>15 minutes</strong> for security
            reasons.
          </p>
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>

        <div className="pt-4 space-y-2">
          <Link href="/forgot-password">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Another Email
            </Button>
          </Link>

          <Link href="/signin">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          disabled={isPending}
          required
        />
        <p className="text-xs text-muted-foreground">
          We'll send a password reset link to this email
        </p>
      </div>

      <input type="hidden" name="turnstile_token" value={turnstileToken} />
      <TurnstileWrapper onVerify={setTurnstileToken} />

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Send Reset Link
          </>
        )}
      </Button>

      <div className="pt-4 border-t">
        <Link href="/signin">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Remember your password?
        </p>
      </div>
    </form>
  );
}
