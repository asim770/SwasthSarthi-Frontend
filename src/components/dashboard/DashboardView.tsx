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
      return <span className="px-1.5 py-0.5 bg-red-100 text-red-900 font-bold border border-red-300">CRITICAL</span>;
    }
    if (norm.includes("high") || norm.includes("borderline")) {
      return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold border border-amber-300">BORDERLINE</span>;
    }
    if (norm.includes("low")) {
      return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 font-bold border border-blue-300">LOW</span>;
    }
    return <span className="px-1.5 py-0.5 bg-teal-100 text-teal-900 font-bold border border-teal-300">NORMAL</span>;
  };

  return (
    <div className="space-y-4 font-sans text-xs text-[#1E1D1B]">
      {/* ========================================================================= */}
      {/* 1. COMPREHENSIVE PATIENT OVERVIEW BANNER                                   */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 bg-white border border-slate-300 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 bg-[#008080] text-white flex items-center justify-center font-bold text-base shrink-0 rounded-none border border-teal-800">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {displayName}
                </h1>
                <span className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 border border-teal-300 font-bold">
                  Verified Patient
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-300 font-mono">
                  ABDM Linked
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-slate-600">
                <span>{user?.email || "rahul.verma@synthetic.demo"}</span>
                <span>•</span>
                <span>{user?.phone || "+91-9876543210"}</span>
                <span>•</span>
                <span>{user?.gender || "Male"}</span>
                <span>•</span>
                <span>DOB: {user?.dateOfBirth || "1995-05-15"}</span>
              </div>
            </div>
          </div>

          {/* PERMANENT UNIQUE PATIENT ID CARD WITH PROMINENT COPY BUTTON */}
          <div className="p-3 bg-teal-50 border-2 border-teal-600 rounded-none flex items-center justify-between gap-4 min-w-[260px]">
            <div>
              <div className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">
                Permanent Patient ID
              </div>
              <div className="text-base font-mono font-extrabold text-[#008080] tracking-wide mt-0.5">
                {currentPatientId}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyPid(currentPatientId)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-400 cursor-pointer transition-colors shadow-2xs"
            >
              {copiedPid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Longitudinal Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 text-center">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Records</span>
            <span className="text-base font-bold text-slate-900">{allUnifiedRecords.length}</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Laboratory Reports</span>
            <span className="text-base font-bold text-teal-700">{labReports.length}</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Doctor Reports</span>
            <span className="text-base font-bold text-slate-900">{doctorReports.length}</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Active Prescriptions</span>
            <span className="text-base font-bold text-emerald-700">{currentPrescriptions.length}</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Follow-Ups</span>
            <span className="text-base font-bold text-amber-700">{upcomingFollowUps.length}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB NAVIGATION SWITCHER                                                */}
      {/* ========================================================================= */}
      <div className="flex bg-white border border-slate-300 p-1 gap-1 overflow-x-auto scrollbar-thin">
        {[
          { id: "overview", label: "Patient Overview", icon: Activity },
          { id: "unified", label: `Unified Records (${allUnifiedRecords.length})`, icon: FileText },
          { id: "labs", label: `Laboratory Reports (${labReports.length})`, icon: FlaskConical },
          { id: "doctors", label: `Doctor Reports (${doctorReports.length})`, icon: Stethoscope },
          { id: "timeline", label: "Health Timeline", icon: Clock },
          { id: "health-status", label: "Health Status & Vitals", icon: TrendingUp },
          { id: "security", label: "Security & Profile", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? "bg-[#008080] text-white border border-teal-800 shadow-xs"
                  : "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
            <div className="p-4 bg-white border border-slate-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Activity className="w-4 h-4 text-[#008080]" />
                  <span>Latest Clinical Updates</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("unified")}
                  className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-2.5">
                {allUnifiedRecords.slice(0, 3).map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveDetailRecord(rec)}
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rec.title}</span>
                      <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 border border-slate-200 text-slate-600">
                        {rec.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{rec.summary}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Submitted by: <strong>{rec.submittedBy}</strong></span>
                      <span className="text-teal-700 font-semibold">Inspect Record →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Upcoming Follow-ups & Active Prescriptions */}
            <div className="p-4 bg-white border border-slate-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-[#008080]" />
                  <span>Upcoming Follow-ups &amp; Action Items</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {upcomingFollowUps.map((fu, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/60 border border-amber-300 flex items-start gap-3">
                    <div className="w-9 h-9 bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{fu.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Scheduled with <strong>{fu.physician}</strong> at {fu.facility}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-amber-800 mt-1">
                        Due Date: {fu.date}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-3 bg-teal-50 border border-teal-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900">Current Medication (Active Rx)</span>
                    <span className="text-[10px] bg-teal-200 text-teal-950 font-bold px-1.5 py-0.2">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 font-semibold">
                    Telmisartan 40mg — Once daily morning
                  </div>
                  <div className="text-[11px] text-slate-600">
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
        <div className="p-4 bg-white border border-slate-300 space-y-3 animate-fadeIn">
          {/* Search, Filter, Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search records by title, physician, facility..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#008080]"
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
                className="px-2.5 py-1.5 border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#008080]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Records List Table / Cards */}
          <div className="space-y-2.5">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-1">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-xs">No medical records match your search criteria.</p>
              </div>
            ) : (
              filteredRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-400 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{rec.title}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white border border-teal-300 text-teal-800">
                        {rec.category}
                      </span>
                      {rec.isDoctorReviewed && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 border border-emerald-300 font-semibold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Doctor Reviewed</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <span>{rec.date}</span>
                      <span>{rec.time}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{rec.summary}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>Submitted by: <strong className="text-slate-800">{rec.submittedBy}</strong></span>
                      <span>•</span>
                      <span>Facility: <strong>{rec.provider}</strong></span>
                      <span>•</span>
                      <span>Patient ID: <span className="font-mono text-teal-800 font-bold">{currentPatientId}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDetailRecord(rec)}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 font-semibold cursor-pointer"
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
        <div className="p-4 bg-white border border-slate-300 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Diagnostic Laboratory Reports</h2>
              <p className="text-[11px] text-slate-500">Official laboratory test findings, abnormal flags, and verified PDF reports.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-teal-50 text-teal-800 px-2.5 py-1 border border-teal-300">
              {labReports.length} Reports
            </span>
          </div>

          <div className="space-y-4">
            {labReports.map((report) => (
              <div key={report.id} className="p-4 border-2 border-teal-200 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{report.title}</h3>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Uploaded by: <strong>{report.provider}</strong> • Tested Date: <span className="font-mono font-bold">{report.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] border border-emerald-300">
                      STATUS: COMPLETED
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading verified report: ${report.title}`)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-300 cursor-pointer text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Structured Laboratory Results Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 uppercase font-semibold text-[10px]">
                        <th className="py-2 px-3">Test Parameter</th>
                        <th className="py-2 px-3">Result Value</th>
                        <th className="py-2 px-3">Units</th>
                        <th className="py-2 px-3">Reference Range</th>
                        <th className="py-2 px-3">Abnormal Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-sans">
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">Total Cholesterol</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">195</td>
                        <td className="py-2 px-3 font-mono text-slate-600">mg/dL</td>
                        <td className="py-2 px-3 text-slate-600">125 - 200 mg/dL</td>
                        <td className="py-2 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">HDL Cholesterol</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">52</td>
                        <td className="py-2 px-3 font-mono text-slate-600">mg/dL</td>
                        <td className="py-2 px-3 text-slate-600">&gt; 40 mg/dL</td>
                        <td className="py-2 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-amber-50/30">
                        <td className="py-2 px-3 font-semibold text-slate-900">LDL Cholesterol</td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-900">118</td>
                        <td className="py-2 px-3 font-mono text-slate-600">mg/dL</td>
                        <td className="py-2 px-3 text-slate-600">&lt; 100 mg/dL</td>
                        <td className="py-2 px-3">{getAbnormalFlagBadge("Borderline High")}</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">Triglycerides</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">142</td>
                        <td className="py-2 px-3 font-mono text-slate-600">mg/dL</td>
                        <td className="py-2 px-3 text-slate-600">&lt; 150 mg/dL</td>
                        <td className="py-2 px-3">{getAbnormalFlagBadge("Normal")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Notes: Specimen lipemic index normal. Tested on calibrated auto-analyzer.</span>
                  <span className="font-semibold text-slate-800">Technician: Rajesh Kumar (Senior Biochemist)</span>
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
        <div className="p-4 bg-white border border-slate-300 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Doctor Consultation &amp; Clinical Reports</h2>
              <p className="text-[11px] text-slate-500">Formal medical consultations, diagnoses, clinical notes, and recommendations.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-teal-50 text-teal-800 px-2.5 py-1 border border-teal-300">
              {doctorReports.length} Reports
            </span>
          </div>

          <div className="space-y-4">
            {doctorReports.map((report) => (
              <div key={report.id} className="p-4 border-2 border-slate-300 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{report.title}</h3>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Consultant: <strong className="text-slate-900">{report.submittedBy}</strong> • Hospital: <strong>{report.provider}</strong>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 border border-slate-300">
                    {report.date}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Clinical Findings &amp; Observations
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      BP 138/88 mmHg, resting heart rate 74 bpm, regular rhythm, S1 S2 normal, no peripheral edema. Patient reports exertional dyspnea.
                    </p>
                  </div>

                  <div className="p-2.5 bg-teal-50 border border-teal-300">
                    <span className="text-[10px] text-teal-900 uppercase font-bold block mb-1">
                      Formal Clinical Diagnosis
                    </span>
                    <p className="text-teal-950 font-bold leading-relaxed">
                      Stage 1 Essential Hypertension (Primary) • Mild Borderline Dyslipidemia
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Treatment Plan &amp; Prescriptions
                  </span>
                  <p className="text-slate-800">
                    Lifestyle intervention with low-sodium DASH diet. Initiated Telmisartan 40mg once daily morning. Home blood pressure log maintained twice weekly.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                  <span>Recommended Tests: <strong>Lipid Profile, Serum Creatinine</strong></span>
                  <span className="text-teal-800 font-semibold">Review: 4 Weeks Follow-Up</span>
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
        <div className="p-4 bg-white border border-slate-300 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Chronological Medical Timeline</h2>
              <p className="text-[11px] text-slate-500">Longitudinal unified history combining reports, consultations, prescriptions, and dispensations.</p>
            </div>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
            {allUnifiedRecords.map((item, idx) => (
              <div key={idx} className="relative space-y-1">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 bg-white border-2 border-[#008080] rounded-none" />

                <div className="p-3 bg-slate-50 border border-slate-200 hover:border-teal-400 hover:bg-white transition-all space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.title}</span>
                    <span className="text-[10px] font-mono text-slate-600 font-bold bg-white px-1.5 py-0.5 border border-slate-200">
                      {item.date} • {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{item.summary}</p>
                  <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
                    <span>Source: <strong>{item.provider}</strong> ({item.submittedBy})</span>
                    <span className="text-teal-700 font-semibold cursor-pointer" onClick={() => setActiveDetailRecord(item)}>
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
        <div className="p-4 bg-white border border-slate-300 space-y-4 animate-fadeIn">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Health Status Overview &amp; Observations</h2>
            <p className="text-[11px] text-slate-500">Measurable observations comparison, active diagnoses, and current medical therapy.</p>
          </div>

          {/* Measurable Observations Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* BP Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-xs flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>Blood Pressure</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2">
                  Improved
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {latestVitals.bp.current}
              </div>
              <div className="text-[11px] text-slate-500">
                Prev: {latestVitals.bp.previous}
              </div>
              {/* Mini Trend SVG */}
              <svg className="w-full h-8 stroke-teal-600 fill-none" viewBox="0 0 100 25">
                <path d="M 0,22 Q 30,16 60,14 T 100,6" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Fasting Glucose Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-xs flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fasting Glucose</span>
                </span>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2">
                  Normal
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {latestVitals.glucose.current}
              </div>
              <div className="text-[11px] text-slate-500">
                Prev: {latestVitals.glucose.previous}
              </div>
              <svg className="w-full h-8 stroke-teal-600 fill-none" viewBox="0 0 100 25">
                <path d="M 0,20 Q 35,18 70,10 T 100,5" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Total Cholesterol Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-xs flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                  <span>Total Cholesterol</span>
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2">
                  Borderline
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {latestVitals.cholesterol.current}
              </div>
              <div className="text-[11px] text-slate-500">
                Prev: {latestVitals.cholesterol.previous}
              </div>
              <svg className="w-full h-8 stroke-amber-600 fill-none" viewBox="0 0 100 25">
                <path d="M 0,24 Q 40,18 70,12 T 100,8" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Resting Heart Rate */}
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-xs flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Heart Rate</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2">
                  Optimal
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {latestVitals.heartRate.current}
              </div>
              <div className="text-[11px] text-slate-500">
                Prev: {latestVitals.heartRate.previous}
              </div>
              <svg className="w-full h-8 stroke-emerald-600 fill-none" viewBox="0 0 100 25">
                <path d="M 0,15 Q 25,6 50,15 T 100,12" strokeWidth="2.5" />
              </svg>
            </div>
          </div>

          {/* Active Diagnoses & Current Medication */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block text-xs">Active Conditions &amp; Diagnoses</span>
              <div className="space-y-1.5">
                {activeConditions.map((cond, i) => (
                  <div key={i} className="p-2 bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{cond.name}</div>
                      <div className="text-[10px] text-slate-500">Diagnosed by {cond.physician} on {cond.diagnosedDate}</div>
                    </div>
                    <span className="text-[10px] bg-teal-100 text-teal-900 font-bold px-1.5 py-0.2">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block text-xs">Current Prescriptions</span>
              <div className="space-y-1.5">
                {currentPrescriptions.map((rx, i) => (
                  <div key={i} className="p-2 bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{rx.name} {rx.dosage}</div>
                      <div className="text-[10px] text-slate-500">{rx.frequency} • {rx.duration}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2">ACTIVE</span>
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
        <div className="p-4 bg-white border border-slate-300 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Account Security &amp; Identity Credentials</h2>
              <p className="text-[11px] text-slate-500">Permanent Patient ID, login providers, and password governance.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePasswordModal(true)}
              className="px-3 py-1.5 bg-[#008080] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-teal-50 border border-teal-300 space-y-1">
              <span className="text-[10px] text-teal-800 uppercase font-bold">Unique Patient ID (Permanent)</span>
              <div className="font-mono text-base font-extrabold text-[#008080] flex items-center justify-between">
                <span>{currentPatientId}</span>
                <button
                  type="button"
                  onClick={() => handleCopyPid(currentPatientId)}
                  className="px-2 py-0.5 bg-white text-teal-800 text-xs font-bold border border-teal-300 cursor-pointer"
                >
                  {copiedPid ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                This identifier cannot be changed and links all longitudinal medical records across healthcare facilities.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Authentication Method</span>
              <div className="font-bold text-slate-900 text-sm">
                {user?.isGoogleLinked || user?.authProviders?.includes("google")
                  ? "Google OAuth & Password"
                  : "Patient ID / Email & Password"}
              </div>
              {!user?.isGoogleLinked && (
                <button
                  type="button"
                  disabled={googleLinkLoading}
                  onClick={handleLinkGoogle}
                  className="mt-2 text-xs text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                >
                  {googleLinkLoading ? "Linking..." : "+ Link Google Account"}
                </button>
              )}
              {googleLinkMsg && (
                <div className="mt-1.5 text-xs text-teal-800 font-semibold">{googleLinkMsg}</div>
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
          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
              <div><strong>Submitted By:</strong> {activeDetailRecord.submittedBy}</div>
              <div><strong>Facility:</strong> {activeDetailRecord.provider}</div>
              <div><strong>Date &amp; Time:</strong> {activeDetailRecord.date} {activeDetailRecord.time}</div>
              <div><strong>Status:</strong> {activeDetailRecord.status}</div>
            </div>

            <div className="p-3 bg-white border border-slate-200">
              <span className="font-bold block mb-1 text-slate-900">Clinical Summary:</span>
              <p className="text-slate-700 leading-relaxed">{activeDetailRecord.summary}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
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
