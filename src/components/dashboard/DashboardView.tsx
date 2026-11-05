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
  Upload,
  ArrowRight,
  ChevronRight,
  Pill,
  Hospital,
  Lock,
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
  onOpenUpload,
  onSelectRecord: _onSelectRecord,
  onSelectConsent: _onSelectConsent,
  onNavigateRoute,
  records: fallbackRecords,
  consents,
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
    bp: { current: "138/88", unit: "mmHg", previous: "142/92", status: "Improved", delta: "-4 mmHg", trend: [142, 140, 138] },
    glucose: { current: "94", unit: "mg/dL", previous: "106", status: "Normal", delta: "-12 mg/dL", trend: [106, 98, 94] },
    cholesterol: { current: "195", unit: "mg/dL", previous: "220", status: "Borderline", delta: "-25 mg/dL", trend: [220, 205, 195] },
    heartRate: { current: "74", unit: "bpm", previous: "78", status: "Optimal", delta: "Stable", trend: [78, 76, 74] },
  };

  const activeConditions = [
    { name: "Stage 1 Essential Hypertension", diagnosedDate: "2026-11-05", physician: "Dr. Vikram Seth", icd: "I10" },
    { name: "Mild Borderline Dyslipidemia", diagnosedDate: "2026-11-05", physician: "Dr. Vikram Seth", icd: "E78.5" },
  ];

  const currentPrescriptions = [
    { name: "Telmisartan", dosage: "40mg", frequency: "Once daily morning", duration: "30 days", prescriber: "Dr. Vikram Seth" },
  ];

  const upcomingFollowUps = [
    { date: "03 Dec 2026", time: "10:30 AM", title: "Cardiology Review & BP Evaluation", physician: "Dr. Vikram Seth", facility: "Apollo Care Hospital", dept: "Department of Cardiology" },
  ];

  const getAbnormalFlagBadge = (flag?: string) => {
    const norm = (flag || "Normal").toLowerCase();
    if (norm.includes("crit")) {
      return (
        <span className="px-2 py-0.5 bg-red-50 text-red-800 font-bold border border-red-200 text-[10px] tracking-wide inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          CRITICAL
        </span>
      );
    }
    if (norm.includes("high") || norm.includes("borderline")) {
      return (
        <span className="px-2 py-0.5 bg-amber-50 text-amber-900 font-bold border border-amber-200 text-[10px] tracking-wide inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          BORDERLINE
        </span>
      );
    }
    if (norm.includes("low")) {
      return (
        <span className="px-2 py-0.5 bg-sky-50 text-sky-800 font-bold border border-sky-200 text-[10px] tracking-wide">
          LOW
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[10px] tracking-wide inline-flex items-center gap-1">
        <Check className="w-2.5 h-2.5 text-emerald-600" />
        NORMAL
      </span>
    );
  };

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case "DiagnosticReport":
        return { label: "Laboratory", icon: FlaskConical, color: "text-[#0F766E] bg-[#E4F1EE] border-[#0F766E]/25" };
      case "Encounter":
        return { label: "Consultation", icon: Stethoscope, color: "text-[#0F766E] bg-[#E4F1EE] border-[#0F766E]/25" };
      case "MedicationRequest":
        return { label: "Prescription", icon: Pill, color: "text-teal-900 bg-teal-50 border-teal-200" };
      case "MedicationDispense":
        return { label: "Dispensing", icon: Droplet, color: "text-emerald-900 bg-emerald-50 border-emerald-200" };
      default:
        return { label: cat, icon: FileText, color: "text-[#5C574F] bg-white border-[#D0E5E1]" };
    }
  };

  return (
    <div className="space-y-4 font-editorial-sans text-xs text-[#191817]">
      {/* ========================================================================= */}
      {/* 1. PREMIUM PATIENT IDENTITY & ARCHITECTURAL HERO BANNER                   */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#F8FBFA] to-[#E9F4F2] border border-[#D0E5E1] shadow-[0_8px_30px_rgba(15,118,110,0.06)] p-5 sm:p-7 space-y-5">
        {/* Subtle decorative top hairline & ambient light orb */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#0F766E]/20" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-[#14B8A6]/10 to-[#0F766E]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Patient Details & Avatar */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white flex items-center justify-center font-editorial-serif font-bold text-xl sm:text-2xl shadow-[0_4px_16px_rgba(15,118,110,0.25)] border-2 border-white ring-1 ring-[#D0E5E1] rounded-none">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-0.5 shadow-xs border border-white" title="Verified Digital Record">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-editorial-serif font-bold text-[#191817] tracking-tight">
                  {displayName}
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 px-2.5 py-0.5 border border-emerald-200/90 inline-flex items-center gap-1 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Patient
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-[#E4F1EE] text-[#0F766E] px-2.5 py-0.5 border border-[#0F766E]/25 inline-flex items-center gap-1 shadow-2xs">
                  <Activity className="w-3 h-3 text-[#0F766E]" />
                  ABDM Linked
                </span>
                <span className="text-[10px] font-mono font-medium text-[#7A746B] bg-white/80 px-2 py-0.5 border border-[#D0E5E1] hidden sm:inline-block">
                  Unified EHR Active
                </span>
              </div>

              {/* Demographic Information Strip */}
              <div className="flex items-center gap-2.5 flex-wrap text-xs text-[#5C574F] pt-0.5">
                <span className="font-medium text-[#191817]">{user?.email || "patient@swaasthsaarthi.in"}</span>
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
                <span className="text-[#B6D6D0]">•</span>
                <span className="text-[#0F766E] font-medium">Apollo Care Network</span>
              </div>
            </div>
          </div>

          {/* Right Action Hub: Permanent Patient ID & Quick Trigger Buttons */}
          <div className="flex flex-col sm:flex-row xl:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Permanent Patient ID Vault Box */}
            <div className="bg-white/90 backdrop-blur-xs border border-[#D0E5E1] px-4 py-2.5 shadow-2xs flex items-center justify-between sm:justify-start gap-4">
              <div>
                <div className="text-[9px] font-mono font-bold text-[#7A746B] uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-[#0F766E]" />
                  Permanent Patient ID
                </div>
                <div className="text-sm font-mono font-bold text-[#0F766E] tracking-wider mt-0.5">
                  {currentPatientId}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyPid(currentPatientId)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#191817] bg-[#F0F7F6] hover:bg-white border border-[#B6D6D0] cursor-pointer transition-all shadow-2xs active:scale-95"
                title="Copy Patient ID to clipboard"
              >
                {copiedPid ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#5C574F]" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenUpload}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold tracking-wide shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Record</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateRoute("consents")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title="Manage ABDM Consent Artifacts"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Consents</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Quick Longitudinal Metrics Strip (Elevated Interactive Cards)             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* 1. Unified Records */}
          <div
            onClick={() => setActiveTab("unified")}
            className="p-3.5 bg-white border border-[#D0E5E1] hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.08)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
                Health Records
              </span>
              <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] group-hover:text-[#0F766E] transition-colors block">
                {allUnifiedRecords.length}
              </span>
            </div>
            <div className="text-[10px] text-[#7A746B] flex items-center justify-between border-t border-[#D0E5E1]/60 pt-1.5">
              <span>All Types</span>
              <span className="text-[#0F766E] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Explore →</span>
            </div>
          </div>

          {/* 2. Lab Reports */}
          <div
            onClick={() => setActiveTab("labs")}
            className="p-3.5 bg-white border border-[#D0E5E1] hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.08)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
                Lab Reports
              </span>
              <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors flex items-center justify-center">
                <FlaskConical className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] group-hover:text-[#0F766E] transition-colors block">
                {labReports.length}
              </span>
            </div>
            <div className="text-[10px] text-[#7A746B] flex items-center justify-between border-t border-[#D0E5E1]/60 pt-1.5">
              <span>Diagnostic Tests</span>
              <span className="text-[#0F766E] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
            </div>
          </div>

          {/* 3. Doctor Encounters */}
          <div
            onClick={() => setActiveTab("doctors")}
            className="p-3.5 bg-white border border-[#D0E5E1] hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.08)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
                Encounters
              </span>
              <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors flex items-center justify-center">
                <Stethoscope className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] group-hover:text-[#0F766E] transition-colors block">
                {doctorReports.length}
              </span>
            </div>
            <div className="text-[10px] text-[#7A746B] flex items-center justify-between border-t border-[#D0E5E1]/60 pt-1.5">
              <span>Clinical Consults</span>
              <span className="text-[#0F766E] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Review →</span>
            </div>
          </div>

          {/* 4. Active Medications */}
          <div
            onClick={() => onNavigateRoute("prescriptions")}
            className="p-3.5 bg-white border border-[#D0E5E1] hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.08)] transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
                Medications
              </span>
              <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors flex items-center justify-center">
                <Pill className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] group-hover:text-[#0F766E] transition-colors block">
                {currentPrescriptions.length}
              </span>
            </div>
            <div className="text-[10px] text-[#7A746B] flex items-center justify-between border-t border-[#D0E5E1]/60 pt-1.5">
              <span>Active Rx Regimen</span>
              <span className="text-[#0F766E] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Prescriptions →</span>
            </div>
          </div>

          {/* 5. Follow-ups */}
          <div
            onClick={() => setActiveTab("overview")}
            className="p-3.5 bg-white border border-[#D0E5E1] hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.08)] transition-all cursor-pointer group flex flex-col justify-between col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
                Follow-ups
              </span>
              <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] group-hover:text-[#0F766E] transition-colors block">
                {upcomingFollowUps.length}
              </span>
            </div>
            <div className="text-[10px] text-[#7A746B] flex items-center justify-between border-t border-[#D0E5E1]/60 pt-1.5">
              <span>Next: 03 Dec</span>
              <span className="text-[#0F766E] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Schedule →</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB NAVIGATION SWITCHER (ARCHITECTURAL SEGMENTED CONTROL)              */}
      {/* ========================================================================= */}
      <div className="w-full flex bg-white border border-[#D0E5E1] p-1.5 gap-1.5 overflow-x-auto scrollbar-thin shadow-2xs">
        {[
          { id: "overview", label: "Overview", icon: Activity, count: null },
          { id: "unified", label: "Health Records", icon: FileText, count: allUnifiedRecords.length },
          { id: "labs", label: "Laboratory Reports", icon: FlaskConical, count: labReports.length },
          { id: "doctors", label: "Doctor Encounters", icon: Stethoscope, count: doctorReports.length },
          { id: "timeline", label: "Medical Timeline", icon: Clock, count: null },
          { id: "health-status", label: "Vitals & Trends", icon: TrendingUp, count: 4 },
          { id: "security", label: "Security & Profile", icon: ShieldCheck, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? "bg-[#0F766E] text-white border border-[#0F766E] shadow-2xs"
                  : "bg-transparent text-[#5C574F] hover:bg-[#E4F1EE]/70 hover:text-[#0F766E] border border-transparent"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#7A746B]"}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 ${
                    isActive ? "bg-white/20 text-white font-bold" : "bg-[#E4F1EE] text-[#0F766E] font-bold"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PATIENT OVERVIEW                                                   */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-4 animate-fadeIn">
          {/* A. Longitudinal Vitals Intelligence Bar */}
          <div className="bg-white border border-[#D0E5E1] p-5 shadow-[0_4px_20px_rgba(15,118,110,0.04)] space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#D0E5E1]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-editorial-serif font-bold text-sm text-[#191817]">
                  Clinical Vitals &amp; Physiological Parameters
                </h2>
                <span className="text-[10px] font-mono text-[#0F766E] bg-[#E4F1EE] px-2 py-0.5 border border-[#0F766E]/20">
                  Auto-Synchronized
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("health-status")}
                className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Full Longitudinal Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* BP Metric */}
              <div className="p-3.5 bg-[#F0F7F6]/70 border border-[#D0E5E1] hover:border-[#0F766E]/50 transition-all space-y-1.5">
                <div className="flex items-center justify-between text-[#5C574F]">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-[#191817]">
                    <Heart className="w-3.5 h-3.5 text-rose-600" />
                    <span>Blood Pressure</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2">
                    {latestVitals.bp.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-[#191817]">{latestVitals.bp.current}</span>
                  <span className="text-[11px] font-mono text-[#7A746B]">{latestVitals.bp.unit}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7A746B]">
                  <span>Prior: {latestVitals.bp.previous}</span>
                  <span className="text-emerald-700 font-semibold">{latestVitals.bp.delta}</span>
                </div>
                <svg className="w-full h-6 stroke-[#0F766E] fill-none mt-1" viewBox="0 0 100 20">
                  <path d="M 0,18 Q 30,14 60,11 T 100,5" strokeWidth="2" />
                </svg>
              </div>

              {/* Glucose Metric */}
              <div className="p-3.5 bg-[#F0F7F6]/70 border border-[#D0E5E1] hover:border-[#0F766E]/50 transition-all space-y-1.5">
                <div className="flex items-center justify-between text-[#5C574F]">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-[#191817]">
                    <Droplet className="w-3.5 h-3.5 text-sky-600" />
                    <span>Fasting Blood Sugar</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2">
                    {latestVitals.glucose.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-[#191817]">{latestVitals.glucose.current}</span>
                  <span className="text-[11px] font-mono text-[#7A746B]">{latestVitals.glucose.unit}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7A746B]">
                  <span>Prior: {latestVitals.glucose.previous}</span>
                  <span className="text-emerald-700 font-semibold">{latestVitals.glucose.delta}</span>
                </div>
                <svg className="w-full h-6 stroke-[#14B8A6] fill-none mt-1" viewBox="0 0 100 20">
                  <path d="M 0,16 Q 35,14 70,8 T 100,4" strokeWidth="2" />
                </svg>
              </div>

              {/* Cholesterol Metric */}
              <div className="p-3.5 bg-[#F0F7F6]/70 border border-[#D0E5E1] hover:border-[#0F766E]/50 transition-all space-y-1.5">
                <div className="flex items-center justify-between text-[#5C574F]">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-[#191817]">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                    <span>Total Serum Lipid</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2">
                    {latestVitals.cholesterol.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-[#191817]">{latestVitals.cholesterol.current}</span>
                  <span className="text-[11px] font-mono text-[#7A746B]">{latestVitals.cholesterol.unit}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7A746B]">
                  <span>Prior: {latestVitals.cholesterol.previous}</span>
                  <span className="text-emerald-700 font-semibold">{latestVitals.cholesterol.delta}</span>
                </div>
                <svg className="w-full h-6 stroke-amber-600 fill-none mt-1" viewBox="0 0 100 20">
                  <path d="M 0,18 Q 40,14 70,10 T 100,6" strokeWidth="2" />
                </svg>
              </div>

              {/* Heart Rate Metric */}
              <div className="p-3.5 bg-[#F0F7F6]/70 border border-[#D0E5E1] hover:border-[#0F766E]/50 transition-all space-y-1.5">
                <div className="flex items-center justify-between text-[#5C574F]">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-[#191817]">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resting Heart Rate</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2">
                    {latestVitals.heartRate.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-[#191817]">{latestVitals.heartRate.current}</span>
                  <span className="text-[11px] font-mono text-[#7A746B]">{latestVitals.heartRate.unit}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#7A746B]">
                  <span>Prior: {latestVitals.heartRate.previous}</span>
                  <span className="text-emerald-700 font-semibold">Optimal</span>
                </div>
                <svg className="w-full h-6 stroke-emerald-600 fill-none mt-1" viewBox="0 0 100 20">
                  <path d="M 0,12 Q 25,5 50,12 T 100,9" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          {/* B. Two-Column Split: Recent Records & Action Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Recent Clinical Records */}
            <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 shadow-[0_4px_20px_rgba(15,118,110,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-editorial-serif font-bold text-sm text-[#191817]">
                      Recent Clinical Records
                    </h3>
                    <p className="text-[10px] text-[#7A746B]">Verified encounters, prescriptions, and lab tests</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("unified")}
                  className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>All Records ({allUnifiedRecords.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {allUnifiedRecords.slice(0, 3).map((rec, idx) => {
                  const meta = getCategoryMeta(rec.category);
                  const MetaIcon = meta.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveDetailRecord(rec)}
                      className="p-4 bg-white border border-[#D0E5E1] border-l-4 border-l-[#0F766E] hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.06)] cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${meta.color} inline-flex items-center gap-1`}>
                            <MetaIcon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          <span className="font-bold text-xs text-[#191817] group-hover:text-[#0F766E] transition-colors">
                            {rec.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-[#F0F7F6] px-2 py-0.5 border border-[#D0E5E1] text-[#5C574F] flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-[#7A746B]" />
                          {rec.date}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#5C574F] line-clamp-2 leading-relaxed">
                        {rec.summary}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-[#7A746B] pt-2 border-t border-[#D0E5E1]/60">
                        <span>Submitted by: <strong className="text-[#191817]">{rec.submittedBy}</strong> • {rec.provider}</span>
                        <span className="text-[#0F766E] font-semibold group-hover:underline inline-flex items-center gap-0.5">
                          Inspect Record <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Upcoming Follow-ups & Active Prescriptions */}
            <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 shadow-[0_4px_20px_rgba(15,118,110,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-editorial-serif font-bold text-sm text-[#191817]">
                      Upcoming Follow-ups &amp; Care Regimens
                    </h3>
                    <p className="text-[10px] text-[#7A746B]">Scheduled clinical visits &amp; active therapy</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200 font-bold">
                  Active Care Plan
                </span>
              </div>

              <div className="space-y-3">
                {/* Scheduled Follow-up Card */}
                {upcomingFollowUps.map((fu, idx) => (
                  <div key={idx} className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] flex items-start gap-3.5">
                    <div className="w-10 h-10 bg-white border border-[#0F766E]/30 text-[#0F766E] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <span className="text-[8px] font-mono uppercase font-bold text-[#7A746B]">DEC</span>
                      <span className="text-sm font-bold font-mono text-[#0F766E] leading-none">03</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-bold text-xs text-[#191817]">{fu.title}</span>
                        <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-[#D0E5E1] text-[#0F766E] font-semibold">
                          {fu.time}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5C574F]">
                        Consultant: <strong className="text-[#191817]">{fu.physician}</strong> ({fu.dept})
                      </div>
                      <div className="text-[10px] text-[#7A746B] flex items-center gap-1">
                        <Hospital className="w-3 h-3 text-[#7A746B]" />
                        <span>Facility: {fu.facility}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Active Medication Regimen Card */}
                <div className="p-4 bg-[#F0F7F6] border border-[#0F766E]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#191817] flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Active Prescription Regimen</span>
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200 uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Ongoing · 30 Days
                    </span>
                  </div>
                  <div className="bg-white p-3 border border-[#D0E5E1] space-y-1">
                    <div className="text-xs font-bold text-[#191817] flex items-center justify-between">
                      <span>Telmisartan 40mg Tablet</span>
                      <span className="text-[10px] font-mono font-bold text-[#0F766E]">Oral Route</span>
                    </div>
                    <div className="text-[11px] text-[#5C574F]">
                      Schedule: <strong>Once daily morning after food</strong>
                    </div>
                    <div className="text-[10px] text-[#7A746B] pt-1 border-t border-[#D0E5E1]/60 flex items-center justify-between">
                      <span>Prescribed by Dr. Vikram Seth for Essential Hypertension</span>
                      <button
                        type="button"
                        onClick={() => onNavigateRoute("prescriptions")}
                        className="text-[#0F766E] font-semibold hover:underline cursor-pointer"
                      >
                        Refill / Rx Details →
                      </button>
                    </div>
                  </div>
                </div>

                {/* ABDM Consent Status Summary Card */}
                <div className="p-3.5 bg-white border border-[#D0E5E1] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#191817]">ABDM Consent Management</div>
                      <div className="text-[10px] text-[#7A746B]">
                        {consents.length > 0 ? `${consents.length} active consent artifacts granted` : "Strict patient-mediated data access"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateRoute("consents")}
                    className="px-2.5 py-1 text-xs font-semibold text-[#0F766E] hover:bg-[#F0F7F6] border border-[#0F766E]/30 transition-colors cursor-pointer"
                  >
                    Manage Consents →
                  </button>
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
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 animate-fadeIn shadow-[0_4px_20px_rgba(15,118,110,0.04)]">
          {/* Header Title & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D0E5E1]">
            <div>
              <h2 className="text-base font-editorial-serif font-bold text-[#191817]">
                Unified Medical Records Repository
              </h2>
              <p className="text-[11px] text-[#5C574F]">
                Longitudinal clinical history compiled across hospitals, diagnostic laboratories, and pharmacies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-[#F0F7F6] text-[#0F766E] px-2.5 py-1 border border-[#0F766E]/25">
                {filteredRecords.length} of {allUnifiedRecords.length} Records
              </span>
              <button
                type="button"
                onClick={onOpenUpload}
                className="px-3 py-1 bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3 h-3" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Search, Filter, Sort Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#F8FBFA] p-3 border border-[#D0E5E1]">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, physician name, hospital facility..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-[#B6D6D0] bg-white text-[#191817] rounded-none focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
              />
              <Search className="w-3.5 h-3.5 text-[#7A746B] absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {[
                  { id: "ALL", label: "All" },
                  { id: "DiagnosticReport", label: "Labs" },
                  { id: "Encounter", label: "Consults" },
                  { id: "MedicationRequest", label: "Rx" },
                  { id: "MedicationDispense", label: "Dispense" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedCategory(chip.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-all border ${
                      selectedCategory === chip.id
                        ? "bg-[#0F766E] text-white border-[#0F766E]"
                        : "bg-white text-[#5C574F] border-[#D0E5E1] hover:bg-[#E4F1EE]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                className="px-2.5 py-1.5 border border-[#B6D6D0] bg-white text-[#191817] text-xs font-medium rounded-none focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Records List Table / Cards */}
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-[#7A746B] space-y-2 bg-[#F8FBFA] border border-[#D0E5E1]">
                <FileText className="w-9 h-9 mx-auto text-[#B6D6D0]" />
                <p className="font-semibold text-xs text-[#191817]">No medical records match your criteria.</p>
                <p className="text-[11px] text-[#7A746B]">Try clearing filters or search terms.</p>
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const meta = getCategoryMeta(rec.category);
                const MetaIcon = meta.icon;
                return (
                  <div
                    key={rec.id}
                    className="p-4 border border-[#D0E5E1] border-l-4 border-l-[#0F766E] bg-white hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.06)] transition-all space-y-2.5 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#191817] group-hover:text-[#0F766E] transition-colors">
                          {rec.title}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${meta.color} inline-flex items-center gap-1`}>
                          <MetaIcon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        {rec.isDoctorReviewed && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200 font-semibold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Physician Validated</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px] text-[#7A746B] bg-[#F8FBFA] px-2 py-0.5 border border-[#D0E5E1]">
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
                        <span>Status: <strong className="font-mono text-[#0F766E] uppercase">{rec.status}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDetailRecord(rec)}
                          className="px-3 py-1 bg-white hover:bg-[#F0F7F6] border border-[#B6D6D0] hover:border-[#0F766E] text-[#191817] text-xs font-semibold rounded-none cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <span>Inspect Record</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEDICATED LABORATORY REPORTS                                       */}
      {/* ========================================================================= */}
      {activeTab === "labs" && (
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-4 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D0E5E1]">
            <div>
              <h2 className="text-base font-editorial-serif font-bold text-[#191817]">
                Diagnostic Laboratory Reports
              </h2>
              <p className="text-[11px] text-[#5C574F]">
                Official laboratory test findings, abnormal flags, analyte reference ranges, and verified PDF reports.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#F0F7F6] text-[#0F766E] px-2.5 py-1 border border-[#0F766E]/25 shrink-0">
              {labReports.length} Reports Verified
            </span>
          </div>

          <div className="space-y-4">
            {labReports.map((report) => (
              <div key={report.id} className="p-5 border border-[#D0E5E1] bg-white space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D0E5E1]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-editorial-serif font-bold text-sm sm:text-base text-[#191817]">
                        {report.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        ABDM VALIDATED
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5C574F]">
                      Accredited Diagnostic Facility: <strong className="text-[#191817]">{report.provider}</strong> • Sample Date: <span className="font-mono font-bold text-[#0F766E]">{report.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading verified report: ${report.title}`)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F766E] hover:bg-[#0D655E] text-white font-semibold border border-[#0F766E] rounded-none cursor-pointer text-xs shadow-2xs transition-colors"
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
                        <th className="py-2.5 px-3 font-bold">Analyte / Test Parameter</th>
                        <th className="py-2.5 px-3 font-bold">Observed Value</th>
                        <th className="py-2.5 px-3 font-bold">Unit</th>
                        <th className="py-2.5 px-3 font-bold">Biological Reference Range</th>
                        <th className="py-2.5 px-3 font-bold">Clinical Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D0E5E1] font-editorial-sans">
                      <tr className="hover:bg-[#F8FBFA]">
                        <td className="py-2.5 px-3 font-semibold text-[#191817]">Total Cholesterol</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#191817]">195</td>
                        <td className="py-2.5 px-3 font-mono text-[#5C574F]">mg/dL</td>
                        <td className="py-2.5 px-3 text-[#5C574F]">125 - 200 mg/dL</td>
                        <td className="py-2.5 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                      <tr className="hover:bg-[#F8FBFA]">
                        <td className="py-2.5 px-3 font-semibold text-[#191817]">HDL High-Density Lipoprotein</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#191817]">52</td>
                        <td className="py-2.5 px-3 font-mono text-[#5C574F]">mg/dL</td>
                        <td className="py-2.5 px-3 text-[#5C574F]">&gt; 40 mg/dL</td>
                        <td className="py-2.5 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                      <tr className="hover:bg-[#F8FBFA] bg-amber-50/20">
                        <td className="py-2.5 px-3 font-semibold text-[#191817]">LDL Low-Density Lipoprotein (Calculated)</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-900">118</td>
                        <td className="py-2.5 px-3 font-mono text-[#5C574F]">mg/dL</td>
                        <td className="py-2.5 px-3 text-[#5C574F]">&lt; 100 mg/dL</td>
                        <td className="py-2.5 px-3">{getAbnormalFlagBadge("Borderline High")}</td>
                      </tr>
                      <tr className="hover:bg-[#F8FBFA]">
                        <td className="py-2.5 px-3 font-semibold text-[#191817]">Triglycerides</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#191817]">142</td>
                        <td className="py-2.5 px-3 font-mono text-[#5C574F]">mg/dL</td>
                        <td className="py-2.5 px-3 text-[#5C574F]">&lt; 150 mg/dL</td>
                        <td className="py-2.5 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-[#F8FBFA] border border-[#D0E5E1] text-[11px] text-[#5C574F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>Method: Enzymatic Colorimetric Assay on Fully Automated Clinical Chemistry Analyzer.</span>
                  <span className="font-semibold text-[#191817]">Senior Clinical Biochemist: Rajesh Kumar (M.Sc, Ph.D)</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D0E5E1]">
            <div>
              <h2 className="text-base font-editorial-serif font-bold text-[#191817]">
                Doctor Consultation &amp; Clinical Encounter Reports
              </h2>
              <p className="text-[11px] text-[#5C574F]">
                Formal medical consultations, physical examinations, diagnoses, clinical notes, and follow-up guidance.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#F0F7F6] text-[#0F766E] px-2.5 py-1 border border-[#0F766E]/25 shrink-0">
              {doctorReports.length} Encounters
            </span>
          </div>

          <div className="space-y-4">
            {doctorReports.map((report) => (
              <div key={report.id} className="p-5 border border-[#D0E5E1] bg-white space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D0E5E1]">
                  <div>
                    <h3 className="font-editorial-serif font-bold text-sm sm:text-base text-[#191817]">
                      {report.title}
                    </h3>
                    <div className="text-[11px] text-[#5C574F] mt-0.5">
                      Consultant: <strong className="text-[#191817]">{report.submittedBy}</strong> • Hospital: <strong className="text-[#191817]">{report.provider}</strong>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#0F766E] bg-[#F0F7F6] px-3 py-1 border border-[#0F766E]/25">
                    Consultation Date: {report.date}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] space-y-1.5">
                    <span className="text-[10px] text-[#7A746B] uppercase font-mono font-bold block">
                      Clinical Findings &amp; Observations
                    </span>
                    <p className="text-[#191817] leading-relaxed">
                      BP recorded at 138/88 mmHg, resting pulse 74 bpm regular, S1 S2 normal, clear chest auscultation bilaterally, no peripheral ankle edema. Patient reported occasional exertional fatigue.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F0F7F6] border border-[#0F766E]/30 space-y-1.5">
                    <span className="text-[10px] text-[#0F766E] uppercase font-mono font-bold block">
                      Formal Clinical Diagnoses (ICD-10)
                    </span>
                    <p className="text-[#191817] font-semibold leading-relaxed">
                      1. Stage 1 Essential Hypertension (Primary) [ICD-10: I10]
                      <br />
                      2. Mild Borderline Dyslipidemia [ICD-10: E78.5]
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] space-y-1.5">
                  <span className="text-[10px] text-[#7A746B] uppercase font-mono font-bold block">
                    Treatment Regimen &amp; Pharmacological Plan
                  </span>
                  <p className="text-[#5C574F] leading-relaxed">
                    Initiated low-sodium DASH diet. Prescribed Telmisartan 40mg PO once daily morning. Patient advised to maintain home BP diary twice a week. Scheduled repeat lipid panel in 12 weeks.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#5C574F] pt-2 border-t border-[#D0E5E1] gap-2">
                  <span>Diagnostic Tests Advised: <strong className="text-[#191817]">Lipid Profile, Serum Creatinine, ECG</strong></span>
                  <span className="text-[#0F766E] font-semibold">Review Scheduled: 4 Weeks Follow-Up</span>
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
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-5 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="pb-3 border-b border-[#D0E5E1]">
            <h2 className="text-base font-editorial-serif font-bold text-[#191817]">
              Longitudinal Chronological Health Timeline
            </h2>
            <p className="text-[11px] text-[#5C574F]">
              Seamless unified timeline weaving together lab evaluations, clinical encounters, prescriptions, and pharmacy fulfillments.
            </p>
          </div>

          <div className="relative pl-7 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#0F766E] before:via-[#14B8A6] before:to-[#D0E5E1]">
            {allUnifiedRecords.map((item, idx) => {
              const meta = getCategoryMeta(item.category);
              const MetaIcon = meta.icon;
              return (
                <div key={idx} className="relative space-y-1 group">
                  {/* Timeline Dot Marker */}
                  <div className="absolute -left-7 top-2.5 w-4 h-4 bg-white border-2 border-[#0F766E] group-hover:scale-110 group-hover:bg-[#0F766E] transition-all shadow-xs" />

                  <div className="p-4 bg-white border border-[#D0E5E1] hover:border-[#0F766E] hover:shadow-[0_4px_16px_rgba(15,118,110,0.06)] transition-all space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${meta.color} inline-flex items-center gap-1`}>
                          <MetaIcon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        <span className="font-bold text-xs text-[#191817] group-hover:text-[#0F766E] transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#5C574F] font-bold bg-[#F0F7F6] px-2 py-0.5 border border-[#D0E5E1]">
                        {item.date} • {item.time}
                      </span>
                    </div>

                    <p className="text-xs text-[#5C574F] leading-relaxed">{item.summary}</p>

                    <div className="text-[10px] text-[#7A746B] pt-2 border-t border-[#D0E5E1]/60 flex items-center justify-between">
                      <span>Source Provider: <strong className="text-[#191817]">{item.provider}</strong> ({item.submittedBy})</span>
                      <button
                        type="button"
                        onClick={() => setActiveDetailRecord(item)}
                        className="text-[#0F766E] font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>Full Record Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: HEALTH STATUS OVERVIEW & OBSERVATION CHARTS                         */}
      {/* ========================================================================= */}
      {activeTab === "health-status" && (
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-5 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="pb-3 border-b border-[#D0E5E1]">
            <h2 className="text-base font-editorial-serif font-bold text-[#191817]">
              Health Status Analytics &amp; Longitudinal Observations
            </h2>
            <p className="text-[11px] text-[#5C574F]">
              Measurable observations comparison, active diagnoses, and current medical therapy.
            </p>
          </div>

          {/* Measurable Observations Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* BP Card */}
            <div className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] space-y-2 hover:border-[#0F766E]/50 transition-all">
              <div className="flex items-center justify-between text-[#5C574F]">
                <span className="font-semibold text-xs flex items-center gap-1.5 text-[#191817]">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>Blood Pressure</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 uppercase">
                  Improved
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#191817]">
                {latestVitals.bp.current} <span className="text-xs font-normal text-[#7A746B]">mmHg</span>
              </div>
              <div className="text-[11px] text-[#7A746B] flex items-center justify-between">
                <span>Baseline: {latestVitals.bp.previous} mmHg</span>
                <span className="text-emerald-700 font-semibold">{latestVitals.bp.delta}</span>
              </div>
              <svg className="w-full h-8 stroke-[#0F766E] fill-none" viewBox="0 0 100 25">
                <path d="M 0,22 Q 30,16 60,14 T 100,6" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Fasting Glucose Card */}
            <div className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] space-y-2 hover:border-[#0F766E]/50 transition-all">
              <div className="flex items-center justify-between text-[#5C574F]">
                <span className="font-semibold text-xs flex items-center gap-1.5 text-[#191817]">
                  <Droplet className="w-3.5 h-3.5 text-sky-600" />
                  <span>Fasting Glucose</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 uppercase">
                  Normal
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#191817]">
                {latestVitals.glucose.current} <span className="text-xs font-normal text-[#7A746B]">mg/dL</span>
              </div>
              <div className="text-[11px] text-[#7A746B] flex items-center justify-between">
                <span>Baseline: {latestVitals.glucose.previous} mg/dL</span>
                <span className="text-emerald-700 font-semibold">{latestVitals.glucose.delta}</span>
              </div>
              <svg className="w-full h-8 stroke-[#14B8A6] fill-none" viewBox="0 0 100 25">
                <path d="M 0,20 Q 35,18 70,10 T 100,5" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Total Cholesterol Card */}
            <div className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] space-y-2 hover:border-[#0F766E]/50 transition-all">
              <div className="flex items-center justify-between text-[#5C574F]">
                <span className="font-semibold text-xs flex items-center gap-1.5 text-[#191817]">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                  <span>Total Cholesterol</span>
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 uppercase">
                  Borderline
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#191817]">
                {latestVitals.cholesterol.current} <span className="text-xs font-normal text-[#7A746B]">mg/dL</span>
              </div>
              <div className="text-[11px] text-[#7A746B] flex items-center justify-between">
                <span>Baseline: {latestVitals.cholesterol.previous} mg/dL</span>
                <span className="text-emerald-700 font-semibold">{latestVitals.cholesterol.delta}</span>
              </div>
              <svg className="w-full h-8 stroke-amber-600 fill-none" viewBox="0 0 100 25">
                <path d="M 0,24 Q 40,18 70,12 T 100,8" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Resting Heart Rate */}
            <div className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] space-y-2 hover:border-[#0F766E]/50 transition-all">
              <div className="flex items-center justify-between text-[#5C574F]">
                <span className="font-semibold text-xs flex items-center gap-1.5 text-[#191817]">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Heart Rate</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 uppercase">
                  Optimal
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#191817]">
                {latestVitals.heartRate.current} <span className="text-xs font-normal text-[#7A746B]">bpm</span>
              </div>
              <div className="text-[11px] text-[#7A746B] flex items-center justify-between">
                <span>Baseline: {latestVitals.heartRate.previous} bpm</span>
                <span className="text-emerald-700 font-semibold">Stable</span>
              </div>
              <svg className="w-full h-8 stroke-emerald-600 fill-none" viewBox="0 0 100 25">
                <path d="M 0,15 Q 25,6 50,15 T 100,12" strokeWidth="2.5" />
              </svg>
            </div>
          </div>

          {/* Active Diagnoses & Current Medication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-white border border-[#D0E5E1] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D0E5E1]">
                <span className="font-editorial-serif font-bold text-[#191817] text-xs">
                  Active Clinical Conditions &amp; Diagnoses
                </span>
                <span className="text-[10px] font-mono text-[#0F766E] font-bold bg-[#E4F1EE] px-2 py-0.5 border border-[#0F766E]/20">
                  {activeConditions.length} Diagnoses
                </span>
              </div>
              <div className="space-y-2">
                {activeConditions.map((cond, i) => (
                  <div key={i} className="p-3 bg-[#F8FBFA] border border-[#D0E5E1] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#191817] flex items-center gap-1.5">
                        <span>{cond.name}</span>
                        <span className="text-[10px] font-mono text-[#7A746B] bg-white px-1.5 py-0.2 border border-[#D0E5E1]">
                          ICD: {cond.icd}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#7A746B] mt-0.5">
                        Diagnosed by {cond.physician} on {cond.diagnosedDate}
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#E4F1EE] text-[#0F766E] border border-[#0F766E]/25 font-mono font-bold px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border border-[#D0E5E1] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D0E5E1]">
                <span className="font-editorial-serif font-bold text-[#191817] text-xs">
                  Current Active Prescriptions
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateRoute("prescriptions")}
                  className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
                >
                  Manage Prescriptions →
                </button>
              </div>
              <div className="space-y-2">
                {currentPrescriptions.map((rx, i) => (
                  <div key={i} className="p-3 bg-[#F8FBFA] border border-[#D0E5E1] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#191817]">{rx.name} {rx.dosage}</div>
                      <div className="text-[10px] text-[#7A746B] mt-0.5">
                        {rx.frequency} • {rx.duration} (Prescriber: {rx.prescriber})
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5">
                      ONGOING
                    </span>
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
        <div className="p-5 bg-white border border-[#D0E5E1] space-y-5 animate-fadeIn shadow-[0_4px_20px_rgba(26,25,24,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D0E5E1]">
            <div>
              <h2 className="text-base font-editorial-serif font-bold text-[#191817]">
                Account Security &amp; Identity Credentials
              </h2>
              <p className="text-[11px] text-[#5C574F]">
                Permanent Patient ID, login providers, cryptographic credentials, and ABDM security governance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePasswordModal(true)}
              className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#0D655E] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer rounded-none shadow-2xs transition-colors shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#F8FBFA] border border-[#D0E5E1] space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#7A746B] uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#0F766E]" />
                Permanent Patient ID (Cryptographic Identifier)
              </span>
              <div className="font-mono text-base font-bold text-[#0F766E] flex items-center justify-between pt-1">
                <span>{currentPatientId}</span>
                <button
                  type="button"
                  onClick={() => handleCopyPid(currentPatientId)}
                  className="px-3 py-1 bg-white text-[#191817] text-xs font-semibold border border-[#B6D6D0] rounded-none cursor-pointer hover:bg-[#F0F7F6] shadow-2xs"
                >
                  {copiedPid ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[11px] text-[#7A746B] pt-2 border-t border-[#D0E5E1]/60 leading-relaxed">
                This permanent identifier anchors all cross-institutional records across Indian ABDM participating healthcare networks. It cannot be altered.
              </p>
            </div>

            <div className="p-5 bg-[#F8FBFA] border border-[#D0E5E1] space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#7A746B] uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#0F766E]" />
                Authentication Method
              </span>
              <div className="font-bold text-[#191817] text-sm pt-1">
                {user?.isGoogleLinked || user?.authProviders?.includes("google")
                  ? "Google OAuth & Password (Multi-Provider)"
                  : "Patient ID / Email & Password Authentication"}
              </div>
              {!user?.isGoogleLinked && (
                <button
                  type="button"
                  disabled={googleLinkLoading}
                  onClick={handleLinkGoogle}
                  className="mt-2 text-xs text-[#0F766E] hover:underline font-semibold cursor-pointer block"
                >
                  {googleLinkLoading ? "Linking Google..." : "+ Link Google Account for 1-Click Access"}
                </button>
              )}
              {googleLinkMsg && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                  {googleLinkMsg}
                </div>
              )}
              <p className="text-[11px] text-[#7A746B] pt-2 border-t border-[#D0E5E1]/60 leading-relaxed">
                Sessions protected via HTTP-only partitioned session tokens with strict expiration timeouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RECORD DETAILS MODAL                                                   */}
      {/* ========================================================================= */}
      {activeDetailRecord && (
        <Dialog
          isOpen={!!activeDetailRecord}
          onClose={() => setActiveDetailRecord(null)}
          title={activeDetailRecord.title}
          description={`Record ID: ${activeDetailRecord.id} • Category: ${activeDetailRecord.category}`}
          maxWidth="lg"
        >
          <div className="space-y-4 font-editorial-sans text-xs">
            <div className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] space-y-2 text-[#5C574F]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><strong className="text-[#191817]">Submitted By:</strong> {activeDetailRecord.submittedBy}</div>
                <div><strong className="text-[#191817]">Healthcare Facility:</strong> {activeDetailRecord.provider}</div>
                <div><strong className="text-[#191817]">Timestamp:</strong> {activeDetailRecord.date} at {activeDetailRecord.time}</div>
                <div>
                  <strong className="text-[#191817]">Clinical Status:</strong>{" "}
                  <span className="font-mono uppercase font-bold text-[#0F766E] bg-white px-2 py-0.5 border border-[#D0E5E1]">
                    {activeDetailRecord.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border border-[#D0E5E1] space-y-1.5">
              <span className="font-bold block text-[#191817] text-xs">Clinical Summary &amp; Findings:</span>
              <p className="text-[#5C574F] leading-relaxed text-xs">{activeDetailRecord.summary}</p>
            </div>

            {/* Additional structured data if present */}
            {activeDetailRecord.clinicalData && Object.keys(activeDetailRecord.clinicalData).length > 0 && (
              <div className="p-4 bg-[#F8FBFA] border border-[#D0E5E1] space-y-2">
                <span className="font-bold block text-[#191817] text-xs">Structured Artifact Metadata:</span>
                <pre className="text-[11px] font-mono bg-white p-3 border border-[#D0E5E1] overflow-x-auto text-[#191817]">
                  {JSON.stringify(activeDetailRecord.clinicalData, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D0E5E1]">
              <Button
                type="button"
                variant="secondary"
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

      {/* ========================================================================= */}
      {/* 4. CHANGE PASSWORD MODAL                                                  */}
      {/* ========================================================================= */}
      <Dialog
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setPasswordChangeError(null);
          setPasswordChangeMsg(null);
        }}
        title="Change Account Password"
        description="Verify your current credential and establish a new strong password."
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
              className="w-full px-3 py-2 text-xs border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#0F766E] bg-[#F0F7F6] focus:bg-white text-[#191817]"
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
                className="w-full px-3 py-2 text-xs border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#0F766E] bg-[#F0F7F6] focus:bg-white text-[#191817] pr-8"
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
              className="w-full px-3 py-2 text-xs border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#0F766E] bg-[#F0F7F6] focus:bg-white text-[#191817]"
            />
          </div>

          <div className="flex gap-2 pt-2">
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
