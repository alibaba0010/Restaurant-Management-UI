import { UserRole } from "./types";

const isServer = typeof window === "undefined";
export const API_BASE_URL = isServer
  ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"
  : "/api/v1";

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public title?: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true;
    // Check if expired (with 30s buffer)
    return Date.now() >= payload.exp * 1000 - 30000;
  } catch (e) {
    return true;
  }
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  title?: string;
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
    total_pages?: number;
  };
}

async function handleResponse<T = any>(res: Response): Promise<ApiResponse<T>> {
  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  if (!res.ok) {
    let message = "An error occurred";
    let title = "Error";
    let errorData = null;

    if (isJson) {
      try {
        const json = await res.json();
        message = json.message || json.error || message;
        title = json.title || title;
        errorData = json.data || json;
      } catch (e) {
        message = `Request failed with status ${res.status}`;
      }
    } else {
      message = `Request failed with status ${res.status}`;
    }

    throw new ApiError(message, res.status, title, errorData);
  }

  if (isJson) {
    const json = await res.json();
    return {
      data: json.data || json,
      message: json.message,
      title: json.title,
      meta: json.meta,
    };
  }

  return {
    data: null as T,
    message: "Success",
  };
}

type FetchOptions = RequestInit & {
  userAgent?: string;
  cookieHeader?: string;
};

import { useAuthStore } from "./store";

let refreshPromise: Promise<any> | null = null;

async function fetchClient(endpoint: string, options: FetchOptions = {}) {
  const { userAgent, cookieHeader, headers: customHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  // Set default content type if not provided and not FormData
  // Note: We check if body is FormData. In Node environment this might need check, but for client side it works.
  if (!headers["Content-Type"] && !(rest.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (userAgent) headers["User-Agent"] = userAgent;
  if (cookieHeader) headers["Cookie"] = cookieHeader;

  // If client-side and no specific token override (via Authorization header already), try to get from store
  if (!isServer && !headers["Authorization"]) {
    let token = useAuthStore.getState().accessToken;

    // Check if token is expired and refresh if necessary
    if (token && isTokenExpired(token)) {
      try {
        if (!refreshPromise) {
          refreshPromise = refreshSession().finally(() => {
            refreshPromise = null;
          });
        }
        const refresh = await refreshPromise;
        if (refresh.success && refresh.token) {
          useAuthStore.getState().setAccessToken(refresh.token);
          token = refresh.token;
        }
      } catch (error) {
        console.error("Auto-refresh failed", error);
        // Optionally redirect to login if refresh fails completely
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    credentials: "include",
    ...rest,
  });

  return handleResponse(res);
}

export async function apiSignin(data: any, userAgent?: string) {
  return fetchClient("/auth/signin", {
    method: "POST",
    body: JSON.stringify(data),
    userAgent,
  });
}

export async function apiSignup(data: any, userAgent?: string) {
  return fetchClient("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
    userAgent,
  });
}

export async function apiLogout(userAgent?: string) {
  return fetchClient("/user/logout", {
    method: "POST",
    userAgent,
  });
}

export async function verifyUser(token: string, userAgent?: string) {
  return fetchClient(`/auth/verify?token=${token}`, {
    method: "GET",
    userAgent,
  });
}

export async function getCurrentUser(
  token?: string,
  userAgent?: string,
  cookieHeader?: string
) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetchClient("/user", {
    headers,
    userAgent,
    cookieHeader,
    cache: "no-store",
  });
}

export async function apiRefreshToken(
  cookieHeader?: string,
  userAgent?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookieHeader) headers["Cookie"] = cookieHeader;
  if (userAgent) headers["User-Agent"] = userAgent;

  return fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers,
    credentials: "include",
  });
}

export async function refreshSession(
  cookieHeader?: string,
  userAgent?: string
) {
  const res = await apiRefreshToken(cookieHeader, userAgent);

  if (!res.ok) {
    return { success: false, token: null, message: "Refresh failed" };
  }

  // Extract token from Set-Cookie header
  const setCookies = res.headers.getSetCookie();
  const accessTokenCookie = setCookies.find((c) =>
    c.startsWith("access_token=")
  );
  let token = accessTokenCookie
    ? accessTokenCookie.split(";")[0].split("=")[1]
    : null;

  try {
    const data = await res.json();
    // Access token is now in the response body!
    const bodyToken = data.access_token || data.data?.access_token || null;
    if (bodyToken) token = bodyToken;

    return {
      success: true,
      token,
      message: data.message || data.title,
      setCookies,
    };
  } catch (e) {
    console.error("Failed to parse refresh response", e);
    return {
      success: false, // if we can't parse the new token, it's effectively a failure
      token: null,
      message: "Refresh failed to parse",
      setCookies,
    };
  }
}

export async function getAllUsers(
  page = 1,
  pageSize = 20,
  query = "",
  role: UserRole | string = "",
  sortBy = "created_at",
  order = "desc"
) {
  return fetchClient(
    `/user/users?page=${page}&page_size=${pageSize}&q=${query}&role=${role}&sort_by=${sortBy}&order=${order}`,
    {
      cache: "no-store",
    }
  );
}

export async function getUserById(id: string) {
  return fetchClient(`/user/${id}`, {
    cache: "no-store",
  });
}

export async function adminUpdateUser(
  id: string,
  data: { role?: string; status?: string }
) {
  return fetchClient(`/user/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateUser(data: {
  address?: string;
  phone_number?: string;
}) {
  return fetchClient("/user", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
export async function createRestaurant(data: any, token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetchClient("/restaurants", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function getRestaurants(page = 1, pageSize = 20, query = "") {
  return fetchClient(
    `/restaurants?page=${page}&page_size=${pageSize}&q=${query}`,
    {
      cache: "no-store",
    }
  );
}

export async function getRestaurantById(id: string) {
  return fetchClient(`/restaurants/${id}`, {
    cache: "no-store",
  });
}

export async function updateRestaurant(id: string, data: any) {
  return fetchClient(`/restaurants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiForgotPassword(
  data: { email: string },
  userAgent?: string
) {
  return fetchClient("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
    userAgent,
  });
}

export async function apiResetPassword(data: any, userAgent?: string) {
  return fetchClient("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
    userAgent,
  });
}

export async function getMenuUploadURL(filename: string, contentType: string) {
  return fetchClient(
    `/menus/upload-url?filename=${encodeURIComponent(
      filename
    )}&content_type=${encodeURIComponent(contentType)}`
  );
}

export async function uploadMenuMedia(file: File) {
  // Strategy: Use presigned URL for direct S3 upload to reduce latency
  try {
    const { data } = await getMenuUploadURL(file.name, file.type);
    const { upload_url, public_url } = data;

    const response = await fetch(upload_url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload to S3");
    }

    return { data: { url: public_url } };
  } catch (error) {
    console.error(
      "Presigned upload failed, falling back to server upload",
      error
    );

    // Fallback to server-side upload if presigned fails (e.g. CORS or auth)
    const formData = new FormData();
    formData.append("file", file);

    return fetchClient("/menus/upload", {
      method: "POST",
      body: formData,
    });
  }
}

export async function createMenu(data: any) {
  return fetchClient("/menus", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMenus(params: {
  page?: number;
  page_size?: number;
  q?: string;
  restaurant_id?: string;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  sort_by?: string;
  order?: "asc" | "desc";
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, value.toString());
  });

  return fetchClient(`/menus?${query.toString()}`, {
    cache: "no-store",
  });
}

export async function getMenuById(id: string) {
  return fetchClient(`/menus/${id}`, {
    cache: "no-store",
  });
}

export async function updateMenu(id: string, data: any) {
  return fetchClient(`/menus/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
