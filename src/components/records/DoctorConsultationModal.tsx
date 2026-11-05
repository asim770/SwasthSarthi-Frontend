import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  Stethoscope,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Pill,
  FlaskConical,
} from "lucide-react";
import { createDoctorConsultation } from "../../api/client";
import type { DoctorConsultationInput } from "../../types/api";

interface DoctorConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPatientId?: string;
}

interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

export const DoctorConsultationModal: React.FC<DoctorConsultationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPatientId = "",
}) => {
  const [patientId, setPatientId] = useState<string>(defaultPatientId);

  useEffect(() => {
    if (defaultPatientId) {
      setPatientId(defaultPatientId);
    }
  }, [defaultPatientId, isOpen]);

  const [consultationDate, setConsultationDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [symptoms, setSymptoms] = useState<string>("Exertional dyspnea, occasional chest tightness, and lightheadedness.");
  const [clinicalFindings, setClinicalFindings] = useState<string>("BP 138/88 mmHg, pulse 76 bpm regular rhythm, S1 S2 normal, no peripheral edema.");
  const [diagnosis, setDiagnosis] = useState<string>("Stage 1 Essential Hypertension");
  const [treatmentPlan, setTreatmentPlan] = useState<string>("Lifestyle intervention with low-sodium DASH diet, aerobic exercise, and initiate first-line ARB therapy.");
  
  // Prescribed Medicines list
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    {
      name: "Telmisartan",
      dosage: "40mg",
      frequency: "Once daily morning",
      durationDays: 30,
      instructions: "Take 1 tablet every morning with water after breakfast.",
    },
  ]);

  // Recommended Tests list
  const [tests, setTests] = useState<string[]>([
    "Lipid Profile (Fasting)",
    "Serum Creatinine & Electrolytes",
  ]);
  const [newTestInput, setNewTestInput] = useState<string>("");

  const [followUpDate, setFollowUpDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().split("T")[0];
  });
  const [clinicalNotes, setClinicalNotes] = useState<string>("Advised home blood pressure monitoring twice weekly. Return immediately if chest pain or severe headache occurs.");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (defaultPatientId) {
      setPatientId(defaultPatientId);
    }
  }, [defaultPatientId]);

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: "",
        dosage: "",
        frequency: "Once daily",
        durationDays: 14,
        instructions: "",
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (
    index: number,
    field: keyof MedicineItem,
    val: string | number
  ) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: val } : med))
    );
  };

  const handleAddTest = () => {
    if (!newTestInput.trim()) return;
    setTests((prev) => [...prev, newTestInput.trim()]);
    setNewTestInput("");
  };

  const handleRemoveTest = (index: number) => {
    setTests((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientId.trim()) {
      setError("Patient ID is required.");
      return;
    }
    if (!diagnosis.trim()) {
      setError("Clinical diagnosis is required.");
      return;
    }
    if (!treatmentPlan.trim()) {
      setError("Treatment plan is required.");
      return;
    }

    setLoading(true);

    try {
      const validMedicines = medicines
        .filter((m) => m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          durationDays: Number(m.durationDays) || 30,
          instructions: m.instructions.trim(),
        }));

      const payload: DoctorConsultationInput = {
        patientId: patientId.trim(),
        consultationDate,
        symptoms: symptoms.trim(),
        clinicalFindings: clinicalFindings.trim(),
        diagnosis: diagnosis.trim(),
        treatmentPlan: treatmentPlan.trim(),
        prescribedMedicines: validMedicines.length > 0 ? validMedicines : undefined,
        recommendedTests: tests.length > 0 ? tests : undefined,
        followUpDate: followUpDate || undefined,
        clinicalNotes: clinicalNotes.trim() || undefined,
      };

      await createDoctorConsultation(payload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(
        err.message || "Failed to record consultation report. Please check authorization."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Doctor Consultation Report"
      description="Record clinical findings, diagnoses, e-prescriptions, and recommended tests linked to the patient's unique Patient ID."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-none flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-none flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Consultation report and unified records saved successfully!</span>
          </div>
        )}

        {/* Patient ID and Consultation Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Patient ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. SS-PAT-000001"
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Consultation Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={consultationDate}
              onChange={(e) => setConsultationDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>
        </div>

        {/* Symptoms & Clinical Findings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Symptoms / Presenting Complaints <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Patient reported symptoms..."
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Clinical Findings / Vitals <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={clinicalFindings}
              onChange={(e) => setClinicalFindings(e.target.value)}
              placeholder="Physical examination, vitals, observations..."
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>
        </div>

        {/* Diagnosis & Treatment Plan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Diagnosis / Clinical Assessment <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Stage 1 Essential Hypertension"
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Treatment Plan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              placeholder="e.g. Diet modification and pharmacological therapy"
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>
        </div>

        {/* Prescribed Medicines Section */}
        <div className="border border-slate-200 p-3 bg-white space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Pill className="w-3.5 h-3.5 text-teal-700" />
              <span>Prescribed Medications (E-Prescription)</span>
            </div>
            <button
              type="button"
              onClick={handleAddMedicine}
              className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-semibold cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Medicine</span>
            </button>
          </div>

          {medicines.map((med, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-slate-50 border border-slate-200 items-center"
            >
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Medicine Name"
                  value={med.name}
                  onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 bg-white font-semibold text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Dosage (40mg)"
                  value={med.dosage}
                  onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Frequency (OD / BD)"
                  value={med.frequency}
                  onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Instructions"
                  value={med.instructions}
                  onChange={(e) => handleMedicineChange(index, "instructions", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div className="sm:col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => handleRemoveMedicine(index)}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  title="Remove Medicine"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended Laboratory Tests */}
        <div className="border border-slate-200 p-3 bg-white space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
              <span>Recommended Diagnostic Orders</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add test (e.g. Complete Blood Count, Lipid Panel)..."
              value={newTestInput}
              onChange={(e) => setNewTestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTest();
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 bg-white text-slate-900"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTest}
              className="rounded-none"
            >
              Add Test
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {tests.map((testName, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-300 text-teal-900 font-semibold"
              >
                <span>{testName}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTest(i)}
                  className="text-teal-700 hover:text-teal-900 cursor-pointer font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Follow-up Date and Clinical Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Follow-Up Review Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Clinical Notes &amp; Guidance
            </label>
            <input
              type="text"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Special instructions or precautions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="rounded-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="rounded-none"
            rightIcon={<Stethoscope className="w-4 h-4" />}
          >
            Submit Consultation Report
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
