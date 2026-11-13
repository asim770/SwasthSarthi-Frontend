import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Stethoscope,
  Search,
  FileText,
  FlaskConical,
  Pill,
  Activity,
  Calendar,
  Building2,
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  UserCheck,
  Eye,
  Syringe,
  X,
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
      {/* 1. Clean, Professional Clinician Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-editorial-serif text-[#191817]">
              Doctor Clinical Workspace
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
              <ShieldCheck className="w-3 h-3" />
              ABDM Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 flex flex-wrap items-center gap-1.5">
            <span>Welcome, <strong className="text-[#191817]">Dr. {user?.name?.replace(/^Dr\.\s*/i, "") || "Clinician"}</strong></span>
            {user?.facility && (
              <span className="text-[#0F766E] font-medium">· {user.facility}</span>
            )}
            {user?.specialization && (
              <span className="text-stone-500">({user.specialization})</span>
            )}
            {user?.registrationNumber && (
              <span className="text-stone-400 font-mono text-2xs">· Reg: {user.registrationNumber}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => handleOpenConsultation(activePatient?.patientId || "")}
            className="bg-[#0F766E] hover:bg-[#0D655E] text-white shadow-xs flex items-center gap-2 px-4 py-2 text-xs sm:text-sm rounded-xl font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Treatment & Suggestion</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              loadTreatedPatients();
              if (activePatient) {
                loadActivePatientRecords(activePatient.patientId || activePatient.id);
              }
            }}
            className="border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-xl"
            title="Refresh workspace"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* 2. Doctor Practice Metrics (True doctor metrics - 0 if new doctor) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <p className="text-2xs font-semibold text-stone-500 uppercase tracking-wider">Patients Consulted</p>
          <p className="text-2xl font-bold font-editorial-serif text-[#191817] mt-1">
            {treatedPatients.length}
          </p>
          <p className="text-2xs text-[#0F766E] mt-0.5 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            Under your care
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <p className="text-2xs font-semibold text-stone-500 uppercase tracking-wider">Clinical Plans Recorded</p>
          <p className="text-2xl font-bold font-editorial-serif text-[#191817] mt-1">
            {treatedPatients.reduce((acc, p) => acc + p.totalConsultations, 0)}
          </p>
          <p className="text-2xs text-stone-500 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#0F766E]" />
            Diagnoses & suggestions given
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <p className="text-2xs font-semibold text-stone-500 uppercase tracking-wider">Prescriptions Issued</p>
          <p className="text-2xl font-bold font-editorial-serif text-[#191817] mt-1">
            {treatedPatients.reduce((acc, p) => acc + p.totalPrescriptions, 0)}
          </p>
          <p className="text-2xs text-stone-500 mt-0.5 flex items-center gap-1">
            <Pill className="w-3 h-3 text-[#0F766E]" />
            Medication orders
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <p className="text-2xs font-semibold text-stone-500 uppercase tracking-wider">Diagnostic Referrals</p>
          <p className="text-2xl font-bold font-editorial-serif text-[#191817] mt-1">
            {treatedPatients.reduce((acc, p) => acc + p.totalLabOrders, 0)}
          </p>
          <p className="text-2xs text-stone-500 mt-0.5 flex items-center gap-1">
            <FlaskConical className="w-3 h-3 text-[#0F766E]" />
            Lab & test referrals
          </p>
        </div>
      </div>

      {/* 3. Patient ID & ABHA Instant Access Bar (Clean, full-width, no dummy pills) */}
      <Card className="border border-stone-200 shadow-2xs bg-white">
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#191817] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#0F766E]" />
              Access Patient Records by Patient ID / ABHA Address
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter any unique Patient ID (e.g., <code className="font-mono bg-stone-100 text-[#0F766E] px-1.5 py-0.5 rounded text-xs font-semibold">PID-10000001</code> or <code className="font-mono bg-stone-100 text-[#0F766E] px-1.5 py-0.5 rounded text-xs font-semibold">SS-PAT-000063</code>) to retrieve their full cross-hospital history, all lab reports, and previous doctor treatments.
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
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={patientLookupId}
                onChange={(e) => setPatientLookupId(e.target.value)}
                placeholder="Enter Patient ID (e.g. PID-10000001) or ABHA Address..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={lookupLoading || !patientLookupId.trim()}
              className="bg-[#0F766E] hover:bg-[#0D655E] text-white rounded-xl px-5 py-2.5 text-sm shrink-0 flex items-center justify-center gap-2 font-medium"
            >
              {lookupLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Access Records</span>
                </>
              )}
            </Button>
          </form>

          {lookupError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{lookupError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Section: Patients Given Treatment & Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-editorial-serif text-[#191817] flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#0F766E]" />
              Patients Given Treatment & Suggestions
            </h2>
            <p className="text-xs text-stone-500">
              Patients you have consulted, evaluated, or provided clinical treatment plans for.
            </p>
          </div>
          <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
            Total: <strong className="text-[#0F766E]">{treatedPatients.length}</strong>
          </span>
        </div>

        {treatedLoading ? (
          <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
            <RefreshCw className="w-5 h-5 animate-spin text-[#0F766E] mx-auto mb-2" />
            <p className="text-xs text-stone-500">Loading your treated patient records...</p>
          </div>
        ) : treatedError ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{treatedError}</span>
          </div>
        ) : treatedPatients.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center mx-auto">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-editorial-serif text-[#191817]">
                No Patient Consultations Recorded Yet
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                You have not recorded any patient treatments yet. Look up a patient by Patient ID above to view their longitudinal records, or click below to record a new consultation.
              </p>
            </div>
            <Button
              onClick={() => handleOpenConsultation("")}
              className="bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs px-4 py-2 rounded-xl"
            >
              + Record Consultation
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {treatedPatients.map((item) => {
              const isSelected =
                activePatient?.id === item.patient.id ||
                activePatient?.patientId === item.patient.patientId;

              return (
                <div
                  key={item.patient.id}
                  className={`rounded-xl border transition-all p-5 flex flex-col justify-between space-y-3.5 ${
                    isSelected
                      ? "bg-white border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-sm"
                      : "bg-white hover:bg-stone-50/50 border-stone-200 shadow-2xs"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Patient Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[#191817] flex items-center gap-2">
                          {item.patient.name}
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-3xs font-bold uppercase bg-[#0F766E] text-white">
                              Active
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-[#0F766E] font-medium bg-[#0F766E]/10 px-1.5 py-0.5 rounded">
                            {item.patient.patientId}
                          </span>
                          {item.patient.gender && (
                            <span className="text-xs text-stone-500">
                              {item.patient.gender}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="teal" className="text-2xs bg-stone-100 border-stone-200 text-stone-700">
                        {item.lastConsultationDate}
                      </Badge>
                    </div>

                    {/* Latest Diagnosis */}
                    <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200 space-y-0.5">
                      <p className="text-3xs font-semibold uppercase text-stone-500 tracking-wider">
                        Diagnosis
                      </p>
                      <p className="text-xs font-bold text-[#191817]">
                        {cleanDisplay(item.latestDiagnosis)}
                      </p>
                    </div>

                    {/* Treatment & Suggestion Given */}
                    <div className="space-y-1">
                      <p className="text-2xs font-semibold uppercase text-[#0F766E] tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#0F766E]" />
                        Treatment & Suggestions:
                      </p>
                      <p className="text-xs text-stone-700 line-clamp-3 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200">
                        {cleanDisplay(item.latestTreatmentPlan)}
                      </p>
                    </div>

                    {/* Prescribed Medicines (if any) */}
                    {item.prescribedMedicines && item.prescribedMedicines.length > 0 && (
                      <div className="pt-0.5">
                        <p className="text-3xs uppercase font-medium text-stone-500 mb-1">
                          Prescribed:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.prescribedMedicines.map((m, idx) => (
                            <span
                              key={idx}
                              className="text-2xs bg-[#0F766E]/10 text-[#0F766E] px-2 py-0.5 rounded font-medium flex items-center gap-1"
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
                  <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setActivePatient(item.patient)}
                      className={`flex-1 text-xs rounded-lg flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-[#0F766E] text-white hover:bg-[#0D655E]"
                          : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isSelected ? "Viewing File" : "Access Records"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenConsultation(item.patient.patientId)}
                      className="text-xs rounded-lg border-stone-300 text-[#0F766E] hover:bg-[#0F766E]/10 px-2.5"
                      title="Add follow-up treatment"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Follow-up</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Section: Comprehensive Patient Medical Dossier & Multi-Doctor History */}
      {/* Shown ONLY when a patient is actively looked up or selected */}
      {activePatient && (
        <div className="space-y-4 pt-2 border-t border-stone-200">
          {/* Active Patient Dossier Banner */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold text-base font-editorial-serif shrink-0 border border-[#0F766E]/20">
                  {activePatient.name[0]}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold font-editorial-serif text-[#191817]">
                      {activePatient.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#0F766E] bg-[#0F766E]/10 px-2 py-0.5 rounded border border-[#0F766E]/20">
                      {activePatient.patientId}
                    </span>
                    <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      ABDM Verified
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-0.5">
                    {activePatient.abhaAddress && <span className="font-mono">ABHA: {activePatient.abhaAddress}</span>}
                    {activePatient.gender && <span>· Gender: {activePatient.gender}</span>}
                    {activePatient.dateOfBirth && <span>· DOB: {activePatient.dateOfBirth}</span>}
                    {activePatient.phone && <span>· Ph: {activePatient.phone}</span>}
                  </div>
                </div>
              </div>

              {/* Dossier Quick Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => handleOpenConsultation(activePatient.patientId)}
                  className="bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Treatment / Suggestion</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadActivePatientRecords(activePatient.patientId || activePatient.id)}
                  disabled={recordsLoading}
                  className="border-stone-300 text-stone-600 hover:bg-stone-100 text-xs px-3 py-2 rounded-xl"
                  title="Refresh records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${recordsLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActivePatient(null)}
                  className="border-stone-300 text-stone-500 hover:bg-stone-100 text-xs px-3 py-2 rounded-xl flex items-center gap-1"
                  title="Close dossier"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </Button>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setActiveDossierTab("other_doctors")}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeDossierTab === "other_doctors"
                    ? "bg-[#0F766E] text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Previous Treatments by Other Doctors</span>
                <span className={`text-2xs px-1.5 py-0.2 rounded-full ${
                  activeDossierTab === "other_doctors" ? "bg-white/20 text-white" : "bg-[#0F766E]/10 text-[#0F766E]"
                }`}>
                  {otherDoctorsTreatments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveDossierTab("reports")}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeDossierTab === "reports"
                    ? "bg-[#0F766E] text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>All Diagnostic Reports & Lab Tests</span>
                <span className={`text-2xs px-1.5 py-0.2 rounded-full ${
                  activeDossierTab === "reports" ? "bg-white/20 text-white" : "bg-[#0F766E]/10 text-[#0F766E]"
                }`}>
                  {diagnosticReports.length}
                </span>
              </button>

              <button
                onClick={() => setActiveDossierTab("prescriptions")}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeDossierTab === "prescriptions"
                    ? "bg-[#0F766E] text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Prescriptions & Medications</span>
                <span className={`text-2xs px-1.5 py-0.2 rounded-full ${
                  activeDossierTab === "prescriptions" ? "bg-white/20 text-white" : "bg-[#0F766E]/10 text-[#0F766E]"
                }`}>
                  {medicationRecords.length}
                </span>
              </button>

              <button
                onClick={() => setActiveDossierTab("all_records")}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeDossierTab === "all_records"
                    ? "bg-[#0F766E] text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Timeline</span>
                <span className={`text-2xs px-1.5 py-0.2 rounded-full ${
                  activeDossierTab === "all_records" ? "bg-white/20 text-white" : "bg-[#0F766E]/10 text-[#0F766E]"
                }`}>
                  {patientRecords.length}
                </span>
              </button>
            </div>
          </div>

          {/* Dossier Tab Content */}
          {recordsLoading ? (
            <div className="p-10 text-center bg-white rounded-xl border border-stone-200">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0F766E] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#191817]">Retrieving Patient Records...</p>
              <p className="text-xs text-stone-500 mt-0.5">Fetching cross-hospital clinical records via ABDM network.</p>
            </div>
          ) : recordsError ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{recordsError}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* TAB 1: Previous Treatments by Other Doctors */}
              {activeDossierTab === "other_doctors" && (
                <div className="space-y-3">
                  {otherDoctorsTreatments.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
                      <Stethoscope className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                      <p className="text-sm font-medium text-[#191817]">No Previous Treatments by Other Doctors</p>
                      <p className="text-xs text-stone-500 mt-0.5">No cross-network doctor encounters found for this patient.</p>
                    </div>
                  ) : (
                    otherDoctorsTreatments.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 hover:border-stone-300 shadow-2xs space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-sm sm:text-base font-bold text-[#191817]">
                                {cleanDisplay(item.title)}
                              </h5>
                              <p className="text-xs text-[#0F766E] font-medium flex items-center gap-1.5">
                                <span>{cleanDisplay(item.doctorName)}</span>
                                {item.providerFacility && (
                                  <>
                                    <span>·</span>
                                    <span className="text-stone-500 flex items-center gap-1">
                                      <Building2 className="w-3 h-3 text-[#0F766E]" />
                                      {cleanDisplay(item.providerFacility)}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-xs text-stone-500 font-mono bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#0F766E]" />
                              {item.date}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRecordForDetail(item)}
                              className="text-xs rounded-lg border-stone-300 text-[#0F766E] hover:bg-stone-50"
                            >
                              View
                            </Button>
                          </div>
                        </div>

                        {/* Summary & Suggestions Given by This Other Doctor */}
                        <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 space-y-1">
                          <p className="text-3xs font-semibold uppercase text-stone-500 tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#0F766E]" />
                            Treatment & Suggestions Given:
                          </p>
                          <p className="text-xs text-stone-800 leading-relaxed">
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
                    <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
                      <FlaskConical className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                      <p className="text-sm font-medium text-[#191817]">No Diagnostic Reports Found</p>
                      <p className="text-xs text-stone-500 mt-0.5">No lab or pathology reports recorded for this patient.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {diagnosticReports.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 shadow-2xs space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                                  <FlaskConical className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <h5 className="text-xs sm:text-sm font-bold text-[#191817]">
                                    {cleanDisplay(item.title)}
                                  </h5>
                                  <p className="text-2xs text-[#0F766E] font-medium">
                                    {cleanDisplay(item.providerFacility || item.sourceInstitution || "Diagnostic Facility")}
                                  </p>
                                </div>
                              </div>
                              <span className="text-3xs uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                {item.status || "final"}
                              </span>
                            </div>

                            <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200 space-y-0.5">
                              <p className="text-3xs font-semibold uppercase text-stone-500">
                                Findings / Conclusion
                              </p>
                              <p className="text-xs text-stone-800 leading-relaxed">
                                {cleanDisplay(item.summary)}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                            <span className="text-stone-500 font-mono text-2xs flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#0F766E]" />
                              {item.date}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRecordForDetail(item)}
                              className="text-2xs rounded-lg border-stone-300 text-[#0F766E] hover:bg-stone-50 flex items-center gap-1 py-1 px-2"
                            >
                              <span>View Specimen</span>
                              <ChevronRight className="w-3 h-3" />
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
                    <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
                      <Pill className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                      <p className="text-sm font-medium text-[#191817]">No Prescriptions on Record</p>
                      <p className="text-xs text-stone-500 mt-0.5">No medication orders or dispenses recorded for this patient.</p>
                    </div>
                  ) : (
                    medicationRecords.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 shadow-2xs space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                              <Pill className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-[#191817]">
                                {cleanDisplay(item.title)}
                              </h5>
                              <p className="text-2xs text-stone-500">
                                {cleanDisplay(item.doctorName || "Prescribing Clinician")} · {cleanDisplay(item.providerFacility || "Facility")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xs text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                              {item.date}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRecordForDetail(item)}
                              className="text-2xs rounded-lg border-stone-300 text-[#0F766E] hover:bg-stone-50 py-1 px-2"
                            >
                              View
                            </Button>
                          </div>
                        </div>

                        <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200">
                          <p className="text-xs text-stone-800 leading-relaxed">
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
                    <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
                      <FileText className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                      <p className="text-sm font-medium text-[#191817]">No Timeline Records Found</p>
                      <p className="text-xs text-stone-500 mt-0.5">No records in this patient's vault.</p>
                    </div>
                  ) : (
                    patientRecords.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-stone-200 p-3.5 hover:border-stone-300 shadow-2xs space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                              {item.resourceType === "DiagnosticReport" ? (
                                <FlaskConical className="w-3.5 h-3.5" />
                              ) : item.resourceType === "Encounter" ? (
                                <Stethoscope className="w-3.5 h-3.5" />
                              ) : item.resourceType === "MedicationRequest" ? (
                                <Pill className="w-3.5 h-3.5" />
                              ) : item.resourceType === "Immunization" ? (
                                <Syringe className="w-3.5 h-3.5" />
                              ) : (
                                <Activity className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-[#191817]">
                                {cleanDisplay(item.title)}
                              </h5>
                              <p className="text-2xs text-[#0F766E]">
                                {cleanDisplay(item.doctorName)} · {cleanDisplay(item.providerFacility || item.sourceInstitution)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-3xs uppercase font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                              {item.resourceType}
                            </span>
                            <span className="text-2xs font-mono text-stone-500">
                              {item.date}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRecordForDetail(item)}
                              className="text-2xs rounded-lg border-stone-300 text-[#0F766E] hover:bg-stone-50 py-1 px-2"
                            >
                              View
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-2 rounded border border-stone-200">
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

      {/* 6. Modals */}
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
