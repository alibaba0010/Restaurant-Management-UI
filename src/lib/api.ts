import {
  UserRole,
  Menu,
  MenuCategory,
  Restaurant,
  Order,
  OrderItem,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"; // Use direct URL in dev to avoid proxy timeouts

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public title?: string,
    public data?: any,
    public requestId?: string | null,
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
  request_id?: string;
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
    total_pages?: number;
    next_cursor?: string;
    has_more?: boolean;
  };
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1s
const DEFAULT_TIMEOUT = 15000; // 15s

async function handleResponse<T = any>(res: Response): Promise<ApiResponse<T>> {
  const contentType = res.headers.get("content-type");
  const headerRequestId = res.headers.get("X-Request-ID");
  const isJson = contentType?.includes("application/json");

  if (!res.ok) {
    let message = "An error occurred";
    let title = "Error";
    let errorData = null;
    let bodyRequestId = null;

    if (isJson) {
      try {
        const json = await res.json();
        message = json.message || json.error || message;
        title = json.title || title;
        errorData = json.data || json.response || json;
        bodyRequestId = json.request_id || json.requestId;
      } catch (e) {
        message = `Request failed with status ${res.status}`;
      }
    } else {
      message = `Request failed with status ${res.status}`;
    }

    if (res.status === 429) {
      title = "Too Many Requests";
      message =
        "You are doing that too much. Our rate limiter has kicked in. Please wait a moment before trying again.";
    } else if (res.status >= 500) {
      title = "Server Error";
      message =
        "We're experiencing some technical difficulties on our end. Our engineers have been notified.";
    } else if (
      res.status === 403 &&
      (message.toLowerCase().includes("turnstile") ||
        message.toLowerCase().includes("captcha"))
    ) {
      title = "Security Verification Failed";
      message = "Please complete the security challenge to proceed.";
    }

    const requestId = headerRequestId || bodyRequestId;
    if (requestId) {
      console.error(
        `[API Error] ${title}: ${message} (Request ID: ${requestId})`,
      );
    }

    throw new ApiError(message, res.status, title, errorData, requestId);
  }

  if (isJson) {
    const json = await res.json();
    return {
      data: json.data || json.response || json,
      message: json.message,
      title: json.title,
      request_id: json.request_id || headerRequestId || undefined,
      meta: json.meta,
    };
  }

  return {
    data: null as T,
    message: "Success",
    request_id: headerRequestId || undefined,
  };
}

type FetchOptions = RequestInit & {
  userAgent?: string;
  cookieHeader?: string;
  turnstileToken?: string;
  timeout?: number;
  retries?: number;
};

import { useAuthStore } from "./store";

let refreshPromise: Promise<any> | null = null;

/**
 * Enhanced fetch client with retries, timeouts, and production-grade observability.
 */
async function fetchClient<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const {
    userAgent,
    cookieHeader,
    headers: customHeaders,
    turnstileToken,
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    ...rest
  } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (!headers["Content-Type"] && !(rest.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (userAgent) headers["User-Agent"] = userAgent;
  if (cookieHeader) headers["Cookie"] = cookieHeader;

  // Cloudflare Turnstile Support
  if (turnstileToken) {
    headers["X-Turnstile-Token"] = turnstileToken;
  }

  if (!headers["Authorization"]) {
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
        console.error("[Auth] Auto-refresh failed", error);
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(
          `[API] Retrying request to ${endpoint} (Attempt ${attempt + 1}/${retries + 1})...`,
        );
      }

      let res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        credentials: "include",
        signal: controller.signal,
        ...rest,
      });

      // Handle 401 Unauthorized - Attempt token refresh once
      if (res.status === 401 && attempt === 0) {
        console.log(
          `[API] 401 Detected for ${endpoint}. Attempting refresh...`,
        );
        try {
          if (!refreshPromise) {
            refreshPromise = refreshSession().finally(() => {
              refreshPromise = null;
            });
          }
          const refresh = await refreshPromise;
          if (refresh.success && refresh.token) {
            useAuthStore.getState().setAccessToken(refresh.token);
            // Update authorization header and retry
            headers["Authorization"] = `Bearer ${refresh.token}`;
            res = await fetch(`${API_BASE_URL}${endpoint}`, {
              headers,
              credentials: "include",
              signal: controller.signal,
              ...rest,
            });
          }
        } catch (refreshErr) {
          console.error("[API] Refresh during 401 failed", refreshErr);
        }
      }

      // Clear timeout if successful
      clearTimeout(timeoutId);

      return await handleResponse<T>(res);
    } catch (error: any) {
      lastError = error;

      // Only retry on transient errors or network issues
      const isTransient =
        error.status === 429 || (error.status >= 502 && error.status <= 504);
      const isNetworkError =
        error.name === "AbortError" ||
        error.message === "Failed to fetch" ||
        !error.status;

      if ((isTransient || isNetworkError) && attempt < retries) {
        continue;
      }

      break;
    }
  }

  clearTimeout(timeoutId);
  throw lastError;
}

export async function apiSignin(
  data: any,
  userAgent?: string,
  turnstileToken?: string,
) {
  return fetchClient("/auth/signin", {
    method: "POST",
    body: JSON.stringify(data),
    userAgent,
    turnstileToken,
  });
}

export async function apiSignup(
  data: any,
  userAgent?: string,
  turnstileToken?: string,
) {
  return fetchClient("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
    userAgent,
    turnstileToken,
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
  cookieHeader?: string,
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
  userAgent?: string,
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
  userAgent?: string,
) {
  const res = await apiRefreshToken(cookieHeader, userAgent);

  if (!res.ok) {
    return { success: false, token: null, message: "Refresh failed" };
  }

  // Extract token from Set-Cookie header
  const setCookies = res.headers.getSetCookie();
  const accessTokenCookie = setCookies.find((c) =>
    c.startsWith("access_token="),
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
  order = "desc",
) {
  return fetchClient(
    `/user/users?page=${page}&page_size=${pageSize}&q=${query}&role=${role}&sort_by=${sortBy}&order=${order}`,
    {
      cache: "no-store",
    },
  );
}

export async function getUserById(id: string) {
  return fetchClient(`/user/${id}`, {
    cache: "no-store",
  });
}

export async function adminUpdateUser(
  id: string,
  data: { role?: string; status?: string },
) {
  return fetchClient(`/user/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateUser(data: {
  address?: {
    address: string;
    city: string;
    country: string;
    post_code?: string;
  };
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

export async function getRestaurants(
  cursor?: string,
  pageSize = 20,
  query = "",
) {
  const queryParams = new URLSearchParams({
    page_size: pageSize.toString(),
    q: query,
  });
  if (cursor) queryParams.append("cursor", cursor);

  return fetchClient(`/restaurants?${queryParams.toString()}`, {
    cache: "no-store",
  });
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
  userAgent?: string,
  turnstileToken?: string,
) {
  return fetchClient("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
    userAgent,
    turnstileToken,
  });
}

export async function apiResetPassword(data: any, userAgent?: string) {
  return fetchClient("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
    userAgent,
  });
}
// Functionality to upload menu media
// 1. entry point for image upload
export async function uploadMenuMedia(
  file: File,
  onProgress?: (progress: number) => void,
) {
  console.log(
    `[UploadDebug] uploadMenuMedia called for file: ${file.name}, type: ${file.type}, size: ${file.size}`,
  );
  const isVideo = file.type.startsWith("video/");
  const isLargeFile = file.size > 5 * 1024 * 1024; // 5MB

  if (isVideo || isLargeFile) {
    console.log("[UploadDebug] Using Multipart Upload Strategy");
    // 2, Using upload Multipart for video upload or file > 5MB
    return uploadMultipart(file, onProgress);
  }

  // Strategy: Use presigned URL for direct S3 upload to reduce latency
  try {
    // 2. get presigned URL for upload from API & AWS s3 for image upload
    console.log("[UploadDebug] Using Direct Presigned URL Strategy");
    const { data } = await getMenuUploadURL(file.name, file.type);
    const { upload_url, public_url } = data;
    console.log(`[UploadDebug] Got upload URL: ${upload_url}`);
    await uploadToPresignedURL(upload_url, file, file.type, (ratio) =>
      onProgress?.(Math.round(ratio * 100)),
    );
    // 7. upload completed for image upload with public(cloudfront) url
    console.log(
      `[UploadDebug] Direct upload complete. Public URL: ${public_url}`,
    );
    return { data: { url: public_url } };
  } catch (error: any) {
    console.error(
      "Direct S3 upload failed. PLEASE CHECK S3 CORS SETTINGS! (Allow PUT from localhost:3000)",
      error,
    );

    // Fallback to server-side upload if presigned fails (e.g. CORS or auth)
    console.log("[UploadDebug] Falling back to server-side upload");
    const formData = new FormData();
    formData.append("file", file);

    // Note: Progress for fetch-based server upload is harder without another XHR refactor
    // but we'll focus on the primary S3 flow.
    return fetchClient("/menus/upload", {
      method: "POST",
      body: formData,
    });
  }
}
// 2nd function for upload to S3 using presigned URL & XHR
// Helper for XHR uploads with progress tracking
function uploadToPresignedURL(
  url: string,
  body: Blob | File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 3. upload file to S3 using presigned URL & XHR for image upload
    console.log(`[UploadDebug] Starting XHR upload to: ${url}`);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = event.loaded / event.total;
        // 4. update progress for image upload
        console.log(`[UploadDebug] Progress: ${Math.round(percent * 100)}%`);
        onProgress(percent); // Return 0-1 ratio for flexibility
      }
    };

    xhr.onload = () => {
      // 5. handle response for image upload
      console.log(`[UploadDebug] XHR Load Status: ${xhr.status}`);
      if (xhr.status >= 200 && xhr.status < 300) {
        // 6. handle success for image upload get etag
        const etag = xhr.getResponseHeader("ETag") || "";
        console.log(`[UploadDebug] Upload success. ETag: ${etag}`);
        resolve(etag.replace(/"/g, ""));
      } else {
        console.error(`[UploadDebug] Upload failed with status ${xhr.status}`);
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      console.error("[UploadDebug] Network error during upload");
      reject(new Error("Network error during upload"));
    };
    xhr.send(body);
  });
}

export async function getMenuUploadURL(filename: string, contentType: string) {
  return fetchClient(
    `/menus/upload-url?filename=${encodeURIComponent(
      filename,
    )}&content_type=${encodeURIComponent(contentType)}`,
  );
}
// Uploads a file using the multipart upload API
// 3. Using upload Multipart for video upload or file > 5MB
async function uploadMultipart(
  file: File,
  onProgress?: (progress: number) => void,
) {
  // 3. Initiate Multipart Upload
  console.log(`[UploadDebug] Starting Multipart Upload for ${file.name}`);
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  // 4. Divide the file size to chunks of 5MB
  console.log(`[UploadDebug] Total chunks: ${totalChunks}`);

  // Get the auth token for the XHR requests
  const token = useAuthStore.getState().accessToken;

  try {
    // 5. Initiate Multipart Upload and get upload id and unique key
    console.log("[UploadDebug] Initiating multipart upload...");
    const { data: initData } = await initiateMultipartUpload({
      filename: file.name,
      content_type: file.type,
    });
    const { upload_id, key } = initData;
    console.log(
      `[UploadDebug] Upload initiated. ID: ${upload_id}, Key: ${key}`,
    );

    const completedParts: { part_number: number; etag: string }[] = [];
    let uploadedBytes = 0;

    // 2. Upload chunks via server proxy (no browser→S3 CORS preflight)
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const partNumber = i + 1;
      // 6. Processing chunks of a file loop
      console.log(
        `[UploadDebug] Processing chunk ${partNumber}/${totalChunks}`,
      );

      // Upload chunk through server proxy — avoids browser→S3 CORS
      const { etag } = await uploadPartViaServer(
        key,
        upload_id,
        partNumber,
        chunk,
        token,
        (ratio) => {
          if (onProgress) {
            const currentChunkLoaded = ratio * chunk.size;
            const totalProgress = Math.round(
              ((uploadedBytes + currentChunkLoaded) / file.size) * 100,
            );
            onProgress(totalProgress);
          }
        },
      );

      console.log(`[UploadDebug] Chunk ${partNumber} uploaded. ETag: ${etag}`);
      completedParts.push({ part_number: partNumber, etag });
      uploadedBytes += chunk.size;

      // Ensure specific progress point is hit after chunk completion
      if (onProgress) {
        onProgress(Math.round((uploadedBytes / file.size) * 100));
      }
    }

    // 3. Complete
    console.log("[UploadDebug] Completing multipart upload...");
    const { data: completeData } = await completeMultipartUpload({
      key,
      upload_id,
      parts: completedParts,
    });
    console.log(
      `[UploadDebug] Multipart upload complete. URL: ${completeData.url}`,
    );

    return { data: { url: completeData.url } };
  } catch (error) {
    console.error("[UploadDebug] Multipart upload failed", error);
    throw error;
  }
}

/**
 * Uploads a single binary chunk to the server proxy endpoint (POST /menus/multipart/upload-part).
 * The server then forwards it to S3 via the AWS SDK — no browser→S3 CORS preflight.
 * Returns the ETag from S3 needed to complete the multipart upload.
 */
function uploadPartViaServer(
  key: string,
  uploadId: string,
  partNumber: number,
  chunk: Blob,
  authToken: string | null,
  onProgress?: (ratio: number) => void,
): Promise<{ etag: string }> {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams({
      key,
      upload_id: uploadId,
      part_number: partNumber.toString(),
    });
    const url = `${API_BASE_URL}/menus/multipart/upload-part?${query.toString()}`;

    console.log(
      `[UploadDebug] POSTing chunk ${partNumber} to server proxy: ${url}`,
    );

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    // Set auth header
    if (authToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
    }
    // Content-Length is set by the browser automatically for binary data
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      console.log(`[UploadDebug] Server proxy response: ${xhr.status}`);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          // Server returns { title, data: { etag, part_number } }
          const etag = json?.data?.etag || "";
          console.log(`[UploadDebug] ETag from server: ${etag}`);
          resolve({ etag });
        } catch (e) {
          reject(new Error("Failed to parse server response"));
        }
      } else {
        console.error(
          `[UploadDebug] Server proxy upload failed: ${xhr.status} ${xhr.responseText}`,
        );
        reject(
          new Error(
            `Part upload failed with status ${xhr.status}: ${xhr.responseText}`,
          ),
        );
      }
    };

    xhr.onerror = () => {
      console.error("[UploadDebug] Network error during server proxy upload");
      reject(new Error("Network error during part upload"));
    };

    // Send the raw binary chunk as the POST body
    xhr.send(chunk);
  });
}
// 4. Function to imitiate Chunk Upload to AWS S3 returns upload id and key
async function initiateMultipartUpload(data: {
  filename: string;
  content_type: string;
}) {
  return fetchClient("/menus/multipart/initiate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPartPresignedURL(params: {
  key: string;
  upload_id: string;
  part_number: number;
}) {
  const query = new URLSearchParams({
    key: params.key,
    upload_id: params.upload_id,
    part_number: params.part_number.toString(),
  });
  return fetchClient(`/menus/multipart/part-url?${query.toString()}`);
}

export async function completeMultipartUpload(data: {
  key: string;
  upload_id: string;
  parts: { part_number: number; etag: string }[];
}) {
  return fetchClient("/menus/multipart/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createMenu(data: any) {
  return fetchClient("/menus", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMenus(params: {
  cursor?: string;
  page_size?: number;
  q?: string;
  restaurant_id?: string;
  category_id?: string;
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

export async function createOrder(data: any) {
  // data should match CreateOrderInput: { restaurant_id, delivery_address, items: [{menu_id, quantity}] }
  return fetchClient("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrders() {
  return fetchClient("/orders", {
    cache: "no-store",
  });
}

export async function getOrderById(id: string) {
  return fetchClient(`/orders/${id}`, {
    cache: "no-store",
  });
}
export async function apiHealthCheck() {
  return fetchClient("/healthcheck", {
    cache: "no-store",
  });
}

export async function getMenuCategories(restaurantId: string) {
  return fetchClient<MenuCategory[]>(
    `/categories?restaurant_id=${restaurantId}`,
  );
}

export async function createMenuCategory(data: any) {
  return fetchClient(`/categories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMenuCategory(id: string, data: any) {
  return fetchClient(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMenuCategory(id: string) {
  return fetchClient(`/categories/${id}`, {
    method: "DELETE",
  });
}
