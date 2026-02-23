import { SigninForm } from "../../../components/forms/signin-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Utensils } from "lucide-react";
import Link from "next/link";
import { BackButton } from "../../../components/ui/back-button";

export default function SigninPage() {
  return (
    <div className="w-full max-w-md mx-4">
      <BackButton label="Back to Home" href="/" />
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl text-accent">
            Welcome Back
          </CardTitle>
          <CardDescription>Sign in to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <SigninForm />
        </CardContent>
      </Card>
    </div>
  );
}
