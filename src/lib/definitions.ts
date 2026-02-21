import * as z from "zod";

export const SignupFormSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const SigninFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/mov", "video/quicktime"];

export const UploadFormSchema = z.object({
  images: z
    .custom<FileList>()
    .refine(
      (files) => files && files.length > 0,
      "At least one image is required.",
    )
    .refine(
      (files) => Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
      `Max image size is 10MB.`,
    )
    .refine(
      (files) =>
        Array.from(files).every((file) =>
          ACCEPTED_IMAGE_TYPES.includes(file.type),
        ),
      "Only .jpg, .jpeg, .png, .gif and .webp formats are supported.",
    ),
  video: z
    .custom<FileList>()
    .refine(
      (files) => files && files.length === 1,
      "A single video file is required.",
    )
    .refine(
      (files) => files?.[0]?.size <= MAX_VIDEO_SIZE,
      `Max video size is 50MB.`,
    )
    .refine(
      (files) => ACCEPTED_VIDEO_TYPES.includes(files?.[0]?.type),
      "Only .mp4 and .mov formats are supported.",
    )
    .optional()
    .or(z.literal(null))
    .or(z.literal(undefined)),
});

export const AddressSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  post_code: z.string().optional(),
});

export const RestaurantFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100),
  description: z.string().max(500).optional(),
  address: AddressSchema,
  avatar_url: z.string().url().optional().or(z.literal("")),
  capacity: z.number().int().min(0).optional(),
  delivery_available: z.boolean().default(false),
  takeaway_available: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const MenuFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Price must be positive"),
  image_urls: z.array(z.string().url()).optional(),
  video_url: z.string().url().optional().or(z.literal("")),
  restaurant_id: z.string().uuid("Invalid restaurant ID"),
  category_ids: z.array(z.string().uuid()).max(5).optional(),
  tags: z.array(z.string()).optional(),
  is_available: z.boolean().default(true),
  prep_time_minutes: z.number().int().min(0).optional(),
  calories: z.number().int().min(0).optional(),
  stock_quantity: z.number().int().min(0).default(0),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_gluten_free: z.boolean().default(false),
  allergens: z.array(z.string()).optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: "Token is required." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

import { RestaurantStatus } from "./types";

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  avatar_url?: string;
  status: RestaurantStatus;
  user_id?: string;
  capacity?: number;
  delivery_available: boolean;
  takeaway_available: boolean;
  rating?: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}
