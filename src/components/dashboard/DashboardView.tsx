import React from "react";
import {
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { GlassPanel } from "../ui/GlassPanel";
import { useAuth } from "../../context/AuthContext";
import {
  SYNTHETIC_PATIENT,
  type SyntheticHealthRecord,
  type SyntheticConsent,
} from "../../data/syntheticData";
import type { NavigationRoute } from "../layout/navigation";

interface DashboardViewProps {
  onOpenUpload: () => void;
  onSelectRecord: (record: SyntheticHealthRecord) => void;
  onSelectConsent: (consent: SyntheticConsent) => void;
  onNavigateRoute: (route: NavigationRoute) => void;
  records: SyntheticHealthRecord[];
  consents: SyntheticConsent[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectRecord,
  onSelectConsent,
  onNavigateRoute,
  records,
  consents,
}) => {
  const { user } = useAuth();

  const displayName = user?.name || SYNTHETIC_PATIENT.name;
  const role = user?.role || "patient";

  const getRecordTypeBadge = (type: string) => {
    switch (type) {
      case "DiagnosticReport":
        return "bg-cyan-50 text-cyan-800 border-cyan-200/60";
      case "Encounter":
        return "bg-teal-50 text-teal-800 border-teal-200/60";
      case "Immunization":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/60";
      case "MedicationRequest":
        return "bg-amber-50 text-amber-800 border-amber-200/60";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/60";
    }
  };

  const getConsentStatusBadge = (status: string) => {
    switch (status) {
      case "GRANTED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/60";
      case "PENDING":
        return "bg-amber-50 text-amber-800 border-amber-200/60";
      case "REVOKED":
      case "EXPIRED":
        return "bg-rose-50 text-rose-800 border-rose-200/60";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200/60";
    }
  };

  // Primary single action customized per role
  const getPrimaryAction = () => {
    if (role === "doctor") {
      return {
        label: "View Patient Records",
        action: () => onNavigateRoute("records"),
      };
    }
    if (role === "laboratory") {
      return {
        label: "Open Lab Orders",
        action: () => onNavigateRoute("labs"),
      };
    }
    if (role === "pharmacy") {
      return {
        label: "Open Dispensation Hub",
        action: () => onNavigateRoute("prescriptions"),
      };
    }
    if (role === "admin") {
      return {
        label: "Verify Audit Trail",
        action: () => onNavigateRoute("access"),
      };
    }
    // Patient default
    const pendingCount = consents.filter((c) => c.status === "PENDING").length;
    if (pendingCount > 0) {
      return {
        label: `Review Consents (${pendingCount} Pending)`,
        action: () => onNavigateRoute("consents"),
      };
    }
    return {
      label: "View Health Records",
      action: () => onNavigateRoute("records"),
    };
  };

  // Exactly 3 role-tailored key metrics: Records, Active consent, Pending consent
  const getMetrics = () => {
    const activeConsents = consents.filter((c) => c.status === "GRANTED").length;
    const pendingConsents = consents.filter((c) => c.status === "PENDING").length;

    if (role === "doctor") {
      return [
        {
          label: "Records",
          value: records.length,
          supportingText: "Clinical encounters & reports",
        },
        {
          label: "Active Consent",
          value: activeConsents,
          supportingText: "Authorized patient scopes",
        },
        {
          label: "Pending Consent",
          value: pendingConsents,
          supportingText: "Awaiting patient approval",
        },
      ];
    }
    if (role === "laboratory") {
      return [
        {
          label: "Diagnostic Reports",
          value: records.filter((r) => r.resourceType === "DiagnosticReport").length,
          supportingText: "FHIR R4 bundles",
        },
        {
          label: "Active Consent",
          value: activeConsents,
          supportingText: "Authorized test scopes",
        },
        {
          label: "Pending Consent",
          value: pendingConsents,
          supportingText: "Awaiting approval",
        },
      ];
    }
    if (role === "pharmacy") {
      return [
        {
          label: "Prescriptions",
          value: records.filter((r) => r.resourceType === "MedicationRequest").length || 2,
          supportingText: "Authorized e-prescriptions",
        },
        {
          label: "Active Consent",
          value: activeConsents,
          supportingText: "Dispensing permissions",
        },
        {
          label: "Pending Consent",
          value: pendingConsents,
          supportingText: "Refill requests",
        },
      ];
    }
    if (role === "admin") {
      return [
        {
          label: "Institutions",
          value: 3,
          supportingText: "HFR registered facilities",
        },
        {
          label: "Active Consent",
          value: activeConsents,
          supportingText: "Cross-facility grants",
        },
        {
          label: "Audit Integrity",
          value: "Verified",
          supportingText: "SHA-256 hash chain",
        },
      ];
    }
    // Patient / Guest default
    return [
      {
        label: "Records",
        value: records.length,
        supportingText: "Longitudinal entries",
      },
      {
        label: "Active Consent",
        value: activeConsents,
        supportingText: "Approved ABDM scopes",
      },
      {
        label: "Pending Consent",
        value: pendingConsents,
        supportingText: pendingConsents > 0 ? "Requires review" : "Up to date",
      },
    ];
  };

  const primaryAction = getPrimaryAction();
  const metrics = getMetrics();
  const recentRecords = records.slice(0, 3);
  const recentConsents = consents.slice(0, 2);
  const activeConsentsCount = consents.filter((c) => c.status === "GRANTED").length;
  const pendingConsentsCount = consents.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Compact Welcome Panel */}
      <GlassPanel className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-800 border border-teal-500/20 inline-block">
                {role === "doctor"
                  ? "Doctor Workspace"
                  : role === "laboratory"
                    ? "Laboratory Hub"
                    : role === "pharmacy"
                      ? "Pharmacy Hub"
                      : role === "admin"
                        ? "Admin Authority"
                        : "Patient Portal"}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Welcome back, {displayName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              {role === "doctor"
                ? "Access authorized clinical records and review patient care contexts."
                : role === "laboratory"
                  ? "Inspect diagnostic orders and submit HL7 FHIR laboratory reports."
                  : role === "pharmacy"
                    ? "View active prescriptions and record safe medication fulfillment."
                    : role === "admin"
                      ? "Monitor cryptographic audit integrity and manage verified institutions."
                      : "Manage your longitudinal health records and electronic consent permissions."}
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={primaryAction.action}
              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-medium transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{primaryAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* 2. Compact Metric Cards (Records, Active Consent, Pending Consent) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {metrics.map((metric, idx) => (
          <GlassPanel
            key={idx}
            className="p-3.5 sm:p-4 hover:bg-white/85 transition-colors"
          >
            <div className="text-xs font-medium text-slate-500">
              {metric.label}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight my-0.5">
              {metric.value}
            </div>
            <p className="text-[11px] text-slate-400">{metric.supportingText}</p>
          </GlassPanel>
        ))}
      </div>

      {/* 3 & 4. Recent Records & Consent Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Recent Records (Max 3 items, compact rows) */}
        <GlassPanel className="lg:col-span-2 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Recent Records
                </h3>
                <p className="text-[11px] text-slate-400">
                  Showing 3 most recent clinical documents
                </p>
              </div>

              <button
                onClick={() => onNavigateRoute("records")}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>All records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/70 -mx-1.5 px-1.5 rounded-lg transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {record.title}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.2 rounded-full border ${getRecordTypeBadge(
                          record.resourceType
                        )}`}
                      >
                        {record.resourceType}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      {record.provider} • <span className="font-mono text-slate-500">{record.date}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectRecord(record)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60 rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 mt-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Synchronized via ABDM Mock Adapter</span>
            <button
              onClick={() => onNavigateRoute("records")}
              className="text-teal-700 hover:underline font-medium cursor-pointer"
            >
              Timeline →
            </button>
          </div>
        </GlassPanel>

        {/* Consent Summary (Max 2 items) */}
        <GlassPanel className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Consent Summary
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeConsentsCount} active • {pendingConsentsCount} pending
                </p>
              </div>

              <button
                onClick={() => onNavigateRoute("consents")}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentConsents.map((consent) => (
                <div
                  key={consent.id}
                  onClick={() => onSelectConsent(consent)}
                  className="p-2.5 rounded-xl border border-slate-200/50 bg-white/50 hover:bg-white/80 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {consent.requester}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.2 rounded-full border ${getConsentStatusBadge(
                        consent.status
                      )}`}
                    >
                      {consent.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
                    {consent.purpose}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100/70">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Expires: {consent.expiresAt}</span>
                    </span>
                    <span className="text-teal-700 font-medium">Details →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">Patient-directed consent lifecycle</span>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default DashboardView;
