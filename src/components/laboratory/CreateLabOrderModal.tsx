import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import {
  FlaskConical,
  Building2,
  User,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { createLaboratoryOrder, fetchDiscoverablePatients } from "../../api/client";
import type { DiscoverablePatient } from "../../types/api";

interface CreateLabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LAB_CATALOG = [
  { name: "Glycated Hemoglobin (HbA1c)", code: "LOINC-4548-4", defaultPriority: "ROUTINE" as const },
  { name: "Comprehensive Metabolic Panel (CMP)", code: "LOINC-24323-8", defaultPriority: "ROUTINE" as const },
  { name: "Lipid Profile & Serum Electrolytes Panel", code: "LOINC-24331-1", defaultPriority: "ROUTINE" as const },
  { name: "Complete Blood Count (CBC) with Differential", code: "LOINC-58410-2", defaultPriority: "ROUTINE" as const },
  { name: "Serum Electrolytes & Renal Function", code: "LOINC-24362-6", defaultPriority: "URGENT" as const },
  { name: "Thyroid Stimulating Hormone (TSH)", code: "LOINC-3016-3", defaultPriority: "ROUTINE" as const },
  { name: "Cardiac Troponin I (High Sensitivity)", code: "LOINC-49563-0", defaultPriority: "STAT" as const },
];

const TARGET_FACILITIES = [
  "Max Super Speciality Hospital, Saket",
  "Dr. Lal PathLabs, Delhi Central",
  "Apollo Clinics, Indiranagar",
  "Fortis Hospital, Bannerghatta",
];

export const CreateLabOrderModal: React.FC<CreateLabOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [patients, setPatients] = useState<DiscoverablePatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<string>(LAB_CATALOG[0].name);
  const [testName, setTestName] = useState<string>(LAB_CATALOG[0].name);
  const [testCode, setTestCode] = useState<string>(LAB_CATALOG[0].code);
  const [targetFacility, setTargetFacility] = useState<string>(TARGET_FACILITIES[0]);
  const [priority, setPriority] = useState<"ROUTINE" | "URGENT" | "STAT">("ROUTINE");
  const [instructions, setInstructions] = useState<string>("12-hour fasting required prior to specimen collection.");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDiscoverablePatients()
        .then((pts) => {
          setPatients(pts);
          if (pts.length > 0 && !selectedPatientId) {
            const first = pts[0];
            const pId = first.id || (first as unknown as { _id: string })._id;
            if (pId) setSelectedPatientId(pId);
          }
        })
        .catch(() => {
          // Fallback if needed
        });
    }
  }, [isOpen, selectedPatientId]);

  const handleSelectCatalog = (name: string) => {
    setSelectedCatalogItem(name);
    const item = LAB_CATALOG.find((i) => i.name === name);
    if (item) {
      setTestName(item.name);
      setTestCode(item.code);
      setPriority(item.defaultPriority);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError("Please select a target patient.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createLaboratoryOrder({
        patientId: selectedPatientId,
        targetFacility,
        testName,
        testCode,
        priority,
        instructions,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create laboratory test order");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-2 w-full">
      <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={loading}
        leftIcon={<FileCheck2 className="w-3.5 h-3.5" />}
      >
        {loading ? "Creating ServiceRequest..." : "Issue Laboratory Order"}
      </Button>
    </div>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Laboratory Test Order"
      description="Issue a FHIR R4 ServiceRequest for diagnostic specimen intake."
      footer={footer}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1 text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Patient Selection */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-teal-700" />
            Target Patient
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 text-xs"
            required
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.abhaAddress})
              </option>
            ))}
          </select>
        </div>

        {/* Test Selection from Catalog */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
            Clinical Test Catalogue
          </label>
          <select
            value={selectedCatalogItem}
            onChange={(e) => handleSelectCatalog(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 text-xs"
          >
            {LAB_CATALOG.map((item) => (
              <option key={item.code} value={item.name}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
        </div>

        {/* Target Facility & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              Target Laboratory Facility
            </label>
            <select
              value={targetFacility}
              onChange={(e) => setTargetFacility(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 text-xs"
            >
              {TARGET_FACILITIES.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Order Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "ROUTINE" | "URGENT" | "STAT")}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 text-xs font-semibold"
            >
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent (24h)</option>
              <option value="STAT">STAT / Immediate</option>
            </select>
          </div>
        </div>

        {/* Clinical Instructions */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Specimen Intake Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 text-xs"
            placeholder="E.g., 12-hour fasting, EDTA tube, refrigerated transport..."
          />
        </div>

        <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-[11px] text-teal-800 flex items-start gap-2">
          <FileCheck2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <span>
            This action creates a synthetic <strong>FHIR R4 ServiceRequest</strong> tied to the patient's care context and routed strictly to the assigned laboratory facility.
          </span>
        </div>
      </form>
    </Dialog>
  );
};
