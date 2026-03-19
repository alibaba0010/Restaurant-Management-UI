"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getOrders } from "@/lib/api";
import { Order, OrderStatus } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await getOrders();
        if (data && Array.isArray((data as any).orders)) {
          setOrders((data as any).orders);
        } else if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusDisplay = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { color: "bg-amber-100 text-amber-800 border-amber-200", label: "Pending" };
      case OrderStatus.CONFIRMED:
        return { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Confirmed" };
      case OrderStatus.PREPARING:
        return { color: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "Preparing" };
      case OrderStatus.READY:
        return { color: "bg-teal-100 text-teal-800 border-teal-200", label: "Ready" };
      case OrderStatus.COMPLETED:
        return { color: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Completed" };
      case OrderStatus.CANCELLED:
        return { color: "bg-rose-100 text-rose-800 border-rose-200", label: "Cancelled" };
      default:
        return { color: "bg-slate-100 text-slate-800 border-slate-200", label: status };
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const status = paymentStatus?.toLowerCase();
    if (status === "success" || status === "paid") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (status === "failed" || status === "cancelled") {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-200/60 gap-4">
          <div>
            <div className="mb-2">
              <BackButton label="Dashboard" href="/dashboard" />
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-slate-900 tracking-tight">
              Order History
            </h1>
            <p className="text-slate-500 mt-1">Review and track your recent orders.</p>
          </div>
          <Button asChild className="shrink-0 shadow-sm rounded-full px-6">
            <Link href="/menus">Order Again</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-slate-500 font-medium animate-pulse">Loading your orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusDisplay(order.status);
              return (
                <div 
                  key={order.id} 
                  className="group bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Order Info Left */}
                  <div className="flex items-start gap-4 sm:gap-6 flex-1">
                    <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <Link 
                          href={`/orders/${order.id}`}
                          className="font-bold text-lg text-slate-900 hover:text-primary transition-colors"
                        >
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <Badge variant="outline" className={`font-medium border px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        {format(new Date(order.created_at), "MMMM do, yyyy • h:mm a")}
                      </p>
                      
                      <div className="pt-1 flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs px-2 py-0 rounded-md border ${getPaymentBadge(order.payment_status)}`}>
                          Payment: {order.payment_status.toUpperCase()}
                        </Badge>
                        {order.order_type && (
                          <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                            {order.order_type.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Info Right (Pricing & Action) */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Total Amount</p>
                      <div className="font-extrabold text-xl md:text-2xl text-slate-900">
                        <span className="text-sm text-slate-500 mr-1 font-semibold">{order.currency || "NGN"}</span>
                        {Number(order.total_amount).toFixed(2)}
                      </div>
                    </div>
                    
                    <Button 
                      asChild 
                      variant="default" 
                      className="rounded-full shadow-sm hover:shadow group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    >
                      <Link href={`/orders/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
            <div className="bg-primary/10 p-5 rounded-full mb-6">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Past Orders</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              It looks like you haven't placed any orders yet. Explore our delicious menu to get started!
            </p>
            <Button asChild size="lg" className="rounded-full px-8 shadow-md">
              <Link href="/menus">View Menu</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
