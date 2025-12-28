"use server";

import { SignupFormSchema } from "./definitions";
import { apiSignup } from "./api";

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
    const response = await apiSignup(validatedFields.data);
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
