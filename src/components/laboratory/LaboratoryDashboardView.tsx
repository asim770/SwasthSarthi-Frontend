import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../ui/PageHeader";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  FlaskConical,
  Search,
  Filter,
  Plus,
  FileCheck2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Activity,
  Upload,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchLaboratoryOrders,
  fetchLaboratorySubmittedReports,
  searchPatientByPatientId,
} from "../../api/client";
import type { LabOrderItem, DiscoverablePatient } from "../../types/api";
import { CreateLabOrderModal } from "./CreateLabOrderModal";
import { SubmitReportModal } from "./SubmitReportModal";
import { DirectLabUploadModal } from "./DirectLabUploadModal";

export const LaboratoryDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "reports">("orders");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [orders, setOrders] = useState<LabOrderItem[]>([]);
  const [reports, setReports] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<LabOrderItem | null>(null);

  // Direct Lab Report Upload & Patient Search State
  const [isDirectUploadOpen, setIsDirectUploadOpen] = useState<boolean>(false);
  const [patientLookupId, setPatientLookupId] = useState<string>("");
  const [labSearchedPatient, setLabSearchedPatient] = useState<DiscoverablePatient | null>(null);
  const [patientLookupLoading, setPatientLookupLoading] = useState<boolean>(false);
  const [patientLookupError, setPatientLookupError] = useState<string | null>(null);

  const handleLabPatientLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = patientLookupId.trim();
    if (!query) return;

    setPatientLookupLoading(true);
    setPatientLookupError(null);
    try {
      const pt = await searchPatientByPatientId(query);
      setLabSearchedPatient(pt);
      setIsDirectUploadOpen(true);
    } catch (err: unknown) {
      setPatientLookupError(
        err instanceof Error ? err.message : `Patient with ID ${query} not found.`
      );
      setLabSearchedPatient(null);
    } finally {
      setPatientLookupLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedOrders = await fetchLaboratoryOrders(statusFilter);
      setOrders(fetchedOrders);

      try {
        const fetchedReports = await fetchLaboratorySubmittedReports();
        setReports(fetchedReports);
      } catch {
        // Non-lab roles might get empty or handled silently
        setReports([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load laboratory records.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOrders = orders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ord.orderId.toLowerCase().includes(q) ||
      ord.testName.toLowerCase().includes(q) ||
      ord.patientId.toLowerCase().includes(q) ||
      ord.targetFacility.toLowerCase().includes(q)
    );
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "STAT":
        return <Badge variant="danger">STAT</Badge>;
      case "URGENT":
        return <Badge variant="warning">URGENT</Badge>;
      default:
        return <Badge variant="info">ROUTINE</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">COMPLETED</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="warning">IN PROGRESS</Badge>;
      case "CANCELLED":
        return <Badge variant="neutral">CANCELLED</Badge>;
      default:
        return <Badge variant="info">ORDERED</Badge>;
    }
  };

  const isDoctor = user?.role === "doctor";
  const isLab = user?.role === "laboratory";

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Laboratory & Diagnostic Workflows"
        breadcrumb="Portal / Laboratory"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {isDoctor && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsOrderModalOpen(true)}
                className="inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Order Lab Test
              </Button>
            )}
            {isLab && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDirectUploadOpen(true)}
                disabled={user?.verificationStatus === "PENDING"}
                className="inline-flex items-center gap-1.5"
                title={user?.verificationStatus === "PENDING" ? "Account pending approval" : "Direct Structured Lab Report Upload"}
              >
                <Upload className="w-4 h-4" />
                Upload Lab Report
              </Button>
            )}
          </div>
        }
      />

      {/* Laboratory Pending Approval Notice */}
      {isLab && user?.verificationStatus === "PENDING" && (
        <Card className="border-amber-300 bg-amber-50 rounded-none shadow-none">
          <CardContent className="p-4 flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider text-[11px] text-amber-950">
                Diagnostic Laboratory Pending Approval
              </div>
              <p className="mt-1 text-amber-800 leading-relaxed">
                Your diagnostic laboratory organization ({user.organizationName || user.facility || "Diagnostic Center"} • Rep: {user.authorizedRepresentative || "Representative"}) is currently under review by an administrator. Operational diagnostic reporting is disabled until approved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Search & Quick Upload Card for Labs */}
      {isLab && (
        <Card className="border-[#D0E5E1] rounded-none bg-white shadow-none">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#0F766E]" />
              <span className="font-bold text-[#1A1918]">Find Patient by Patient ID:</span>
            </div>
            <form onSubmit={handleLabPatientLookup} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#7A746B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Patient ID (e.g. SS-PAT-000001)..."
                  value={patientLookupId}
                  onChange={(e) => setPatientLookupId(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#F0F7F6] border border-[#B6D6D0] rounded-none text-xs font-mono font-bold text-[#1A1918] placeholder-[#7A746B] focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918]"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={patientLookupLoading || !patientLookupId.trim() || user?.verificationStatus === "PENDING"}
                leftIcon={patientLookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              >
                Upload Report
              </Button>
            </form>
          </CardContent>
          {patientLookupError && (
            <div className="px-4 pb-3 text-xs text-rose-700 flex items-center gap-2 font-mono">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{patientLookupError}</span>
            </div>
          )}
        </Card>
      )}

      {/* Facility Notice Strip */}
      <div className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span className="text-[#5C574F]">
            <strong className="text-[#1A1918]">Facility Scope:</strong>{" "}
            {user?.facility ? (
              <span className="font-semibold text-[#1A1918]">{user.facility}</span>
            ) : (
              <span className="text-[#69655E]">All authorized facility networks</span>
            )}
            {" • "}
            {isLab && "Orders filtered strictly to this testing facility by backend DAL."}
            {isDoctor && "Orders submitted directly to target NABL/ABDM participating diagnostic centers."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-none bg-white text-[#0F766E] font-mono text-[10px] font-semibold border border-[#D0E5E1]">
            FHIR R4 ServiceRequest
          </span>
          <span className="px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-800 font-mono text-[10px] font-semibold border border-emerald-300">
            DiagnosticReport
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D0E5E1]">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors rounded-none ${
            activeTab === "orders"
              ? "border-[#1A1918] text-[#1A1918] font-bold"
              : "border-transparent text-[#69655E] hover:text-[#1A1918]"
          }`}
        >
          <Activity className="w-4 h-4 text-[#0F766E]" />
          Assigned Test Orders
          <span className="ml-1 px-1.5 py-0.2 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-[10px] font-mono">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors rounded-none ${
            activeTab === "reports"
              ? "border-[#1A1918] text-[#1A1918] font-bold"
              : "border-transparent text-[#69655E] hover:text-[#1A1918]"
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-[#0F766E]" />
          Submitted Reports Repository
          <span className="ml-1 px-1.5 py-0.2 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-[10px] font-mono">
            {reports.length}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-none text-xs text-rose-800 flex items-start gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Controls: Search + Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7A746B]" />
              <input
                type="text"
                placeholder="Search by test name, order ID, or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-[#F0F7F6] text-[#1A1918]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-[#7A746B] shrink-0" />
              {["ALL", "ORDERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-none whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#1A1918] text-white"
                      : "bg-white text-[#5C574F] border border-[#D0E5E1] hover:bg-[#F0F7F6] hover:text-[#1A1918]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#7A746B] bg-white border border-[#D0E5E1] rounded-none font-mono">
              <RefreshCw className="w-5 h-5 text-[#0F766E] animate-spin mx-auto mb-2" />
              Fetching assigned diagnostic orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#69655E] bg-white border border-[#D0E5E1] rounded-none">
              <FlaskConical className="w-8 h-8 text-[#B6D6D0] mx-auto mb-3" />
              <p className="font-editorial-serif font-bold text-sm text-[#1A1918]">No test orders found</p>
              <p className="text-[#69655E] mt-1 max-w-sm mx-auto">
                {statusFilter !== "ALL"
                  ? `No orders matching status filter "${statusFilter}". Try switching to ALL.`
                  : isDoctor
                  ? "You have not created any lab orders for your patients yet. Click 'Order Lab Test' above."
                  : "No diagnostic orders currently assigned to this facility."}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#D0E5E1] rounded-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F0F7F6] border-b border-[#D0E5E1] text-[#69655E] font-mono uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order ID & Date</th>
                      <th className="py-3 px-4">Test Details</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Patient Reference</th>
                      <th className="py-3 px-4">Facility & Doctor</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D0E5E1]">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-[#F0F7F6]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-[#0F766E]">{ord.orderId}</div>
                          <div className="text-[10px] text-[#7A746B] mt-0.5 font-mono">
                            {new Date(ord.orderedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1A1918]">{ord.testName}</div>
                          <div className="font-mono text-[10px] text-[#69655E] mt-0.5">
                            Code: {ord.testCode}
                          </div>
                          {ord.instructions && (
                            <div className="text-[10px] text-amber-900 bg-amber-50 rounded-none px-1.5 py-0.5 mt-1 inline-block border border-amber-200">
                              {ord.instructions}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">{getPriorityBadge(ord.priority)}</td>
                        <td className="py-3 px-4">
                          <div className="font-mono font-medium text-[#1A1918]">{ord.patientId}</div>
                          <div className="text-[10px] text-[#7A746B]">Minimum info disclosed</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[#1A1918] font-medium truncate max-w-[160px]">
                            {ord.targetFacility}
                          </div>
                          <div className="text-[10px] text-[#69655E]">Dr. {ord.doctorName || ord.doctorId}</div>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(ord.status)}</td>
                        <td className="py-3 px-4 text-right">
                          {ord.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Report Filed
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedOrderForReport(ord)}
                              className="text-xs"
                            >
                              Submit Report
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#69655E] bg-white border border-[#D0E5E1] rounded-none">
              <FileCheck2 className="w-8 h-8 text-[#B6D6D0] mx-auto mb-3" />
              <p className="font-editorial-serif font-bold text-sm text-[#1A1918]">No submitted diagnostic reports</p>
              <p className="text-[#69655E] mt-1 max-w-sm mx-auto">
                Submitted reports are held at the source laboratory and shared securely through the
                ABDM consent and transfer workflow.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((rep, idx) => (
                <Card key={idx} className="border-[#D0E5E1] rounded-none bg-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] text-[#0F766E] flex items-center justify-center font-mono font-bold text-xs">
                          FHIR
                        </div>
                        <div>
                          <h4 className="text-sm font-editorial-serif font-bold text-[#1A1918]">
                            {String(rep.title || "Diagnostic Report")}
                          </h4>
                          <span className="text-[10px] font-mono text-[#7A746B]">
                            {String(rep.recordId || "REC-LAB")}
                          </span>
                        </div>
                      </div>
                      <Badge variant="success">FINAL REPORT</Badge>
                    </div>

                    <p className="text-xs text-[#5C574F] line-clamp-2">
                      {String(rep.summary || "Complete laboratory analysis.")}
                    </p>

                    <div className="pt-2 border-t border-[#D0E5E1] flex items-center justify-between text-[10px] text-[#69655E]">
                      <span>Source: {String(rep.sourceInstitution || "Diagnostic Center")}</span>
                      <span className="font-mono">{String(rep.date || "")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateLabOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />

      <SubmitReportModal
        order={selectedOrderForReport}
        isOpen={!!selectedOrderForReport}
        onClose={() => setSelectedOrderForReport(null)}
        onSuccess={() => {
          loadData();
          setActiveTab("reports");
        }}
      />

      <DirectLabUploadModal
        isOpen={isDirectUploadOpen}
        onClose={() => setIsDirectUploadOpen(false)}
        defaultPatientId={labSearchedPatient?.patientId || patientLookupId || "SS-PAT-000001"}
        defaultLabName={user?.organizationName || user?.facility || "Metropolis Diagnostics Hub"}
        onSuccess={() => {
          setIsDirectUploadOpen(false);
          loadData();
          setActiveTab("reports");
        }}
      />
    </div>
  );
};
