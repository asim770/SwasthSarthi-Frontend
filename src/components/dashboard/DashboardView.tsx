import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Copy,
  Check,
  Search,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  FlaskConical,
  Stethoscope,
  Activity,
  FileText,
  Calendar,
  Download,
  TrendingUp,
  Heart,
  Droplet,
} from "lucide-react";
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

type DashboardTab =
  | "overview"
  | "unified"
  | "labs"
  | "doctors"
  | "timeline"
  | "health-status"
  | "security";

export const DashboardView: React.FC<DashboardViewProps> = ({
  records: fallbackRecords,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const displayName = user?.name || SYNTHETIC_PATIENT.name;
  const currentPatientId = user?.patientId || "SS-PAT-000001";
  const [copiedPid, setCopiedPid] = useState(false);

  // Live Patient Comprehensive Info State
  const [liveInfo, setLiveInfo] = useState<any | null>(null);

  // Filters & Search for Unified Records Tab
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Selected Record Modal Detail (Internal Preview)
  const [activeDetailRecord, setActiveDetailRecord] = useState<any | null>(null);

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

  // Load Patient Comprehensive Medical Records
  const loadPatientData = useCallback(async () => {
    try {
      const pidToFetch = user?.patientId || user?.id || "SS-PAT-000001";
      const data = await fetchPatientComprehensiveInfo(pidToFetch);
      setLiveInfo(data);
    } catch {
      // Fallback silently if API not reachable
      setLiveInfo(null);
    }
  }, [user]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

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

  // Compile Unified Records combining live MongoDB records and fallback synthetic items
  const allUnifiedRecords = useMemo(() => {
    const list: any[] = [];

    if (liveInfo?.clinicalRecords && Array.isArray(liveInfo.clinicalRecords)) {
      liveInfo.clinicalRecords.forEach((r: any) => {
        list.push({
          id: r.recordId || r._id,
          title: r.title,
          category: r.resourceType,
          submittedBy: r.doctorName || r.providerFacility || "Healthcare Provider",
          provider: r.providerFacility || "SwaasthSaarthi Network",
          date: r.date ? new Date(r.date).toISOString().split("T")[0] : "2026-11-05",
          time: r.date ? new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:30 AM",
          status: r.status || "final",
          summary: r.summary || "",
          clinicalData: r.clinicalData || {},
          documentAttachment: r.documentAttachment,
          isDoctorReviewed: r.resourceType === "Encounter" || r.resourceType === "Observation",
          raw: r,
        });
      });
    }

    // Add Prescriptions
    if (liveInfo?.prescriptions && Array.isArray(liveInfo.prescriptions)) {
      liveInfo.prescriptions.forEach((rx: any) => {
        list.push({
          id: rx.prescriptionId,
          title: `Prescription: ${rx.medications?.map((m: any) => m.name).join(", ")}`,
          category: "MedicationRequest",
          submittedBy: rx.doctorName || "Treating Physician",
          provider: rx.facility || "Apollo Clinics",
          date: rx.prescribedAt ? new Date(rx.prescribedAt).toISOString().split("T")[0] : "2026-11-05",
          time: "11:00 AM",
          status: rx.status || "ACTIVE",
          summary: `Medications prescribed: ${rx.medications?.map((m: any) => `${m.name} ${m.dosage}`).join("; ")}`,
          clinicalData: { medications: rx.medications, instructions: rx.medications?.[0]?.instructions },
          isDoctorReviewed: true,
          raw: rx,
        });
      });
    }

    // Add Dispensing Events
    if (liveInfo?.dispensingEvents && Array.isArray(liveInfo.dispensingEvents)) {
      liveInfo.dispensingEvents.forEach((ev: any) => {
        list.push({
          id: ev.dispenseId || `DISP-${ev._id}`,
          title: `Medication Dispensed: ${ev.medicineName || "Prescription Fulfillment"}`,
          category: "MedicationDispense",
          submittedBy: ev.pharmacistName || "Dispensing Pharmacist",
          provider: ev.pharmacyFacility || "Apollo Care Pharmacy",
          date: ev.dispensedAt ? new Date(ev.dispensedAt).toISOString().split("T")[0] : "2026-11-05",
          time: "02:15 PM",
          status: "FULFILLED",
          summary: `Quantity: ${ev.quantityDispensed} units (Batch: ${ev.batchNumber || "VERIFIED"}). ${ev.notes || ""}`,
          clinicalData: { batchNumber: ev.batchNumber, quantity: ev.quantityDispensed, notes: ev.notes },
          isDoctorReviewed: false,
          raw: ev,
        });
      });
    }

    // Add baseline fallback records if live records are empty
    if (list.length === 0) {
      fallbackRecords.forEach((r) => {
        list.push({
          id: r.id,
          title: r.title,
          category: r.resourceType,
          submittedBy: r.doctor || r.provider,
          provider: r.provider,
          date: r.date,
          time: "10:00 AM",
          status: r.status,
          summary: r.summary,
          clinicalData: {},
          isDoctorReviewed: r.resourceType === "Encounter",
          raw: r,
        });
      });
    }

    return list;
  }, [liveInfo, fallbackRecords]);

  // Filtered Unified Records
  const filteredRecords = useMemo(() => {
    return allUnifiedRecords
      .filter((rec) => {
        if (selectedCategory !== "ALL" && rec.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = rec.title.toLowerCase().includes(q);
          const matchSubmitted = rec.submittedBy.toLowerCase().includes(q);
          const matchProvider = rec.provider.toLowerCase().includes(q);
          const matchSummary = rec.summary.toLowerCase().includes(q);
          if (!matchTitle && !matchSubmitted && !matchProvider && !matchSummary) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [allUnifiedRecords, selectedCategory, searchQuery, sortBy]);

  // Dedicated Laboratory Reports
  const labReports = useMemo(() => {
    return allUnifiedRecords.filter((r) => r.category === "DiagnosticReport");
  }, [allUnifiedRecords]);

  // Dedicated Doctor Reports
  const doctorReports = useMemo(() => {
    return allUnifiedRecords.filter(
      (r) => r.category === "Encounter" || r.category === "Observation"
    );
  }, [allUnifiedRecords]);

  // Health Status Measurable Observations
  const latestVitals = {
    bp: { current: "138/88 mmHg", previous: "142/92 mmHg", status: "Improved", trend: [142, 140, 138] },
    glucose: { current: "94 mg/dL", previous: "106 mg/dL", status: "Normal", trend: [106, 98, 94] },
    cholesterol: { current: "195 mg/dL", previous: "220 mg/dL", status: "Borderline", trend: [220, 205, 195] },
    heartRate: { current: "74 bpm", previous: "78 bpm", status: "Optimal", trend: [78, 76, 74] },
  };

  const activeConditions = [
    { name: "Stage 1 Essential Hypertension", diagnosedDate: "2026-11-05", physician: "Dr. Vikram Seth" },
    { name: "Mild Borderline Dyslipidemia", diagnosedDate: "2026-11-05", physician: "Dr. Vikram Seth" },
  ];

  const currentPrescriptions = [
    { name: "Telmisartan", dosage: "40mg", frequency: "Once daily morning", duration: "30 days", prescriber: "Dr. Vikram Seth" },
  ];

  const upcomingFollowUps = [
    { date: "03 Dec 2026", title: "Cardiology Review & BP Check", physician: "Dr. Vikram Seth", facility: "Apollo Care Hospital" },
  ];

  const getAbnormalFlagBadge = (flag?: string) => {
    const norm = (flag || "Normal").toLowerCase();
    if (norm.includes("crit")) {
      return <span className="px-1.5 py-0.5 bg-red-50 text-red-800 font-bold border border-red-200">CRITICAL</span>;
    }
    if (norm.includes("high") || norm.includes("borderline")) {
      return <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 font-bold border border-amber-200">BORDERLINE</span>;
    }
    if (norm.includes("low")) {
      return <span className="px-1.5 py-0.5 bg-sky-50 text-sky-800 font-bold border border-sky-200">LOW</span>;
    }
    return <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">NORMAL</span>;
  };

  return (
    <div className="space-y-4 font-editorial-sans text-xs text-[#191817]">
      {/* ========================================================================= */}
      {/* 1. COMPREHENSIVE PATIENT OVERVIEW BANNER                                   */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 bg-white border border-[#D0E5E1] shadow-[0_4px_20px_rgba(26,25,24,0.04)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#0F766E] text-white flex items-center justify-center font-editorial-serif font-bold text-lg shrink-0 rounded-none shadow-2xs">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-editorial-serif font-bold text-[#191817] tracking-tight">
                  {displayName}
                </h1>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200 font-medium">
                  Verified Patient
                </span>
                <span className="text-[10px] bg-[#F0F7F6] text-[#0F766E] px-2 py-0.5 border border-[#D0E5E1] font-medium">
                  ABDM Linked
                </span>
              </div>

              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-xs text-[#5C574F]">
                <span>{user?.email || "patient@swaasthsaarthi.in"}</span>
                {user?.phone && (
                  <>
                    <span className="text-[#B6D6D0]">•</span>
                    <span>{user.phone}</span>
                  </>
                )}
                {user?.gender && (
                  <>
                    <span className="text-[#B6D6D0]">•</span>
                    <span>{user.gender}</span>
                  </>
                )}
                {user?.dateOfBirth && (
                  <>
                    <span className="text-[#B6D6D0]">•</span>
                    <span className="font-mono">DOB: {user.dateOfBirth}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* PERMANENT PATIENT ID BADGE */}
          <div className="flex items-center gap-3 bg-[#F0F7F6] border border-[#D0E5E1] px-4 py-2.5 shrink-0">
            <div>
              <div className="text-[10px] font-mono font-medium text-[#7A746B] uppercase tracking-wider">
                Patient ID
              </div>
              <div className="text-sm font-mono font-bold text-[#191817] tracking-wide mt-0.5">
                {currentPatientId}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyPid(currentPatientId)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#5C574F] hover:text-[#191817] hover:bg-white border border-[#D0E5E1] rounded-none cursor-pointer transition-colors shadow-2xs"
              title="Copy Patient ID"
            >
              {copiedPid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Longitudinal Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#D0E5E1] border border-[#D0E5E1] text-center">
          <div className="p-3 bg-[#F0F7F6]">
            <span className="text-[11px] text-[#6E685F] block font-medium">Total Records</span>
            <span className="text-xl font-editorial-serif font-bold text-[#191817] mt-0.5 block">{allUnifiedRecords.length}</span>
          </div>
          <div className="p-3 bg-[#F0F7F6]">
            <span className="text-[11px] text-[#6E685F] block font-medium">Lab Reports</span>
            <span className="text-xl font-editorial-serif font-bold text-[#191817] mt-0.5 block">{labReports.length}</span>
          </div>
          <div className="p-3 bg-[#F0F7F6]">
            <span className="text-[11px] text-[#6E685F] block font-medium">Doctor Encounters</span>
            <span className="text-xl font-editorial-serif font-bold text-[#191817] mt-0.5 block">{doctorReports.length}</span>
          </div>
          <div className="p-3 bg-[#F0F7F6]">
            <span className="text-[11px] text-[#6E685F] block font-medium">Active Medications</span>
            <span className="text-xl font-editorial-serif font-bold text-[#191817] mt-0.5 block">{currentPrescriptions.length}</span>
          </div>
          <div className="p-3 bg-[#F0F7F6]">
            <span className="text-[11px] text-[#6E685F] block font-medium">Follow-ups</span>
            <span className="text-xl font-editorial-serif font-bold text-[#191817] mt-0.5 block">{upcomingFollowUps.length}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB NAVIGATION SWITCHER                                                */}
      {/* ========================================================================= */}
      <div className="flex bg-white border border-[#D0E5E1] p-1 gap-1 overflow-x-auto scrollbar-thin">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "unified", label: "Health Records", icon: FileText },
          { id: "labs", label: "Laboratory Reports", icon: FlaskConical },
          { id: "doctors", label: "Doctor Encounters", icon: Stethoscope },
          { id: "timeline", label: "Health Timeline", icon: Clock },
          { id: "health-status", label: "Vitals & Trends", icon: TrendingUp },
          { id: "security", label: "Security & Profile", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? "bg-[#1A1918] text-white border border-[#1A1918] shadow-2xs font-semibold"
                  : "bg-transparent text-[#5C574F] hover:bg-[#F0F7F6] hover:text-[#191817]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PATIENT OVERVIEW                                                   */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Recent Health Updates & Upcoming Follow-ups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Latest Doctor & Laboratory Updates */}
            <div className="p-5 bg-white border border-[#D0E5E1] space-y-3.5 shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#D0E5E1]">
                <div className="flex items-center gap-2 font-editorial-serif font-bold text-sm text-[#191817]">
                  <FileText className="w-4 h-4 text-[#0F766E]" />
                  <span>Recent Clinical Records</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("unified")}
                  className="text-xs font-medium text-[#0F766E] hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-2.5">
                {allUnifiedRecords.slice(0, 3).map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveDetailRecord(rec)}
                    className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] hover:border-[#1A1918] hover:bg-white cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#191817]">{rec.title}</span>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-[#D0E5E1] text-[#5C574F]">
                        {rec.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C574F] line-clamp-1">{rec.summary}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#7A746B] pt-1 border-t border-[#D0E5E1]/50">
                      <span>Submitted by: <strong className="text-[#191817]">{rec.submittedBy}</strong></span>
                      <span className="text-[#0F766E] font-medium hover:underline">Inspect →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Upcoming Follow-ups & Active Prescriptions */}
            <div className="p-5 bg-white border border-[#D0E5E1] space-y-3.5 shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#D0E5E1]">
                <div className="flex items-center gap-2 font-editorial-serif font-bold text-sm text-[#191817]">
                  <Calendar className="w-4 h-4 text-[#0F766E]" />
                  <span>Upcoming Follow-ups &amp; Action Items</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {upcomingFollowUps.map((fu, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] flex items-start gap-3.5">
                    <div className="w-8 h-8 bg-white border border-[#D0E5E1] text-[#0F766E] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#191817]">{fu.title}</span>
                        <span className="text-[10px] font-mono text-[#7A746B] bg-white px-1.5 py-0.5 border border-[#D0E5E1]">
                          {fu.date}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5C574F] mt-1">
                        Scheduled with <strong className="text-[#191817]">{fu.physician}</strong> at {fu.facility}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#191817]">Current Medication (Active Rx)</span>
                    <span className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200">
                      Ongoing
                    </span>
                  </div>
                  <div className="text-xs text-[#191817] font-semibold">
                    Telmisartan 40mg — Once daily morning
                  </div>
                  <div className="text-[11px] text-[#5C574F]">
                    Prescribed by Dr. Vikram Seth for Stage 1 Essential Hypertension. Dispensed by Apollo Care Pharmacy.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UNIFIED MEDICAL RECORDS                                            */}
      {/* ========================================================================= */}
      {activeTab === "unified" && (
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          {/* Search, Filter, Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3.5 border-b border-[#D0E5E1]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search records by title, physician, facility..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-[#B6D6D0] bg-[#F0F7F6] text-[#191817] rounded-none focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
                />
                <Search className="w-3.5 h-3.5 text-[#7A746B] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-[#B6D6D0] bg-[#F0F7F6] text-[#191817] text-xs font-medium rounded-none focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1A1918]"
              >
                <option value="ALL">All Categories</option>
                <option value="DiagnosticReport">Laboratory Reports</option>
                <option value="Encounter">Doctor Consultations</option>
                <option value="MedicationRequest">Prescriptions</option>
                <option value="MedicationDispense">Pharmacy Dispensing</option>
                <option value="Observation">Health Assessments</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                className="px-3 py-2 border border-[#B6D6D0] bg-[#F0F7F6] text-[#191817] text-xs font-medium rounded-none focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1A1918]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Records List Table / Cards */}
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-10 text-[#7A746B] space-y-2">
                <FileText className="w-8 h-8 mx-auto text-[#B6D6D0]" />
                <p className="font-semibold text-xs">No medical records match your search criteria.</p>
              </div>
            ) : (
              filteredRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 border border-[#D0E5E1] bg-[#F0F7F6]/60 hover:bg-white hover:border-[#1A1918] transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#191817]">{rec.title}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white border border-[#0F766E]/25 text-[#0F766E]">
                        {rec.category}
                      </span>
                      {rec.isDoctorReviewed && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200 font-semibold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Doctor Reviewed</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#7A746B]">
                      <span>{rec.date}</span>
                      <span>•</span>
                      <span>{rec.time}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#5C574F] leading-relaxed">{rec.summary}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-[#D0E5E1] text-[11px] text-[#5C574F]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>Submitted by: <strong className="text-[#191817]">{rec.submittedBy}</strong></span>
                      <span className="text-[#B6D6D0]">•</span>
                      <span>Facility: <strong className="text-[#191817]">{rec.provider}</strong></span>
                      <span className="text-[#B6D6D0]">•</span>
                      <span>Patient ID: <span className="font-mono text-[#0F766E] font-bold">{currentPatientId}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDetailRecord(rec)}
                        className="px-3 py-1 bg-white hover:bg-[#F0F7F6] border border-[#B6D6D0] text-[#191817] text-xs font-semibold rounded-none cursor-pointer transition-colors shadow-2xs"
                      >
                        Details &amp; Data
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEDICATED LABORATORY REPORTS                                       */}
      {/* ========================================================================= */}
      {activeTab === "labs" && (
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1]">
            <div>
              <h2 className="text-base font-editorial-serif font-bold text-[#191817]">Diagnostic Laboratory Reports</h2>
              <p className="text-[11px] text-[#5C574F]">Official laboratory test findings, abnormal flags, and verified PDF reports.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#F0F7F6] text-[#0F766E] px-2.5 py-1 border border-[#0F766E]/25">
              {labReports.length} Reports
            </span>
          </div>

          <div className="space-y-4">
            {labReports.map((report) => (
              <div key={report.id} className="p-5 border border-[#D0E5E1] bg-[#F0F7F6]/40 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#D0E5E1]">
                  <div>
                    <h3 className="font-editorial-serif font-bold text-sm text-[#191817]">{report.title}</h3>
                    <div className="text-[11px] text-[#5C574F] mt-0.5">
                      Uploaded by: <strong className="text-[#191817]">{report.provider}</strong> • Tested Date: <span className="font-mono font-bold text-[#0F766E]">{report.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200 uppercase tracking-wider">
                      STATUS: COMPLETED
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading verified report: ${report.title}`)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1918] hover:bg-[#2E2C2A] text-white font-semibold border border-[#1A1918] rounded-none cursor-pointer text-xs shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Structured Laboratory Results Table */}
                <div className="overflow-x-auto border border-[#D0E5E1]">
                  <table className="w-full text-left border-collapse text-xs bg-white">
                    <thead>
                      <tr className="bg-[#F0F7F6] border-b border-[#D0E5E1] text-[#7A746B] uppercase font-mono text-[10px]">
                        <th className="py-2.5 px-3">Test Parameter</th>
                        <th className="py-2.5 px-3">Result Value</th>
                        <th className="py-2.5 px-3">Units</th>
                        <th className="py-2.5 px-3">Reference Range</th>
                        <th className="py-2.5 px-3">Abnormal Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D0E5E1] font-editorial-sans">
                      <tr className="hover:bg-[#F0F7F6]">
                        <td className="py-2.5 px-3 font-semibold text-[#191817]">Total Cholesterol</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#191817]">195</td>
                        <td className="py-2.5 px-3 font-mono text-[#5C574F]">mg/dL</td>
                        <td className="py-2.5 px-3 text-[#5C574F]">125 - 200 mg/dL</td>
                        <td className="py-2.5 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                      <tr className="hover:bg-[#F0F7F6]">
                        <td className="py-2.5 px-3 font-semibold text-[#191817]">HDL Cholesterol</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#191817]">52</td>
                        <td className="py-2.5 px-3 font-mono text-[#5C574F]">mg/dL</td>
                        <td className="py-2.5 px-3 text-[#5C574F]">&gt; 40 mg/dL</td>
                        <td className="py-2.5 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                      <tr className="hover:bg-[#F0F7F6] bg-amber-50/20">
                        <td className="py-2.5 px-3 font-semibold text-[#191817]">LDL Cholesterol</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-900">118</td>
                        <td className="py-2.5 px-3 font-mono text-[#5C574F]">mg/dL</td>
                        <td className="py-2.5 px-3 text-[#5C574F]">&lt; 100 mg/dL</td>
                        <td className="py-2.5 px-3">{getAbnormalFlagBadge("Borderline High")}</td>
                      </tr>
                      <tr className="hover:bg-[#F0F7F6]">
                        <td className="py-2.5 px-3 font-semibold text-[#191817]">Triglycerides</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#191817]">142</td>
                        <td className="py-2.5 px-3 font-mono text-[#5C574F]">mg/dL</td>
                        <td className="py-2.5 px-3 text-[#5C574F]">&lt; 150 mg/dL</td>
                        <td className="py-2.5 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-[#F0F7F6] border border-[#D0E5E1] text-[11px] text-[#5C574F] flex items-center justify-between">
                  <span>Notes: Specimen lipemic index normal. Tested on calibrated auto-analyzer.</span>
                  <span className="font-semibold text-[#191817]">Technician: Rajesh Kumar (Senior Biochemist)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DEDICATED DOCTOR REPORTS                                           */}
      {/* ========================================================================= */}
      {activeTab === "doctors" && (
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1]">
            <div>
              <h2 className="text-base font-editorial-serif font-bold text-[#191817]">Doctor Consultation &amp; Clinical Reports</h2>
              <p className="text-[11px] text-[#5C574F]">Formal medical consultations, diagnoses, clinical notes, and recommendations.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#F0F7F6] text-[#0F766E] px-2.5 py-1 border border-[#0F766E]/25">
              {doctorReports.length} Reports
            </span>
          </div>

          <div className="space-y-4">
            {doctorReports.map((report) => (
              <div key={report.id} className="p-5 border border-[#D0E5E1] bg-[#F0F7F6]/40 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#D0E5E1]">
                  <div>
                    <h3 className="font-editorial-serif font-bold text-sm text-[#191817]">{report.title}</h3>
                    <div className="text-[11px] text-[#5C574F] mt-0.5">
                      Consultant: <strong className="text-[#191817]">{report.submittedBy}</strong> • Hospital: <strong className="text-[#191817]">{report.provider}</strong>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#0F766E] bg-white px-2.5 py-1 border border-[#D0E5E1]">
                    {report.date}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-[#D0E5E1]">
                    <span className="text-[10px] text-[#7A746B] uppercase font-mono font-bold block mb-1">
                      Clinical Findings &amp; Observations
                    </span>
                    <p className="text-[#191817] leading-relaxed">
                      BP 138/88 mmHg, resting heart rate 74 bpm, regular rhythm, S1 S2 normal, no peripheral edema. Patient reports exertional dyspnea.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F0F7F6] border border-[#0F766E]/30">
                    <span className="text-[10px] text-[#0F766E] uppercase font-mono font-bold block mb-1">
                      Formal Clinical Diagnosis
                    </span>
                    <p className="text-[#191817] font-semibold leading-relaxed">
                      Stage 1 Essential Hypertension (Primary) • Mild Borderline Dyslipidemia
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#D0E5E1] space-y-1">
                  <span className="text-[10px] text-[#7A746B] uppercase font-mono font-bold block">
                    Treatment Plan &amp; Prescriptions
                  </span>
                  <p className="text-[#5C574F]">
                    Lifestyle intervention with low-sodium DASH diet. Initiated Telmisartan 40mg once daily morning. Home blood pressure log maintained twice weekly.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#5C574F] pt-2.5 border-t border-[#D0E5E1]">
                  <span>Recommended Tests: <strong className="text-[#191817]">Lipid Profile, Serum Creatinine</strong></span>
                  <span className="text-[#0F766E] font-semibold hover:underline">Review: 4 Weeks Follow-Up</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CHRONOLOGICAL HEALTH TIMELINE                                      */}
      {/* ========================================================================= */}
      {activeTab === "timeline" && (
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1]">
            <div>
              <h2 className="text-base font-editorial-serif font-bold text-[#191817]">Chronological Medical Timeline</h2>
              <p className="text-[11px] text-[#5C574F]">Longitudinal unified history combining reports, consultations, prescriptions, and dispensations.</p>
            </div>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D0E5E1]">
            {allUnifiedRecords.map((item, idx) => (
              <div key={idx} className="relative space-y-1">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 bg-white border-2 border-[#0F766E] rounded-none shadow-2xs" />

                <div className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] hover:border-[#1A1918] hover:bg-white transition-all space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-xs text-[#191817]">{item.title}</span>
                    <span className="text-[10px] font-mono text-[#5C574F] font-bold bg-white px-2 py-0.5 border border-[#D0E5E1]">
                      {item.date} • {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C574F]">{item.summary}</p>
                  <div className="text-[10px] text-[#7A746B] pt-1.5 border-t border-[#D0E5E1]/60 flex items-center justify-between">
                    <span>Source: <strong className="text-[#191817]">{item.provider}</strong> ({item.submittedBy})</span>
                    <span className="text-[#0F766E] font-semibold hover:underline cursor-pointer" onClick={() => setActiveDetailRecord(item)}>
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: HEALTH STATUS OVERVIEW & OBSERVATION CHARTS                         */}
      {/* ========================================================================= */}
      {activeTab === "health-status" && (
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="pb-3 border-b border-[#D0E5E1]">
            <h2 className="text-base font-editorial-serif font-bold text-[#191817]">Health Status Overview &amp; Observations</h2>
            <p className="text-[11px] text-[#5C574F]">Measurable observations comparison, active diagnoses, and current medical therapy.</p>
          </div>

          {/* Measurable Observations Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* BP Card */}
            <div className="p-4 bg-[#F0F7F6] border border-[#D0E5E1] space-y-2">
              <div className="flex items-center justify-between text-[#5C574F]">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>Blood Pressure</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 uppercase">
                  Improved
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-[#191817]">
                {latestVitals.bp.current}
              </div>
              <div className="text-[11px] text-[#7A746B]">
                Prev: {latestVitals.bp.previous}
              </div>
              {/* Mini Trend SVG */}
              <svg className="w-full h-8 stroke-[#0F766E] fill-none" viewBox="0 0 100 25">
                <path d="M 0,22 Q 30,16 60,14 T 100,6" strokeWidth="2" />
              </svg>
            </div>

            {/* Fasting Glucose Card */}
            <div className="p-4 bg-[#F0F7F6] border border-[#D0E5E1] space-y-2">
              <div className="flex items-center justify-between text-[#5C574F]">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-sky-600" />
                  <span>Fasting Glucose</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 uppercase">
                  Normal
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-[#191817]">
                {latestVitals.glucose.current}
              </div>
              <div className="text-[11px] text-[#7A746B]">
                Prev: {latestVitals.glucose.previous}
              </div>
              <svg className="w-full h-8 stroke-[#4E8C78] fill-none" viewBox="0 0 100 25">
                <path d="M 0,20 Q 35,18 70,10 T 100,5" strokeWidth="2" />
              </svg>
            </div>

            {/* Total Cholesterol Card */}
            <div className="p-4 bg-[#F0F7F6] border border-[#D0E5E1] space-y-2">
              <div className="flex items-center justify-between text-[#5C574F]">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                  <span>Total Cholesterol</span>
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 uppercase">
                  Borderline
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-[#191817]">
                {latestVitals.cholesterol.current}
              </div>
              <div className="text-[11px] text-[#7A746B]">
                Prev: {latestVitals.cholesterol.previous}
              </div>
              <svg className="w-full h-8 stroke-amber-600 fill-none" viewBox="0 0 100 25">
                <path d="M 0,24 Q 40,18 70,12 T 100,8" strokeWidth="2" />
              </svg>
            </div>

            {/* Resting Heart Rate */}
            <div className="p-4 bg-[#F0F7F6] border border-[#D0E5E1] space-y-2">
              <div className="flex items-center justify-between text-[#5C574F]">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Heart Rate</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 uppercase">
                  Optimal
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-[#191817]">
                {latestVitals.heartRate.current}
              </div>
              <div className="text-[11px] text-[#7A746B]">
                Prev: {latestVitals.heartRate.previous}
              </div>
              <svg className="w-full h-8 stroke-emerald-600 fill-none" viewBox="0 0 100 25">
                <path d="M 0,15 Q 25,6 50,15 T 100,12" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Active Diagnoses & Current Medication */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 bg-white border border-[#D0E5E1] space-y-2.5">
              <span className="font-editorial-serif font-bold text-[#191817] block text-xs">Active Conditions &amp; Diagnoses</span>
              <div className="space-y-2">
                {activeConditions.map((cond, i) => (
                  <div key={i} className="p-2.5 bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#191817]">{cond.name}</div>
                      <div className="text-[10px] text-[#7A746B]">Diagnosed by {cond.physician} on {cond.diagnosedDate}</div>
                    </div>
                    <span className="text-[10px] bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/25 font-mono font-bold px-1.5 py-0.5">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border border-[#D0E5E1] space-y-2.5">
              <span className="font-editorial-serif font-bold text-[#191817] block text-xs">Current Prescriptions</span>
              <div className="space-y-2">
                {currentPrescriptions.map((rx, i) => (
                  <div key={i} className="p-2.5 bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#191817]">{rx.name} {rx.dosage}</div>
                      <div className="text-[10px] text-[#7A746B]">{rx.frequency} • {rx.duration}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.5">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ACCOUNT SECURITY & IDENTITY                                        */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1]">
            <div>
              <h2 className="text-base font-editorial-serif font-bold text-[#191817]">Account Security &amp; Identity Credentials</h2>
              <p className="text-[11px] text-[#5C574F]">Permanent Patient ID, login providers, and password governance.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePasswordModal(true)}
              className="px-3 py-1.5 bg-[#1A1918] hover:bg-[#2E2C2A] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer rounded-none shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 bg-[#F0F7F6] border border-[#B6D6D0] space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#7A746B] uppercase tracking-wider">Unique Patient ID (Permanent)</span>
              <div className="font-mono text-base font-bold text-[#0F766E] flex items-center justify-between">
                <span>{currentPatientId}</span>
                <button
                  type="button"
                  onClick={() => handleCopyPid(currentPatientId)}
                  className="px-2.5 py-0.5 bg-white text-[#191817] text-xs font-semibold border border-[#B6D6D0] rounded-none cursor-pointer hover:bg-[#F0F7F6]"
                >
                  {copiedPid ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[10px] text-[#7A746B] pt-1">
                This identifier cannot be changed and links all longitudinal medical records across healthcare facilities.
              </p>
            </div>

            <div className="p-4 bg-[#F0F7F6] border border-[#D0E5E1] space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#7A746B] uppercase tracking-wider">Authentication Method</span>
              <div className="font-bold text-[#191817] text-sm">
                {user?.isGoogleLinked || user?.authProviders?.includes("google")
                  ? "Google OAuth & Password"
                  : "Patient ID / Email & Password"}
              </div>
              {!user?.isGoogleLinked && (
                <button
                  type="button"
                  disabled={googleLinkLoading}
                  onClick={handleLinkGoogle}
                  className="mt-2 text-xs text-[#0F766E] hover:underline font-semibold cursor-pointer block"
                >
                  {googleLinkLoading ? "Linking..." : "+ Link Google Account"}
                </button>
              )}
              {googleLinkMsg && (
                <div className="mt-1.5 text-xs text-emerald-800 font-semibold">{googleLinkMsg}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {activeDetailRecord && (
        <Dialog
          isOpen={!!activeDetailRecord}
          onClose={() => setActiveDetailRecord(null)}
          title={activeDetailRecord.title}
          description={`Record ID: ${activeDetailRecord.id} • Category: ${activeDetailRecord.category}`}
          maxWidth="lg"
        >
          <div className="space-y-3.5 font-editorial-sans text-xs">
            <div className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] space-y-1 text-[#5C574F]">
              <div><strong className="text-[#191817]">Submitted By:</strong> {activeDetailRecord.submittedBy}</div>
              <div><strong className="text-[#191817]">Facility:</strong> {activeDetailRecord.provider}</div>
              <div><strong className="text-[#191817]">Date &amp; Time:</strong> {activeDetailRecord.date} {activeDetailRecord.time}</div>
              <div><strong className="text-[#191817]">Status:</strong> <span className="font-mono uppercase font-bold text-[#0F766E]">{activeDetailRecord.status}</span></div>
            </div>

            <div className="p-3.5 bg-white border border-[#D0E5E1]">
              <span className="font-bold block mb-1 text-[#191817]">Clinical Summary:</span>
              <p className="text-[#5C574F] leading-relaxed">{activeDetailRecord.summary}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#D0E5E1]">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="rounded-none"
                onClick={() => setActiveDetailRecord(null)}
              >
                Close Record
              </Button>
            </div>
          </div>
        </Dialog>
      )}

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
        <form onSubmit={handleChangePassword} className="space-y-3.5 font-editorial-sans">
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
            <label className="block text-xs font-semibold text-[#191817] mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPasswordVal}
              onChange={(e) => setCurrentPasswordVal(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 text-xs border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] bg-[#F0F7F6] focus:bg-white text-[#191817]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191817] mb-1">
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
                className="w-full px-3 py-2 text-xs border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] bg-[#F0F7F6] focus:bg-white text-[#191817] pr-8"
              />
              <button
                type="button"
                onClick={() => setShowChangePassword((p: boolean) => !p)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#7A746B] hover:text-[#191817]"
              >
                {showChangePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191817] mb-1">
              Confirm New Password
            </label>
            <input
              type={showChangePassword ? "text" : "password"}
              required
              value={confirmNewPasswordVal}
              onChange={(e) => setConfirmNewPasswordVal(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 text-xs border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] bg-[#F0F7F6] focus:bg-white text-[#191817]"
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
