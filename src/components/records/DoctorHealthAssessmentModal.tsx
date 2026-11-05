import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createHealthAssessment } from "../../api/client";
import type { HealthAssessmentInput } from "../../types/api";

interface DoctorHealthAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPatientId?: string;
}

export const DoctorHealthAssessmentModal: React.FC<DoctorHealthAssessmentModalProps> = ({
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

  const [assessment, setAssessment] = useState<string>(
    "Patient demonstrates therapeutic response to antihypertensive therapy. Blood pressure trending towards target range."
  );
  const [observations, setObservations] = useState<string>(
    "Resting BP 134/84 mmHg, heart rate 72 bpm, no reported adverse medication reactions."
  );
  const [treatmentProgress, setTreatmentProgress] = useState<string>(
    "Good medication adherence confirmed. Sodium restriction maintained."
  );
  const [recommendations, setRecommendations] = useState<string>(
    "Continue Telmisartan 40mg once daily. Maintain dietary log and home blood pressure log."
  );
  const [nextReviewDate, setNextReviewDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (defaultPatientId) {
      setPatientId(defaultPatientId);
    }
  }, [defaultPatientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientId.trim()) {
      setError("Patient ID is required.");
      return;
    }
    if (!assessment.trim()) {
      setError("Clinical assessment is required.");
      return;
    }

    setLoading(true);

    try {
      const payload: HealthAssessmentInput = {
        patientId: patientId.trim(),
        assessment: assessment.trim(),
        observations: observations.trim() || undefined,
        treatmentProgress: treatmentProgress.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
        nextReviewDate: nextReviewDate || undefined,
      };

      await createHealthAssessment(payload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(
        err.message || "Failed to submit health assessment. Please check authorization."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Update Patient Health Status Assessment"
      description="Record longitudinal clinical evaluation, observations, treatment progression, and review intervals."
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
            <span>Health status assessment recorded and linked to patient timeline!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FAF7F2] border border-[#EAE4D9]">
          <div>
            <label className="block text-[#1A1918] font-semibold mb-1 font-mono uppercase tracking-wider text-[11px]">
              Patient ID <span className="text-red-700">*</span>
            </label>
            <input
              type="text"
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. SS-PAT-000001"
              className="w-full px-3 py-2 border border-[#D5CEC2] rounded-none bg-white font-mono font-bold text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>

          <div>
            <label className="block text-[#1A1918] font-semibold mb-1 font-mono uppercase tracking-wider text-[11px]">
              Next Review Date
            </label>
            <input
              type="date"
              value={nextReviewDate}
              onChange={(e) => setNextReviewDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#D5CEC2] rounded-none bg-white text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[#1A1918] font-semibold mb-1 font-mono uppercase tracking-wider text-[11px]">
            Current Clinical Assessment <span className="text-red-700">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            placeholder="Evaluative summary of current health status..."
            className="w-full px-3 py-2 border border-[#D5CEC2] rounded-none bg-[#FAF7F2] text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
          />
        </div>

        <div>
          <label className="block text-[#1A1918] font-semibold mb-1 font-mono uppercase tracking-wider text-[11px]">
            Relevant Clinical Observations
          </label>
          <textarea
            rows={2}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Measurable findings, comparative vitals, observations..."
            className="w-full px-3 py-2 border border-[#D5CEC2] rounded-none bg-[#FAF7F2] text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#1A1918] font-semibold mb-1 font-mono uppercase tracking-wider text-[11px]">
              Treatment Progress
            </label>
            <input
              type="text"
              value={treatmentProgress}
              onChange={(e) => setTreatmentProgress(e.target.value)}
              placeholder="Adherence, response to medications..."
              className="w-full px-3 py-2 border border-[#D5CEC2] rounded-none bg-[#FAF7F2] text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>

          <div>
            <label className="block text-[#1A1918] font-semibold mb-1 font-mono uppercase tracking-wider text-[11px]">
              Follow-Up Recommendations
            </label>
            <input
              type="text"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Recommended actions or adjustments..."
              className="w-full px-3 py-2 border border-[#D5CEC2] rounded-none bg-[#FAF7F2] text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE4D9]">
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
            rightIcon={<Activity className="w-4 h-4" />}
          >
            Save Health Assessment
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
