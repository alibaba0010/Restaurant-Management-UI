"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, use } from "next/navigation";
import { verifyPayment } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function OrderVerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [message, setMessage] = useState("We are verifying your payment...");
  const reference = searchParams.get("reference");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("Missing payment reference.");
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyPayment(reference);
        if (res.data?.success || res.status === "success") {
          setStatus("success");
          setMessage("Payment successful! Your order is being prepared.");
          // Redirect after 3 seconds
          setTimeout(() => {
            router.push(`/orders/${id}`);
          }, 3000);
        } else {
          setStatus("error");
          setMessage(res.message || "Payment verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred while verifying your payment.");
      }
    };

    verify();
  }, [reference, id, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full shadow-lg border-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">
              Payment Verification
            </CardTitle>
            <CardDescription>Order ID: {id.split("-")[0]}...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8 gap-6">
            {status === "verifying" && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-center">
                  Communicating with payment provider...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    Payment Confirmed
                  </h3>
                  <p className="text-slate-600">{message}</p>
                </div>
                <Button
                  onClick={() => router.push(`/orders/${id}`)}
                  className="w-full"
                >
                  Go to Order Details
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-rose-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    Verification Failed
                  </h3>
                  <p className="text-rose-600 font-medium">{message}</p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    onClick={() => router.push(`/orders/${id}`)}
                    variant="outline"
                  >
                    View Order
                  </Button>
                  <Button onClick={() => router.push("/")} variant="ghost">
                    Back to Home
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
