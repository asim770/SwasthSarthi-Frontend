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
      <div className="space-y-4 text-xs text-[#475569]">
        {/* Status header */}
        <div className="flex items-center justify-between p-3.5 bg-[#f0fdfa] border border-[#d7eaea] rounded-[14px]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#d7eaea] flex items-center justify-center text-[#008080]">
              <Building2 className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <span className="font-semibold text-[#172033] block text-xs">{consent.requester}</span>
              <span className="text-[10px] text-[#64748b]">{consent.hiuType}</span>
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
          <span className="font-semibold text-[#172033] uppercase tracking-wider text-[10px] block mb-1">
            Care Purpose &amp; Justification
          </span>
          <p className="p-3 bg-white border border-[#d7eaea] rounded-[12px] text-[#475569] leading-relaxed shadow-2xs">
            {consent.purpose}
          </p>
        </div>

        {/* Scope and Date Ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#f0fdfa] rounded-[14px] border border-[#d7eaea]">
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-semibold">Data Scope (FHIR)</span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {consent.dataTypes.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-white border border-[#d7eaea] rounded-[6px] text-[10px] font-mono text-[#004c4c]">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-semibold">Consent Validity</span>
            <span className="text-[#172033] font-medium block mt-1.5">
              {consent.expiresAt}
            </span>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2.5 p-3 bg-[#f0fdfa] border border-[#d7eaea] rounded-[12px] text-[#004c4c]">
          <ShieldCheck className="w-4 h-4 text-[#008080] shrink-0" />
          <span className="text-[11px] leading-tight">
            Consent is governed by NDHM Consent Management Protocol. You retain complete right to revoke consent at any moment.
          </span>
        </div>
      </div>
    </Dialog>
  );
};
