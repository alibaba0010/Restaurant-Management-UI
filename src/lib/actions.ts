"use server";

import {
  SignupFormSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "./definitions";
import { apiSignup, apiForgotPassword, apiResetPassword } from "./api";
import { headers } from "next/headers";

export type SignupState = {
  message: string;
  success: boolean;
};

export type ForgotPasswordState = {
  message: string;
  success: boolean;
};

export type ResetPasswordState = {
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
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const response = await apiSignup(validatedFields.data, userAgent);
    return {
      message:
        response.message ||
        "Signup successful! Please check your email to verify your account.",
      success: true,
    };
  } catch (error: any) {
    return {
      message: error.message || "Signup failed.",
      success: false,
    };
  }
}

export async function forgotPassword(
  prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const validatedFields = ForgotPasswordSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: "Invalid email address.",
      success: false,
    };
  }

  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const response = await apiForgotPassword(validatedFields.data, userAgent);
    return {
      message:
        response.message ||
        "Password reset link sent! Please check your email.",
      success: true,
    };
  } catch (error: any) {
    return {
      message: error.message || "Failed to send password reset email.",
      success: false,
    };
  }
}

export async function resetPassword(
  prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const validatedFields = ResetPasswordSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const message =
      validatedFields.error.flatten().formErrors[0] || "Invalid password data.";
    return {
      message,
      success: false,
    };
  }

  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const response = await apiResetPassword(validatedFields.data, userAgent);
    return {
      message:
        response.message ||
        "Password reset successful! Please sign in with your new password.",
      success: true,
    };
  } catch (error: any) {
    return {
      message: error.message || "Failed to reset password.",
      success: false,
    };
  }
}
