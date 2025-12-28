"use client";

import { Suspense } from "react";
import { ResetPassword } from "@/components/auth/reset-password";
import { Loader2, Utensils } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ResetPasswordContent() {
  return <ResetPassword />;
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5db] p-4 w-full">
      <Card className="w-full max-w-md mx-4 shadow-xl border-accent/10">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Link href="/" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-primary" />
              <span className="font-headline text-3xl font-bold text-accent">
                GourmetHub
              </span>
            </Link>
          </div>
          <CardTitle className="font-headline text-2xl text-accent">
            Create New Password
          </CardTitle>
          <CardDescription>
            Choose a strong password to secure your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }
          >
            <ResetPasswordContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
