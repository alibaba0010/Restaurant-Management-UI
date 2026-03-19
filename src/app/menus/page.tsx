"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../../components/layout/header";
import Footer from "../../components/layout/footer";
import { getMenus } from "../../lib/api";
import { Menu } from "../../lib/types";
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
  SlidersHorizontal,
  Plus,
  Minus,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "../../components/ui/badge";
import { BackButton } from "../../components/ui/back-button";
import { useCartStore } from "../../lib/cart-store";
import { useToast } from "../../hooks/use-toast";
import { useTurnstile } from "../../hooks/use-turnstile";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuthStore } from "../../lib/store";

export default function MenusPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const { user } = useAuthStore();

  const {
    tokenRef,
    isReady: turnstileReady,
    siteKey: TURNSTILE_SITE_KEY,
    turnstileRef,
    handleVerify,
    handleExpire,
    handleError,
    turnstileError,
    consume: consumeTurnstile,
  } = useTurnstile();

  const initialFetchDone = useRef(false);
  const isAuth = !!user;

  const fetchMenus = useCallback(
    async (isLoadMore = false, cursor?: string) => {
      // Don't fetch if not auth and turnstile has an error (user needs to manually click)
      if (!isAuth && turnstileError && !tokenRef.current) return;

      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await getMenus(
          {
            cursor: isLoadMore ? cursor : undefined,
            page_size: 12,
            q: searchTerm,
            is_available: true,
            min_price: minPrice ? Number(minPrice) : undefined,
            max_price: maxPrice ? Number(maxPrice) : undefined,
            sort_by: sortBy,
            order: order,
          },
          tokenRef.current
        );

        // Consume the token after a successful request to trigger renewal for next interaction
        if (tokenRef.current && !isAuth) consumeTurnstile();

        if (isLoadMore) setMenus((prev) => [...prev, ...res.data]);
        else setMenus(res.data || []);

        setNextCursor(res.meta?.next_cursor);
        setHasMore(!!res.meta?.has_more);
      } catch (err: any) {
        console.error("Failed to fetch menus", err);
        // If it's a security/Turnstile error from the backend, trigger the manual block
        if (err.status === 403 || err.status === 400) {
          handleError();
          setError("Quick security check required. Please verify below.");
        } else {
          setError("We encountered an issue loading the menus. Please try again.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchTerm, minPrice, maxPrice, sortBy, order, tokenRef, consumeTurnstile, isAuth, turnstileError, handleError]
  );

  useEffect(() => {
    // If authenticated, we skip turnstile requirements completely!
    if ((isAuth || turnstileReady) && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchMenus(false);
    }
  }, [turnstileReady, isAuth, fetchMenus]);

  useEffect(() => {
    if (initialFetchDone.current) fetchMenus(false);
  }, [sortBy, order, fetchMenus]);

  const handleQuantityChange = (menu: Menu, delta: number) => {
    setQuantities((prev) => {
      const current = prev[menu.id] || 1;
      const next = current + delta;
      if (next > menu.stock_quantity) {
        toast({
          title: "Limit reached",
          description: `Only ${menu.stock_quantity} units available.`,
          variant: "destructive",
        });
        return prev;
      }
      return { ...prev, [menu.id]: Math.max(1, next) };
    });
  };

  const handleAddToCart = (e: React.MouseEvent, menu: Menu) => {
    e.stopPropagation();
    const qty = quantities[menu.id] || 1;
    addItem(menu, qty);
    toast({
      title: "Added to cart",
      description: `${qty}x ${menu.name} added successfully.`,
    });
    setQuantities((prev) => ({ ...prev, [menu.id]: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMenus(false);
  };

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    fetchMenus(true, nextCursor);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {!isAuth && TURNSTILE_SITE_KEY && (
        <div className={`transition-all duration-500 ease-in-out ${
          turnstileError 
          ? "flex items-center justify-center p-8 bg-slate-50 border-b border-rose-200" 
          : "hidden pointer-events-none opacity-0 h-0 w-0 overflow-hidden"
        }`}>
          {turnstileError && (
            <div className="flex flex-col items-center max-w-sm text-center mr-4">
              <span className="font-bold text-slate-800 text-lg">Security Check</span>
              <span className="text-slate-500 text-sm mt-1">Please check the box to continue viewing menus.</span>
            </div>
          )}
          <Turnstile
            key={turnstileError ? "visible" : "invisible"}
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => {
              if (turnstileError) {
                // If it was an error before, manually clear it and trigger fetch
                setError(null);
                initialFetchDone.current = false;
              }
              handleVerify(token);
            }}
            onError={handleError}
            onExpire={handleExpire}
            options={turnstileError ? {
              theme: "light",
            } : {
              execution: "render",
              appearance: "interaction-only",
              size: "invisible",
              theme: "light",
            }}
          />
        </div>
      )}

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

        {!isAuth && !turnstileReady && !loading && !turnstileError && (
          <div className="text-center py-6 text-muted-foreground text-sm animate-pulse">
            Completing security check…
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
              {menus.map((menu) => {
                const isOutOfStock = menu.stock_quantity <= 0;
                return (
                <Card
                  key={menu.id}
                  className={`overflow-hidden group transition-all duration-300 border-none shadow-md flex flex-col h-full bg-white sm:bg-card/30 ${
                    isOutOfStock
                      ? "opacity-60 cursor-not-allowed shadow-none"
                      : "hover:shadow-xl cursor-pointer"
                  }`}
                  onClick={() => !isOutOfStock && router.push(`/menus/${menu.id}`)}
                >
                  <div className="relative h-56 w-full overflow-hidden shrink-0">
                    {menu.image_urls && menu.image_urls.length > 0 ? (
                      <>
                        <Image
                          src={menu.image_urls[0]}
                          alt={menu.name}
                          fill
                          className={`object-cover transition-transform duration-500 ${
                            isOutOfStock ? "grayscale" : "group-hover:scale-110"
                          }`}
                          unoptimized
                        />
                        {!isOutOfStock && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted/30">
                        <Utensils className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Out of Stock Overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white/90 text-slate-800 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg border border-slate-200">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3">
                      <div className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        ₦{parseFloat(menu.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3 px-5 pt-4">
                    <CardTitle className="text-xl font-bold font-headline group-hover:text-primary transition-colors line-clamp-1">
                      {menu.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 line-clamp-2 min-h-[40px] leading-relaxed">
                      {menu.description || "Indulge in our signature flavors, crafted with the freshest ingredients."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 pt-0 mt-auto space-y-5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{menu.prep_time_minutes || 15} MINS</span>
                      </div>
                      {(menu.calories ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg">
                          <Flame className="h-3 w-3" />
                          <span>{menu.calories} KCAL</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-1 rounded-lg ${
                            isOutOfStock
                              ? "bg-slate-100 text-slate-400 line-through"
                              : menu.stock_quantity <= 5
                              ? "bg-rose-50 text-rose-600 font-bold"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {isOutOfStock ? "OUT OF STOCK" : `${menu.stock_quantity} LEFT`}
                        </span>
                      </div>
                    </div>

                    {isOutOfStock ? (
                      <Button
                        className="w-full h-11 rounded-2xl bg-slate-200 text-slate-400 font-bold cursor-not-allowed"
                        disabled
                      >
                        Out of Stock
                      </Button>
                    ) : (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex items-center bg-slate-100 rounded-2xl p-1 shadow-inner" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl hover:bg-white hover:text-primary hover:shadow-sm transition-all" 
                            onClick={() => handleQuantityChange(menu, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-slate-700">{quantities[menu.id] || 1}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl hover:bg-white hover:text-primary hover:shadow-sm transition-all" 
                            disabled={(quantities[menu.id] || 1) >= menu.stock_quantity} 
                            onClick={() => handleQuantityChange(menu, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button 
                          className="flex-grow h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 gap-2"
                          onClick={(e) => handleAddToCart(e, menu)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="min-w-[150px]">
                  {loadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-lg">
            <Utensils className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-2xl font-headline text-accent mb-2">No menus found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search terms or check back later.</p>
            <Button onClick={() => { setSearchTerm(""); fetchMenus(false); }}>Clear Filters</Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
