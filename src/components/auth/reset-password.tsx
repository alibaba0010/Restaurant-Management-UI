"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { resetPassword, ResetPasswordState } from "../../lib/actions";
import { toast } from "../../hooks/use-toast";

const initialState: ResetPasswordState = {
  message: "",
  success: false,
};

export function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, formAction, isPending] = useActionState(
    resetPassword,
    initialState
  );

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasUpper: false,
    hasLower: false,
    hasDigit: false,
    hasSpecial: false,
    hasMinLength: false,
  });

  useEffect(() => {
    // Check password strength for UI indicators
    setPasswordStrength({
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasDigit: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      hasMinLength: password.length >= 8,
    });
  }, [password]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Success",
          description: state.message,
        });

        // Redirect to signin after 2 seconds
        const timer = setTimeout(() => {
          router.push("/signin");
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
      }
    }
  }, [state, router]);

  if (!token) {
    return (
      <div className="space-y-4 pt-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-700 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              Invalid Reset Link
            </p>
            <p className="text-sm text-red-600">
              This password reset link is invalid or has expired.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Password reset links expire after 15 minutes for security reasons.
          Please request a new one.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full">Request New Reset Link</Button>
        </Link>
      </div>
    );
  }

  const PasswordRequirement = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-300" />
      )}
      <span
        className={`text-xs ${
          met ? "text-green-700" : "text-muted-foreground"
        }`}
      >
        {text}
      </span>
    </div>
  );

  return (
    <form action={formAction} className="space-y-4 pt-4">
      {/* Hidden input for token */}
      <input type="hidden" name="token" value={token} />

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Password Requirements */}
      {password && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Password must contain:
          </p>
          <PasswordRequirement
            met={passwordStrength.hasMinLength}
            text="At least 8 characters"
          />
          <PasswordRequirement
            met={passwordStrength.hasUpper}
            text="One uppercase letter"
          />
          <PasswordRequirement
            met={passwordStrength.hasLower}
            text="One lowercase letter"
          />
          <PasswordRequirement
            met={passwordStrength.hasDigit}
            text="One number"
          />
          <PasswordRequirement
            met={passwordStrength.hasSpecial}
            text="One special character"
          />
        </div>
      )}

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            disabled={isPending}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting Password...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Reset Password
          </>
        )}
      </Button>

      <div className="pt-4 border-t">
        <Link href="/signin">
          <Button variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </Link>
      </div>
    </form>
  );
}
