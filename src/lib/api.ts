import { UserRole } from "./types";

const isServer = typeof window === "undefined";
export const API_BASE_URL = isServer
  ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"
  : "/api/v1";

export class ApiError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    let message = "An error occurred";
    try {
      const json = await res.json();
      message = json.message || json.title || message;
    } catch (e) {}
    throw new ApiError(message, res.status);
  }
  return res.json();
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

export async function updateUserRole(id: string, role: UserRole) {
  const res = await fetch(`${API_BASE_URL}/user/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
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
