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
import { Loader2, MapPin, Phone, User as UserIcon, Plus } from "lucide-react";
import { Separator } from "../../components/ui/separator";
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

  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const addressForm = useForm<z.infer<typeof AddressSchema>>({
    resolver: zodResolver(AddressSchema),
    defaultValues: {
      id: undefined,
      address: "",
      city: "",
      country: "Nigeria",
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
      const res = await withToast(() => apiUpdateUser({ address: values }), {
        successMessage: values.id ? "Address modified successfully." : "New address added successfully.",
      });

      if (user && res.data) {
        setUser({ 
          ...user, 
          address: res.data.address,
          address_id: res.data.address_id,
          addresses: res.data.addresses 
        });
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
      addressForm.reset();
    } catch (error) {
       console.error("Failed to update address", error);
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
                  Manage your addresses and phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {/* Address Management Section */}
                <div className="space-y-5">
                  <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <Label className="text-sm font-bold text-accent uppercase tracking-wider ml-2">Saved Addresses</Label>
                    {!showAddressForm && (
                      <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-8 border-primary text-primary hover:bg-primary/5 font-bold"
                         onClick={() => {
                           addressForm.reset({
                             id: undefined,
                             address: "",
                             city: "",
                             country: "Nigeria",
                             post_code: "",
                           });
                           setShowAddressForm(true);
                           setEditingAddressId(null);
                         }}
                      >
                         <Plus className="mr-2 h-3.5 w-3.5" /> ADD NEW
                      </Button>
                    )}
                  </div>

                  {showAddressForm ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <Form {...addressForm}>
                        <form
                          onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                          className="grid gap-5 bg-white p-6 rounded-2xl border-2 border-primary/10 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                             <h4 className="text-base font-bold text-accent">
                               {editingAddressId ? "Modify Existing Address" : "Add New Address"}
                             </h4>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 text-slate-400 font-bold hover:text-slate-600"
                               onClick={() => {
                                 setShowAddressForm(false);
                                 setEditingAddressId(null);
                               }}
                             >
                               CANCEL
                             </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={addressForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Street Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123 Main St" className="bg-slate-50/50 rounded-xl h-11 border-slate-200" {...field} />
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
                                  <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Lagos" className="bg-slate-50/50 rounded-xl h-11 border-slate-200" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                              control={addressForm.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nigeria" className="bg-slate-50/50 rounded-xl h-11 border-slate-200" {...field} />
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
                                  <FormLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="100001" className="bg-slate-50/50 rounded-xl h-11 border-slate-200" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex justify-end pt-2">
                            <Button 
                              type="submit" 
                              disabled={loading}
                              className="w-full sm:w-auto px-10 rounded-xl h-11 font-bold shadow-md shadow-primary/20"
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              {editingAddressId ? "UPDATE ADDRESS" : "SAVE ADDRESS"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {user?.addresses && user.addresses.length > 0 ? (
                         user.addresses.map((addr) => (
                           <div 
                             key={addr.id} 
                             className={`group relative flex items-start justify-between p-4 rounded-2xl border transition-all duration-300 ${
                               addr.id === user.address_id 
                               ? 'border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20' 
                               : 'border-slate-100 bg-white hover:border-slate-300'
                             }`}
                           >
                             <div className="flex gap-4">
                                <div className={`mt-0.5 p-2.5 rounded-xl ${addr.id === user.address_id ? 'bg-primary/20 text-primary shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                  <MapPin className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-slate-800">
                                      {addr.id === user.address_id ? "Primary Address" : "Alternate Address"}
                                    </p>
                                    {addr.id === user.address_id && (
                                      <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Default</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    {addr.raw_address}
                                  </p>
                                  <p className="text-[11px] text-slate-400 italic">
                                     {addr.formatted_address}
                                  </p>
                                </div>
                             </div>
                             <div className="flex flex-col gap-2">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="h-8 px-4 text-[10px] font-black text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all rounded-lg"
                                 onClick={() => {
                                    setEditingAddressId(addr.id);
                                    setShowAddressForm(true);
                                    
                                    const parts = addr.raw_address.split(',').map(p => p.trim());
                                    addressForm.reset({
                                      id: addr.id,
                                      address: parts[0] || "",
                                      city: parts[1] || "",
                                      country: parts[2] || "Nigeria",
                                      post_code: addr.formatted_address.match(/\d{4,}/)?.[0] || "",
                                    });
                                 }}
                               >
                                 EDIT
                               </Button>
                             </div>
                           </div>
                         ))
                       ) : (
                         <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                           <div className="bg-white p-4 inline-block rounded-2xl shadow-sm mb-4">
                              <MapPin className="h-8 w-8 text-slate-300" />
                           </div>
                           <p className="text-slate-600 font-bold">No saved addresses</p>
                           <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Please add a delivery address to complete your profile.</p>
                           <Button 
                             onClick={() => setShowAddressForm(true)}
                             variant="link" 
                             className="mt-4 text-primary font-bold"
                           >
                             Add your first address
                           </Button>
                         </div>
                       )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Phone Number Section */}
                <div className="space-y-4">
                   <Label className="text-sm font-bold text-accent uppercase tracking-wider">Phone Number</Label>
                   <div className="flex gap-2">
                    {user.phone_number && !isUpdatingPhone ? (
                      <div className="flex flex-1 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-white rounded-lg shadow-sm">
                             <Phone className="h-4 w-4 text-primary" />
                           </div>
                           <span className="text-slate-700 font-medium">
                            {user.phone_number}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-primary font-bold"
                          onClick={() => {
                            setIsUpdatingPhone(true);
                          }}
                        >
                          Modify
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 w-full animate-in fade-in slide-in-from-top-1">
                        <Form {...phoneForm}>
                          <form
                            onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                            className="flex gap-3 w-full"
                          >
                            <div className="flex-1">
                              <FormField
                                control={phoneForm.control}
                                name="phone_number"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g. +234 800 000 0000"
                                        className="h-11 rounded-xl border-slate-200"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button type="submit" disabled={loading} className="h-11 px-6 rounded-xl font-bold">
                              {loading && isUpdatingPhone ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              SAVE
                            </Button>
                            {user.phone_number && (
                              <Button
                                variant="ghost"
                                className="h-11 px-4 text-slate-400 font-bold"
                                onClick={() => setIsUpdatingPhone(false)}
                                type="button"
                              >
                                CANCEL
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


