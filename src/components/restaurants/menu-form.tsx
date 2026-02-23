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
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { handleApiError } from "@/lib/utils";
import { CategoryManager } from "./category-manager";

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
  category_ids: z
    .array(z.string())
    .min(1, "You must select at least one category")
    .max(5, "You can select a maximum of 5 categories per menu item"),
});

type MenuFormState = z.infer<typeof menuSchema>;

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
  const [step, setStep] = useState<1 | 2>(1);
  const [images, setImages] = useState<string[]>(initialData?.image_urls || []);
  const [video, setVideo] = useState<string | null>(
    initialData?.video_url || null,
  );
  const [uploadingType, setUploadingType] = useState<"image" | "video" | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [videoDragActive, setVideoDragActive] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<
    MenuCategory[]
  >([]);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const res = await getMenuCategories(restaurantId);
      setAvailableCategories(res.data || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [restaurantId]);

  const form = useForm<MenuFormState>({
    resolver: zodResolver(menuSchema),
    mode: "onChange",
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

  const watchedName = form.watch("name");
  const watchedPrice = form.watch("price");
  const watchedCategoryIds = form.watch("category_ids");

  // Step 1 is valid when name is filled (min 2 chars)
  const step1Valid = watchedName.trim().length >= 2;

  // Step 2 is valid when price > 0 and at least 1 category selected
  const priceNum = Number(watchedPrice);
  const step2Valid =
    !isNaN(priceNum) &&
    priceNum > 0 &&
    watchedCategoryIds.length >= 1 &&
    !form.formState.isSubmitting &&
    !submitCooldown;

  // ——— File upload helpers ———
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Image zone only accepts image files
      if (file.type.startsWith("image")) {
        await processFileUpload(file, "image");
      }
    }
  };

  const handleVideoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover")
      setVideoDragActive(true);
    else if (e.type === "dragleave") setVideoDragActive(false);
  };

  const handleVideoDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVideoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video")) {
        await processFileUpload(file, "video");
      } else {
        toast({
          title: "Invalid file",
          description: "Please drop a video file.",
          variant: "destructive",
        });
      }
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
        if (type === "image") setImages((prev) => [...prev, url]);
        else setVideo(url);
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
    for (const file of Array.from(e.target.files)) {
      await processFileUpload(file, type);
    }
    e.target.value = "";
  };

  // ——— Submit ———
  const onSubmit = async (values: MenuFormState) => {
    setSubmitCooldown(true);
    setTimeout(() => setSubmitCooldown(false), 2000);
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
              .filter(Boolean)
          : [],
        tags: values.tags
          ? values.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
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

      if (!initialData) {
        form.reset();
        setImages([]);
        setVideo(null);
        setStep(1);
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

  // ——— Step indicator ———
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-6">
      {/* Step 1 bubble */}
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            step === 1
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
              : "bg-green-500 text-white"
          }`}
        >
          {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
        </div>
        <span
          className={`text-xs font-medium hidden sm:block ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}
        >
          Basic Info
        </span>
      </div>

      {/* Connector */}
      <div
        className={`h-0.5 w-10 sm:w-16 rounded-full transition-all duration-500 ${step > 1 ? "bg-primary" : "bg-muted"}`}
      />

      {/* Step 2 bubble */}
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            step === 2
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
        <span
          className={`text-xs font-medium hidden sm:block ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}
        >
          Details
        </span>
      </div>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
        <StepIndicator />

        {/* ───────────────────────── STEP 1 ───────────────────────── */}
        <div
          className={`space-y-5 transition-all duration-300 ${step === 1 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}`}
        >
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-destructive">*</span>
                </FormLabel>
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

          {/* Description */}
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
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recipe Images */}
          <div className="space-y-2">
            <FormLabel className="text-accent font-semibold">
              Recipe Images
            </FormLabel>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 group ${
                dragActive
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                  : "border-muted-foreground/20 bg-muted/5 hover:bg-muted/10 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    <span className="text-primary hover:underline cursor-pointer">
                      Click to upload
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      or drag & drop
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
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
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2 w-full max-w-[180px] px-4">
                    <div className="relative flex items-center justify-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
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
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
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
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Short Video */}
          <div className="space-y-2">
            <FormLabel className="text-accent font-semibold">
              Short Video{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </FormLabel>
            {!video ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 group ${
                  videoDragActive
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                    : "border-muted-foreground/20 bg-muted/5 hover:bg-muted/10 hover:border-primary/50"
                }`}
                onDragEnter={handleVideoDrag}
                onDragLeave={handleVideoDrag}
                onDragOver={handleVideoDrag}
                onDrop={handleVideoDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Video className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      <span className="text-primary hover:underline cursor-pointer">
                        Click to upload a video
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        or drag &amp; drop
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-2 w-full max-w-[180px] px-4">
                      <div className="relative flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
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
                <FileVideo className="text-primary/40 w-10 h-10" />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2.5 flex items-center justify-between">
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

          {/* Next button */}
          <Button
            type="button"
            onClick={() => setStep(2)}
            disabled={!step1Valid || !!uploadingType}
            className="w-full font-semibold py-5 gap-2 transition-all duration-200"
          >
            Continue to Details
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* ───────────────────────── STEP 2 ───────────────────────── */}
        <div
          className={`space-y-5 transition-all duration-300 ${step === 2 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}`}
        >
          {/* Categories */}
          <FormField
            control={form.control}
            name="category_ids"
            render={() => (
              <FormItem>
                <div className="mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <FormLabel className="text-base text-accent font-semibold">
                      Categories <span className="text-destructive">*</span>
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Select up to 5 categories this item belongs to.
                    </div>
                  </div>
                  <CategoryManager
                    restaurantId={restaurantId}
                    onCategoriesChange={fetchCategories}
                  />
                </div>

                {availableCategories.length === 0 ? (
                  <div className="p-6 bg-muted/20 border-2 border-dashed border-destructive/30 rounded-lg text-center">
                    <Flame className="w-8 h-8 text-destructive/50 mx-auto mb-2" />
                    <p className="text-destructive font-medium text-sm">
                      No categories found!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please add a category first using the manage categories
                      before you can assign items.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableCategories.map((category) => (
                      <FormField
                        key={category.id}
                        control={form.control}
                        name="category_ids"
                        render={({ field }) => {
                          const isChecked = field.value?.includes(category.id);
                          const isDisabled =
                            !isChecked && field.value?.length >= 5;
                          return (
                            <FormItem
                              key={category.id}
                              className={`flex flex-row items-center space-x-3 space-y-0 p-3 rounded-lg border transition-colors cursor-pointer ${
                                isChecked
                                  ? "bg-primary/5 border-primary/40 shadow-sm"
                                  : "hover:bg-muted/30 border-transparent"
                              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <FormControl>
                                <Checkbox
                                  checked={isChecked}
                                  disabled={isDisabled}
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
                              <FormLabel
                                className={`text-sm font-medium leading-none ${
                                  isDisabled
                                    ? "text-muted-foreground/50"
                                    : "cursor-pointer"
                                }`}
                              >
                                {category.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price + Calories */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Price <span className="text-destructive">*</span>
                  </FormLabel>
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

          {/* Prep Time + Stock */}
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
                  <FormLabel>Stock Qty</FormLabel>
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

          {/* Dietary toggles */}
          <div className="grid grid-cols-2 gap-3 p-4 border rounded-xl bg-muted/5">
            {(
              [
                { name: "is_vegetarian", label: "Vegetarian" },
                { name: "is_vegan", label: "Vegan" },
                { name: "is_gluten_free", label: "Gluten Free" },
                { name: "is_available", label: "Available" },
              ] as const
            ).map(({ name, label }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="text-sm">{label}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>

          {/* Allergens */}
          <FormField
            control={form.control}
            name="allergens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allergens (comma separated)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Peanuts, Shellfish, Dairy..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags */}
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

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="gap-2 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <Button
              type="submit"
              disabled={!step2Valid || !!uploadingType}
              className="flex-1 font-semibold py-5 gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg transition-all duration-200 active:scale-[0.98]"
            >
              {form.formState.isSubmitting || submitCooldown ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {initialData ? "Update Menu" : "Add Menu"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
