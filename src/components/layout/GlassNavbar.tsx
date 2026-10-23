import React, { useState, useRef, useEffect } from "react";
import {
  Activity,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  UserRound,
  MoreHorizontal,
} from "lucide-react";
import { type NavigationRoute, NAV_ITEMS, type NavItem } from "./navigation";
import { useAuth } from "../../context/AuthContext";
import type { HealthCheckData } from "../../types/api";
import { GlassSurface } from "../ui/GlassSurface";

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
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
        setIsOverflowOpen(false);
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
        return "Lab · HFR";
      case "pharmacy":
        return "Pharmacy · HFR";
      case "admin":
        return "Admin";
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
    return baseItems;
  };

  const navItems = getNavItemsForRole(user?.role);
  // Split: First 4 items (Home, Records, Consent, Rx) are primary desktop items.
  // Remaining items (Labs, History, Alerts) are secondary on tighter viewports.
  const secondaryNavItems = navItems.slice(4);

  const handleSelectRoute = (route: NavigationRoute) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
    setIsOverflowOpen(false);
  };

  const sampleNotifications = [
    {
      id: 1,
      title: "Consent Granted",
      desc: "Apollo Hospital accessed diagnostic records",
      time: "10m ago",
      unread: true,
    },
    {
      id: 2,
      title: "New Lab Report",
      desc: "Metabolic & Lipid Panel verified",
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
      {/* Floating Compact Rounded-Rectangle Glass Navbar */}
      <header className="sticky top-3 sm:top-4 z-40 px-4 sm:px-6 lg:px-8 w-full flex justify-center pointer-events-none box-border">
        <div className="pointer-events-auto w-full max-w-6xl box-border">
          <GlassSurface
            width="100%"
            height={68}
            borderRadius={20}
            shape="rect"
            backgroundOpacity={0.68}
            blur={12}
            saturation={1.4}
            distortionScale={-60}
            refraction={true}
            renderer="svg"
            overflow="visible"
            innerClassName="p-0"
            className="w-full box-border border border-white/80 shadow-[0_6px_24px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)] ring-1 ring-slate-900/[0.04]"
          >
            <div className="w-full h-full flex items-center justify-between px-3 sm:px-4 md:px-5 gap-1.5 sm:gap-2.5 md:gap-3 box-border min-w-0">
              {/* Left Section: Compact Brand */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Mobile menu trigger */}
                <button
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => handleSelectRoute("dashboard")}
                  className="flex items-center gap-2 text-left group cursor-pointer shrink-0"
                  aria-label="Navigate to home"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-150">
                    <Activity className="w-4 h-4 text-white" strokeWidth={2.2} />
                  </div>
                  <div className="flex flex-col shrink-0">
                    <span className="font-semibold text-slate-900 tracking-tight text-sm leading-tight group-hover:text-teal-700 transition-colors">
                      SwasthSaarthi
                    </span>
                    <span className="text-[10px] text-teal-700 font-medium tracking-wide">
                      ABDM · FHIR R4
                    </span>
                  </div>
                </button>
              </div>

              {/* Center Section: Responsive Priority Navigation (Desktop) */}
              <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 min-w-0 flex-nowrap shrink">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  const isSecondary = index >= 4;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectRoute(item.id)}
                      title={item.tooltip || item.label}
                      aria-label={item.tooltip || item.label}
                      className={`group relative items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                        isSecondary ? "hidden 2xl:flex" : "flex"
                      } ${
                        isActive
                          ? "bg-teal-500/10 text-teal-700 font-semibold border border-teal-500/25 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-medium"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-all duration-150 ${
                          isActive
                            ? "text-teal-700 stroke-[2.2]"
                            : "text-slate-500 group-hover:text-slate-800 stroke-[1.8]"
                        }`}
                      />
                      <span className="tracking-tight">{item.label}</span>
                      {item.id === "notifications" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-xs shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Responsive Overflow Dropdown (visible between lg and 2xl breakpoints) */}
                {secondaryNavItems.length > 0 && (
                  <div className="relative 2xl:hidden shrink-0" ref={overflowRef}>
                    <button
                      onClick={() => setIsOverflowOpen((prev) => !prev)}
                      className={`p-1.5 px-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                        secondaryNavItems.some((i) => i.id === currentRoute)
                          ? "bg-teal-500/10 text-teal-700 border border-teal-500/25 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                      }`}
                      title="More navigation options"
                      aria-label="More navigation options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="hidden xl:inline text-xs">More</span>
                    </button>

                    {isOverflowOpen && (
                      <div className="absolute left-0 mt-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <GlassSurface
                          width="100%"
                          height="auto"
                          borderRadius={16}
                          backgroundOpacity={0.92}
                          blur={16}
                          renderer="css"
                          className="border border-white/80 shadow-[0_12px_32px_rgba(15,23,42,0.08)] p-1.5"
                        >
                          <div className="w-full space-y-0.5">
                            {secondaryNavItems.map((item) => {
                              const Icon = item.icon;
                              const isActive = currentRoute === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleSelectRoute(item.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                                    isActive
                                      ? "bg-teal-500/10 text-teal-700 font-semibold"
                                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  <span>{item.tooltip || item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </GlassSurface>
                      </div>
                    )}
                  </div>
                )}
              </nav>

              {/* Right Section: System Indicator, Alerts & Profile */}
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                {/* System Health Status Pill */}
                <button
                  onClick={onOpenHealthModal}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-medium border transition-all duration-150 bg-white/70 hover:bg-white border-slate-200/60 text-slate-600 hover:text-slate-900 cursor-pointer shadow-2xs shrink-0"
                  title="System Diagnostics: API Live"
                  aria-label="View system status"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      healthData?.status === "healthy"
                        ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                        : healthData
                        ? "bg-amber-500 ring-2 ring-amber-500/20"
                        : "bg-slate-400"
                    }`}
                  />
                  <span className="text-[11px] font-medium hidden xl:inline text-slate-700">
                    {healthData
                      ? healthData.status === "healthy"
                        ? "API Live"
                        : "Degraded"
                      : "Connecting..."}
                  </span>
                </button>

                {/* Notifications / Alerts Dropdown */}
                <div className="relative shrink-0" ref={notifRef}>
                  <button
                    onClick={() => setIsNotificationsOpen((prev) => !prev)}
                    className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200/50 shrink-0"
                    aria-label="Alerts"
                    title="View Alerts & Notifications"
                  >
                    <Bell className="w-4 h-4" strokeWidth={1.8} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2.5 w-76 sm:w-80 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <GlassSurface
                        width="100%"
                        height="auto"
                        borderRadius={18}
                        backgroundOpacity={0.92}
                        blur={16}
                        renderer="css"
                        className="border border-white/80 shadow-[0_12px_32px_rgba(15,23,42,0.08)] p-2.5"
                      >
                        <div className="w-full text-slate-900">
                          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900">Alerts</span>
                            <span className="text-[10px] font-medium text-teal-700 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                              In-App Dispatch
                            </span>
                          </div>

                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100/60 py-1">
                            {sampleNotifications.map((n) => (
                              <div
                                key={n.id}
                                className={`p-2.5 text-left hover:bg-slate-50/80 rounded-lg transition-colors ${
                                  n.unread ? "bg-teal-50/40 font-medium" : ""
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

                          <div className="px-2.5 pt-2 pb-1 border-t border-slate-100 text-center">
                            <button
                              className="text-xs text-teal-700 font-medium hover:text-teal-800 cursor-pointer"
                              onClick={() => {
                                setIsNotificationsOpen(false);
                                handleSelectRoute("notifications");
                              }}
                            >
                              Open Notification Inbox →
                            </button>
                          </div>
                        </div>
                      </GlassSurface>
                    </div>
                  )}
                </div>

                {/* User Account / Profile Menu */}
                {!isAuthenticated ? (
                  <button
                    onClick={onOpenLogin}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-xs cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-100 shrink-0" />
                    <span className="hidden sm:inline">Sign In with ABHA</span>
                    <span className="sm:hidden">Sign In</span>
                  </button>
                ) : (
                  <div className="relative shrink-0" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200/50 cursor-pointer shrink-0 max-w-[140px] sm:max-w-[160px] md:max-w-[180px]"
                      aria-label={`User account menu for ${user?.name}`}
                      title={user?.name}
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-700 to-teal-500 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {getInitials(user?.name)}
                      </div>
                      <div className="hidden sm:flex flex-col text-left min-w-0">
                        <span
                          className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[70px] md:max-w-[95px] xl:max-w-[120px]"
                          title={user?.name}
                        >
                          {user?.name}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-none truncate">
                          {getRoleLabel(user?.role)}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2.5 w-64 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <GlassSurface
                          width="100%"
                          height="auto"
                          borderRadius={18}
                          backgroundOpacity={0.92}
                          blur={16}
                          renderer="css"
                          className="border border-white/80 shadow-[0_12px_32px_rgba(15,23,42,0.08)] p-2.5"
                        >
                          <div className="w-full text-slate-900">
                            <div className="px-3 py-2 border-b border-slate-100">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs font-semibold text-slate-900 truncate" title={user?.name}>
                                  {user?.name}
                                </span>
                                <CheckCircle className="w-3 h-3 text-teal-600 shrink-0" />
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono truncate" title={user?.abhaAddress || user?.abhaId || user?.facility}>
                                {user?.abhaAddress || user?.abhaId || user?.facility}
                              </p>
                              <p className="text-[10px] text-teal-700 font-medium mt-0.5">
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
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 rounded-lg transition-colors text-left cursor-pointer"
                              >
                                <Settings className="w-3.5 h-3.5 text-slate-500" />
                                <span>
                                  {user?.role === "admin"
                                    ? "Institution Management"
                                    : "Settings & Preferences"}
                                </span>
                              </button>

                              {/* Switch Demo Persona */}
                              <button
                                onClick={() => {
                                  setIsProfileOpen(false);
                                  onOpenLogin();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 rounded-lg transition-colors text-left cursor-pointer"
                              >
                                <UserRound className="w-3.5 h-3.5 text-slate-500" />
                                <span>Switch Demo Persona</span>
                              </button>

                              {/* System Diagnostics */}
                              <button
                                onClick={() => {
                                  setIsProfileOpen(false);
                                  onOpenHealthModal();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 rounded-lg transition-colors text-left cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                                <span>System Diagnostics</span>
                              </button>
                            </div>

                            <div className="pt-1 border-t border-slate-100">
                              <button
                                onClick={async () => {
                                  setIsProfileOpen(false);
                                  await logout();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-left font-medium cursor-pointer"
                              >
                                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                                <span>Sign Out</span>
                              </button>
                            </div>
                          </div>
                        </GlassSurface>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </GlassSurface>
        </div>
      </header>

      {/* Responsive Liquid Glass Navigation Drawer (Mobile & Tablet) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Frosted Light Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel using GlassSurface */}
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            <GlassSurface
              width="100%"
              height="100%"
              borderRadius={0}
              backgroundOpacity={0.92}
              blur={20}
              renderer="css"
              className="border-r border-slate-200/80 shadow-2xl p-4 flex flex-col justify-between"
            >
              <div className="w-full h-full flex flex-col justify-between text-slate-900">
                <div className="space-y-4">
                  {/* Header inside drawer */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-600 to-teal-400 text-white flex items-center justify-center shadow-xs">
                        <Activity className="w-4 h-4" />
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
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                      aria-label="Close navigation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation Items with concise labels */}
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentRoute === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectRoute(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? "bg-teal-500/10 text-teal-700 border border-teal-500/20 font-semibold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-teal-700" : "text-slate-500"
                            }`}
                            strokeWidth={1.8}
                          />
                          <span className="flex-1 text-left">{item.tooltip || item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Settings link in mobile list */}
                    <button
                      onClick={() => handleSelectRoute("settings")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        currentRoute === "settings"
                          ? "bg-teal-500/10 text-teal-700 border border-teal-500/20 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Settings className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.8} />
                      <span className="flex-1 text-left">Settings</span>
                    </button>
                  </nav>
                </div>

                {/* Mobile Drawer Footer: Persona & Logout */}
                <div className="pt-3 border-t border-slate-200/60 space-y-2">
                  {isAuthenticated && user ? (
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-500">{getRoleLabel(user.role)}</p>
                        </div>
                        <button
                          onClick={async () => {
                            setIsMobileMenuOpen(false);
                            await logout();
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                        className="w-full py-1 text-[11px] text-teal-700 hover:text-teal-800 font-medium text-left cursor-pointer flex items-center gap-1.5"
                      >
                        <UserRound className="w-3.5 h-3.5" />
                        <span>Switch Persona</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-100" />
                      <span>Sign In with ABHA</span>
                    </button>
                  )}
                </div>
              </div>
            </GlassSurface>
          </div>
        </div>
      )}
    </>
  );
};

export default GlassNavbar;
