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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#d7eaea] rounded-[18px] p-6 shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0fdfa] text-[#008080] border border-[#b2d8d8] text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5" />
            Patient Data Disclosure Ledger
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] mb-2">
            Health Data Access &amp; Disclosure History
          </h1>
          <p className="text-[#475569] text-sm leading-relaxed mb-4">
            A transparent, patient-scoped record of all healthcare practitioners, diagnostic laboratories, and pharmacies that have accessed, transferred, or contributed to your health records under consented workflows.
          </p>
          <div className="p-3 bg-[#f0fdfa] border border-[#d7eaea] rounded-[12px] text-[#004c4c] text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#008080]" />
            <span>
              <strong>Privacy Guarantee:</strong> This access history records authorization outcomes without disclosing unconsented third-party metadata or clinical diagnostic notes.
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[18px] border border-[#d7eaea] shadow-xs">
        <div className="text-xs font-semibold text-[#172033]">
          Showing <strong>{events.length}</strong> logged access events
        </div>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#d7eaea] rounded-[12px] text-xs font-semibold text-[#008080] hover:bg-[#f0fdfa] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Ledger
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-[18px] text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-[18px] border border-[#d7eaea] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748b] text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#008080]" />
            Loading access history...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-[#64748b]">
            <Clock className="w-10 h-10 text-[#b2d8d8] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#172033]">No recorded access events yet.</p>
            <p className="text-xs text-[#64748b] mt-1">
              Events will appear when practitioners request consent or access your clinical timeline.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#d7eaea]/50">
            {events.map((evt) => (
              <div
                key={evt.eventId}
                className="p-4 sm:p-5 hover:bg-[#f0fdfa]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {evt.actionLabel || evt.action}
                    </span>
                    {evt.outcome === "ALLOWED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        Denied
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                    {evt.actorName && (
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {evt.actorName} ({evt.actorRole || "User"})
                      </span>
                    )}
                    {evt.facility && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {evt.facility}
                      </span>
                    )}
                    <span className="text-slate-400">
                      Resource: <span className="font-mono text-slate-600">{evt.targetResourceType}</span>
                    </span>
                  </div>

                  {evt.denialReason && (
                    <div className="text-[11px] text-rose-600 italic">
                      Reason: {evt.denialReason}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-medium text-slate-700">
                    {new Date(evt.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-500 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Access logs are stored in an append-only, SHA-256 hash-chained verifiable audit store. Each entry corresponds to an immutable cryptographic event with guaranteed sequence ordering.
        </span>
      </div>
    </div>
  );
}
