export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

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
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiSignup(data: any) {
  console.log(`API BASE URL:in signup  ${API_BASE_URL}`);
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
export async function verifyUser(token: string) {
  console.log(`API BASE URL in verify user   : ${API_BASE_URL}`);

  const res = await fetch(`${API_BASE_URL}/auth/verify?token=${token}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return handleResponse(res);
}
export async function getRestaurants(page = 1, pageSize = 20, query = "") {
  const res = await fetch(
    `${API_BASE_URL}/restaurants?page=${page}&page_size=${pageSize}&q=${query}`,
    {
      cache: "no-store",
    }
  );
  return handleResponse(res);
}

export async function createRestaurant(data: any, token: string) {
  const res = await fetch(`${API_BASE_URL}/restaurants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
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
