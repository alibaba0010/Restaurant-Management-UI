"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  ArrowLeft,
  Loader2,
  MapPin,
  UtensilsCrossed,
  Info,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { getRestaurantById } from "@/lib/api";
import { MenuForm } from "@/components/restaurants/menu-form";
import { MenuList } from "@/components/restaurants/menu-list";
import { CategoryManager } from "@/components/restaurants/category-manager";
import { BackButton } from "@/components/ui/back-button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
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

  const isOwner = currentUser?.id === restaurant?.user_id;
  const canEdit = isOwner;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !restaurant ? (
          <div className="p-8 text-center text-muted-foreground">
            Restaurant not found
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            <BackButton
              label="Back to Restaurants"
              href="/dashboard/restaurants"
            />

            {/* Beautiful Hero Section */}
            <div className="mb-10 mt-6 relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 border shadow-sm">
              <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
              <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-foreground tracking-tight">
                      {restaurant.name}
                    </h1>
                    {restaurant.status === "active" ||
                    restaurant.status === "ACTIVE" ? (
                      <Badge className="bg-green-500 hover:bg-green-600 gap-1.5 px-3 py-1 shadow-sm h-8 mt-2 md:mt-0">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1.5 px-3 py-1 uppercase tracking-wider text-xs h-8 mt-2 md:mt-0"
                      >
                        <Info className="w-4 h-4" /> {restaurant.status}
                      </Badge>
                    )}
                  </div>

                  <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                    {restaurant.description ||
                      "A wonderful place to dine and enjoy great food. Browse our menu and experience culinary excellence."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground pt-2">
                    {restaurant.address && (
                      <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-full border shadow-sm backdrop-blur-md hover:border-primary/50 transition-colors">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{restaurant.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-full border shadow-sm backdrop-blur-md hover:border-primary/50 transition-colors">
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      <span>
                        Restaurant ID: {restaurant.id?.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-4 lg:order-2">
                <div className="space-y-6 sticky top-8">
                  <Card className="border-t-4 border-t-primary shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
                    <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500 pointer-events-none" />
                    <CardHeader className="pb-4 relative">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 transform group-hover:scale-105 transition-transform duration-300">
                        <Info className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-headline">
                        Restaurant Overview
                      </CardTitle>
                      <CardDescription className="text-base text-muted-foreground/80">
                        {canEdit
                          ? "Manage your settings, categories, and menus from here to keep your restaurant updated."
                          : "Contact the manager for menu updates and changes."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {canEdit && (
                        <div className="pt-2">
                          <CategoryManager
                            restaurantId={id}
                            onCategoriesChange={handleMenuSuccess}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {canEdit && (
                    <Card className="border bg-card shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500 pointer-events-none" />
                      <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-md shadow-primary/25 transform group-hover:-translate-y-1 transition-transform duration-300">
                          <Plus className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl font-headline">
                          Add Menu Item
                        </CardTitle>
                        <CardDescription className="text-base">
                          Create a new delicious meal to showcase on your menu
                          and attract more customers.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <MenuForm
                          restaurantId={id}
                          onSuccess={handleMenuSuccess}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 lg:order-1">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-3xl font-headline font-bold text-foreground tracking-tight">
                    Current Menu
                  </h2>
                </div>
                <div className="bg-card rounded-2xl p-1 md:p-6 border shadow-sm">
                  <MenuList restaurantId={id} refreshTrigger={refreshTrigger} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
