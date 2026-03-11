"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RestaurantFormSchema } from "@/lib/definitions";
import { createRestaurant } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function NewRestaurantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<{ name: string; code: string }[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState("");

  const form = useForm<z.infer<typeof RestaurantFormSchema>>({
    resolver: zodResolver(RestaurantFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: {
        address: "",
        city: "",
        country: "",
        post_code: "",
      },
      avatar_url: "",
      capacity: "",
      delivery_available: false,
      takeaway_available: false,
      latitude: "",
      longitude: "",
      account_number: "",
      bank_name: "",
    },
  });

  const accountNumber = form.watch("account_number");
  const bankName = form.watch("bank_name");

  // Fetch banks on mount
  useEffect(() => {
    fetch("https://api.paystack.co/bank")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setBanks(data.data);
        }
      })
      .catch((err) => console.error("Failed to load banks", err));
  }, []);

  // Filter banks when account number reaches 10 digits
  useEffect(() => {
    if (accountNumber && accountNumber.length === 10 && banks.length > 0) {
      // Deterministic filter based on the account number string to simulate NUBAN filtering
      const hash = accountNumber.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const possibleBanks = banks.filter((b, idx) => (hash + idx) % 7 === 0);
      setFilteredBanks(possibleBanks.length > 0 ? possibleBanks : banks.slice(0, 10)); // Ensure there are SOME banks
      
      // If the currently selected bank is not in the filtered list, reset it
      if (bankName && !possibleBanks.find(b => b.name === bankName)) {
        form.setValue("bank_name", "");
      }
    } else {
      setFilteredBanks([]);
      setResolvedAccountName("");
    }
  }, [accountNumber, banks, form, bankName]);

  // Resolve account name when both account number and bank are selected
  useEffect(() => {
    if (accountNumber && accountNumber.length === 10 && bankName) {
      setIsResolving(true);
      setResolvedAccountName("");
      // Simulate API call for name resolution
      const timeout = setTimeout(() => {
        setResolvedAccountName("MOCK USER ACCOUNT NAME");
        setIsResolving(false);
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      setResolvedAccountName("");
    }
  }, [accountNumber, bankName]);

  const onSubmit = async (values: z.infer<typeof RestaurantFormSchema>) => {
    setIsSubmitting(true);
    try {
      // transform string numbers back to actual numbers before payload submission if required
      const payload = {
        ...values,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
      };
      
      await createRestaurant(payload);
      toast({ title: "Restaurant created successfully" });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Failed to create restaurant",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <BackButton label="Back to Restaurants" href="/dashboard/restaurants" />
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-accent">
                Add New Restaurant
              </CardTitle>
              <CardDescription>
                Create a profile for your restaurant to share with the world.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* ... other form fields (name, description, address, etc.) ... */}
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

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4 text-accent">
                      Payout Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Account Number comes FIRST */}
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
                            {isResolving && <p className="text-xs text-primary animate-pulse">Resolving account name...</p>}
                            {resolvedAccountName && (
                              <p className="text-sm font-medium text-green-600 bg-green-50 p-2 rounded border border-green-200 mt-2">
                                {resolvedAccountName}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Bank Select Component */}
                      <FormField
                        control={form.control}
                        name="bank_name"
                        render={({ field }) => (
                          <FormItem className="flex flex-col pt-2">
                            <FormLabel>Bank Name</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground",
                                      accountNumber?.length !== 10 && "opacity-50 cursor-not-allowed"
                                    )}
                                    disabled={accountNumber?.length !== 10}
                                  >
                                    {field.value
                                      ? (filteredBanks.length > 0 ? filteredBanks : banks).find(
                                          (bank) => bank.name === field.value
                                        )?.name || field.value
                                      : accountNumber?.length !== 10 
                                      ? "Enter account number first" 
                                      : "Select available bank"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search bank..." />
                                  <CommandList>
                                    <CommandEmpty>No bank found.</CommandEmpty>
                                    <CommandGroup>
                                      {(filteredBanks.length > 0 ? filteredBanks : banks).map((bank) => (
                                        <CommandItem
                                          value={bank.name}
                                          key={bank.code}
                                          onSelect={() => {
                                            form.setValue("bank_name", bank.name, { shouldValidate: true });
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              bank.name === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {bank.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      (Optional) Please enter your 10 digit account number first, then select the corresponding bank to automatically resolve the account mapping.
                    </p>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Restaurant
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
