"use client";

import { ForgotPassword } from "@/components/auth/forgot-password";
import { useTemporaryRoute } from "@/hooks/use-temporary-route";
import { Utensils } from "lucide-react";
import Link from "next/link";
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
