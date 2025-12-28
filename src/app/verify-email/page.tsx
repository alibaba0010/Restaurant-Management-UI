"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/layout/header";
import Footer from "../../components/layout/footer";
import { ResendVerification } from "../../components/auth/resend-verification";
import { useTemporaryRoute } from "../../hooks/use-temporary-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  // Redirect to home if the session was closed and reopened
  useTemporaryRoute();

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem("pendingVerificationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email in localStorage, redirect to signup
      router.push("/signup");
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Success Message */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-6 w-6" />
                Check Your Email
              </CardTitle>
              <CardDescription className="text-base">
                We've sent a verification link to{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Please check your inbox and click the verification link to
                  activate your account.
                </p>
                <p className="text-sm text-muted-foreground">
                  The link will expire in{" "}
                  <span className="font-semibold">15 minutes</span>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resend Verification */}
          <ResendVerification initialEmail={email} />

          {/* Help Section */}
          <Card className="border-accent/10">
            <CardHeader>
              <CardTitle className="text-lg">
                Didn't receive the email?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes - emails can sometimes be delayed</li>
                <li>
                  Use the resend button above to request a new verification
                  email
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
