import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  FlaskConical,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import { uploadDirectLabReport } from "../../api/client";
import type { DirectLabReportInput } from "../../types/api";

interface DirectLabUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPatientId?: string;
  defaultLabName?: string;
}

interface TestResultRow {
  code?: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  interpretation: string;
}

export const DirectLabUploadModal: React.FC<DirectLabUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPatientId = "",
  defaultLabName = "Metropolis Diagnostics Hub",
}) => {
  const [patientId, setPatientId] = useState<string>(defaultPatientId);

  useEffect(() => {
    if (defaultPatientId) {
      setPatientId(defaultPatientId);
    }
  }, [defaultPatientId, isOpen]);

  const [testName, setTestName] = useState<string>("Lipid Profile (Fasting)");
  const [testCategory, setTestCategory] = useState<string>("Biochemistry");
  const [testDate, setTestDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [technicianName, setTechnicianName] = useState<string>("Rajesh Kumar, Senior Biochemist");
  const [laboratoryName, setLaboratoryName] = useState<string>(defaultLabName);
  const [notes, setNotes] = useState<string>(
    "Specimen lipemic index normal. Tested on calibrated Abbott auto-analyzer with verified controls."
  );
  const [attachmentTitle, setAttachmentTitle] = useState<string>("Lipid_Profile_Official_Signed.pdf");

  const [results, setResults] = useState<TestResultRow[]>([
    {
      code: "2093-3",
      name: "Total Cholesterol",
      value: "195",
      unit: "mg/dL",
      referenceRange: "125 - 200 mg/dL",
      interpretation: "Normal",
    },
    {
      code: "2085-9",
      name: "HDL Cholesterol",
      value: "52",
      unit: "mg/dL",
      referenceRange: "> 40 mg/dL",
      interpretation: "Normal",
    },
    {
      code: "13457-7",
      name: "LDL Cholesterol",
      value: "118",
      unit: "mg/dL",
      referenceRange: "< 100 mg/dL",
      interpretation: "Borderline High",
    },
    {
      code: "2571-8",
      name: "Triglycerides",
      value: "142",
      unit: "mg/dL",
      referenceRange: "< 150 mg/dL",
      interpretation: "Normal",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (defaultPatientId) setPatientId(defaultPatientId);
  }, [defaultPatientId]);

  React.useEffect(() => {
    if (defaultLabName) setLaboratoryName(defaultLabName);
  }, [defaultLabName]);

  const handleAddResult = () => {
    setResults((prev) => [
      ...prev,
      {
        name: "",
        value: "",
        unit: "mg/dL",
        referenceRange: "Normal",
        interpretation: "Normal",
      },
    ]);
  };

  const handleRemoveResult = (index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResultChange = (
    index: number,
    field: keyof TestResultRow,
    val: string
  ) => {
    setResults((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientId.trim()) {
      setError("Patient ID is required.");
      return;
    }
    if (!testName.trim()) {
      setError("Test name is required.");
      return;
    }
    if (results.length === 0) {
      setError("At least one test result parameter is required.");
      return;
    }

    setLoading(true);

    try {
      const formattedResults = results
        .filter((r) => r.name.trim())
        .map((r) => ({
          code: r.code || undefined,
          name: r.name.trim(),
          value: isNaN(Number(r.value)) ? r.value.trim() : Number(r.value),
          unit: r.unit.trim() || undefined,
          referenceRange: r.referenceRange.trim() || undefined,
          interpretation: r.interpretation || "Normal",
        }));

      const payload: DirectLabReportInput = {
        patientId: patientId.trim(),
        testName: testName.trim(),
        testCategory: testCategory.trim() || "Diagnostic",
        testDate,
        results: formattedResults,
        technicianName: technicianName.trim() || undefined,
        laboratoryName: laboratoryName.trim() || undefined,
        notes: notes.trim() || undefined,
        documentAttachment: attachmentTitle
          ? {
              title: attachmentTitle.trim(),
              url: `/reports/${attachmentTitle.trim()}`,
              mimeType: "application/pdf",
            }
          : undefined,
      };

      await uploadDirectLabReport(payload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(
        err.message || "Failed to upload laboratory report. Please check authorization."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Diagnostic Laboratory Report"
      description="Upload structured clinical test observations, units, reference ranges, and abnormal flags linked to a unique Patient ID."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-none flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-none flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Laboratory report submitted and added to patient medical records!</span>
          </div>
        )}

        {/* Patient ID and Test Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#F0F7F6] border border-[#D0E5E1]">
          <div>
            <label className="block text-[#1A1918] font-semibold mb-1">
              Patient ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. SS-PAT-000001"
              className="w-full px-3 py-2 border border-[#B6D6D0] rounded-none bg-white font-mono font-bold text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>

          <div>
            <label className="block text-[#1A1918] font-semibold mb-1">
              Test Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Lipid Profile, Complete Blood Count"
              className="w-full px-3 py-2 border border-[#B6D6D0] rounded-none bg-white font-bold text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>

          <div>
            <label className="block text-[#1A1918] font-semibold mb-1">
              Test Category
            </label>
            <input
              type="text"
              value={testCategory}
              onChange={(e) => setTestCategory(e.target.value)}
              placeholder="e.g. Biochemistry, Pathology"
              className="w-full px-3 py-2 border border-[#B6D6D0] rounded-none bg-white text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>
        </div>

        {/* Date, Technician, Lab Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[#1A1918] font-semibold mb-1">
              Test Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#B6D6D0] rounded-none bg-white text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>

          <div>
            <label className="block text-[#1A1918] font-semibold mb-1">
              Laboratory Name
            </label>
            <input
              type="text"
              value={laboratoryName}
              onChange={(e) => setLaboratoryName(e.target.value)}
              placeholder="e.g. Metropolis Diagnostics Hub"
              className="w-full px-3 py-2 border border-[#B6D6D0] rounded-none bg-white text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>

          <div>
            <label className="block text-[#1A1918] font-semibold mb-1">
              Technician Name / Credentials
            </label>
            <input
              type="text"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="e.g. Senior Biochemist"
              className="w-full px-3 py-2 border border-[#B6D6D0] rounded-none bg-white text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>
        </div>

        {/* Structured Results Table */}
        <div className="border border-[#D0E5E1] p-3 bg-white space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#D0E5E1]">
            <div className="flex items-center gap-1.5 font-bold text-[#1A1918]">
              <FlaskConical className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Diagnostic Observation Measurements (Values &amp; Flags)</span>
            </div>
            <button
              type="button"
              onClick={handleAddResult}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#1A1918] text-white rounded-none font-mono text-[11px] hover:bg-[#2A2928] cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Parameter</span>
            </button>
          </div>

          <div className="space-y-2">
            {results.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-[#F0F7F6] border border-[#D0E5E1] items-center"
              >
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Parameter (e.g. Total Cholesterol)"
                    value={row.name}
                    onChange={(e) => handleResultChange(index, "name", e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#B6D6D0] bg-white font-semibold text-[#1A1918]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Result (195)"
                    value={row.value}
                    onChange={(e) => handleResultChange(index, "value", e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#B6D6D0] bg-white font-mono font-bold text-[#1A1918]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Unit (mg/dL)"
                    value={row.unit}
                    onChange={(e) => handleResultChange(index, "unit", e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#B6D6D0] bg-white text-[#1A1918] font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Ref Range (125-200 mg/dL)"
                    value={row.referenceRange}
                    onChange={(e) => handleResultChange(index, "referenceRange", e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#B6D6D0] bg-white text-[#1A1918]"
                  />
                </div>
                <div className="sm:col-span-1">
                  <select
                    value={row.interpretation}
                    onChange={(e) => handleResultChange(index, "interpretation", e.target.value)}
                    className="w-full px-1 py-1 text-[11px] border border-[#B6D6D0] bg-white text-[#1A1918] font-mono font-semibold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Borderline High">Borderline</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="sm:col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveResult(index)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    title="Remove Parameter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Notes & Attachment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#1A1918] font-semibold mb-1">
              Clinical Report Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical impression, method, analyzers used..."
              className="w-full px-3 py-2 border border-[#B6D6D0] rounded-none bg-white text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
            />
          </div>

          <div>
            <label className="block text-[#1A1918] font-semibold mb-1">
              Official PDF Report Document
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={attachmentTitle}
                onChange={(e) => setAttachmentTitle(e.target.value)}
                placeholder="Signed_Report.pdf"
                className="w-full px-3 py-2 border border-[#B6D6D0] rounded-none bg-white text-[#1A1918] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
              />
              <span className="shrink-0 text-[10px] bg-[#F0F7F6] text-[#0F766E] px-2 py-1.5 border border-[#D0E5E1] font-mono font-bold uppercase">
                PDF
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#D0E5E1]">
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
            rightIcon={<FileCheck2 className="w-4 h-4" />}
          >
            Upload Laboratory Report
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
