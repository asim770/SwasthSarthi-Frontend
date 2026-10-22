import { API_BASE_URL } from "./config";
import type {
  ApiResponse,
  HealthCheckData,
  AuthChallengeResponse,
  AuthVerifyResponse,
  AuthenticatedUser,
  MockOtpResponse,
} from "../types/api";

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: Array<{ field?: string; message: string }>;

  constructor(
    message: string,
    status: number,
    code: string = "API_ERROR",
    details?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// In-memory anti-CSRF token storage (never storing session tokens or passwords in localStorage/sessionStorage)
let memoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  memoryCsrfToken = token;
}

export function getCsrfToken(): string | null {
  return memoryCsrfToken;
}

/**
 * Standard typed fetch wrapper for SwasthSaarthi API with credentials: "include" and CSRF verification
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

  // Attach anti-CSRF token for state-changing HTTP methods
  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && memoryCsrfToken) {
    headers.set("x-csrf-token", memoryCsrfToken);
  }

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include", // Ensures HttpOnly cookies are attached across localhost ports
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

/**
 * Step 1: Create a mock ABHA login OTP challenge
 */
export async function createAuthChallenge(identifier: string): Promise<AuthChallengeResponse> {
  return apiRequest<AuthChallengeResponse>("/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

/**
 * Step 2: Verify OTP and establish server-managed session
 */
export async function verifyAuthOtp(
  challengeId: string,
  otp: string
): Promise<AuthVerifyResponse> {
  const data = await apiRequest<AuthVerifyResponse>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId, otp }),
  });

  if (data.csrfToken) {
    setCsrfToken(data.csrfToken);
  }

  return data;
}

/**
 * Retrieve current authenticated user profile and refresh CSRF token
 */
export async function fetchCurrentUser(): Promise<{
  user: AuthenticatedUser;
  csrfToken: string;
}> {
  const data = await apiRequest<{
    user: AuthenticatedUser;
    csrfToken: string;
  }>("/auth/me");

  if (data.csrfToken) {
    setCsrfToken(data.csrfToken);
  }

  return data;
}

/**
 * Fast session check on application startup
 */
export async function checkSessionStatus(): Promise<{
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
    role: string;
    abhaAddress: string;
  };
}> {
  return apiRequest<{
    authenticated: boolean;
    user?: {
      id: string;
      name: string;
      role: string;
      abhaAddress: string;
    };
  }>("/auth/session");
}

/**
 * Logout and clear server session
 */
export async function logoutUser(): Promise<{ message: string }> {
  const res = await apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
  setCsrfToken(null);
  return res;
}

/**
 * Development-only: fetch delivered mock OTP via isolated test channel
 */
export async function fetchMockDevOtp(challengeId: string): Promise<MockOtpResponse> {
  return apiRequest<MockOtpResponse>(`/auth/mock-otp?challengeId=${encodeURIComponent(challengeId)}`);
}

/**
 * Fetch clinical health records (DAL-authorized)
 */
export async function fetchHealthRecords(params?: {
  patientId?: string;
  resourceType?: string;
}): Promise<unknown[]> {
  const query = new URLSearchParams();
  if (params?.patientId) query.set("patientId", params.patientId);
  if (params?.resourceType) query.set("resourceType", params.resourceType);
  const qs = query.toString();
  return apiRequest<unknown[]>(`/records${qs ? `?${qs}` : ""}`);
}

/**
 * Fetch electronic consent artefacts for principal
 */
export async function fetchConsents(): Promise<unknown[]> {
  return apiRequest<unknown[]>("/consents");
}

/**
 * Fetch laboratory orders assigned to facility
 */
export async function fetchLabOrders(): Promise<unknown[]> {
  return apiRequest<unknown[]>("/laboratory/orders");
}

/**
 * Fetch eligible active prescriptions for pharmacy
 */
export async function fetchPrescriptions(): Promise<unknown[]> {
  return apiRequest<unknown[]>("/pharmacy/prescriptions");
}

/**
 * Admin: list user accounts
 */
export async function fetchAdminUsers(): Promise<unknown[]> {
  return apiRequest<unknown[]>("/admin/users");
}

/**
 * Admin: fetch security audit logs
 */
export async function fetchAdminAudit(): Promise<unknown[]> {
  return apiRequest<unknown[]>("/admin/audit");
}

/**
 * Admin: fetch operational overview statistics
 */
export async function fetchAdminOverview(): Promise<{
  totalUsers: number;
  activeSessions: number;
  totalConsents: number;
  grantedConsents: number;
}> {
  return apiRequest<{
    totalUsers: number;
    activeSessions: number;
    totalConsents: number;
    grantedConsents: number;
  }>("/admin/overview");
}
