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
import { useAuthStore } from "../../lib/store";
import { apiUpdateUser } from "../../lib/api";
import { withToast } from "../../lib/api-toast";
import { Loader2, MapPin, Phone, User as UserIcon } from "lucide-react";
import { BackButton } from "../../components/ui/back-button";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Local state for editing
  const [addressData, setAddressData] = useState({
    address: "",
    city: "",
    country: "",
    post_code: "",
  });
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");

  // Track which field is being updated
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  const handleUpdate = async (field: "address" | "phone_number") => {
    try {
      setLoading(true);
      const data =
        field === "address"
          ? { address: addressData }
          : { phone_number: phoneNumber };
      const res = await withToast(() => apiUpdateUser(data as any), {
        successMessage: `${
          field === "address" ? "Address" : "Phone number"
        } updated successfully.`,
      });

      if (user) {
        setUser({ ...user, ...res });
      }

      if (field === "address") setIsUpdatingAddress(false);
      if (field === "phone_number") setIsUpdatingPhone(false);
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
                      <div className="grid gap-4 bg-accent/5 p-4 rounded-md border border-accent/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="street">Street Address</Label>
                            <Input
                              id="street"
                              placeholder="123 Main St"
                              value={addressData.address}
                              onChange={(e) =>
                                setAddressData({
                                  ...addressData,
                                  address: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              placeholder="Lagos"
                              value={addressData.city}
                              onChange={(e) =>
                                setAddressData({
                                  ...addressData,
                                  city: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              placeholder="Nigeria"
                              value={addressData.country}
                              onChange={(e) =>
                                setAddressData({
                                  ...addressData,
                                  country: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="post_code">
                              Post Code (Optional)
                            </Label>
                            <Input
                              id="post_code"
                              placeholder="100001"
                              value={addressData.post_code}
                              onChange={(e) =>
                                setAddressData({
                                  ...addressData,
                                  post_code: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleUpdate("address")}
                            disabled={
                              loading ||
                              !addressData.address ||
                              !addressData.city ||
                              !addressData.country
                            }
                          >
                            {loading && isUpdatingAddress ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Save Address
                          </Button>
                          {user.address && (
                            <Button
                              variant="ghost"
                              onClick={() => setIsUpdatingAddress(false)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
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
                            setPhoneNumber(user.phone_number || "");
                            setIsUpdatingPhone(true);
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          id="phone"
                          placeholder="e.g. +1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleUpdate("phone_number")}
                          disabled={loading || !phoneNumber}
                        >
                          {loading && isUpdatingPhone ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Save
                        </Button>
                        {user.phone_number && (
                          <Button
                            variant="ghost"
                            onClick={() => setIsUpdatingPhone(false)}
                          >
                            Cancel
                          </Button>
                        )}
                      </>
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
