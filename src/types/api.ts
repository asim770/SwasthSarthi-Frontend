export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
  timestamp: string;
}

export interface HealthCheckData {
  status: "healthy" | "degraded";
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  services: {
    api: {
      status: "up" | "down";
    };
    database: {
      type: "mongodb";
      status: "connected" | "connecting" | "disconnecting" | "disconnected";
      databaseName?: string;
    };
    redis: {
      status: "connected" | "connecting" | "reconnecting" | "disconnected";
      latencyMs?: number;
    };
  };
}

export type UserRole = "patient" | "doctor" | "laboratory" | "pharmacy" | "admin";

export interface AuthenticatedUser {
  id: string;
  abhaId: string;
  abhaAddress: string;
  name: string;
  role: UserRole;
  phone: string;
  facility?: string;
  specialization?: string;
  isActive: boolean;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface AuthChallengeResponse {
  challengeId: string;
  maskedIdentifier: string;
  role?: UserRole;
  name?: string;
  expiresAt: string;
  resendAvailableInSeconds: number;
  demoMode: boolean;
  note: string;
}

export interface AuthVerifyResponse {
  user: AuthenticatedUser;
  csrfToken: string;
  message: string;
}

export interface MockOtpResponse {
  challengeId: string;
  demoOtp: string;
  expiresAt: string;
  attemptsRemaining: number;
  environment: string;
  deliveryChannel: string;
  note: string;
}

export interface ConsentDecision {
  action: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  timestamp: string;
  note?: string;
  approvedHiTypes?: string[];
}

export interface ConsentItem {
  _id: string;
  consentId: string;
  patientId: {
    _id?: string;
    name?: string;
    abhaId?: string;
    abhaAddress?: string;
    gender?: string;
    dateOfBirth?: string;
  };
  requesterDoctorId: {
    _id?: string;
    name?: string;
    abhaId?: string;
    specialization?: string;
    facility?: string;
  };
  requesterFacility: string;
  purpose: string;
  hiTypes: string[];
  approvedHiTypes: string[];
  dateRangeFrom: string;
  dateRangeTo: string;
  expiresAt: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "REVOKED" | "EXPIRED" | "REQUESTED" | "GRANTED";
  version: number;
  decisionHistory?: ConsentDecision[];
  grantedAt?: string;
  revokedAt?: string;
  deniedAt?: string;
  signature?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoverablePatient {
  id: string;
  name: string;
  abhaId: string;
  abhaAddress: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface TimelineRecordItem {
  id: string;
  recordId: string;
  title: string;
  resourceType: string;
  category: string;
  date: string;
  status: string;
  summary: string;
  providerFacility: string;
  doctorName: string;
  sourceInstitution: string;
  careContextId: string;
  bundleId: string;
  isMockData: boolean;
  origin: "vault" | "abdm_transfer";
  rawResourceId?: string;
  details?: Record<string, unknown>;
}

export interface CareContextItem {
  careContextId: string;
  patientAbhaAddress: string;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  description: string;
  resourceCount: number;
  availableHiTypes: string[];
  earliestDate: string;
  latestDate: string;
  isMockData: true;
}

export interface HealthTransferReport {
  transferId: string;
  transactionId: string;
  consentId: string;
  status: "REQUESTED" | "PROCESSING" | "TRANSFERRED" | "FAILED";
  hipId: string;
  hipName: string;
  requestedHiTypes: string[];
  recordCount: number;
  bundleId?: string;
  retryCount: number;
  lastAttemptAt: string;
  completedAt?: string;
  failureReason?: string;
  expiresAt: string;
  isMockInteraction: true;
}

export interface LabOrderItem {
  _id: string;
  orderId: string;
  patientId: string;
  patientName: string;
  patientAbha: string;
  doctorId: string;
  doctorName: string;
  targetFacility: string;
  testName: string;
  testCode: string;
  priority: "ROUTINE" | "URGENT" | "STAT";
  status: "ORDERED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  instructions?: string;
  orderedAt: string;
  completedAt?: string;
  reportRecordId?: string;
  fhirResource?: Record<string, unknown>;
}

export interface DiagnosticObservationItem {
  code: string;
  name: string;
  value: number | string;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
}

export interface PrescriptionMedicationItem {
  code?: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route?: string;
  quantity: number;
  remainingQuantity: number;
  instructions?: string;
}

export interface DispensationEventItem {
  dispenseId?: string;
  idempotencyKey?: string;
  dispensedAt: string;
  pharmacyFacility: string;
  pharmacistId: string;
  pharmacistName?: string;
  quantityDispensed: number;
  remainingQuantityAfter?: number;
  notes?: string;
}

export interface PrescriptionItem {
  _id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  facility: string;
  medications: PrescriptionMedicationItem[];
  status: "ACTIVE" | "PARTIALLY_DISPENSED" | "DISPENSED" | "EXPIRED" | "CANCELLED";
  totalQuantity: number;
  dispensedQuantity: number;
  remainingQuantity: number;
  maxRefills: number;
  remainingRefills: number;
  prescribedAt: string;
  expiresAt: string;
  dispensedEvents: DispensationEventItem[];
  fhirResource?: Record<string, unknown>;
}

export interface DispensingRecordItem {
  _id: string;
  dispenseId: string;
  idempotencyKey: string;
  prescriptionId: string;
  patientName: string;
  patientAbha: string;
  pharmacistName: string;
  pharmacyFacility: string;
  medicationName: string;
  quantityDispensed: number;
  remainingQuantityAfter: number;
  batchNumber?: string;
  notes?: string;
  dispensedAt: string;
  status: string;
}

export type FacilityType = "HOSPITAL" | "LABORATORY" | "PHARMACY" | "CLINIC";
export type FacilityStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface FacilityChangeHistoryItem {
  fromStatus: FacilityStatus;
  toStatus: FacilityStatus;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason?: string;
}

export interface FacilityItem {
  _id: string;
  facilityId: string;
  name: string;
  type: FacilityType;
  status: FacilityStatus;
  contactPhone?: string;
  contactEmail?: string;
  address?: {
    line?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  demoHfrId?: string;
  registeredBy: string;
  registeredByName: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  statusReason?: string;
  changeHistory: FacilityChangeHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PractitionerVerificationItem {
  _id: string;
  name: string;
  role: UserRole;
  abhaId: string;
  abhaAddress: string;
  facility?: string;
  specialization?: string;
  hprId?: string;
  hfrId?: string;
  verificationStatus: FacilityStatus;
  verifiedAt?: string;
  verifiedByName?: string;
  statusReason?: string;
  isActive: boolean;
  createdAt: string;
}

export type NotificationCategory =
  | "CONSENT"
  | "CLINICAL_ACCESS"
  | "LAB_REPORT"
  | "PHARMACY_DISPENSE"
  | "ONBOARDING"
  | "SECURITY"
  | "SYSTEM";

export interface NotificationItem {
  _id: string;
  notificationId: string;
  recipientId: string;
  recipientAbha: string;
  recipientRole?: string;
  category: NotificationCategory;
  title: string;
  message: string;
  relatedResourceId?: string;
  relatedResourceType?: string;
  isRead: boolean;
  readAt?: string;
  deliveryStatus: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
  createdAt: string;
}

export interface AuditChainVerificationReport {
  valid: boolean;
  totalVerified: number;
  headSequence?: number;
  lastEventHash?: string;
  error?: string;
  timestamp: string;
  integrityStatus: "INTACT" | "TAMPERED" | "EMPTY";
}

export interface PatientAccessEventItem {
  eventId: string;
  action: string;
  actionLabel: string;
  actorRole?: string;
  actorName?: string;
  facility?: string;
  targetResourceType: string;
  targetResourceId?: string;
  outcome: "ALLOWED" | "DENIED" | "FAILED";
  denialReason?: string;
  timestamp: string;
}

