"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "@/lib/types";
import { getMenuById } from "@/lib/api";
import { MenuForm } from "@/components/restaurants/menu-form";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { BackButton } from "@/components/ui/back-button";

export default function EditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);

  // Unwrap params
  const { id } = use(params);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await getMenuById(id);
        setMenu(res.data);
      } catch (error) {
        console.error("Failed to fetch menu", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold">Menu not found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <BackButton label="Back to Menu" href={`/menus/${id}`} />
        <div className="space-y-6">
          <h1 className="text-3xl font-bold font-headline mb-8">
            Edit Menu Item
          </h1>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <MenuForm
              restaurantId={menu.restaurant_id}
              initialData={menu}
              onSuccess={() => {
                // Navigate back to menu details on success
                router.push(`/menus/${id}`);
                router.refresh();
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
