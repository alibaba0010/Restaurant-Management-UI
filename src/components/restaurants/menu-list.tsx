"use client";

import { useEffect, useState } from "react";
import { getMenus } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, Utensils } from "lucide-react";
import Image from "next/image";

interface MenuListProps {
  restaurantId: string;
  refreshTrigger?: number;
}

export function MenuList({ restaurantId, refreshTrigger }: MenuListProps) {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMenus() {
      setLoading(true);
      try {
        const res = await getMenus({ restaurant_id: restaurantId });
        setMenus(res.data || []);
      } catch (err) {
        console.error("Failed to fetch menus", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenus();
  }, [restaurantId, refreshTrigger]);

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

  if (menus.length === 0) {
    return (
      <div className="bg-muted/20 p-12 rounded-lg text-center text-muted-foreground border border-dashed">
        <Utensils className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No menu items found for this restaurant.</p>
      </div>
    );
  }

  return (
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
                  ${menu.price.toFixed(2)}
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
                {menu.calories > 0 && (
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
  );
}
