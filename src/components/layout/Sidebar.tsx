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
      <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-slate-200/50">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs ring-1 ring-teal-500/20">
            <Activity className="w-4 h-4 text-teal-100" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-semibold text-slate-900 tracking-tight text-sm leading-tight">
                SwasthSaarthi
              </span>
              <span className="text-[10px] text-teal-700/80 font-medium tracking-wide">
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
              className="w-full pl-8 pr-7 py-1.5 text-xs glass-input rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
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
          <div className="px-3 py-6 text-center text-xs text-slate-400">
            <p className="font-medium text-slate-500">No matching pages</p>
            <button
              onClick={() => setNavSearch("")}
              className="mt-1.5 text-[11px] text-teal-700 hover:underline cursor-pointer"
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
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 relative cursor-pointer ${
                  isActive
                    ? "bg-teal-500/10 text-teal-950 font-semibold shadow-2xs border border-teal-500/15"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                } ${isCollapsed ? "justify-center px-1.5" : ""}`}
              >
                {isActive && (
                  <span className="absolute left-0.5 top-2 bottom-2 w-1 bg-teal-600 rounded-full" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-teal-700" : "text-slate-400"
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? "bg-teal-600/15 text-teal-800"
                            : "bg-slate-200/60 text-slate-500"
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
      <div className="p-3 border-t border-slate-200/50 shrink-0">
        {!isAuthenticated ? (
          <div
            className={`p-2.5 rounded-xl bg-white/70 border border-white/80 shadow-2xs ${
              isCollapsed ? "text-center" : ""
            }`}
          >
            {!isCollapsed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-100">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-800 leading-tight">
                      Guest Mode
                    </p>
                    <p className="text-[10px] text-slate-400">Sandbox Preview</p>
                  </div>
                </div>
                {onOpenLogin && (
                  <button
                    onClick={onOpenLogin}
                    className="w-full py-1.5 px-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-teal-200" />
                    <span>Sign in with ABHA</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                title="Sign in with ABHA"
                className="w-full flex justify-center text-teal-700 p-1 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            className={`p-2 rounded-xl bg-white/70 border border-white/80 shadow-2xs ${
              isCollapsed ? "text-center" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-teal-700 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  {getInitials(user?.name)}
                </div>
                {!isCollapsed && (
                  <div className="truncate flex-1 text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
                      className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
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
