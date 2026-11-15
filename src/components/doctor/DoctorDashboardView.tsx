import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import {
  Stethoscope,
  Search,
  FileText,
  FlaskConical,
  Pill,
  Activity,
  Calendar,
  Building2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  UserCheck,
  Eye,
  Syringe,
  X,
  PackageCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchDoctorTreatedPatients,
  fetchTimelineRecords,
  searchPatientByPatientId,
} from "../../api/client";
import type {
  TreatedPatientRecord,
  TimelineRecordItem,
} from "../../types/api";
import { DoctorConsultationModal } from "../records/DoctorConsultationModal";
import { FhirResourceModal } from "../records/FhirResourceModal";

function cleanDisplay(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export const DoctorDashboardView: React.FC = () => {
  const { user } = useAuth();

  // State: Treated Patients
  const [treatedPatients, setTreatedPatients] = useState<TreatedPatientRecord[]>([]);
  const [treatedLoading, setTreatedLoading] = useState<boolean>(true);
  const [treatedError, setTreatedError] = useState<string | null>(null);

  // State: Patient ID Lookup
  const [patientLookupId, setPatientLookupId] = useState<string>("");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // State: Active Selected Patient for Medical Dossier (null by default - no dummy auto-selection)
  const [activePatient, setActivePatient] = useState<{
    id: string;
    patientId: string;
    name: string;
    gender?: string;
    dateOfBirth?: string;
    abhaAddress?: string;
    abhaId?: string;
    phone?: string;
    email?: string;
  } | null>(null);

  // State: Active Patient's Full Longitudinal Records
  const [patientRecords, setPatientRecords] = useState<TimelineRecordItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // State: Dossier Tab Navigation
  const [activeDossierTab, setActiveDossierTab] = useState<
    "other_doctors" | "reports" | "prescriptions" | "all_records"
  >("other_doctors");

  // State: Modals
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState<boolean>(false);
  const [consultationTargetPid, setConsultationTargetPid] = useState<string>("");
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<TimelineRecordItem | null>(null);

  // Load treated patients (only patients this doctor has consulted)
  const loadTreatedPatients = useCallback(async () => {
    setTreatedLoading(true);
    setTreatedError(null);
    try {
      const data = await fetchDoctorTreatedPatients();
      setTreatedPatients(data);
    } catch (err: unknown) {
      setTreatedError(
        err instanceof Error ? err.message : "Failed to load treated patients registry."
      );
    } finally {
      setTreatedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTreatedPatients();
  }, [loadTreatedPatients]);

  // Load active patient's longitudinal records whenever activePatient is set
  const loadActivePatientRecords = useCallback(async (patientIdToLoad: string) => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const timeline = await fetchTimelineRecords({ patientId: patientIdToLoad });
      setPatientRecords(timeline);
    } catch (err: unknown) {
      setRecordsError(
        err instanceof Error ? err.message : "Failed to load patient longitudinal medical records."
      );
      setPatientRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activePatient) {
      const lookupKey = activePatient.patientId || activePatient.id;
      loadActivePatientRecords(lookupKey);
    }
  }, [activePatient, loadActivePatientRecords]);

  // Handle Lookup by Patient ID
  const handleLookupPatient = async (targetId?: string) => {
    const query = (targetId || patientLookupId).trim();
    if (!query) return;

    setLookupLoading(true);
    setLookupError(null);
    try {
      const patient = await searchPatientByPatientId(query);
      const resolvedPatient = {
        id: patient.id,
        patientId: patient.patientId || query,
        name: patient.name,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        abhaAddress: patient.abhaAddress,
        abhaId: patient.abhaId,
        phone: patient.phone,
        email: patient.email,
      };
      setActivePatient(resolvedPatient);
      setPatientLookupId("");
    } catch (err: unknown) {
      setLookupError(
        err instanceof Error
          ? err.message
          : `Patient with ID or ABHA '${query}' could not be resolved in the ABDM network.`
      );
    } finally {
      setLookupLoading(false);
    }
  };

  // Grouped Patient Records for Dossier
  // 1. Previous Treatments by Other Doctors
  const otherDoctorsTreatments = useMemo(() => {
    const currentDoctorNameLower = (user?.name || "").toLowerCase().replace(/^dr\.\s*/, "").trim();

    return patientRecords.filter((rec) => {
      const isEncounterOrDoc =
        rec.resourceType === "Encounter" ||
        rec.resourceType === "Observation" ||
        rec.resourceType === "DocumentReference";

      if (!isEncounterOrDoc) return false;

      const docName = (rec.doctorName || "").toLowerCase();
      const isOtherDoctor =
        !currentDoctorNameLower || !docName.includes(currentDoctorNameLower);

      return isOtherDoctor;
    });
  }, [patientRecords, user?.name]);

  // 2. All Diagnostic Reports & Lab Tests
  const diagnosticReports = useMemo(() => {
    return patientRecords.filter(
      (rec) =>
        rec.resourceType === "DiagnosticReport" ||
        rec.category === "DiagnosticReport" ||
        rec.title.toLowerCase().includes("panel") ||
        rec.title.toLowerCase().includes("report") ||
        rec.title.toLowerCase().includes("profile") ||
        rec.title.toLowerCase().includes("glucose") ||
        rec.title.toLowerCase().includes("hba1c")
    );
  }, [patientRecords]);

  // 3. Prescriptions & Medications
  const medicationRecords = useMemo(() => {
    return patientRecords.filter(
      (rec) =>
        rec.resourceType === "MedicationRequest" ||
        rec.resourceType === "MedicationDispense" ||
        rec.category === "MedicationRequest" ||
        rec.title.toLowerCase().includes("prescription") ||
        rec.title.toLowerCase().includes("dispens")
    );
  }, [patientRecords]);

  // Launch consultation modal for a patient
  const handleOpenConsultation = (patientId?: string) => {
    setConsultationTargetPid(patientId || "");
    setIsConsultationModalOpen(true);
  };

  // Callback when new consultation is created
  const handleConsultationSuccess = async () => {
    setIsConsultationModalOpen(false);
    await loadTreatedPatients();
    if (activePatient) {
      await loadActivePatientRecords(activePatient.patientId || activePatient.id);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-editorial-sans text-[#191817]">
      {/* 1. Page Header matching other views */}
      <PageHeader
        breadcrumb="HPR · HEALTHCARE PROFESSIONAL REGISTRY"
        title="Doctor Clinical Workspace"
        description="Review your consulted patients, diagnoses, and treatment plans. Lookup any patient by Patient ID to access complete longitudinal records, diagnostic reports, and treatments from any doctor."
        badge={
          <Badge variant="teal" size="sm">
            ABDM Verified
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${treatedLoading ? "animate-spin" : ""}`} />}
              onClick={() => {
                loadTreatedPatients();
                if (activePatient) {
                  loadActivePatientRecords(activePatient.patientId || activePatient.id);
                }
              }}
              disabled={treatedLoading}
            >
              Sync
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleOpenConsultation(activePatient?.patientId || "")}
            >
              New Treatment & Suggestion
            </Button>
          </div>
        }
      />

      {/* 2. Facility Scope Notice Strip (Matching Laboratory & Consent Views) */}
      <div className="p-3.5 bg-white border border-[#D0E5E1] rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span className="text-[#5C574F]">
            <strong className="text-[#191817]">Active Practitioner:</strong>{" "}
            Dr. {user?.name?.replace(/^Dr\.\s*/i, "") || "Clinician"}
            {user?.facility && (
              <>
                {" • "}
                <strong className="text-[#191817]">Facility:</strong> {user.facility}
              </>
            )}
            {user?.specialization && (
              <>
                {" • "}
                <strong className="text-[#191817]">Specialty:</strong> {user.specialization}
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user?.registrationNumber && (
            <span className="px-2 py-0.5 rounded-none bg-[#F0F7F6] text-[#0F766E] font-mono text-[10px] font-semibold border border-[#D0E5E1]">
              REG: {user.registrationNumber}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-800 font-mono text-[10px] font-semibold border border-emerald-300">
            HPR Certified
          </span>
        </div>
      </div>

      {/* 3. Practice Metric Cards (Matching DashboardView Quick Metrics Strip) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* Metric 1 */}
        <div className="p-3.5 bg-white border border-[#D0E5E1] rounded-none shadow-[0_4px_20px_rgba(26,25,24,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
              Patients Consulted
            </span>
            <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center rounded-none">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] block">
              {treatedPatients.length}
            </span>
          </div>
          <div className="text-[10px] text-[#7A746B] border-t border-[#D0E5E1]/60 pt-1.5">
            Under your direct care
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 bg-white border border-[#D0E5E1] rounded-none shadow-[0_4px_20px_rgba(26,25,24,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
              Clinical Plans
            </span>
            <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center rounded-none">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] block">
              {treatedPatients.reduce((acc, p) => acc + p.totalConsultations, 0)}
            </span>
          </div>
          <div className="text-[10px] text-[#7A746B] border-t border-[#D0E5E1]/60 pt-1.5">
            Diagnoses & suggestions given
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 bg-white border border-[#D0E5E1] rounded-none shadow-[0_4px_20px_rgba(26,25,24,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
              Prescriptions
            </span>
            <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center rounded-none">
              <Pill className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] block">
              {treatedPatients.reduce((acc, p) => acc + p.totalPrescriptions, 0)}
            </span>
          </div>
          <div className="text-[10px] text-[#7A746B] border-t border-[#D0E5E1]/60 pt-1.5">
            Medication orders issued
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 bg-white border border-[#D0E5E1] rounded-none shadow-[0_4px_20px_rgba(26,25,24,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-[#6E685F] uppercase font-bold">
              Lab Referrals
            </span>
            <div className="w-6 h-6 bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center rounded-none">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-editorial-serif font-bold text-[#191817] block">
              {treatedPatients.reduce((acc, p) => acc + p.totalLabOrders, 0)}
            </span>
          </div>
          <div className="text-[10px] text-[#7A746B] border-t border-[#D0E5E1]/60 pt-1.5">
            Diagnostic tests directed
          </div>
        </div>
      </div>

      {/* 4. Patient ID & ABHA Instant Access Bar (Matching theme: rounded-none, border-[#D0E5E1], font-editorial-serif) */}
      <div className="p-5 bg-white border border-[#D0E5E1] rounded-none shadow-[0_4px_20px_rgba(26,25,24,0.03)] space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#0F766E]" />
            <h3 className="text-sm md:text-base font-editorial-serif font-bold text-[#191817] tracking-tight">
              Access Patient Records by Patient ID / ABHA Address
            </h3>
          </div>
          <p className="text-xs text-[#5C574F] mt-1 leading-relaxed">
            Enter any unique Patient ID (e.g. <span className="font-mono text-[#0F766E] font-bold">SS-PAT-000063</span>) or ABHA Address to access their longitudinal history, all diagnostic reports, and previous doctor treatments.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookupPatient();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A746B]" />
            <input
              type="text"
              value={patientLookupId}
              onChange={(e) => setPatientLookupId(e.target.value)}
              placeholder="Enter Patient ID (e.g. SS-PAT-000063) or ABHA Address..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-none border border-[#B6D6D0] bg-[#F0F7F6]/60 focus:bg-white focus:outline-none focus:border-[#1A1918] transition-all"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={lookupLoading || !patientLookupId.trim()}
            leftIcon={lookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          >
            {lookupLoading ? "Looking up..." : "Access Records"}
          </Button>
        </form>

        {lookupError && (
          <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{lookupError}</span>
          </div>
        )}
      </div>

      {/* 5. Section: Patients Given Treatment & Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#D0E5E1] pb-2.5">
          <div>
            <h2 className="text-base md:text-lg font-editorial-serif font-bold text-[#191817] flex items-center gap-2 tracking-tight">
              <Stethoscope className="w-4 h-4 text-[#0F766E]" />
              Patients Given Treatment & Suggestions
            </h2>
            <p className="text-xs text-[#5C574F] mt-0.5">
              Patients you have consulted, evaluated, or provided clinical treatment plans for.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#5C574F] bg-[#F0F7F6] px-2.5 py-1 rounded-none border border-[#D0E5E1]">
            Total: <strong className="text-[#0F766E]">{treatedPatients.length}</strong>
          </span>
        </div>

        {treatedLoading ? (
          <div className="p-8 text-center bg-white rounded-none border border-[#D0E5E1]">
            <RefreshCw className="w-5 h-5 animate-spin text-[#0F766E] mx-auto mb-2" />
            <p className="text-xs text-[#5C574F]">Loading your treated patient records...</p>
          </div>
        ) : treatedError ? (
          <div className="p-4 rounded-none bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{treatedError}</span>
          </div>
        ) : treatedPatients.length === 0 ? (
          <EmptyState
            title="No Patient Consultations Recorded Yet"
            description="You have not recorded any patient treatments yet. Look up a patient by Patient ID above to view their longitudinal records, or click below to record a new consultation."
            icon={<Stethoscope className="w-5 h-5 text-[#0F766E]" />}
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => handleOpenConsultation("")}
              >
                Record Consultation
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {treatedPatients.map((item) => {
              const isSelected =
                activePatient?.id === item.patient.id ||
                activePatient?.patientId === item.patient.patientId;

              return (
                <div
                  key={item.patient.id}
                  className={`rounded-none border transition-all p-4 flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-white border-[#0F766E] shadow-[0_4px_16px_rgba(15,118,110,0.08)]"
                      : "bg-white hover:border-[#1A1918] border-[#D0E5E1] shadow-2xs"
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Patient Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-editorial-serif font-bold text-[#191817] flex items-center gap-2">
                          {item.patient.name}
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded-none text-[9px] font-mono font-bold uppercase bg-[#0F766E] text-white">
                              Active
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-[#0F766E] font-bold">
                            {item.patient.patientId}
                          </span>
                          {item.patient.gender && (
                            <span className="text-xs text-[#5C574F]">
                              • {item.patient.gender}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#5C574F] bg-[#F0F7F6] px-2 py-0.5 rounded-none border border-[#D0E5E1]">
                        {item.lastConsultationDate}
                      </span>
                    </div>

                    {/* Latest Diagnosis */}
                    <div className="bg-[#F0F7F6] rounded-none p-2.5 border border-[#D0E5E1] space-y-0.5">
                      <p className="text-[9px] font-mono font-bold uppercase text-[#6E685F] tracking-wider">
                        Diagnosis
                      </p>
                      <p className="text-xs font-bold text-[#191817]">
                        {cleanDisplay(item.latestDiagnosis)}
                      </p>
                    </div>

                    {/* Treatment & Suggestion Given */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold uppercase text-[#0F766E] tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#0F766E]" />
                        Treatment & Suggestions:
                      </p>
                      <p className="text-xs text-[#5C574F] line-clamp-3 leading-relaxed bg-white p-2.5 rounded-none border border-[#D0E5E1]">
                        {cleanDisplay(item.latestTreatmentPlan)}
                      </p>
                    </div>

                    {/* Prescribed Medicines (if any) */}
                    {item.prescribedMedicines && item.prescribedMedicines.length > 0 && (
                      <div className="pt-0.5">
                        <p className="text-[9px] font-mono uppercase font-bold text-[#6E685F] mb-1">
                          Prescribed:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.prescribedMedicines.map((m, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono bg-[#E4F1EE] text-[#0F766E] px-2 py-0.5 rounded-none font-semibold border border-[#D0E5E1] flex items-center gap-1"
                            >
                              <Pill className="w-2.5 h-2.5" />
                              {m.name} ({m.dosage})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#D0E5E1] flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isSelected ? "primary" : "secondary"}
                      onClick={() => setActivePatient(item.patient)}
                      className="flex-1"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      {isSelected ? "Viewing File" : "Access Records"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenConsultation(item.patient.patientId)}
                      title="Add follow-up treatment"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Follow-up
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Section: Comprehensive Patient Medical Dossier & Multi-Doctor History */}
      {/* Shown ONLY when a patient is actively looked up or selected */}
      {activePatient && (
        <div className="space-y-4 pt-4 border-t border-[#D0E5E1]">
          {/* Active Patient Dossier Banner */}
          <div className="bg-white rounded-none border border-[#D0E5E1] p-4 sm:p-5 shadow-[0_4px_20px_rgba(26,25,24,0.03)] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-[#F0F7F6] text-[#0F766E] flex items-center justify-center font-bold text-sm font-editorial-serif shrink-0 border border-[#D0E5E1]">
                  {activePatient.name[0]}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-editorial-serif font-bold text-[#191817]">
                      {activePatient.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#0F766E] bg-[#E4F1EE] px-2 py-0.5 rounded-none border border-[#D0E5E1]">
                      {activePatient.patientId}
                    </span>
                    <Badge variant="success" size="sm">
                      ABDM Linked
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C574F] mt-0.5">
                    {activePatient.abhaAddress && <span className="font-mono">ABHA: {activePatient.abhaAddress}</span>}
                    {activePatient.gender && <span>• Gender: {activePatient.gender}</span>}
                    {activePatient.dateOfBirth && <span>• DOB: {activePatient.dateOfBirth}</span>}
                    {activePatient.phone && <span>• Ph: {activePatient.phone}</span>}
                  </div>
                </div>
              </div>

              {/* Dossier Quick Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenConsultation(activePatient.patientId)}
                >
                  Add Treatment / Suggestion
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadActivePatientRecords(activePatient.patientId || activePatient.id)}
                  disabled={recordsLoading}
                  title="Refresh records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${recordsLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivePatient(null)}
                  title="Close dossier"
                  leftIcon={<X className="w-3.5 h-3.5" />}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Dossier Tabs (Matching LaboratoryDashboardView Tab Styling) */}
            <div className="flex items-center gap-1 border-b border-[#D0E5E1] overflow-x-auto pt-1">
              <button
                onClick={() => setActiveDossierTab("other_doctors")}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors rounded-none ${
                  activeDossierTab === "other_doctors"
                    ? "border-[#1A1918] text-[#1A1918] font-bold"
                    : "border-transparent text-[#69655E] hover:text-[#1A1918]"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#0F766E]" />
                Previous Treatments by Other Doctors
                <span className="ml-1 px-1.5 py-0.2 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-[10px] font-mono">
                  {otherDoctorsTreatments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveDossierTab("reports")}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors rounded-none ${
                  activeDossierTab === "reports"
                    ? "border-[#1A1918] text-[#1A1918] font-bold"
                    : "border-transparent text-[#69655E] hover:text-[#1A1918]"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-[#0F766E]" />
                Diagnostic Reports & Lab Tests
                <span className="ml-1 px-1.5 py-0.2 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-[10px] font-mono">
                  {diagnosticReports.length}
                </span>
              </button>

              <button
                onClick={() => setActiveDossierTab("prescriptions")}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors rounded-none ${
                  activeDossierTab === "prescriptions"
                    ? "border-[#1A1918] text-[#1A1918] font-bold"
                    : "border-transparent text-[#69655E] hover:text-[#1A1918]"
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-[#0F766E]" />
                Prescriptions & Medications
                <span className="ml-1 px-1.5 py-0.2 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-[10px] font-mono">
                  {medicationRecords.length}
                </span>
              </button>

              <button
                onClick={() => setActiveDossierTab("all_records")}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors rounded-none ${
                  activeDossierTab === "all_records"
                    ? "border-[#1A1918] text-[#1A1918] font-bold"
                    : "border-transparent text-[#69655E] hover:text-[#1A1918]"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#0F766E]" />
                Full Timeline
                <span className="ml-1 px-1.5 py-0.2 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-[10px] font-mono">
                  {patientRecords.length}
                </span>
              </button>
            </div>
          </div>

          {/* Dossier Tab Content */}
          {recordsLoading ? (
            <div className="p-10 text-center bg-white rounded-none border border-[#D0E5E1]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0F766E] mx-auto mb-2" />
              <p className="text-sm font-editorial-serif font-bold text-[#191817]">Retrieving Patient Records...</p>
              <p className="text-xs text-[#5C574F] mt-0.5">Fetching cross-hospital clinical records via ABDM network.</p>
            </div>
          ) : recordsError ? (
            <div className="p-4 rounded-none bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{recordsError}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* TAB 1: Previous Treatments by Other Doctors */}
              {activeDossierTab === "other_doctors" && (
                <div className="space-y-3">
                  {otherDoctorsTreatments.length === 0 ? (
                    <EmptyState
                      title="No Previous Treatments by Other Doctors"
                      description="No cross-network doctor encounters found for this patient."
                      icon={<Stethoscope className="w-5 h-5 text-[#0F766E]" />}
                    />
                  ) : (
                    otherDoctorsTreatments.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-none border border-[#D0E5E1] p-4 hover:border-[#0F766E] shadow-2xs space-y-2.5 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-8 h-8 rounded-none bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center shrink-0 border border-[#D0E5E1]">
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-sm font-editorial-serif font-bold text-[#191817]">
                                {cleanDisplay(item.title)}
                              </h5>
                              <p className="text-xs text-[#0F766E] font-medium flex items-center gap-1.5">
                                <span>{cleanDisplay(item.doctorName)}</span>
                                {item.providerFacility && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#5C574F] flex items-center gap-1">
                                      <Building2 className="w-3 h-3 text-[#0F766E]" />
                                      {cleanDisplay(item.providerFacility)}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-[11px] font-mono text-[#5C574F] bg-[#F0F7F6] px-2 py-0.5 rounded-none border border-[#D0E5E1] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#0F766E]" />
                              {item.date}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedRecordForDetail(item)}
                            >
                              View
                            </Button>
                          </div>
                        </div>

                        {/* Summary & Suggestions Given by This Other Doctor */}
                        <div className="bg-[#F0F7F6] rounded-none p-3 border border-[#D0E5E1] space-y-1">
                          <p className="text-[9px] font-mono font-bold uppercase text-[#6E685F] tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#0F766E]" />
                            Treatment & Suggestions Given:
                          </p>
                          <p className="text-xs text-[#191817] leading-relaxed">
                            {cleanDisplay(item.summary)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: All Diagnostic Reports & Lab Tests */}
              {activeDossierTab === "reports" && (
                <div className="space-y-3">
                  {diagnosticReports.length === 0 ? (
                    <EmptyState
                      title="No Diagnostic Reports Found"
                      description="No lab or pathology reports recorded for this patient."
                      icon={<FlaskConical className="w-5 h-5 text-[#0F766E]" />}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {diagnosticReports.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-none border border-[#D0E5E1] p-4 hover:border-[#0F766E] shadow-2xs space-y-2.5 flex flex-col justify-between transition-all"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-none bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5 border border-[#D0E5E1]">
                                  <FlaskConical className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <h5 className="text-xs sm:text-sm font-editorial-serif font-bold text-[#191817]">
                                    {cleanDisplay(item.title)}
                                  </h5>
                                  <p className="text-[11px] text-[#0F766E] font-medium">
                                    {cleanDisplay(item.providerFacility || item.sourceInstitution || "Diagnostic Facility")}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-none bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300">
                                {item.status || "final"}
                              </span>
                            </div>

                            <div className="bg-[#F0F7F6] rounded-none p-2.5 border border-[#D0E5E1] space-y-0.5">
                              <p className="text-[9px] font-mono font-bold uppercase text-[#6E685F]">
                                Findings / Conclusion
                              </p>
                              <p className="text-xs text-[#191817] leading-relaxed">
                                {cleanDisplay(item.summary)}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#D0E5E1] flex items-center justify-between text-xs">
                            <span className="text-[#5C574F] font-mono text-[11px] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#0F766E]" />
                              {item.date}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedRecordForDetail(item)}
                              rightIcon={<ChevronRight className="w-3 h-3" />}
                            >
                              View Specimen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Prescriptions & Medications */}
              {activeDossierTab === "prescriptions" && (
                <div className="space-y-3">
                  {medicationRecords.length === 0 ? (
                    <EmptyState
                      title="No Prescriptions on Record"
                      description="No medication orders or dispenses recorded for this patient."
                      icon={<Pill className="w-5 h-5 text-[#0F766E]" />}
                    />
                  ) : (
                    medicationRecords.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-none border border-[#D0E5E1] p-4 hover:border-[#0F766E] shadow-2xs space-y-2 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-2.5">
                            <div className="w-7 h-7 rounded-none bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center shrink-0 border border-[#D0E5E1]">
                              <Pill className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h5 className="text-xs sm:text-sm font-editorial-serif font-bold text-[#191817]">
                                {cleanDisplay(item.title)}
                              </h5>
                              <p className="text-[11px] text-[#5C574F]">
                                {cleanDisplay(item.doctorName || "Prescribing Clinician")} • {cleanDisplay(item.providerFacility || "Facility")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#5C574F] font-mono bg-[#F0F7F6] px-2 py-0.5 rounded-none border border-[#D0E5E1]">
                              {item.date}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedRecordForDetail(item)}
                            >
                              View
                            </Button>
                          </div>
                        </div>

                        <div className="bg-[#F0F7F6] rounded-none p-2.5 border border-[#D0E5E1]">
                          <p className="text-xs text-[#191817] leading-relaxed">
                            {cleanDisplay(item.summary)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: Full Longitudinal Timeline */}
              {activeDossierTab === "all_records" && (
                <div className="space-y-2.5">
                  {patientRecords.length === 0 ? (
                    <EmptyState
                      title="No Timeline Records Found"
                      description="No records in this patient's vault."
                      icon={<FileText className="w-5 h-5 text-[#0F766E]" />}
                    />
                  ) : (
                    patientRecords.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-none border border-[#D0E5E1] p-3.5 hover:border-[#0F766E] shadow-2xs space-y-2 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-2.5">
                            <span className="w-7 h-7 rounded-none bg-[#E4F1EE] text-[#0F766E] flex items-center justify-center shrink-0 border border-[#D0E5E1]">
                              {item.resourceType === "DiagnosticReport" ? (
                                <FlaskConical className="w-3.5 h-3.5" />
                              ) : item.resourceType === "Encounter" ? (
                                <Stethoscope className="w-3.5 h-3.5" />
                              ) : item.resourceType === "MedicationRequest" ? (
                                <Pill className="w-3.5 h-3.5" />
                              ) : item.resourceType === "MedicationDispense" ? (
                                <PackageCheck className="w-3.5 h-3.5" />
                              ) : item.resourceType === "Immunization" ? (
                                <Syringe className="w-3.5 h-3.5" />
                              ) : (
                                <Activity className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-editorial-serif font-bold text-[#191817]">
                                {cleanDisplay(item.title)}
                              </h5>
                              <p className="text-[11px] text-[#0F766E]">
                                {cleanDisplay(item.doctorName)} • {cleanDisplay(item.providerFacility || item.sourceInstitution)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-[9px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded-none bg-[#F0F7F6] text-[#5C574F] border border-[#D0E5E1]">
                              {item.resourceType}
                            </span>
                            <span className="text-[11px] font-mono text-[#5C574F]">
                              {item.date}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedRecordForDetail(item)}
                            >
                              View
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-[#5C574F] leading-relaxed bg-[#F0F7F6] p-2.5 rounded-none border border-[#D0E5E1]">
                          {cleanDisplay(item.summary)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. Modals */}
      <DoctorConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onSuccess={handleConsultationSuccess}
        defaultPatientId={consultationTargetPid}
      />

      <FhirResourceModal
        record={selectedRecordForDetail}
        onClose={() => setSelectedRecordForDetail(null)}
      />
    </div>
  );
};
