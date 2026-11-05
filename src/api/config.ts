/**
 * SwasthSaarthi Frontend API Configuration
 * In development, relative path "/api/v1" leverages the Vite proxy on port 3000,
 * keeping session cookies and Google OAuth on the exact same origin (http://localhost:3000).
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || "/api/v1";
