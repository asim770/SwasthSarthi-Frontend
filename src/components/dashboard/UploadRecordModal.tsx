import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";

interface UploadRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecord: {
    title: string;
    resourceType: "DiagnosticReport" | "Encounter" | "Immunization";
    provider: string;
    doctor: string;
    summary: string;
  }) => void;
}

export const UploadRecordModal: React.FC<UploadRecordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<"DiagnosticReport" | "Encounter" | "Immunization">("DiagnosticReport");
  const [provider, setProvider] = useState("");
  const [doctor, setDoctor] = useState("");
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !provider) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess({
          title,
          resourceType,
          provider,
          doctor: doctor || "Attending Physician",
          summary: summary || "Clinical consultation recorded and ingested into patient record.",
        });
        setSubmitted(false);
        setTitle("");
        setProvider("");
        setDoctor("");
        setSummary("");
        onClose();
      }, 900);
    }, 600);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Upload & Link Health Record"
      description="Record a clinical document to be indexed and linked to your ABHA profile via FHIR R4."
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!title || !provider}
          >
            {submitted ? "Saved!" : "Ingest Record"}
          </Button>
        </>
      }
    >
      {submitted ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-12 h-12 text-teal-600 mb-2 animate-bounce" />
          <h4 className="text-sm font-semibold text-slate-900">Record Ingested Successfully</h4>
          <p className="text-xs text-slate-500 mt-1">
            Linked to ABHA: rahul.verma@sbx under NRCES FHIR R4 standard.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mock File Upload Dropzone */}
          <div className="border-2 border-dashed border-[#b2d8d8] rounded-[16px] p-4 text-center bg-[#f0fdfa] hover:bg-[#e8f4f4] transition-colors cursor-pointer">
            <UploadCloud className="w-6 h-6 text-[#008080] mx-auto mb-1.5" />
            <span className="text-xs font-semibold text-[#172033] block">
              Drag &amp; drop PDF report, CCDA, or FHIR JSON
            </span>
            <span className="text-[11px] text-[#64748b] block mt-0.5">
              Supports lab reports, discharge summaries, and prescriptions
            </span>
          </div>

          <Input
            label="Document / Test Title *"
            placeholder="e.g. Lipid Profile & Liver Function Test"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            leftIcon={<FileText className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                FHIR R4 Resource Type
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as "DiagnosticReport" | "Encounter" | "Immunization")}
                className="w-full rounded-[12px] border border-[#d7eaea] text-xs text-[#172033] bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-[#008080]"
              >
                <option value="DiagnosticReport">DiagnosticReport (Lab / Imaging)</option>
                <option value="Encounter">Encounter (Consultation / OP)</option>
                <option value="Immunization">Immunization (Vaccination)</option>
              </select>
            </div>

            <Input
              label="Healthcare Facility / Hospital *"
              placeholder="e.g. AIIMS New Delhi"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              required
            />
          </div>

          <Input
            label="Clinician Name (Optional)"
            placeholder="e.g. Dr. Ramesh Gupta"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">
              Clinical Findings / Summary
            </label>
            <textarea
              rows={2}
              placeholder="Key diagnostic findings, measurements, or doctor notes..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-[12px] border border-[#d7eaea] text-xs text-[#172033] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-[#008080] bg-white"
            />
          </div>
        </form>
      )}
    </Dialog>
  );
};
