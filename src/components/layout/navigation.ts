import React from "react";
import {
  LayoutDashboard,
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
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "records", label: "Health Records", icon: FileText, badge: "12" },
  { id: "consents", label: "Consent Management", icon: ShieldCheck, badge: "2" },
  { id: "prescriptions", label: "Prescriptions", icon: Pill },
  { id: "labs", label: "Laboratory Reports", icon: FlaskConical },
  { id: "access", label: "Access History", icon: Clock },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "3" },
  { id: "settings", label: "Settings", icon: Settings },
];
