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
import { Upload, Plus, Store, Users, Utensils } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRestaurantStore, useAuthStore } from "../../lib/store";
import { getRestaurants, getAllUsers } from "../../lib/api";
import { UserRole } from "@/lib/types";
import { BackButton } from "../../components/ui/back-button";

export default function DashboardPage() {
  const { restaurants, setRestaurants } = useRestaurantStore();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [restaurantCount, setRestaurantCount] = useState(0);
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isManagement = currentUser?.role === UserRole.MANAGEMENT;
  const isUser = currentUser?.role === UserRole.USER;

  useEffect(() => {
    async function fetchData() {
      try {
        // Only fetch restaurants for admin or management
        if (isAdmin || isManagement) {
          const res = await getRestaurants();
          setRestaurants(res.data || []);
          setRestaurantCount(res.meta?.total || res.data?.length || 0);
        }

        // Fetch user count only for admins
        if (isAdmin) {
          try {
            const usersRes = await getAllUsers(
              1,
              1,
              "",
              "",
              "created_at",
              "desc"
            );
            setUserCount(usersRes.meta?.total || usersRes.data?.length || 0);
          } catch (err) {
            console.error("Failed to fetch user count", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch restaurants", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setRestaurants, isAdmin]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <BackButton label="Back to Home" href="/" />
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-headline text-accent">Your Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's where you can manage your culinary world.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-accent">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-muted-foreground mb-2">
                    {loading ? "Loading..." : `Total users: ${userCount}`}
                  </div>
                  <Button asChild>
                    <Link href="/dashboard/users">Manage Users</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isUser && (
            <>
              <Card className="hover:shadow-lg transition-shadow border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-accent">
                    <Store className="h-5 w-5 text-primary" />
                    Restaurants Management
                  </CardTitle>
                  <CardDescription>
                    View and manage your restaurant listings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isManagement && (
                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        {loading
                          ? "Loading..."
                          : `You have ${restaurantCount} restaurants listed.`}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          <Link href="/dashboard/restaurants">View All</Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Link href="/dashboard/restaurants/new">
                            <Plus className="mr-2 h-4 w-4" /> Add
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        {loading
                          ? "Loading..."
                          : `Total Restaurant: ${restaurantCount}`}
                      </div>
                      <Button asChild>
                        <Link href="/dashboard/restaurants">
                          Manage Restaurants
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-accent">
                    <Utensils className="h-5 w-5 text-primary" />
                    Menus Management
                  </CardTitle>
                  <CardDescription>
                    Manage your dishes and menu offerings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      View all available items across restaurants.
                    </div>
                    <Button asChild variant="secondary">
                      <Link href="/menus">View All Menus</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {!isUser && (
          <div className="mt-12">
            <h2 className="text-2xl font-headline text-accent mb-6">
              Recent Restaurants
            </h2>
            {loading ? (
              <p>Loading...</p>
            ) : restaurants.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {restaurants.slice(0, 3).map((r) => (
                  <Link href={`/dashboard/restaurants/${r.id}`} key={r.id}>
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{r.name}</CardTitle>
                        <CardDescription>
                          <span className="capitalize">{r.status}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm line-clamp-2">{r.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No restaurants found. Create your first one!
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
