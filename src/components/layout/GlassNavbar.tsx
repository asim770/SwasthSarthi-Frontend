import React, { useState, useRef, useEffect } from "react";
import {
  Activity,
  Bell,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { type NavigationRoute, NAV_ITEMS, type NavItem } from "./navigation";
import { useAuth } from "../../context/AuthContext";
import type { HealthCheckData } from "../../types/api";

interface GlassNavbarProps {
  currentRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute) => void;
  healthData: HealthCheckData | null;
  onOpenHealthModal: () => void;
  onOpenLogin: () => void;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({
  currentRoute,
  onNavigate,
  healthData,
  onOpenHealthModal,
  onOpenLogin,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  // Center navigation items: Exclude "settings" as it belongs in the profile menu
  const getNavItemsForRole = (role?: string): NavItem[] => {
    const baseItems = NAV_ITEMS.filter((item) => item.id !== "settings");
    if (role === "laboratory") {
      return baseItems.filter((item) =>
        ["dashboard", "labs", "records", "access", "notifications"].includes(item.id)
      );
    }
    if (role === "pharmacy") {
      return baseItems.filter((item) =>
        ["dashboard", "prescriptions", "records", "access", "notifications"].includes(item.id)
      );
    }
    if (role === "admin") {
      return baseItems.filter((item) =>
        ["dashboard", "access", "records", "consents", "notifications"].includes(item.id)
      );
    }
    // Patient, Doctor, and Guest mode: full clinical suites
    return baseItems;
  };

  const centerNavItems = getNavItemsForRole(user?.role);

  const handleSelectRoute = (route: NavigationRoute) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
  };

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
    <>
      <header className="h-[72px] glass-header px-4 sm:px-6 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Left Section: SwasthSaarthi Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={() => handleSelectRoute("dashboard")}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
              aria-label="Navigate to dashboard"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs ring-1 ring-teal-500/20 group-hover:scale-105 transition-transform duration-150">
                <Activity className="w-4 h-4 text-teal-100" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 tracking-tight text-sm leading-tight group-hover:text-teal-900 transition-colors">
                  SwasthSaarthi
                </span>
                <span className="text-[10px] text-teal-700/80 font-medium tracking-wide">
                  ABDM · FHIR R4
                </span>
              </div>
            </button>
          </div>

          {/* Center Section: Horizontal Glass Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {centerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectRoute(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-teal-500/10 text-teal-950 font-semibold border border-teal-500/20 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? "text-teal-700" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.id === "notifications" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Section: System Indicator, Notifications & User Account */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* System Health Status Indicator */}
            <button
              onClick={onOpenHealthModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 bg-white/70 hover:bg-white border-slate-200/60 text-slate-600 hover:text-slate-900 cursor-pointer shadow-2xs"
              title="Click to view API and Gateway diagnostics"
              aria-label="View system status"
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

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200/60"
                aria-label="Notifications"
                title="View Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-teal-600 rounded-full" />
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
                        handleSelectRoute("notifications");
                      }}
                    >
                      Open Notification Inbox →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Account / Profile Menu */}
            {!isAuthenticated ? (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-200" />
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
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
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
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-200/50">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {user?.name}
                        </span>
                        <CheckCircle className="w-3 h-3 text-teal-600 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {user?.abhaAddress || user?.abhaId || user?.facility}
                      </p>
                      <p className="text-[10px] text-teal-700 font-medium mt-1">
                        {getRoleLabel(user?.role)}
                      </p>
                    </div>

                    <div className="py-1">
                      {/* Settings in Profile Menu */}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleSelectRoute("settings");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-white/60 transition-colors text-left cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {user?.role === "admin"
                            ? "Institution Management"
                            : "Portal Settings & Preferences"}
                        </span>
                      </button>

                      {/* Switch Demo Persona */}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenLogin();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-white/60 transition-colors text-left cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Switch Demo Persona</span>
                      </button>

                      {/* System Diagnostics */}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenHealthModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-white/60 transition-colors text-left cursor-pointer"
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
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors text-left font-medium cursor-pointer"
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
        </div>
      </header>

      {/* Responsive Navigation Drawer (Mobile & Tablet) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Frosted Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full glass-panel shadow-2xl z-10 flex flex-col justify-between p-4 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm leading-tight block">
                      SwasthSaarthi
                    </span>
                    <span className="text-[10px] text-teal-700 font-medium">ABDM · FHIR R4</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100/70 cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {centerNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectRoute(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-teal-500/10 text-teal-900 font-semibold border border-teal-500/20 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-teal-700" : "text-slate-400"
                        }`}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  );
                })}

                {/* Settings link in mobile list */}
                <button
                  onClick={() => handleSelectRoute("settings")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    currentRoute === "settings"
                      ? "bg-teal-500/10 text-teal-900 font-semibold border border-teal-500/20 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="flex-1 text-left">Settings</span>
                </button>
              </nav>
            </div>

            {/* Mobile Drawer Footer: Persona & Logout */}
            <div className="pt-3 border-t border-slate-200/50 space-y-2">
              {isAuthenticated && user ? (
                <div className="p-2.5 rounded-xl bg-white/70 border border-white/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{getRoleLabel(user.role)}</p>
                    </div>
                    <button
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await logout();
                      }}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full py-1 text-[11px] text-teal-700 hover:text-teal-900 font-medium text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <User className="w-3 h-3" />
                    <span>Switch Demo Persona</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                  <span>Sign In with ABHA</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
