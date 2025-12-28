import { toast } from "../hooks/use-toast";
import { ApiError, ApiResponse } from "./api";

/**
 * Wrapper for API calls that automatically shows toast notifications
 * @param apiCall - The API function to call
 * @param options - Toast configuration options
 */
export async function withToast<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
  }
): Promise<T> {
  const {
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = true,
  } = options || {};

  try {
    const response = await apiCall();

    // Show success toast if enabled
    if (showSuccessToast) {
      const message =
        response.message ||
        response.title ||
        successMessage ||
        "Operation successful";
      toast({
        title: response.title || "Success",
        description: message,
        variant: "default",
      });
    }

    return response.data;
  } catch (error) {
    // Show error toast if enabled
    if (showErrorToast) {
      if (error instanceof ApiError) {
        toast({
          title: error.title || "Error",
          description: error.message || errorMessage || "An error occurred",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }

    throw error;
  }
}

/**
 * Show a success toast with server message or custom message
 */
export function showSuccessToast(
  serverMessage?: string,
  customMessage?: string,
  title?: string
) {
  toast({
    title: title || "Success",
    description:
      serverMessage || customMessage || "Operation completed successfully",
    variant: "default",
  });
}

/**
 * Show an error toast with server message or custom message
 */
export function showErrorToast(
  error: unknown,
  customMessage?: string,
  title?: string
) {
  if (error instanceof ApiError) {
    toast({
      title: title || error.title || "Error",
      description: error.message || customMessage || "An error occurred",
      variant: "destructive",
    });
  } else if (error instanceof Error) {
    toast({
      title: title || "Error",
      description: error.message || customMessage || "An error occurred",
      variant: "destructive",
    });
  } else {
    toast({
      title: title || "Error",
      description: customMessage || "An unexpected error occurred",
      variant: "destructive",
    });
  }
}
