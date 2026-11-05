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
import { DirectDispenseModal } from "./DirectDispenseModal";

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
  const [isDirectDispenseModalOpen, setIsDirectDispenseModalOpen] = useState<boolean>(false);
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
            {isPharmacist && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDirectDispenseModalOpen(true)}
                disabled={user?.verificationStatus === "PENDING"}
                className="inline-flex items-center gap-1.5"
                title={user?.verificationStatus === "PENDING" ? "Account pending approval" : "Direct Medication Dispensing Entry"}
              >
                <Pill className="w-4 h-4" />
                Record Dispensing
              </Button>
            )}
          </div>
        }
      />

      {/* Pharmacy Pending Approval Notice */}
      {isPharmacist && user?.verificationStatus === "PENDING" && (
        <Card className="border-amber-300 bg-amber-50 rounded-none shadow-none">
          <CardContent className="p-4 flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider text-[11px] text-amber-950">
                Pharmacy Registration Pending Approval
              </div>
              <p className="mt-1 text-amber-800 leading-relaxed">
                Your pharmacy organization ({user.organizationName || user.facility || "Pharmacy Hub"} • License #{user.registrationNumber || "Pending"}) is currently undergoing administrative verification. Dispensing operational features are restricted until approved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety & Protocol Banner */}
      <div className="p-3.5 bg-[#F0F7F6] border border-[#D0E5E1] rounded-none shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Pill className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span className="text-[#5C574F]">
            <strong className="text-[#1A1918]">Pharmacy Fulfilment Scope:</strong>{" "}
            {user?.facility ? (
              <span className="font-semibold text-[#1A1918]">{user.facility}</span>
            ) : (
              <span className="text-[#69655E]">Authorized network dispensing hub</span>
            )}
            {" • "}
            {isPharmacist &&
              "Access restricted to eligible unfulfilled prescriptions. Clinical timeline access prohibited."}
            {isDoctor && "Synthetic prescriptions comply with FHIR R4 MedicationRequest standard."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-none bg-white text-[#0F766E] font-mono text-[10px] font-semibold border border-[#D0E5E1]">
            FHIR R4 MedicationRequest
          </span>
          <span className="px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-800 font-mono text-[10px] font-semibold border border-emerald-200">
            MedicationDispense
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D0E5E1]">
        <button
          onClick={() => setActiveTab("prescriptions")}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "prescriptions"
              ? "border-[#1A1918] text-[#1A1918]"
              : "border-transparent text-[#69655E] hover:text-[#1A1918]"
          }`}
        >
          <Pill className="w-4 h-4" />
          Eligible Prescriptions
          <span className="ml-1 px-1.5 py-0.2 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-[10px] font-mono">
            {prescriptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("dispenses")}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === "dispenses"
              ? "border-[#1A1918] text-[#1A1918]"
              : "border-transparent text-[#69655E] hover:text-[#1A1918]"
          }`}
        >
          <History className="w-4 h-4" />
          Dispensing Audit Log
          <span className="ml-1 px-1.5 py-0.2 rounded-none bg-[#F0F7F6] text-[#0F766E] border border-[#D0E5E1] text-[10px] font-mono">
            {dispenses.length}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-none text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "prescriptions" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C877D]" />
              <input
                type="text"
                placeholder="Search prescription ID, medication, or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#B6D6D0] rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] bg-[#F0F7F6] text-[#1A1918]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-[#8C877D] shrink-0" />
              {["ALL", "ACTIVE", "PARTIALLY_DISPENSED", "DISPENSED", "EXPIRED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-none whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#1A1918] text-white shadow-none"
                      : "bg-[#F0F7F6] text-[#69655E] border border-[#B6D6D0] hover:bg-[#D0E5E1] hover:text-[#1A1918]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Prescriptions List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#69655E] bg-[#F0F7F6] border border-[#D0E5E1] rounded-none">
              <RefreshCw className="w-5 h-5 text-[#0F766E] animate-spin mx-auto mb-2" />
              Retrieving prescription records from DAL...
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#69655E] bg-[#F0F7F6] border border-[#D0E5E1] rounded-none">
              <Pill className="w-8 h-8 text-[#8C877D] mx-auto mb-3" />
              <p className="font-semibold text-[#1A1918] font-editorial-serif text-base">No prescriptions found</p>
              <p className="text-[#69655E] mt-1 max-w-sm mx-auto">
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
                  <Card key={rx.prescriptionId} className="border-[#D0E5E1] rounded-none shadow-none hover:border-[#B6D6D0] transition-colors">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Prescription Meta */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#1A1918]">
                              {rx.prescriptionId}
                            </span>
                            {getStatusBadge(rx.status)}
                            <span className="text-[11px] text-[#69655E] flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-[#8C877D]" />
                              Issued: {new Date(rx.prescribedAt).toLocaleDateString()}
                            </span>
                            <span className="text-[11px] text-[#69655E] font-mono">
                              Expires: {new Date(rx.expiresAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-xs text-[#5C574F] flex flex-wrap gap-x-4 gap-y-1">
                            <div>
                              <span className="text-[#8C877D]">Patient:</span>{" "}
                              <span className="font-mono font-semibold text-[#1A1918]">
                                {rx.patientId}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#8C877D]">Prescriber:</span>{" "}
                              <span className="font-medium text-[#1A1918]">Dr. {rx.doctorId}</span>
                            </div>
                            <div>
                              <span className="text-[#8C877D]">Permitted Refills:</span>{" "}
                              <span className="font-semibold text-[#1A1918]">
                                {rx.remainingRefills ?? 0} remaining of {rx.maxRefills ?? 0}
                              </span>
                            </div>
                          </div>

                          {/* Medications list */}
                          <div className="pt-2 border-t border-[#D0E5E1] space-y-1.5">
                            {rx.medications.map((m, mIdx) => (
                              <div
                                key={mIdx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-[#F0F7F6] px-2.5 py-1.5 rounded-none border border-[#D0E5E1] gap-1"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                                  <span className="font-bold text-[#1A1918]">{m.name}</span>
                                  <span className="text-[10px] text-[#0F766E] font-mono">
                                    {m.code || "RxNorm"}
                                  </span>
                                  <span className="text-[#5C574F]">
                                    • {m.dosage} • {m.frequency}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#5C574F] sm:text-right font-mono">
                                  <span className="font-medium">Qty: {m.quantity}</span> (
                                  {m.durationDays} days)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Progress and Dispensing Action */}
                        <div className="lg:w-64 shrink-0 flex flex-col justify-between pt-3 lg:pt-0 lg:pl-5 lg:border-l border-[#D0E5E1] space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[#69655E] font-medium">Fulfilment</span>
                              <span className="font-bold text-[#1A1918] font-mono">
                                {dispensed} / {total} units ({progressPct}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#D0E5E1] rounded-none overflow-hidden">
                              <div
                                className={`h-full rounded-none transition-all ${
                                  progressPct === 100
                                    ? "bg-emerald-600"
                                    : progressPct > 0
                                    ? "bg-[#0F766E]"
                                    : "bg-[#8C877D]"
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-[#69655E] mt-1 flex justify-between font-mono">
                              <span>Remaining balance:</span>
                              <span className="font-bold text-[#0F766E]">{remaining} units</span>
                            </div>
                          </div>

                          <div>
                            {isCanDispense ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setSelectedPrescriptionForDispense(rx)}
                                className="w-full text-xs py-2 inline-flex items-center justify-center gap-1.5"
                              >
                                <Pill className="w-3.5 h-3.5" />
                                Dispense Medication
                              </Button>
                            ) : (
                              <div className="text-center p-2 rounded-none bg-[#F0F7F6] border border-[#D0E5E1] text-[11px] text-[#69655E] font-medium">
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
            <div className="p-12 text-center text-xs text-[#69655E] bg-[#F0F7F6] border border-[#D0E5E1] rounded-none">
              <History className="w-8 h-8 text-[#8C877D] mx-auto mb-3" />
              <p className="font-semibold text-[#1A1918] font-editorial-serif text-base">No dispensing events recorded yet</p>
              <p className="text-[#69655E] mt-1 max-w-sm mx-auto">
                Dispensed medications will be atomically registered here and logged into the source
                facility repository with FHIR MedicationDispense.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#D0E5E1] rounded-none overflow-hidden shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F0F7F6] border-b border-[#D0E5E1] text-[#69655E] font-mono font-medium uppercase tracking-wider text-[11px]">
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
                  <tbody className="divide-y divide-[#D0E5E1]">
                    {dispenses.map((evt) => (
                      <tr key={evt.dispenseId} className="hover:bg-[#F0F7F6]/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-[#1A1918]">
                            {evt.dispenseId}
                          </div>
                          <div className="text-[10px] text-[#69655E] mt-0.5 font-mono">
                            {new Date(evt.dispensedAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#1A1918]">
                          {evt.prescriptionId}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#5C574F]">
                          {evt.patientName || evt.patientAbha || "Patient"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#0F766E] bg-[#F0F7F6] px-2 py-0.5 rounded-none border border-[#D0E5E1] font-mono">
                            +{evt.quantityDispensed} units
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#69655E]">
                          {evt.remainingQuantityAfter} units
                        </td>
                        <td className="py-3 px-4 font-mono text-[#69655E] text-[11px]">
                          {evt.batchNumber || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-[#5C574F] text-[11px] truncate max-w-[160px]">
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

      <DirectDispenseModal
        isOpen={isDirectDispenseModalOpen}
        onClose={() => setIsDirectDispenseModalOpen(false)}
        defaultPatientId="SS-PAT-000001"
        onSuccess={() => {
          setIsDirectDispenseModalOpen(false);
          loadData();
          setActiveTab("dispenses");
        }}
      />
    </div>
  );
};
