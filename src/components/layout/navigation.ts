import React from "react";
import {
  House,
  FileText,
  ShieldCheck,
  Pill,
  FlaskConical,
  Clock,
  Bell,
  Settings,
} from "lucide-react";

export type NavigationRoute =
  | "dashboard"
  | "records"
  | "consents"
  | "prescriptions"
  | "labs"
  | "access"
  | "notifications"
  | "settings";

export interface NavItem {
  id: NavigationRoute;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string | number;
  tooltip?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Home", icon: House, tooltip: "Dashboard Home" },
  { id: "records", label: "Records", icon: FileText, badge: "12", tooltip: "Health Records" },
  { id: "consents", label: "Consent", icon: ShieldCheck, badge: "2", tooltip: "Consent Management" },
  { id: "prescriptions", label: "Rx", icon: Pill, tooltip: "Prescriptions (Rx)" },
  { id: "labs", label: "Labs", icon: FlaskConical, tooltip: "Laboratory Reports" },
  { id: "access", label: "History", icon: Clock, tooltip: "Access History" },
  { id: "notifications", label: "Alerts", icon: Bell, badge: "3", tooltip: "Notifications & Alerts" },
  { id: "settings", label: "Settings", icon: Settings, tooltip: "Settings & Administration" },
];
