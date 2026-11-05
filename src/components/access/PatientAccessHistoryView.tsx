import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Building,
  User,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { fetchPatientAccessHistory } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { AdminManagementView } from "../admin/AdminManagementView";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import type { PatientAccessEventItem } from "../../types/api";

function formatActionLabel(evt: PatientAccessEventItem): string {
  if (evt.actionLabel) return evt.actionLabel;
  const action = evt.action || "";
  switch (action) {
    case "READ_PATIENT_TIMELINE":
      return "Health Timeline Consultation";
    case "READ_FHIR_BUNDLE":
      return "Clinical Document Review";
    case "READ_HEALTH_RECORD":
      return "Medical Record Access";
    case "CONSENT_REQUEST":
    case "CREATE_CONSENT_REQUEST":
      return "Consent Request Received";
    case "CONSENT_APPROVAL":
    case "APPROVE_CONSENT":
      return "Consent Authorization Granted";
    case "CONSENT_REVOCATION":
    case "REVOKE_CONSENT":
      return "Consent Access Revoked";
    case "CONSENT_DENIAL":
    case "DENY_CONSENT":
      return "Consent Request Denied";
    case "TRANSFER_HEALTH_RECORDS":
    case "ABDM_DATA_TRANSFER":
      return "ABDM Institutional Data Exchange";
    case "DISPENSE_MEDICATION":
      return "Pharmacy Prescription Dispensing";
    case "LAB_ORDER_FULFILL":
      return "Diagnostic Lab Results Ingest";
    default:
      return action
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function PatientAccessHistoryView() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PatientAccessEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPatientAccessHistory();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load access history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") {
      loadHistory();
    }
  }, [user?.role, loadHistory]);

  // If currently authenticated as an administrator, render the AdminManagementView
  if (user?.role === "admin") {
    return <AdminManagementView />;
  }

  return (
    <div className="space-y-6 font-editorial-sans">
      {/* Page Header */}
      <PageHeader
        title="Access &amp; Disclosure History"
        description="A transparent, patient-scoped record of healthcare practitioners, hospitals, and pharmacies accessing your health records."
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            onClick={loadHistory}
            disabled={loading}
          >
            Refresh Ledger
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-none text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#5C574F] px-1">
          <span>
            Showing <strong className="text-[#191817] font-semibold">{events.length}</strong> access {events.length === 1 ? "event" : "events"}
          </span>
        </div>

        <div className="bg-white rounded-none border border-[#D0E5E1] shadow-[0_4px_20px_rgba(26,25,24,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#7A746B] text-xs space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F766E]" />
              <p>Loading access history...</p>
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              title="No Access Events Recorded"
              description="Events will appear here when healthcare practitioners or medical facilities request consent or access your clinical timeline."
              icon={<Clock className="w-5 h-5 text-[#0F766E]" />}
            />
          ) : (
            <div className="divide-y divide-[#D0E5E1]">
              {events.map((evt) => {
                const actor = evt.actorName || evt.accessorName;
                const role = evt.actorRole || evt.accessorRole;
                const resource = evt.targetResourceType || evt.resourceType;
                const facility = evt.facility;

                return (
                  <div
                    key={evt.eventId}
                    className="p-4 sm:p-5 hover:bg-[#F0F7F6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#191817] text-sm">
                          {formatActionLabel(evt)}
                        </span>
                        {evt.outcome === "ALLOWED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Authorized</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Denied</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[#5C574F] text-[11px]">
                        {actor && (
                          <span className="flex items-center gap-1 font-medium text-[#191817]">
                            <User className="w-3.5 h-3.5 text-[#7A746B]" />
                            {actor} {role ? `(${role})` : ""}
                          </span>
                        )}
                        {facility && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-[#7A746B]" />
                            {facility}
                          </span>
                        )}
                        {resource && resource.trim().length > 0 && (
                          <span className="text-[#7A746B]">
                            Scope: <span className="font-mono text-[#0F766E] font-semibold">{resource}</span>
                          </span>
                        )}
                      </div>

                      {evt.denialReason && (
                        <div className="text-[11px] text-rose-600 italic">
                          Reason: {evt.denialReason}
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="font-semibold text-[#191817]">
                        {new Date(evt.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[11px] text-[#7A746B] font-mono mt-0.5">
                        {new Date(evt.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Security Guarantee Footer */}
      <div className="p-3.5 bg-white border border-[#D0E5E1] text-xs text-[#5C574F] flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
        <span>
          All clinical record access inquiries and consent authorizations are immutably logged in real time. Your medical data cannot be accessed without explicit electronic permission.
        </span>
      </div>
    </div>
  );
}
