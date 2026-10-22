import React from "react";
import { PageHeader } from "../ui/PageHeader";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  FileText,
  ShieldCheck,
  Pill,
  FlaskConical,
  Clock,
  Bell,
  Settings,
  ArrowLeft,
  Info,
} from "lucide-react";
import type { NavigationRoute } from "../layout/navigation";

interface PlaceholderViewProps {
  route: NavigationRoute;
  onBackToDashboard: () => void;
}

const ROUTE_CONFIG: Record<
  NavigationRoute,
  {
    title: string;
    breadcrumb: string;
    description: string;
    milestone: string;
    icon: React.ComponentType<{ className?: string }>;
    details: string;
  }
> = {
  dashboard: {
    title: "Dashboard",
    breadcrumb: "Portal / Overview",
    description: "Longitudinal health records overview and active ABDM consents.",
    milestone: "Step 3 (Active)",
    icon: FileText,
    details: "Interactive dashboard preview with synthetic health records.",
  },
  records: {
    title: "Health Records",
    breadcrumb: "Portal / Clinical Records",
    description: "Longitudinal FHIR R4 document bundles and diagnostic history.",
    milestone: "Step 4 & 5",
    icon: FileText,
    details:
      "Full pagination, FHIR R4 document bundle importer, condition timelines, and DICOM imaging report viewers will be wired to backend REST endpoints in upcoming milestones.",
  },
  consents: {
    title: "Consent Management",
    breadcrumb: "Portal / ABDM Consents",
    description: "Ayushman Bharat Digital Mission (ABDM) electronic consent requests and artefact management.",
    milestone: "Step 4",
    icon: ShieldCheck,
    details:
      "Automated consent request lifecycle (REQUESTED, GRANTED, DENIED, REVOKED, EXPIRED) communicating with the mock ABDM gateway and BullMQ async event processor.",
  },
  prescriptions: {
    title: "Prescriptions (MedicationRequest)",
    breadcrumb: "Portal / Medications",
    description: "Active medication orders, digital prescriptions, and refill authorizations.",
    milestone: "Step 5",
    icon: Pill,
    details:
      "Structured dosage instructions, drug interaction flags, and QR-verifiable e-prescriptions compliant with NRCES FHIR R4 MedicationRequest.",
  },
  labs: {
    title: "Laboratory Reports",
    breadcrumb: "Portal / Diagnostics",
    description: "Standardized pathology, biochemistry, and microbiology reports.",
    milestone: "Step 5",
    icon: FlaskConical,
    details:
      "LOINC-coded observations, reference range visualizers, and specimen tracking will be implemented in Step 5.",
  },
  access: {
    title: "Access History & Audit Logs",
    breadcrumb: "Portal / Compliance",
    description: "Immutable security audit trail of all HIU health information queries.",
    milestone: "Step 4 & 5",
    icon: Clock,
    details:
      "ABDM compliant audit trail recording timestamp, requester HIP/HIU ID, purpose code, and cryptographic verification status.",
  },
  notifications: {
    title: "Notifications & Alerts",
    breadcrumb: "Portal / Alerts",
    description: "System notifications, care context links, and consent requests.",
    milestone: "Step 4",
    icon: Bell,
    details:
      "Websocket / Redis PubSub notifications for real-time ABDM consent push notifications and async job completions.",
  },
  settings: {
    title: "Portal Settings & Preferences",
    breadcrumb: "Portal / Account",
    description: "ABHA profile settings, notification preferences, and privacy controls.",
    milestone: "Step 5",
    icon: Settings,
    details:
      "ABHA verification controls, linked mobile number updates, and encryption key management.",
  },
};

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  route,
  onBackToDashboard,
}) => {
  const config = ROUTE_CONFIG[route] || ROUTE_CONFIG.dashboard;
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        breadcrumb={config.breadcrumb}
        description={config.description}
        badge={
          <Badge variant="neutral" size="sm">
            Planned for {config.milestone}
          </Badge>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={onBackToDashboard}
          >
            Back to Dashboard
          </Button>
        }
      />

      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-4 shadow-xs">
            <Icon className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            {config.title} Architecture Preview
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            {config.details}
          </p>

          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-lg max-w-lg text-left text-xs text-slate-700 mb-6">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Per project constraints, working clinical functionality is implemented incrementally.
              You can test the active records and consent flows directly on the <strong>Dashboard</strong>.
            </span>
          </div>

          <Button variant="primary" size="sm" onClick={onBackToDashboard}>
            Return to Active Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
