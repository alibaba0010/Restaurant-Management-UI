import { SignupForm } from "../../../components/forms/signup-form";
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

export default function SignupPage() {
  return (
    <div className="w-full max-w-md mx-4">
      <BackButton label="Back to Home" href="/" />
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl text-accent">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join our community of food lovers today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
