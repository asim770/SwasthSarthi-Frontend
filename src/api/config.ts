/**
 * SwasthSaarthi Frontend API Configuration
 * Normalizes and sanitizes backend URL to prevent double `/api/v1` or missing paths.
 */
function resolveApiBaseUrl(): string {
  let url = ((import.meta.env.VITE_API_BASE_URL as string) || "").trim();

  // If no env variable set, default to relative path /api/v1 (uses Vite proxy in dev)
  if (!url) {
    return "/api/v1";
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Prevent accidental duplicated /api/v1
  while (url.includes("/api/v1/api/v1")) {
    url = url.replace("/api/v1/api/v1", "/api/v1");
  }

  // If it's a domain without /api/v1 path, append /api/v1
  if ((url.startsWith("http://") || url.startsWith("https://")) && !url.endsWith("/api/v1")) {
    url = `${url}/api/v1`;
  }

  return url;
}

export const API_BASE_URL: string = resolveApiBaseUrl();
