import { cookies, headers } from "next/headers";

/**
 * Helper to get authentication tokens in Server Components or Server Actions.
 * It checks both the cookie store and the 'Set-Cookie' header (in case middleware just refreshed them).
 */
export async function getServerTokens() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("access_token")?.value;
  let refreshToken = cookieStore.get("refresh_token")?.value;

  // If missing, check if they were just set in middleware and are in the request headers
  if (!accessToken || !refreshToken) {
    const headersList = await headers();
    const setCookie = headersList.get("set-cookie");
    if (setCookie) {
      // Multiple Set-Cookie headers are joined by commas.
      // We need to be careful with commas in dates, but for access_token/refresh_token it's usually fine.
      const parts = setCookie.split(/,(?=[^;]*=)/);
      parts.forEach((part) => {
        const [nameValue] = part.trim().split(";");
        const [name, value] = nameValue.split("=");
        if (name === "access_token" && !accessToken) accessToken = value;
        if (name === "refresh_token" && !refreshToken) refreshToken = value;
      });
    }
  }

  return { accessToken, refreshToken };
}
