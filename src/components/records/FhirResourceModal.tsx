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
        <div className="flex items-center gap-1 border-b border-[#D0E5E1] text-xs font-semibold pt-1">
          <button
            onClick={() => setActiveTab("clinical")}
            className={`pb-2.5 px-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "clinical"
                ? "border-[#1A1918] text-[#1A1918]"
                : "border-transparent text-[#69655E] hover:text-[#1A1918]"
            }`}
          >
            Clinical Summary
          </button>
          <button
            onClick={() => setActiveTab("fhir")}
            className={`pb-2.5 px-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "fhir"
                ? "border-[#1A1918] text-[#1A1918]"
                : "border-transparent text-[#69655E] hover:text-[#1A1918]"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            FHIR R4 JSON
          </button>
          <button
            onClick={() => setActiveTab("provenance")}
            className={`pb-2.5 px-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "provenance"
                ? "border-[#1A1918] text-[#1A1918]"
                : "border-transparent text-[#69655E] hover:text-[#1A1918]"
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
              <div className="p-4 bg-[#F0F7F6] rounded-none border border-[#D0E5E1]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#69655E] block mb-1 font-mono">
                  Clinical Summary & Observations
                </span>
                <p className="text-[#1A1918] leading-relaxed font-sans text-xs sm:text-[13px]">
                  {cleanDisplay(record.summary)}
                </p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#D0E5E1] rounded-none flex items-center gap-3 shadow-none">
                  <div className="w-8 h-8 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E] shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#69655E] uppercase font-semibold block font-mono">Record Date</span>
                    <span className="font-semibold text-[#1A1918] font-mono">{record.date}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#D0E5E1] rounded-none flex items-center gap-3 shadow-none">
                  <div className="w-8 h-8 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#69655E] uppercase font-semibold block font-mono">Source Facility</span>
                    <span className="font-semibold text-[#1A1918] truncate block max-w-[200px]">
                      {cleanDisplay(record.sourceInstitution)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#D0E5E1] rounded-none flex items-center gap-3 shadow-none">
                  <div className="w-8 h-8 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E] shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#69655E] uppercase font-semibold block font-mono">Attending Clinician</span>
                    <span className="font-semibold text-[#1A1918]">{cleanDisplay(record.doctorName)}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#D0E5E1] rounded-none flex items-center gap-3 shadow-none">
                  <div className="w-8 h-8 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#69655E] uppercase font-semibold block font-mono">Status & Verification</span>
                    <span className="font-semibold text-[#1A1918] capitalize">{record.status} (Verified)</span>
                  </div>
                </div>
              </div>

              {/* Extra details if available */}
              {record.details && Object.keys(record.details).length > 0 && (
                <div className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none">
                  <span className="text-[11px] font-bold text-[#1A1918] block mb-2 font-mono uppercase tracking-wider">
                    Extracted Diagnostic Metrics
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(record.details).map(([k, v]) => (
                      <div key={k} className="p-2.5 bg-white rounded-none border border-[#D0E5E1] text-[11px] shadow-none">
                        <span className="text-[#69655E] block text-[10px] font-mono">{k}</span>
                        <span className="font-semibold text-[#1A1918] font-mono">{String(v ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "fhir" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#69655E] font-mono">
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

              <div className="bg-[#1A1918] text-emerald-400 p-4 rounded-none font-mono text-xs overflow-x-auto max-h-[360px] shadow-none leading-relaxed border border-[#D0E5E1]">
                <pre>{JSON.stringify(fhirPayload, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === "provenance" && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#0F766E] font-semibold font-mono">
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  <span>Synthetic Demonstration Resource</span>
                </div>
                <Badge variant="purple" size="sm">Mock ABDM Gateway</Badge>
              </div>

              <div className="divide-y divide-[#D0E5E1] border border-[#D0E5E1] rounded-none bg-white overflow-hidden text-[#5C574F]">
                <div className="p-3 flex justify-between items-center">
                  <span className="text-[#69655E] font-mono">Resource Identifier</span>
                  <code className="font-mono text-[#1A1918]">{record.recordId}</code>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-[#69655E] font-mono">Originating HIP Source</span>
                  <span className="font-semibold text-[#1A1918]">{record.sourceInstitution}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-[#69655E] font-mono">Care Context Link</span>
                  <code className="font-mono text-[#1A1918]">{record.careContextId}</code>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-[#69655E] font-mono">Enclosing FHIR Bundle ID</span>
                  <code className="font-mono text-[#1A1918] text-[11px] truncate max-w-[280px]">
                    {record.bundleId}
                  </code>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-[#69655E] font-mono">Transfer Origin</span>
                  <Badge variant={record.origin === "abdm_transfer" ? "purple" : "neutral"} size="sm">
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
