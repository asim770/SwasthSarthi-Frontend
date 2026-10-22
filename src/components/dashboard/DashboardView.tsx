import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  Building2,
  Activity,
  Plus,
  Eye,
  Download,
  Clock,
  Sparkles,
} from "lucide-react";
import { StatCard } from "../ui/StatCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import { EmptyState } from "../ui/EmptyState";
import {
  SYNTHETIC_PATIENT,
  type SyntheticHealthRecord,
  type SyntheticConsent,
} from "../../data/syntheticData";

import type { NavigationRoute } from "../layout/navigation";

interface DashboardViewProps {
  searchQuery: string;
  onOpenUpload: () => void;
  onSelectRecord: (record: SyntheticHealthRecord) => void;
  onSelectConsent: (consent: SyntheticConsent) => void;
  onNavigateRoute: (route: NavigationRoute) => void;
  records: SyntheticHealthRecord[];
  consents: SyntheticConsent[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  searchQuery,
  onOpenUpload,
  onSelectRecord,
  onSelectConsent,
  onNavigateRoute,
  records,
  consents,
}) => {
  const [selectedResourceType, setSelectedResourceType] = useState<string>("ALL");

  // Filter records based on search query and resource type filter
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      searchQuery === "" ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedResourceType === "ALL" || r.resourceType === selectedResourceType;

    return matchesSearch && matchesType;
  });

  const getRecordBadgeVariant = (type: string) => {
    switch (type) {
      case "DiagnosticReport":
        return "info";
      case "Encounter":
        return "teal";
      case "Immunization":
        return "success";
      case "MedicationRequest":
        return "warning";
      default:
        return "neutral";
    }
  };

  const handleExportFhirBundle = () => {
    const fhirBundle = {
      resourceType: "Bundle",
      id: "bundle-patient-longitudinal-record",
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: records.map((r) => ({
        fullUrl: `urn:uuid:${r.id}`,
        resource: {
          resourceType: r.resourceType,
          id: r.id,
          status: r.status,
          code: { text: r.title },
          subject: { reference: `Patient/${SYNTHETIC_PATIENT.id}` },
        },
      })),
    };

    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SwasthSaarthi-FHIR-R4-${SYNTHETIC_PATIENT.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="teal" size="sm" dot>
                ABDM Verified Patient
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                ABHA: {SYNTHETIC_PATIENT.abhaId}
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                Demo Mode • Synthetic Data
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome, {SYNTHETIC_PATIENT.name}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Your unified, longitudinal healthcare records are synchronized with Ayushman Bharat
              Digital Mission (ABDM). All records adhere to the HL7 FHIR R4 standard.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onOpenUpload}
            >
              Upload Health Record
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ShieldCheck className="w-4 h-4" />}
              onClick={() => onNavigateRoute("consents")}
            >
              Review Consents
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportFhirBundle}
              title="Download FHIR R4 JSON collection"
            >
              Export FHIR R4
            </Button>
          </div>
        </div>
      </div>

      {/* 4-Stat Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total FHIR Records"
          value={records.length}
          subtitle="Longitudinal clinical entries"
          icon={<FileText className="w-4 h-4" />}
          badge={<Badge variant="teal" size="sm">Indexed</Badge>}
          trend={{ value: "+2 this month", isPositive: true }}
        />

        <StatCard
          title="Active Consents"
          value={consents.filter((c) => c.status === "GRANTED").length}
          subtitle="1 pending hospital request"
          icon={<ShieldCheck className="w-4 h-4" />}
          badge={<Badge variant="success" size="sm">Secure</Badge>}
          trend={{ value: "100% Patient Controlled", isPositive: true }}
        />

        <StatCard
          title="Linked Facilities"
          value={3}
          subtitle="Max, Apollo &amp; Fortis"
          icon={<Building2 className="w-4 h-4" />}
          badge={<Badge variant="info" size="sm">HIP/HIU</Badge>}
          trend={{ value: "ABDM Verified", isPositive: true }}
        />

        <StatCard
          title="System Gateways"
          value="Healthy"
          subtitle="REST API &amp; MongoDB Active"
          icon={<Activity className="w-4 h-4" />}
          badge={<Badge variant="success" size="sm">Online</Badge>}
          trend={{ value: "FHIR R4 Ready", isPositive: true }}
        />
      </div>

      {/* Main Content Grid: Records Table (2/3) & Consents Preview (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Health Records Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Recent Health Records</CardTitle>
                <CardDescription>
                  Diagnostic reports, clinical encounters, and immunization bundles
                </CardDescription>
              </div>

              {/* Resource Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {["ALL", "DiagnosticReport", "Encounter", "Immunization"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedResourceType(type)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                      selectedResourceType === type
                        ? "bg-teal-700 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type === "ALL" ? "All" : type}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredRecords.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No Records Found"
                    description={
                      searchQuery
                        ? `No clinical records matching "${searchQuery}". Try clearing the search query.`
                        : "No records found under this filter."
                    }
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedResourceType("ALL")}
                      >
                        Reset Filter
                      </Button>
                    }
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Record Title &amp; FHIR Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Healthcare Provider</TableHead>
                      <TableHead className="hidden md:table-cell">Clinician</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 line-clamp-1">
                              {record.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getRecordBadgeVariant(record.resourceType)} size="sm">
                                {record.resourceType}
                              </Badge>
                              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                                {record.id}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-xs text-slate-700 font-medium block">
                            {record.provider}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-slate-500">
                            {record.doctor}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {record.date}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => onSelectRecord(record)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Active Consents & Care Contexts */}
        <div className="space-y-6">
          {/* Active Consent Management Card */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>ABDM Consent Artefacts</CardTitle>
                <CardDescription>
                  Healthcare Information Users (HIU) with access permissions
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateRoute("consents")}
              >
                View All
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 p-4">
              {consents.map((consent) => (
                <div
                  key={consent.id}
                  onClick={() => onSelectConsent(consent)}
                  className="p-3 rounded-lg border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        {consent.requester}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {consent.purpose}
                      </span>
                    </div>
                    <Badge
                      variant={
                        consent.status === "GRANTED"
                          ? "success"
                          : consent.status === "PENDING"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                      dot
                    >
                      {consent.status}
                    </Badge>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{consent.expiresAt}</span>
                    </span>
                    <span className="text-teal-700 font-medium hover:underline">
                      Manage Consent →
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ABDM Care Contexts & Identity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Health ID (ABHA)</CardTitle>
              <CardDescription>
                Government of India National Health Stack identity profile
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ABHA Address:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {SYNTHETIC_PATIENT.abhaAddress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ABHA Number:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {SYNTHETIC_PATIENT.abhaId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age / Gender:</span>
                  <span className="font-medium text-slate-800">
                    {SYNTHETIC_PATIENT.age} Yrs • {SYNTHETIC_PATIENT.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blood Group:</span>
                  <span className="font-medium text-teal-800">
                    {SYNTHETIC_PATIENT.bloodGroup}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-100 flex items-start gap-2 text-xs text-teal-900">
                <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  Longitudinal records are protected under ABDM end-to-end encryption protocols.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
