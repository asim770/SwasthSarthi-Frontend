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
      title="SwasthSaarthi System Diagnostics"
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
      <div className="space-y-4 text-xs">
        {/* Endpoint info */}
        <div className="p-3.5 bg-[#f0fdfa] border border-[#d7eaea] rounded-[14px] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#64748b] font-semibold uppercase block">
              REST Health Endpoint
            </span>
            <code className="text-xs text-[#008080] font-mono font-medium">
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-[12px] text-red-700 text-xs">
            <span className="font-semibold block mb-0.5">Gateway Notice:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Services Status Cards */}
        <div className="space-y-2.5">
          {/* API Gateway */}
          <div className="p-3.5 bg-white border border-[#d7eaea] rounded-[14px] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f0fdfa] border border-[#d7eaea] text-[#008080] flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#172033] block text-xs">Next.js REST API</span>
                <span className="text-[10px] text-[#64748b]">Headless Route Handlers (Port 3001)</span>
              </div>
            </div>
            <Badge variant={healthData ? "success" : "danger"} size="sm" dot>
              {healthData ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* MongoDB */}
          <div className="p-3.5 bg-white border border-[#d7eaea] rounded-[14px] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#172033] block text-xs">MongoDB + Mongoose</span>
                <span className="text-[10px] text-[#64748b]">
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
          <div className="p-3.5 bg-white border border-[#d7eaea] rounded-[14px] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f0fdfa] border border-[#d7eaea] text-[#008080] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#172033] block text-xs">Redis &amp; BullMQ</span>
                <span className="text-[10px] text-[#64748b]">
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
            <span className="text-[10px] text-[#64748b] font-semibold uppercase block mb-1">
              Live Gateway Response Payload
            </span>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-[12px] text-[11px] font-mono overflow-x-auto max-h-40 border border-[#d7eaea]">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Dialog>
  );
};
