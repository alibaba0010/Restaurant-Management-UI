"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { UploadFormSchema } from "../../lib/definitions";
import { useState, useTransition } from "react";
import { useToast } from "../../hooks/use-toast";
import { Loader2, UploadCloud, Video, X } from "lucide-react";
import Image from "next/image";
import { Input } from "../ui/input";

export default function UploadForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof UploadFormSchema>>({
    resolver: zodResolver(UploadFormSchema),
    defaultValues: {
      images: undefined,
      video: undefined,
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newPreviews = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setImagePreviews(newPreviews);
      form.setValue("images", files as any);
    } else {
      setImagePreviews([]);
      form.setValue("images", undefined as any);
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoPreview(file.name);
      form.setValue("video", event.target.files as any);
    } else {
      setVideoPreview(null);
      form.setValue("video", undefined);
    }
  };

  function onSubmit(values: z.infer<typeof UploadFormSchema>) {
    startTransition(() => {
      // In a real app, you would upload files to a service like AWS S3
      console.log("Uploading files:", {
        images: values.images,
        video: values.video,
      });

      toast({
        title: "Upload Successful",
        description: "Your recipe media has been submitted.",
      });

      form.reset();
      setImagePreviews([]);
      setVideoPreview(null);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipe Images</FormLabel>
              <FormControl>
                <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <Input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isPending}
                  />
                </div>
              </FormControl>
              <FormMessage />
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePreviews.map((src, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-md overflow-hidden"
                    >
                      <Image
                        src={src}
                        alt={`Preview ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="video"
          render={() => (
            <FormItem>
              <FormLabel>Short Video (optional)</FormLabel>
              <FormControl>
                <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      Click to upload a video
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP4, MOV up to 50MB
                  </p>
                  <Input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="video/*"
                    onChange={handleVideoChange}
                    disabled={isPending}
                  />
                </div>
              </FormControl>
              <FormMessage />
              {videoPreview && (
                <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground truncate">
                    {videoPreview}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setVideoPreview(null);
                      form.setValue("video", undefined);
                    }}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload Media
        </Button>
      </form>
    </Form>
  );
}
