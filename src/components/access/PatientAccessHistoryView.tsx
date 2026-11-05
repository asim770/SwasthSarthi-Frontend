import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Building,
  User,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { fetchPatientAccessHistory } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { AdminManagementView } from "../admin/AdminManagementView";
import type { PatientAccessEventItem } from "../../types/api";

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
      {/* Header Banner */}
      <div className="bg-white border border-[#EAE4D9] rounded-none p-6 sm:p-7 shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none bg-[#FAF7F2] text-[#57477D] border border-[#57477D]/25 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5" />
            Patient Data Disclosure Ledger
          </div>
          <h1 className="text-2xl md:text-3xl font-editorial-serif font-bold tracking-tight text-[#191817] mb-2">
            Health Data Access &amp; Disclosure History
          </h1>
          <p className="text-[#5C574F] text-sm leading-relaxed mb-4">
            A transparent, patient-scoped record of all healthcare practitioners, diagnostic laboratories, and pharmacies that have accessed, transferred, or contributed to your health records under consented workflows.
          </p>
          <div className="p-3.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none text-[#5C574F] text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#4E8C78]" />
            <span>
              <strong className="text-[#191817]">Privacy Guarantee:</strong> This access history records authorization outcomes without disclosing unconsented third-party metadata or clinical diagnostic notes.
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-none border border-[#EAE4D9] shadow-2xs">
        <div className="text-xs font-semibold text-[#191817]">
          Showing <strong>{events.length}</strong> logged access events
        </div>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D5CEC2] rounded-none text-xs font-semibold text-[#191817] bg-white hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Ledger
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-none text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-none border border-[#EAE4D9] shadow-[0_4px_20px_rgba(26,25,24,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#7A746B] text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#57477D]" />
            Loading access history...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-[#7A746B]">
            <Clock className="w-10 h-10 text-[#D5CEC2] mx-auto mb-2" />
            <p className="text-sm font-editorial-serif font-bold text-[#191817]">No recorded access events yet.</p>
            <p className="text-xs text-[#7A746B] mt-1">
              Events will appear when practitioners request consent or access your clinical timeline.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAE4D9]">
            {events.map((evt) => (
              <div
                key={evt.eventId}
                className="p-4 sm:p-5 hover:bg-[#FAF7F2] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#191817] text-sm">
                      {evt.actionLabel || evt.action}
                    </span>
                    {evt.outcome === "ALLOWED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 uppercase tracking-wider">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Denied
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[#5C574F] text-[11px]">
                    {evt.actorName && (
                      <span className="flex items-center gap-1 font-medium text-[#191817]">
                        <User className="w-3.5 h-3.5 text-[#7A746B]" />
                        {evt.actorName} ({evt.actorRole || "User"})
                      </span>
                    )}
                    {evt.facility && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-[#7A746B]" />
                        {evt.facility}
                      </span>
                    )}
                    <span className="text-[#7A746B]">
                      Resource: <span className="font-mono text-[#57477D] font-bold">{evt.targetResourceType}</span>
                    </span>
                  </div>

                  {evt.denialReason && (
                    <div className="text-[11px] text-rose-600 italic">
                      Reason: {evt.denialReason}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-[#191817]">
                    {new Date(evt.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-[11px] text-[#7A746B] font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none text-xs text-[#5C574F] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#7A746B] shrink-0 mt-0.5" />
        <span>
          Access logs are stored in an append-only, SHA-256 hash-chained verifiable audit store. Each entry corresponds to an immutable cryptographic event with guaranteed sequence ordering.
        </span>
      </div>
    </div>
  );
}
