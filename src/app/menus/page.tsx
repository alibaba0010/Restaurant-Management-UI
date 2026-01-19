"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "../../components/layout/header";
import Footer from "../../components/layout/footer";
import { getMenus } from "../../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Input as CustomInput } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Search,
  Utensils,
  Clock,
  Flame,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "../../components/ui/badge";
import { BackButton } from "../../components/ui/back-button";

export default function MenusPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchMenus(isLoadMore = false) {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const cursorToUse = isLoadMore ? nextCursor : undefined;
      const res = await getMenus({
        cursor: cursorToUse,
        page_size: 12,
        q: searchTerm,
        is_available: true,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        sort_by: sortBy,
        order: order,
      });

      if (isLoadMore) {
        setMenus((prev) => [...prev, ...res.data]);
      } else {
        setMenus(res.data || []);
      }

      setNextCursor(res.meta?.next_cursor);
      setHasMore(!!res.meta?.has_more);
    } catch (err) {
      console.error("Failed to fetch menus", err);
      setError("We encountered an issue loading the menus. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchMenus(false);
  }, [sortBy, order]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMenus(false);
  };

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    fetchMenus(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <BackButton label="Go Back Home" href="/" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold text-accent">
              Explore Menus
            </h1>
            <p className="text-muted-foreground text-sm">
              Discover delicious dishes from our partner restaurants.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex gap-2 w-full">
              <div className="relative flex-grow md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <CustomInput
                  placeholder="Search dishes..."
                  className="pl-10 h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                <select
                  className="h-10 text-xs border-input bg-background rounded-md px-2 border focus:ring-1 focus:ring-primary outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="calories">Sort by Calories</option>
                  <option value="created_at">Sort by Newest</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-2 group"
                  onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                >
                  {order === "asc" ? "↑" : "↓"}
                </Button>
                <Button type="submit" className="h-10 text-sm">
                  Search
                </Button>
              </div>
            </form>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-1 px-3 rounded-full border border-dashed transition-colors hover:border-primary/50">
                <SlidersHorizontal className="h-3 w-3" />
                <span>Budget:</span>
                <input
                  type="number"
                  placeholder="Min"
                  className="w-12 bg-transparent border-none focus:ring-0 p-0 text-center"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="opacity-30">|</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-12 bg-transparent border-none focus:ring-0 p-0 text-center"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              {(minPrice || maxPrice) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold text-primary hover:bg-primary/5"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    fetchMenus(false);
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-8 text-sm text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : menus.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menus.map((menu) => (
                <Card
                  key={menu.id}
                  className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none shadow-md cursor-pointer"
                  onClick={() => router.push(`/menus/${menu.id}`)}
                >
                  <div className="relative h-48 w-full bg-muted">
                    {menu.image_urls && menu.image_urls.length > 0 ? (
                      <Image
                        src={menu.image_urls[0]}
                        alt={menu.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Utensils className="h-12 w-12" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-primary/90 hover:bg-primary">
                      ${menu.price.toFixed(2)}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors line-clamp-1">
                      {menu.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {menu.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{menu.prep_time_minutes || 15} mins</span>
                      </div>
                      {menu.calories > 0 && (
                        <div className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span>{menu.calories} kcal</span>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full bg-accent hover:bg-accent/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/dashboard/restaurants/${menu.restaurant_id}`,
                        );
                      }}
                    >
                      View Restaurant
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="min-w-[150px]"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-lg">
            <Utensils className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-2xl font-headline text-accent mb-2">
              No menus found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search terms or check back later.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                fetchMenus(false);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
