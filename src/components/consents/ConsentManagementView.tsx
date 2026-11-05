import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "../ui/PageHeader";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import {
  ShieldCheck,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  History,
  Building2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchConsents,
  createConsentRequest,
  approveConsent,
  denyConsent,
  revokeConsent,
  fetchConsentHistory,
  fetchDiscoverablePatients,
} from "../../api/client";
import type {
  ConsentItem,
  ConsentDecision,
  DiscoverablePatient,
} from "../../types/api";

const ALL_HI_TYPES = [
  { id: "DiagnosticReport", label: "Diagnostic Reports (Lab & Pathology)" },
  { id: "Observation", label: "Clinical Observations & Vitals" },
  { id: "MedicationRequest", label: "Medication Requests & Prescriptions" },
  { id: "MedicationDispense", label: "Pharmacy Dispensation History" },
  { id: "Encounter", label: "Clinical Encounters & Doctor Notes" },
  { id: "Immunization", label: "Vaccination & Immunization Records" },
  { id: "DocumentReference", label: "Clinical Document References" },
];

export const ConsentManagementView: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Consents data state
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Selected consent for actions
  const [selectedConsent, setSelectedConsent] = useState<ConsentItem | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<ConsentDecision[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Patient review state (custom approved categories)
  const [selectedApprovedTypes, setSelectedApprovedTypes] = useState<string[]>([]);
  const [actionNote, setActionNote] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Doctor request form state
  const [discoverablePatients, setDiscoverablePatients] = useState<DiscoverablePatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [requestPurpose, setRequestPurpose] = useState<string>("Cardiology Evaluation and Longitudinal Management");
  const [requestHiTypes, setRequestHiTypes] = useState<string[]>([
    "DiagnosticReport",
    "Observation",
    "Encounter",
  ]);
  const [requestDateFrom, setRequestDateFrom] = useState<string>("2026-01-01");
  const [requestDateTo, setRequestDateTo] = useState<string>("2026-12-31");
  const [requestValidityDays, setRequestValidityDays] = useState<number>(30);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Load consents from backend
  const loadConsents = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsents();
      setConsents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load consent artefacts");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  // Load discoverable patients for doctor
  useEffect(() => {
    if (user?.role === "doctor") {
      fetchDiscoverablePatients()
        .then((pts) => {
          setDiscoverablePatients(pts);
          if (pts.length > 0 && !selectedPatientId) {
            setSelectedPatientId(pts[0].id);
          }
        })
        .catch(() => {});
    }
  }, [user, selectedPatientId]);

  // Tab counts
  const counts = useMemo(() => {
    const res = { ALL: consents.length, PENDING: 0, APPROVED: 0, DENIED: 0, REVOKED: 0, EXPIRED: 0 };
    const now = new Date();
    consents.forEach((c) => {
      const isPast = new Date(c.expiresAt) <= now;
      if (c.status === "PENDING" || c.status === "REQUESTED") {
        res.PENDING++;
      } else if (c.status === "APPROVED" || c.status === "GRANTED") {
        if (isPast) res.EXPIRED++;
        else res.APPROVED++;
      } else if (c.status === "DENIED") {
        res.DENIED++;
      } else if (c.status === "REVOKED") {
        res.REVOKED++;
      } else if (c.status === "EXPIRED" || isPast) {
        res.EXPIRED++;
      }
    });
    return res;
  }, [consents]);

  // Filtered consents
  const filteredConsents = useMemo(() => {
    const now = new Date();
    if (activeTab === "ALL") return consents;
    return consents.filter((c) => {
      const isPast = new Date(c.expiresAt) <= now;
      if (activeTab === "PENDING") return c.status === "PENDING" || c.status === "REQUESTED";
      if (activeTab === "APPROVED") return (c.status === "APPROVED" || c.status === "GRANTED") && !isPast;
      if (activeTab === "DENIED") return c.status === "DENIED";
      if (activeTab === "REVOKED") return c.status === "REVOKED";
      if (activeTab === "EXPIRED") return c.status === "EXPIRED" || isPast;
      return true;
    });
  }, [consents, activeTab]);

  // Open review modal for patient
  const handleOpenReview = (consent: ConsentItem) => {
    setSelectedConsent(consent);
    setSelectedApprovedTypes(consent.hiTypes);
    setActionNote("");
    setIsReviewModalOpen(true);
  };

  // Open revoke modal for patient
  const handleOpenRevoke = (consent: ConsentItem) => {
    setSelectedConsent(consent);
    setActionNote("");
    setIsRevokeModalOpen(true);
  };

  // Open history modal
  const handleOpenHistory = async (consent: ConsentItem) => {
    setSelectedConsent(consent);
    setHistoryLoading(true);
    setIsHistoryModalOpen(true);
    try {
      const hist = await fetchConsentHistory(consent.consentId);
      setDecisionHistory(hist);
    } catch {
      setDecisionHistory(consent.decisionHistory || []);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Execute approval
  const handleApprove = async () => {
    if (!selectedConsent) return;
    setActionLoading(true);
    try {
      await approveConsent(selectedConsent.consentId, {
        approvedHiTypes: selectedApprovedTypes,
        note: actionNote.trim() || undefined,
      });
      setIsReviewModalOpen(false);
      await loadConsents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve consent.");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute denial
  const handleDeny = async () => {
    if (!selectedConsent) return;
    setActionLoading(true);
    try {
      await denyConsent(selectedConsent.consentId, actionNote.trim() || undefined);
      setIsReviewModalOpen(false);
      await loadConsents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deny consent.");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute revocation
  const handleRevoke = async () => {
    if (!selectedConsent) return;
    setActionLoading(true);
    try {
      await revokeConsent(selectedConsent.consentId, actionNote.trim() || undefined);
      setIsRevokeModalOpen(false);
      await loadConsents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke consent.");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute doctor consent request creation
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setRequestError("Please select a target patient.");
      return;
    }
    if (requestHiTypes.length === 0) {
      setRequestError("Select at least one health record category.");
      return;
    }
    setRequestLoading(true);
    setRequestError(null);

    try {
      const expiresAt = new Date(Date.now() + requestValidityDays * 24 * 60 * 60 * 1000).toISOString();
      await createConsentRequest({
        patientId: selectedPatientId,
        purpose: requestPurpose.trim(),
        hiTypes: requestHiTypes,
        dateRangeFrom: new Date(requestDateFrom).toISOString(),
        dateRangeTo: new Date(requestDateTo).toISOString(),
        expiresAt,
      });

      setIsRequestModalOpen(false);
      await loadConsents();
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Failed to create consent request.");
    } finally {
      setRequestLoading(false);
    }
  };

  const [requestLoading, setRequestLoading] = useState(false);

  // Status badge styling helper
  const renderStatusBadge = (consent: ConsentItem) => {
    const isPast = new Date(consent.expiresAt) <= new Date();
    if (isPast && (consent.status === "APPROVED" || consent.status === "GRANTED" || consent.status === "EXPIRED")) {
      return <Badge variant="neutral" size="sm">Expired</Badge>;
    }
    switch (consent.status) {
      case "PENDING":
      case "REQUESTED":
        return <Badge variant="warning" size="sm">Pending Approval</Badge>;
      case "APPROVED":
      case "GRANTED":
        return <Badge variant="success" size="sm">Active (Approved)</Badge>;
      case "DENIED":
        return <Badge variant="danger" size="sm">Denied</Badge>;
      case "REVOKED":
        return <Badge variant="neutral" size="sm">Revoked</Badge>;
      case "EXPIRED":
        return <Badge variant="neutral" size="sm">Expired</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{consent.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consent Management"
        description="Manage clinical record access permissions, review practitioner requests, and revoke data access anytime."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
              onClick={loadConsents}
              disabled={loading}
            >
              Refresh
            </Button>
            {user?.role === "doctor" && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setRequestError(null);
                  setIsRequestModalOpen(true);
                }}
              >
                Request Patient Consent
              </Button>
            )}
          </div>
        }
      />

      {/* Role Context Notification Banner */}
      {user?.role === "patient" && (
        <div className="p-3.5 bg-white border border-[#EAE4D9] flex items-center justify-between gap-3 text-xs text-[#191817]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#57477D] shrink-0" />
            <span className="text-[#5C574F]">
              Your health data is protected. Healthcare providers can only access records with your active, explicit consent.
            </span>
          </div>
        </div>
      )}

      {user?.role === "doctor" && (
        <div className="p-3.5 bg-white border border-[#EAE4D9] flex items-center gap-2.5 text-xs text-[#5C574F]">
          <Lock className="w-4 h-4 text-[#57477D] shrink-0" />
          <span>
            Consent requests sent to patients must be approved before medical records become accessible.
          </span>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Governance metadata access only. Administrators cannot approve or revoke patient consents.
          </span>
        </div>
      )}

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-1.5 border-b border-[#EAE4D9] overflow-x-auto pb-1 text-xs">
        {[
          { key: "ALL", label: "All Consents", count: counts.ALL },
          { key: "PENDING", label: "Pending", count: counts.PENDING },
          { key: "APPROVED", label: "Active", count: counts.APPROVED },
          { key: "DENIED", label: "Denied", count: counts.DENIED },
          { key: "REVOKED", label: "Revoked", count: counts.REVOKED },
          { key: "EXPIRED", label: "Expired", count: counts.EXPIRED },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-none font-medium transition-colors cursor-pointer shrink-0 border-b-2 -mb-1 ${
              activeTab === tab.key
                ? "border-[#1A1918] text-[#1A1918] bg-white font-semibold shadow-none"
                : "border-transparent text-[#69655E] hover:text-[#1A1918] hover:bg-[#FAF7F2]/60"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-none text-[10px] font-mono ${
                  activeTab === tab.key
                    ? "bg-[#FAF7F2] text-[#57477D] border border-[#EAE4D9] font-bold"
                    : "bg-[#FAF7F2] text-[#8C877D] border border-[#EAE4D9]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Consent Cards List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#69655E] flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-[#57477D] animate-spin" />
          <span>Loading consent permissions...</span>
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50/50 rounded-none shadow-none">
          <CardContent className="p-6 text-center text-xs text-red-700">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={loadConsents}>
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      ) : filteredConsents.length === 0 ? (
        <EmptyState
          title={activeTab === "ALL" ? "No Consents Found" : `No ${activeTab.toLowerCase()} consents found`}
          description={
            user?.role === "patient"
              ? activeTab === "ALL"
                ? "You have no active consent requests or data sharing permissions. When a hospital or physician requests record access, it will appear here for your approval."
                : "No consent requests match this status filter."
              : "No practitioner consent artifacts exist under this category."
          }
          icon={<ShieldCheck className="w-5 h-5 text-[#57477D]" />}
          action={
            user?.role === "doctor" ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsRequestModalOpen(true)}
              >
                Request Consent
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredConsents.map((consent) => {
            const isPending = consent.status === "PENDING" || consent.status === "REQUESTED";
            const isActive =
              (consent.status === "APPROVED" || consent.status === "GRANTED") &&
              new Date(consent.expiresAt) > new Date();

            return (
              <Card
                key={consent.consentId}
                className="hover:border-[#D5CEC2] transition-all shadow-none overflow-hidden rounded-none border-[#EAE4D9]"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Header line: ID, Status, Version */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#1A1918] bg-[#FAF7F2] px-2.5 py-1 rounded-none border border-[#EAE4D9]">
                        {consent.consentId}
                      </span>
                      {renderStatusBadge(consent)}
                      <span className="text-[11px] text-[#8C877D] font-mono">
                        v{consent.version || 1}
                      </span>
                    </div>

                    {/* Purpose */}
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1918] flex items-center gap-2 font-editorial-serif">
                        <span>{consent.purpose}</span>
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#5C574F]">
                        <span className="flex items-center gap-1 font-medium text-[#1A1918]">
                          <Building2 className="w-3.5 h-3.5 text-[#8C877D]" />
                          {consent.requesterFacility}
                        </span>
                        <span>•</span>
                        <span>
                          Doctor:{" "}
                          <strong className="text-[#1A1918]">
                            {typeof consent.requesterDoctorId === "object"
                              ? consent.requesterDoctorId.name
                              : "Dr. Ananya Sharma"}
                          </strong>
                        </span>
                        {typeof consent.patientId === "object" && user?.role === "doctor" && (
                          <>
                            <span>•</span>
                            <span>
                              Patient: <strong className="text-[#1A1918]">{consent.patientId.name}</strong> (
                              {consent.patientId.abhaAddress})
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Categories Pills */}
                    <div>
                      <span className="text-[11px] text-[#69655E] uppercase tracking-wider block mb-1.5 font-semibold font-mono">
                        {consent.approvedHiTypes && consent.approvedHiTypes.length > 0
                          ? "Approved Categories:"
                          : "Requested Categories:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(consent.approvedHiTypes && consent.approvedHiTypes.length > 0
                          ? consent.approvedHiTypes
                          : consent.hiTypes
                        ).map((cat) => (
                          <span
                            key={cat}
                            className="px-2.5 py-0.5 rounded-none text-[11px] font-medium bg-[#FAF7F2] text-[#1A1918] border border-[#EAE4D9]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Date bounds & Expiry */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#69655E] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8C877D]" />
                        <span>
                          Record Range:{" "}
                          <strong className="text-[#1A1918] font-mono">
                            {new Date(consent.dateRangeFrom).toLocaleDateString()}
                          </strong>{" "}
                          to{" "}
                          <strong className="text-[#1A1918] font-mono">
                            {new Date(consent.dateRangeTo).toLocaleDateString()}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8C877D]" />
                        <span>
                          Valid until:{" "}
                          <strong
                            className={
                              new Date(consent.expiresAt) <= new Date()
                                ? "text-red-700 font-mono"
                                : "text-[#1A1918] font-mono"
                            }
                          >
                            {new Date(consent.expiresAt).toLocaleDateString()}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EAE4D9]">
                    {/* Patient Actions */}
                    {user?.role === "patient" && isPending && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenReview(consent)}
                        className="w-full md:w-auto"
                      >
                        Review Request
                      </Button>
                    )}

                    {user?.role === "patient" && isActive && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenRevoke(consent)}
                        className="w-full md:w-auto"
                      >
                        Revoke Access
                      </Button>
                    )}

                    {/* Timeline History */}
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<History className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenHistory(consent)}
                      className="w-full md:w-auto text-xs"
                    >
                      Audit Trail
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Patient Review & Decision Dialog */}
      {selectedConsent && (
        <Dialog
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Review Electronic Consent Request"
          description="Examine the requesting healthcare practitioner's purpose and choose whether to approve or deny access."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeny}
                disabled={actionLoading}
              >
                Deny Request
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  disabled={actionLoading || selectedApprovedTypes.length === 0}
                >
                  {actionLoading ? "Processing..." : "Approve Selected Scope"}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Requester Info */}
            <div className="p-3.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#69655E]">Requesting Doctor:</span>
                <span className="font-bold text-[#1A1918]">
                  {typeof selectedConsent.requesterDoctorId === "object"
                    ? selectedConsent.requesterDoctorId.name
                    : "Dr. Ananya Sharma"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69655E]">Facility:</span>
                <span className="font-medium text-[#1A1918]">{selectedConsent.requesterFacility}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69655E]">Clinical Purpose:</span>
                <span className="font-semibold text-[#57477D] font-editorial-serif">{selectedConsent.purpose}</span>
              </div>
            </div>

            {/* Granular Scope Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1A1918] block font-mono uppercase tracking-wider text-[11px]">
                  Permitted Record Categories (Granular Control)
                </label>
                <span className="text-[11px] text-[#8C877D]">
                  You can deselect any categories you do not wish to disclose.
                </span>
              </div>
              <div className="space-y-2 border border-[#EAE4D9] rounded-none p-3 bg-white">
                {selectedConsent.hiTypes.map((type) => {
                  const isChecked = selectedApprovedTypes.includes(type);
                  return (
                    <label
                      key={type}
                      className="flex items-center justify-between p-2 rounded-none hover:bg-[#FAF7F2] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedApprovedTypes((prev) => [...prev, type]);
                            } else {
                              setSelectedApprovedTypes((prev) => prev.filter((t) => t !== type));
                            }
                          }}
                          className="rounded-none text-[#1A1918] focus:ring-[#1A1918]"
                        />
                        <span className="font-medium text-[#1A1918]">{type}</span>
                      </div>
                      <Badge variant={isChecked ? "purple" : "neutral"} size="sm">
                        {isChecked ? "Permitted" : "Excluded"}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Date bounds */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none">
              <div>
                <span className="text-[#69655E] block mb-0.5 font-mono text-[11px]">Records Date Range:</span>
                <span className="font-semibold text-[#1A1918] font-mono">
                  {new Date(selectedConsent.dateRangeFrom).toLocaleDateString()} to{" "}
                  {new Date(selectedConsent.dateRangeTo).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[#69655E] block mb-0.5 font-mono text-[11px]">Access Expiry:</span>
                <span className="font-semibold text-[#57477D] font-mono">
                  {new Date(selectedConsent.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Optional note */}
            <div>
              <label className="font-medium text-[#1A1918] block mb-1 font-mono uppercase tracking-wider text-[11px]">
                Decision Note / Remarks (Optional)
              </label>
              <Input
                placeholder="e.g. Approved for cardiology evaluation only."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* MODAL 2: Patient Revoke Consent Dialog */}
      {selectedConsent && (
        <Dialog
          isOpen={isRevokeModalOpen}
          onClose={() => setIsRevokeModalOpen(false)}
          title="Revoke Electronic Consent"
          description="Immediately terminate practitioner access to your health records."
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRevokeModalOpen(false)}
                disabled={actionLoading}
              >
                Keep Active
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRevoke}
                disabled={actionLoading}
              >
                {actionLoading ? "Revoking..." : "Confirm Revocation"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-none text-red-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                Permanent Revocation Notice
              </span>
              <p className="leading-relaxed">
                Revoking consent takes effect <strong>immediately</strong> on the backend DAL.
                Subsequent API requests by the doctor will receive an HTTP 403 authorization error.
                Records already lawfully downloaded prior to revocation cannot be erased.
              </p>
            </div>

            <div>
              <label className="font-medium text-[#1A1918] block mb-1 font-mono uppercase tracking-wider text-[11px]">
                Reason for Revocation (Recorded in Audit Trail)
              </label>
              <Input
                placeholder="e.g. Treatment completed or consultation concluded."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* MODAL 3: Audit Trail & Decision History Dialog */}
      {selectedConsent && (
        <Dialog
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Consent Audit Trail (${selectedConsent.consentId})`}
          description="Verifiable lifecycle timeline of electronic requests, decisions, and revocations."
          maxWidth="md"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            {historyLoading ? (
              <div className="py-8 text-center text-[#69655E]">Loading audit history...</div>
            ) : decisionHistory.length === 0 ? (
              <div className="py-8 text-center text-[#69655E]">No decision events recorded.</div>
            ) : (
              <div className="divide-y divide-[#EAE4D9]">
                {decisionHistory.map((entry, idx) => (
                  <div key={idx} className="py-3 flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-none flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px] ${
                        entry.action === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : entry.action === "DENIED"
                          ? "bg-red-100 text-red-800"
                          : entry.action === "REVOKED"
                          ? "bg-[#FAF7F2] text-[#1A1918] border border-[#EAE4D9]"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      <History className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#1A1918] font-mono">{entry.action}</span>
                        <span className="text-[10px] text-[#69655E] font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[#5C574F] mt-0.5">
                        Actor: <strong className="text-[#1A1918]">{entry.actorName}</strong> ({entry.actorRole})
                      </p>
                      {entry.note && (
                        <p className="text-[#5C574F] italic mt-1 bg-[#FAF7F2] p-2 rounded-none border border-[#EAE4D9]">
                          &quot;{entry.note}&quot;
                        </p>
                      )}
                      {entry.approvedHiTypes && entry.approvedHiTypes.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {entry.approvedHiTypes.map((t) => (
                            <span key={t} className="px-1.5 py-0.2 bg-[#FAF7F2] text-[#57477D] border border-[#EAE4D9] rounded-none text-[10px] font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedConsent.signature && (
              <div className="p-2.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none font-mono text-[10px] text-[#69655E] break-all">
                <span className="font-bold block text-[#1A1918]">Digital Consent Signature:</span>
                {selectedConsent.signature}
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* MODAL 4: Doctor Request Consent Form Dialog */}
      <Dialog
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Patient Electronic Consent"
        description="Specify patient, clinical purpose, required FHIR resource categories, and validity."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRequestModalOpen(false)}
              disabled={requestLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateRequest}
              disabled={requestLoading}
            >
              {requestLoading ? "Submitting Request..." : "Submit Consent Request"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          {requestError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-none text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{requestError}</span>
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label className="font-bold text-[#1A1918] block mb-1 font-mono uppercase tracking-wider text-[11px]">
              Target Patient (ABDM Authorized Discovery)
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-[#D5CEC2] rounded-none text-xs bg-[#FAF7F2] text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
              required
            >
              {discoverablePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.abhaAddress} • {p.abhaId})
                </option>
              ))}
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label className="font-bold text-[#1A1918] block mb-1 font-mono uppercase tracking-wider text-[11px]">Purpose of Access</label>
            <Input
              value={requestPurpose}
              onChange={(e) => setRequestPurpose(e.target.value)}
              placeholder="e.g. Cardiology Consultation & Telemetry Follow-up"
              required
            />
          </div>

          {/* Resource Categories Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#1A1918] block font-mono uppercase tracking-wider text-[11px]">Requested Resource Categories</label>
              <button
                type="button"
                onClick={() => {
                  if (requestHiTypes.length === ALL_HI_TYPES.length) {
                    setRequestHiTypes([]);
                  } else {
                    setRequestHiTypes(ALL_HI_TYPES.map((t) => t.id));
                  }
                }}
                className="text-[11px] text-[#57477D] hover:underline cursor-pointer font-mono"
              >
                {requestHiTypes.length === ALL_HI_TYPES.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-[#EAE4D9] rounded-none p-3 bg-[#FAF7F2]">
              {ALL_HI_TYPES.map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestHiTypes.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRequestHiTypes((prev) => [...prev, t.id]);
                      } else {
                        setRequestHiTypes((prev) => prev.filter((id) => id !== t.id));
                      }
                    }}
                    className="rounded-none text-[#1A1918] focus:ring-[#1A1918]"
                  />
                  <span className="text-[#1A1918]">{t.id}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Record Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#1A1918] block mb-1 font-mono uppercase tracking-wider text-[11px]">Record Date From</label>
              <Input
                type="date"
                value={requestDateFrom}
                onChange={(e) => setRequestDateFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-bold text-[#1A1918] block mb-1 font-mono uppercase tracking-wider text-[11px]">Record Date To</label>
              <Input
                type="date"
                value={requestDateTo}
                onChange={(e) => setRequestDateTo(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Validity Duration */}
          <div>
            <label className="font-bold text-[#1A1918] block mb-1 font-mono uppercase tracking-wider text-[11px]">
              Consent Validity Duration: <strong>{requestValidityDays} days</strong>
            </label>
            <div className="flex gap-2">
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setRequestValidityDays(d)}
                  className={`px-3 py-1.5 rounded-none border text-xs font-semibold cursor-pointer ${
                    requestValidityDays === d
                      ? "bg-[#1A1918] text-white border-[#1A1918]"
                      : "bg-[#FAF7F2] text-[#69655E] border-[#D5CEC2] hover:bg-[#EAE4D9]"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-none text-[#5C574F] flex items-start gap-2">
            <Lock className="w-4 h-4 text-[#57477D] shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Submitting this request does <strong>not</strong> grant immediate access. A pending consent
              artifact will be placed in the patient’s inbox for verification and approval.
            </p>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
