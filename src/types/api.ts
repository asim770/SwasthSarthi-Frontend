export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
  timestamp: string;
}

export interface HealthCheckData {
  status: "healthy" | "degraded";
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  services: {
    api: {
      status: "up" | "down";
    };
    database: {
      type: "mongodb";
      status: "connected" | "connecting" | "disconnecting" | "disconnected";
      databaseName?: string;
    };
    redis: {
      status: "connected" | "connecting" | "reconnecting" | "disconnected";
      latencyMs?: number;
    };
  };
}

export type UserRole = "patient" | "doctor" | "laboratory" | "pharmacy" | "admin";

export interface AuthenticatedUser {
  id: string;
  abhaId: string;
  abhaAddress: string;
  name: string;
  role: UserRole;
  phone: string;
  facility?: string;
  specialization?: string;
  isActive: boolean;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface AuthChallengeResponse {
  challengeId: string;
  maskedIdentifier: string;
  role?: UserRole;
  name?: string;
  expiresAt: string;
  resendAvailableInSeconds: number;
  demoMode: boolean;
  note: string;
}

export interface AuthVerifyResponse {
  user: AuthenticatedUser;
  csrfToken: string;
  message: string;
}

export interface MockOtpResponse {
  challengeId: string;
  demoOtp: string;
  expiresAt: string;
  attemptsRemaining: number;
  environment: string;
  deliveryChannel: string;
  note: string;
}
