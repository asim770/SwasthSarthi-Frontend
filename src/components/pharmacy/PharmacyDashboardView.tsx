import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../ui/PageHeader";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Pill,
  Search,
  Filter,
  Plus,
  AlertCircle,
  RefreshCw,
  Calendar,
  History,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPrescriptions,
  fetchDispensingHistory,
} from "../../api/client";
import type { PrescriptionItem, DispensingRecordItem } from "../../types/api";
import { CreatePrescriptionModal } from "./CreatePrescriptionModal";
import { DispenseModal } from "./DispenseModal";

export const PharmacyDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"prescriptions" | "dispenses">("prescriptions");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [dispenses, setDispenses] = useState<DispensingRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedPrescriptionForDispense, setSelectedPrescriptionForDispense] =
    useState<PrescriptionItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPrescriptions = await fetchPrescriptions(statusFilter);
      setPrescriptions(fetchedPrescriptions);

      try {
        const fetchedDispenses = await fetchDispensingHistory();
        setDispenses(fetchedDispenses);
      } catch {
        setDispenses([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load prescriptions.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesMedication = rx.medications.some(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.code && m.code.toLowerCase().includes(q))
    );
    return (
      rx.prescriptionId.toLowerCase().includes(q) ||
      rx.patientId.toLowerCase().includes(q) ||
      matchesMedication
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">ACTIVE</Badge>;
      case "PARTIALLY_DISPENSED":
        return <Badge variant="warning">PARTIAL</Badge>;
      case "DISPENSED":
        return <Badge variant="neutral">FULFILLED</Badge>;
      case "EXPIRED":
        return <Badge variant="danger">EXPIRED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const isDoctor = user?.role === "doctor";
  const isPharmacist = user?.role === "pharmacy";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pharmacy & Medication Fulfilment"
        breadcrumb="Portal / Pharmacy"
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
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Write Prescription
              </Button>
            )}
          </div>
        }
      />

      {/* Safety & Protocol Banner */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Pill className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-slate-600">
            <strong>Pharmacy Fulfilment Scope:</strong>{" "}
            {user?.facility ? (
              <span className="font-semibold text-slate-800">{user.facility}</span>
            ) : (
              <span className="text-slate-500">Authorized network dispensing hub</span>
            )}
            {" • "}
            {isPharmacist &&
              "Access restricted to eligible unfulfilled prescriptions. Clinical timeline access prohibited."}
            {isDoctor && "Synthetic prescriptions comply with FHIR R4 MedicationRequest standard."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[10px] font-semibold border border-teal-200">
            FHIR R4 MedicationRequest
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-semibold border border-emerald-200">
            MedicationDispense
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("prescriptions")}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "prescriptions"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Pill className="w-4 h-4" />
          Eligible Prescriptions
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
            {prescriptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("dispenses")}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "dispenses"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          Dispensing Audit Log
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
            {dispenses.length}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "prescriptions" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search prescription ID, medication, or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {["ALL", "ACTIVE", "PARTIALLY_DISPENSED", "DISPENSED", "EXPIRED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? "bg-teal-700 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Prescriptions List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
              <RefreshCw className="w-5 h-5 text-teal-600 animate-spin mx-auto mb-2" />
              Retrieving prescription records from DAL...
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
              <Pill className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No prescriptions found</p>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                {statusFilter !== "ALL"
                  ? `No prescriptions with status "${statusFilter}". Try selecting ALL.`
                  : isDoctor
                  ? "You have not created any prescriptions yet. Click 'Write Prescription' above."
                  : "No active unfulfilled prescriptions currently eligible for pharmacy dispensing."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredPrescriptions.map((rx) => {
                const total = rx.totalQuantity ?? 0;
                const dispensed = rx.dispensedQuantity ?? 0;
                const remaining = rx.remainingQuantity ?? 0;
                const progressPct = total > 0 ? Math.min(100, Math.round((dispensed / total) * 100)) : 0;
                const isCanDispense =
                  (rx.status === "ACTIVE" || rx.status === "PARTIALLY_DISPENSED") &&
                  remaining > 0 &&
                  new Date(rx.expiresAt).getTime() > Date.now();

                return (
                  <Card key={rx.prescriptionId} className="border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Prescription Meta */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sm text-teal-950">
                              {rx.prescriptionId}
                            </span>
                            {getStatusBadge(rx.status)}
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Issued: {new Date(rx.prescribedAt).toLocaleDateString()}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Expires: {new Date(rx.expiresAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                            <div>
                              <span className="text-slate-400">Patient:</span>{" "}
                              <span className="font-mono font-semibold text-slate-800">
                                {rx.patientId}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Prescriber:</span>{" "}
                              <span className="font-medium text-slate-800">Dr. {rx.doctorId}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Permitted Refills:</span>{" "}
                              <span className="font-semibold text-slate-800">
                                {rx.remainingRefills ?? 0} remaining of {rx.maxRefills ?? 0}
                              </span>
                            </div>
                          </div>

                          {/* Medications list */}
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            {rx.medications.map((m, mIdx) => (
                              <div
                                key={mIdx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100 gap-1"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                                  <span className="font-bold text-slate-900">{m.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {m.code || "RxNorm"}
                                  </span>
                                  <span className="text-slate-600">
                                    • {m.dosage} • {m.frequency}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 sm:text-right">
                                  <span className="font-medium">Qty: {m.quantity}</span> (
                                  {m.durationDays} days)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Progress and Dispensing Action */}
                        <div className="lg:w-64 shrink-0 flex flex-col justify-between pt-3 lg:pt-0 lg:pl-5 lg:border-l border-slate-100 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500 font-medium">Fulfilment</span>
                              <span className="font-bold text-slate-800 font-mono">
                                {dispensed} / {total} units ({progressPct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progressPct === 100
                                    ? "bg-emerald-600"
                                    : progressPct > 0
                                    ? "bg-amber-500"
                                    : "bg-slate-300"
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                              <span>Remaining balance:</span>
                              <span className="font-bold font-mono text-teal-900">{remaining} units</span>
                            </div>
                          </div>

                          <div>
                            {isCanDispense ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setSelectedPrescriptionForDispense(rx)}
                                className="w-full bg-teal-700 hover:bg-teal-800 text-xs py-2 inline-flex items-center justify-center gap-1.5"
                              >
                                <Pill className="w-3.5 h-3.5" />
                                Dispense Medication
                              </Button>
                            ) : (
                              <div className="text-center p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium">
                                {rx.status === "DISPENSED" || remaining === 0
                                  ? "Fully Fulfilled"
                                  : rx.status === "EXPIRED"
                                  ? "Expired Prescription"
                                  : "Non-dispensable"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "dispenses" && (
        <div className="space-y-4">
          {dispenses.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No dispensing events recorded yet</p>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                Dispensed medications will be atomically registered here and logged into the source
                facility repository with FHIR MedicationDispense.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Dispense ID & Date</th>
                      <th className="py-3 px-4">Prescription</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Dispensed Qty</th>
                      <th className="py-3 px-4">Remaining After</th>
                      <th className="py-3 px-4">Lot / Batch</th>
                      <th className="py-3 px-4">Dispensing Facility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dispenses.map((evt) => (
                      <tr key={evt.dispenseId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-teal-950">
                            {evt.dispenseId}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(evt.dispensedAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {evt.prescriptionId}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {evt.patientName || evt.patientAbha || "Patient"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                            +{evt.quantityDispensed} units
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {evt.remainingQuantityAfter} units
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {evt.batchNumber || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-[11px] truncate max-w-[160px]">
                          {evt.pharmacyFacility || "Apollo Pharmacy Hub"}
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

      {/* Modals */}
      <CreatePrescriptionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />

      <DispenseModal
        prescription={selectedPrescriptionForDispense}
        isOpen={!!selectedPrescriptionForDispense}
        onClose={() => setSelectedPrescriptionForDispense(null)}
        onSuccess={() => {
          loadData();
          setActiveTab("dispenses");
        }}
      />
    </div>
  );
};
