"use client";

import { useEffect, useState } from "react";
import { getMenus, getMenuCategories } from "@/lib/api";
import { Menu, MenuCategory } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Utensils } from "lucide-react";
import Image from "next/image";

interface MenuListProps {
  restaurantId: string;
  refreshTrigger?: number;
}

export function MenuList({ restaurantId, refreshTrigger }: MenuListProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await getMenuCategories(restaurantId);
        setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
  }, [restaurantId]);

  useEffect(() => {
    async function fetchMenus() {
      setLoading(true);
      try {
        setNextCursor(undefined);
        const params: any = { restaurant_id: restaurantId };
        if (selectedCategory !== "all") {
          params.category_id = selectedCategory;
        }
        const res = await getMenus(params);
        setMenus(res.data || []);
        setNextCursor(res.meta?.next_cursor);
        setHasMore(!!res.meta?.has_more);
      } catch (err) {
        console.error("Failed to fetch menus", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenus();
  }, [restaurantId, refreshTrigger, selectedCategory]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params: any = {
        restaurant_id: restaurantId,
        cursor: nextCursor,
      };
      if (selectedCategory !== "all") {
        params.category_id = selectedCategory;
      }
      const res = await getMenus(params);
      const newMenus = res.data || [];
      setMenus((prev) => [...prev, ...newMenus]);
      setNextCursor(res.meta?.next_cursor);
      setHasMore(!!res.meta?.has_more);
    } catch (err) {
      console.error("Failed to load more menus", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-32 bg-muted" />
            <CardHeader className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="rounded-full"
          >
            All Items
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="rounded-full"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      {menus.length === 0 && !loading ? (
        <div className="bg-muted/20 p-12 rounded-lg text-center text-muted-foreground border border-dashed">
          <Utensils className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No menu items found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menus.map((menu) => (
            <Card
              key={menu.id}
              className="overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="flex h-32">
                <div className="relative w-32 flex-shrink-0 bg-muted">
                  {menu.image_urls && menu.image_urls.length > 0 ? (
                    <Image
                      src={menu.image_urls[0]}
                      alt={menu.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Utensils className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-grow p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-accent">{menu.name}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-none"
                    >
                      ${parseFloat(menu.price).toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {menu.description}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {menu.prep_time_minutes || 15}m
                    </span>
                    {!!menu.calories && menu.calories > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {menu.calories} kcal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {hasMore && (
        <div className="flex justify-center">
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
    </div>
  );
}
