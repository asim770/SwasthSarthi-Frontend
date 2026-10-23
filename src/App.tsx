import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { NAV_ITEMS, type NavigationRoute } from "./components/layout/navigation";
import { Header } from "./components/layout/Header";
import { DashboardView } from "./components/dashboard/DashboardView";
import { PlaceholderView } from "./components/views/PlaceholderView";
import { ConsentManagementView } from "./components/consents/ConsentManagementView";
import { PatientTimelineView } from "./components/records/PatientTimelineView";
import { LaboratoryDashboardView } from "./components/laboratory/LaboratoryDashboardView";
import { PharmacyDashboardView } from "./components/pharmacy/PharmacyDashboardView";
import { PatientAccessHistoryView } from "./components/access/PatientAccessHistoryView";
import { NotificationListView } from "./components/notifications/NotificationListView";
import { AdminManagementView } from "./components/admin/AdminManagementView";
import { RecordDetailsModal } from "./components/dashboard/RecordDetailsModal";
import { UploadRecordModal } from "./components/dashboard/UploadRecordModal";
import { ConsentDetailsModal } from "./components/dashboard/ConsentDetailsModal";
import { HealthDiagnosticsModal } from "./components/dashboard/HealthDiagnosticsModal";
import { LoginModal } from "./components/auth/LoginModal";
import { useAuth } from "./context/AuthContext";
import { checkSystemHealth } from "./api/client";
import type { HealthCheckData } from "./types/api";
import {
  SYNTHETIC_RECORDS,
  SYNTHETIC_CONSENTS,
  type SyntheticHealthRecord,
  type SyntheticConsent,
} from "./data/syntheticData";

export default function App() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Navigation & Shell State
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Auth Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => {
    return typeof window !== "undefined" && window.location.pathname === "/login";
  });

  // Telemetry & Health State
  const [healthData, setHealthData] = useState<HealthCheckData | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);

  // Clinical Records & Consents State (synthetic data for demo)
  const [records, setRecords] = useState<SyntheticHealthRecord[]>(SYNTHETIC_RECORDS);
  const [consents, setConsents] = useState<SyntheticConsent[]>(SYNTHETIC_CONSENTS);

  // Active Modals State
  const [selectedRecord, setSelectedRecord] = useState<SyntheticHealthRecord | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<SyntheticConsent | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Handle URL changes for /login
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === "/login") {
        setIsLoginModalOpen(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleOpenLogin = useCallback(() => {
    setIsLoginModalOpen(true);
    if (window.location.pathname !== "/login") {
      window.history.pushState({}, "", "/login");
    }
  }, []);

  const handleCloseLogin = useCallback(() => {
    setIsLoginModalOpen(false);
    if (window.location.pathname === "/login") {
      window.history.pushState({}, "", "/");
    }
  }, []);

  // Redirect to role landing page on successful authentication
  const handleSuccessfulLogin = useCallback((role?: string) => {
    setIsLoginModalOpen(false);
    if (window.location.pathname === "/login") {
      window.history.pushState({}, "", "/");
    }
    if (role === "doctor") setCurrentRoute("records");
    else if (role === "laboratory") setCurrentRoute("labs");
    else if (role === "pharmacy") setCurrentRoute("prescriptions");
    else if (role === "admin") setCurrentRoute("access");
    else setCurrentRoute("dashboard");
  }, []);

  // Fetch Gateway health status
  const probeHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await checkSystemHealth();
      setHealthData(data);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : "Failed to connect to API gateway");
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    checkSystemHealth()
      .then((data) => {
        if (active) setHealthData(data);
      })
      .catch((err) => {
        if (active) {
          setHealthError(err instanceof Error ? err.message : "API gateway unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Handlers for record ingest and consent update
  const handleAddNewRecord = (newRecordData: {
    title: string;
    resourceType: "DiagnosticReport" | "Encounter" | "Immunization";
    provider: string;
    doctor: string;
    summary: string;
  }) => {
    const newRecord: SyntheticHealthRecord = {
      id: `REC-2026-${String(records.length + 101).padStart(3, "0")}`,
      title: newRecordData.title,
      resourceType: newRecordData.resourceType,
      date: new Date().toISOString().split("T")[0],
      provider: newRecordData.provider,
      doctor: newRecordData.doctor,
      status: "final",
      summary: newRecordData.summary,
      careContextId: `ABDM-DOC-${Date.now().toString().slice(-6)}`,
      fhirBundleId: `urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : "demo-uuid"}`,
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleUpdateConsentStatus = (id: string, newStatus: "GRANTED" | "REVOKED") => {
    setConsents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  const currentRouteMeta = NAV_ITEMS.find((item) => item.id === currentRoute);
  const currentRouteTitle = currentRouteMeta ? currentRouteMeta.label : "Dashboard";

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-100/60 to-slate-200/30 overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenLogin={handleOpenLogin}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentRouteTitle={currentRouteTitle}
          onOpenMobileNav={() => setIsMobileOpen(true)}
          healthData={healthData}
          onOpenHealthModal={() => setIsHealthModalOpen(true)}
          onOpenLogin={handleOpenLogin}
          onNavigateNotifications={() => setCurrentRoute("notifications")}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {/* Compact Contextual Session / Workspace Indicator */}
            {!authLoading && !isAuthenticated && (
              <div className="mb-4 px-3.5 py-2 glass-panel rounded-xl flex items-center justify-between gap-3 text-xs text-slate-700 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse shrink-0" />
                  <span className="text-slate-600">
                    <strong>Demo Sandbox:</strong> Browsing as guest. Sign in to simulate Doctor, Lab, Pharmacy, or Admin roles.
                  </span>
                </div>
                <button
                  onClick={handleOpenLogin}
                  className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {isAuthenticated && user && user.role !== "patient" && (
              <div className="mb-4 px-3.5 py-2 glass-panel rounded-xl flex items-center justify-between gap-3 text-xs text-slate-700 shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-800 border border-teal-500/20 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                    {user.role}
                  </span>
                  <span className="truncate text-slate-600">
                    <strong>{user.name}</strong> •{" "}
                    <span className="font-mono text-slate-500 text-[11px]">{user.facility || user.abhaAddress}</span>
                  </span>
                </div>
                <button
                  onClick={handleOpenLogin}
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium shrink-0 cursor-pointer"
                >
                  Switch Persona
                </button>
              </div>
            )}

            {currentRoute === "dashboard" ? (
              <DashboardView
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onSelectRecord={setSelectedRecord}
                onSelectConsent={setSelectedConsent}
                onNavigateRoute={setCurrentRoute}
                records={records}
                consents={consents}
              />
            ) : currentRoute === "consents" ? (
              <ConsentManagementView />
            ) : currentRoute === "records" ? (
              <PatientTimelineView />
            ) : currentRoute === "labs" ? (
              <LaboratoryDashboardView />
            ) : currentRoute === "prescriptions" ? (
              <PharmacyDashboardView />
            ) : currentRoute === "access" ? (
              <PatientAccessHistoryView />
            ) : currentRoute === "notifications" ? (
              <NotificationListView />
            ) : currentRoute === "settings" && user?.role === "admin" ? (
              <AdminManagementView />
            ) : (
              <PlaceholderView
                route={currentRoute}
                onBackToDashboard={() => setCurrentRoute("dashboard")}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals & Dialogs */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLogin}
        onSuccessfulLogin={handleSuccessfulLogin}
      />

      <RecordDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      <UploadRecordModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleAddNewRecord}
      />

      <ConsentDetailsModal
        consent={selectedConsent}
        onClose={() => setSelectedConsent(null)}
        onUpdateStatus={handleUpdateConsentStatus}
      />

      <HealthDiagnosticsModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        healthData={healthData}
        isLoading={healthLoading}
        onRefresh={probeHealth}
        error={healthError}
      />
    </div>
  );
}
