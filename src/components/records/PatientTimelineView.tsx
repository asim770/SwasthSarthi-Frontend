import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "../ui/PageHeader";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import {
  FileText,
  Search,
  Calendar,
  Building2,
  ShieldCheck,
  ArrowRightLeft,
  RefreshCw,
  FlaskConical,
  Stethoscope,
  Activity,
  Pill,
  Syringe,
  PackageCheck,
  ClipboardList,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  User,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchTimelineRecords,
  fetchDiscoverablePatients,
  fetchConsents,
  searchPatientByPatientId,
  requestDoctorConsent,
} from "../../api/client";
import type { TimelineRecordItem, DiscoverablePatient, ConsentItem } from "../../types/api";
import { TransferModal } from "./TransferModal";
import { FhirResourceModal } from "./FhirResourceModal";
import { DoctorConsultationModal } from "./DoctorConsultationModal";
import { DoctorHealthAssessmentModal } from "./DoctorHealthAssessmentModal";

const RESOURCE_TYPE_FILTERS = [
  { id: "ALL", label: "All Records", icon: FileText },
  { id: "DiagnosticReport", label: "Diagnostics", icon: FlaskConical },
  { id: "Encounter", label: "Encounters", icon: Stethoscope },
  { id: "Observation", label: "Observations", icon: Activity },
  { id: "MedicationRequest", label: "Prescriptions", icon: Pill },
  { id: "MedicationDispense", label: "Dispenses", icon: PackageCheck },
  { id: "Immunization", label: "Immunizations", icon: Syringe },
  { id: "DocumentReference", label: "Documents", icon: FileText },
  { id: "ServiceRequest", label: "Orders", icon: ClipboardList },
];

function cleanDisplay(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export const PatientTimelineView: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Selected Patient State (for Doctor view)
  const [patients, setPatients] = useState<DiscoverablePatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  // Consent Context
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [activeConsent, setActiveConsent] = useState<ConsentItem | null>(null);

  // Filter and Search State
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("ALL");

  // Timeline Records State
  const [records, setRecords] = useState<TimelineRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<TimelineRecordItem | null>(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState<boolean>(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);

  // Doctor Patient ID Search & Consent State
  const [patientIdInput, setPatientIdInput] = useState<string>("");
  const [patientLookupResult, setPatientLookupResult] = useState<DiscoverablePatient | null>(null);
  const [searchingPatient, setSearchingPatient] = useState<boolean>(false);
  const [patientSearchError, setPatientSearchError] = useState<string | null>(null);
  const [requestingConsent, setRequestingConsent] = useState<boolean>(false);
  const [consentRequestSuccess, setConsentRequestSuccess] = useState<string | null>(null);

  // Resolve active Patient readable ID (SS-PAT-XXXXXX)
  const currentPatientCustomId = useMemo(() => {
    const pt = patients.find((p) => p.id === selectedPatientId);
    return pt?.patientId || patientLookupResult?.patientId || selectedPatientId;
  }, [patients, selectedPatientId, patientLookupResult]);

  const handleLookupPatient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = patientIdInput.trim();
    if (!query) return;

    setSearchingPatient(true);
    setPatientSearchError(null);
    setConsentRequestSuccess(null);

    try {
      const patient = await searchPatientByPatientId(query);
      setPatientLookupResult(patient);
      setSelectedPatientId(patient.id);
      setSelectedPatientName(patient.name);

      // Add to patient dropdown list if not present
      setPatients((prev) => {
        if (prev.some((p) => p.id === patient.id)) return prev;
        return [patient, ...prev];
      });

      // Reload consents to check if this doctor already has access to this patient
      const updatedConsents = await fetchConsents();
      setConsents(updatedConsents);
    } catch (err: unknown) {
      setPatientSearchError(
        err instanceof Error ? err.message : `Patient with ID ${query} was not found.`
      );
      setPatientLookupResult(null);
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleRequestConsent = async () => {
    if (!selectedPatientId) return;
    setRequestingConsent(true);
    setPatientSearchError(null);
    setConsentRequestSuccess(null);

    try {
      await requestDoctorConsent({
        patientId: selectedPatientId,
        hiTypes: [
          "OPConsultation",
          "DiagnosticReport",
          "Prescription",
          "DischargeSummary",
          "ImmunizationRecord",
        ],
        expireDurationDays: 30,
        purpose: "Clinical review, diagnosis, and treatment follow-up",
      });
      setConsentRequestSuccess(
        "Consent request sent! The patient has received an in-app authorization notification."
      );
      const updated = await fetchConsents();
      setConsents(updated);
    } catch (err: unknown) {
      setPatientSearchError(err instanceof Error ? err.message : "Failed to dispatch consent request.");
    } finally {
      setRequestingConsent(false);
    }
  };

  // 1. Initial Identity and Patient Resolution
  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated || !user) return;

    if (user.role === "patient") {
      setSelectedPatientId(user.id);
      setSelectedPatientName(user.name);
    } else if (user.role === "doctor") {
      fetchDiscoverablePatients()
        .then((pts) => {
          if (!mounted) return;
          setPatients(pts);
          if (pts.length > 0) {
            setSelectedPatientId(pts[0].id);
            setSelectedPatientName(pts[0].name);
          }
        })
        .catch((err) => console.warn("Patient discovery warning:", err));

      fetchConsents()
        .then((items) => {
          if (!mounted) return;
          setConsents(items);
        })
        .catch((err) => console.warn("Consents fetch warning:", err));
    }

    return () => {
      mounted = false;
    };
  }, [user, isAuthenticated]);

  // 2. Resolve Active Consent for Doctor on Selected Patient
  useEffect(() => {
    if (user?.role !== "doctor" || !selectedPatientId) {
      setActiveConsent(null);
      return;
    }

    const now = new Date();
    const match = consents.find((c) => {
      const pid = typeof c.patientId === "object" ? c.patientId?._id : c.patientId;
      return (
        pid === selectedPatientId &&
        ["APPROVED", "GRANTED"].includes(c.status) &&
        new Date(c.expiresAt) > now
      );
    });

    setActiveConsent(match || null);
  }, [consents, selectedPatientId, user]);

  // 3. Load Timeline Records
  const loadTimeline = useCallback(async () => {
    if (!selectedPatientId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchTimelineRecords({
        patientId: selectedPatientId,
        resourceType: selectedType !== "ALL" ? selectedType : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: searchQuery || undefined,
        sourceInstitution: selectedInstitution !== "ALL" ? selectedInstitution : undefined,
      });
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patient health records.");
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId, selectedType, fromDate, toDate, searchQuery, selectedInstitution]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // Distinct Source Institutions in loaded records for filter dropdown
  const institutionOptions = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.sourceInstitution) set.add(r.sourceInstitution);
    });
    return Array.from(set);
  }, [records]);

  // Role Block Checks (DAL Policy Enforcement)
  const isAdminBlocked = user?.role === "admin";
  const isLabOrPharmacyBlocked = user?.role === "laboratory" || user?.role === "pharmacy";

  if (isAdminBlocked) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Patient Health Records Timeline"
          breadcrumb="Portal / Clinical Records"
          description="Longitudinal FHIR R4 document bundles and diagnostic history."
          badge={<Badge variant="danger" size="sm">DAL Policy: Denied</Badge>}
        />
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-none bg-red-100 border border-red-200 flex items-center justify-center text-red-700 mb-4 shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-red-900 mb-1">
              403 Forbidden — Clinical Data Access Denied
            </h3>
            <p className="text-xs text-red-700 max-w-lg mb-6 leading-relaxed">
              <strong>Security Policy Rule (DAL):</strong> Administrative users are strictly forbidden from viewing or accessing patient clinical records, FHIR bundles, or medical timelines.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLabOrPharmacyBlocked) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Patient Health Records Timeline"
          breadcrumb="Portal / Clinical Records"
          description="Longitudinal FHIR R4 document bundles and diagnostic history."
          badge={<Badge variant="danger" size="sm">DAL Policy: Denied</Badge>}
        />
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-none bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-amber-900 mb-1">
              403 Forbidden — Resource Outside Authorized Scope
            </h3>
            <p className="text-xs text-amber-800 max-w-md mb-6 leading-relaxed">
              Your role (<strong>{user?.role}</strong>) does not have authorization to browse general longitudinal medical records. Access is restricted exclusively to assigned specimen intake or pharmacy dispensing.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "DiagnosticReport":
        return <FlaskConical className="w-4 h-4 text-[#0F766E]" />;
      case "Encounter":
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case "Observation":
        return <Activity className="w-4 h-4 text-purple-600" />;
      case "MedicationRequest":
        return <Pill className="w-4 h-4 text-amber-600" />;
      case "MedicationDispense":
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case "Immunization":
        return <Syringe className="w-4 h-4 text-rose-600" />;
      case "DocumentReference":
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case "ServiceRequest":
        return <ClipboardList className="w-4 h-4 text-cyan-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getResourceBadgeColor = (type: string) => {
    switch (type) {
      case "DiagnosticReport":
        return "teal";
      case "Encounter":
        return "neutral";
      case "Observation":
        return "teal";
      case "MedicationRequest":
        return "warning";
      case "MedicationDispense":
        return "success";
      case "Immunization":
        return "danger";
      case "DocumentReference":
        return "neutral";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Patient Health Records"
        description="Comprehensive chronological clinical records, diagnostic reports, and medical consultations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
              onClick={loadTimeline}
            >
              Refresh
            </Button>
            {user?.role === "doctor" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                  onClick={() => setIsConsultationModalOpen(true)}
                  disabled={user?.verificationStatus === "PENDING"}
                  title={user?.verificationStatus === "PENDING" ? "Account pending approval" : "Add Doctor Consultation Report"}
                >
                  New Consultation
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Activity className="w-3.5 h-3.5" />}
                  onClick={() => setIsAssessmentModalOpen(true)}
                  disabled={user?.verificationStatus === "PENDING"}
                  title={user?.verificationStatus === "PENDING" ? "Account pending approval" : "Update Patient Health Assessment"}
                >
                  Health Assessment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  ABDM Exchange
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Doctor Account Pending Approval Notice */}
      {user?.role === "doctor" && user?.verificationStatus === "PENDING" && (
        <Card className="border-amber-300 bg-amber-50 rounded-none shadow-none">
          <CardContent className="p-4 flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider text-[11px] text-amber-950">
                Doctor Account Pending Administrator Approval
              </div>
              <p className="mt-1 text-amber-800 leading-relaxed">
                Your medical registration (License #{user.registrationNumber || "Pending Review"} • {user.medicalQualification || "MBBS"}) is currently undergoing administrative verification. Clinical reporting and patient medical data modifications are restricted until verified by an administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor Patient Context & Patient ID Search Bar */}
      {user?.role === "doctor" && (
        <Card className="border-[#D0E5E1] rounded-none bg-white shadow-none">
          <CardContent className="p-4 space-y-4 text-xs">
            {/* Top row: Patient ID Search & Quick Selection Dropdown */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#D0E5E1]">
              {/* Patient ID Search Input */}
              <form onSubmit={handleLookupPatient} className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8C877D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter Patient ID (e.g. SS-PAT-000001)..."
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#F0F7F6] border border-[#B6D6D0] rounded-none text-xs font-mono font-bold text-[#1A1918] placeholder-[#8C877D] focus:outline-none focus:ring-1 focus:ring-[#1A1918]"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={searchingPatient || !patientIdInput.trim()}
                  leftIcon={searchingPatient ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                >
                  Lookup
                </Button>
              </form>

              {/* Patient Selection Dropdown */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1A1918] flex items-center gap-1.5 shrink-0 text-xs font-mono uppercase tracking-wider text-[11px]">
                  <User className="w-4 h-4 text-[#0F766E]" />
                  Active Patient:
                </span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedPatientId(pid);
                    const p = patients.find((pt) => pt.id === pid);
                    if (p) setSelectedPatientName(p.name);
                  }}
                  className="bg-white border border-[#B6D6D0] rounded-none px-3 py-1.5 font-bold text-xs text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918]"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.patientId ? `• ${p.patientId}` : `• ${p.abhaAddress}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Patient Search Feedback Messages */}
            {patientSearchError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{patientSearchError}</span>
              </div>
            )}
            {consentRequestSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 rounded-none">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{consentRequestSuccess}</span>
              </div>
            )}

            {/* Minimal Patient Identity Card & Consent Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F0F7F6] p-3 border border-[#D0E5E1] rounded-none">
              {/* Minimal Identity Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[#1A1918] font-editorial-serif">{selectedPatientName || "Selected Patient"}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] font-bold">
                    {currentPatientCustomId}
                  </span>
                </div>
                <p className="text-[11px] text-[#69655E] flex items-center gap-1.5 font-mono">
                  <Lock className="w-3 h-3 text-[#0F766E]" />
                  <span>Minimal patient identity disclosed per privacy regulations. Complete clinical records require patient consent.</span>
                </p>
              </div>

              {/* Consent Status & Action */}
              <div className="flex items-center gap-2 shrink-0">
                {activeConsent ? (
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 text-xs font-semibold rounded-none font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Consent Active #{activeConsent.consentId} (Expires: {new Date(activeConsent.expiresAt).toLocaleDateString()})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs font-semibold rounded-none font-mono">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Consent Required</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleRequestConsent}
                      disabled={requestingConsent || !selectedPatientId}
                      leftIcon={requestingConsent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    >
                      Request Patient Consent
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card className="rounded-none border-[#D0E5E1] shadow-none bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#7A746B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by diagnosis, physician, facility, or test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none text-xs text-[#191817] placeholder-[#7A746B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
              />
            </div>

            {/* Date Range Pickers */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-[#191817] text-xs focus:outline-none"
                  title="From Date"
                />
              </div>
              <span className="text-[#7A746B] text-xs font-medium">to</span>
              <div className="flex items-center gap-1.5 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent text-[#191817] text-xs focus:outline-none"
                  title="To Date"
                />
              </div>

              {/* Source Institution Dropdown */}
              {institutionOptions.length > 0 && (
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  className="bg-[#F0F7F6] border border-[#D0E5E1] rounded-none px-2.5 py-1.5 text-xs text-[#191817] focus:outline-none focus:ring-1 focus:ring-[#1A1918]"
                >
                  <option value="ALL">All Facilities</option>
                  {institutionOptions.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              )}

              {(fromDate || toDate || searchQuery || selectedType !== "ALL" || selectedInstitution !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setSearchQuery("");
                    setSelectedType("ALL");
                    setSelectedInstitution("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Resource Type Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-[#D0E5E1]/60">
            {RESOURCE_TYPE_FILTERS.map((f) => {
              const Icon = f.icon;
              const count =
                f.id === "ALL"
                  ? records.length
                  : records.filter((r) => r.resourceType === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedType(f.id)}
                  className={`px-3 py-1.5 rounded-none text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedType === f.id
                      ? "bg-[#1A1918] text-white shadow-2xs font-semibold"
                      : "bg-[#F0F7F6] text-[#5C574F] border border-[#D0E5E1] hover:bg-white hover:text-[#191817]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-none font-mono ${
                        selectedType === f.id
                          ? "bg-white/20 text-white"
                          : "bg-[#D0E5E1] text-[#1A1918]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Timeline View */}
      {error ? (
        <Card className="border-red-200 bg-red-50/50 rounded-none shadow-none">
          <CardContent className="py-10 text-center text-xs text-red-700">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <span className="font-bold block text-sm mb-1 font-editorial-serif">Access Restricted</span>
            <p className="max-w-md mx-auto">{error}</p>
          </CardContent>
        </Card>
      ) : loading ? (
        /* Loading Skeletons */
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 bg-white border border-[#D0E5E1] rounded-none shadow-none animate-pulse flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-none bg-[#F0F7F6] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#F0F7F6] rounded-none w-1/3" />
                <div className="h-3 bg-[#F0F7F6] rounded-none w-3/4" />
                <div className="h-3 bg-[#F0F7F6] rounded-none w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          title="No Clinical Health Records Found"
          description={
            user?.role === "doctor" && !activeConsent
              ? "Active patient electronic consent is required before accessing records."
              : (fromDate || toDate || searchQuery || selectedType !== "ALL" || selectedInstitution !== "ALL")
              ? "No medical records match your current filter criteria. Try clearing search filters."
              : "There are no clinical records linked to your health identifier yet. New records from hospital visits and diagnostic tests will appear here."
          }
          action={
            user?.role === "doctor" ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                onClick={() => setIsTransferModalOpen(true)}
              >
                Exchange from ABDM Institution
              </Button>
            ) : undefined
          }
        />
      ) : (
        /* Chronological Vertical Timeline Spine */
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D0E5E1]">
          {records.map((record) => (
            <div key={record.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-none bg-white border border-[#1A1918] flex items-center justify-center shadow-none transition-transform group-hover:scale-110">
                <span className="w-2 h-2 rounded-none bg-[#0F766E]" />
              </div>

              {/* Record Card */}
              <Card className="hover:border-[#B6D6D0] transition-all shadow-none rounded-none border-[#D0E5E1]">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center shrink-0 mt-0.5 text-[#0F766E]">
                        {getResourceIcon(record.resourceType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#1A1918] font-editorial-serif">
                            {cleanDisplay(record.title)}
                          </h4>
                          <Badge
                            variant={getResourceBadgeColor(record.resourceType) as "teal" | "neutral" | "warning" | "success" | "danger"}
                            size="sm"
                          >
                            {record.resourceType}
                          </Badge>
                          {record.origin === "abdm_transfer" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] font-semibold font-mono">
                              Exchanged via ABDM
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#69655E] mt-1 flex-wrap font-mono">
                          <span className="flex items-center gap-1 font-medium text-[#1A1918]">
                            <Calendar className="w-3 h-3 text-[#8C877D]" />
                            {record.date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#5C574F]">
                            <Building2 className="w-3 h-3 text-[#8C877D]" />
                            {cleanDisplay(record.sourceInstitution)}
                          </span>
                          <span>•</span>
                          <span className="text-[#5C574F]">
                            Dr: <strong className="text-[#1A1918]">{cleanDisplay(record.doctorName)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <Badge variant="neutral" size="sm">
                        {record.status}
                      </Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedDetailRecord(record)}
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      >
                        FHIR Details
                      </Button>
                    </div>
                  </div>

                  {/* Clinical Summary */}
                  <div className="mt-3 p-3 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none text-xs text-[#5C574F] leading-relaxed font-sans">
                    {cleanDisplay(record.summary)}
                  </div>

                  {/* Care context and verification */}
                  <div className="mt-3 flex items-center justify-between text-[10px] text-[#69655E] pt-2 border-t border-[#D0E5E1]">
                    <span className="font-mono">
                      Care Context: <strong className="text-[#1A1918]">{record.careContextId}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified Record</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        patientId={selectedPatientId}
        patientName={selectedPatientName}
        activeConsent={activeConsent}
        onTransferSuccess={() => {
          loadTimeline();
        }}
      />

      <FhirResourceModal
        record={selectedDetailRecord}
        onClose={() => setSelectedDetailRecord(null)}
      />

      <DoctorConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        defaultPatientId={currentPatientCustomId}
        onSuccess={() => {
          setIsConsultationModalOpen(false);
          loadTimeline();
        }}
      />

      <DoctorHealthAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        defaultPatientId={currentPatientCustomId}
        onSuccess={() => {
          setIsAssessmentModalOpen(false);
          loadTimeline();
        }}
      />
    </div>
  );
};
