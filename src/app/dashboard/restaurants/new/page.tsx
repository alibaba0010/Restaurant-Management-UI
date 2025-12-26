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
import { useFormState } from "react-dom";
import { createRestaurantAction } from "./actions";
import { useRouter } from "next/navigation";

export default function NewRestaurantPage() {
  const router = useRouter();
  const initialState = { message: "", errors: {} };
  const [state, dispatch] = useFormState(createRestaurantAction, initialState);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
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

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main St"
                  required
                  minLength={5}
                />
                {state.errors?.address && (
                  <p className="text-sm text-destructive">
                    {state.errors.address.join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine_type">Cuisine Type</Label>
                <Input
                  id="cuisine_type"
                  name="cuisine_type"
                  placeholder="e.g. Italian, Mexican, Vegan"
                />
                {state.errors?.cuisine_type && (
                  <p className="text-sm text-destructive">
                    {state.errors.cuisine_type.join(", ")}
                  </p>
                )}
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
      </main>
      <Footer />
    </div>
  );
}
