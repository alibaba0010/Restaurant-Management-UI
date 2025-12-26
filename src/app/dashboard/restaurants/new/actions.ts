"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { RestaurantFormSchema } from "@/lib/definitions";
import { createRestaurant } from "@/lib/api";

export type CreateRestaurantState = {
  message?: string;
  errors?: {
    name?: string[];
    description?: string[];
    address?: string[];
    cuisine_type?: string[];
  };
  success?: boolean;
};

export async function createRestaurantAction(
  prevState: CreateRestaurantState,
  formData: FormData
): Promise<CreateRestaurantState> {
  const validatedFields = RestaurantFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    address: formData.get("address"),
    cuisine_type: formData.get("cuisine_type"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Restaurant.",
      success: false,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

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
