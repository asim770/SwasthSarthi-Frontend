import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  Search,
  CheckCircle,
  AlertTriangle,
  User,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";
import type { HealthCheckData } from "../../types/api";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  currentRouteTitle: string;
  onOpenMobileNav: () => void;
  healthData: HealthCheckData | null;
  onOpenHealthModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRouteTitle,
  onOpenMobileNav,
  healthData,
  onOpenHealthModal,
  searchQuery,
  onSearchChange,
  onOpenLogin,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter((part) => !part.startsWith("Dr.") && !part.startsWith("Dr"))
      .concat(name.split(" ")[0])
      .filter(Boolean)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "doctor":
        return "Doctor (HPR)";
      case "laboratory":
        return "Diagnostic Lab (HFR)";
      case "pharmacy":
        return "Pharmacist (HFR)";
      case "admin":
        return "Administrator";
      default:
        return "ABHA Patient";
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: "Consent Request Granted",
      desc: "Apollo Hospital accessed Encounter #ENC-2026-091",
      time: "10 mins ago",
      unread: true,
    },
    {
      id: 2,
      title: "Lab Report Uploaded",
      desc: "Lipid Profile DiagnosticReport verified by Dr. Raman",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 3,
      title: "ABDM Care Context Linked",
      desc: "Max Healthcare linked 3 FHIR resources to your ABHA",
      time: "Yesterday",
      unread: false,
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left Section: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>SwasthSaarthi</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">{currentRouteTitle}</span>
          </nav>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {currentRouteTitle}
          </h1>
        </div>
      </div>

      {/* Center / Search Section (Defined Purpose: Quick filter records by title or ID) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search records, diagnoses, or care contexts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Section: System Health Badge, Notifications, User Menu */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* API Gateway Status Indicator */}
        <button
          onClick={onOpenHealthModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          title="Click to view detailed system health diagnostics"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              healthData?.status === "healthy"
                ? "bg-emerald-500 ring-2 ring-emerald-100"
                : healthData
                ? "bg-amber-500 ring-2 ring-amber-100"
                : "bg-slate-300"
            }`}
          />
          <span className="hidden sm:inline">
            {healthData ? (healthData.status === "healthy" ? "API Live" : "API Degraded") : "Checking API..."}
          </span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-600 rounded-full ring-2 ring-white" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                  2 Unread
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-left hover:bg-slate-50 transition-colors ${
                      n.unread ? "bg-teal-50/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pt-2 pb-1 border-t border-slate-100 text-center">
                <button
                  className="text-xs text-teal-700 font-semibold hover:text-teal-900"
                  onClick={() => setIsNotificationsOpen(false)}
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu or Sign In Button */}
        {!isAuthenticated ? (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-teal-200" />
            <span>Sign In with ABHA — Demo</span>
          </button>
        ) : (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
              aria-label="User account menu"
            >
              <div className="w-7 h-7 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-400 leading-none">
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {user?.abhaAddress || user?.abhaId}
                  </p>
                  {user?.facility && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {user.facility}
                    </p>
                  )}
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[10px] text-teal-800 font-medium">
                    <Shield className="w-2.5 h-2.5" />
                    <span>Server-Managed Session ({getRoleLabel(user?.role)})</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenHealthModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Gateway Diagnostics</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Switch Demo Persona</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Preferences</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
