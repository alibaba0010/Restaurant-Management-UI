"use client";

import { Suspense } from "react";
import { ResetPassword } from "@/components/auth/reset-password";
import { Loader2, Utensils } from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { BackButton } from "@/components/ui/back-button";
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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md mx-4">
          <BackButton label="Back to Sign In" href="/signin" />
          <Card className="shadow-xl border-accent/10">
            <CardHeader className="text-center">
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
      </main>
      <Footer />
    </div>
  );
}
