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
  id: "PAT-000001",
  name: "Verified Patient",
  age: 30,
  gender: "Other",
  bloodGroup: "O+",
  abhaId: "",
  abhaAddress: "",
  phone: "",
  emergencyContact: {
    name: "",
    relationship: "",
    phone: "",
  },
};

export const SYNTHETIC_RECORDS: SyntheticHealthRecord[] = [];

export const SYNTHETIC_CONSENTS: SyntheticConsent[] = [];
