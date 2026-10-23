import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  CheckCircle,
  AlertTriangle,
  User,
  Shield,
  LogOut,
} from "lucide-react";
import type { HealthCheckData } from "../../types/api";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  currentRouteTitle: string;
  onOpenMobileNav: () => void;
  healthData: HealthCheckData | null;
  onOpenHealthModal: () => void;
  onOpenLogin: () => void;
  onNavigateNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRouteTitle,
  onOpenMobileNav,
  healthData,
  onOpenHealthModal,
  onOpenLogin,
  onNavigateNotifications,
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
        return "Doctor · HPR";
      case "laboratory":
        return "Diagnostic Lab · HFR";
      case "pharmacy":
        return "Pharmacy · HFR";
      case "admin":
        return "Administrator";
      default:
        return "Patient · ABHA";
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

  const sampleNotifications = [
    {
      id: 1,
      title: "Consent Request Granted",
      desc: "Apollo Hospital accessed diagnostic records",
      time: "10m ago",
      unread: true,
    },
    {
      id: 2,
      title: "New Diagnostic Report",
      desc: "Comprehensive Metabolic Panel verified",
      time: "2h ago",
      unread: true,
    },
    {
      id: 3,
      title: "ABDM Care Context Linked",
      desc: "Max Healthcare linked 3 FHIR resources",
      time: "1d ago",
      unread: false,
    },
  ];

  return (
    <header className="h-14 glass-header px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Section: Mobile Menu Button & Breadcrumb / Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-lg transition-colors cursor-pointer"
          aria-label="Open mobile navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-normal">
            <span>SwasthSaarthi</span>
            <span className="text-slate-300">/</span>
          </nav>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
            {currentRouteTitle}
          </h1>
        </div>
      </div>

      {/* Right Section: System Indicator, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System Health Status Indicator */}
        <button
          onClick={onOpenHealthModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 bg-white/70 hover:bg-white border-slate-200/60 text-slate-600 hover:text-slate-900 cursor-pointer shadow-2xs"
          title="Click to view API and Gateway diagnostics"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              healthData?.status === "healthy"
                ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                : healthData
                ? "bg-amber-500 ring-2 ring-amber-500/20"
                : "bg-slate-300"
            }`}
          />
          <span className="text-[11px] font-medium hidden sm:inline">
            {healthData
              ? healthData.status === "healthy"
                ? "API Live"
                : "Degraded"
              : "Connecting..."}
          </span>
        </button>

        {/* Notifications Icon with Subtle Unread Dot */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200/60"
            aria-label="Notifications"
            title="View Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-teal-600 rounded-full" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 glass-panel rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-200/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] font-medium text-teal-800 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
                  In-App Dispatch
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100/60">
                {sampleNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-left hover:bg-white/50 transition-colors ${
                      n.unread ? "bg-teal-50/20 font-medium" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{n.desc}</p>
                  </div>
                ))}
              </div>

              <div className="px-3 pt-2 pb-1 border-t border-slate-200/50 text-center">
                <button
                  className="text-xs text-teal-700 font-medium hover:text-teal-900 cursor-pointer"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    if (onNavigateNotifications) onNavigateNotifications();
                  }}
                >
                  Open Notification Inbox →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Profile */}
        {!isAuthenticated ? (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-teal-200" />
            <span className="hidden sm:inline">Sign In with ABHA</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        ) : (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-white/80 transition-colors border border-transparent hover:border-slate-200/60 cursor-pointer"
              aria-label="User account menu"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-700 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-400 leading-none">
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 glass-panel rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2.5 border-b border-slate-200/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {user?.name}
                    </span>
                    <CheckCircle className="w-3 h-3 text-teal-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {user?.abhaAddress || user?.abhaId}
                  </p>
                  <p className="text-[10px] text-teal-700 font-medium mt-1">
                    {getRoleLabel(user?.role)}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-white/60 transition-colors text-left cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Switch Demo Persona</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenHealthModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-white/60 transition-colors text-left cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Diagnostics</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-200/50">
                  <button
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors text-left font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
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
