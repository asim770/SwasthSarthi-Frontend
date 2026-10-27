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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchLaboratoryOrders,
  fetchLaboratorySubmittedReports,
} from "../../api/client";
import type { LabOrderItem } from "../../types/api";
import { CreateLabOrderModal } from "./CreateLabOrderModal";
import { SubmitReportModal } from "./SubmitReportModal";

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
          </div>
        }
      />

      {/* Facility Notice Strip */}
      <div className="p-3.5 bg-[#f0fdfa] border border-[#d7eaea] rounded-[18px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="w-4 h-4 text-[#008080] shrink-0" />
          <span className="text-[#475569]">
            <strong className="text-[#172033]">Facility Scope:</strong>{" "}
            {user?.facility ? (
              <span className="font-semibold text-[#172033]">{user.facility}</span>
            ) : (
              <span className="text-[#64748b]">All authorized facility networks</span>
            )}
            {" • "}
            {isLab && "Orders filtered strictly to this testing facility by backend DAL."}
            {isDoctor && "Orders submitted directly to target NABL/ABDM participating diagnostic centers."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-white text-[#008080] font-mono text-[10px] font-semibold border border-[#b2d8d8]">
            FHIR R4 ServiceRequest
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-semibold border border-emerald-200">
            DiagnosticReport
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d7eaea]">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "orders"
              ? "border-[#008080] text-[#008080]"
              : "border-transparent text-[#64748b] hover:text-[#172033]"
          }`}
        >
          <Activity className="w-4 h-4" />
          Assigned Test Orders
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#f0fdfa] text-[#008080] border border-[#b2d8d8] text-[10px]">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "reports"
              ? "border-[#008080] text-[#008080]"
              : "border-transparent text-[#64748b] hover:text-[#172033]"
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Submitted Reports Repository
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#f0fdfa] text-[#008080] border border-[#b2d8d8] text-[10px]">
            {reports.length}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Controls: Search + Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by test name, order ID, or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#d7eaea] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-[#008080] bg-white text-[#172033]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {["ALL", "ORDERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-[12px] whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#008080] text-white shadow-xs"
                      : "bg-white text-[#475569] border border-[#d7eaea] hover:bg-[#f0fdfa] hover:text-[#008080]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748b] bg-white border border-[#d7eaea] rounded-[18px]">
              <RefreshCw className="w-5 h-5 text-[#008080] animate-spin mx-auto mb-2" />
              Fetching assigned diagnostic orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
              <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No test orders found</p>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                {statusFilter !== "ALL"
                  ? `No orders matching status filter "${statusFilter}". Try switching to ALL.`
                  : isDoctor
                  ? "You have not created any lab orders for your patients yet. Click 'Order Lab Test' above."
                  : "No diagnostic orders currently assigned to this facility."}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
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
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-teal-900">{ord.orderId}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(ord.orderedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{ord.testName}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            Code: {ord.testCode}
                          </div>
                          {ord.instructions && (
                            <div className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 inline-block">
                              {ord.instructions}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">{getPriorityBadge(ord.priority)}</td>
                        <td className="py-3 px-4">
                          <div className="font-mono font-medium text-slate-800">{ord.patientId}</div>
                          <div className="text-[10px] text-slate-400">Minimum info disclosed</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium truncate max-w-[160px]">
                            {ord.targetFacility}
                          </div>
                          <div className="text-[10px] text-slate-500">Dr. {ord.doctorName || ord.doctorId}</div>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(ord.status)}</td>
                        <td className="py-3 px-4 text-right">
                          {ord.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Report Filed
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrderForReport(ord)}
                              className="text-xs text-teal-700 border-teal-200 hover:bg-teal-50"
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
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
              <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No submitted diagnostic reports</p>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                Submitted reports are held at the source laboratory and shared securely through the
                ABDM consent and transfer workflow.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((rep, idx) => (
                <Card key={idx} className="border-slate-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                          FHIR
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {String(rep.title || "Diagnostic Report")}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {String(rep.recordId || "REC-LAB")}
                          </span>
                        </div>
                      </div>
                      <Badge variant="success">FINAL REPORT</Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {String(rep.summary || "Complete laboratory analysis.")}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
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
    </div>
  );
};
