import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ApiError } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleApiError(
  error: any,
  toast: any,
  defaultTitle: string = "Error",
) {
  console.error(error);

  if (error instanceof ApiError) {
    toast({
      title: error.title || defaultTitle,
      description: `${error.message}${error.requestId ? ` (Ref: ${error.requestId.slice(0, 8)})` : ""}`,
      variant: "destructive",
    });
    return;
  }

  toast({
    title: defaultTitle,
    description: error.message || "An unexpected error occurred",
    variant: "destructive",
  });
}
