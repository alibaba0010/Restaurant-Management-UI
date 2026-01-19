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
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRestaurantStore, useAuthStore } from "@/lib/store";
import { getRestaurants } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { UserRole, RestaurantStatus } from "@/lib/types";
import { BackButton } from "@/components/ui/back-button";

export default function RestaurantsListPage() {
  const { restaurants, setRestaurants } = useRestaurantStore();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const isManagement = currentUser?.role === UserRole.MANAGEMENT;

  // Initial fetch
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      try {
        setNextCursor(undefined); // Reset cursor
        const res = await getRestaurants(undefined, 20, searchTerm);
        setRestaurants(res.data || []);
        setNextCursor(res.meta?.next_cursor);
        setHasMore(!!res.meta?.has_more);
      } catch (err) {
        console.error("Failed to fetch restaurants", err);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search if needed, but for now just fetch on mount or searchTerm change
    const timer = setTimeout(() => {
      fetchInitialData();
    }, 300);

    return () => clearTimeout(timer);
  }, [setRestaurants, searchTerm]); // Add searchTerm to dependency

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getRestaurants(nextCursor, 20, searchTerm);
      const newRestaurants = res.data || [];
      setRestaurants([...restaurants, ...newRestaurants]);
      setNextCursor(res.meta?.next_cursor);
      setHasMore(!!res.meta?.has_more);
    } catch (err) {
      console.error("Failed to load more restaurants", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // We don't filter client-side anymore effectively, but for safety or mixed usage:
  // actually we are filtering server side with `searchTerm` in `getRestaurants`.
  // So client side filtering is redundant if searchTerm is passed to API.
  const displayedRestaurants = restaurants;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <BackButton label="Back to Dashboard" href="/dashboard" />
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-headline text-accent">Restaurants</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all your restaurant listings.
            </p>
          </div>
          {isManagement && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/dashboard/restaurants/new">
                <Plus className="mr-2 h-4 w-4" /> Add Restaurant
              </Link>
            </Button>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-card border rounded-xl p-4 mb-8 shadow-sm flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : displayedRestaurants.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {displayedRestaurants.map((r) => (
                <Link href={`/dashboard/restaurants/${r.id}`} key={r.id}>
                  <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-full border-muted/60 bg-gradient-to-br from-card to-secondary/5">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                          {r.name}
                        </CardTitle>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.status === RestaurantStatus.ACTIVE
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          } capitalize`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <CardDescription className="line-clamp-1">
                        {r.address}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {r.description}
                      </p>
                      <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center text-xs text-muted-foreground">
                        <span>Capacity: {r.capacity}</span>
                        <span>
                          {r.delivery_available ? "Delivery" : "Dine-in"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="min-w-[150px]"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No restaurants found.
            </p>
            {isManagement && (
              <Button variant="link" asChild className="mt-2">
                <Link href="/dashboard/restaurants/new">Create one now</Link>
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
