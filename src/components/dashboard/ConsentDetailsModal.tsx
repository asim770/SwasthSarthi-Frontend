import React from "react";
import { Dialog } from "../ui/Dialog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ShieldCheck, Building2, CheckCircle2, XCircle } from "lucide-react";
import type { SyntheticConsent } from "../../data/syntheticData";

interface ConsentDetailsModalProps {
  consent: SyntheticConsent | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: "GRANTED" | "REVOKED") => void;
}

export const ConsentDetailsModal: React.FC<ConsentDetailsModalProps> = ({
  consent,
  onClose,
  onUpdateStatus,
}) => {
  if (!consent) return null;

  return (
    <Dialog
      isOpen={Boolean(consent)}
      onClose={onClose}
      title="ABDM Electronic Consent Artefact"
      description={`Consent Artefact ID: ${consent.id} • HIU Request`}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Dismiss
          </Button>
          {consent.status === "PENDING" && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={() => {
                onUpdateStatus(consent.id, "GRANTED");
                onClose();
              }}
            >
              Grant Consent
            </Button>
          )}
          {consent.status === "GRANTED" && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              onClick={() => {
                onUpdateStatus(consent.id, "REVOKED");
                onClose();
              }}
            >
              Revoke Consent
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 text-xs text-[#5C574F] font-editorial-sans">
        {/* Status header */}
        <div className="flex items-center justify-between p-4 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-white border border-[#D5CEC2] flex items-center justify-center text-[#57477D] shadow-2xs">
              <Building2 className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="font-semibold text-[#191817] block text-xs">{consent.requester}</span>
              <span className="text-[10px] text-[#7A746B] font-mono">{consent.hiuType}</span>
            </div>
          </div>
          <Badge
            variant={
              consent.status === "GRANTED"
                ? "success"
                : consent.status === "PENDING"
                ? "warning"
                : "danger"
            }
            size="md"
            dot
          >
            {consent.status}
          </Badge>
        </div>

        {/* Purpose */}
        <div>
          <span className="font-semibold text-[#191817] uppercase tracking-wider text-[10px] font-mono block mb-1">
            Care Purpose &amp; Justification
          </span>
          <p className="p-3.5 bg-white border border-[#EAE4D9] rounded-none text-[#5C574F] leading-relaxed shadow-2xs">
            {consent.purpose}
          </p>
        </div>

        {/* Scope and Date Ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FAF7F2] rounded-none border border-[#EAE4D9]">
          <div>
            <span className="text-[#7A746B] block text-[10px] uppercase font-mono font-semibold">Data Scope (FHIR)</span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {consent.dataTypes.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-white border border-[#EAE4D9] rounded-none text-[10px] font-mono text-[#57477D] font-bold">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[#7A746B] block text-[10px] uppercase font-mono font-semibold">Consent Validity</span>
            <span className="text-[#191817] font-semibold block mt-1.5 font-mono">
              {consent.expiresAt}
            </span>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2.5 p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none text-[#5C574F]">
          <ShieldCheck className="w-4 h-4 text-[#4E8C78] shrink-0" />
          <span className="text-[11px] leading-tight">
            Consent is governed by NDHM Consent Management Protocol. You retain complete right to revoke consent at any moment.
          </span>
        </div>
      </div>
    </Dialog>
  );
};
