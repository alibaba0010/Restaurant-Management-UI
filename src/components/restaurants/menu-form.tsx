"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createMenu,
  uploadMenuMedia,
  updateMenu,
  getMenuCategories,
} from "@/lib/api";
import { Menu, MenuCategory } from "@/lib/types";
import {
  Loader2,
  UploadCloud,
  Video,
  X,
  Utensils,
  DollarSign,
  Clock,
  Flame,
  FileVideo,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { handleApiError } from "@/lib/utils";

const menuSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  prep_time_minutes: z.string(),
  calories: z.string(),
  stock_quantity: z.string(),
  is_vegetarian: z.boolean(),
  is_vegan: z.boolean(),
  is_gluten_free: z.boolean(),
  allergens: z.string(),
  tags: z.string(),
  is_available: z.boolean(),
  category_ids: z.array(z.string()),
});

interface MenuFormState {
  name: string;
  description: string;
  price: string;
  prep_time_minutes: string;
  calories: string;
  stock_quantity: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  allergens: string;
  tags: string;
  is_available: boolean;
  category_ids: string[];
}

interface MenuFormProps {
  restaurantId: string;
  initialData?: Menu;
  onSuccess?: () => void;
}

export function MenuForm({
  restaurantId,
  initialData,
  onSuccess,
}: MenuFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.image_urls || []);
  const [video, setVideo] = useState<string | null>(
    initialData?.video_url || null,
  );
  const [uploadingType, setUploadingType] = useState<"image" | "video" | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<
    MenuCategory[]
  >([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getMenuCategories(restaurantId);
        setAvailableCategories(res.data || []);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, [restaurantId]);

  const form = useForm<MenuFormState>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price ? initialData.price.toString() : "",
      prep_time_minutes: initialData?.prep_time_minutes
        ? initialData.prep_time_minutes.toString()
        : "",
      calories: initialData?.calories ? initialData.calories.toString() : "",
      stock_quantity: initialData?.stock_quantity
        ? initialData.stock_quantity.toString()
        : "0",
      is_vegetarian: initialData?.is_vegetarian || false,
      is_vegan: initialData?.is_vegan || false,
      is_gluten_free: initialData?.is_gluten_free || false,
      allergens: initialData?.allergens?.join(", ") || "",
      tags: initialData?.tags?.join(", ") || "",
      is_available: initialData?.is_available ?? true,
      category_ids: initialData?.categories?.map((c) => c.id) || [],
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle the first file for now, ideally check type
      const file = e.dataTransfer.files[0];
      const type = file.type.startsWith("image") ? "image" : "video";
      await processFileUpload(file, type);
    }
  };

  const processFileUpload = async (file: File, type: "image" | "video") => {
    setUploadingType(type);
    setUploadProgress(0);
    try {
      const res = await uploadMenuMedia(file, (progress) => {
        setUploadProgress(progress);
      });
      const url = res.data?.url || (res.data as any)?.data?.url;

      if (url) {
        if (type === "image") {
          setImages([...images, url]);
        } else {
          setVideo(url);
        }
        toast({ title: "Upload successful" });
      }
    } catch (error) {
      handleApiError(error, toast, "Upload failed");
    } finally {
      setUploadingType(null);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      await processFileUpload(file, type);
    }
    e.target.value = "";
  };

  const onSubmit = async (values: MenuFormState) => {
    try {
      const payload = {
        ...values,
        price: Number(values.price),
        prep_time_minutes: values.prep_time_minutes
          ? Number(values.prep_time_minutes)
          : 0,
        calories: values.calories ? Number(values.calories) : 0,
        stock_quantity: values.stock_quantity
          ? Number(values.stock_quantity)
          : 0,
        allergens: values.allergens
          ? values.allergens
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s !== "")
          : [],
        tags: values.tags
          ? values.tags
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s !== "")
          : [],
        restaurant_id: restaurantId,
        image_urls: images,
        video_url: video || "",
        is_available: values.is_available,
        category_ids: values.category_ids,
      };

      if (initialData) {
        await updateMenu(initialData.id, payload);
        toast({ title: "Menu item updated successfully" });
      } else {
        await createMenu(payload);
        toast({ title: "Menu item created successfully" });
      }

      // Only reset if creating new, or explicitly desired.
      // Usually keep form filled on update or close modal?
      // Since this behaves likely in a modal or separate page, onSuccess usually closes it.
      // If standalone page, maybe redirect?
      // If I am editing, I might not want to clear the form unless I close the edit view.
      // But typically `onSuccess` handles navigation.

      if (!initialData) {
        form.reset();
        setImages([]);
        setVideo(null);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      handleApiError(
        error,
        toast,
        initialData ? "Update failed" : "Creation failed",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          {/* Recipe Images */}
          <div className="space-y-2">
            <FormLabel className="text-accent font-semibold">
              Recipe Images
            </FormLabel>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 group ${
                dragActive
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                  : "border-muted-foreground/20 bg-muted/5 hover:bg-muted/10 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    <span className="text-primary hover:underline cursor-pointer">
                      Click to upload
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      or drag and drop
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG (large files supported)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileUpload(e, "image")}
                  disabled={!!uploadingType}
                />
              </div>
              {uploadingType === "image" && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl backdrop-blur-sm z-10 transition-all">
                  <div className="flex flex-col items-center gap-3 w-full max-w-[200px] px-4">
                    <div className="relative flex items-center justify-center">
                      <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                      <span className="absolute text-[10px] font-bold text-primary">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-primary animate-pulse">
                      Uploading image...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                {images.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden group border-2 border-muted/20 hover:border-primary/50 transition-all shadow-sm"
                  >
                    <Image
                      src={url}
                      alt="Menu Item"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={() =>
                          setImages(images.filter((_, idx) => idx !== i))
                        }
                        className="bg-destructive hover:bg-destructive/90 text-white p-1.5 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Short Video Section */}
          <div className="space-y-2">
            <FormLabel className="text-accent font-semibold">
              Short Video (optional)
            </FormLabel>
            {!video ? (
              <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 bg-muted/5 hover:bg-muted/10 hover:border-primary/50 transition-all group">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-4 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Video className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary hover:underline cursor-pointer">
                      Click to upload a video
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, MKV (large files supported)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileUpload(e, "video")}
                    disabled={!!uploadingType}
                  />
                </div>
                {uploadingType === "video" && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl backdrop-blur-sm z-10 transition-all">
                    <div className="flex flex-col items-center gap-3 w-full max-w-[200px] px-4">
                      <div className="relative flex items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                        <span className="absolute text-[10px] font-bold text-primary">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs font-medium text-primary animate-pulse">
                        Uploading video...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-muted/20 bg-black flex items-center justify-center group shadow-md max-w-sm">
                <FileVideo className="text-primary/40 w-12 h-12" />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileVideo className="w-4 h-4 text-primary" />
                    <span className="text-xs text-white font-medium truncate">
                      Recipe Video
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideo(null)}
                    className="bg-destructive/80 hover:bg-destructive text-white p-1 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Utensils className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Dish Name (e.g., Truffle Pasta)"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the flavors, ingredients..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_ids"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Categories</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Select the categories this item belongs to.
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableCategories.map((category) => (
                  <FormField
                    key={category.id}
                    control={form.control}
                    name="category_ids"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={category.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(category.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...field.value,
                                      category.id,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value: string) =>
                                          value !== category.id,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {category.name}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="calories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calories</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Flame className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="kCal"
                      className="pl-9"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="prep_time_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prep Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Minutes"
                      className="pl-9"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Utensils className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-9"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 border rounded-xl bg-muted/5">
          <FormField
            control={form.control}
            name="is_vegetarian"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <FormLabel>Vegetarian</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_vegan"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <FormLabel>Vegan</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_gluten_free"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <FormLabel>Gluten Free</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_available"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <FormLabel>Available</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="allergens"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allergens (comma separated)</FormLabel>
              <FormControl>
                <Input placeholder="Peanuts, Shellfish, Dairy..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (comma separated)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Spicy, Popular, Chef Choice..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || !!uploadingType}
          className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-semibold py-6 shadow-lg transition-transform active:scale-[0.98]"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Update Menu" : "Add Menu"}
        </Button>
      </form>
    </Form>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
