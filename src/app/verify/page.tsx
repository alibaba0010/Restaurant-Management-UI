import { Suspense } from 'react';
import VerifyClient from './verify-client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LoaderCircle } from 'lucide-react';

export default function VerifyPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-headline">Account Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }>
        <VerifyClient />
      </Suspense>
    </div>
  );
}
