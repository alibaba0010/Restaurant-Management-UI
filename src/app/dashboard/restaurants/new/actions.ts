"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { RestaurantFormSchema } from "@/lib/definitions";
import { createRestaurant } from "@/lib/api";
import { getServerTokens } from "@/lib/server-tokens";

export type CreateRestaurantState = {
  message?: string;
  errors?: {
    name?: string[];
    description?: string[];
    address?: {
      address?: string[];
      city?: string[];
      country?: string[];
      post_code?: string[];
    };
    avatar_url?: string[];
    capacity?: string[];
  };
  success?: boolean;
};

export async function createRestaurantAction(
  prevState: CreateRestaurantState,
  formData: FormData,
): Promise<CreateRestaurantState> {
  const validatedFields = RestaurantFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    address: {
      address: formData.get("address"),
      city: formData.get("city"),
      country: formData.get("country"),
      post_code: formData.get("post_code") || undefined,
    },
    avatar_url: formData.get("avatar_url"),
    capacity: formData.get("capacity")
      ? Number(formData.get("capacity"))
      : undefined,
    delivery_available: formData.get("delivery_available") === "true",
    takeaway_available: formData.get("takeaway_available") === "true",
    latitude: formData.get("latitude")
      ? Number(formData.get("latitude"))
      : undefined,
    longitude: formData.get("longitude")
      ? Number(formData.get("longitude"))
      : undefined,
    account_number: formData.get("account_number") || undefined,
    bank_name: formData.get("bank_name") || undefined,
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.format();
    return {
      errors: {
        name: fieldErrors.name?._errors,
        description: fieldErrors.description?._errors,
        address: {
          address: fieldErrors.address?.address?._errors,
          city: fieldErrors.address?.city?._errors,
          country: fieldErrors.address?.country?._errors,
          post_code: fieldErrors.address?.post_code?._errors,
        },
        avatar_url: fieldErrors.avatar_url?._errors,
        capacity: fieldErrors.capacity?._errors,
      },
      message: "Missing Fields. Failed to Create Restaurant.",
      success: false,
    };
  }

  const { accessToken: token } = await getServerTokens();

  if (!token) {
    return {
      message: "Unauthorized. Please sign in.",
      success: false,
    };
  }

  try {
    await createRestaurant(validatedFields.data, token);
  } catch (error: any) {
    return {
      message: error.message || "Failed to create restaurant.",
      success: false,
    };
  }

  redirect("/dashboard");
}
