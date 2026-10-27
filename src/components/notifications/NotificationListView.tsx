import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Check,
  ShieldAlert,
  FileText,
  FlaskConical,
  Pill,
  KeyRound,
  RefreshCw,
  Building,
  Info,
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/client";
import type { NotificationItem, NotificationCategory } from "../../types/api";

export function NotificationListView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications({
        limit: 50,
        unreadOnly: unreadOnly || undefined,
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkOne = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case "CONSENT":
        return <FileText className="w-4 h-4 text-teal-600" />;
      case "CLINICAL_ACCESS":
        return <ShieldAlert className="w-4 h-4 text-indigo-600" />;
      case "LAB_REPORT":
        return <FlaskConical className="w-4 h-4 text-cyan-600" />;
      case "PHARMACY_DISPENSE":
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case "ONBOARDING":
        return <Building className="w-4 h-4 text-blue-600" />;
      case "SECURITY":
        return <KeyRound className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategory !== "ALL" && n.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#d7eaea] rounded-[18px] p-6 shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0fdfa] text-[#008080] border border-[#b2d8d8] text-xs font-semibold mb-3">
              <Bell className="w-3.5 h-3.5" />
              Real-time In-App Dispatch
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172033] mb-2">
              Notifications &amp; Consent Alerts
            </h1>
            <p className="text-[#475569] text-sm leading-relaxed">
              Timely, privacy-safe notifications for consent requests, authorized record queries, diagnostic test completions, and prescription dispensations.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-2 px-4 py-2 bg-[#008080] text-white rounded-[12px] text-xs font-semibold hover:bg-[#006666] active:bg-[#004c4c] transition-colors shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-[18px] border border-[#d7eaea] shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-[#d7eaea] rounded-[12px] px-2.5 py-2 bg-white text-[#172033] font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#008080]"
          >
            <option value="ALL">All Categories</option>
            <option value="CONSENT">Consent Events</option>
            <option value="CLINICAL_ACCESS">Clinical Access</option>
            <option value="LAB_REPORT">Lab Reports</option>
            <option value="PHARMACY_DISPENSE">Medication Dispensing</option>
            <option value="ONBOARDING">Institutional Onboarding</option>
            <option value="SECURITY">Security & Auth</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-[#475569] cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-[#d7eaea] text-[#008080] focus:ring-[#008080] w-3.5 h-3.5"
            />
            <span>Unread only</span>
          </label>
        </div>

        <button
          onClick={loadNotifications}
          disabled={loading}
          className="p-2 border border-[#d7eaea] rounded-[12px] text-[#008080] hover:bg-[#f0fdfa] transition-colors cursor-pointer self-end sm:self-auto"
          title="Refresh notifications"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-[18px] text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Notifications Inbox */}
      <div className="bg-white rounded-[18px] border border-[#d7eaea] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748b] text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#008080]" />
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No notifications in your inbox.</p>
            <p className="text-xs text-slate-400 mt-1">
              You will be notified here when important clinical or consent events occur.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 sm:p-5 transition-colors flex items-start justify-between gap-4 ${
                  !n.isRead ? "bg-teal-50/30 font-medium" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-100 mt-0.5 shrink-0">
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600 uppercase">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1">
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {n.relatedResourceId && (
                        <span className="ml-2 font-mono text-slate-400">
                          Ref: {n.relatedResourceId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkOne(n.notificationId)}
                    className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-500 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Privacy Safeguard:</strong> All notification messages are strictly filtered and validated to prevent sensitive clinical parameters, test results, passwords, or authentication secrets from leaking outside encrypted clinical boundaries.
        </span>
      </div>
    </div>
  );
}
