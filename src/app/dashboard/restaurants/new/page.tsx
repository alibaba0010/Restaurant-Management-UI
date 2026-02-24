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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRestaurantAction } from "./actions";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { BackButton } from "@/components/ui/back-button";

export default function NewRestaurantPage() {
  const router = useRouter();
  const initialState = { message: "", errors: {} };
  const [state, dispatch] = useActionState(
    createRestaurantAction,
    initialState,
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <BackButton
            label="Back to Restaurants"
            href="/dashboard/restaurants"
          />
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
              <form action={dispatch} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Restaurant Name"
                    required
                    minLength={2}
                  />
                  {state.errors?.name && (
                    <p className="text-sm text-destructive">
                      {state.errors.name.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about your restaurant..."
                  />
                  {state.errors?.description && (
                    <p className="text-sm text-destructive">
                      {state.errors.description.join(", ")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main St"
                      required
                    />
                    {state.errors?.address?.address && (
                      <p className="text-sm text-destructive">
                        {state.errors.address.address.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Lagos" required />
                    {state.errors?.address?.city && (
                      <p className="text-sm text-destructive">
                        {state.errors.address.city.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="Nigeria"
                      required
                    />
                    {state.errors?.address?.country && (
                      <p className="text-sm text-destructive">
                        {state.errors.address.country.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="post_code">Post Code (Optional)</Label>
                    <Input
                      id="post_code"
                      name="post_code"
                      placeholder="100001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    placeholder="https://example.com/logo.png"
                  />
                  {state.errors?.avatar_url && (
                    <p className="text-sm text-destructive">
                      {state.errors.avatar_url.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    placeholder="Seating capacity"
                    min={0}
                  />
                  {state.errors?.capacity && (
                    <p className="text-sm text-destructive">
                      {state.errors.capacity.join(", ")}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="delivery_available"
                    name="delivery_available"
                    value="true"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="delivery_available">Delivery Available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="takeaway_available"
                    name="takeaway_available"
                    value="true"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="takeaway_available">Takeaway Available</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude (optional)</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 6.5244"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude (optional)</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 3.3792"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4 text-accent">
                    Payout Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        name="bank_name"
                        placeholder="e.g. GTBank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        name="account_number"
                        placeholder="10 digits"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This information is used to settle your earnings.
                  </p>
                </div>

                {state.message && (
                  <p className="text-sm text-destructive">{state.message}</p>
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Restaurant</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
