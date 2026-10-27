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
  Sparkles,
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchTimelineRecords,
  fetchDiscoverablePatients,
  fetchConsents,
} from "../../api/client";
import type { TimelineRecordItem, DiscoverablePatient, ConsentItem } from "../../types/api";
import { TransferModal } from "./TransferModal";
import { FhirResourceModal } from "./FhirResourceModal";

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
            <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700 mb-4 shadow-xs">
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
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 shadow-xs">
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
        return <FlaskConical className="w-4 h-4 text-teal-600" />;
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
        title="Longitudinal Patient Health Records"
        breadcrumb="Portal / Clinical Records / Longitudinal Timeline"
        description="Unified HL7 FHIR Release 4 clinical timeline aggregated across participating ABDM healthcare institutions under patient electronic consent."
        badge={
          <div className="flex items-center gap-1.5">
            <Badge variant="teal" size="sm">FHIR R4 Compliant</Badge>
            <Badge variant="neutral" size="sm">Mock ABDM Gateway</Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
              onClick={loadTimeline}
            >
              Refresh
            </Button>
            {user?.role === "doctor" && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                onClick={() => setIsTransferModalOpen(true)}
              >
                ABDM Exchange (Mock HIP)
              </Button>
            )}
          </div>
        }
      />

      {/* Doctor Patient Context Bar */}
      {user?.role === "doctor" && (
        <Card className="border-[#d7eaea] bg-gradient-to-r from-[#f0fdfa] via-white to-white shadow-xs">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-[#172033] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#008080]" />
                Select Patient:
              </span>
              <select
                value={selectedPatientId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedPatientId(pid);
                  const p = patients.find((pt) => pt.id === pid);
                  if (p) setSelectedPatientName(p.name);
                }}
                className="bg-white border border-[#d7eaea] rounded-[12px] px-3 py-1.5 font-medium text-[#172033] shadow-xs focus:ring-2 focus:ring-[#008080] focus:border-[#008080] focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.abhaAddress})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Consent Status */}
            <div className="flex items-center gap-2">
              {activeConsent ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Consent Active #{activeConsent.consentId} (
                    {(activeConsent.approvedHiTypes.length > 0
                      ? activeConsent.approvedHiTypes
                      : activeConsent.hiTypes
                    ).join(", ")}
                    )
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-[11px] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>No active consent found for this patient.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search diagnostic tests, doctors, medications, or findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#d7eaea] rounded-[12px] text-xs text-[#172033] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-[#008080]"
              />
            </div>

            {/* Date Range Pickers */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-white border border-[#d7eaea] rounded-[12px] px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#008080]" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-[#172033] text-xs focus:outline-none"
                  title="From Date"
                />
              </div>
              <span className="text-[#64748b] text-xs">to</span>
              <div className="flex items-center gap-1.5 bg-white border border-[#d7eaea] rounded-[12px] px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#008080]" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent text-[#172033] text-xs focus:outline-none"
                  title="To Date"
                />
              </div>

              {/* Source Institution Dropdown */}
              {institutionOptions.length > 0 && (
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  className="bg-white border border-[#d7eaea] rounded-[12px] px-2.5 py-1.5 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#008080]"
                >
                  <option value="ALL">All HIP Sources</option>
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
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
                  className={`px-3 py-1.5 rounded-[12px] text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedType === f.id
                      ? "bg-[#008080] text-white shadow-xs"
                      : "bg-[#f0fdfa] text-[#475569] border border-[#d7eaea] hover:bg-[#b2d8d8]/30 hover:text-[#008080]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedType === f.id
                        ? "bg-[#004c4c] text-white"
                        : "bg-[#d7eaea]/70 text-[#004c4c]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Timeline View */}
      {error ? (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="py-10 text-center text-xs text-red-700">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <span className="font-bold block text-sm mb-1">Access Restricted</span>
            <p className="max-w-md mx-auto">{error}</p>
          </CardContent>
        </Card>
      ) : loading ? (
        /* Loading Skeletons */
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs animate-pulse flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          title="No Clinical Health Records Found"
          description={
            user?.role === "doctor" && !activeConsent
              ? "Active patient electronic consent is required before accessing records. Request consent or ask the patient to approve access."
              : "No FHIR R4 records match the selected date range or category filters. Adjust your criteria or initiate an ABDM record exchange."
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
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#d7eaea]">
          {records.map((record) => (
            <div key={record.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full bg-white border-2 border-[#008080] flex items-center justify-center shadow-xs transition-transform group-hover:scale-110">
                <span className="w-2 h-2 rounded-full bg-[#008080]" />
              </div>

              {/* Record Card */}
              <Card className="hover:border-[#b2d8d8] transition-all hover:shadow-xs">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#f0fdfa] border border-[#d7eaea] flex items-center justify-center shrink-0 mt-0.5 text-[#008080]">
                        {getResourceIcon(record.resourceType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#172033]">
                            {cleanDisplay(record.title)}
                          </h4>
                          <Badge
                            variant={getResourceBadgeColor(record.resourceType) as "teal" | "neutral" | "warning" | "success" | "danger"}
                            size="sm"
                          >
                            {record.resourceType}
                          </Badge>
                          {record.origin === "abdm_transfer" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0fdfa] text-[#008080] border border-[#b2d8d8] font-semibold">
                              Exchanged via ABDM
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#64748b] mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-[#475569]">
                            <Calendar className="w-3 h-3 text-[#008080]" />
                            {record.date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#475569]">
                            <Building2 className="w-3 h-3 text-[#008080]" />
                            {cleanDisplay(record.sourceInstitution)}
                          </span>
                          <span>•</span>
                          <span className="text-[#475569]">
                            Dr: <strong>{cleanDisplay(record.doctorName)}</strong>
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
                  <div className="mt-3 p-3 bg-[#f0fdfa]/60 border border-[#d7eaea]/70 rounded-xl text-xs text-[#475569] leading-relaxed font-sans">
                    {cleanDisplay(record.summary)}
                  </div>

                  {/* Care context and mock marker */}
                  <div className="mt-3 flex items-center justify-between text-[10px] text-[#64748b] pt-2 border-t border-[#d7eaea]/60">
                    <span className="font-mono">
                      Care Context: <strong>{record.careContextId}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-[#008080] font-semibold">
                      <Sparkles className="w-3 h-3 text-[#008080]" />
                      Synthetic Demo Data
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
    </div>
  );
};
