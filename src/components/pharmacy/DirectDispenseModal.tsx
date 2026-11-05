import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  CheckCircle2,
  AlertCircle,
  PackageCheck,
} from "lucide-react";
import { dispenseMedicationDirect } from "../../api/client";
import type { DirectDispenseInput } from "../../types/api";

interface DirectDispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPrescriptionId?: string;
  defaultPatientId?: string;
  defaultMedicineName?: string;
  defaultAvailableQuantity?: number;
}

export const DirectDispenseModal: React.FC<DirectDispenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPrescriptionId = "",
  defaultPatientId = "",
  defaultMedicineName = "Telmisartan 40mg",
  defaultAvailableQuantity = 30,
}) => {
  const [prescriptionId, setPrescriptionId] = useState<string>(defaultPrescriptionId);
  const [patientId, setPatientId] = useState<string>(defaultPatientId);
  const [medicineName, setMedicineName] = useState<string>(defaultMedicineName);
  const [quantity, setQuantity] = useState<number>(defaultAvailableQuantity);

  useEffect(() => {
    if (defaultPrescriptionId) setPrescriptionId(defaultPrescriptionId);
    if (defaultPatientId) setPatientId(defaultPatientId);
    if (defaultMedicineName) setMedicineName(defaultMedicineName);
    if (defaultAvailableQuantity) setQuantity(defaultAvailableQuantity);
  }, [defaultPrescriptionId, defaultPatientId, defaultMedicineName, defaultAvailableQuantity, isOpen]);

  const [batchNumber, setBatchNumber] = useState<string>("BATCH-TELM-2026-A1");
  const [pharmacistName, setPharmacistName] = useState<string>("Pooja Sharma, Registered Pharmacist");
  const [dispenseStatus, setDispenseStatus] = useState<"COMPLETE" | "PARTIAL">("COMPLETE");
  const [substitutionInfo, setSubstitutionInfo] = useState<string>("None (Original prescribed formulation dispensed)");
  const [notes, setNotes] = useState<string>(
    "Dispensed 30 tablets in sealed blister package. Patient counselled on morning dosage schedule."
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (defaultPrescriptionId) setPrescriptionId(defaultPrescriptionId);
    if (defaultPatientId) setPatientId(defaultPatientId);
    if (defaultMedicineName) setMedicineName(defaultMedicineName);
    if (defaultAvailableQuantity) setQuantity(defaultAvailableQuantity);
  }, [defaultPrescriptionId, defaultPatientId, defaultMedicineName, defaultAvailableQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!prescriptionId.trim()) {
      setError("Valid Prescription ID is required.");
      return;
    }
    if (quantity <= 0) {
      setError("Dispensing quantity must be at least 1.");
      return;
    }

    setLoading(true);

    try {
      const payload: DirectDispenseInput = {
        prescriptionId: prescriptionId.trim(),
        quantityToDispense: quantity,
        batchNumber: batchNumber.trim() || undefined,
        pharmacistName: pharmacistName.trim() || undefined,
        notes: `${notes.trim()}${substitutionInfo ? ` | Substitution: ${substitutionInfo.trim()}` : ""}`,
      };

      await dispenseMedicationDirect(payload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(
        err.message || "Failed to record dispensing event. Please verify prescription status."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Medication Dispensing Record"
      description="Record drug fulfillment, batch verification, and quantity dispensed against an authorized doctor's prescription."
      maxWidth="lg"
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
            <span>Medication dispensation recorded and linked to patient health history!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Prescription ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={prescriptionId}
              onChange={(e) => setPrescriptionId(e.target.value)}
              placeholder="e.g. RX-2026-..."
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Patient ID
            </label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. SS-PAT-000001"
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Medicine Dispensed <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g. Telmisartan 40mg Tablets"
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Quantity to Dispense <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Batch / Lot Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. BATCH-2026-X1"
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Dispensing Pharmacist Information
            </label>
            <input
              type="text"
              value={pharmacistName}
              onChange={(e) => setPharmacistName(e.target.value)}
              placeholder="e.g. R.Ph Name"
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Fulfillment Status
            </label>
            <select
              value={dispenseStatus}
              onChange={(e) => setDispenseStatus(e.target.value as "COMPLETE" | "PARTIAL")}
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-[#008080]"
            >
              <option value="COMPLETE">Complete Dispensation (Full Quantity)</option>
              <option value="PARTIAL">Partial Dispensation (Partial Supply)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Substitution Information (if permitted)
            </label>
            <input
              type="text"
              value={substitutionInfo}
              onChange={(e) => setSubstitutionInfo(e.target.value)}
              placeholder="None or Generic Equivalent..."
              className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Pharmacist Dispensing Notes &amp; Guidance
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special dosage counselling or administration instructions..."
            className="w-full px-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#008080]"
          />
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
            rightIcon={<PackageCheck className="w-4 h-4" />}
          >
            Record Dispensation
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
