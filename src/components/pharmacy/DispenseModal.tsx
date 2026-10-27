import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { recordDispensation } from "../../api/client";
import type { PrescriptionItem } from "../../types/api";

interface DispenseModalProps {
  prescription: PrescriptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DispenseModal: React.FC<DispenseModalProps> = ({
  prescription,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [notes, setNotes] = useState<string>(
    "Patient counseled on adherence, dosage timing, and storage conditions."
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (prescription) {
      setQuantity(prescription.remainingQuantity ?? 0);
      setIdempotencyKey(
        `idemp-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`
      );
      setBatchNumber(`LOT-${Date.now().toString().slice(-6)}`);
      setError(null);
      setSuccessMessage(null);
    }
  }, [prescription]);

  if (!prescription) return null;

  const remaining = prescription.remainingQuantity ?? 0;

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (quantity <= 0) {
        throw new Error("Dispense quantity must be greater than 0.");
      }
      if (quantity > remaining) {
        throw new Error(
          `Requested quantity (${quantity}) exceeds authorized remaining balance (${remaining}).`
        );
      }

      const res = await recordDispensation(prescription.prescriptionId, {
        quantityToDispense: Number(quantity),
        batchNumber: batchNumber.trim(),
        idempotencyKey: idempotencyKey.trim(),
        notes: notes.trim(),
      });

      if (res.duplicate) {
        setSuccessMessage(
          "Idempotent replay detected: Verified existing dispense event without double-decrementing balance."
        );
      } else {
        setSuccessMessage(
          `Successfully dispensed ${quantity} units! Remaining balance: ${res.prescription.remainingQuantity}.`
        );
      }

      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMessage(null);
      }, 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dispensing transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  const isExpired = new Date(prescription.expiresAt).getTime() < Date.now();
  const isFulfilled = prescription.status === "DISPENSED" || remaining <= 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Safe Pharmacy Dispensing (Atomic Fulfilment)"
      maxWidth="lg"
    >
      <form onSubmit={handleDispense} className="space-y-4">
        {/* Prescription Reference Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-teal-950">
              {prescription.prescriptionId}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                prescription.status === "ACTIVE"
                  ? "bg-teal-100 text-teal-800"
                  : prescription.status === "PARTIALLY_DISPENSED"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {prescription.status}
            </span>
          </div>

          <div className="text-[#475569]">
            <strong>Patient:</strong> <span className="font-mono text-[#172033]">{prescription.patientId}</span> •{" "}
            <strong>Prescriber:</strong> Dr. {prescription.doctorId}
          </div>

          <div className="pt-2 border-t border-[#d7eaea] grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-white p-2.5 rounded-[10px] border border-[#d7eaea] shadow-2xs">
              <span className="text-[#64748b] block text-[10px]">Total Authorized</span>
              <span className="font-bold text-[#172033]">{prescription.totalQuantity} units</span>
            </div>
            <div className="bg-white p-2.5 rounded-[10px] border border-[#d7eaea] shadow-2xs">
              <span className="text-[#64748b] block text-[10px]">Already Dispensed</span>
              <span className="font-bold text-[#172033]">
                {prescription.dispensedQuantity ?? 0} units
              </span>
            </div>
            <div className="bg-[#f0fdfa] p-2.5 rounded-[10px] border border-[#b2d8d8] shadow-2xs">
              <span className="text-[#008080] block text-[10px] font-semibold">Remaining</span>
              <span className="font-bold text-[#004c4c]">{remaining} units</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-[12px] text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[12px] text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isExpired && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-[12px] text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This prescription has passed its expiry date and cannot be dispensed.</span>
          </div>
        )}

        {isFulfilled && (
          <div className="p-3 bg-[#f0fdfa] border border-[#d7eaea] rounded-[12px] text-xs text-[#475569] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#008080] shrink-0" />
            <span>This prescription has been completely fulfilled. No units remaining.</span>
          </div>
        )}

        {/* Quantity to Dispense */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#172033]">
              Quantity to Dispense Now (Units) *
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, Math.floor(remaining / 2)))}
                disabled={isFulfilled || isExpired}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-[8px] bg-white border border-[#d7eaea] hover:bg-[#f0fdfa] text-[#475569] cursor-pointer"
              >
                Half ({Math.max(1, Math.floor(remaining / 2))})
              </button>
              <button
                type="button"
                onClick={() => setQuantity(remaining)}
                disabled={isFulfilled || isExpired}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-[8px] bg-[#f0fdfa] hover:bg-[#e8f4f4] text-[#008080] border border-[#b2d8d8] cursor-pointer"
              >
                Full ({remaining})
              </button>
            </div>
          </div>
          <input
            type="number"
            min={1}
            max={remaining}
            required
            disabled={isFulfilled || isExpired || loading}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 text-sm border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] font-bold text-[#172033] bg-white shadow-2xs"
          />
          <p className="text-[10px] text-[#64748b] mt-1">
            Backend will atomically verify available quantity to protect against concurrent double-dispensing.
          </p>
        </div>

        {/* Batch Number & Idempotency Key */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">
              Lot / Batch Number *
            </label>
            <input
              type="text"
              required
              disabled={isFulfilled || isExpired || loading}
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] font-mono text-[#172033] bg-white shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5 flex items-center justify-between">
              <span>Idempotency Key</span>
              <button
                type="button"
                onClick={() =>
                  setIdempotencyKey(`idemp-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`)
                }
                className="text-[10px] text-[#008080] hover:text-[#006666] cursor-pointer font-semibold"
              >
                New Key
              </button>
            </label>
            <input
              type="text"
              required
              disabled={isFulfilled || isExpired || loading}
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] font-mono text-[#475569] bg-[#f0fdfa]"
            />
          </div>
        </div>

        {/* Pharmacist Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5">
            Pharmacist Verification Notes
          </label>
          <input
            type="text"
            disabled={isFulfilled || isExpired || loading}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] text-[#172033] bg-white shadow-2xs"
          />
        </div>

        {/* Concurrency Guarantee Notice */}
        <div className="p-3 bg-[#f0fdfa] border border-[#d7eaea] rounded-[12px] text-[11px] text-[#004c4c] flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-[#008080] shrink-0 mt-0.5" />
          <span>
            <strong>Concurrency & Fraud Protection:</strong> Processed with atomic conditional decrements
            and a unique idempotency constraint. Replays will safely resolve without balance mutation.
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#d7eaea]">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isFulfilled || isExpired || loading}
          >
            {loading ? "Recording Dispense Event..." : `Dispense ${quantity} Units`}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
