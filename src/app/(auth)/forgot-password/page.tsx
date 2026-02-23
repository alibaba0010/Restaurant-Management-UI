"use client";

import { ForgotPassword } from "@/components/auth/forgot-password";
import { useTemporaryRoute } from "@/hooks/use-temporary-route";
import { Utensils } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  useTemporaryRoute();

  return (
    <div className="w-full max-w-md mx-4">
      <BackButton label="Back to Sign In" href="/signin" />
      <Card className="shadow-xl border-accent/10">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl text-accent">
            Password Recovery
          </CardTitle>
          <CardDescription>
            We'll help you get back into your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPassword />
        </CardContent>
      </Card>
    </div>
  );
}
