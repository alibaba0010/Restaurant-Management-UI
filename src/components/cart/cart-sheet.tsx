"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/store";
import { createOrder, initiatePayment, apiUpdateUser, getCurrentUser } from "@/lib/api";
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
import { ShoppingCart, Trash2, Plus, Minus, Loader2, MapPin } from "lucide-react";
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
  } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState(user?.address || "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [postCode, setPostCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      const fetchProfile = async () => {
        try {
          setIsLoadingAddress(true);
          const res = await getCurrentUser();
          if (res?.data) {
            setUser(res.data);
            
            const fetchedAddress = 
              res.data.addresses?.find((a: any) => a.id === res.data.address_id)?.raw_address || 
              res.data.address || 
              "";

            if (fetchedAddress) {
              setIsEditingAddress(false);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user profile", error);
        } finally {
          setIsLoadingAddress(false);
        }
      };
      
      fetchProfile();
    }
  }, [isOpen, isAuthenticated, setUser]);

  const currentDefaultAddress = user?.addresses?.find(a => a.id === user.address_id);
  const displayAddress = currentDefaultAddress?.raw_address || user?.address || "";

  const total = totalPrice();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setIsOpen(false);
      router.push("/signin");
      return;
    }

    const isAddressInputNeeded = !displayAddress || isEditingAddress;
    let finalAddress = user?.address || "";

    if (isAddressInputNeeded) {
      if (!street || !city || !country) {
        toast({
          title: "Incomplete Address",
          description: "Please fill in all required address fields.",
          variant: "destructive",
        });
        return;
      }
      // Simple format, the backend will format it properly using ProcessAddress
      finalAddress = `${street}, ${city}, ${country} ${postCode}`.trim();
    }

    if (!finalAddress || finalAddress.replace(/,/g, "").trim().length < 5) {
      toast({
        title: "Address Required",
        description: "Please provide a complete delivery address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. If address is new or being edited, update user profile first
      if (isAddressInputNeeded) {
        try {
          // Find if we are updating an existing address OR adding a new one
          // We use the primary address_id if we have one and we're NOT in "add new" mode.
          const existingAddressId = !isAddingNewAddress ? user?.address_id : undefined;

          const updateRes = await apiUpdateUser({
            address: {
              id: existingAddressId,
              address: street,
              city: city,
              country: country,
              post_code: postCode,
            }
          });
          
          if (updateRes.data) {
            // Update local store with the newly formatted address from server
            setUser({
              ...user!,
              address: updateRes.data.address,
              address_id: updateRes.data.address_id,
              addresses: updateRes.data.addresses
            });
            finalAddress = updateRes.data.address;
            setIsEditingAddress(false);
            setIsAddingNewAddress(false);
          }
        } catch (apiErr) {
          console.warn("Could not save address to profile, but proceeding with order:", apiErr);
          // We still have finalAddress, so we can try to proceed
        }
      }

      const groupedItems = items.reduce(
        (acc: Record<string, typeof items>, item) => {
          if (!acc[item.restaurant_id]) acc[item.restaurant_id] = [];
          acc[item.restaurant_id].push(item);
          return acc;
        },
        {},
      );

      const groupKeys = Object.keys(groupedItems);
      if (groupKeys.length === 0) return;

      let firstOrderId = "";

      for (const restId of groupKeys) {
        const orderData = {
          restaurant_id: restId,
          delivery_address: finalAddress,
          order_type: "delivery",
          items: groupedItems[restId].map((item) => ({
            menu_id: item.id,
            quantity: item.quantity,
          })),
        };

        const res = await createOrder(orderData);
        if (!firstOrderId) firstOrderId = res.data.id;
      }

      toast({
        title: groupKeys.length > 1 ? "Orders Created" : "Order Created",
        description: "Redirecting to your order details...",
      });

      setIsOpen(false);

      if (groupKeys.length === 1) {
        router.push(`/orders/${firstOrderId}`);
      } else {
        router.push("/orders");
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
                        NGN {Number(item.price).toFixed(2)}
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
                  <span>NGN {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Service Charge ({total < 100 ? "10%" : "5%"})
                  </span>
                  <span>
                    NGN {(total < 100 ? total * 0.1 : total * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>
                    NGN{" "}
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

                  {isLoadingAddress ? (
                    <div className="flex justify-center items-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">Loading address...</span>
                    </div>
                  ) : displayAddress && !isEditingAddress ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          DELIVERING TO
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-primary hover:bg-primary/5 hover:text-primary transition-colors flex gap-1 font-bold"
                            onClick={() => {
                              setIsEditingAddress(true);
                              setIsAddingNewAddress(false);
                              
                              if (currentDefaultAddress) {
                                const parts = currentDefaultAddress.raw_address.split(',').map(p => p.trim());
                                setStreet(parts[0] || "");
                                setCity(parts[1] || "");
                                setCountry(parts[2] || "Nigeria");
                                setPostCode(currentDefaultAddress.formatted_address.match(/\d{4,}/)?.[0] || "");
                              } else if (user?.address) {
                                const parts = user.address.split(',').map(p => p.trim());
                                if (parts.length >= 2) {
                                  setStreet(parts[0]);
                                  setCity(parts[1]);
                                }
                              }
                            }}
                          >
                            MODIFY
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-accent hover:bg-accent/5 transition-colors flex gap-1 font-bold"
                            onClick={() => {
                              setIsEditingAddress(true);
                              setIsAddingNewAddress(true);
                              setStreet("");
                              setCity("");
                              setPostCode("");
                            }}
                          >
                            + NEW
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border-l-4 border-l-primary bg-slate-100/80 text-sm font-medium text-slate-700 shadow-sm leading-relaxed flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          {displayAddress}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            {isAddingNewAddress ? "ADD NEW ADDRESS" : "MODIFY ADDRESS"}
                          </Label>
                          {user?.address && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-slate-200 text-slate-400">
                               {isAddingNewAddress ? "Saves as new" : "Updates current"}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                          onClick={() => {
                            setIsEditingAddress(false);
                            setIsAddingNewAddress(false);
                          }}
                        >
                          CANCEL
                        </Button>
                      </div>

                      {displayAddress && (
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                           <button 
                             className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${!isAddingNewAddress ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                             onClick={() => {
                               setIsAddingNewAddress(false);
                               if (currentDefaultAddress) {
                                  const parts = currentDefaultAddress.raw_address.split(',').map(p => p.trim());
                                  setStreet(parts[0] || "");
                                  setCity(parts[1] || "");
                                  setCountry(parts[2] || "Nigeria");
                                  setPostCode(currentDefaultAddress.formatted_address.match(/\d{4,}/)?.[0] || "");
                               } else if (user?.address) {
                                  const parts = user.address.split(',').map(p => p.trim());
                                  if (parts.length >= 2) {
                                    setStreet(parts[0]);
                                    setCity(parts[1]);
                                  }
                               }
                             }}
                           >
                             MODIFY CURRENT
                           </button>
                           <button 
                             className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${isAddingNewAddress ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                             onClick={() => {
                               setIsAddingNewAddress(true);
                               setStreet("");
                               setCity("");
                               setPostCode("");
                             }}
                           >
                             + ADD NEW
                           </button>
                        </div>
                      )}
                      
                      <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="space-y-1.5">
                          <Label htmlFor="street" className="text-[10px] uppercase font-bold text-slate-400 ml-1">
                            Street Address
                          </Label>
                          <Input
                            id="street"
                            placeholder="House number and street name"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="h-10 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <Label htmlFor="city" className="text-[10px] uppercase font-bold text-slate-400 ml-1">
                              City
                            </Label>
                            <Input
                              id="city"
                              placeholder="Lagos"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="h-10 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="postCode" className="text-[10px] uppercase font-bold text-slate-400 ml-1">
                              Postal Code
                            </Label>
                            <Input
                              id="postCode"
                              placeholder="100001"
                              value={postCode}
                              onChange={(e) => setPostCode(e.target.value)}
                              className="h-10 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="country" className="text-[10px] uppercase font-bold text-slate-400 ml-1">
                            Country
                          </Label>
                          <Input
                            id="country"
                            placeholder="Nigeria"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="h-10 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
                          />
                        </div>
                        {!isEditingAddress && (
                           <p className="text-[10px] text-muted-foreground italic text-center pt-1">
                             This address will be saved to your profile for next time.
                           </p>
                        )}
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
                disabled={
                  isSubmitting || 
                  items.length === 0 || 
                  (isAuthenticated && (!displayAddress || isEditingAddress) && (!street.trim() || !city.trim() || !country.trim()))
                }
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
