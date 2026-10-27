import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Search,
  History,
  FileKey,
  Info,
} from "lucide-react";
import {
  fetchInstitutions,
  registerInstitution,
  reviewInstitution,
  fetchPractitionerVerifications,
  reviewPractitioner,
  verifyAuditChain,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type {
  FacilityItem,
  FacilityType,
  FacilityStatus,
  PractitionerVerificationItem,
  AuditChainVerificationReport,
} from "../../types/api";

export function AdminManagementView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"institutions" | "practitioners" | "audit">("institutions");

  // Institutions State
  const [institutions, setInstitutions] = useState<FacilityItem[]>([]);
  const [instLoading, setInstLoading] = useState(false);
  const [instStatusFilter, setInstStatusFilter] = useState<string>("ALL");
  const [instTypeFilter, setInstTypeFilter] = useState<string>("ALL");
  const [instSearch, setInstSearch] = useState("");
  const [selectedFacilityHistory, setSelectedFacilityHistory] = useState<FacilityItem | null>(null);

  // New Institution Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newInstName, setNewInstName] = useState("");
  const [newInstType, setNewInstType] = useState<FacilityType>("HOSPITAL");
  const [newInstPhone, setNewInstPhone] = useState("+91-11-23000000");
  const [newInstEmail, setNewInstEmail] = useState("");
  const [newInstCity, setNewInstCity] = useState("New Delhi");
  const [newInstHfrId, setNewInstHfrId] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  // Practitioners State
  const [practitioners, setPractitioners] = useState<PractitionerVerificationItem[]>([]);
  const [practLoading, setPractLoading] = useState(false);
  const [practStatusFilter, setPractStatusFilter] = useState<string>("ALL");
  const [practRoleFilter, setPractRoleFilter] = useState<string>("ALL");
  const [practSearch, setPractSearch] = useState("");

  // Decision Modal State
  const [reviewTarget, setReviewTarget] = useState<{
    type: "institution" | "practitioner";
    id: string;
    name: string;
    currentStatus: string;
  } | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVE" | "REJECT" | "SUSPEND">("APPROVE");
  const [reviewReason, setReviewReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Audit Chain Verification State
  const [auditReport, setAuditReport] = useState<AuditChainVerificationReport | null>(null);
  const [verifyingAudit, setVerifyingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Load Institutions
  const loadInstitutions = useCallback(async () => {
    setInstLoading(true);
    try {
      const data = await fetchInstitutions({
        type: instTypeFilter,
        status: instStatusFilter,
        search: instSearch || undefined,
      });
      setInstitutions(data);
    } catch (err) {
      console.error("Failed to load institutions", err);
    } finally {
      setInstLoading(false);
    }
  }, [instTypeFilter, instStatusFilter, instSearch]);

  // Load Practitioners
  const loadPractitioners = useCallback(async () => {
    setPractLoading(true);
    try {
      const data = await fetchPractitionerVerifications({
        role: practRoleFilter,
        status: practStatusFilter,
        search: practSearch || undefined,
      });
      setPractitioners(data);
    } catch (err) {
      console.error("Failed to load practitioners", err);
    } finally {
      setPractLoading(false);
    }
  }, [practRoleFilter, practStatusFilter, practSearch]);

  // Run Audit Chain Verification
  const runAuditVerification = useCallback(async () => {
    setVerifyingAudit(true);
    setAuditError(null);
    try {
      const report = await verifyAuditChain();
      setAuditReport(report);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Verification check failed");
    } finally {
      setVerifyingAudit(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "institutions") {
      loadInstitutions();
    } else if (activeTab === "practitioners") {
      loadPractitioners();
    } else if (activeTab === "audit") {
      runAuditVerification();
    }
  }, [activeTab, loadInstitutions, loadPractitioners, runAuditVerification]);

  // Handle Institution Registration
  const handleRegisterInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim()) {
      setRegisterError("Facility name is required");
      return;
    }
    setRegistering(true);
    setRegisterError(null);
    try {
      await registerInstitution({
        name: newInstName.trim(),
        type: newInstType,
        contactPhone: newInstPhone.trim(),
        contactEmail: newInstEmail.trim() || undefined,
        address: { city: newInstCity.trim(), state: "Delhi", pincode: "110001" },
        demoHfrId: newInstHfrId.trim() || undefined,
      });
      setIsRegisterModalOpen(false);
      setNewInstName("");
      setNewInstHfrId("");
      loadInstitutions();
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  // Handle Review Decision Submission
  const handleSubmitReview = async () => {
    if (!reviewTarget) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      if (reviewTarget.type === "institution") {
        await reviewInstitution(reviewTarget.id, {
          decision: reviewDecision,
          reason: reviewReason.trim() || undefined,
        });
        loadInstitutions();
      } else {
        await reviewPractitioner(reviewTarget.id, {
          decision: reviewDecision,
          reason: reviewReason.trim() || undefined,
        });
        loadPractitioners();
      }
      setReviewTarget(null);
      setReviewReason("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Review decision failed");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: FacilityStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            Suspended
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Academic Disclaimers */}
      <div className="bg-white border border-[#d7eaea] rounded-[18px] p-6 shadow-[0_6px_24px_rgba(15,23,42,0.05)] relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0fdfa] text-[#008080] border border-[#b2d8d8] text-xs font-semibold mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            Administrative Trust Boundary &amp; Chain Integrity
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] mb-2">
            Administrator Onboarding &amp; Integrity Ledger
          </h1>
          <p className="text-[#475569] text-sm leading-relaxed mb-4">
            Manage simulated healthcare facilities, review practitioner affiliations, and independently verify the SHA-256 cryptographic audit chain.
          </p>
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-[12px] text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="text-amber-950">Simulated Sandbox Verification:</strong> Verification against the Health Facility Registry (HFR) and Healthcare Professionals Registry (HPR) is executed via a mock academic engine. Suspended or unapproved facilities are strictly barred from clinical exchange. Administrators have zero access to patient clinical contents or FHIR Bundles.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#d7eaea] gap-4">
        <button
          onClick={() => setActiveTab("institutions")}
          className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm transition-colors border-b-2 cursor-pointer ${
            activeTab === "institutions"
              ? "border-[#008080] text-[#008080] font-semibold"
              : "border-transparent text-[#64748b] hover:text-[#172033]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Institutions &amp; Facilities ({institutions.length})
        </button>
        <button
          onClick={() => setActiveTab("practitioners")}
          className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm transition-colors border-b-2 cursor-pointer ${
            activeTab === "practitioners"
              ? "border-[#008080] text-[#008080] font-semibold"
              : "border-transparent text-[#64748b] hover:text-[#172033]"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Practitioners Queue ({practitioners.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm transition-colors border-b-2 cursor-pointer ${
            activeTab === "audit"
              ? "border-[#008080] text-[#008080] font-semibold"
              : "border-transparent text-[#64748b] hover:text-[#172033]"
          }`}
        >
          <FileKey className="w-4 h-4" />
          Audit Chain Cryptographic Verification
        </button>
      </div>

      {/* TAB 1: INSTITUTIONS MANAGEMENT */}
      {activeTab === "institutions" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search facilities..."
                  value={instSearch}
                  onChange={(e) => setInstSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={instTypeFilter}
                onChange={(e) => setInstTypeFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="ALL">All Facility Types</option>
                <option value="HOSPITAL">Hospitals</option>
                <option value="LABORATORY">Laboratories</option>
                <option value="PHARMACY">Pharmacies</option>
                <option value="CLINIC">Clinics</option>
              </select>

              <select
                value={instStatusFilter}
                onChange={(e) => setInstStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={loadInstitutions}
                disabled={instLoading}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`w-4 h-4 ${instLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Register Synthetic Institution
              </button>
            </div>
          </div>

          {/* Institutions Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {instLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                Loading facilities...
              </div>
            ) : institutions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No institutions matching the current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                      <th className="py-3 px-4">Facility Details</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">HFR Mock ID</th>
                      <th className="py-3 px-4">Verification Status</th>
                      <th className="py-3 px-4">Reviewer</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {institutions.map((inst) => (
                      <tr key={inst._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-sm">{inst.name}</div>
                          <div className="text-slate-500 text-[11px] font-mono">ID: {inst.facilityId}</div>
                          {inst.address?.city && (
                            <div className="text-slate-400 text-[10px]">
                              {inst.address.city}, {inst.address.state || "India"}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-100 text-slate-700 uppercase">
                            {inst.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                          {inst.demoHfrId || "HFR-IN-DEMO"}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(inst.status)}
                          {inst.statusReason && (
                            <div className="text-[10px] text-slate-500 mt-1 italic">
                              "{inst.statusReason}"
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {inst.verifiedByName || "—"}
                          {inst.verifiedAt && (
                            <div className="text-[10px] text-slate-400">
                              {new Date(inst.verifiedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedFacilityHistory(inst)}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded text-xs hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Audit History"
                            >
                              <History className="w-3.5 h-3.5" />
                              History
                            </button>
                            <button
                              onClick={() =>
                                setReviewTarget({
                                  type: "institution",
                                  id: inst.facilityId,
                                  name: inst.name,
                                  currentStatus: inst.status,
                                })
                              }
                              className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                              Decide
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRACTITIONERS ONBOARDING QUEUE */}
      {activeTab === "practitioners" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search practitioners..."
                  value={practSearch}
                  onChange={(e) => setPractSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={practRoleFilter}
                onChange={(e) => setPractRoleFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="laboratory">Laboratory Technicians</option>
                <option value="pharmacy">Pharmacists</option>
              </select>

              <select
                value={practStatusFilter}
                onChange={(e) => setPractStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <button
              onClick={loadPractitioners}
              disabled={practLoading}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${practLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Practitioners Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {practLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                Loading practitioners queue...
              </div>
            ) : practitioners.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No practitioners matching the current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                      <th className="py-3 px-4">Practitioner</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Assigned Facility</th>
                      <th className="py-3 px-4">Simulated HPR ID</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4 text-right">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {practitioners.map((doc) => {
                      const isSelf = user?.id === doc._id;
                      return (
                        <tr key={doc._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                              {doc.name}
                              {isSelf && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-normal">
                                  Your Account
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] font-mono">{doc.abhaAddress}</div>
                            {doc.specialization && (
                              <div className="text-slate-400 text-[10px]">{doc.specialization}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-100 text-slate-700 uppercase">
                              {doc.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {doc.facility || "Unassigned"}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 text-xs">
                            {doc.hprId || doc.hfrId || "HPR-IN-DEMO"}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(doc.verificationStatus)}
                            {doc.statusReason && (
                              <div className="text-[10px] text-slate-500 mt-1 italic">
                                "{doc.statusReason}"
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() =>
                                setReviewTarget({
                                  type: "practitioner",
                                  id: doc._id,
                                  name: doc.name,
                                  currentStatus: doc.verificationStatus,
                                })
                              }
                              disabled={isSelf}
                              title={isSelf ? "Self-approval is strictly forbidden" : "Review credentials"}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                                isSelf
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                  : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                              }`}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT CHAIN VERIFICATION */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileKey className="w-5 h-5 text-teal-600" />
                  Append-Only SHA-256 Audit Chain Verification
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Recomputes SHA-256 canonical event hashes sequentially from the genesis record to the active chain head to verify tamper evidence.
                </p>
              </div>
              <button
                onClick={runAuditVerification}
                disabled={verifyingAudit}
                className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${verifyingAudit ? "animate-spin" : ""}`} />
                {verifyingAudit ? "Verifying Hash Chain..." : "Re-Verify Chain Integrity"}
              </button>
            </div>

            {auditError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{auditError}</span>
              </div>
            )}

            {auditReport && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Chain Integrity Status
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {auditReport.valid ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        INTACT & VALID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        TAMPER DETECTED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {auditReport.valid
                      ? "Zero sequence gaps, zero hash discrepancies detected."
                      : auditReport.error || "Chain link mismatch detected."}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Verified Sequential Events
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    {auditReport.totalVerified}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sequence Head: <span className="font-mono font-semibold text-slate-800">#{auditReport.headSequence ?? "0"}</span>
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Last Verified SHA-256 Hash
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 break-all bg-white p-2 rounded border border-slate-200 mt-1">
                    {auditReport.lastEventHash || "N/A"}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Checked at {new Date(auditReport.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-600" />
                Chain Architecture & Immutability Notes
              </div>
              <p>
                • <strong>Genesis Hash:</strong> Initiated with 64-character SHA-256 genesis string (<code>0000000000000000000000000000000000000000000000000000000000000000</code>).
              </p>
              <p>
                • <strong>Atomic Sequence Head:</strong> Chain-head advancement is protected via optimistic CAS concurrency control in MongoDB (<code>AuditChainHead</code>), strictly preventing concurrent events from silently forking the ledger.
              </p>
              <p>
                • <strong>Immutability Boundary:</strong> Application-level Mongoose middleware rejects all <code>updateOne</code>, <code>deleteOne</code>, and replacement queries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER INSTITUTION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Register Synthetic Institution
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {registerError && (
              <div className="my-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterInstitution} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AIIMS Delhi / Fortis Healthcare"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facility Type
                  </label>
                  <select
                    value={newInstType}
                    onChange={(e) => setNewInstType(e.target.value as FacilityType)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="HOSPITAL">Hospital</option>
                    <option value="LABORATORY">Diagnostic Lab</option>
                    <option value="PHARMACY">Pharmacy Store</option>
                    <option value="CLINIC">Polyclinic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newInstCity}
                    onChange={(e) => setNewInstCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newInstPhone}
                    onChange={(e) => setNewInstPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@facility.sbx"
                    value={newInstEmail}
                    onChange={(e) => setNewInstEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Demo HFR Registry ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="IN-HFR-2026-XXXX"
                  value={newInstHfrId}
                  onChange={(e) => setNewInstHfrId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Simulated identifier for academic demonstration only.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 transition-colors shadow-2xs"
                >
                  {registering ? "Registering..." : "Submit Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECISION / REVIEW MODAL */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Review Verification Decision
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reviewing: <strong>{reviewTarget.name}</strong> (Current Status:{" "}
              <span className="font-mono">{reviewTarget.currentStatus}</span>)
            </p>

            {reviewError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {reviewError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("APPROVE")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      reviewDecision === "APPROVE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("SUSPEND")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      reviewDecision === "SUSPEND"
                        ? "bg-amber-50 border-amber-500 text-amber-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("REJECT")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      reviewDecision === "REJECT"
                        ? "bg-rose-50 border-rose-500 text-rose-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Justification / Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="State the regulatory or verification reason..."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={handleSubmitReview}
                  className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer"
                >
                  {submittingReview ? "Recording..." : "Confirm Decision"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FACILITY CHANGE HISTORY DRAWER */}
      {selectedFacilityHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Facility Status Audit Trail</h3>
                <p className="text-xs text-slate-500">{selectedFacilityHistory.name}</p>
              </div>
              <button
                onClick={() => setSelectedFacilityHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {selectedFacilityHistory.changeHistory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No subsequent status changes recorded for this facility yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedFacilityHistory.changeHistory.map((h, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>
                        {h.fromStatus} → <span className="text-teal-700">{h.toStatus}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(h.changedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      By: {h.changedByName}
                    </div>
                    {h.reason && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5">
                        "{h.reason}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedFacilityHistory(null)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
