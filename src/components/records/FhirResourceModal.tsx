import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Calendar,
  Building2,
  User,
  ShieldCheck,
  Copy,
  Check,
  Code,
  Sparkles,
} from "lucide-react";
import type { TimelineRecordItem } from "../../types/api";

interface FhirResourceModalProps {
  record: TimelineRecordItem | null;
  onClose: () => void;
}

function cleanDisplay(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export const FhirResourceModal: React.FC<FhirResourceModalProps> = ({
  record,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"clinical" | "fhir" | "provenance">("clinical");
  const [copied, setCopied] = useState<boolean>(false);

  if (!record) return null;

  // Synthesize clean FHIR R4 JSON structure for demonstration view
  const fhirPayload = {
    resourceType: record.resourceType,
    id: record.rawResourceId || record.recordId,
    meta: {
      profile: [
        `https://nrces.in/ndhm/fhir/r4/StructureDefinition/${record.resourceType}`,
      ],
      lastUpdated: new Date().toISOString(),
      source: `https://mock.abdm.gateway/hip/${record.sourceInstitution}`,
    },
    status: record.status,
    code: {
      text: cleanDisplay(record.title),
    },
    subject: {
      reference: "Patient/synthetic-abha-subject",
      display: "Rahul Verma",
    },
    effectiveDateTime: `${record.date}T10:00:00Z`,
    performer: [
      {
        display: cleanDisplay(record.doctorName),
      },
    ],
    note: [
      {
        text: cleanDisplay(record.summary),
      },
    ],
    details: record.details || {},
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const footer = (
    <Button variant="secondary" size="sm" onClick={onClose}>
      Close
    </Button>
  );

  return (
    <Dialog
      isOpen={Boolean(record)}
      onClose={onClose}
      title={cleanDisplay(record.title)}
      description={`Exchanged via ABDM Mock Gateway • Care Context: ${record.careContextId}`}
      footer={footer}
      maxWidth="xl"
    >
      <div className="space-y-3">
        {/* Tab navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold pt-1">
          <button
            onClick={() => setActiveTab("clinical")}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "clinical"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Clinical Summary
          </button>
          <button
            onClick={() => setActiveTab("fhir")}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "fhir"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            FHIR R4 JSON
          </button>
          <button
            onClick={() => setActiveTab("provenance")}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "provenance"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            ABDM Provenance
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-2">
          {activeTab === "clinical" && (
            <div className="space-y-4 text-xs">
              {/* Summary Block */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Clinical Summary & Observations
                </span>
                <p className="text-slate-800 leading-relaxed font-sans text-xs sm:text-[13px]">
                  {cleanDisplay(record.summary)}
                </p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Record Date</span>
                    <span className="font-semibold text-slate-800">{record.date}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Source Facility</span>
                    <span className="font-semibold text-slate-800 truncate block max-w-[200px]">
                      {cleanDisplay(record.sourceInstitution)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attending Clinician</span>
                    <span className="font-semibold text-slate-800">{cleanDisplay(record.doctorName)}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status & Verification</span>
                    <span className="font-semibold text-slate-800 capitalize">{record.status} (Verified)</span>
                  </div>
                </div>
              </div>

              {/* Extra details if available */}
              {record.details && Object.keys(record.details).length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    Extracted Diagnostic Metrics
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(record.details).map(([k, v]) => (
                      <div key={k} className="p-2 bg-white rounded-lg border border-slate-200/80 text-[11px]">
                        <span className="text-slate-400 block text-[10px]">{k}</span>
                        <span className="font-semibold text-slate-800">{String(v ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "fhir" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>HL7 FHIR Release 4 JSON Representation</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyJson}
                  leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? "Copied JSON" : "Copy Payload"}
                </Button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[360px] shadow-inner leading-relaxed">
                <pre>{JSON.stringify(fhirPayload, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === "provenance" && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-900 font-semibold">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Synthetic Demonstration Resource</span>
                </div>
                <Badge variant="teal" size="sm">Mock ABDM Gateway</Badge>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden text-slate-700">
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Resource Identifier</span>
                  <code className="font-mono text-slate-800">{record.recordId}</code>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Originating HIP Source</span>
                  <span className="font-semibold text-slate-800">{record.sourceInstitution}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Care Context Link</span>
                  <code className="font-mono text-slate-800">{record.careContextId}</code>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Enclosing FHIR Bundle ID</span>
                  <code className="font-mono text-slate-800 text-[11px] truncate max-w-[280px]">
                    {record.bundleId}
                  </code>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Transfer Origin</span>
                  <Badge variant={record.origin === "abdm_transfer" ? "teal" : "neutral"} size="sm">
                    {record.origin === "abdm_transfer" ? "Simulated ABDM Transfer" : "Personal Health Vault"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
