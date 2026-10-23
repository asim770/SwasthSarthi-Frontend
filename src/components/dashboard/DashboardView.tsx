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
        return "bg-cyan-500/10 text-cyan-800 border-cyan-500/20";
      case "Encounter":
        return "bg-teal-500/10 text-teal-800 border-teal-500/20";
      case "Immunization":
        return "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";
      case "MedicationRequest":
        return "bg-amber-500/10 text-amber-800 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-800 border-slate-500/20";
    }
  };

  const getConsentStatusBadge = (status: string) => {
    switch (status) {
      case "GRANTED":
        return "bg-emerald-500/10 text-emerald-800 border-emerald-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-800 border-amber-500/20";
      case "REVOKED":
      case "EXPIRED":
        return "bg-rose-500/10 text-rose-800 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/20";
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

  // Exactly 3 role-tailored key metrics
  const getMetrics = () => {
    if (role === "doctor") {
      return [
        {
          label: "Care Contexts",
          value: records.length,
          supportingText: "Encounter & diagnostic records",
        },
        {
          label: "Active Consents",
          value: consents.filter((c) => c.status === "GRANTED").length,
          supportingText: "Authorized patient scopes",
        },
        {
          label: "Pending Requests",
          value: consents.filter((c) => c.status === "PENDING").length,
          supportingText: "Awaiting patient approval",
        },
      ];
    }
    if (role === "laboratory") {
      return [
        {
          label: "Diagnostic Reports",
          value: records.filter((r) => r.resourceType === "DiagnosticReport").length,
          supportingText: "FHIR R4 diagnostic bundles",
        },
        {
          label: "Pending Orders",
          value: 1,
          supportingText: "Awaiting specimen intake",
        },
        {
          label: "Network Facilities",
          value: 3,
          supportingText: "Connected diagnostic network",
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
          label: "Dispensed Medications",
          value: 1,
          supportingText: "Verified safe dispensations",
        },
        {
          label: "Pending Refills",
          value: 0,
          supportingText: "All orders up to date",
        },
      ];
    }
    if (role === "admin") {
      return [
        {
          label: "Registered Facilities",
          value: 3,
          supportingText: "HFR registry verified",
        },
        {
          label: "Verified Practitioners",
          value: 2,
          supportingText: "HPR credentials verified",
        },
        {
          label: "Audit Chain Integrity",
          value: "Verified",
          supportingText: "SHA-256 hash chain intact",
        },
      ];
    }
    // Patient / Guest default
    const pendingCount = consents.filter((c) => c.status === "PENDING").length;
    return [
      {
        label: "Health Records",
        value: records.length,
        supportingText: "Longitudinal clinical entries",
      },
      {
        label: "Active Consents",
        value: consents.filter((c) => c.status === "GRANTED").length,
        supportingText: "Approved ABDM permissions",
      },
      {
        label: "Pending Consent Requests",
        value: pendingCount,
        supportingText: pendingCount > 0 ? "Requires review" : "No pending requests",
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
    <div className="space-y-6">
      {/* A. Compact Welcome Section */}
      <GlassPanel className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-800 border border-teal-500/20 inline-block">
              {role === "doctor"
                ? "Doctor Workspace"
                : role === "laboratory"
                ? "Diagnostic Laboratory"
                : role === "pharmacy"
                ? "Pharmacy Hub"
                : role === "admin"
                ? "Administrative Authority"
                : "Patient Workspace"}
            </span>

            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Welcome back, {displayName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
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
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-medium transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{primaryAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* B. Reduced Metric Cards (Exactly 3 Key Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {metrics.map((metric, idx) => (
          <GlassPanel
            key={idx}
            className="p-4 sm:p-5 transition-all duration-150 hover:bg-white/85"
          >
            <div className="text-xs font-medium text-slate-500 mb-1.5">
              {metric.label}
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {metric.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{metric.supportingText}</p>
          </GlassPanel>
        ))}
      </div>

      {/* C & D. Progressive Disclosure: Recent Records & Consent Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Records (Max 3 items) */}
        <GlassPanel className="lg:col-span-2 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/50">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Recent Health Records
                </h3>
                <p className="text-[11px] text-slate-400">
                  Showing 3 most recent clinical documents
                </p>
              </div>

              <button
                onClick={() => onNavigateRoute("records")}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100/70">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-white/40 -mx-2 px-2 rounded-xl transition-colors"
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
                      {record.provider} • <span className="font-mono">{record.date}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectRecord(record)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-teal-900 hover:bg-white/90 border border-slate-200/60 rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Synchronized via ABDM Mock Adapter</span>
            <button
              onClick={() => onNavigateRoute("records")}
              className="text-teal-700 hover:underline font-medium cursor-pointer"
            >
              Explore Longitudinal Timeline →
            </button>
          </div>
        </GlassPanel>

        {/* Consent Summary (Max 2 items) */}
        <GlassPanel className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/50">
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
                className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentConsents.map((consent) => (
                <div
                  key={consent.id}
                  onClick={() => onSelectConsent(consent)}
                  className="p-3 rounded-xl border border-slate-200/50 bg-white/50 hover:bg-white/80 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
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

                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                    {consent.purpose}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100/70">
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

          <div className="pt-3 mt-3 border-t border-slate-200/50 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">Patient-directed consent lifecycle</span>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
