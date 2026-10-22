import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { NAV_ITEMS, type NavigationRoute } from "./components/layout/navigation";
import { Header } from "./components/layout/Header";
import { DashboardView } from "./components/dashboard/DashboardView";
import { PlaceholderView } from "./components/views/PlaceholderView";
import { RecordDetailsModal } from "./components/dashboard/RecordDetailsModal";
import { UploadRecordModal } from "./components/dashboard/UploadRecordModal";
import { ConsentDetailsModal } from "./components/dashboard/ConsentDetailsModal";
import { HealthDiagnosticsModal } from "./components/dashboard/HealthDiagnosticsModal";
import { checkSystemHealth } from "./api/client";
import type { HealthCheckData } from "./types/api";
import {
  SYNTHETIC_RECORDS,
  SYNTHETIC_CONSENTS,
  type SyntheticHealthRecord,
  type SyntheticConsent,
} from "./data/syntheticData";

export default function App() {
  // Navigation & Shell State
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentRouteTitle={currentRouteTitle}
          onOpenMobileNav={() => setIsMobileOpen(true)}
          healthData={healthData}
          onOpenHealthModal={() => setIsHealthModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {currentRoute === "dashboard" ? (
              <DashboardView
                searchQuery={searchQuery}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onSelectRecord={setSelectedRecord}
                onSelectConsent={setSelectedConsent}
                onNavigateRoute={setCurrentRoute}
                records={records}
                consents={consents}
              />
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
