import React, { useState } from "react";
import {
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Search,
  IdCard,
  AlertCircle,
  Database,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { GlassPanel } from "../ui/GlassPanel";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPatientComprehensiveInfo,
  changePassword,
  linkGoogleAccount,
  fetchGoogleConfig,
  ApiError,
} from "../../api/client";
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
  const [copiedPid, setCopiedPid] = useState(false);

  // Patient ID Info Quick Lookup state
  const [lookupPid, setLookupPid] = useState<string>(user?.patientId || "PID-10000001");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<any | null>(null);

  // Change Password state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [currentPasswordVal, setCurrentPasswordVal] = useState<string>("");
  const [newPasswordVal, setNewPasswordVal] = useState<string>("");
  const [confirmNewPasswordVal, setConfirmNewPasswordVal] = useState<string>("");
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState<boolean>(false);
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Google Link state
  const [googleLinkLoading, setGoogleLinkLoading] = useState<boolean>(false);
  const [googleLinkMsg, setGoogleLinkMsg] = useState<string | null>(null);

  const handleCopyPid = (pid: string) => {
    navigator.clipboard.writeText(pid);
    setCopiedPid(true);
    setTimeout(() => setCopiedPid(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordVal) {
      setPasswordChangeError("Please enter your current password.");
      return;
    }
    if (newPasswordVal.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d).*$/.test(newPasswordVal)) {
      setPasswordChangeError("New password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    if (newPasswordVal !== confirmNewPasswordVal) {
      setPasswordChangeError("New passwords do not match.");
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeError(null);
    setPasswordChangeMsg(null);

    try {
      const res = await changePassword({
        currentPassword: currentPasswordVal,
        newPassword: newPasswordVal,
      });
      setPasswordChangeMsg(res.message || "Password changed successfully.");
      setCurrentPasswordVal("");
      setNewPasswordVal("");
      setConfirmNewPasswordVal("");
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordChangeMsg(null);
      }, 2000);
    } catch (err: any) {
      setPasswordChangeError(
        err instanceof ApiError ? err.message : "Failed to change password. Please check your current password."
      );
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLinkLoading(true);
    setGoogleLinkMsg(null);
    try {
      const cfg = await fetchGoogleConfig();
      if (!cfg.clientId) {
        // Dev simulation
        const mockSub = `goog_${Date.now()}`;
        const mockEmail = user?.email || "patient@gmail.com";
        const mockToken = `mock-google-token:${mockSub}:${mockEmail}`;
        const res = await linkGoogleAccount({ credential: mockToken });
        setGoogleLinkMsg(res.message || "Google account linked successfully!");
      } else {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          cfg.clientId
        )}&redirect_uri=${encodeURIComponent(
          cfg.redirectUri
        )}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
        window.location.href = authUrl;
      }
    } catch (err: any) {
      setGoogleLinkMsg(err instanceof ApiError ? err.message : "Failed to link Google account.");
    } finally {
      setGoogleLinkLoading(false);
    }
  };

  const handleFetchPatientInfo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lookupPid.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    try {
      const data = await fetchPatientComprehensiveInfo(lookupPid.trim());
      setLookupData(data);
    } catch (err) {
      setLookupError(
        err instanceof ApiError
          ? err.message
          : "Failed to fetch patient information for this Patient ID."
      );
      setLookupData(null);
    } finally {
      setLookupLoading(false);
    }
  };

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
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-[#f0fdfa] text-[#008080] border border-[#b2d8d8] inline-block">
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

            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-[#172033] tracking-tight">
                Welcome back, {displayName}
              </h2>
              {user?.patientId && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f0fdfa] border border-[#b2d8d8] rounded-lg text-xs font-mono font-bold text-[#008080]">
                  <span>Patient ID: {user.patientId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyPid(user.patientId!)}
                    title="Copy Patient ID"
                    className="hover:text-[#004c4c] p-0.5 rounded cursor-pointer"
                  >
                    {copiedPid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-xl">
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
              className="px-4 py-2 bg-[#008080] hover:bg-[#006666] active:bg-[#004c4c] text-white rounded-[12px] text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{primaryAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* 2. Patient ID Comprehensive Info Lookup Inspector */}
      <GlassPanel className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#d7eaea]/70">
          <div>
            <div className="flex items-center gap-2">
              <IdCard className="w-4 h-4 text-[#008080]" />
              <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                Fetch All Info by Patient ID
              </h3>
            </div>
            <p className="text-xs text-[#64748b] mt-0.5">
              Enter any unique Patient ID (e.g. PID-10000001) to fetch all profile details, clinical records, and consents.
            </p>
          </div>

          <form onSubmit={handleFetchPatientInfo} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={lookupPid}
                onChange={(e) => setLookupPid(e.target.value)}
                placeholder="Enter Patient ID (PID-...)"
                className="pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white w-48 sm:w-56 shadow-2xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={lookupLoading || !lookupPid.trim()}
              className="px-3 py-1.5 bg-[#008080] hover:bg-[#006666] active:bg-[#004c4c] text-white rounded-[10px] text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{lookupLoading ? "Fetching..." : "Fetch Info"}</span>
              <Database className="w-3 h-3" />
            </button>
          </form>
        </div>

        {lookupError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-[10px] text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}

        {lookupData && (
          <div className="mt-3 p-3.5 bg-gradient-to-br from-[#f0fdfa]/80 to-white border border-[#b2d8d8] rounded-xl space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d7eaea] pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#008080] text-white flex items-center justify-center font-bold text-xs">
                  {lookupData.patient?.name ? lookupData.patient.name.slice(0, 2).toUpperCase() : "PT"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{lookupData.patient?.name}</span>
                    <span className="text-[10px] font-mono font-bold bg-white text-[#008080] border border-[#b2d8d8] px-2 py-0.5 rounded-md">
                      {lookupData.patient?.patientId || lookupPid}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {lookupData.patient?.email} • {lookupData.patient?.phone} • {lookupData.patient?.gender || "Not specified"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateRoute("records")}
                className="text-xs text-[#008080] hover:text-[#004c4c] font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>View Full Timeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Record Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">Clinical Records</div>
                <div className="text-base font-bold text-slate-900">{lookupData.recordsSummary?.totalClinicalRecords ?? 0}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">Active Consents</div>
                <div className="text-base font-bold text-slate-900">{lookupData.recordsSummary?.totalConsents ?? 0}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">Prescriptions</div>
                <div className="text-base font-bold text-slate-900">{lookupData.recordsSummary?.totalPrescriptions ?? 0}</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">Lab Orders</div>
                <div className="text-base font-bold text-slate-900">{lookupData.recordsSummary?.totalLabOrders ?? 0}</div>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* 3. Compact Metric Cards (Records, Active Consent, Pending Consent) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {metrics.map((metric, idx) => (
          <GlassPanel
            key={idx}
            className="p-3.5 sm:p-4 hover:bg-white/95 transition-colors"
          >
            <div className="text-xs font-medium text-[#64748b]">
              {metric.label}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight my-0.5">
              {metric.value}
            </div>
            <p className="text-[11px] text-[#64748b]">{metric.supportingText}</p>
          </GlassPanel>
        ))}
      </div>

      {/* 3 & 4. Recent Records & Consent Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Recent Records (Max 3 items, compact rows) */}
        <GlassPanel className="lg:col-span-2 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#d7eaea]/70">
              <div>
                <h3 className="text-sm font-semibold text-[#172033] tracking-tight">
                  Recent Records
                </h3>
                <p className="text-[11px] text-[#64748b]">
                  Showing 3 most recent clinical documents
                </p>
              </div>

              <button
                onClick={() => onNavigateRoute("records")}
                className="text-xs text-[#008080] hover:text-[#006666] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>All records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#d7eaea]/50">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="py-2.5 flex items-center justify-between gap-3 group hover:bg-[#f0fdfa]/60 -mx-1.5 px-1.5 rounded-lg transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-[#172033] truncate">
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

                    <p className="text-[11px] text-[#64748b] truncate">
                      {record.provider} • <span className="font-mono text-[#64748b]">{record.date}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectRecord(record)}
                    className="px-2.5 py-1 text-xs text-[#008080] hover:text-[#006666] hover:bg-[#f0fdfa] border border-[#d7eaea] rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs font-medium"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 mt-2.5 border-t border-[#d7eaea]/70 text-[11px] text-[#64748b] flex items-center justify-between">
            <span>Synchronized via ABDM Mock Adapter</span>
            <button
              onClick={() => onNavigateRoute("records")}
              className="text-[#008080] hover:text-[#006666] hover:underline font-semibold cursor-pointer"
            >
              Timeline →
            </button>
          </div>
        </GlassPanel>

        {/* 4. Patient Identity & Account Security Section */}
        <GlassPanel className="p-4 sm:p-5 flex flex-col justify-between rounded-none border border-slate-300">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#008080]" />
                <div>
                  <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                    Account Security &amp; Identity
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Patient ID, Authentication &amp; Linked Providers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-none border border-slate-300 cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3 text-slate-600" />
                  <span>Password</span>
                </button>
                {!user?.isGoogleLinked && (
                  <button
                    type="button"
                    disabled={googleLinkLoading}
                    onClick={handleLinkGoogle}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-none border border-slate-300 cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>{googleLinkLoading ? "Linking..." : "+ Link Google"}</span>
                  </button>
                )}
              </div>
            </div>

            {googleLinkMsg && (
              <div className="mb-2 p-2 bg-teal-50 border border-teal-300 rounded-none text-xs text-teal-900">
                {googleLinkMsg}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-none">
                <span className="text-slate-500">Patient ID:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#008080]">
                  <span>{user?.patientId || "PID-10000001"}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyPid(user?.patientId || "PID-10000001")}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {copiedPid ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-none">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                  {user?.email || "rahul.verma@synthetic.demo"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-none">
                <span className="text-slate-500">Auth Method:</span>
                <span className="font-bold text-teal-800">
                  {user?.isGoogleLinked || user?.authProviders?.includes("google")
                    ? "Google OAuth & Password"
                    : "Patient ID / Email & Password"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 mt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Immutable Internal Patient ID</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Verified Session</span>
            </span>
          </div>
        </GlassPanel>

        {/* Consent Summary (Max 2 items) */}
        <GlassPanel className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#d7eaea]/70">
              <div>
                <h3 className="text-sm font-semibold text-[#172033] tracking-tight">
                  Consent Summary
                </h3>
                <p className="text-[11px] text-[#64748b]">
                  {activeConsentsCount} active • {pendingConsentsCount} pending
                </p>
              </div>

              <button
                onClick={() => onNavigateRoute("consents")}
                className="text-xs text-[#008080] hover:text-[#006666] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
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
                  className="p-2.5 rounded-xl border border-[#d7eaea] bg-white/70 hover:bg-[#f0fdfa]/70 hover:border-[#b2d8d8] transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#172033] truncate">
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

                  <p className="text-[11px] text-[#475569] line-clamp-1 mb-1.5">
                    {consent.purpose}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#64748b] pt-1 border-t border-[#d7eaea]/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#64748b]" />
                      <span>Expires: {consent.expiresAt}</span>
                    </span>
                    <span className="text-[#008080] font-semibold">Details →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 mt-2.5 border-t border-[#d7eaea]/70 flex items-center gap-1.5 text-[11px] text-[#64748b]">
            <Sparkles className="w-3.5 h-3.5 text-[#008080] shrink-0" />
            <span className="truncate">Patient-directed consent lifecycle</span>
          </div>
        </GlassPanel>
      </div>

      {/* Change Password Dialog */}
      <Dialog
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setPasswordChangeError(null);
          setPasswordChangeMsg(null);
        }}
        title="Change Account Password"
        description="Verify your current password and establish a new strong password."
        maxWidth="sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-3.5 font-sans">
          {passwordChangeMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-none text-xs text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{passwordChangeMsg}</span>
            </div>
          )}

          {passwordChangeError && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-none text-xs text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{passwordChangeError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPasswordVal}
              onChange={(e) => setCurrentPasswordVal(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-none focus:outline-none focus:ring-1 focus:ring-[#008080] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showChangePassword ? "text" : "password"}
                required
                minLength={8}
                value={newPasswordVal}
                onChange={(e) => setNewPasswordVal(e.target.value)}
                placeholder="Min 8 chars (letter + number)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-none focus:outline-none focus:ring-1 focus:ring-[#008080] bg-white pr-8"
              />
              <button
                type="button"
                onClick={() => setShowChangePassword((p: boolean) => !p)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showChangePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type={showChangePassword ? "text" : "password"}
              required
              value={confirmNewPasswordVal}
              onChange={(e) => setConfirmNewPasswordVal(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-none focus:outline-none focus:ring-1 focus:ring-[#008080] bg-white"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1 rounded-none"
              onClick={() => setShowChangePasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 rounded-none"
              isLoading={passwordChangeLoading}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default DashboardView;
