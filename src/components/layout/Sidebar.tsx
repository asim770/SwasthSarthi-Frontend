import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
  LogOut,
  Search,
  User,
  Shield,
  Sparkles,
} from "lucide-react";
import { NAV_ITEMS, type NavigationRoute } from "./navigation";
import { useAuth } from "../../context/AuthContext";

export interface SidebarProps {
  currentRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenLogin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenLogin,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [navSearch, setNavSearch] = useState("");

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

  const getRoleBadgeLabel = (role?: string) => {
    switch (role) {
      case "doctor":
        return "Doctor";
      case "laboratory":
        return "Lab Tech";
      case "pharmacy":
        return "Pharmacy";
      case "admin":
        return "Admin";
      default:
        return "Patient";
    }
  };

  // Filter navigation items in real time based on user search query
  const filteredNavItems = useMemo(() => {
    const query = navSearch.trim().toLowerCase();
    if (!query) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
  }, [navSearch]);

  const handleSelectRoute = (route: NavigationRoute) => {
    onNavigate(route);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full glass-sidebar select-none transition-all duration-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-[#D0E5E1]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-none bg-[#0F766E] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Activity className="w-4 h-4 text-[#F0F7F6]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-editorial-serif font-bold text-[#1A1918] tracking-tight text-sm leading-tight">
                SwaasthSaarthi
              </span>
              <span className="text-[10px] text-[#0F766E] font-mono tracking-wide">
                ABDM · FHIR R4
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Collapse Button (Desktop) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Close Button (Mobile) */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100/70 cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Search Bar (Search-First Navigation Panel) */}
      {!isCollapsed && (
        <div className="px-3 pt-3.5 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              aria-label="Search navigation items"
              className="w-full pl-8 pr-7 py-1.5 text-xs glass-input rounded-none text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
            {navSearch && (
              <button
                onClick={() => setNavSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                aria-label="Clear navigation search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Links List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {filteredNavItems.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-[#69655E]">
            <p className="font-medium text-[#1A1918]">No matching pages</p>
            <button
              onClick={() => setNavSearch("")}
              className="mt-1.5 text-[11px] text-[#0F766E] hover:underline cursor-pointer"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectRoute(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-none text-xs font-medium transition-all duration-150 relative cursor-pointer ${
                  isActive
                    ? "bg-[#1A1918] text-white font-medium shadow-2xs border border-[#1A1918]"
                    : "text-[#5C574F] hover:text-[#191817] hover:bg-[#F0F7F6] border border-transparent"
                } ${isCollapsed ? "justify-center px-1.5" : ""}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-1 bg-[#0F766E]" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-[#7A746B]"
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-none ${
                          isActive
                            ? "bg-[#F0F7F6] text-[#1A1918]"
                            : "bg-[#D0E5E1] text-[#69655E]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })
        )}
      </nav>

      {/* Bottom Profile / Session Card */}
      <div className="p-3 border-t border-[#D0E5E1] shrink-0">
        {!isAuthenticated ? (
          <div
            className={`p-2.5 rounded-none bg-white border border-[#D0E5E1] shadow-2xs ${
              isCollapsed ? "text-center" : ""
            }`}
          >
            {!isCollapsed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-none bg-[#F0F7F6] text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0 border border-[#D0E5E1]">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-[#1A1918] leading-tight">
                      Guest Mode
                    </p>
                    <p className="text-[10px] text-[#69655E]">Sandbox Preview</p>
                  </div>
                </div>
                {onOpenLogin && (
                  <button
                    onClick={onOpenLogin}
                    className="w-full py-1.5 px-2 bg-[#1A1918] hover:bg-[#2A2928] text-white rounded-none text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Sign in with ABHA</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                title="Sign in with ABHA"
                className="w-full flex justify-center text-[#0F766E] p-1 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            className={`p-2 rounded-none bg-white border border-[#D0E5E1] shadow-2xs ${
              isCollapsed ? "text-center" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-none bg-[#0F766E] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  {getInitials(user?.name)}
                </div>
                {!isCollapsed && (
                  <div className="truncate flex-1 text-left">
                    <p className="text-xs font-semibold text-[#1A1918] leading-tight truncate">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-[#69655E] truncate flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500" />
                      {getRoleBadgeLabel(user?.role)}
                    </p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex items-center gap-1 shrink-0">
                  {onOpenLogin && (
                    <button
                      onClick={onOpenLogin}
                      title="Switch Demo Persona"
                      className="p-1 text-[#69655E] hover:text-[#0F766E] hover:bg-[#F0F7F6] rounded-none transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block h-screen shrink-0 transition-all duration-200 z-30 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Surface */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
