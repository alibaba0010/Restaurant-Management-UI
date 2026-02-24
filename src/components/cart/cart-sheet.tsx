"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/store";
import { createOrder, initiatePayment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CartSheet() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    items,
    removeItem,
    updateQuantity,
    totalPrice,
    clearCart,
    restaurantId,
  } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState(user?.address || "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [postCode, setPostCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = totalPrice();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setIsOpen(false);
      router.push("/signin");
      return;
    }

    const finalAddress =
      user?.address || `${street}, ${city}, ${country} ${postCode}`.trim();

    if (!finalAddress || finalAddress.replace(/,/g, "").trim().length < 5) {
      toast({
        title: "Address Required",
        description: "Please provide a complete delivery address.",
        variant: "destructive",
      });
      return;
    }

    if (!restaurantId) return;

    try {
      setIsSubmitting(true);
      const orderData = {
        restaurant_id: restaurantId,
        delivery_address: finalAddress,
        items: items.map((item) => ({
          menu_id: item.id,
          quantity: item.quantity,
        })),
      };

      const res = await createOrder(orderData);
      const order = res.data;

      toast({
        title: "Order Placed",
        description: "Redirecting to secure payment...",
      });

      // Initiate Payment
      const payRes = await initiatePayment({
        order_id: order.id,
        provider: "paystack", // Defaulting to paystack for now
        callback_url: `${window.location.origin}/orders/${order.id}/verify`,
      });

      clearCart();
      setIsOpen(false);

      if (payRes.data?.authorization_url) {
        window.location.href = payRes.data.authorization_url;
      } else {
        router.push(`/orders/${order.id}`);
      }
    } catch (error) {
      console.error("Checkout failed", error);
      toast({
        title: "Checkout Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Order</SheetTitle>
          <SheetDescription>
            {items.length > 0
              ? `You have ${itemCount} items in your cart`
              : "Your cart is empty"}
          </SheetDescription>
        </SheetHeader>

        {items.length > 0 ? (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 my-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-sm text-primary font-medium">
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, "decrement")}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-4 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-6 w-6 ${
                            item.quantity >= item.stock_quantity
                              ? "opacity-30 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={() => {
                            if (item.quantity < item.stock_quantity) {
                              updateQuantity(item.id, "increment");
                            } else {
                              toast({
                                title: "Limit reached",
                                description: `Only ${item.stock_quantity} units available.`,
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={item.quantity >= item.stock_quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-destructive text-xs hover:bg-transparent"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-2" />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Service Charge ({total < 100 ? "10%" : "5%"})
                  </span>
                  <span>
                    ${(total < 100 ? total * 0.1 : total * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>
                    $
                    {(
                      total + (total < 100 ? total * 0.1 : total * 0.05)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {isAuthenticated ? (
                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-semibold text-accent">
                    Delivery Details
                  </h4>

                  {user?.address ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Saved Address
                      </Label>
                      <div className="p-3 rounded-lg border bg-secondary/20 text-sm">
                        {user.address}
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-primary"
                        onClick={() => router.push("/settings")}
                      >
                        Change Address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="street" className="text-xs">
                          Street Address
                        </Label>
                        <Input
                          id="street"
                          placeholder="House number and street name"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="city" className="text-xs">
                            City
                          </Label>
                          <Input
                            id="city"
                            placeholder="Lagos"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="postCode" className="text-xs">
                            Postal Code (Optional)
                          </Label>
                          <Input
                            id="postCode"
                            placeholder="100001"
                            value={postCode}
                            onChange={(e) => setPostCode(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="country" className="text-xs">
                          Country
                        </Label>
                        <Input
                          id="country"
                          placeholder="Nigeria"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted p-3 rounded-md text-sm text-center text-muted-foreground">
                  Please sign in to complete your order.
                </div>
              )}
            </div>

            <SheetFooter className="mt-4">
              <Button
                onClick={handleCheckout}
                className="w-full"
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isAuthenticated ? (
                  "Place Order"
                ) : (
                  "Sign In to Checkout"
                )}
              </Button>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
            <p>Your cart is empty</p>
            <Button
              variant="link"
              onClick={() => {
                setIsOpen(false);
                router.push("/menus");
              }}
              className="mt-2"
            >
              Browse Menus
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
