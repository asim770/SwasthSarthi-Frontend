/**
 * SwasthSaarthi Frontend API Configuration
 * Normalizes and sanitizes backend URL to prevent double `/api/v1` or missing paths.
 */
function resolveApiBaseUrl(): string {
  // Always use same-origin relative path /api/v1 on Vercel deployments and localhost
  // so HttpOnly session/CSRF cookies and OAuth callbacks share the exact same origin
  // via vercel.json rewrites (production) and vite.config.ts proxy (local dev).
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".vercel.app") || host === "localhost" || host === "127.0.0.1") {
      return "/api/v1";
    }
  }

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
