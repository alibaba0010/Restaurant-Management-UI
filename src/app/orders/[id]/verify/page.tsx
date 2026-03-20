"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPayment } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
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
  const [finalOrderId, setFinalOrderId] = useState<string>(id);
  const [message, setMessage] = useState("We are verifying your payment...");
  const { clearCart } = useCartStore();
  const reference = searchParams.get("reference") || searchParams.get("tx_ref");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("Missing payment reference.");
      return;
    }

    let isMounted = true;
    let attempts = 0;
    let timeoutId: NodeJS.Timeout;
    const maxAttempts = 30; // 60 seconds wait time for slower APIs like Monnify Sandbox
    let verifiedOrderId = id;

    const verify = async () => {
      if (!isMounted) return;
      try {
        const res = await verifyPayment(reference);
        const isSuccess = res.data?.status === "success" || res.data?.status === "paid";
        const isPending = res.data?.status === "pending" || res.data?.status === "processing";
        
        if (res.data?.order_id) {
          verifiedOrderId = res.data.order_id;
          // Dynamically store the actual order ID in state if it differs from the URL param
          setFinalOrderId(res.data.order_id);
        }

        if (isSuccess) {
          setStatus("success");
          setMessage("Payment successful! Your order is being prepared.");
          clearCart();
          setTimeout(() => {
            if (isMounted) router.push(`/orders/${res.data.order_id || id}`);
          }, 3000);
        } else if (isPending && attempts < maxAttempts) {
          attempts++;
          timeoutId = setTimeout(verify, 2000); // Retry after 2 seconds
        } else {
          setStatus("error");
          setMessage(res.message || (isPending ? "Verification timed out. Check your order status later." : "Payment verification failed."));
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred while verifying your payment.");
      }
    };

    let finalOrderId = id;
    const runVerification = async () => {
      await verify();
    };

    runVerification();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
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
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8 gap-6">
            {status === "verifying" && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-center">
                  Checking Payment Status...
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
                  onClick={() => router.push(`/orders/${finalOrderId}`)}
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
                    onClick={() => router.push(`/orders/${finalOrderId}`)}
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
