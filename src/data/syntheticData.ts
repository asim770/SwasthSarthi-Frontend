export interface SyntheticPatient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  abhaId: string;
  abhaAddress: string;
  phone: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface SyntheticHealthRecord {
  id: string;
  title: string;
  resourceType: "DiagnosticReport" | "Encounter" | "Immunization" | "Observation" | "MedicationRequest";
  date: string;
  provider: string;
  doctor: string;
  status: "final" | "completed" | "active" | "amended";
  summary: string;
  careContextId: string;
  fhirBundleId: string;
}

export interface SyntheticConsent {
  id: string;
  requester: string;
  hiuType: string;
  purpose: string;
  dateRange: string;
  dataTypes: string[];
  status: "GRANTED" | "PENDING" | "REVOKED" | "EXPIRED";
  requestedAt: string;
  expiresAt: string;
}

export const SYNTHETIC_PATIENT: SyntheticPatient = {
  id: "PAT-2026-0042",
  name: "Rahul Verma",
  age: 34,
  gender: "Male",
  bloodGroup: "B+",
  abhaId: "32-8492-1920-4491",
  abhaAddress: "rahul.verma@sbx",
  phone: "+91 98765 43210",
  emergencyContact: {
    name: "Priya Verma",
    relationship: "Spouse",
    phone: "+91 98765 43211",
  },
};

export const SYNTHETIC_RECORDS: SyntheticHealthRecord[] = [
  {
    id: "REC-2026-101",
    title: "Comprehensive Metabolic & Lipid Panel",
    resourceType: "DiagnosticReport",
    date: "2026-10-18",
    provider: "Max Super Speciality Hospital",
    doctor: "Dr. Arvind Saxena (Endocrinology)",
    status: "final",
    summary: "Fasting blood glucose 92 mg/dL (Normal). HbA1c 5.4%. Total cholesterol 178 mg/dL. Kidney and liver enzyme profiles within healthy reference ranges.",
    careContextId: "MAX-DEL-ENC-2026-8812",
    fhirBundleId: "urn:uuid:7b3a98e2-c451-4091-bf92-12e840d708e1",
  },
  {
    id: "REC-2026-092",
    title: "Cardiology Follow-up & 12-Lead ECG",
    resourceType: "Encounter",
    date: "2026-10-02",
    provider: "Apollo Clinics, Indiranagar",
    doctor: "Dr. Ananya Sharma (Cardiology)",
    status: "completed",
    summary: "Resting arterial BP 118/76 mmHg, pulse 72 bpm. 12-lead resting ECG confirms normal sinus rhythm without ischemic ST-T abnormalities.",
    careContextId: "APOLLO-BLR-OP-2026-4412",
    fhirBundleId: "urn:uuid:fa490b65-27a9-4670-bb5c-91544a055ff2",
  },
  {
    id: "REC-2026-074",
    title: "Seasonal Quadrivalent Influenza Vaccine",
    resourceType: "Immunization",
    date: "2026-09-14",
    provider: "Fortis Hospital, Bannerghatta",
    doctor: "Dr. Rajesh Iyer (Internal Medicine)",
    status: "completed",
    summary: "0.5mL intramuscular dose administered in left deltoid. Lot #FL2026-99A. Zero immediate adverse reactions observed during 15-minute monitoring.",
    careContextId: "FORTIS-BLR-IMM-2026-1092",
    fhirBundleId: "urn:uuid:31c6a6f1-a110-449e-b9a3-5c8e03bc0214",
  },
  {
    id: "REC-2026-055",
    title: "Slit-Lamp & Non-Mydriatic Fundus Exam",
    resourceType: "Observation",
    date: "2026-08-28",
    provider: "Narayana Nethralaya",
    doctor: "Dr. Meenakshi Rao (Ophthalmology)",
    status: "final",
    summary: "Intraocular pressure: OD 14 mmHg, OS 15 mmHg. Bilateral clear crystalline lenses. Retinal vasculature intact without microaneurysms.",
    careContextId: "NN-BLR-OPH-2026-0043",
    fhirBundleId: "urn:uuid:9a7f8092-d61b-426b-9502-39c0a66d0b49",
  },
  {
    id: "REC-2026-031",
    title: "Oral Maintenance Therapy Prescription",
    resourceType: "MedicationRequest",
    date: "2026-08-10",
    provider: "Manipal Hospital",
    doctor: "Dr. Sunita Deshmukh",
    status: "active",
    summary: "Vitamin D3 60,000 IU weekly for 8 weeks; Methylcobalamin 1500 mcg daily with breakfast. Refills authorized: 2.",
    careContextId: "MANIPAL-RX-2026-7781",
    fhirBundleId: "urn:uuid:68e91cf0-5c4d-4952-ba64-773df01825ae",
  },
];

export const SYNTHETIC_CONSENTS: SyntheticConsent[] = [
  {
    id: "CON-ABDM-2026-001",
    requester: "Apollo Heart Institute",
    hiuType: "Tertiary Hospital (HIU)",
    purpose: "Longitudinal Care Management & Specialist Consultation",
    dateRange: "2026-01-01 to 2026-10-22",
    dataTypes: ["DiagnosticReport", "Encounter", "Observation"],
    status: "GRANTED",
    requestedAt: "2026-10-01",
    expiresAt: "2026-12-31",
  },
  {
    id: "CON-ABDM-2026-002",
    requester: "Fortis Clinical Research Registry",
    hiuType: "Research Institution",
    purpose: "De-identified Epidemiological Study on Cardiovascular Biomarkers",
    dateRange: "2025-01-01 to 2026-10-01",
    dataTypes: ["DiagnosticReport", "Observation"],
    status: "PENDING",
    requestedAt: "2026-10-20",
    expiresAt: "2026-11-05",
  },
  {
    id: "CON-ABDM-2026-003",
    requester: "Medanta Telehealth Hub",
    hiuType: "Telemedicine Platform",
    purpose: "Remote Second Opinion Evaluation",
    dateRange: "2026-06-01 to 2026-09-01",
    dataTypes: ["DiagnosticReport", "MedicationRequest"],
    status: "REVOKED",
    requestedAt: "2026-08-15",
    expiresAt: "2026-10-01",
  },
];
