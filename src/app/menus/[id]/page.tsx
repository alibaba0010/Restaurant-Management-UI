"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, UserRole } from "@/lib/types";
import { getMenuById, getMenus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart-store";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Play,
  X,
  Edit,
  ShoppingCart,
  Plus,
  Minus,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function MenuDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [relatedMenus, setRelatedMenus] = useState<Menu[]>([]);
  const [categoryMenus, setCategoryMenus] = useState<Menu[]>([]);
  const [priceRangeMenus, setPriceRangeMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Unwrap params using React.use()
  const { id } = use(params);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const { data: menuData } = await getMenuById(id);
        setMenu(menuData);

        if (menuData.image_urls && menuData.image_urls.length > 0) {
          setSelectedMedia(menuData.image_urls[0]);
          setIsVideo(false);
        } else if (menuData.video_url) {
          setSelectedMedia(menuData.video_url);
          setIsVideo(true);
        }

        const price = parseFloat(menuData.price);

        // Parallel fetch for recommendations
        const [relatedRes, categoryRes, priceRes] = await Promise.all([
          // 1. More from this restaurant
          getMenus({ restaurant_id: menuData.restaurant_id, page_size: 5 }),
          // 2. Same Category
          menuData.categories?.[0]
            ? getMenus({ category_id: menuData.categories[0].id, page_size: 5 })
            : Promise.resolve({ data: [] }),
          // 3. Similar Price Range (+/- 20%)
          getMenus({
            min_price: price * 0.8,
            max_price: price * 1.2,
            page_size: 5,
          }),
        ]);

        setRelatedMenus(
          (relatedRes.data || []).filter((m: Menu) => m.id !== id),
        );
        setCategoryMenus(
          (categoryRes.data || []).filter((m: Menu) => m.id !== id),
        );
        setPriceRangeMenus(
          (priceRes.data || []).filter((m: Menu) => m.id !== id),
        );
      } catch (error) {
        console.error("Failed to fetch menu details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold">Menu Item Not Found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const handleMediaClick = (url: string, isVid: boolean) => {
    setSelectedMedia(url);
    setIsVideo(isVid);
  };

  const openLightbox = () => {
    if (selectedMedia && !isVideo) {
      setLightboxOpen(true);
    }
  };

  const isOwner = user?.role === UserRole.MANAGEMENT && menu.restaurant_id; // Ideally check ownership against restaurant.user_id, but here we just check role for now or need refetch

  const allMedia = menu
    ? [
        ...(menu.video_url ? [{ type: "video", url: menu.video_url }] : []),
        ...menu.image_urls
          .filter((url) => !!url)
          .map((url) => ({ type: "image", url })),
      ]
    : [];

  const currentIndex = allMedia.findIndex((m) => m.url === selectedMedia);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allMedia.length <= 1) return;
    const nextIndex = (currentIndex + 1) % allMedia.length;
    const next = allMedia[nextIndex];
    handleMediaClick(next.url, next.type === "video");
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allMedia.length <= 1) return;
    const prevIndex = (currentIndex - 1 + allMedia.length) % allMedia.length;
    const prev = allMedia[prevIndex];
    handleMediaClick(prev.url, prev.type === "video");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Sticky Sub-Header for Navigation */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-16 z-30 transition-all duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 -ml-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">Back to Menus</span>
          </Button>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/20 hover:border-primary/50 text-primary"
              onClick={() => router.push(`/menus/${id}/edit`)}
            >
              <Edit className="w-4 h-4" />
              Manage Menu
            </Button>
          )}
        </div>
      </div>

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Main Content Card */}
          <div className="bg-card rounded-3xl border shadow-xl overflow-hidden mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Column: Media Section */}
              <div className="p-6 lg:p-8 space-y-6 lg:border-r">
                <div
                  className={`relative aspect-square rounded-2xl overflow-hidden bg-muted group transition-all duration-500 hover:shadow-2xl ${
                    !isVideo ? "cursor-zoom-in" : ""
                  }`}
                  onClick={openLightbox}
                >
                  {selectedMedia ? (
                    <>
                      {isVideo ? (
                        <video
                          src={selectedMedia}
                          controls
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <Image
                          src={selectedMedia}
                          alt={menu.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          unoptimized
                        />
                      )}
                      {allMedia.length > 1 && (
                        <>
                          <button
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-10"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-10"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                      <Utensils className="h-12 w-12 opacity-20" />
                      <p className="text-sm font-medium">No media available</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Thumbnails with Active States */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                  {menu.video_url && (
                    <button
                      onClick={() => handleMediaClick(menu.video_url!, true)}
                      className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        isVideo && selectedMedia === menu.video_url
                          ? "border-primary ring-4 ring-primary/10 scale-95"
                          : "border-transparent hover:border-primary/40 grayscale hover:grayscale-0"
                      }`}
                    >
                      <video
                        src={menu.video_url}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                      </div>
                    </button>
                  )}
                  {menu.image_urls
                    .filter((url) => !!url)
                    .map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMediaClick(url, false)}
                        className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          !isVideo && selectedMedia === url
                            ? "border-primary ring-4 ring-primary/10 scale-95"
                            : "border-transparent hover:border-primary/40 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                </div>
              </div>

              {/* Right Column: Pricing & Interaction */}
              <div className="flex flex-col p-6 lg:p-10 bg-muted/5">
                <div className="flex-grow space-y-8">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {menu.categories?.map((c) => (
                        <Badge
                          key={c.id}
                          variant="secondary"
                          className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/10"
                        >
                          {c.name}
                        </Badge>
                      ))}
                      {menu.stock_quantity < 10 && (
                        <Badge variant="destructive" className="animate-pulse">
                          Low Stock: {menu.stock_quantity} left
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-accent">
                      {menu.name}
                    </h1>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">
                        ${parseFloat(menu.price).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground line-through text-lg opacity-50">
                        ${(parseFloat(menu.price) * 1.2).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {menu.prep_time_minutes && (
                      <div className="flex items-center gap-2.5 bg-background shadow-sm border px-4 py-2.5 rounded-2xl transition-transform hover:scale-105">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold">
                          {menu.prep_time_minutes} min prep
                        </span>
                      </div>
                    )}
                    {menu.calories && (
                      <div className="flex items-center gap-2.5 bg-background shadow-sm border px-4 py-2.5 rounded-2xl transition-transform hover:scale-105">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-semibold">
                          {menu.calories} kCal
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-accent/80 border-l-4 border-primary pl-3">
                      Culinary Story
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-lg italic">
                      {menu.description ||
                        "No description provided for this culinary masterpiece."}
                    </p>
                  </div>
                </div>

                {/* Premium Action Area */}
                <div className="mt-12 pt-8 border-t space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-between bg-background p-6 rounded-3xl border shadow-sm">
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <span className="text-xs uppercase font-black tracking-widest text-muted-foreground px-1">
                        Select Quantity
                      </span>
                      <div className="flex items-center border-2 border-primary/10 rounded-2xl bg-muted/10 p-1.5 w-max mx-auto sm:mx-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-background shadow-sm active:scale-90 transition-all"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-14 text-center text-xl font-black text-accent">
                          {quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-10 w-10 rounded-xl hover:bg-background shadow-sm active:scale-90 transition-all ${
                            menu
                              ? quantity >= menu.stock_quantity
                                ? "opacity-30 cursor-not-allowed"
                                : ""
                              : ""
                          }`}
                          onClick={() => {
                            if (menu && quantity < menu.stock_quantity) {
                              setQuantity(quantity + 1);
                            } else if (menu) {
                              toast({
                                title: "Stock Limit",
                                description: `We only have ${menu.stock_quantity} available.`,
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={
                            menu ? quantity >= menu.stock_quantity : false
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full sm:flex-1 h-16 text-xl gap-3 rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 lg:max-w-xs"
                      onClick={() => {
                        if (menu) {
                          addItem(menu, quantity);
                          toast({
                            title: "Cart Updated",
                            description: `${quantity}x ${menu.name} ready for checkout!`,
                          });
                        }
                      }}
                    >
                      <ShoppingCart className="w-6 h-6" />
                      Add to Order
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Recommendation Engine */}
          <div className="space-y-16 pb-12">
            {/* 1. Same Category */}
            {categoryMenus.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black font-headline text-accent">
                      Similar Flavors
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Based on your interest in{" "}
                      {menu.categories?.[0]?.name || "this category"}
                    </p>
                  </div>
                  <Button variant="ghost" asChild className="group">
                    <Link href="/menus" className="flex items-center gap-2">
                      View all{" "}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {categoryMenus.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* 2. Same Price Range */}
            {priceRangeMenus.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black font-headline text-accent">
                      Similar Budget
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Gourmet experiences within your price range
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {priceRangeMenus.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* 3. From same restaurant */}
            {relatedMenus.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black font-headline text-accent">
                      More from {menu.name.split(" ")[0]} Hub
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Discover more delights from this restaurant
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedMenus.slice(0, 4).map((item) => {
                    const firstValidImage = item.image_urls.find(
                      (url) => !!url,
                    );
                    return (
                      <Link
                        key={item.id}
                        href={`/menus/${item.id}`}
                        className="group block bg-card rounded-2xl overflow-hidden border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                      >
                        <div className="relative aspect-video bg-muted">
                          {firstValidImage ? (
                            <Image
                              src={firstValidImage}
                              alt={item.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <Utensils className="w-8 h-8 opacity-10" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px] font-bold">
                            ${parseFloat(item.price).toFixed(2)}
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-accent group-hover:text-primary transition-colors line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Lightbox Component */}
      {lightboxOpen && selectedMedia && !isVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-lg animate-in fade-in duration-300"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-8 right-8 text-white hover:text-primary transition-all p-3 bg-white/10 rounded-full hover:bg-white/20"
          >
            <X className="w-10 h-10" />
          </button>
          <div className="relative w-full max-w-6xl h-[85vh] transition-transform duration-500 hover:scale-105">
            <Image
              src={selectedMedia}
              alt="Fullscreen view"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ item }: { item: Menu }) {
  const firstValidImage = item.image_urls.find((url) => !!url);
  return (
    <Link
      href={`/menus/${item.id}`}
      className="group block space-y-3 p-2 bg-card/50 hover:bg-card border border-transparent hover:border-primary/20 rounded-2xl transition-all duration-300 hover:shadow-xl"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
        {firstValidImage ? (
          <Image
            src={firstValidImage}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Utensils className="w-8 h-8 opacity-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="px-1">
        <h4 className="font-bold text-sm text-accent group-hover:text-primary transition-colors line-clamp-1">
          {item.name}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-primary font-bold text-sm">
            ${parseFloat(item.price).toFixed(2)}
          </span>
          {item.prep_time_minutes && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {item.prep_time_minutes}m
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
