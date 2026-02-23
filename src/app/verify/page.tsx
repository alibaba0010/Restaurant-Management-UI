import { Suspense } from "react";
import VerifyClient from "./verify-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { LoaderCircle } from "lucide-react";
import Header from "../../components/layout/header";
import Footer from "../../components/layout/footer";
import { BackButton } from "../../components/ui/back-button";

export default function VerifyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <BackButton label="Back to Sign In" href="/signin" />
          <Suspense
            fallback={
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-center text-2xl font-headline">
                    Account Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                  <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading...</p>
                </CardContent>
              </Card>
            }
          >
            <VerifyClient />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
