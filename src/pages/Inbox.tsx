import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare, Users, Bell, CalendarCheck, Search, Check, X,
  CheckCheck, Clock, User, Zap, Heart, UserPlus, DollarSign,
  Inbox as InboxIcon, Sparkles, ArrowRight, Trophy, Star,
  ChevronRight, MessageCircle
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useConversations } from "@/hooks/use-messages";
import { useBookingRequests } from "@/hooks/use-booking-requests";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useBatchOnlineStatus } from "@/hooks/use-online-status";
import { ActiveIndicator } from "@/components/ActiveIndicator";
import { EmptyState } from "@/components/EmptyState";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "messages" | "requests" | "notifications";

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  booking: CalendarCheck,
  follow: UserPlus,
  content: Heart,
  comment: MessageCircle,
  like: Heart,
  payment: DollarSign,
  message: MessageSquare,
  badge: Trophy,
  level_up: Star,
  system: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  booking: "bg-blue-500/10 text-blue-500",
  follow: "bg-purple-500/10 text-purple-500",
  content: "bg-red-500/10 text-red-500",
  comment: "bg-orange-500/10 text-orange-500",
  like: "bg-red-500/10 text-red-500",
  payment: "bg-green-500/10 text-green-500",
  message: "bg-blue-500/10 text-blue-500",
  badge: "bg-amber-500/10 text-amber-500",
  level_up: "bg-amber-500/10 text-amber-500",
  system: "bg-secondary text-muted-foreground/50",
};

type NotificationCategory = "bookings" | "social" | "system";

const CATEGORY_CONFIG: Record<NotificationCategory, {
  label: string;
  icon: typeof Bell;
  gradient: string;
  iconBg: string;
  types: string[];
}> = {
  bookings: {
    label: "Bookings",
    icon: CalendarCheck,
    gradient: "from-blue-500/10 to-blue-500/5",
    iconBg: "bg-blue-500/10 text-blue-500",
    types: ["booking"],
  },
  social: {
    label: "Social",
    icon: Heart,
    gradient: "from-purple-500/10 to-pink-500/5",
    iconBg: "bg-purple-500/10 text-purple-500",
    types: ["follow", "content", "like", "comment", "message"],
  },
  system: {
    label: "System",
    icon: Bell,
    gradient: "from-amber-500/10 to-amber-500/5",
    iconBg: "bg-amber-500/10 text-amber-500",
    types: ["system", "payment", "badge", "level_up"],
  },
};

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, loading: msgsLoading } = useConversations();
  const { requests, loading: reqLoading, acceptRequest, rejectRequest, pendingCount } = useBookingRequests();
  const { notifications, loading: notifLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [tab, setTab] = useState<Tab>("messages");
  const [search, setSearch] = useState("");

  // Filter conversations by search
  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) => c.partnerName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Filter requests by search
  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(
      (r) => (r.user_name || "").toLowerCase().includes(q) || r.training_type.toLowerCase().includes(q)
    );
  }, [requests, search]);

  // Group notifications by type category
  const groupedNotifications = useMemo(() => {
    const filtered = search.trim()
      ? notifications.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))
      : notifications;

    const groups: Record<NotificationCategory, typeof notifications> = {
      bookings: [],
      social: [],
      system: [],
    };

    for (const n of filtered) {
      if (CATEGORY_CONFIG.bookings.types.includes(n.type)) {
        groups.bookings.push(n);
      } else if (CATEGORY_CONFIG.social.types.includes(n.type)) {
        groups.social.push(n);
      } else {
        groups.system.push(n);
      }
    }
    return groups;
  }, [notifications, search]);

  // Separate pending vs other requests
  const pendingRequests = filteredRequests.filter((r) => r.status === "pending" || r.status === "upcoming");
  const otherRequests = filteredRequests.filter((r) => r.status !== "pending" && r.status !== "upcoming");

  const unreadMsgs = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Batch fetch online statuses for conversation partners
  const partnerIds = useMemo(() => conversations.map((c) => c.partnerId), [conversations]);
  const onlineStatuses = useBatchOnlineStatus(partnerIds);

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <InboxIcon className="h-9 w-9 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground">Sign in to view inbox</h2>
          <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">Messages, requests, and updates all in one place</p>
        </div>
        <Link to="/login" className="px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-bold active:scale-95 transition-all shadow-sm">
          Sign In
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare; count: number }[] = [
    { key: "messages", label: "Messages", icon: MessageSquare, count: unreadMsgs },
    { key: "requests", label: "Requests", icon: CalendarCheck, count: pendingCount },
    { key: "notifications", label: "Updates", icon: Bell, count: unreadCount },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <PageHeader
        title="Inbox"
        actions={
          <>
            {(unreadMsgs + pendingCount + unreadCount) > 0 && (
              <span className="h-5 min-w-[20px] rounded-full bg-destructive flex items-center justify-center px-1.5">
                <span className="text-[10px] font-bold text-white">{unreadMsgs + pendingCount + unreadCount}</span>
              </span>
            )}
            {tab === "notifications" && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-primary active:scale-95 transition-all"
              >
                Mark all read
              </button>
            )}
          </>
        }
      >
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === "messages" ? "Search messages..." :
              tab === "requests" ? "Search requests..." : "Search updates..."
            }
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary/40 border-0 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:bg-secondary/60 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="relative flex gap-1 bg-secondary/40 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 z-10",
                tab === t.key
                  ? "text-foreground"
                  : "text-muted-foreground/70"
              )}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="inbox-tab-bg"
                  className="absolute inset-0 bg-background rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 text-[10px] font-bold",
                    tab === t.key ? "bg-destructive text-white" : "bg-muted-foreground/15 text-muted-foreground/70"
                  )}>
                    {t.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "messages" && <MessagesTab conversations={filteredConvs} loading={msgsLoading} onlineStatuses={onlineStatuses} />}
            {tab === "requests" && (
              <RequestsTab
                pending={pendingRequests}
                other={otherRequests}
                loading={reqLoading}
                onAccept={acceptRequest}
                onReject={rejectRequest}
              />
            )}
            {tab === "notifications" && (
              <NotificationsTab
                groups={groupedNotifications}
                loading={notifLoading}
                onMarkRead={markAsRead}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Messages Tab ─── */
const MessagesTab = ({ conversations, loading, onlineStatuses }: { conversations: any[]; loading: boolean; onlineStatuses: Record<string, import("@/hooks/use-activity").ActivityStatus> }) => {
  if (loading) return <LoadingState />;
  if (conversations.length === 0) return <EmptyState icon={MessageSquare} illustration="messages" title="No messages yet" description="Start a conversation with a coach to get personalised training advice" action={{ label: "Find a Coach", to: "/discover" }} size="lg" />;

  return (
    <div className="py-1">
      {conversations.map((conv, i) => {
        const status = onlineStatuses[conv.partnerId] || "offline";
        return (
          <motion.div
            key={conv.partnerId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to={`/chat/${conv.partnerId}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 active:bg-secondary/50 transition-colors",
                conv.unreadCount > 0 ? "bg-primary/[0.02]" : ""
              )}
            >
              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                {conv.partnerAvatar ? (
                  <img src={conv.partnerAvatar} alt={conv.partnerName} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
                    <User className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
                <ActiveIndicator isActive={status === "online"} size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground/90")}>
                    {conv.partnerName}
                  </p>
                  <span className={cn(
                    "text-[10px] flex-shrink-0 ml-2",
                    conv.unreadCount > 0 ? "text-primary font-semibold" : "text-muted-foreground/50"
                  )}>
                    {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {conv.unreadCount === 0 && <CheckCheck className="h-3 w-3 text-primary/60 flex-shrink-0" />}
                  <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground/60")}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
              {conv.unreadCount > 0 && (
                <div className="h-5 min-w-[20px] rounded-full bg-primary flex items-center justify-center px-1 flex-shrink-0 shadow-sm">
                  <span className="text-[10px] font-bold text-primary-foreground">{conv.unreadCount}</span>
                </div>
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ─── Requests Tab ─── */
const RequestsTab = ({
  pending, other, loading, onAccept, onReject
}: {
  pending: any[]; other: any[]; loading: boolean;
  onAccept: (id: string) => void; onReject: (id: string) => void;
}) => {
  if (loading) return <LoadingState />;
  if (pending.length === 0 && other.length === 0) return <EmptyState icon={CalendarCheck} illustration="requests" title="No requests yet" description="Booking requests from your athletes will appear here" action={{ label: "Share Profile", to: "/profile" }} size="lg" />;

  return (
    <div className="py-1">
      {pending.length > 0 && (
        <>
          <div className="px-4 py-2.5 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">Pending · {pending.length}</p>
          </div>
          {pending.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <RequestCard request={r} onAccept={onAccept} onReject={onReject} isPending />
            </motion.div>
          ))}
        </>
      )}
      {other.length > 0 && (
        <>
          <div className="px-4 py-2.5 mt-2">
            <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">History</p>
          </div>
          {other.map((r) => (
            <RequestCard key={r.id} request={r} onAccept={onAccept} onReject={onReject} isPending={false} />
          ))}
        </>
      )}
    </div>
  );
};

const RequestCard = ({
  request: r, onAccept, onReject, isPending
}: {
  request: any; onAccept: (id: string) => void; onReject: (id: string) => void; isPending: boolean;
}) => {
  const statusStyles: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
    cancelled: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" },
    completed: { bg: "bg-secondary", text: "text-muted-foreground" },
  };

  const style = statusStyles[r.status] || { bg: "bg-secondary", text: "text-muted-foreground" };

  return (
    <div className={cn(
      "mx-4 mb-2.5 rounded-2xl border bg-card p-4 transition-all",
      isPending ? "border-primary/20 shadow-[0_2px_12px_rgba(0,212,170,0.06)]" : "border-border/10"
    )}>
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {r.user_avatar ? (
            <img src={r.user_avatar} alt="" className="h-full w-full rounded-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
              <User className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground truncate">{r.user_name || "User"}</p>
            <span className="text-[10px] text-muted-foreground/50">
              {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 capitalize bg-secondary/50 px-2 py-0.5 rounded-md">
              <Zap className="h-3 w-3" />{r.training_type}
            </span>
            <span className="text-xs text-muted-foreground/60">{r.date} · {r.time_label}</span>
            {r.is_group && (
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground/60 bg-secondary/50 px-2 py-0.5 rounded-md">
                <Users className="h-3 w-3" />{r.total_participants}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-sm font-bold text-foreground">₪{r.price}</span>
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2.5 mt-3.5">
          <button
            onClick={() => onAccept(r.id)}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all shadow-[0_2px_8px_rgba(0,212,170,0.2)]"
          >
            <Check className="h-3.5 w-3.5" /> Accept
          </button>
          <button
            onClick={() => onReject(r.id)}
            className="flex-1 h-10 rounded-xl bg-secondary/80 text-foreground/70 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all"
          >
            <X className="h-3.5 w-3.5" /> Decline
          </button>
        </div>
      ) : (
        <div className="mt-2.5">
          <span className={cn("text-[10px] font-bold uppercase px-2.5 py-1 rounded-full", style.bg, style.text)}>
            {r.status}
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Notifications Tab ─── */
const NotificationsTab = ({
  groups, loading, onMarkRead
}: {
  groups: Record<NotificationCategory, any[]>; loading: boolean;
  onMarkRead: (id: string) => void;
}) => {
  const [expandedCategory, setExpandedCategory] = useState<NotificationCategory | null>(null);

  if (loading) return <LoadingState />;
  const total = groups.bookings.length + groups.social.length + groups.system.length;
  if (total === 0) return <EmptyState icon={Bell} illustration="notifications" title="All quiet here" description="Follow coaches and book sessions to start receiving activity updates" action={{ label: "Discover Coaches", to: "/discover" }} size="lg" />;

  const categories = (Object.keys(CATEGORY_CONFIG) as NotificationCategory[]).filter(
    (cat) => groups[cat].length > 0
  );

  if (expandedCategory && groups[expandedCategory].length > 0) {
    const config = CATEGORY_CONFIG[expandedCategory];
    const items = groups[expandedCategory];
    const unread = items.filter((n) => !n.is_read).length;

    return (
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => setExpandedCategory(null)}
          className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs font-semibold text-primary active:opacity-70 transition-opacity"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          All Updates
        </button>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", config.iconBg)}>
              <config.icon className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{config.label}</p>
              <p className="text-[11px] text-muted-foreground/60">
                {items.length} notification{items.length !== 1 ? "s" : ""}
                {unread > 0 && <span className="text-primary font-semibold"> · {unread} new</span>}
              </p>
            </div>
          </div>
        </div>
        <div className="pb-2">
          {items.map((n, i) => (
            <NotificationItem key={n.id} notification={n} index={i} onMarkRead={onMarkRead} />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {categories.map((cat, catIdx) => {
        const config = CATEGORY_CONFIG[cat];
        const items = groups[cat];
        const unread = items.filter((n) => !n.is_read).length;
        const preview = items.slice(0, 2);

        return (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.06, duration: 0.25 }}
            onClick={() => setExpandedCategory(cat)}
            className={cn(
              "w-full rounded-2xl border border-border/10 bg-card overflow-hidden text-left",
              "active:scale-[0.98] transition-all duration-200",
              unread > 0 && "ring-1 ring-primary/10"
            )}
          >
            {/* Category Header */}
            <div className={cn("px-4 py-3.5 flex items-center gap-3 bg-gradient-to-r", config.gradient)}>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", config.iconBg)}>
                <config.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">{config.label}</p>
                  {unread > 0 && (
                    <span className="h-5 min-w-[20px] rounded-full bg-primary flex items-center justify-center px-1.5 shadow-sm">
                      <span className="text-[10px] font-bold text-primary-foreground">{unread}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {items.length} notification{items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
            </div>

            {/* Preview Items */}
            <div className="divide-y divide-border/5">
              {preview.map((n) => {
                const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[n.type] || "bg-secondary text-muted-foreground/50";
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      !n.is_read && "bg-primary/[0.02]"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      !n.is_read ? colorClass : "bg-secondary/60 text-muted-foreground/25"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs leading-tight truncate",
                        !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/60"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 shadow-[0_0_4px_rgba(0,212,170,0.3)]" />
                    )}
                  </div>
                );
              })}
              {items.length > 2 && (
                <div className="px-4 py-2.5 flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-primary">
                    View {items.length - 2} more
                  </span>
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

const NotificationItem = ({ notification: n, index: i, onMarkRead }: { notification: any; index: number; onMarkRead: (id: string) => void }) => {
  const Icon = NOTIFICATION_ICONS[n.type] || Bell;
  const colorClass = NOTIFICATION_COLORS[n.type] || "bg-secondary text-muted-foreground/50";

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.03 }}
      onClick={() => !n.is_read && onMarkRead(n.id)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left active:bg-secondary/50 transition-colors",
        !n.is_read && "bg-primary/[0.03]"
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
        !n.is_read ? colorClass : "bg-secondary/80 text-muted-foreground/30"
      )}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-tight", !n.is_read ? "font-bold text-foreground" : "font-medium text-foreground/70")}>
          {n.title}
        </p>
        <p className={cn("text-xs truncate mt-0.5", !n.is_read ? "text-muted-foreground" : "text-muted-foreground/50")}>
          {n.body}
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </p>
      </div>
      {!n.is_read && (
        <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5 shadow-[0_0_6px_rgba(0,212,170,0.4)]" />
      )}
    </motion.button>
  );
};

/* ─── Shared Components ─── */
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="relative">
      <div className="h-8 w-8 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
    <span className="text-xs text-muted-foreground/40">Loading...</span>
  </div>
);

export default Inbox;
