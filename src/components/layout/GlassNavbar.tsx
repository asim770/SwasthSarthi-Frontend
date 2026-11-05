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
  healthData?: HealthCheckData | null;
  onOpenHealthModal: () => void;
  onOpenLogin: () => void;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({
  currentRoute,
  onNavigate,
  healthData: _healthData,
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
            borderRadius={0}
            shape="rect"
            backgroundOpacity={0.68}
            blur={12}
            saturation={1.4}
            distortionScale={-60}
            refraction={true}
            renderer="svg"
            overflow="visible"
            innerClassName="p-0"
            className="w-full box-border border border-[#EAE4D9] rounded-none shadow-[0_4px_20px_rgba(26,25,24,0.05)]"
          >
            <div className="w-full h-full flex items-center justify-between px-3 sm:px-4 md:px-5 gap-1.5 sm:gap-2.5 md:gap-3 box-border min-w-0">
              {/* Left Section: Compact Brand */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Mobile menu trigger */}
                <button
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="lg:hidden p-1.5 text-[#191817] hover:bg-[#EAE4D9]/40 rounded-none transition-colors cursor-pointer shrink-0"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => handleSelectRoute("landing")}
                  className="flex items-center gap-2.5 text-left group cursor-pointer shrink-0"
                  aria-label="Navigate to SwaasthSaarthi Home"
                >
                  <div className="relative w-8 h-8 rounded-none bg-gradient-to-tr from-[#57477D] via-[#6F5E97] to-[#7EA89B] p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                    <div className="w-full h-full bg-[#FAF7F2] rounded-none flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                        <path d="M6 18C6 11.3726 11.3726 6 18 6C18 12.6274 12.6274 18 6 18Z" fill="#57477D" />
                        <path d="M26 14C26 20.6274 20.6274 26 14 26C14 19.3726 19.3726 14 26 14Z" fill="#4E8C78" fillOpacity="0.85" />
                        <circle cx="16" cy="16" r="3" fill="#FAF7F2" />
                        <circle cx="16" cy="16" r="1.5" fill="#57477D" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <span className="font-editorial-serif font-bold text-[#1A1918] tracking-tight text-sm sm:text-base leading-none group-hover:text-[#57477D] transition-colors">
                      SwaasthSaarthi
                    </span>
                    <span className="text-[9px] text-[#69655E] font-medium tracking-wider uppercase mt-0.5">
                      Unified Healthcare Network
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
                      className={`group relative items-center gap-1.5 px-3 py-1.5 rounded-none text-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                        isSecondary ? "hidden 2xl:flex" : "flex"
                      } ${
                        isActive
                          ? "bg-[#1A1918] text-white border border-[#1A1918] font-medium shadow-2xs"
                          : "text-[#5C574F] hover:text-[#191817] hover:bg-[#EAE4D9]/50 border border-transparent font-normal"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-all duration-150 ${
                          isActive
                            ? "text-white stroke-[2.2]"
                            : "text-[#7A746B] group-hover:text-[#191817] stroke-[1.8]"
                        }`}
                      />
                      <span className="tracking-tight">{item.label}</span>
                      {item.id === "notifications" && (
                        <span className="w-1.5 h-1.5 rounded-none bg-[#57477D] shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Responsive Overflow Dropdown (visible between lg and 2xl breakpoints) */}
                {secondaryNavItems.length > 0 && (
                  <div className="relative 2xl:hidden shrink-0" ref={overflowRef}>
                    <button
                      onClick={() => setIsOverflowOpen((prev) => !prev)}
                      className={`p-1.5 px-2.5 rounded-none text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                        secondaryNavItems.some((i) => i.id === currentRoute)
                          ? "bg-[#1A1918] text-white border border-[#1A1918]"
                          : "text-[#5C574F] hover:text-[#191817] hover:bg-[#EAE4D9]/50 border border-[#EAE4D9]"
                      }`}
                      title="More navigation options"
                      aria-label="More navigation options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="hidden xl:inline text-xs">More</span>
                    </button>

                    {isOverflowOpen && (
                      <div className="absolute left-0 mt-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-150 bg-white border border-[#EAE4D9] shadow-[0_8px_24px_rgba(26,25,24,0.08)] p-1">
                        <div className="w-full space-y-0.5">
                          {secondaryNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentRoute === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSelectRoute(item.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer rounded-none ${
                                  isActive
                                    ? "bg-[#1A1918] text-white"
                                    : "text-[#5C574F] hover:text-[#191817] hover:bg-[#FAF7F2]"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{item.tooltip || item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </nav>

              {/* Right Section: Alerts & Profile */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">

                {/* Notifications / Alerts Dropdown */}
                <div className="relative shrink-0" ref={notifRef}>
                  <button
                    onClick={() => setIsNotificationsOpen((prev) => !prev)}
                    className="relative p-1.5 text-[#5C574F] hover:text-[#191817] hover:bg-[#EAE4D9]/40 rounded-none transition-colors cursor-pointer border border-transparent hover:border-[#EAE4D9] shrink-0"
                    aria-label="Alerts"
                    title="View Alerts & Notifications"
                  >
                    <Bell className="w-4 h-4" strokeWidth={1.8} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#57477D] rounded-full" />
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2.5 w-76 sm:w-80 z-50 animate-in fade-in zoom-in-95 duration-150 bg-white border border-[#EAE4D9] shadow-[0_12px_32px_rgba(26,25,24,0.08)] p-2">
                      <div className="w-full text-[#191817]">
                        <div className="px-2.5 py-2 border-b border-[#EAE4D9] flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#191817]">Alerts & Notices</span>
                          <span className="text-[10px] font-medium text-[#57477D] bg-[#57477D]/10 border border-[#57477D]/20 px-2 py-0.5 rounded-none">
                            FHIR Broadcast
                          </span>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-[#EAE4D9]/60 py-1">
                          {sampleNotifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 text-left hover:bg-[#FAF7F2] transition-colors rounded-none ${
                                n.unread ? "bg-[#FAF7F2] font-medium" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-[#191817]">{n.title}</span>
                                <span className="text-[10px] text-[#7A746B]">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-[#6E685F] mt-0.5 line-clamp-1">{n.desc}</p>
                            </div>
                          ))}
                        </div>

                        <div className="px-2.5 pt-2 pb-1 border-t border-[#EAE4D9] text-center">
                          <button
                            className="text-xs text-[#57477D] font-medium hover:underline cursor-pointer"
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              handleSelectRoute("notifications");
                            }}
                          >
                            Open Notification Inbox →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Account / Profile Menu */}
                {!isAuthenticated ? (
                  <button
                    onClick={onOpenLogin}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium bg-[#1A1918] hover:bg-[#2E2C2A] text-white shadow-xs cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="hidden sm:inline">Sign In / Register</span>
                    <span className="sm:hidden">Sign In</span>
                  </button>
                ) : (
                  <div className="relative shrink-0" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen((prev) => !prev)}
                      className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-none hover:bg-[#FAF7F2] transition-colors border border-[#EAE4D9] cursor-pointer shrink-0 max-w-[150px] sm:max-w-[180px]"
                      aria-label={`User account menu for ${user?.name}`}
                      title={user?.name}
                    >
                      <div className="w-7 h-7 rounded-none bg-[#57477D] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {getInitials(user?.name)}
                      </div>
                      <div className="hidden sm:flex flex-col text-left min-w-0">
                        <span
                          className="text-xs font-semibold text-[#191817] leading-tight truncate max-w-[80px] md:max-w-[110px]"
                          title={user?.name}
                        >
                          {user?.name}
                        </span>
                        <span className="text-[10px] text-[#7A746B] font-mono leading-none truncate">
                          {user?.patientId ? user.patientId : getRoleLabel(user?.role)}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-[#7A746B] hidden sm:block shrink-0" />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2.5 w-64 z-50 animate-in fade-in zoom-in-95 duration-150 bg-white border border-[#EAE4D9] shadow-[0_12px_32px_rgba(26,25,24,0.08)] p-2">
                        <div className="w-full text-[#191817]">
                          <div className="px-3 py-2 border-b border-[#EAE4D9]">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-semibold text-[#191817] truncate" title={user?.name}>
                                {user?.name}
                              </span>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </div>
                            {user?.patientId && (
                              <div className="my-1.5 flex items-center justify-between bg-[#FAF7F2] border border-[#EAE4D9] px-2 py-1">
                                <span className="text-[10px] text-[#7A746B] font-semibold">Patient ID:</span>
                                <span className="text-[10px] font-mono font-bold text-[#57477D]">
                                  {user.patientId}
                                </span>
                              </div>
                            )}
                            <p className="text-[11px] text-[#7A746B] font-mono truncate" title={user?.abhaAddress || user?.abhaId || user?.facility}>
                              {user?.abhaAddress || user?.abhaId || user?.facility}
                            </p>
                            <p className="text-[10px] text-[#57477D] font-medium mt-0.5">
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
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#5C574F] hover:text-[#191817] hover:bg-[#FAF7F2] transition-colors text-left cursor-pointer rounded-none"
                            >
                              <Settings className="w-3.5 h-3.5 text-[#7A746B]" />
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
                                <span>Switch Account</span>
                              </button>

                              {/* System Diagnostics */}
                              <button
                                onClick={() => {
                                  setIsProfileOpen(false);
                                  onOpenHealthModal();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#5C574F] hover:text-[#191817] hover:bg-[#FAF7F2] rounded-none transition-colors text-left cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-[#7A746B]" />
                                <span>System Diagnostics</span>
                              </button>
                            </div>

                            <div className="pt-1 border-t border-[#EAE4D9]">
                              <button
                                onClick={async () => {
                                  setIsProfileOpen(false);
                                  await logout();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#991B1B] hover:bg-[#FEE2E2] rounded-none transition-colors text-left font-medium cursor-pointer"
                              >
                                <LogOut className="w-3.5 h-3.5 text-[#991B1B]" />
                                <span>Sign Out</span>
                              </button>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </GlassSurface>
        </div>
      </header>

      {/* Responsive Navigation Drawer (Mobile & Tablet) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Frosted Backdrop */}
          <div
            className="fixed inset-0 bg-[#1A1918]/30 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200 bg-[#FAF7F2] border-r border-[#EAE4D9] shadow-2xl p-4 flex flex-col justify-between">
            <div className="w-full h-full flex flex-col justify-between text-[#191817]">
              <div className="space-y-4">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D9]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-none bg-[#57477D] text-white flex items-center justify-center shadow-xs">
                      <Activity className="w-4 h-4 text-[#FAF7F2]" />
                    </div>
                    <div>
                      <span className="font-editorial-serif font-bold text-[#1A1918] text-sm leading-tight block">
                        SwaasthSaarthi
                      </span>
                      <span className="text-[10px] text-[#57477D] font-mono tracking-wide">ABDM · FHIR R4</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-[#5C574F] hover:text-[#191817] hover:bg-[#EAE4D9]/50 rounded-none cursor-pointer"
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
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-none text-xs transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#1A1918] text-white font-medium shadow-2xs"
                            : "text-[#5C574F] hover:text-[#191817] hover:bg-[#EAE4D9]/40"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-white" : "text-[#7A746B]"
                          }`}
                          strokeWidth={1.8}
                        />
                        <span className="flex-1 text-left">{item.tooltip || item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-none font-mono bg-[#EAE4D9] text-[#191817]">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Settings link in mobile list */}
                  <button
                    onClick={() => handleSelectRoute("settings")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-none text-xs transition-colors cursor-pointer ${
                      currentRoute === "settings"
                        ? "bg-[#1A1918] text-white font-medium shadow-2xs"
                        : "text-[#5C574F] hover:text-[#191817] hover:bg-[#EAE4D9]/40"
                    }`}
                  >
                    <Settings className="w-4 h-4 text-[#7A746B] shrink-0" strokeWidth={1.8} />
                    <span className="flex-1 text-left">Settings</span>
                  </button>
                </nav>
              </div>

              {/* Mobile Drawer Footer: Persona & Logout */}
              <div className="pt-3 border-t border-[#EAE4D9] space-y-2">
                {isAuthenticated && user ? (
                  <div className="p-2.5 rounded-none bg-white border border-[#EAE4D9]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="truncate">
                        <p className="text-xs font-semibold text-[#191817] leading-tight truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-[#69655E]">{getRoleLabel(user.role)}</p>
                      </div>
                      <button
                        onClick={async () => {
                          setIsMobileMenuOpen(false);
                          await logout();
                        }}
                        className="p-1 text-[#991B1B] hover:bg-[#FEE2E2] rounded-none transition-colors cursor-pointer"
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
                      className="w-full py-1 text-[11px] text-[#57477D] hover:underline font-medium text-left cursor-pointer flex items-center gap-1.5"
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
                    className="w-full py-2 bg-[#1A1918] hover:bg-[#2E2C2A] text-white rounded-none text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sign In with ABHA</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlassNavbar;
