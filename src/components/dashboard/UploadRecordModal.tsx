import React, { useState, useRef } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Hospital,
  User,
  Calendar,
} from "lucide-react";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<"DiagnosticReport" | "Encounter" | "Immunization">("DiagnosticReport");
  const [provider, setProvider] = useState("");
  const [doctor, setDoctor] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-populate title if empty
      if (!title) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, " ")
          .trim();
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, " ")
          .trim();
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !provider.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess({
          title: title.trim(),
          resourceType,
          provider: provider.trim(),
          doctor: doctor.trim() || "Attending Physician",
          summary: summary.trim() || "Clinical document recorded and linked to patient health timeline.",
        });
        setSubmitted(false);
        setSelectedFile(null);
        setTitle("");
        setProvider("");
        setDoctor("");
        setSummary("");
        onClose();
      }, 700);
    }, 500);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Health Record"
      description="Attach a diagnostic test report, doctor prescription, or clinical summary."
      maxWidth="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-none bg-white hover:bg-[#F0F7F6] text-[#5C574F] border border-[#D0E5E1] shadow-2xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!title.trim() || !provider.trim()}
            className="rounded-none bg-[#0F766E] hover:bg-[#0D655E] border-[#0F766E] text-white shadow-2xs font-semibold px-4"
          >
            {submitted ? "Saved!" : "Upload Record"}
          </Button>
        </>
      }
    >
      {submitted ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 bg-[#E4F1EE] rounded-none flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[#0F766E]" />
          </div>
          <h4 className="text-base font-editorial-serif font-bold text-[#191817]">
            Record Uploaded Successfully
          </h4>
          <p className="text-xs text-[#5C574F]">
            The document has been securely added to your unified health timeline.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-editorial-sans text-xs">
          {/* File Upload Dropzone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-[#D0E5E1] hover:border-[#0F766E] p-5 text-center bg-[#F8FBFA] hover:bg-white transition-all cursor-pointer group rounded-none"
            >
              <div className="w-10 h-10 bg-[#E4F1EE] group-hover:bg-[#0F766E] group-hover:text-white text-[#0F766E] transition-colors flex items-center justify-center mx-auto mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#191817] block">
                Drag &amp; drop document, or <span className="text-[#0F766E] underline">browse</span>
              </span>
              <span className="text-[11px] text-[#7A746B] block mt-1">
                PDF, JPG, or PNG up to 10 MB
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-[#F0F7F6] border border-[#0F766E]/30 rounded-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-white border border-[#D0E5E1] text-[#0F766E] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-[#191817] truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-[#7A746B]">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to link
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 text-[#7A746B] hover:text-[#991B1B] hover:bg-white border border-transparent hover:border-[#D0E5E1] transition-colors cursor-pointer shrink-0"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Document Title */}
          <div>
            <label className="block text-xs font-semibold text-[#191817] mb-1">
              Document Title <span className="text-[#0F766E]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Blood Count (CBC) or Discharge Summary"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#D0E5E1] rounded-none bg-white text-[#191817] placeholder:text-[#9A9489] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors shadow-2xs"
              />
              <FileText className="w-3.5 h-3.5 text-[#7A746B] absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Record Type & Hospital/Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#191817] mb-1">
                Record Type <span className="text-[#0F766E]">*</span>
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as "DiagnosticReport" | "Encounter" | "Immunization")}
                className="w-full py-2 px-3 text-xs border border-[#D0E5E1] rounded-none bg-white text-[#191817] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors shadow-2xs cursor-pointer"
              >
                <option value="DiagnosticReport">Laboratory &amp; Diagnostic Report</option>
                <option value="Encounter">Doctor Consultation / Encounter</option>
                <option value="Immunization">Vaccination &amp; Immunization</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191817] mb-1">
                Hospital / Clinic Facility <span className="text-[#0F766E]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. Apollo Hospital or Care Diagnostics"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#D0E5E1] rounded-none bg-white text-[#191817] placeholder:text-[#9A9489] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors shadow-2xs"
                />
                <Hospital className="w-3.5 h-3.5 text-[#7A746B] absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Doctor Name & Document Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#191817] mb-1">
                Doctor / Clinician <span className="text-[10px] text-[#7A746B] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder="e.g. Dr. Vikram Seth"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#D0E5E1] rounded-none bg-white text-[#191817] placeholder:text-[#9A9489] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors shadow-2xs"
                />
                <User className="w-3.5 h-3.5 text-[#7A746B] absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191817] mb-1">
                Document Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#D0E5E1] rounded-none bg-white text-[#191817] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors shadow-2xs"
                />
                <Calendar className="w-3.5 h-3.5 text-[#7A746B] absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Notes / Summary */}
          <div>
            <label className="block text-xs font-semibold text-[#191817] mb-1">
              Notes or Summary <span className="text-[10px] text-[#7A746B] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief description, vital readings, or doctor instructions..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2.5 text-xs border border-[#D0E5E1] rounded-none bg-white text-[#191817] placeholder:text-[#9A9489] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors shadow-2xs resize-none"
            />
          </div>
        </form>
      )}
    </Dialog>
  );
};

export default UploadRecordModal;
