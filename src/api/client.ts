import { API_BASE_URL } from "./config";
import type {
  ApiResponse,
  HealthCheckData,
  AuthChallengeResponse,
  AuthVerifyResponse,
  AuthenticatedUser,
  MockOtpResponse,
  ConsentItem,
  ConsentDecision,
  DiscoverablePatient,
  TimelineRecordItem,
  CareContextItem,
  HealthTransferReport,
  LabOrderItem,
  PrescriptionItem,
  DispensingRecordItem,
  DiagnosticObservationItem,
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
 * Fetch electronic consent artefacts for principal with optional status filter
 */
export async function fetchConsents(statusFilter?: string): Promise<ConsentItem[]> {
  const qs = statusFilter && statusFilter !== "ALL" ? `?status=${encodeURIComponent(statusFilter)}` : "";
  return apiRequest<ConsentItem[]>(`/consents${qs}`);
}

/**
 * Fetch a single consent artefact by ID
 */
export async function fetchConsentById(consentId: string): Promise<ConsentItem> {
  return apiRequest<ConsentItem>(`/consents/${encodeURIComponent(consentId)}`);
}

/**
 * Create a new consent request (Doctor only)
 */
export async function createConsentRequest(data: {
  patientId: string;
  purpose: string;
  hiTypes: string[];
  dateRangeFrom: string;
  dateRangeTo: string;
  expiresAt: string;
}): Promise<ConsentItem> {
  return apiRequest<ConsentItem>("/consents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Approve pending consent request (Patient only)
 */
export async function approveConsent(
  consentId: string,
  data?: { approvedHiTypes?: string[]; note?: string }
): Promise<ConsentItem> {
  return apiRequest<ConsentItem>(`/consents/${encodeURIComponent(consentId)}/approve`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

/**
 * Deny pending consent request (Patient only)
 */
export async function denyConsent(
  consentId: string,
  reason?: string
): Promise<ConsentItem> {
  return apiRequest<ConsentItem>(`/consents/${encodeURIComponent(consentId)}/deny`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/**
 * Revoke active consent (Patient only)
 */
export async function revokeConsent(
  consentId: string,
  reason?: string
): Promise<ConsentItem> {
  return apiRequest<ConsentItem>(`/consents/${encodeURIComponent(consentId)}/revoke`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/**
 * Fetch decision history for a consent artefact
 */
export async function fetchConsentHistory(consentId: string): Promise<ConsentDecision[]> {
  return apiRequest<ConsentDecision[]>(`/consents/${encodeURIComponent(consentId)}/history`);
}

/**
 * Fetch patients discoverable by practitioner
 */
export async function fetchDiscoverablePatients(): Promise<DiscoverablePatient[]> {
  return apiRequest<DiscoverablePatient[]>("/patients");
}

/**
 * Fetch laboratory orders assigned to facility (alias)
 */
export async function fetchLabOrders(): Promise<unknown[]> {
  return apiRequest<unknown[]>("/laboratory/orders");
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

/**
 * Fetch longitudinal patient timeline records
 */
export async function fetchTimelineRecords(params: {
  patientId?: string;
  resourceType?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sourceInstitution?: string;
}): Promise<TimelineRecordItem[]> {
  const query = new URLSearchParams();
  if (params.patientId) query.set("patientId", params.patientId);
  if (params.resourceType && params.resourceType !== "ALL") query.set("resourceType", params.resourceType);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.search) query.set("search", params.search);
  if (params.sourceInstitution) query.set("sourceInstitution", params.sourceInstitution);

  const qs = query.toString();
  return apiRequest<TimelineRecordItem[]>(`/records/timeline${qs ? `?${qs}` : ""}`);
}

/**
 * Discover linked ABDM care contexts for patient
 */
export async function fetchCareContexts(patientId: string): Promise<CareContextItem[]> {
  return apiRequest<CareContextItem[]>(`/records/care-contexts?patientId=${encodeURIComponent(patientId)}`);
}

/**
 * Initiate a scoped ABDM health data transfer from a participating institution
 */
export async function initiateAbdmTransfer(data: {
  consentId: string;
  patientId: string;
  hipId: string;
  transactionId?: string;
  requestedHiTypes?: string[];
  dateRangeFrom?: string;
  dateRangeTo?: string;
}): Promise<HealthTransferReport> {
  return apiRequest<HealthTransferReport>("/records/transfer", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Check status of a transfer job
 */
export async function fetchTransferStatus(transferId: string): Promise<HealthTransferReport> {
  return apiRequest<HealthTransferReport>(`/records/transfer/${encodeURIComponent(transferId)}`);
}

/**
 * Retrieve authorized FHIR R4 Bundle
 */
export async function fetchFhirBundle(bundleId: string): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>(`/records/fhir/${encodeURIComponent(bundleId)}`);
}

// ==========================================
// LABORATORY API ENDPOINTS
// ==========================================

export async function fetchLaboratoryOrders(status?: string): Promise<LabOrderItem[]> {
  const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<LabOrderItem[]>(`/laboratory/orders${query}`);
}

export async function fetchLaboratoryOrder(id: string): Promise<LabOrderItem> {
  return apiRequest<LabOrderItem>(`/laboratory/orders/${encodeURIComponent(id)}`);
}

export async function createLaboratoryOrder(data: {
  patientId: string;
  targetFacility: string;
  testName: string;
  testCode: string;
  priority?: "ROUTINE" | "URGENT" | "STAT";
  instructions?: string;
}): Promise<LabOrderItem> {
  return apiRequest<LabOrderItem>("/laboratory/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitDiagnosticReport(
  orderId: string,
  data: {
    title: string;
    summary: string;
    observations?: DiagnosticObservationItem[];
    testResults?: Record<string, unknown>;
  }
): Promise<{ order: LabOrderItem; reportRecordId: string; fhirDiagnosticReport: Record<string, unknown> }> {
  return apiRequest<{ order: LabOrderItem; reportRecordId: string; fhirDiagnosticReport: Record<string, unknown> }>(
    `/laboratory/orders/${encodeURIComponent(orderId)}/report`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function fetchLaboratorySubmittedReports(): Promise<Array<Record<string, unknown>>> {
  return apiRequest<Array<Record<string, unknown>>>("/laboratory/reports");
}

// ==========================================
// PHARMACY API ENDPOINTS
// ==========================================

export async function fetchPrescriptions(status?: string): Promise<PrescriptionItem[]> {
  const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<PrescriptionItem[]>(`/pharmacy/prescriptions${query}`);
}

export async function fetchPrescription(id: string): Promise<PrescriptionItem> {
  return apiRequest<PrescriptionItem>(`/pharmacy/prescriptions/${encodeURIComponent(id)}`);
}

export async function createPrescription(data: {
  patientId: string;
  medications: Array<{
    code?: string;
    name: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    route?: string;
    quantity?: number;
    instructions?: string;
  }>;
  maxRefills?: number;
  validityDays?: number;
  instructions?: string;
}): Promise<PrescriptionItem> {
  return apiRequest<PrescriptionItem>("/pharmacy/prescriptions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function recordDispensation(
  prescriptionId: string,
  data: {
    quantityToDispense?: number;
    idempotencyKey?: string;
    batchNumber?: string;
    notes?: string;
  }
): Promise<{ prescription: PrescriptionItem; dispensingEvent: DispensingRecordItem; duplicate?: boolean }> {
  return apiRequest<{ prescription: PrescriptionItem; dispensingEvent: DispensingRecordItem; duplicate?: boolean }>(
    `/pharmacy/prescriptions/${encodeURIComponent(prescriptionId)}/dispense`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function fetchDispensingHistory(): Promise<DispensingRecordItem[]> {
  return apiRequest<DispensingRecordItem[]>("/pharmacy/dispenses");
}

