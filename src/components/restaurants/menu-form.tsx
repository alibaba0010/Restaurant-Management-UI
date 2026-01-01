"use client";

import { useState } from "react";
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
import { createMenu, uploadMenuMedia, updateMenu } from "@/lib/api";
import { Menu } from "@/lib/types";
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

const menuSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  prep_time_minutes: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: "Must be a number",
    }),
  calories: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: "Must be a number",
    }),
});

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
    initialData?.video_url || null
  );
  const [uploadingType, setUploadingType] = useState<"image" | "video" | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof menuSchema>>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price ? initialData.price.toString() : "",
      prep_time_minutes: initialData?.prep_time_minutes
        ? initialData.prep_time_minutes.toString()
        : "",
      calories: initialData?.calories ? initialData.calories.toString() : "",
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
      console.error(error);
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingType(null);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      await processFileUpload(file, type);
    }
    e.target.value = "";
  };

  const onSubmit = async (values: z.infer<typeof menuSchema>) => {
    try {
      const payload = {
        ...values,
        price: Number(values.price),
        prep_time_minutes: values.prep_time_minutes
          ? Number(values.prep_time_minutes)
          : 0,
        calories: values.calories ? Number(values.calories) : 0,
        restaurant_id: restaurantId,
        image_urls: images,
        video_url: video || "",
        is_available: true,
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
      toast({
        title: initialData
          ? "Failed to update menu item"
          : "Failed to create menu item",
        variant: "destructive",
      });
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
