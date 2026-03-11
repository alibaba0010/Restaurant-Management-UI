"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RestaurantFormSchema } from "@/lib/definitions";
import { updateRestaurant as apiUpdateRestaurant } from "@/lib/api";
import { useRestaurantStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit } from "lucide-react";

interface UpdateRestaurantDialogProps {
  restaurant: any;
  onSuccess?: (updated: any) => void;
}

export function UpdateRestaurantDialog({
  restaurant,
  onSuccess,
}: UpdateRestaurantDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const updateRestaurantInStore = useRestaurantStore((state) => state.updateRestaurant);

  // Address in DB might be a single string vs object in schema. Let's gracefully handle fallback.
  // The backend might return address as string. The form uses object: { address, city, country, post_code }
  const parseAddress = (addrString: string) => {
    if (!addrString) return { address: "", city: "", country: "", post_code: "" };
    try {
      // If it resembles JSON, parse it (if backend saves stringified json)
      const parsed = JSON.parse(addrString);
      if (parsed.address || parsed.city) return parsed;
    } catch (e) {
      // Ignore
    }
    // Fallback: Just put everything in 'address' line 1
    return { address: addrString, city: "", country: "", post_code: "" };
  };

  const addressObj = typeof restaurant.address === "object" 
    ? restaurant.address 
    : parseAddress(restaurant.address);

  const form = useForm<z.infer<typeof RestaurantFormSchema>>({
    resolver: zodResolver(RestaurantFormSchema),
    defaultValues: {
      name: restaurant.name || "",
      description: restaurant.description || "",
      address: {
        address: addressObj?.address || "",
        city: addressObj?.city || "",
        country: addressObj?.country || "Nigeria",
        post_code: addressObj?.post_code || "",
      },
      avatar_url: restaurant.avatar_url || "",
      capacity: restaurant.capacity ? String(restaurant.capacity) : "",
      delivery_available: !!restaurant.delivery_available,
      takeaway_available: !!restaurant.takeaway_available,
      latitude: restaurant.latitude ? String(restaurant.latitude) : "",
      longitude: restaurant.longitude ? String(restaurant.longitude) : "",
      account_number: restaurant.account_number || "",
      bank_name: restaurant.bank_name || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof RestaurantFormSchema>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
        // Optional depending on your API, if it wants address as string:
        address: `${values.address.address}, ${values.address.city}, ${values.address.country} ${values.address.post_code || ""}`.trim()
      };

      const res = await apiUpdateRestaurant(restaurant.id, payload);
      
      toast({ title: "Restaurant updated successfully" });
      updateRestaurantInStore(restaurant.id, res.data);
      if (onSuccess) onSuccess(res.data);
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Failed to update restaurant",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Edit className="mr-2 h-4 w-4" /> Edit Restaurant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Restaurant Info</DialogTitle>
          <DialogDescription>
            Make changes to your restaurant details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Restaurant Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us about your restaurant..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Lagos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Nigeria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.post_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="100001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Seating capacity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex flex-col gap-4 p-4 border rounded-md">
              <FormField
                control={form.control}
                name="delivery_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Delivery Available</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="takeaway_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Takeaway Available</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4 text-accent">Payout Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10 digits account number"
                          maxLength={10}
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. GTBank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
