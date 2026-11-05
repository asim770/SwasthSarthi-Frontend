import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { FileText, Building2, User, Calendar, ShieldCheck, Code, Copy, Check } from "lucide-react";
import type { SyntheticHealthRecord } from "../../data/syntheticData";

interface RecordDetailsModalProps {
  record: SyntheticHealthRecord | null;
  onClose: () => void;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({ record, onClose }) => {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!record) return null;

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "DiagnosticReport":
        return "info";
      case "Encounter":
        return "teal";
      case "Immunization":
        return "success";
      case "MedicationRequest":
        return "warning";
      default:
        return "neutral";
    }
  };

  const mockFhirBundle = {
    resourceType: "Bundle",
    id: record.fhirBundleId.replace("urn:uuid:", ""),
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"],
    },
    type: "document",
    entry: [
      {
        resource: {
          resourceType: record.resourceType,
          id: record.id,
          status: record.status,
          code: {
            text: record.title,
          },
          subject: {
            reference: "Patient/PAT-2026-0042",
            display: "Rahul Verma (ABHA: 32-8492-1920-4491)",
          },
          performer: [
            {
              display: `${record.doctor} • ${record.provider}`,
            },
          ],
          effectiveDateTime: record.date,
          conclusion: record.summary,
        },
      },
    ],
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(mockFhirBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      isOpen={Boolean(record)}
      onClose={onClose}
      title={record.title}
      description={`FHIR R4 Record ID: ${record.id} • Care Context: ${record.careContextId}`}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => setShowJson(!showJson)} leftIcon={<Code className="w-3.5 h-3.5" />}>
            {showJson ? "Show Formatted Summary" : "View FHIR R4 JSON"}
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-4 font-editorial-sans">
        {/* Meta Header */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#EAE4D9]">
          <Badge variant={getBadgeVariant(record.resourceType)} size="md">
            {record.resourceType}
          </Badge>
          <Badge variant={record.status === "final" || record.status === "completed" ? "success" : "neutral"} size="md" dot>
            Status: {record.status}
          </Badge>
          <span className="text-xs text-[#7A746B] font-mono ml-auto">
            ABDM Care Context: {record.careContextId}
          </span>
        </div>

        {showJson ? (
          <div className="relative">
            <button
              onClick={handleCopyJson}
              className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded-none bg-[#1A1918] text-[#FAF7F2] hover:bg-[#2E2C2A] text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
            <pre className="p-4 bg-[#1A1918] text-emerald-400 rounded-none text-xs font-mono overflow-x-auto max-h-80 border border-[#2E2C2A]">
              {JSON.stringify(mockFhirBundle, null, 2)}
            </pre>
          </div>
        ) : (
          <>
            {/* Clinical Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FAF7F2] rounded-none border border-[#EAE4D9]">
              <div className="flex items-center gap-2.5 text-xs text-[#5C574F]">
                <Building2 className="w-4 h-4 text-[#57477D] shrink-0" />
                <div>
                  <span className="text-[#7A746B] block text-[10px] uppercase font-mono font-semibold">Healthcare Provider</span>
                  <span className="font-semibold text-[#191817]">{record.provider}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#5C574F]">
                <User className="w-4 h-4 text-[#57477D] shrink-0" />
                <div>
                  <span className="text-[#7A746B] block text-[10px] uppercase font-mono font-semibold">Attending Clinician</span>
                  <span className="font-semibold text-[#191817]">{record.doctor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#5C574F]">
                <Calendar className="w-4 h-4 text-[#57477D] shrink-0" />
                <div>
                  <span className="text-[#7A746B] block text-[10px] uppercase font-mono font-semibold">Record Date</span>
                  <span className="font-semibold text-[#191817]">{record.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#5C574F]">
                <ShieldCheck className="w-4 h-4 text-[#4E8C78] shrink-0" />
                <div>
                  <span className="text-[#7A746B] block text-[10px] uppercase font-mono font-semibold">Provenance &amp; Security</span>
                  <span className="font-semibold text-emerald-800">ABDM Cryptographically Verified</span>
                </div>
              </div>
            </div>

            {/* Clinical Summary */}
            <div>
              <h4 className="text-xs font-editorial-serif font-bold text-[#191817] uppercase tracking-wider mb-1.5">
                Clinical Findings &amp; Summary
              </h4>
              <div className="p-3.5 bg-white border border-[#EAE4D9] rounded-none text-xs text-[#5C574F] leading-relaxed shadow-2xs">
                {record.summary}
              </div>
            </div>

            {/* ABHA Identifier Banner */}
            <div className="p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#57477D]" />
                <span className="text-[#191817] font-semibold">Linked to ABHA: rahul.verma@sbx</span>
              </div>
              <span className="text-[#57477D] font-mono text-[11px] font-bold">NRCES HL7 FHIR R4</span>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};
