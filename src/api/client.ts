import { API_BASE_URL } from "./config";
import type { ApiResponse, HealthCheckData } from "../types/api";

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: Array<{ field?: string; message: string }>;

  constructor(message: string, status: number, code: string = "API_ERROR", details?: Array<{ field?: string; message: string }>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standard typed fetch wrapper for SwasthSaarthi API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const body: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        code: "INVALID_JSON_RESPONSE",
        message: `Server returned HTTP ${response.status}`,
      },
    }));

    if (!response.ok || !body.success) {
      throw new ApiError(
        body.error?.message || `Request failed with HTTP status ${response.status}`,
        response.status,
        body.error?.code || "HTTP_ERROR",
        body.error?.details
      );
    }

    return body.data as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err instanceof Error ? err.message : "Failed to connect to SwasthSaarthi API Gateway",
      0,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Fetch health status from /api/v1/health
 */
export async function checkSystemHealth(): Promise<HealthCheckData> {
  return apiRequest<HealthCheckData>("/health");
}
