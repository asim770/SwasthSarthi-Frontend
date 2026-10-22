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
