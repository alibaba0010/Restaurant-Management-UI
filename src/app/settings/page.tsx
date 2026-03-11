"use client";

import { useState } from "react";
import Header from "../../components/layout/header";
import Footer from "../../components/layout/footer";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { useAuthStore } from "../../lib/store";
import { apiUpdateUser } from "../../lib/api";
import { withToast } from "../../lib/api-toast";
import { Loader2, MapPin, Phone, User as UserIcon } from "lucide-react";
import { BackButton } from "../../components/ui/back-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddressSchema } from "../../lib/definitions";
import * as z from "zod";

const phoneSchema = z.object({
  phone_number: z.string().min(5, "Phone number is too short"),
});

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Track which field is being updated
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  const addressForm = useForm<z.infer<typeof AddressSchema>>({
    resolver: zodResolver(AddressSchema),
    defaultValues: {
      address: "",
      city: "",
      country: "",
      post_code: "",
    },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone_number: user?.phone_number || "",
    },
  });

  const onAddressSubmit = async (values: z.infer<typeof AddressSchema>) => {
    try {
      setLoading(true);
      const res = await withToast(() => apiUpdateUser({ address: values } as any), {
        successMessage: "Address updated successfully.",
      });

      if (user) {
        setUser({ ...user, ...res });
      }
      setIsUpdatingAddress(false);
    } catch (error) {
      // Error toast already shown by withToast
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    try {
      setLoading(true);
      const res = await withToast(() => apiUpdateUser({ phone_number: values.phone_number }), {
        successMessage: "Phone number updated successfully.",
      });

      if (user) {
        setUser({ ...user, ...res });
      }
      setIsUpdatingPhone(false);
    } catch (error) {
      // Error toast already shown by withToast
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BackButton label="Back to Dashboard" href="/dashboard" />
          <h1 className="text-4xl font-headline text-accent mb-8">Settings</h1>

          <div className="grid gap-8">
            {/* Profile Overview */}
            <Card className="border-accent/10 shadow-lg">
              <CardHeader className="bg-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium text-lg">{user.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Email Address
                    </Label>
                    <p className="font-medium text-lg">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card className="border-accent/10 shadow-lg">
              <CardHeader className="bg-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Contact Details
                </CardTitle>
                <CardDescription>
                  Manage your address and phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Address Field */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="flex flex-col gap-4">
                    {user.address && !isUpdatingAddress ? (
                      <div className="flex flex-1 items-center justify-between bg-accent/5 p-3 rounded-md border border-accent/10">
                        <span className="text-foreground">{user.address}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsUpdatingAddress(true);
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    ) : (
                      <Form {...addressForm}>
                        <form
                          onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                          className="grid gap-4 bg-accent/5 p-4 rounded-md border border-accent/10"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={addressForm.control}
                              name="address"
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
                              control={addressForm.control}
                              name="city"
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
                              control={addressForm.control}
                              name="country"
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
                              control={addressForm.control}
                              name="post_code"
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
                          <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={loading}>
                              {loading && isUpdatingAddress ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Save Address
                            </Button>
                            {user.address && (
                              <Button
                                variant="ghost"
                                onClick={() => setIsUpdatingAddress(false)}
                                type="button"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </form>
                      </Form>
                    )}
                  </div>
                </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    {user.phone_number && !isUpdatingPhone ? (
                      <div className="flex flex-1 items-center justify-between bg-accent/5 p-3 rounded-md border border-accent/10">
                        <span className="text-foreground">
                          {user.phone_number}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsUpdatingPhone(true);
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 w-full">
                        <Form {...phoneForm}>
                          <form
                            onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                            className="flex gap-2 w-full"
                          >
                            <div className="flex-1">
                              <FormField
                                control={phoneForm.control}
                                name="phone_number"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g. +1234567890"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button type="submit" disabled={loading}>
                              {loading && isUpdatingPhone ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Save
                            </Button>
                            {user.phone_number && (
                              <Button
                                variant="ghost"
                                onClick={() => setIsUpdatingPhone(false)}
                                type="button"
                              >
                                Cancel
                              </Button>
                            )}
                          </form>
                        </Form>
                      </div>
                    )}
                  </div>
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
