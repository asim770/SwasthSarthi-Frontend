import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  UserCheck,
  RefreshCw,
  Plus,
  Search,
  History,
  X,
  MapPin,
} from "lucide-react";
import {
  fetchInstitutions,
  registerInstitution,
  reviewInstitution,
  fetchPractitionerVerifications,
  reviewPractitioner,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type {
  FacilityItem,
  FacilityType,
  FacilityStatus,
  PractitionerVerificationItem,
} from "../../types/api";
import { PageHeader } from "../ui/PageHeader";
import { StatCard } from "../ui/StatCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function AdminManagementView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"institutions" | "practitioners">("institutions");

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
  const [newInstPhone, setNewInstPhone] = useState("");
  const [newInstEmail, setNewInstEmail] = useState("");
  const [newInstCity, setNewInstCity] = useState("");
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

  // Initial load of counts for both tabs
  useEffect(() => {
    fetchInstitutions({ type: "ALL", status: "ALL" })
      .then((data) => setInstitutions(data))
      .catch(() => {});
    fetchPractitionerVerifications({ role: "ALL", status: "ALL" })
      .then((data) => setPractitioners(data))
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    if (activeTab === "institutions") {
      loadInstitutions();
    } else if (activeTab === "practitioners") {
      loadPractitioners();
    }
  }, [activeTab, loadInstitutions, loadPractitioners]);

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
      setNewInstPhone("");
      setNewInstEmail("");
      setNewInstCity("");
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
          <Badge variant="success" size="sm" dot>
            Approved
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="warning" size="sm" dot>
            Pending Review
          </Badge>
        );
      case "SUSPENDED":
        return (
          <Badge variant="danger" size="sm" dot>
            Suspended
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="neutral" size="sm">
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1]">
        {type}
      </span>
    );
  };

  // Metric counts
  const approvedCount = institutions.filter((i) => i.status === "APPROVED").length;
  const pendingCount = institutions.filter((i) => i.status === "PENDING").length;
  const pendingPractitioners = practitioners.filter((p) => p.verificationStatus === "PENDING").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Sleek Page Header */}
      <PageHeader
        breadcrumb="ABDM Network · Administration & Governance"
        title="Admin Portal"
        description="Oversee verified healthcare institutions and validate clinician registrations within the ABDM network."
        badge={
          <Badge variant="teal" size="sm" dot>
            ABDM Governance
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (activeTab === "institutions") loadInstitutions();
                else loadPractitioners();
              }}
              leftIcon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    instLoading || practLoading ? "animate-spin" : ""
                  }`}
                />
              }
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Register Facility
            </Button>
          </div>
        }
      />

      {/* 2. Executive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Facilities"
          value={institutions.length}
          subtitle={`${approvedCount} active · ${pendingCount} pending review`}
          icon={<Building2 className="w-4 h-4 text-[#0F766E]" />}
        />
        <StatCard
          title="Practitioner Queue"
          value={practitioners.length}
          subtitle={
            pendingPractitioners > 0
              ? `${pendingPractitioners} requiring decision`
              : "All credentials reviewed"
          }
          icon={<UserCheck className="w-4 h-4 text-[#0F766E]" />}
          badge={
            pendingPractitioners > 0 ? (
              <Badge variant="warning" size="sm">
                Needs Review
              </Badge>
            ) : undefined
          }
        />
      </div>

      {/* 3. Modern Segmented Tab Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-[#E4F1EE] border border-[#D0E5E1] rounded-none w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("institutions")}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-none transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "institutions"
              ? "bg-white text-[#0F766E] shadow-2xs font-bold"
              : "text-[#5C574F] hover:text-[#191817] hover:bg-white/60 font-medium"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Institutions &amp; Facilities</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-none font-mono ${
              activeTab === "institutions"
                ? "bg-[#0F766E]/10 text-[#0F766E] font-bold"
                : "bg-[#D0E5E1] text-[#5C574F]"
            }`}
          >
            {institutions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("practitioners")}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-none transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "practitioners"
              ? "bg-white text-[#0F766E] shadow-2xs font-bold"
              : "text-[#5C574F] hover:text-[#191817] hover:bg-white/60 font-medium"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Practitioners Queue</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-none font-mono ${
              activeTab === "practitioners"
                ? "bg-[#0F766E]/10 text-[#0F766E] font-bold"
                : "bg-[#D0E5E1] text-[#5C574F]"
            }`}
          >
            {practitioners.length}
          </span>
        </button>
      </div>

      {/* TAB 1: INSTITUTIONS MANAGEMENT */}
      {activeTab === "institutions" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-none border border-[#D0E5E1] shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7A746B]" />
                <input
                  type="text"
                  placeholder="Search facilities by name or ID..."
                  value={instSearch}
                  onChange={(e) => setInstSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#D0E5E1] bg-[#F8FBFA] focus:bg-white rounded-none focus:outline-none focus:border-[#0F766E] transition-colors"
                />
              </div>

              <select
                value={instTypeFilter}
                onChange={(e) => setInstTypeFilter(e.target.value)}
                className="text-xs border border-[#D0E5E1] rounded-none px-3 py-1.5 bg-[#F8FBFA] text-[#191817] font-medium cursor-pointer focus:outline-none focus:border-[#0F766E]"
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
                className="text-xs border border-[#D0E5E1] rounded-none px-3 py-1.5 bg-[#F8FBFA] text-[#191817] font-medium cursor-pointer focus:outline-none focus:border-[#0F766E]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Clean Institutions Table */}
          <div className="bg-white rounded-none border border-[#D0E5E1] shadow-2xs overflow-hidden">
            {instLoading ? (
              <div className="py-16 text-center text-[#7A746B] text-xs font-mono">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0F766E]" />
                Loading facilities registry...
              </div>
            ) : institutions.length === 0 ? (
              <div className="py-16 text-center text-[#69655E] flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] flex items-center justify-center text-[#0F766E] mb-3 shadow-2xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#1A1918]">No Healthcare Facilities Registered</p>
                <p className="text-xs text-[#7A746B] mt-1 max-w-sm leading-relaxed">
                  Register hospitals, diagnostic centers, clinics, or pharmacies into the verified ABDM network.
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsRegisterModalOpen(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Register Facility
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FBFA] text-[#5C574F] border-b border-[#D0E5E1] font-mono font-medium uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Facility Details</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">HFR ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Verified By</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D0E5E1]">
                    {institutions.map((inst) => (
                      <tr key={inst._id} className="hover:bg-[#F0F7F6]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#1A1918] text-sm leading-tight">
                            {inst.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[#69655E] text-[10px] font-mono bg-[#F0F7F6] px-1.5 py-0.2 border border-[#D0E5E1]">
                              {inst.facilityId}
                            </span>
                            {inst.address?.city && (
                              <span className="text-[#7A746B] text-[11px] flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-[#7A746B]" />
                                {inst.address.city}, {inst.address.state || "India"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{getTypeBadge(inst.type)}</td>
                        <td className="py-3.5 px-4 font-mono text-[#5C574F] text-xs">
                          {inst.demoHfrId || "HFR-IN-DEMO"}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(inst.status)}
                          {inst.statusReason && (
                            <div className="text-[10px] text-[#7A746B] mt-1 max-w-[200px] truncate" title={inst.statusReason}>
                              {inst.statusReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#5C574F] text-xs">
                          <div className="font-medium text-[#1A1918]">{inst.verifiedByName || "—"}</div>
                          {inst.verifiedAt && (
                            <div className="text-[10px] text-[#7A746B] font-mono mt-0.5">
                              {new Date(inst.verifiedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedFacilityHistory(inst)}
                              className="px-2.5 py-1 text-[#5C574F] hover:text-[#1A1918] border border-[#D0E5E1] rounded-none text-xs hover:bg-[#F0F7F6] transition-colors flex items-center gap-1 cursor-pointer font-medium"
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
                                daylight: true,
                                } as any)
                              }
                              className="px-3 py-1 bg-[#1A1918] text-white hover:bg-[#2E2C2A] border border-[#1A1918] rounded-none text-xs font-medium transition-colors cursor-pointer"
                            >
                              Review
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-none border border-[#D0E5E1] shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7A746B]" />
                <input
                  type="text"
                  placeholder="Search practitioners by name or ABHA..."
                  value={practSearch}
                  onChange={(e) => setPractSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#D0E5E1] bg-[#F8FBFA] focus:bg-white rounded-none focus:outline-none focus:border-[#0F766E] transition-colors"
                />
              </div>

              <select
                value={practRoleFilter}
                onChange={(e) => setPractRoleFilter(e.target.value)}
                className="text-xs border border-[#D0E5E1] rounded-none px-3 py-1.5 bg-[#F8FBFA] text-[#1A1918] font-medium cursor-pointer focus:outline-none focus:border-[#0F766E]"
              >
                <option value="ALL">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="laboratory">Laboratory Technicians</option>
                <option value="pharmacy">Pharmacists</option>
              </select>

              <select
                value={practStatusFilter}
                onChange={(e) => setPractStatusFilter(e.target.value)}
                className="text-xs border border-[#D0E5E1] rounded-none px-3 py-1.5 bg-[#F8FBFA] text-[#1A1918] font-medium cursor-pointer focus:outline-none focus:border-[#0F766E]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Clean Practitioners Table */}
          <div className="bg-white rounded-none border border-[#D0E5E1] shadow-2xs overflow-hidden">
            {practLoading ? (
              <div className="py-16 text-center text-[#7A746B] text-xs font-mono">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0F766E]" />
                Loading practitioners queue...
              </div>
            ) : practitioners.length === 0 ? (
              <div className="py-16 text-center text-[#69655E]">
                <UserCheck className="w-10 h-10 text-[#B6D6D0] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1A1918]">No practitioners found</p>
                <p className="text-xs text-[#7A746B] mt-1">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FBFA] text-[#5C574F] border-b border-[#D0E5E1] font-mono font-medium uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Practitioner</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Assigned Facility</th>
                      <th className="py-3 px-4">HPR ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D0E5E1]">
                    {practitioners.map((doc) => {
                      const isSelf = user?.id === doc._id;
                      return (
                        <tr key={doc._id} className="hover:bg-[#F0F7F6]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#1A1918] text-sm flex items-center gap-1.5 leading-tight">
                              {doc.name}
                              {isSelf && (
                                <span className="text-[10px] bg-[#E4F1EE] text-[#0F766E] border border-[#0F766E]/30 px-1.5 py-0.2 rounded-none font-medium">
                                  Your Account
                                </span>
                              )}
                            </div>
                            <div className="text-[#69655E] text-[11px] font-mono mt-0.5">{doc.abhaAddress}</div>
                            {doc.specialization && (
                              <div className="text-[#7A746B] text-[10px] mt-0.5">{doc.specialization}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold tracking-wider bg-[#F0F7F6] border border-[#D0E5E1] text-[#0F766E] uppercase">
                              {doc.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#1A1918] font-medium">
                            {doc.facility || "Unassigned"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#5C574F] text-xs">
                            {doc.hprId || doc.hfrId || "HPR-IN-DEMO"}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(doc.verificationStatus)}
                            {doc.statusReason && (
                              <div className="text-[10px] text-[#7A746B] mt-1 max-w-[200px] truncate" title={doc.statusReason}>
                                {doc.statusReason}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
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
                              title={isSelf ? "Self-approval is forbidden" : "Review credentials"}
                              className={`px-3 py-1 rounded-none text-xs font-medium transition-colors cursor-pointer ${
                                isSelf
                                  ? "bg-[#F0F7F6] text-[#7A746B] cursor-not-allowed border border-[#D0E5E1]"
                                  : "bg-[#1A1918] text-white hover:bg-[#2E2C2A] border border-[#1A1918]"
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



      {/* REGISTER INSTITUTION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1918]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none max-w-lg w-full p-6 shadow-2xl border border-[#D0E5E1] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1]">
              <h3 className="text-base font-editorial-serif font-bold text-[#1A1918] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F766E]" />
                Register Healthcare Facility
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-[#7A746B] hover:text-[#1A1918] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {registerError && (
              <div className="my-3 p-2.5 bg-rose-50 border border-rose-200 rounded-none text-rose-700 text-xs font-mono">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterInstitution} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1918] mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AIIMS Delhi or Fortis Healthcare"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D0E5E1] bg-[#F8FBFA] focus:bg-white rounded-none focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1918] mb-1">
                    Facility Type
                  </label>
                  <select
                    value={newInstType}
                    onChange={(e) => setNewInstType(e.target.value as FacilityType)}
                    className="w-full px-3 py-2 text-xs border border-[#D0E5E1] bg-[#F8FBFA] rounded-none text-[#1A1918] focus:outline-none focus:border-[#0F766E]"
                  >
                    <option value="HOSPITAL">Hospital</option>
                    <option value="LABORATORY">Diagnostic Lab</option>
                    <option value="PHARMACY">Pharmacy Store</option>
                    <option value="CLINIC">Polyclinic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1918] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newInstCity}
                    onChange={(e) => setNewInstCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D0E5E1] bg-[#F8FBFA] rounded-none text-[#1A1918] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1918] mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newInstPhone}
                    onChange={(e) => setNewInstPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D0E5E1] bg-[#F8FBFA] rounded-none font-mono text-[#1A1918] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1918] mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@facility.org"
                    value={newInstEmail}
                    onChange={(e) => setNewInstEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D0E5E1] bg-[#F8FBFA] rounded-none text-[#1A1918] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1918] mb-1">
                  HFR Registry ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="IN-HFR-2026-XXXX"
                  value={newInstHfrId}
                  onChange={(e) => setNewInstHfrId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D0E5E1] bg-[#F8FBFA] rounded-none font-mono text-[#1A1918] focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#D0E5E1]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRegisterModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={registering}
                >
                  Submit Registration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECISION / REVIEW MODAL */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-[#1A1918]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none max-w-md w-full p-6 shadow-2xl border border-[#D0E5E1] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1] mb-4">
              <h3 className="text-base font-editorial-serif font-bold text-[#1A1918]">
                Review Credential Status
              </h3>
              <button
                onClick={() => setReviewTarget(null)}
                className="text-[#7A746B] hover:text-[#1A1918] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C574F] mb-4">
              Reviewing: <strong className="text-[#1A1918]">{reviewTarget.name}</strong> (Current:{" "}
              <span className="font-semibold text-[#0F766E]">{reviewTarget.currentStatus}</span>)
            </p>

            {reviewError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-none text-rose-700 text-xs font-mono">
                {reviewError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1918] mb-1.5">
                  Verification Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("APPROVE")}
                    className={`py-2 px-3 text-xs font-semibold rounded-none border transition-colors cursor-pointer text-center ${
                      reviewDecision === "APPROVE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "border-[#D0E5E1] text-[#5C574F] hover:bg-[#F8FBFA]"
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("SUSPEND")}
                    className={`py-2 px-3 text-xs font-semibold rounded-none border transition-colors cursor-pointer text-center ${
                      reviewDecision === "SUSPEND"
                        ? "bg-amber-50 border-amber-500 text-amber-800"
                        : "border-[#D0E5E1] text-[#5C574F] hover:bg-[#F8FBFA]"
                    }`}
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("REJECT")}
                    className={`py-2 px-3 text-xs font-semibold rounded-none border transition-colors cursor-pointer text-center ${
                      reviewDecision === "REJECT"
                        ? "bg-rose-50 border-rose-500 text-rose-800"
                        : "border-[#D0E5E1] text-[#5C574F] hover:bg-[#F8FBFA]"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1918] mb-1">
                  Justification / Regulatory Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Add justification or compliance verification notes..."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D0E5E1] bg-[#F8FBFA] focus:bg-white rounded-none focus:outline-none focus:border-[#0F766E] text-[#1A1918]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#D0E5E1]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setReviewTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={submittingReview}
                  onClick={handleSubmitReview}
                >
                  Confirm Decision
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FACILITY CHANGE HISTORY DRAWER */}
      {selectedFacilityHistory && (
        <div className="fixed inset-0 z-50 bg-[#1A1918]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none max-w-lg w-full p-6 shadow-2xl border border-[#D0E5E1] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1] mb-4">
              <div>
                <h3 className="text-base font-editorial-serif font-bold text-[#1A1918]">Facility Status Audit Trail</h3>
                <p className="text-xs text-[#5C574F] font-mono mt-0.5">{selectedFacilityHistory.name}</p>
              </div>
              <button
                onClick={() => setSelectedFacilityHistory(null)}
                className="text-[#7A746B] hover:text-[#1A1918] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedFacilityHistory.changeHistory.length === 0 ? (
              <p className="text-xs text-[#69655E] text-center py-8">
                No status modifications recorded for this facility yet.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {selectedFacilityHistory.changeHistory.map((h, idx) => (
                  <div key={idx} className="p-3 bg-[#F8FBFA] border border-[#D0E5E1] rounded-none text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#1A1918]">
                      <span className="font-mono text-xs">
                        {h.fromStatus} → <span className="text-[#0F766E] font-bold">{h.toStatus}</span>
                      </span>
                      <span className="text-[10px] text-[#7A746B] font-mono font-normal">
                        {new Date(h.changedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5C574F] mt-1">
                      By: <span className="font-medium text-[#1A1918]">{h.changedByName}</span>
                    </div>
                    {h.reason && (
                      <div className="text-[11px] text-[#69655E] italic mt-0.5 bg-white p-1.5 border border-[#D0E5E1]">
                        "{h.reason}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-[#D0E5E1] flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedFacilityHistory(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManagementView;
