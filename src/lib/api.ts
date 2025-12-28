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

export async function apiSignin(data: any) {
  const res = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function apiSignup(data: any) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function apiLogout() {
  const res = await fetch(`${API_BASE_URL}/user/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return handleResponse(res);
}

export async function verifyUser(token: string) {
  const res = await fetch(`${API_BASE_URL}/auth/verify?token=${token}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return handleResponse(res);
}

export async function getCurrentUser(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}/user`, {
    headers,
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function apiRefreshToken(cookieHeader?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
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
export async function refreshSession(cookieHeader?: string) {
  const res = await apiRefreshToken(cookieHeader);

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
  role: UserRole | string = ""
) {
  const res = await fetch(
    `${API_BASE_URL}/user/users?page=${page}&page_size=${pageSize}&q=${query}&role=${role}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );
  return handleResponse(res);
}

export async function getUserById(id: string) {
  const res = await fetch(`${API_BASE_URL}/user/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function adminUpdateUser(
  id: string,
  data: { role?: string; status?: string }
) {
  const res = await fetch(`${API_BASE_URL}/user/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function apiUpdateUser(data: {
  address?: string;
  phone_number?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/user`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return handleResponse(res);
}
export async function createRestaurant(data: any, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}/restaurant`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function getRestaurants(page = 1, pageSize = 20, query = "") {
  const res = await fetch(
    `${API_BASE_URL}/restaurant?page=${page}&page_size=${pageSize}&q=${query}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );
  return handleResponse(res);
}
