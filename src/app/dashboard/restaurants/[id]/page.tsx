"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getRestaurantById } from "@/lib/api";
import { MenuForm } from "@/components/restaurants/menu-form";
import { MenuList } from "@/components/restaurants/menu-list";
import { BackButton } from "@/components/ui/back-button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useAuthStore } from "@/lib/store";

export default function RestaurantDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user: currentUser } = useAuthStore();

  const handleMenuSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!id) return;
    getRestaurantById(id)
      .then((res) => {
        setRestaurant(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!restaurant)
    return <div className="p-8 text-center">Restaurant not found</div>;

  const isOwner = currentUser?.id === restaurant.user_id;
  const canEdit = isOwner;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <BackButton label="Back to Restaurants" href="/dashboard/restaurants" />
        <div className="mb-8">
          <h1 className="text-3xl font-headline text-accent mb-2">
            {restaurant.name}
          </h1>
          <p className="text-muted-foreground">{restaurant.description}</p>
          <div className="flex gap-4 mt-4 text-sm text-gray-500">
            <span>{restaurant.address}</span>
            <span className="capitalize">{restaurant.status}</span>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            {canEdit && (
              <Card className="border-l-4 border-l-primary shadow-md sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Add Menu Item
                  </CardTitle>
                  <CardDescription>
                    Create a new meal for your menu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MenuForm restaurantId={id} onSuccess={handleMenuSuccess} />
                </CardContent>
              </Card>
            )}
            {!canEdit && (
              <Card className="bg-muted/30 sticky top-8">
                <CardHeader>
                  <CardTitle>Restaurant Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Contact the manager for menu updates.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8">
            <h2 className="text-2xl font-headline mb-4">Current Menu</h2>
            <MenuList restaurantId={id} refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
