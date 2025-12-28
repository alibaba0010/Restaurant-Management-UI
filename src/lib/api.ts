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

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  title?: string;
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

async function fetchClient(endpoint: string, options: FetchOptions = {}) {
  const { userAgent, cookieHeader, headers: customHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (userAgent) headers["User-Agent"] = userAgent;
  if (cookieHeader) headers["Cookie"] = cookieHeader;

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
  // We need to return the raw response for refreshSession to parse Set-Cookie,
  // so we don't use fetchClient's handleResponse wrapper here entirely,
  // OR we modify fetchClient to return raw response if requested.
  // But simpler to just keep specific logic for this one or adapt fetchClient.
  // Actually, handleResponse throws if not OK, but returns object if OK.
  // apiRefreshToken is typically used by refreshSession which expects raw fetch response in the original code?
  // Checking original code: apiRefreshToken returns `fetch(...)`. It returns a Promise<Response>.
  // So we should NOT use fetchClient/handleResponse for apiRefreshToken.

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

/**
 * Shared helper to refresh session and extract the new access token.
 * Useful for both Middleware and Server Components (Layouts/Pages).
 */
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
  const token = accessTokenCookie
    ? accessTokenCookie.split(";")[0].split("=")[1]
    : null;

  try {
    const data = await res.json();
    return {
      success: true,
      token,
      message: data.message || data.title,
      setCookies,
    };
  } catch (e) {
    return {
      success: true,
      token,
      message: "Refreshed successfully",
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
  return fetchClient("/restaurant", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function getRestaurants(page = 1, pageSize = 20, query = "") {
  return fetchClient(
    `/restaurant?page=${page}&page_size=${pageSize}&q=${query}`,
    {
      cache: "no-store",
    }
  );
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
