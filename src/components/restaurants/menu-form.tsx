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
import { createMenu, uploadMenuMedia } from "@/lib/api";
import {
  Loader2,
  Upload,
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
  onSuccess?: () => void;
}

export function MenuForm({ restaurantId, onSuccess }: MenuFormProps) {
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof menuSchema>>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      prep_time_minutes: "",
      calories: "",
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
    setUploading(true);
    try {
      const res = await uploadMenuMedia(file);
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
      setUploading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processFileUpload(e.target.files[0], type);
    e.target.value = "";
  };

  const onSubmit = async (values: z.infer<typeof menuSchema>) => {
    try {
      await createMenu({
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
      });
      toast({ title: "Menu item created successfully" });
      form.reset();
      setImages([]);
      setVideo(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({ title: "Failed to create menu item", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 bg-muted/20 hover:bg-muted/40 transition-colors text-center ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-background rounded-full shadow-sm">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Upload Media</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag & drop or select files
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs h-8"
                  disabled={uploading}
                  onClick={() =>
                    document.getElementById("image-upload-trigger")?.click()
                  }
                >
                  <ImageIcon className="w-3 h-3 mr-2" /> Image
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs h-8"
                  disabled={uploading}
                  onClick={() =>
                    document.getElementById("video-upload-trigger")?.click()
                  }
                >
                  <FileVideo className="w-3 h-3 mr-2" /> Video
                </Button>
              </div>

              <input
                type="file"
                accept="image/*"
                id="image-upload-trigger"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "image")}
              />
              <input
                type="file"
                accept="video/*"
                id="video-upload-trigger"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "video")}
              />
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Media Previews */}
          {(images.length > 0 || video) && (
            <div className="flex gap-2 p-2 bg-muted/10 rounded-lg overflow-x-auto">
              {images.map((url, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden group border bg-background shadow-sm"
                >
                  <Image
                    src={url}
                    alt="Menu Item"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages(images.filter((_, idx) => idx !== i))
                    }
                    className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-white transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {video && (
                <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden group border bg-black flex items-center justify-center">
                  <FileVideo className="text-white/50 w-6 h-6" />
                  <button
                    type="button"
                    onClick={() => setVideo(null)}
                    className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-white transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
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
          disabled={form.formState.isSubmitting || uploading}
          className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-semibold py-6 shadow-lg transition-transform active:scale-[0.98]"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add to Menu
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
