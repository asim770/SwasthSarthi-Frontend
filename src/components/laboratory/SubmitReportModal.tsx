import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Activity,
} from "lucide-react";
import { submitDiagnosticReport } from "../../api/client";
import type { LabOrderItem, DiagnosticObservationItem } from "../../types/api";

interface SubmitReportModalProps {
  order: LabOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [observations, setObservations] = useState<DiagnosticObservationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (order) {
      setTitle(`${order.testName} Diagnostic Report`);
      setSummary(
        `Diagnostic evaluation for ${order.testName} completed in accordance with simulated NABL quality standards.`
      );
      setObservations([
        {
          code: order.testCode || "LOINC-OBS-01",
          name: order.testName,
          value: "6.2",
          unit: order.testCode.includes("4548") ? "%" : "mg/dL",
          referenceRange: order.testCode.includes("4548") ? "< 5.7 %" : "70 - 99 mg/dL",
          interpretation: "NORMAL",
        },
      ]);
      setError(null);
      setSuccess(false);
    }
  }, [order]);

  if (!order) return null;

  const handleAddObservation = () => {
    setObservations((prev) => [
      ...prev,
      {
        code: `LOINC-PANEL-${prev.length + 1}`,
        name: `Component ${prev.length + 1}`,
        value: "0.0",
        unit: "mg/dL",
        referenceRange: "Normal",
        interpretation: "NORMAL",
      },
    ]);
  };

  const handleRemoveObservation = (index: number) => {
    setObservations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleObservationChange = (
    index: number,
    field: keyof DiagnosticObservationItem,
    val: string
  ) => {
    setObservations((prev) =>
      prev.map((obs, i) => (i === index ? { ...obs, [field]: val } : obs))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!title.trim()) {
        throw new Error("Report title is required.");
      }
      if (!summary.trim()) {
        throw new Error("Clinical summary/impression is required.");
      }
      if (observations.length === 0) {
        throw new Error("At least one diagnostic observation measurement must be included.");
      }

      await submitDiagnosticReport(order.orderId, {
        title: title.trim(),
        summary: summary.trim(),
        observations,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit diagnostic report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Diagnostic Report (FHIR R4)"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Order Context Strip */}
        <div className="bg-[#f0fdfa] border border-[#d7eaea] rounded-[14px] p-3 text-xs text-[#475569] flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <span className="text-[#64748b]">Order ID:</span>{" "}
            <span className="font-mono font-bold text-[#172033]">{order.orderId}</span>
          </div>
          <div>
            <span className="text-[#64748b]">Patient:</span>{" "}
            <span className="font-mono font-semibold text-[#172033]">{order.patientId}</span>
          </div>
          <div>
            <span className="text-[#64748b]">Facility:</span>{" "}
            <span className="font-semibold text-[#172033]">{order.targetFacility}</span>
          </div>
          <div>
            <span className="text-[#64748b]">Priority:</span>{" "}
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                order.priority === "STAT"
                  ? "bg-rose-100 text-rose-800"
                  : order.priority === "URGENT"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-[#f0fdfa] text-[#008080] border border-[#b2d8d8]"
              }`}
            >
              {order.priority}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-[12px] text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[12px] text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>DiagnosticReport and Observations validated and persisted successfully!</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5">
            Diagnostic Report Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] text-[#172033] bg-white shadow-2xs"
          />
        </div>

        {/* Observations list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#008080]" />
              Discrete FHIR Observations / Measured Values ({observations.length})
            </label>
            <button
              type="button"
              onClick={handleAddObservation}
              className="inline-flex items-center gap-1 text-xs text-[#008080] hover:text-[#006666] font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Observation
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {observations.map((obs, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-[#d7eaea] rounded-[12px] text-xs space-y-2 shadow-2xs"
              >
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <label className="text-[10px] text-[#64748b] font-medium">Test / Analyte</label>
                    <input
                      type="text"
                      value={obs.name}
                      onChange={(e) => handleObservationChange(idx, "name", e.target.value)}
                      placeholder="e.g. HbA1c"
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] text-[#172033] bg-white"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] text-[#64748b] font-medium">Code (LOINC)</label>
                    <input
                      type="text"
                      value={obs.code}
                      onChange={(e) => handleObservationChange(idx, "code", e.target.value)}
                      placeholder="4548-4"
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] font-mono text-[#172033] bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#64748b] font-medium">Value</label>
                    <input
                      type="text"
                      value={obs.value}
                      onChange={(e) => handleObservationChange(idx, "value", e.target.value)}
                      placeholder="6.2"
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] font-mono font-semibold text-[#172033] bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#64748b] font-medium">Unit</label>
                    <input
                      type="text"
                      value={obs.unit || ""}
                      onChange={(e) => handleObservationChange(idx, "unit", e.target.value)}
                      placeholder="%"
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] text-[#172033] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <label className="text-[10px] text-[#64748b] font-medium">Reference Range</label>
                    <input
                      type="text"
                      value={obs.referenceRange || ""}
                      onChange={(e) => handleObservationChange(idx, "referenceRange", e.target.value)}
                      placeholder="< 5.7 % (Normal)"
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] text-[#172033] bg-white"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] text-[#64748b] font-medium">Interpretation</label>
                    <select
                      value={obs.interpretation || "NORMAL"}
                      onChange={(e) => handleObservationChange(idx, "interpretation", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#d7eaea] rounded-[8px] focus:ring-1 focus:ring-[#008080] bg-white text-[#172033]"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="LOW">LOW</option>
                      <option value="ABNORMAL">ABNORMAL</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-end pt-3">
                    {observations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObservation(idx)}
                        className="text-[#64748b] hover:text-rose-600 p-1 rounded"
                        title="Remove observation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Summary */}
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5">
            Clinical Summary & Impression *
          </label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] text-[#172033] bg-white shadow-2xs"
            placeholder="Document laboratory pathologist's final conclusion and diagnostic impression..."
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#d7eaea]">
          <div className="text-[11px] text-[#64748b] flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-[#008080]" />
            <span>Stores FHIR DiagnosticReport into facility records for ABDM discovery.</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Validating & Submitting..." : "Submit Diagnostic Report"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
