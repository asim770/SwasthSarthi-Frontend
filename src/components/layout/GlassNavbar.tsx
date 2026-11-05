import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
  CheckCircle,
  UserRound,
  MoreHorizontal,
  House,
  LogIn,
} from "lucide-react";
import { type NavigationRoute, NAV_ITEMS, type NavItem } from "./navigation";
import { useAuth } from "../../context/AuthContext";
import type { HealthCheckData, NotificationItem } from "../../types/api";
import { fetchNotifications, markNotificationRead } from "../../api/client";

const DEFAULT_NAVBAR_NOTIFICATIONS: NotificationItem[] = [
  {
    _id: "notif-seed-1",
    notificationId: "NOTIF-SEED-1",
    recipientId: "patient-1",
    recipientAbha: "patient@abdm",
    category: "CONSENT",
    title: "Consent Granted",
    message: "Apollo Hospital accessed diagnostic records",
    isRead: false,
    deliveryStatus: "DELIVERED",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    _id: "notif-seed-2",
    notificationId: "NOTIF-SEED-2",
    recipientId: "patient-1",
    recipientAbha: "patient@abdm",
    category: "LAB_REPORT",
    title: "New Lab Report",
    message: "Metabolic & Lipid Panel verified",
    isRead: false,
    deliveryStatus: "DELIVERED",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "notif-seed-3",
    notificationId: "NOTIF-SEED-3",
    recipientId: "patient-1",
    recipientAbha: "patient@abdm",
    category: "ONBOARDING",
    title: "ABDM Care Context Linked",
    message: "Max Healthcare linked 3 FHIR resources",
    isRead: false,
    deliveryStatus: "DELIVERED",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const formatTimeAgo = (isoDate?: string): string => {
  if (!isoDate) return "";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

interface GlassNavbarProps {
  currentRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute) => void;
  healthData?: HealthCheckData | null;
  onOpenHealthModal?: () => void;
  onOpenLogin: () => void;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({
  currentRoute,
  onNavigate,
  healthData: _healthData,
  onOpenHealthModal: _onOpenHealthModal,
  onOpenLogin,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Sync notifications with backend and cross-component updates
  useEffect(() => {
    let isMounted = true;

    const loadNavbarNotifications = async () => {
      setIsLoadingNotifs(true);
      try {
        const data = await fetchNotifications({ limit: 10 });
        if (isMounted) {
          if (data?.notifications && data.notifications.length > 0) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount ?? data.notifications.filter((n) => !n.isRead).length);
          } else {
            setNotifications(DEFAULT_NAVBAR_NOTIFICATIONS);
            setUnreadCount(DEFAULT_NAVBAR_NOTIFICATIONS.filter((n) => !n.isRead).length);
          }
        }
      } catch (_err) {
        if (isMounted) {
          setNotifications(DEFAULT_NAVBAR_NOTIFICATIONS);
          setUnreadCount(DEFAULT_NAVBAR_NOTIFICATIONS.filter((n) => !n.isRead).length);
        }
      } finally {
        if (isMounted) setIsLoadingNotifs(false);
      }
    };

    loadNavbarNotifications();

    const handleUpdate = () => {
      loadNavbarNotifications();
    };

    window.addEventListener("swaasthsaarthi-notification-update", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("swaasthsaarthi-notification-update", handleUpdate);
    };
  }, [isAuthenticated]);

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
    const baseItems = NAV_ITEMS.filter((item) => {
      if (item.id === "settings") return false;
      return true;
    });
    if (role === "laboratory") {
      return baseItems.filter((item) =>
        ["landing", "dashboard", "labs", "records", "access", "notifications"].includes(item.id)
      );
    }
    if (role === "pharmacy") {
      return baseItems.filter((item) =>
        ["landing", "dashboard", "prescriptions", "records", "access", "notifications"].includes(item.id)
      );
    }
    if (role === "admin") {
      return baseItems.filter((item) =>
        ["landing", "dashboard", "access", "records", "consents", "notifications"].includes(item.id)
      );
    }
    return baseItems;
  };

  const navItems = getNavItemsForRole(user?.role);
  // Split: First 5 items (Home, Dashboard, Records, Consent, Rx) are primary desktop items.
  const secondaryNavItems = navItems.slice(5);

  const handleSelectRoute = (route: NavigationRoute) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
    setIsOverflowOpen(false);
  };

  const handleNotificationItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif.notificationId);
      } catch (_e) {
        // continue
      }
      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notif.notificationId ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent("swaasthsaarthi-notification-update"));
    }
    setIsNotificationsOpen(false);
    handleSelectRoute("notifications");
  };

  return (
    <>
      {/* Edge-to-Edge Frosted Glass Header matching Landing Page */}
      <header className="sticky top-0 z-40 w-full bg-[#F0F7F6]/92 backdrop-blur-md border-b border-[#D0E5E1] shadow-[0_8px_30px_rgba(15,118,110,0.08)] transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Left Section: Brand Logo & Stylized Emblem (identical to landing page) */}
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger button */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 text-[#1A1918] hover:bg-[#D0E5E1]/40 rounded-none transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={() => handleSelectRoute("landing")}
              className="group flex items-center gap-3 transition-transform duration-200 hover:scale-[1.01] cursor-pointer text-left"
              aria-label="SwaasthSaarthi Home"
            >
              {/* Stylized sharp emblem */}
              <div className="relative w-10 h-10 rounded-none bg-gradient-to-tr from-[#0F766E] via-[#14B8A6] to-[#5EEAD4] p-0.5 flex items-center justify-center shadow-xs">
                <div className="w-full h-full rounded-none flex items-center justify-center overflow-hidden bg-[#F0F7F6]">
                  <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 transform group-hover:rotate-6 transition-transform duration-300"
                  >
                    <path
                      d="M6 18C6 11.3726 11.3726 6 18 6C18 12.6274 12.6274 18 6 18Z"
                      fill="#0F766E"
                    />
                    <path
                      d="M26 14C26 20.6274 20.6274 26 14 26C14 19.3726 19.3726 14 26 14Z"
                      fill="#4E8C78"
                      fillOpacity="0.85"
                    />
                    <circle cx="16" cy="16" r="3.5" fill="#F0F7F6" />
                    <circle cx="16" cy="2" fill="#0F766E" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-editorial-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1918] leading-none group-hover:text-[#0F766E] transition-colors">
                  SwaasthSaarthi
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-[#69655E] uppercase mt-0.5">
                  Unified Healthcare Network
                </span>
              </div>
            </button>
          </div>

          {/* Center Section: Editorial Navigation Links with Animated Teal Underline */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold transition-colors duration-200">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              const isSecondary = index >= 5;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectRoute(item.id)}
                  title={item.tooltip || item.label}
                  className={`group relative items-center gap-2 py-1 transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0 flex ${
                    isSecondary ? "hidden 2xl:flex" : "flex"
                  } ${
                    isActive
                      ? "text-[#0F766E] font-bold"
                      : "text-[#132E2B] hover:text-[#0F766E]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                      isActive
                        ? "text-[#0F766E] stroke-[2.2]"
                        : "text-[#7A746B] group-hover:text-[#0F766E] stroke-[1.8]"
                    }`}
                  />
                  <span>{item.label}</span>
                  {/* Underline matching Landing Page */}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#0F766E] transition-all duration-200 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                  {item.id === "notifications" && unreadCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Responsive Overflow Dropdown (visible between lg and 2xl breakpoints) */}
            {secondaryNavItems.length > 0 && (
              <div className="relative 2xl:hidden shrink-0" ref={overflowRef}>
                <button
                  onClick={() => setIsOverflowOpen((prev) => !prev)}
                  className={`group relative items-center gap-1.5 py-1 text-sm font-semibold transition-colors duration-200 cursor-pointer flex shrink-0 ${
                    secondaryNavItems.some((i) => i.id === currentRoute)
                      ? "text-[#0F766E] font-bold"
                      : "text-[#132E2B] hover:text-[#0F766E]"
                  }`}
                  title="More navigation options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>More</span>
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#0F766E] transition-all duration-200 ${
                      secondaryNavItems.some((i) => i.id === currentRoute) ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </button>

                {isOverflowOpen && (
                  <div className="absolute left-0 mt-3 w-52 z-50 animate-in fade-in zoom-in-95 duration-150 bg-white border border-[#D0E5E1] shadow-[0_12px_32px_rgba(26,25,24,0.08)] p-1.5">
                    <div className="w-full space-y-0.5">
                      {secondaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentRoute === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectRoute(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer rounded-none ${
                              isActive
                                ? "bg-[#E4F1EE] text-[#0F766E]"
                                : "text-[#5C574F] hover:text-[#191817] hover:bg-[#F0F7F6]"
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

          {/* Right Section: Alerts & Profile Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notifications / Alerts Dropdown */}
            <div className="relative shrink-0" ref={notifRef}>
              <button
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative p-2 text-[#132E2B] hover:text-[#0F766E] hover:bg-[#E4F1EE]/60 rounded-none transition-colors cursor-pointer border border-transparent hover:border-[#D0E5E1] shrink-0"
                aria-label="Alerts"
                title="View Alerts & Notifications"
              >
                <Bell className="w-4 h-4" strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0F766E] rounded-full ring-2 ring-white" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-76 sm:w-80 z-50 animate-in fade-in zoom-in-95 duration-150 bg-white border border-[#D0E5E1] shadow-[0_12px_32px_rgba(26,25,24,0.08)] p-2">
                  <div className="w-full text-[#191817]">
                    <div className="px-2.5 py-2 border-b border-[#D0E5E1] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#191817]">Alerts &amp; Notices</span>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] font-bold text-[#0F766E] bg-[#E4F1EE] border border-[#0F766E]/20 px-2 py-0.5 rounded-none">
                          {unreadCount} Unread
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#7A746B] bg-[#F0F7F6] border border-[#D0E5E1] px-2 py-0.5 rounded-none">
                          All Read
                        </span>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-[#D0E5E1]/60 py-1">
                      {isLoadingNotifs && notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#7A746B]">
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#7A746B]">
                          No notifications
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <button
                            key={n._id || n.notificationId}
                            onClick={() => handleNotificationItemClick(n)}
                            className={`w-full p-2.5 text-left hover:bg-[#F0F7F6] transition-colors rounded-none block cursor-pointer ${
                              !n.isRead ? "bg-[#F0F7F6] font-medium" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#191817] truncate">{n.title}</span>
                              <span className="text-[10px] text-[#7A746B] shrink-0">{formatTimeAgo(n.createdAt)}</span>
                            </div>
                            <p className="text-[11px] text-[#6E685F] mt-0.5 line-clamp-1">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="px-2.5 pt-2 pb-1 border-t border-[#D0E5E1] text-center">
                      <button
                        className="text-xs text-[#0F766E] font-semibold hover:underline cursor-pointer"
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          handleSelectRoute("notifications");
                        }}
                      >
                        Open Notification Inbox &rarr;
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
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-none border border-[#1A1918] bg-[#1A1918] text-white hover:bg-[#2E2C2A] text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-2xs flex items-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Patient Portal</span>
              </button>
            ) : (
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-none bg-white hover:bg-[#F8FBFA] transition-all border border-[#D0E5E1] hover:border-[#0F766E]/40 shadow-2xs cursor-pointer shrink-0"
                  aria-label={`User account menu for ${user?.name}`}
                  title={user?.name}
                >
                  <div className="w-8 h-8 rounded-none bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-white">
                    {getInitials(user?.name)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left min-w-0">
                    <span
                      className="text-xs font-semibold text-[#191817] leading-tight truncate max-w-[90px] md:max-w-[120px]"
                      title={user?.name}
                    >
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-[#7A746B] font-mono leading-none truncate mt-0.5">
                      {user?.patientId ? user.patientId : getRoleLabel(user?.role)}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7A746B] hidden sm:block shrink-0" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 z-50 animate-in fade-in zoom-in-95 duration-150 bg-white border border-[#D0E5E1] shadow-[0_12px_32px_rgba(26,25,24,0.08)] p-2">
                    <div className="w-full text-[#191817]">
                      <div className="px-3 py-2 border-b border-[#D0E5E1]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold text-[#191817] truncate" title={user?.name}>
                            {user?.name}
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                        {user?.patientId && (
                          <div className="my-1.5 flex items-center justify-between bg-[#F0F7F6] border border-[#D0E5E1] px-2 py-1">
                            <span className="text-[10px] text-[#7A746B] font-semibold">Patient ID:</span>
                            <span className="text-[10px] font-mono font-bold text-[#0F766E]">
                              {user.patientId}
                            </span>
                          </div>
                        )}
                        <p className="text-[11px] text-[#7A746B] font-mono truncate" title={user?.abhaAddress || user?.abhaId || user?.facility}>
                          {user?.abhaAddress || user?.abhaId || user?.facility}
                        </p>
                        <p className="text-[10px] text-[#0F766E] font-medium mt-0.5">
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#5C574F] hover:text-[#191817] hover:bg-[#F0F7F6] transition-colors text-left cursor-pointer rounded-none"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#7A746B]" />
                          <span>
                            {user?.role === "admin"
                              ? "Institution Management"
                              : "Settings & Preferences"}
                          </span>
                        </button>

                        {/* Public Landing Link */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleSelectRoute("landing");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#5C574F] hover:text-[#191817] hover:bg-[#F0F7F6] rounded-none transition-colors text-left cursor-pointer"
                        >
                          <House className="w-3.5 h-3.5 text-[#7A746B]" />
                          <span>Public Home Page</span>
                        </button>

                        {/* Switch Account */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            onOpenLogin();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#5C574F] hover:text-[#191817] hover:bg-[#F0F7F6] rounded-none transition-colors text-left cursor-pointer"
                        >
                          <UserRound className="w-3.5 h-3.5 text-[#7A746B]" />
                          <span>Switch Account</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-[#D0E5E1]">
                        <button
                          onClick={async () => {
                            setIsProfileOpen(false);
                            await logout();
                            handleSelectRoute("landing");
                            if (window.location.pathname !== "/") {
                              window.history.pushState({}, "", "/");
                            }
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
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200 bg-[#F0F7F6] border-r border-[#D0E5E1] shadow-2xl p-4 flex flex-col justify-between">
            <div className="w-full h-full flex flex-col justify-between text-[#191817]">
              <div className="space-y-4">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between pb-3 border-b border-[#D0E5E1]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-none bg-gradient-to-tr from-[#0F766E] to-[#14B8A6] text-white flex items-center justify-center shadow-xs">
                      <div className="w-full h-full bg-[#F0F7F6] rounded-none flex items-center justify-center p-0.5">
                        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                          <path d="M6 18C6 11.3726 11.3726 6 18 6C18 12.6274 12.6274 18 6 18Z" fill="#0F766E" />
                          <path d="M26 14C26 20.6274 20.6274 26 14 26C14 19.3726 19.3726 14 26 14Z" fill="#4E8C78" fillOpacity="0.85" />
                          <circle cx="16" cy="16" r="3" fill="#F0F7F6" />
                          <circle cx="16" cy="16" r="1.5" fill="#0F766E" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <span className="font-editorial-serif font-bold text-[#1A1918] text-sm leading-tight block">
                        SwaasthSaarthi
                      </span>
                      <span className="text-[10px] text-[#0F766E] font-mono tracking-wide">ABDM · FHIR R4</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-[#5C574F] hover:text-[#191817] hover:bg-[#D0E5E1]/50 rounded-none cursor-pointer"
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-xs transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#E4F1EE] text-[#0F766E] font-bold border-l-2 border-[#0F766E]"
                            : "text-[#5C574F] hover:text-[#191817] hover:bg-[#D0E5E1]/40"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-[#0F766E]" : "text-[#7A746B]"
                          }`}
                          strokeWidth={1.8}
                        />
                        <span className="flex-1 text-left">{item.tooltip || item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-none font-mono bg-[#D0E5E1] text-[#191817]">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Settings link in mobile list */}
                  <button
                    onClick={() => handleSelectRoute("settings")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-xs transition-colors cursor-pointer ${
                      currentRoute === "settings"
                        ? "bg-[#E4F1EE] text-[#0F766E] font-bold border-l-2 border-[#0F766E]"
                        : "text-[#5C574F] hover:text-[#191817] hover:bg-[#D0E5E1]/40"
                    }`}
                  >
                    <Settings className="w-4 h-4 text-[#7A746B] shrink-0" strokeWidth={1.8} />
                    <span className="flex-1 text-left">Settings</span>
                  </button>
                </nav>
              </div>

              {/* Mobile Drawer Footer: Persona & Logout */}
              <div className="pt-3 border-t border-[#D0E5E1] space-y-2">
                {isAuthenticated && user ? (
                  <div className="p-2.5 rounded-none bg-white border border-[#D0E5E1]">
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
                          handleSelectRoute("landing");
                          if (window.location.pathname !== "/") {
                            window.history.pushState({}, "", "/");
                          }
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
                      className="w-full py-1 text-[11px] text-[#0F766E] hover:underline font-medium text-left cursor-pointer flex items-center gap-1.5"
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
