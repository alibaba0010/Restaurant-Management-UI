"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getOrderById, initiatePayment } from "@/lib/api";
import { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/ui/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  MapPin,
  Package,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
  ChefHat,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/store";

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  [OrderStatus.PENDING]: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    icon: <Clock className="h-4 w-4" />,
    description: "Waiting for the restaurant to confirm your order.",
  },
  [OrderStatus.CONFIRMED]: {
    label: "Confirmed",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: "Restaurant has confirmed your order.",
  },
  [OrderStatus.PREPARING]: {
    label: "Preparing",
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
    icon: <ChefHat className="h-4 w-4" />,
    description: "Your food is being prepared.",
  },
  [OrderStatus.READY]: {
    label: "Ready",
    color: "bg-teal-500/10 text-teal-600 border-teal-200",
    icon: <Package className="h-4 w-4" />,
    description: "Your order is ready for pickup/delivery.",
  },
  [OrderStatus.COMPLETED]: {
    label: "Completed",
    color: "bg-green-500/10 text-green-600 border-green-200",
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: "Order delivered. Enjoy your meal!",
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-600 border-red-200",
    icon: <XCircle className="h-4 w-4" />,
    description: "This order was cancelled.",
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  [PaymentStatus.PENDING]: {
    label: "Payment Pending",
    color: "bg-yellow-500/10 text-yellow-600",
  },
  [PaymentStatus.PROCESSING]: {
    label: "Processing",
    color: "bg-blue-500/10 text-blue-600",
  },
  [PaymentStatus.SUCCESS]: {
    label: "Paid",
    color: "bg-green-500/10 text-green-600",
  },
  [PaymentStatus.PAID]: {
    label: "Paid",
    color: "bg-green-500/10 text-green-600",
  },
  [PaymentStatus.FAILED]: {
    label: "Payment Failed",
    color: "bg-red-500/10 text-red-600",
  },
  [PaymentStatus.CANCELLED]: {
    label: "Payment Cancelled",
    color: "bg-gray-500/10 text-gray-600",
  },
  [PaymentStatus.REFUNDED]: {
    label: "Refunded",
    color: "bg-purple-500/10 text-purple-600",
  },
  [PaymentStatus.REFUNDING]: {
    label: "Refunding",
    color: "bg-purple-500/10 text-purple-600",
  },
  [PaymentStatus.PARTIALLY_REFUNDED]: {
    label: "Partially Refunded",
    color: "bg-purple-500/10 text-purple-600",
  },
};

import { useExternalScript } from "@/hooks/use-external-script";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const PAYMENT_PROVIDERS = [
  {
    id: "paystack",
    name: "Paystack",
    description: "Pay with Cards, Bank Transfer, or USSD",
    logo: "https://paystack.com/assets/img/login/paystack-logo.png",
    script: "https://js.paystack.co/v1/inline.js",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    description: "Secure payment via Flutterwave checkout",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/00/Flutterwave_Logo.png",
    script: "https://checkout.flutterwave.com/v3.js",
  },
  {
    id: "monnify",
    name: "Monnify",
    description: "Express payout via Monnify",
    logo: "https://raw.githubusercontent.com/team-monnify/monnify-sdk-web/master/monnify-logo.png",
    script: "https://sdk.monnify.com/v1/sdk.js",
  },
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("paystack");
  const { user } = useAuthStore();

  // Load scripts for all providers and track status
  const paystackStatus = useExternalScript("https://js.paystack.co/v1/inline.js");
  const flutterwaveStatus = useExternalScript("https://checkout.flutterwave.com/v3.js");
  const monnifyStatus = useExternalScript("https://sdk.monnify.com/v1/sdk.js");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await getOrderById(id);
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order", error);
        toast({
          title: "Order Not Found",
          description: "We couldn't find that order. It may have been removed.",
          variant: "destructive",
        });
        router.push("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, router, toast]);

  const handlePayNow = async () => {
    if (!order) return;

    // Check if the selected provider's script is loaded if we intend to use inline flow
    if (selectedProvider === "paystack" && paystackStatus !== "ready") {
      toast({ title: "Please wait", description: "Paystack SDK is still loading..." });
      return;
    }
    if (selectedProvider === "monnify" && monnifyStatus !== "ready") {
      toast({ title: "Please wait", description: "Monnify SDK is still loading..." });
      return;
    }

    try {
      setPayLoading(true);
      const callback_url = `${window.location.origin}/orders/${order.id}/verify`;
      const payRes = await initiatePayment({
        order_id: order.id,
        provider: selectedProvider,
        callback_url: callback_url,
      });

      const { authorization_url, access_code, reference } = payRes.data || {};

      if (selectedProvider === "paystack" && access_code && (window as any).PaystackPop) {
        // Paystack Inline Flow
        const handler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder", 
          access_code: access_code,
          onClose: () => {
            setPayLoading(false);
            toast({ title: "Payment Cancelled", description: "You closed the payment window." });
          },
          callback: (response: any) => {
            router.push(`${callback_url}?reference=${response.reference || reference}`);
          },
        });
        handler.openIframe();
        return;
      }

      if (selectedProvider === "monnify" && (window as any).MonnifySDK) {
        // Monnify Inline Flow
        (window as any).MonnifySDK.initialize({
          amount: totalAmount,
          currency: order.currency || "NGN",
          reference: reference || payRes.data.reference,
          customerName: user?.name || "Customer", 
          customerEmail: user?.email || order.user_id,
          apiKey: process.env.NEXT_PUBLIC_MONNIFY_API_KEY || "MK_TEST_4N216GYVM8", 
          contractCode: process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE || "5079600496",
          paymentDescription: `Order #${order.id.slice(0, 8)}`,
          isTestMode: true,
          onComplete: (response: any) => {
            router.push(`${callback_url}?reference=${reference || payRes.data.reference}`);
          },
          onClose: (data: any) => {
            setPayLoading(false);
          },
        });
        return;
      }

      if (selectedProvider === "flutterwave" && (window as any).FlutterwaveCheckout && authorization_url) {
        // Flutterwave often works best via the redirect link if not fully configured on FE
        window.location.href = authorization_url;
        return;
      }

      // Attempt Redirect flow if available (Best for Flutterwave and as a fallback for all)
      if (authorization_url) {
        window.location.href = authorization_url;
      } else {
        throw new Error("No authorization URL returned from server for " + selectedProvider);
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) return null;

  const statusCfg =
    ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG[OrderStatus.PENDING];
  const paymentCfg =
    PAYMENT_STATUS_CONFIG[order.payment_status] ??
    PAYMENT_STATUS_CONFIG[PaymentStatus.PENDING];

  const isPendingPayment =
    order.payment_status === PaymentStatus.PENDING ||
    order.payment_status === PaymentStatus.FAILED;

  const subtotal = Number(order.subtotal);
  const serviceCharge = Number(order.service_charge);
  const totalAmount = Number(order.total_amount);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <BackButton label="Back to Orders" href="/orders" />

        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Order Details
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              #{order.id}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={`${statusCfg.color} border flex items-center gap-1.5 px-3 py-1`}
            >
              {statusCfg.icon}
              {statusCfg.label}
            </Badge>
            <Badge className={`${paymentCfg.color} flex items-center gap-1.5 px-3 py-1`}>
              <CreditCard className="h-3.5 w-3.5" />
              {paymentCfg.label}
            </Badge>
          </div>
        </div>

        {/* Status Banner */}
        <Card className="mb-4 border-l-4 border-l-primary shadow-sm">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-slate-700">{statusCfg.description}</p>
          </CardContent>
        </Card>

        {/* Payment Provider Selection & CTA */}
        {isPendingPayment && order.status !== OrderStatus.CANCELLED && (
          <Card className="mb-6 bg-white shadow-md border-primary/20 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                Complete Your Payment
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method to proceed with your order.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <RadioGroup
                value={selectedProvider}
                onValueChange={setSelectedProvider}
                className="grid gap-4"
              >
                {PAYMENT_PROVIDERS.map((provider) => (
                  <div key={provider.id}>
                    <RadioGroupItem
                      value={provider.id}
                      id={provider.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={provider.id}
                      className="flex items-center justify-between p-4 bg-white border-2 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg p-2 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={provider.logo}
                            alt={provider.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 leading-none">
                            {provider.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {provider.description}
                          </p>
                        </div>
                      </div>
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary flex items-center justify-center transition-all">
                        {selectedProvider === provider.id && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="mt-8">
                <Button
                  onClick={handlePayNow}
                  disabled={payLoading}
                  className="w-full py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {payLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Initializing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay {order.currency || "NGN"} {totalAmount.toFixed(2)} with {PAYMENT_PROVIDERS.find(p => p.id === selectedProvider)?.name}
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                  <Package className="h-3 w-3" />
                  Your transaction is secured and encrypted.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {/* Order Items */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Order Items
              </CardTitle>
              <CardDescription>
                {order.order_type.replace("_", " ")} order &middot; placed{" "}
                {format(new Date(order.created_at), "PPP 'at' p")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/10 text-primary text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                          {item.quantity}
                        </span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {order.currency || "NGN"}{" "}
                        {(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No item details available.
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Pricing Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>
                    {order.currency || "NGN"} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    Service Charge
                    {order.service_charge_percent
                      ? ` (${order.service_charge_percent})`
                      : ""}
                  </span>
                  <span>
                    {order.currency || "NGN"} {serviceCharge.toFixed(2)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-slate-900 text-base">
                  <span>Total</span>
                  <span>
                    {order.currency?.toUpperCase() ?? "NGN"}{" "}
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{order.delivery_address}</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
