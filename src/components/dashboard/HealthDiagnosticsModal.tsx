import React from "react";
import { Dialog } from "../ui/Dialog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Activity, Database, Server, RefreshCw } from "lucide-react";
import type { HealthCheckData } from "../../types/api";
import { API_BASE_URL } from "../../api/config";

interface HealthDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthData: HealthCheckData | null;
  isLoading: boolean;
  onRefresh: () => void;
  error: string | null;
}

export const HealthDiagnosticsModal: React.FC<HealthDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  healthData,
  isLoading,
  onRefresh,
  error,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="SwaasthSaarthi System Diagnostics"
      description="Real-time health telemetry from the Next.js REST API Gateway and micro-services."
      maxWidth="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Probe API Gateway
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs font-editorial-sans">
        {/* Endpoint info */}
        <div className="p-4 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#7A746B] font-mono font-semibold uppercase block">
              REST Health Endpoint
            </span>
            <code className="text-xs text-[#57477D] font-mono font-bold">
              {API_BASE_URL}/health
            </code>
          </div>
          <Badge
            variant={
              healthData?.status === "healthy"
                ? "success"
                : healthData
                ? "warning"
                : "danger"
            }
            size="md"
            dot
          >
            {healthData ? healthData.status.toUpperCase() : "UNREACHABLE"}
          </Badge>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-none text-red-700 text-xs">
            <span className="font-semibold block mb-0.5">Gateway Notice:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Services Status Cards */}
        <div className="space-y-2.5">
          {/* API Gateway */}
          <div className="p-3.5 bg-white border border-[#EAE4D9] rounded-none flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none bg-[#FAF7F2] border border-[#D5CEC2] text-[#57477D] flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#191817] block text-xs">REST API Gateway</span>
                <span className="text-[10px] text-[#7A746B]">Headless Route Handlers (Port 4000)</span>
              </div>
            </div>
            <Badge variant={healthData ? "success" : "danger"} size="sm" dot>
              {healthData ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* MongoDB */}
          <div className="p-3.5 bg-white border border-[#EAE4D9] rounded-none flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#191817] block text-xs">MongoDB + Mongoose</span>
                <span className="text-[10px] text-[#7A746B]">
                  {healthData?.services.database.databaseName || "Database connection pool"}
                </span>
              </div>
            </div>
            <Badge
              variant={
                healthData?.services.database.status === "connected"
                  ? "success"
                  : "neutral"
              }
              size="sm"
              dot
            >
              {healthData?.services.database.status || "Checking..."}
            </Badge>
          </div>

          {/* Redis / BullMQ */}
          <div className="p-3.5 bg-white border border-[#EAE4D9] rounded-none flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none bg-[#FAF7F2] border border-[#D5CEC2] text-[#57477D] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#191817] block text-xs">Redis &amp; BullMQ</span>
                <span className="text-[10px] text-[#7A746B]">
                  Async message queues for FHIR imports &amp; ABDM
                </span>
              </div>
            </div>
            <Badge
              variant={
                healthData?.services.redis.status === "connected"
                  ? "success"
                  : "warning"
              }
              size="sm"
              dot
            >
              {healthData?.services.redis.status || "Awaiting Docker"}
            </Badge>
          </div>
        </div>

        {/* Live Payload Preview */}
        {healthData && (
          <div>
            <span className="text-[10px] text-[#7A746B] font-mono font-semibold uppercase block mb-1">
              Live Gateway Response Payload
            </span>
            <pre className="p-3.5 bg-[#1A1918] text-emerald-400 rounded-none text-[11px] font-mono overflow-x-auto max-h-40 border border-[#2E2C2A]">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Dialog>
  );
};
