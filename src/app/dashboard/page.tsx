"use client";

import Header from "../../components/layout/header";
import Footer from "../../components/layout/footer";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Upload, Plus, Store } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRestaurantStore } from "../../lib/store";
import { getRestaurants } from "../../lib/api";

export default function DashboardPage() {
  const { restaurants, setRestaurants } = useRestaurantStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const res = await getRestaurants();
        setRestaurants(res.data || []);
      } catch (err) {
        console.error("Failed to fetch restaurants", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurants();
  }, [setRestaurants]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-headline text-accent">Your Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's where you can manage your culinary world.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-accent">
                <Upload className="h-5 w-5 text-primary" />
                Share a Recipe
              </CardTitle>
              <CardDescription>
                Got a new creation? Upload images and videos to inspire the
                community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/upload">Upload Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-accent">
                <Store className="h-5 w-5 text-primary" />
                Manage Restaurants
              </CardTitle>
              <CardDescription>
                View and manage your restaurant listings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="text-sm text-muted-foreground mb-2">
                  {loading
                    ? "Loading..."
                    : `You have ${restaurants.length} restaurants listed.`}
                </div>
                <Button asChild variant="outline">
                  <Link href="/dashboard/restaurants/new">
                    <Plus className="mr-2 h-4 w-4" /> Add Restaurant
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-headline text-accent mb-6">
            Recent Restaurants
          </h2>
          {loading ? (
            <p>Loading...</p>
          ) : restaurants.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.slice(0, 3).map((r) => (
                <Card key={r.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{r.name}</CardTitle>
                    <CardDescription>{r.cuisine_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-2">{r.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No restaurants found. Create your first one!
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
