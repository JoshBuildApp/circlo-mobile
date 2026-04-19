import { Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, Calendar, MessageSquare, Heart, Sparkles, CheckCircle2, Clock,
} from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/use-notifications";

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

/** Pick an icon + tint for each notification type. Safe defaults for unknowns. */
function typeMeta(type: string) {
  switch (type) {
    case "booking_confirmed":
    case "booking_request":
    case "booking_reminder":
      return { Icon: Calendar, color: "#46f1c5", bg: "bg-[#46f1c5]/10" };
    case "message":
    case "chat":
      return { Icon: MessageSquare, color: "#ffb59a", bg: "bg-[#ffb59a]/10" };
    case "like":
    case "follow":
    case "save":
      return { Icon: Heart, color: "#ff4d6d", bg: "bg-[#ff4d6d]/10" };
    case "review_prompt":
    case "review":
      return { Icon: Sparkles, color: "#ffd166", bg: "bg-[#ffd166]/10" };
    case "booking_cancelled":
      return { Icon: X, color: "#ff6b2c", bg: "bg-[#ff6b2c]/10" };
    default:
      return { Icon: Bell, color: "#94a3b8", bg: "bg-muted/40" };
  }
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Where should tapping this notification go? */
function hrefFor(n: Notification): string | null {
  if (!n.reference_type || !n.reference_id) return null;
  switch (n.reference_type) {
    case "booking":
      return `/schedule`;
    case "coach":
      return `/coach/${n.reference_id}`;
    case "message":
    case "thread":
      return `/chat/${n.reference_id}`;
    default:
      return null;
  }
}

const NotificationCenter = ({ open, onClose }: NotificationCenterProps) => {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  /** Group by today / earlier for scannability. */
  const { today, earlier } = useMemo(() => {
    const t: Notification[] = [];
    const e: Notification[] = [];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    for (const n of notifications) {
      if (new Date(n.created_at).getTime() >= startOfDay.getTime()) t.push(n);
      else e.push(n);
    }
    return { today: t, earlier: e };
  }, [notifications]);

  const handleTap = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    const href = hrefFor(n);
    if (href) {
      onClose();
      navigate(href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="Notifications"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-[400px] bg-background border-l border-border/40 shadow-2xl flex flex-col app-top-nav"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#46f1c5]" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black text-background bg-[#46f1c5] rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-[0.18em] text-[#46f1c5] px-2 py-1 rounded-md hover:bg-[#46f1c5]/10 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close notifications"
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-foreground/5 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto safe-area-bottom">
              {loading && notifications.length === 0 && (
                <div className="px-5 py-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-card border border-border/30 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-20 px-8">
                  <div className="h-14 w-14 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                    <Bell className="h-6 w-6 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-bold text-foreground">You're all caught up</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll ping you about bookings, messages and new coaches.
                  </p>
                </div>
              )}

              {[{ label: "Today", items: today }, { label: "Earlier", items: earlier }].map(
                ({ label, items }) =>
                  items.length > 0 && (
                    <Fragment key={label}>
                      <div className="px-5 pt-4 pb-1 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">
                        {label}
                      </div>
                      <ul className="px-2 pb-2">
                        {items.map((n) => {
                          const meta = typeMeta(n.type);
                          return (
                            <li key={n.id}>
                              <button
                                type="button"
                                onClick={() => handleTap(n)}
                                className={`w-full flex gap-3 p-3 rounded-xl text-left transition-colors ${
                                  n.is_read ? "hover:bg-foreground/5" : "bg-[#46f1c5]/5 hover:bg-[#46f1c5]/10"
                                }`}
                              >
                                <div
                                  className={`flex-shrink-0 h-10 w-10 rounded-xl ${meta.bg} flex items-center justify-center relative`}
                                >
                                  <meta.Icon className="h-4 w-4" style={{ color: meta.color }} />
                                  {!n.is_read && (
                                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-[#46f1c5] rounded-full ring-2 ring-background" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                                    <span className="text-[10px] text-muted-foreground/70 font-semibold flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {timeAgo(n.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </Fragment>
                  ),
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/30 px-5 py-3 flex items-center justify-between app-bottom-nav">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/notification-preferences");
                }}
                className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
              >
                Preferences
              </button>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-[#46f1c5]" />
                Real-time updates on
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
