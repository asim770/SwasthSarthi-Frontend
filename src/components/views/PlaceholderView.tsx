import React, { useState, useEffect } from "react";
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
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import type { NavigationRoute } from "../layout/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  fetchLabOrders,
  fetchPrescriptions,
  fetchAdminAudit,
  fetchAdminOverview,
} from "../../api/client";

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
    milestone: "Step 5 (DAL Enforced)",
    icon: FileText,
    details:
      "All reads and writes are protected by the server-side Data Access Layer (DAL). Patients access own records; Doctors require active, unexpired, granted consent.",
  },
  consents: {
    title: "Consent Management",
    breadcrumb: "Portal / ABDM Consents",
    description: "Ayushman Bharat Digital Mission (ABDM) electronic consent artefacts and lifecycle.",
    milestone: "Step 5 & 6",
    icon: ShieldCheck,
    details:
      "Consent requests and permissions are evaluated server-side per resource category and date range.",
  },
  prescriptions: {
    title: "Prescriptions & Dispensation",
    breadcrumb: "Portal / Medications",
    description: "Active medication orders, digital prescriptions, and refill authorizations.",
    milestone: "Step 5 (Active)",
    icon: Pill,
    details:
      "Authorized pharmacy fulfillment workflow with server-side refill tracking and status verification.",
  },
  labs: {
    title: "Laboratory Diagnostic Intake",
    breadcrumb: "Portal / Diagnostics",
    description: "Standardized pathology, biochemistry, and microbiology test orders.",
    milestone: "Step 5 (Active)",
    icon: FlaskConical,
    details:
      "Facility-scoped specimen intake and diagnostic report submission guarded by backend membership checks.",
  },
  access: {
    title: "Access History & Audit Logs",
    breadcrumb: "Portal / Compliance",
    description: "Security audit trail of all HIU health information queries and administrative actions.",
    milestone: "Step 5 (Active)",
    icon: Clock,
    details:
      "Immutable security audit trail recording action, principal, target resource, outcome, and timestamps.",
  },
  notifications: {
    title: "Notifications & Alerts",
    breadcrumb: "Portal / Alerts",
    description: "System notifications, care context links, and consent requests.",
    milestone: "Step 5",
    icon: Bell,
    details:
      "Push notifications for electronic consent requests, authorizations, and diagnostic report completions.",
  },
  settings: {
    title: "Portal Settings & Preferences",
    breadcrumb: "Portal / Account",
    description: "ABHA profile settings, notification preferences, and privacy controls.",
    milestone: "Step 5",
    icon: Settings,
    details:
      "ABHA verification controls, linked mobile updates, and encryption key management.",
  },
};

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  route,
  onBackToDashboard,
}) => {
  const { user, isAuthenticated } = useAuth();
  const config = ROUTE_CONFIG[route] || ROUTE_CONFIG.dashboard;
  const Icon = config.icon;

  // Active role-specific data states
  const [dataLoading, setDataLoading] = useState(false);
  const [labOrders, setLabOrders] = useState<unknown[]>([]);
  const [prescriptions, setPrescriptions] = useState<unknown[]>([]);
  const [auditLogs, setAuditLogs] = useState<unknown[]>([]);
  const [adminOverview, setAdminOverview] = useState<{
    totalUsers: number;
    activeSessions: number;
    totalConsents: number;
    grantedConsents: number;
  } | null>(null);

  // Load role-specific datasets when route matches
  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated || !user) return;

    const loadRoleData = async () => {
      setDataLoading(true);
      try {
        if (user.role === "laboratory" && route === "labs") {
          const data = await fetchLabOrders();
          if (mounted) setLabOrders(data as unknown[]);
        } else if (user.role === "pharmacy" && route === "prescriptions") {
          const data = await fetchPrescriptions();
          if (mounted) setPrescriptions(data as unknown[]);
        } else if (user.role === "admin" && route === "access") {
          const [audit, overview] = await Promise.all([fetchAdminAudit(), fetchAdminOverview()]);
          if (mounted) {
            setAuditLogs(audit as unknown[]);
            setAdminOverview(overview);
          }
        }
      } catch (err) {
        console.warn("Role data fetch notice:", err);
      } finally {
        if (mounted) setDataLoading(false);
      }
    };

    loadRoleData();

    return () => {
      mounted = false;
    };
  }, [user, isAuthenticated, route]);

  // 1. RBAC Check: Administrative users strictly forbidden from clinical content
  const isAdminBlocked =
    user?.role === "admin" && ["records", "prescriptions", "labs"].includes(route);

  // 2. RBAC Check: Laboratory restricted to test orders
  const isLabBlocked =
    user?.role === "laboratory" && ["records", "prescriptions"].includes(route);

  // 3. RBAC Check: Pharmacy restricted to prescriptions
  const isPharmacyBlocked =
    user?.role === "pharmacy" && ["records", "labs"].includes(route);

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        breadcrumb={config.breadcrumb}
        description={config.description}
        badge={
          <Badge variant={isAdminBlocked || isLabBlocked || isPharmacyBlocked ? "danger" : "teal"} size="sm">
            {isAdminBlocked || isLabBlocked || isPharmacyBlocked ? "DAL Policy: Denied" : config.milestone}
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

      {/* 403 Forbidden Screen for Administrator attempting to access Clinical Content */}
      {isAdminBlocked && (
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700 mb-4 shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-red-900 mb-1">
              403 Forbidden — Clinical Data Access Denied
            </h3>
            <p className="text-xs text-red-700 max-w-lg mb-6 leading-relaxed">
              <strong>Security Policy Rule (DAL):</strong> Administrative users are strictly forbidden
              from reading patient clinical records, FHIR bundles, diagnostic reports, or prescriptions.
              Administrative privileges grant operational oversight and user governance only.
            </p>
            <div className="flex items-center gap-2 p-3 bg-white border border-red-200 rounded-lg max-w-md text-left text-xs text-red-800 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                Backend policy assertion <code>assertDenyAdminClinicalAccess()</code> enforces this restriction on every API call.
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={onBackToDashboard}>
              Return to Administrative Overview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 403 Forbidden Screen for Laboratory or Pharmacy out of scope */}
      {(isLabBlocked || isPharmacyBlocked) && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-amber-900 mb-1">
              403 Forbidden — Resource Outside Authorized Scope
            </h3>
            <p className="text-xs text-amber-800 max-w-md mb-6 leading-relaxed">
              Your role (<strong>{user?.role}</strong>) does not have authorization to browse general
              longitudinal medical history. Access is restricted exclusively to authorized test orders or dispensing workflows.
            </p>
            <Button variant="secondary" size="sm" onClick={onBackToDashboard}>
              Return to Assigned Workspace
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Authorized Administrator View: Audit Logs & Operational Health */}
      {!isAdminBlocked && user?.role === "admin" && route === "access" && (
        <div className="space-y-6">
          {adminOverview && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-[#d7eaea] rounded-[18px] shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
                <span className="text-xs text-[#64748b] block">Total Users</span>
                <span className="text-xl font-bold text-[#172033]">{adminOverview.totalUsers}</span>
              </div>
              <div className="p-4 bg-white border border-[#d7eaea] rounded-[18px] shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
                <span className="text-xs text-[#64748b] block">Active Sessions</span>
                <span className="text-xl font-bold text-emerald-600">{adminOverview.activeSessions}</span>
              </div>
              <div className="p-4 bg-white border border-[#d7eaea] rounded-[18px] shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
                <span className="text-xs text-[#64748b] block">Total Consents</span>
                <span className="text-xl font-bold text-[#172033]">{adminOverview.totalConsents}</span>
              </div>
              <div className="p-4 bg-white border border-[#d7eaea] rounded-[18px] shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
                <span className="text-xs text-[#64748b] block">Granted Consents</span>
                <span className="text-xl font-bold text-[#008080]">{adminOverview.grantedConsents}</span>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-[#172033]">Security Audit Trail (DAL Verified)</h4>
                <Badge variant="teal" size="sm">Live Server Telemetry</Badge>
              </div>
              {dataLoading ? (
                <div className="py-8 text-center text-xs text-[#64748b]">Loading audit trail...</div>
              ) : auditLogs.length > 0 ? (
                <div className="divide-y divide-[#d7eaea]/50 overflow-x-auto">
                  {(auditLogs as Array<{
                    _id: string;
                    action: string;
                    principalRole?: string;
                    targetResourceType: string;
                    outcome: string;
                    timestamp: string;
                  }>).slice(0, 10).map((log) => (
                    <div key={log._id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.outcome === "ALLOWED" ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <span className="font-mono font-semibold text-[#172033]">{log.action}</span>
                        <span className="text-[#64748b]">({log.targetResourceType})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#64748b] uppercase">{log.principalRole}</span>
                        <Badge
                          variant={log.outcome === "ALLOWED" ? "success" : "danger"}
                          size="sm"
                        >
                          {log.outcome}
                        </Badge>
                        <span className="text-[10px] text-[#64748b] font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#64748b]">No audit events recorded yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Authorized Laboratory View: Test Orders */}
      {!isLabBlocked && user?.role === "laboratory" && route === "labs" && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#172033]">
                Assigned Laboratory Orders ({user.facility})
              </h4>
              <Badge variant="teal" size="sm">Facility Scoped</Badge>
            </div>
            {dataLoading ? (
              <div className="py-8 text-center text-xs text-[#64748b]">Loading test orders...</div>
            ) : labOrders.length > 0 ? (
              <div className="divide-y divide-[#d7eaea]/50">
                {(labOrders as Array<{
                  orderId: string;
                  patientName: string;
                  testName: string;
                  priority: string;
                  status: string;
                  orderedAt: string;
                }>).map((order) => (
                  <div key={order.orderId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-[#172033]">
                        <span>{order.testName}</span>
                        <Badge variant="neutral" size="sm">{order.priority}</Badge>
                      </div>
                      <span className="text-[#475569] text-[11px]">
                        Patient: <strong>{order.patientName}</strong> • Order ID: <code>{order.orderId}</code>
                      </span>
                    </div>
                    <Badge variant={order.status === "COMPLETED" ? "success" : "teal"} size="sm">
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#64748b]">No active test orders assigned to your facility.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Authorized Pharmacy View: Prescriptions */}
      {!isPharmacyBlocked && user?.role === "pharmacy" && route === "prescriptions" && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#172033]">
                Active Eligible Prescriptions ({user.facility})
              </h4>
              <Badge variant="teal" size="sm">Fulfillment Allowed</Badge>
            </div>
            {dataLoading ? (
              <div className="py-8 text-center text-xs text-[#64748b]">Loading prescriptions...</div>
            ) : prescriptions.length > 0 ? (
              <div className="divide-y divide-[#d7eaea]/50">
                {(prescriptions as Array<{
                  prescriptionId: string;
                  patientName: string;
                  medications: Array<{ name: string; dosage: string; frequency: string }>;
                  remainingRefills: number;
                  status: string;
                }>).map((rx) => (
                  <div key={rx.prescriptionId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#172033] block">
                        {rx.medications.map((m) => `${m.name} (${m.dosage})`).join(", ")}
                      </span>
                      <span className="text-[#475569] text-[11px]">
                        Patient: <strong>{rx.patientName}</strong> • Refills Remaining: <strong>{rx.remainingRefills}</strong>
                      </span>
                    </div>
                    <Badge variant="success" size="sm">{rx.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#64748b]">No active prescriptions available.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Default Architecture Preview for other screens */}
      {!isAdminBlocked && !isLabBlocked && !isPharmacyBlocked && !(user?.role === "admin" && route === "access") && !(user?.role === "laboratory" && route === "labs") && !(user?.role === "pharmacy" && route === "prescriptions") && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-[18px] bg-[#f0fdfa] border border-[#d7eaea] flex items-center justify-center text-[#008080] mb-4 shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
              <Icon className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[#172033] mb-1">
              {config.title} Architecture Overview
            </h3>
            <p className="text-xs text-[#475569] max-w-md mb-6 leading-relaxed">
              {config.details}
            </p>

            <div className="flex items-center gap-2 p-3 bg-[#f0fdfa] border border-[#d7eaea] rounded-[12px] max-w-lg text-left text-xs text-[#475569] mb-6">
              <Info className="w-4 h-4 text-[#008080] shrink-0" />
              <span>
                Backend authorization policies are active. You are authenticated as{" "}
                <strong className="text-[#172033]">{user ? `${user.name} (${user.role})` : "Guest"}</strong>.
              </span>
            </div>

            <Button variant="primary" size="sm" onClick={onBackToDashboard}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
