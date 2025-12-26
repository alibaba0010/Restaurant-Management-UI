import { SigninForm } from '../../../components/forms/signin-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Utensils } from 'lucide-react';
import Link from 'next/link';

export default function SigninPage() {
  return (
    <Card className="w-full max-w-md mx-4 shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
            <Link href="/" className="flex items-center space-x-2">
                <Utensils className="h-8 w-8 text-primary" />
                <span className="font-headline text-3xl font-bold text-accent">GourmetHub</span>
            </Link>
        </div>
        <CardTitle className="font-headline text-2xl text-accent">Welcome Back</CardTitle>
        <CardDescription>Sign in to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <SigninForm />
      </CardContent>
    </Card>
  );
}
