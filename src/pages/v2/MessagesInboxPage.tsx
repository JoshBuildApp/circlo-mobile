import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Edit3, Search, Check, CheckCheck } from "lucide-react";
import { PhoneFrame, StatusBar, TabBar, Avatar, Chip, EmptyState } from "@/components/v2/shared";
import { useMessageThreads } from "@/hooks/v2/useMocks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useHaptics } from "@/native/useNative";
import type { MessageThread } from "@/types/v2";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "coaches", label: "Coaches" },
  { key: "circles", label: "Circles" },
  { key: "requests", label: "Requests" },
] as const;
type Filter = typeof FILTERS[number]["key"];

function dayLabel(d: Date) {
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "Last Week";
  return "Older";
}
function timeLabel(d: Date) {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Now";
  if (diff < 60 * 60_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 24 * 60 * 60_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 7 * 24 * 60 * 60_000) return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return d.toLocaleDateString();
}

function ThreadRow({ thread, onClick }: { thread: MessageThread; onClick: () => void }) {
  const unread = (thread.unreadCount ?? 0) > 0 || thread.typing;
  const initials = thread.peerName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  const grad =
    thread.peerGradient === "orange-peach"
      ? "orange-peach"
      : thread.peerGradient === "teal-mint"
      ? "teal-mint"
      : "teal-gold";
  const { tap } = useHaptics();
  return (
    <button
      onClick={() => { tap("light"); onClick(); }}
      className="flex gap-3 px-3.5 py-3 cursor-pointer border-b border-navy-line w-full text-left hover:bg-navy-card/40 transition-colors min-h-[64px]"
    >
      <div className="relative shrink-0">
        <Avatar size={44} gradient={grad} initials={thread.isChannel ? initials : undefined} online={thread.peerIsOnline} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <div className="text-[14px] font-bold text-offwhite truncate">
            {thread.peerName}
            {thread.peerIsCoach && <Chip variant="teal" className="ml-1 text-[9px] !px-1.5 !py-0.5">COACH</Chip>}
          </div>
          <div className={cn("text-[11px] tnum shrink-0 ml-2", unread ? "text-teal font-bold" : "text-v2-muted")}>
            {timeLabel(new Date(thread.lastMessageAt))}
          </div>
        </div>
        <div className={cn("text-[13px] truncate flex gap-1 items-center", unread ? "text-offwhite font-medium" : "text-v2-muted")}>
          {thread.typing ? (
            <span className="text-teal font-semibold">typing…</span>
          ) : (
            <>
              {thread.peerIsOnline && !thread.typing && <CheckCheck size={11} className="text-teal" />}
              {thread.lastMessagePreview}
            </>
          )}
        </div>
      </div>
      {(thread.unreadCount ?? 0) > 0 && (
        <div className="self-center bg-teal text-navy-deep text-[10px] font-bold px-1.5 rounded-full min-w-[16px] text-center tnum">
          {thread.unreadCount}
        </div>
      )}
    </button>
  );
}

export default function MessagesInboxPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const { data: threads = [] } = useMessageThreads();
  const { tap } = useHaptics();

  // Realtime: any new message anywhere invalidates the thread list so the
  // inbox re-ranks without the user having to pull-to-refresh. Partitioned
  // table + userlevel RLS keep the payload tiny and scoped.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`v2-inbox:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["v2", "threads"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const filtered = threads.filter((t) => {
    if (filter === "all") return true;
    if (filter === "unread") return (t.unreadCount ?? 0) > 0 || t.typing;
    if (filter === "coaches") return t.peerIsCoach && !t.isChannel;
    if (filter === "circles") return t.isChannel;
    return false;
  });

  const grouped: Record<string, MessageThread[]> = {};
  const pinned: MessageThread[] = [];
  filtered.forEach((t) => {
    if (t.pinned) {
      pinned.push(t);
    } else {
      const label = dayLabel(new Date(t.lastMessageAt));
      grouped[label] = grouped[label] ?? [];
      grouped[label].push(t);
    }
  });

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header className="px-5 pt-3 flex justify-between items-center">
        <h1 className="text-[26px] font-extrabold tracking-tight">Messages</h1>
        <button
          onClick={() => { tap("light"); navigate("/v2/messages/new"); }}
          aria-label="New message"
          className="min-w-[44px] min-h-[44px] rounded-full bg-navy-card flex items-center justify-center"
        >
          <Edit3 size={16} />
        </button>
      </header>

      <div className="px-5 pt-3.5 pb-3">
        <div className="px-3.5 py-2.5 rounded-[12px] bg-navy-card flex items-center gap-2.5">
          <Search size={16} className="text-v2-muted" />
          <input placeholder="Search messages..." className="flex-1 bg-transparent border-none text-offwhite text-sm outline-none placeholder:text-v2-muted" />
        </div>
      </div>

      <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { tap("light"); setFilter(f.key); }}
            className={cn(
              "px-3.5 min-h-[44px] flex items-center rounded-full font-semibold text-[13px] whitespace-nowrap",
              filter === f.key ? "bg-teal text-navy-deep" : "bg-navy-card text-offwhite"
            )}
          >
            {f.label}
            {f.key === "all" && <span className="bg-navy-deep text-teal text-[10px] px-1.5 py-0.5 rounded-full ml-1.5 tnum">{threads.length}</span>}
          </button>
        ))}
      </div>

      {pinned.length > 0 && (
        <>
          <div className="px-5 pb-1.5 text-[10px] text-v2-muted font-bold tracking-widest uppercase">PINNED</div>
          <div className="px-1.5">{pinned.map((t) => (<ThreadRow key={t.id} thread={t} onClick={() => navigate(`/v2/messages/${t.id}`)} />))}</div>
        </>
      )}
      {(["Today", "Yesterday", "Last Week", "Older"] as const).map((day) =>
        grouped[day] ? (
          <div key={day}>
            <div className="px-5 pt-3 pb-1.5 text-[10px] text-v2-muted font-bold tracking-widest uppercase">{day.toUpperCase()}</div>
            <div className="px-1.5">{grouped[day].map((t) => (<ThreadRow key={t.id} thread={t} onClick={() => navigate(`/v2/messages/${t.id}`)} />))}</div>
          </div>
        ) : null
      )}
      {filtered.length === 0 && (
        <EmptyState
          icon={Edit3}
          title={threads.length === 0 ? "No messages yet" : "Nothing matches this filter"}
          description={threads.length === 0 ? "Message a coach to start a conversation." : "Try All to see everything."}
          ctaLabel={threads.length === 0 ? "Start a chat" : undefined}
          onCta={threads.length === 0 ? () => navigate("/v2/messages/new") : undefined}
        />
      )}

      <TabBar mode="player" active="messages" />
    </PhoneFrame>
  );
}
