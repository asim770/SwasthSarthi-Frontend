import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  initiateAbdmTransfer,
  fetchCareContexts,
  fetchTransferStatus,
} from "../../api/client";
import type { CareContextItem, HealthTransferReport, ConsentItem } from "../../types/api";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  activeConsent?: ConsentItem | null;
  onTransferSuccess: () => void;
}

const PARTICIPATING_HIPS = [
  {
    id: "HIP-MAX-001",
    name: "Max Super Speciality Hospital, Saket",
    type: "Hospital",
    city: "New Delhi",
    speciality: "Inpatient Cardiology, Metabolic Panel & Discharge Summaries",
  },
  {
    id: "HIP-APOLLO-002",
    name: "Apollo Clinics, Indiranagar",
    type: "Clinic",
    city: "Bengaluru",
    speciality: "Cardiology Consultations, Blood Pressure Observations & Prescriptions",
  },
  {
    id: "HIP-LAL-003",
    name: "Dr. Lal PathLabs Central Reference Lab",
    type: "Laboratory",
    city: "New Delhi",
    speciality: "Glycated Hemoglobin (HbA1c), Biochemistry & Referral ServiceRequests",
  },
  {
    id: "HIP-FORTIS-004",
    name: "Fortis Hospital, Bannerghatta Road",
    type: "Multi-Speciality",
    city: "Bengaluru",
    speciality: "Preventive Immunizations & Pharmacy Medication Dispenses",
  },
];

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  activeConsent,
  onTransferSuccess,
}) => {
  const [selectedHipId, setSelectedHipId] = useState<string>("HIP-MAX-001");
  const [careContexts, setCareContexts] = useState<CareContextItem[]>([]);
  const [loadingContexts, setLoadingContexts] = useState<boolean>(false);
  const [transferring, setTransferring] = useState<boolean>(false);
  const [transferResult, setTransferResult] = useState<HealthTransferReport | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !patientId) return;

    let mounted = true;
    setLoadingContexts(true);
    setTransferResult(null);
    setTransferError(null);

    fetchCareContexts(patientId)
      .then((data) => {
        if (mounted) setCareContexts(data);
      })
      .catch((err) => {
        if (mounted) {
          console.warn("Could not load care contexts:", err);
        }
      })
      .finally(() => {
        if (mounted) setLoadingContexts(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, patientId]);

  const handleStartTransfer = async () => {
    if (!activeConsent) {
      setTransferError("Active electronic consent is required before initiating an ABDM transfer.");
      return;
    }

    setTransferring(true);
    setTransferError(null);
    setTransferResult(null);

    try {
      const report = await initiateAbdmTransfer({
        consentId: activeConsent.consentId,
        patientId,
        hipId: selectedHipId,
        requestedHiTypes: activeConsent.approvedHiTypes.length > 0
          ? activeConsent.approvedHiTypes
          : activeConsent.hiTypes,
        dateRangeFrom: activeConsent.dateRangeFrom,
        dateRangeTo: activeConsent.dateRangeTo,
      });

      setTransferResult(report);

      // If already transferred (synchronous or fast async)
      if (report.status === "TRANSFERRED") {
        onTransferSuccess();
      } else if (report.status === "REQUESTED" || report.status === "PROCESSING") {
        // Poll once for status update
        setTimeout(async () => {
          try {
            const updated = await fetchTransferStatus(report.transferId);
            setTransferResult(updated);
            if (updated.status === "TRANSFERRED") {
              onTransferSuccess();
            }
          } catch {
            // keep existing status
          }
        }, 1500);
      }
    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : "Failed to initiate ABDM health data transfer."
      );
    } finally {
      setTransferring(false);
    }
  };

  const selectedHip = PARTICIPATING_HIPS.find((h) => h.id === selectedHipId);
  const relevantContexts = careContexts.filter((c) => c.institutionId === selectedHipId);

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onClose}>
        Close
      </Button>
      <Button
        variant="primary"
        size="sm"
        disabled={transferring || !activeConsent}
        leftIcon={
          transferring ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowRightLeft className="w-3.5 h-3.5" />
          )
        }
        onClick={handleStartTransfer}
      >
        {transferring ? "Exchanging Records..." : "Execute ABDM Exchange"}
      </Button>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="ABDM Health Data Exchange (Mock Gateway)"
      description="Simulate a secure, consent-authorized health data exchange from participating Health Information Providers (HIPs) into this clinical session."
      footer={footer}
      maxWidth="xl"
    >
      <div className="space-y-4 py-1">
        {/* Active Consent Context Banner */}
        {activeConsent ? (
          <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-teal-900">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Authorized under Consent #{activeConsent.consentId}</span>
              </div>
              <Badge variant="success" size="sm">ACTIVE & VALID</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 text-[11px]">
              <div>
                <span className="text-slate-400">Permitted Categories: </span>
                <strong>
                  {(activeConsent.approvedHiTypes.length > 0
                    ? activeConsent.approvedHiTypes
                    : activeConsent.hiTypes
                  ).join(", ")}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Date Range: </span>
                <strong>
                  {new Date(activeConsent.dateRangeFrom).toLocaleDateString()} –{" "}
                  {new Date(activeConsent.dateRangeTo).toLocaleDateString()}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Warning:</strong> No active consent detected for patient <strong>{patientName}</strong>. Transfers require patient consent approval.
            </span>
          </div>
        )}

        {/* Select Originating Institution */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-2">
            Select Originating Institution (Mock HIP Source System):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PARTICIPATING_HIPS.map((hip) => (
              <button
                key={hip.id}
                type="button"
                onClick={() => setSelectedHipId(hip.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedHipId === hip.id
                    ? "border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-500"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">{hip.name}</span>
                  <Badge variant={selectedHipId === hip.id ? "teal" : "neutral"} size="sm">
                    {hip.type}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mb-2">
                  {hip.speciality}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{hip.city}</span>
                  <span className="font-mono">{hip.id}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Discovered Care Contexts for Selected Institution */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-800">
              Discovered Care Contexts at {selectedHip?.name}:
            </span>
            {loadingContexts && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                Discovering care contexts...
              </span>
            )}
          </div>

          {relevantContexts.length > 0 ? (
            <div className="space-y-2">
              {relevantContexts.map((ctx) => (
                <div
                  key={ctx.careContextId}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>{ctx.description}</span>
                      <code className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                        {ctx.careContextId}
                      </code>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {ctx.resourceCount} records ({ctx.availableHiTypes.join(", ")})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {ctx.earliestDate} – {ctx.latestDate}
                      </span>
                    </div>
                  </div>
                  <Badge variant="teal" size="sm">Ready for Exchange</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
              {loadingContexts
                ? "Probing simulated ABDM network..."
                : `Care contexts registered under ${selectedHipId} for ${patientName}.`}
            </div>
          )}
        </div>

        {/* Error Message */}
        {transferError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{transferError}</span>
          </div>
        )}

        {/* Transfer Result Banner */}
        {transferResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            transferResult.status === "TRANSFERRED"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : transferResult.status === "FAILED"
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                {transferResult.status === "TRANSFERRED" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : transferResult.status === "FAILED" ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                )}
                <span>
                  Transfer Status: {transferResult.status}
                </span>
              </div>
              <Badge
                variant={
                  transferResult.status === "TRANSFERRED"
                    ? "success"
                    : transferResult.status === "FAILED"
                    ? "danger"
                    : "teal"
                }
                size="sm"
              >
                Job #{transferResult.transferId}
              </Badge>
            </div>

            {transferResult.status === "TRANSFERRED" && (
              <p className="text-[11px] leading-relaxed">
                Successfully exchanged <strong>{transferResult.recordCount}</strong> FHIR R4 clinical records from <strong>{transferResult.hipName}</strong>. Bundle validated and cached under 24h retention policy.
              </p>
            )}

            {transferResult.status === "FAILED" && (
              <p className="text-[11px] text-red-700">
                {transferResult.failureReason || "Exchange request aborted by security controls."}
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};
