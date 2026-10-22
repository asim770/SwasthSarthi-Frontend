import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { NAV_ITEMS, type NavigationRoute } from "./navigation";

export interface SidebarProps {
  currentRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Activity className="w-5 h-5 text-teal-100" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-tight">
                SwasthSaarthi
              </span>
              <span className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider">
                ABDM • FHIR R4
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? "bg-teal-50 text-teal-900 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              } ${isCollapsed ? "justify-center px-2" : ""}`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-teal-700 rounded-r-md" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-teal-700" : "text-slate-400"
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-teal-200/70 text-teal-900"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Section & Collapse Toggle */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0">
        <div
          className={`flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
            RV
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  Rahul Verma
                </span>
                <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                ABHA: 32-8492-1920-4491
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              title="Sign Out"
              className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
              onClick={() => alert("Sign out demonstration")}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-full mt-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          isCollapsed ? "w-18" : "w-64"
        } h-screen sticky top-0 z-30`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 transform transition-transform">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
