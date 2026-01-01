"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, UserRole } from "@/lib/types";
import { getMenuById, getMenus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
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
} from "lucide-react";
import Link from "next/link";

export default function MenuDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [relatedMenus, setRelatedMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null); // For lightbox/main view
  const [isVideo, setIsVideo] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Unwrap params using React.use()
  const { id } = use(params);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const { data: menuData } = await getMenuById(id);
        setMenu(menuData);

        if (menuData.image_urls.length > 0) {
          setSelectedMedia(menuData.image_urls[0]);
          setIsVideo(false);
        } else if (menuData.video_url) {
          setSelectedMedia(menuData.video_url);
          setIsVideo(true);
        }

        // Fetch related menus from the same restaurant
        if (menuData.restaurant_id) {
          const { data: relatedData } = await getMenus({
            restaurant_id: menuData.restaurant_id,
            page_size: 5,
          });
          // Filter out current menu
          setRelatedMenus(
            relatedData.filter((m: Menu) => m.id !== menuData.id)
          );
        }
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
        ...menu.image_urls.map((url) => ({ type: "image", url })),
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>
          {isOwner && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`/menus/${id}/edit`)}
            >
              <Edit className="w-4 h-4" />
              Edit Menu
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Media */}
          <div className="space-y-4">
            {/* Main Media Viewer */}
            <div
              className={`relative aspect-square sm:aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-muted-foreground/10 shadow-sm group ${
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
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  )}
                  {allMedia.length > 1 && (
                    <>
                      <button
                        onClick={handlePrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No media available
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {menu.video_url && (
                <button
                  onClick={() => handleMediaClick(menu.video_url!, true)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    isVideo && selectedMedia === menu.video_url
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <video
                    src={menu.video_url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </button>
              )}
              {menu.image_urls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMediaClick(url, false)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    !isVideo && selectedMedia === url
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-primary/50"
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

          {/* Right Column: Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-2">
                {menu.name}
              </h1>
              <p className="text-2xl font-semibold text-primary">
                ${menu.price.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {menu.prep_time_minutes && (
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{menu.prep_time_minutes} mins</span>
                </div>
              )}
              {menu.calories && (
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{menu.calories} kCal</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {menu.description || "No description available."}
              </p>
            </div>

            <div className="pt-6 border-t">
              <Button size="lg" className="w-full md:w-auto h-12 text-lg gap-2">
                <ShoppingCart className="w-5 h-5" />
                Add to Order
              </Button>
            </div>
          </div>
        </div>

        {/* Other Meals Section */}
        {relatedMenus.length > 0 && (
          <div className="mt-20 space-y-6">
            <h3 className="text-2xl font-bold font-display">
              More from this Restaurant
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedMenus.map((item) => (
                <Link
                  key={item.id}
                  href={`/menus/${item.id}`}
                  className="group block space-y-3"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                    {item.image_urls[0] ? (
                      <Image
                        src={item.image_urls[0]}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && selectedMedia && !isVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-primary transition-colors p-2"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative w-full max-w-5xl h-[80vh]">
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
