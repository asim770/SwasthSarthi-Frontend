/**
 * SwasthSaarthi Frontend API Configuration
 * Reads from Vite environment variable with safe localhost fallback
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3001/api/v1";
