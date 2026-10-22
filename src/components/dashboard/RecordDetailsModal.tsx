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
      <div className="space-y-4">
        {/* Meta Header */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <Badge variant={getBadgeVariant(record.resourceType)} size="md">
            {record.resourceType}
          </Badge>
          <Badge variant={record.status === "final" || record.status === "completed" ? "success" : "neutral"} size="md" dot>
            Status: {record.status}
          </Badge>
          <span className="text-xs text-slate-400 font-mono ml-auto">
            ABDM Care Context: {record.careContextId}
          </span>
        </div>

        {showJson ? (
          <div className="relative">
            <button
              onClick={handleCopyJson}
              className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-80">
              {JSON.stringify(mockFhirBundle, null, 2)}
            </pre>
          </div>
        ) : (
          <>
            {/* Clinical Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Healthcare Provider</span>
                  <span className="font-medium text-slate-900">{record.provider}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Attending Clinician</span>
                  <span className="font-medium text-slate-900">{record.doctor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Record Date</span>
                  <span className="font-medium text-slate-900">{record.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Provenance &amp; Security</span>
                  <span className="font-medium text-teal-800">ABDM Cryptographically Verified</span>
                </div>
              </div>
            </div>

            {/* Clinical Summary */}
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Clinical Findings &amp; Summary
              </h4>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-sans">
                {record.summary}
              </div>
            </div>

            {/* ABHA Identifier Banner */}
            <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span className="text-teal-900 font-medium">Linked to ABHA: rahul.verma@sbx</span>
              </div>
              <span className="text-teal-700 font-mono text-[11px]">NRCES HL7 FHIR R4</span>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};
