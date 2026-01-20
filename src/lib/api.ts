import { UserRole } from "./types";

const isServer = typeof window === "undefined";
export const API_BASE_URL = isServer
  ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"; // Use direct URL in dev to avoid proxy timeouts

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public title?: string,
    public data?: any,
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
    next_cursor?: string;
    has_more?: boolean;
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

    // 2. Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const partNumber = i + 1;
      // 6. Processing chunks of a file loop
      console.log(
        `[UploadDebug] Processing chunk ${partNumber}/${totalChunks}`,
      );

      // Get part presigned URL for this part
      const { data: presignedUrl } = await getPartPresignedURL({
        key,
        upload_id,
        part_number: partNumber,
      });

      // Upload chunk
      const etag = await uploadToPresignedURL(
        presignedUrl,
        chunk,
        file.type,
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
