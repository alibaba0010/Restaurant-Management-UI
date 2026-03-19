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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  PaymentClientService,
  PaymentProviderType,
} from "@/lib/payment-client";

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ReactNode; description: string }
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

const PAYMENT_PROVIDERS = [
  {
    id: "paystack",
    name: "Paystack",
    description: "Pay with Cards, Bank Transfer, or USSD",
    logo: "/paystack-2.svg",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    description: "Secure payment via Flutterwave checkout",
    logo: "/flutterwave-3.svg",
  },
  {
    id: "monnify",
    name: "Monnify",
    description: "Express payout via Monnify",
    logo: "/Monnify.svg",
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
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProviderType>("paystack");
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await getOrderById(id);
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order", error);
        toast({
          title: "Order Not Found",
          description: "We couldn't find that order.",
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

    try {
      setPayLoading(true);

      // 1. Ensure provider script is loaded
      await PaymentClientService.loadProviderScript(selectedProvider);

      // 2. Initiate payment on backend
      const callback_url = `${window.location.origin}/orders/${order.id}/verify`;
      const payRes = await initiatePayment({
        order_id: order.id,
        provider: selectedProvider,
        callback_url,
      });
      if (!payRes?.data) {
        console.error("Payment initiation failed. Full response:", payRes);
        throw new Error(
          "Could not initialize payment: The server responded successfully but did not provide the required payment details. Please try again or use another payment method.",
        );
      }

      const { authorization_url, access_code, reference } = payRes.data;

      // 3. Process with unified service
      await PaymentClientService.processPayment(selectedProvider, {
        orderId: order.id,
        amount: Number(order.total_amount),
        currency: order.currency || "NGN",
        email: user?.email || order.user_id,
        name: user?.name || "Customer",
        reference: reference || "",
        accessCode: access_code,
        authorizationUrl: authorization_url,
        onSuccess: (ref) => {
          router.push(`${callback_url}?reference=${ref}`);
        },
        onCancel: () => {
          setPayLoading(false);
          toast({
            title: "Payment Cancelled",
            description: "You closed the payment window.",
          });
        },
        onError: (err) => {
          setPayLoading(false);
          toast({
            title: "Payment Error",
            description: err,
            variant: "destructive",
          });
        },
      });
    } catch (error: any) {
      toast({
        title: "Initialization Error",
        description: error.message || "Failed to start payment.",
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
    ORDER_STATUS_CONFIG[order.status] ??
    ORDER_STATUS_CONFIG[OrderStatus.PENDING];
  const paymentCfg =
    PAYMENT_STATUS_CONFIG[order.payment_status] ??
    PAYMENT_STATUS_CONFIG[PaymentStatus.PENDING];
  const isPaid =
    order.payment_status === PaymentStatus.SUCCESS ||
    order.payment_status === PaymentStatus.PAID;
  const isPendingPayment = !isPaid && order.status !== OrderStatus.CANCELLED;
  const totalAmount = Number(order.total_amount);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <BackButton label="Back to Orders" href="/orders" />

        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              #{order.id}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={`${statusCfg.color} border flex items-center gap-1.5 px-3 py-1`}
            >
              {statusCfg.icon} {statusCfg.label}
            </Badge>
            <Badge
              className={`${paymentCfg.color} flex items-center gap-1.5 px-3 py-1`}
            >
              <CreditCard className="h-3.5 w-3.5" /> {paymentCfg.label}
            </Badge>
          </div>
        </div>

        {isPaid ? (
          <Card className="mb-6 bg-emerald-50 border-emerald-200 shadow-sm overflow-hidden">
            <CardContent className="py-6 flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-inner shrink-0">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-emerald-900">
                  Payment Confirmed!
                </h3>
                <p className="text-emerald-700 mt-1 max-w-md">
                  We've received your payment of {order.currency || "NGN"}{" "}
                  {totalAmount.toFixed(2)}. Your order is now being processed by
                  the restaurant.
                </p>
              </div>
            </CardContent>
            <div className="bg-emerald-100/50 px-6 py-2 border-t border-emerald-200">
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Estimated delivery time: 30 - 45
                mins
              </p>
            </div>
          </Card>
        ) : (
          <Card className="mb-4 border-l-4 border-l-primary shadow-sm bg-white">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-slate-700">{statusCfg.description}</p>
            </CardContent>
          </Card>
        )}

        {isPendingPayment && (
          <Card className="mb-6 bg-white shadow-md border-primary/20 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" /> Complete Your Payment
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method to proceed.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <RadioGroup
                value={selectedProvider}
                onValueChange={(val) =>
                  setSelectedProvider(val as PaymentProviderType)
                }
                className="grid gap-4"
              >
                {PAYMENT_PROVIDERS.map((provider) => {
                  const isSelected = selectedProvider === provider.id;
                  return (
                    <div key={provider.id}>
                      <RadioGroupItem
                        value={provider.id}
                        id={provider.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={provider.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/[0.03] shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg p-2 flex items-center justify-center overflow-hidden transition-colors ${
                              isSelected
                                ? "bg-white shadow-inner"
                                : "bg-slate-100"
                            }`}
                          >
                            <img
                              src={provider.logo}
                              alt={provider.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div>
                            <p
                              className={`font-bold leading-none transition-colors ${
                                isSelected
                                  ? "text-primary text-base"
                                  : "text-slate-900"
                              }`}
                            >
                              {provider.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {provider.description}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? "border-primary bg-primary scale-110"
                              : "border-slate-300 bg-transparent"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" />
                          )}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              <div className="mt-8">
                <Button
                  onClick={handlePayNow}
                  disabled={payLoading}
                  className="w-full py-6 text-lg font-bold shadow-lg"
                >
                  {payLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" /> Pay{" "}
                      {order.currency || "NGN"} {totalAmount.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          <Card className="shadow-sm border-none overflow-hidden">
            <CardHeader className="pb-3 bg-white">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" /> Order Items
              </CardTitle>
              <CardDescription>
                {order.order_type.replace("_", " ")} &middot;{" "}
                {format(new Date(order.created_at), "PPP")}
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        Qty: {item.quantity} &middot; {order.currency || "NGN"}{" "}
                        {Number(item.price).toFixed(2)} each
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {order.currency || "NGN"}{" "}
                      {(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>
                    {order.currency || "NGN"}{" "}
                    {Number(order.subtotal).toFixed(2)}
                  </span>
                </div>
                {Number(order.service_charge) > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      Service Charge ({order.service_charge_percent}%)
                    </span>
                    <span>
                      {order.currency || "NGN"}{" "}
                      {Number(order.service_charge).toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-extrabold text-slate-900 text-lg">
                  <span>Grand Total</span>
                  <span className="text-primary">
                    {order.currency || "NGN"} {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm border-none bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {order.delivery_address || "No address provided"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Static Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Contact support at: support@foodie.com
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Order cancellation window: 5 mins
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
