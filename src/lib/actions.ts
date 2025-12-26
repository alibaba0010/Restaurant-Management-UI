"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SignupFormSchema, SigninFormSchema } from "./definitions";
import { apiSignin, apiSignup } from "./api";

export type SignupState = {
  message: string;
  success: boolean;
};

export async function signup(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const validatedFields = SignupFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: "Invalid form data. Please check your inputs.",
      success: false,
    };
  }

  // Authenticate with backend
  try {
    await apiSignup(validatedFields.data);
  } catch (error: any) {
    return {
      message: error.message || "Signup failed.",
      success: false,
    };
  }

  return {
    message:
      "Signup successful! Please check your email to verify your account.",
    success: true,
  };
}

export type SigninState = {
  message: string;
  success: boolean;
};

export async function signin(
  prevState: SigninState,
  formData: FormData
): Promise<SigninState> {
  const validatedFields = SigninFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      success: false,
    };
  }

  // Authenticate with backend
  const { email, password } = validatedFields.data;

  try {
    const response = await apiSignin({ email, password });

    // Set session cookie
    // @ts-ignore
    (await cookies()).set("access_token", response.data.access_token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60, // 15 minutes match backend
    });

    // Redirect handled after try-catch or return success
  } catch (error: any) {
    return {
      message: error.message || "Invalid credentials.",
      success: false,
    };
  }

  redirect("/dashboard");
}
