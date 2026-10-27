import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  Pill,
  User,
  Plus,
  Trash2,
  AlertCircle,
  FileCheck2,
  Calendar,
  Clock,
} from "lucide-react";
import { createPrescription, fetchDiscoverablePatients } from "../../api/client";
import type { DiscoverablePatient } from "../../types/api";

interface CreatePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MEDICATION_CATALOG = [
  {
    name: "Atorvastatin 20mg Tablet",
    code: "RXNORM-617314",
    dosage: "20 mg",
    frequency: "Once daily at bedtime",
    route: "Oral",
    defaultDuration: 30,
    defaultQuantity: 30,
    instructions: "Take with water. Monitor lipid profile periodically.",
  },
  {
    name: "Metformin HCl 500mg Tablet",
    code: "RXNORM-860975",
    dosage: "500 mg",
    frequency: "Twice daily after meals",
    route: "Oral",
    defaultDuration: 30,
    defaultQuantity: 60,
    instructions: "Take with or immediately after meals to reduce GI irritation.",
  },
  {
    name: "Amoxicillin 500mg Capsule",
    code: "RXNORM-120534",
    dosage: "500 mg",
    frequency: "Three times daily",
    route: "Oral",
    defaultDuration: 7,
    defaultQuantity: 21,
    instructions: "Complete the full antibiotic course. Do not skip doses.",
  },
  {
    name: "Metoprolol Succinate ER 25mg",
    code: "RXNORM-866416",
    dosage: "25 mg",
    frequency: "Once daily morning",
    route: "Oral",
    defaultDuration: 30,
    defaultQuantity: 30,
    instructions: "Do not crush or chew extended-release tablets.",
  },
  {
    name: "Pantoprazole Sodium 40mg Tablet",
    code: "RXNORM-856844",
    dosage: "40 mg",
    frequency: "Once daily before breakfast",
    route: "Oral",
    defaultDuration: 14,
    defaultQuantity: 14,
    instructions: "Swallow whole 30 minutes before first morning meal.",
  },
  {
    name: "Paracetamol 650mg Tablet",
    code: "RXNORM-198440",
    dosage: "650 mg",
    frequency: "As needed every 6 hours",
    route: "Oral",
    defaultDuration: 5,
    defaultQuantity: 15,
    instructions: "For fever or pain. Do not exceed 4,000 mg in 24 hours.",
  },
];

export const CreatePrescriptionModal: React.FC<CreatePrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [patients, setPatients] = useState<DiscoverablePatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [maxRefills, setMaxRefills] = useState<number>(2);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [generalInstructions, setGeneralInstructions] = useState<string>(
    "Adhere strictly to prescribed schedule. Report any adverse reactions immediately."
  );

  const [medications, setMedications] = useState<
    Array<{
      code: string;
      name: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      route: string;
      quantity: number;
      instructions: string;
    }>
  >([
    {
      code: MEDICATION_CATALOG[0].code,
      name: MEDICATION_CATALOG[0].name,
      dosage: MEDICATION_CATALOG[0].dosage,
      frequency: MEDICATION_CATALOG[0].frequency,
      durationDays: MEDICATION_CATALOG[0].defaultDuration,
      route: MEDICATION_CATALOG[0].route,
      quantity: MEDICATION_CATALOG[0].defaultQuantity,
      instructions: MEDICATION_CATALOG[0].instructions,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDiscoverablePatients()
        .then((pts) => {
          setPatients(pts);
          if (pts.length > 0 && !selectedPatientId) {
            const first = pts[0];
            const pId = first.id || (first as unknown as { _id: string })._id;
            if (pId) setSelectedPatientId(pId);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, selectedPatientId]);

  const handleAddMedication = (catalogIndex: number = 1) => {
    const item = MEDICATION_CATALOG[catalogIndex % MEDICATION_CATALOG.length];
    setMedications((prev) => [
      ...prev,
      {
        code: item.code,
        name: item.name,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.defaultDuration,
        route: item.route,
        quantity: item.defaultQuantity,
        instructions: item.instructions,
      },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const handleSelectFromCatalog = (index: number, catalogName: string) => {
    const item = MEDICATION_CATALOG.find((c) => c.name === catalogName);
    if (!item) return;
    setMedications((prev) =>
      prev.map((med, i) =>
        i === index
          ? {
              ...med,
              name: item.name,
              code: item.code,
              dosage: item.dosage,
              frequency: item.frequency,
              durationDays: item.defaultDuration,
              route: item.route,
              quantity: item.defaultQuantity,
              instructions: item.instructions,
            }
          : med
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!selectedPatientId) {
        throw new Error("Patient selection is required.");
      }
      if (medications.length === 0) {
        throw new Error("At least one medication item must be added to the prescription.");
      }

      await createPrescription({
        patientId: selectedPatientId,
        medications: medications.map((m) => ({
          code: m.code,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          durationDays: Number(m.durationDays) || 7,
          route: m.route,
          quantity: Number(m.quantity) || 10,
          instructions: m.instructions,
        })),
        maxRefills: Number(maxRefills) || 0,
        validityDays: Number(validityDays) || 30,
        instructions: generalInstructions.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create prescription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Synthetic Prescription (FHIR R4 MedicationRequest)"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Prescription signed, validated and active for safe pharmacy dispensing!</span>
          </div>
        )}

        {/* Patient Selection & Validity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-[#172033] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#008080]" />
              Patient Selection *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white text-[#172033] shadow-2xs"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-[#172033] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#008080]" />
              Validity Period (Days)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] text-[#172033] bg-white shadow-2xs"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-[#172033] mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#008080]" />
              Authorized Refills
            </label>
            <select
              value={maxRefills}
              onChange={(e) => setMaxRefills(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white text-[#172033] shadow-2xs"
            >
              <option value={0}>0 (Single Fill Only)</option>
              <option value={1}>1 Refill Permitted</option>
              <option value={2}>2 Refills Permitted</option>
              <option value={3}>3 Refills Permitted</option>
              <option value={5}>5 Refills Permitted</option>
            </select>
          </div>
        </div>

        {/* Medications List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-[#008080]" />
              Prescribed Medications & Fulfilment Limits ({medications.length})
            </label>
            <button
              type="button"
              onClick={() => handleAddMedication(medications.length)}
              className="inline-flex items-center gap-1 text-xs text-[#008080] hover:text-[#006666] font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Medication
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {medications.map((med, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-[#d7eaea] rounded-[14px] text-xs space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[#d7eaea]/70">
                  <span className="font-semibold text-[#004c4c] text-xs">
                    Medication #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => handleSelectFromCatalog(idx, e.target.value)}
                      value={med.name}
                      className="px-2 py-0.5 text-[11px] border border-[#d7eaea] rounded-[8px] bg-[#f0fdfa] text-[#004c4c]"
                    >
                      {MEDICATION_CATALOG.map((cat) => (
                        <option key={cat.code} value={cat.name}>
                          Catalog: {cat.name}
                        </option>
                      ))}
                    </select>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="text-[#64748b] hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <label className="text-[10px] text-[#64748b] font-medium">Drug Name</label>
                    <input
                      type="text"
                      required
                      value={med.name}
                      onChange={(e) => handleMedicationChange(idx, "name", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] font-semibold text-[#172033] bg-white"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] text-[#64748b] font-medium">RxNorm Code</label>
                    <input
                      type="text"
                      value={med.code}
                      onChange={(e) => handleMedicationChange(idx, "code", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] font-mono text-[#64748b] bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#64748b] font-medium">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(idx, "dosage", e.target.value)}
                      placeholder="e.g. 20 mg"
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] text-[#172033] bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#64748b] font-medium">Route</label>
                    <input
                      type="text"
                      value={med.route}
                      onChange={(e) => handleMedicationChange(idx, "route", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] text-[#172033] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <label className="text-[10px] text-[#64748b] font-medium">Frequency & Timing</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(idx, "frequency", e.target.value)}
                      placeholder="e.g. Once daily at bedtime"
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] text-[#172033] bg-white"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] text-[#64748b] font-medium">Duration (Days)</label>
                    <input
                      type="number"
                      min={1}
                      value={med.durationDays}
                      onChange={(e) =>
                        handleMedicationChange(idx, "durationDays", Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] text-[#172033] bg-white"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] text-[#004c4c] font-semibold">
                      Permitted Quantity (Units) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={med.quantity}
                      onChange={(e) =>
                        handleMedicationChange(idx, "quantity", Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-[#b2d8d8] rounded-[8px] focus:ring-1 focus:ring-[#008080] font-bold bg-[#f0fdfa] text-[#004c4c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#64748b] font-medium">Patient Instructions</label>
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) => handleMedicationChange(idx, "instructions", e.target.value)}
                    placeholder="e.g. Take with water. Avoid grapefruit juice."
                    className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] text-[#172033] bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Instructions */}
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5">
            Practitioner Prescription Notes & Instructions
          </label>
          <input
            type="text"
            value={generalInstructions}
            onChange={(e) => setGeneralInstructions(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] text-[#172033] bg-white shadow-2xs"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#d7eaea]">
          <div className="text-[11px] text-[#64748b] flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-[#008080]" />
            <span>Generates FHIR R4 MedicationRequest with strict dosage & fulfillment constraints.</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Signing & Validating..." : "Sign & Create Prescription"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
