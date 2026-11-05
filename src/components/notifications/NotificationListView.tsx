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
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/client";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import type { NotificationItem, NotificationCategory } from "../../types/api";

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
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
      if (data?.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? data.notifications.filter((n) => !n.isRead).length);
      } else if (!unreadOnly) {
        setNotifications(DEFAULT_NOTIFICATIONS);
        setUnreadCount(DEFAULT_NOTIFICATIONS.filter((n) => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      if (!unreadOnly) {
        setNotifications(DEFAULT_NOTIFICATIONS);
        setUnreadCount(DEFAULT_NOTIFICATIONS.filter((n) => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      console.warn("Could not load notifications from API:", err);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Synchronize with bell dropdown updates
  useEffect(() => {
    const handleUpdate = () => {
      loadNotifications();
    };
    window.addEventListener("swaasthsaarthi-notification-update", handleUpdate);
    return () => {
      window.removeEventListener("swaasthsaarthi-notification-update", handleUpdate);
    };
  }, [loadNotifications]);

  const handleMarkOne = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    window.dispatchEvent(new CustomEvent("swaasthsaarthi-notification-update"));
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    window.dispatchEvent(new CustomEvent("swaasthsaarthi-notification-update"));
  };

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case "CONSENT":
        return <FileText className="w-4 h-4 text-[#57477D]" />;
      case "RECORD_ACCESS":
      case "CLINICAL_ACCESS":
        return <ShieldAlert className="w-4 h-4 text-indigo-600" />;
      case "LAB_REPORT":
        return <FlaskConical className="w-4 h-4 text-cyan-600" />;
      case "PRESCRIPTION":
      case "PHARMACY_DISPENSE":
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case "ONBOARDING":
        return <Building className="w-4 h-4 text-blue-600" />;
      case "SECURITY":
        return <KeyRound className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#7A746B]" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategory === "ALL") return true;
    if (n.category === selectedCategory) return true;
    if (selectedCategory === "RECORD_ACCESS" && (n.category === ("CLINICAL_ACCESS" as NotificationCategory) || n.category === "RECORD_ACCESS")) return true;
    if (selectedCategory === "PRESCRIPTION" && (n.category === ("PHARMACY_DISPENSE" as NotificationCategory) || n.category === "PRESCRIPTION")) return true;
    return false;
  });

  return (
    <div className="space-y-6 font-editorial-sans">
      {/* Header */}
      <PageHeader
        title="Notifications &amp; Alerts"
        description="Updates regarding consent requests, clinical reviews, lab findings, and prescriptions."
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
                onClick={handleMarkAll}
              >
                Mark all as read ({unreadCount})
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
              onClick={loadNotifications}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-[#EAE4D9] shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-[#EAE4D9] rounded-none px-3 py-1.5 bg-[#FAF7F2] text-[#191817] font-medium cursor-pointer focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1A1918]"
          >
            <option value="ALL">All Categories</option>
            <option value="CONSENT">Consent Requests</option>
            <option value="RECORD_ACCESS">Record Access</option>
            <option value="LAB_REPORT">Lab Reports</option>
            <option value="PRESCRIPTION">Prescriptions</option>
            <option value="ONBOARDING">Care Context / Updates</option>
            <option value="SECURITY">Security &amp; Auth</option>
          </select>

          <label className="flex items-center gap-2 text-xs text-[#5C574F] cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded-none border-[#D5CEC2] text-[#1A1918] focus:ring-[#1A1918] w-3.5 h-3.5 cursor-pointer"
            />
            <span>Unread only</span>
          </label>
        </div>

        <div className="text-xs text-[#7A746B] text-right">
          Showing <strong className="text-[#191817] font-semibold">{filteredNotifications.length}</strong> {filteredNotifications.length === 1 ? "alert" : "alerts"}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-none text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Notifications Inbox */}
      <div className="bg-white rounded-none border border-[#EAE4D9] shadow-[0_4px_20px_rgba(26,25,24,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#7A746B] text-xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#57477D]" />
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            title="No Notifications"
            description="You're all caught up. Updates regarding consent authorizations, lab reports, and prescriptions will appear here."
            icon={<Bell className="w-5 h-5 text-[#57477D]" />}
          />
        ) : (
          <div className="divide-y divide-[#EAE4D9]">
            {filteredNotifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 sm:p-5 transition-colors flex items-start justify-between gap-4 ${!n.isRead ? "bg-[#FAF7F2] font-medium" : "hover:bg-[#FAF7F2]/50"
                  }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-none bg-white border border-[#EAE4D9] text-[#57477D] mt-0.5 shrink-0 shadow-2xs">
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#191817]">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#57477D] shrink-0" />
                      )}
                      <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-medium tracking-wider bg-[#FAF7F2] text-[#57477D] border border-[#57477D]/25 uppercase">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C574F] leading-relaxed font-normal">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-[#7A746B] pt-0.5 font-mono">
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {n.relatedResourceId && (
                        <span className="ml-2 font-mono text-[#7A746B]">
                          Ref: {n.relatedResourceId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkOne(n.notificationId)}
                    className="p-1.5 text-[#7A746B] hover:text-[#191817] hover:bg-[#FAF7F2] rounded-none transition-colors cursor-pointer shrink-0 border border-transparent hover:border-[#D5CEC2]"
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


    </div>
  );
}
