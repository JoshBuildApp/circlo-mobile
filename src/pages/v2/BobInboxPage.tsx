import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Menu, Bot } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { CoachOnly } from "@/components/v2/bob/CoachOnly";
import { useBobInsights } from "@/hooks/v2/useMocks";
import type { BobInsight, BobNotificationType } from "@/types/v2";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<BobNotificationType, { label: string; color: string; border: string }> = {
  alert: { label: "ALERT", color: "text-danger", border: "border-l-danger" },
  insight: { label: "INSIGHT", color: "text-teal", border: "border-l-teal" },
  draft: { label: "DRAFT", color: "text-v2-muted", border: "border-l-transparent" },
  celebration: { label: "CELEBRATION", color: "text-orange", border: "border-l-transparent" },
  action: { label: "ACTION", color: "text-orange", border: "border-l-transparent" },
};

const FILTERS: { key: "all" | "unread" | "insights" | "drafts" | "alerts"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "insights", label: "Insights" },
  { key: "drafts", label: "Drafts" },
  { key: "alerts", label: "Alerts" },
];

function relTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return d.toLocaleDateString();
}

function groupByDay(items: BobInsight[]) {
  const dayMs = 24 * 60 * 60 * 1000;
  const today: BobInsight[] = [];
  const yesterday: BobInsight[] = [];
  const week: BobInsight[] = [];
  const now = Date.now();
  items.forEach((i) => {
    const age = now - new Date(i.createdAt).getTime();
    if (age < dayMs) today.push(i);
    else if (age < 2 * dayMs) yesterday.push(i);
    else week.push(i);
  });
  return { today, yesterday, week };
}

function InboxItem({ item }: { item: BobInsight }) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[item.type];
  return (
    <button
      onClick={() => navigate("/v2/bob?chat=1")}
      className={cn(
        "w-full mx-5 p-3.5 rounded-[14px] bg-navy-card border-l-[3px] mb-2.5 relative text-left",
        cfg.border
      )}
      style={{ width: "calc(100% - 2.5rem)" }}
    >
      {item.unread && <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-orange" />}
      <div className="flex justify-between mb-1.5 text-[10px] font-bold tracking-widest uppercase">
        <span className={cn("flex items-center gap-1.5", cfg.color)}>
          {cfg.label} · <span className="text-v2-muted normal-case font-semibold tracking-normal">{relTime(item.createdAt)}</span>
        </span>
        {item.status && (
          <span className={item.status === "published" || item.status === "done" ? "text-teal" : "text-v2-muted"}>
            {item.status === "published" ? "Published" : "Done ✓"}
          </span>
        )}
      </div>
      <div className="text-[14px] font-bold leading-snug">{item.title}</div>
      {item.description && <div className="text-[12px] text-v2-muted mt-1 leading-snug">{item.description}</div>}
    </button>
  );
}

export default function BobInboxPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<typeof FILTERS[number]["key"]>("all");
  const { data: items = [] } = useBobInsights();

  const filtered = items.filter((i) => {
    if (filter === "all") return true;
    if (filter === "unread") return i.unread;
    if (filter === "insights") return i.type === "insight";
    if (filter === "drafts") return i.type === "draft";
    if (filter === "alerts") return i.type === "alert";
    return true;
  });
  const groups = groupByDay(filtered);

  return (
    <CoachOnly>
      <PhoneFrame className="min-h-[100dvh] pb-12">
        <StatusBar />
        <header className="px-5 pt-3.5 pb-3.5 flex justify-between items-center">
          <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft size={14} />
          </RoundButton>
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <span className="w-[22px] h-[22px] rounded-md bg-orange flex items-center justify-center">
              <Bot size={12} stroke="white" />
            </span>
            Bob inbox
          </div>
          <RoundButton ariaLabel="Menu" variant="solid-navy" size="sm">
            <Menu size={14} />
          </RoundButton>
        </header>

        <div className="flex gap-2 px-5 pb-3.5 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3.5 py-2 rounded-full font-semibold text-[13px] whitespace-nowrap flex items-center gap-1.5",
                filter === f.key ? "bg-orange text-white" : "bg-navy-card text-offwhite"
              )}
            >
              {f.label}
              {f.key === "all" && <span className="bg-white/25 px-1.5 rounded-full text-[11px] tnum">{items.length}</span>}
            </button>
          ))}
        </div>

        {groups.today.length > 0 && (
          <>
            <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">TODAY</div>
            {groups.today.map((i) => <InboxItem key={i.id} item={i} />)}
          </>
        )}
        {groups.yesterday.length > 0 && (
          <>
            <div className="px-5 pb-2 mt-2.5 text-[10px] text-v2-muted font-bold tracking-widest uppercase">YESTERDAY</div>
            {groups.yesterday.map((i) => <InboxItem key={i.id} item={i} />)}
          </>
        )}
        {groups.week.length > 0 && (
          <>
            <div className="px-5 pb-2 mt-2.5 text-[10px] text-v2-muted font-bold tracking-widest uppercase">THIS WEEK</div>
            {groups.week.map((i) => <InboxItem key={i.id} item={i} />)}
          </>
        )}
        {filtered.length === 0 && (
          <div className="px-8 py-12 text-center text-v2-muted text-[13px]">
            Nothing here. Try a different filter.
          </div>
        )}
      </PhoneFrame>
    </CoachOnly>
  );
}
