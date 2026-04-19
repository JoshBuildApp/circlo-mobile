import { useNavigate } from "react-router-dom";
import { Inbox, Settings as SettingsIcon, Plus, MessageSquare, Upload, CalendarMinus, Eye, Repeat, ChevronRight } from "lucide-react";
import {
  PhoneFrame,
  StatusBar,
  TabBar,
  RoundButton,
  Avatar,
  Chip,
  PulseDot,
  KpiStrip,
  HScroll,
  SectionHeader,
} from "@/components/v2/shared";
import { RequestCard } from "@/components/v2/coach/RequestCard";
import { useMyCoachProfile, useBookingRequests, useBookingRequestAction } from "@/hooks/v2/useMocks";
import { useRole } from "@/contexts/v2/RoleContext";
import { formatPrice, formatCompactNumber } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { key: "session", label: "New session", icon: Plus, tone: "teal" as const },
  { key: "reply", label: "Reply to students", icon: MessageSquare, tone: "orange" as const },
  { key: "upload", label: "Upload content", icon: Upload, tone: "default" as const },
  { key: "block", label: "Block time", icon: CalendarMinus, tone: "default" as const },
];

export default function CoachSelfPage() {
  const navigate = useNavigate();
  const { switchRole } = useRole();
  const { data: coach } = useMyCoachProfile();
  const { data: requests = [] } = useBookingRequests("new");
  const action = useBookingRequestAction();

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header className="px-5 pt-3 flex justify-between items-center gap-2">
        <button
          onClick={() => {
            switchRole("player");
            navigate("/v2/home");
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange text-white text-[12px] font-bold shrink-0"
          style={{ boxShadow: "0 4px 12px rgba(255,107,44,0.25)" }}
        >
          <Repeat size={12} strokeWidth={2.5} /> Player
        </button>
        <button
          onClick={() => navigate(`/v2/coach/${coach?.id ?? "maya"}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-card text-offwhite text-[12px] font-semibold border border-navy-line"
        >
          <Eye size={12} /> Preview public
        </button>
        <div className="flex gap-2 items-center">
          <RoundButton ariaLabel="Requests" variant="solid-navy" size="sm" onClick={() => navigate("/v2/coach-me/requests")} className="relative">
            <Inbox size={16} />
            {requests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-orange text-white text-[10px] font-bold px-1.5 rounded-full min-w-[16px] text-center tnum">
                {requests.length}
              </span>
            )}
          </RoundButton>
          <RoundButton ariaLabel="Settings" variant="solid-navy" size="sm" onClick={() => navigate("/v2/profile/settings")}>
            <SettingsIcon size={16} />
          </RoundButton>
        </div>
      </header>

      <div className="px-5 pt-5 pb-4 flex gap-3.5 items-center">
        <Avatar size={64} gradient={coach?.avatarGradient ?? "teal-gold"} verified />
        <div className="flex-1">
          <div className="text-[18px] font-extrabold tracking-tight">{coach?.name ?? "Coach"}</div>
          <div className="text-[12px] text-v2-muted mt-0.5">{coach?.tagline}</div>
          <div className="flex gap-1.5 mt-2 items-center">
            <Chip variant="orange" className="text-[10px]">COACH</Chip>
            <span className="text-[12px] text-offwhite font-semibold tnum">{coach?.rating ?? 0} ★</span>
            <span className="text-[11px] text-v2-muted tnum">{coach?.reviewCount ?? 0} reviews</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-3.5">
        <button className="w-full px-3.5 py-3 rounded-[14px] flex items-center gap-3 cursor-pointer border border-teal-dim text-left" data-grad="teal-soft">
          <PulseDot />
          <div className="flex-1">
            <div className="text-[11px] text-teal font-bold tracking-wider">AVAILABLE FOR BOOKINGS</div>
            <div className="text-[13px] text-offwhite font-semibold mt-0.5">5 slots open this week</div>
          </div>
          <div className="text-[12px] text-teal font-bold">Manage →</div>
        </button>
      </div>

      <div className="px-5 pb-3.5">
        <div
          className="rounded-[20px] p-5 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #FF8A5B 0%, #FF6B2C 60%, #E04E15 100%)" }}
        >
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{ top: "-50%", right: "-20%", width: 200, height: 200, background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }}
          />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <div className="text-[10px] font-extrabold tracking-widest opacity-85">THIS MONTH</div>
              <div className="tnum text-[36px] font-extrabold tracking-tight mt-1 leading-none">
                {formatPrice(coach?.monthlyRevenueILS ?? 0)}
              </div>
              <div className="text-[12px] mt-1.5 opacity-90 tnum">
                +{coach?.revenueDeltaPct ?? 0}% vs last month
              </div>
            </div>
            <div className="flex items-end gap-1 h-14">
              {[30, 50, 45, 65, 80, 100].map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-sm bg-white"
                  style={{ height: `${h}%`, opacity: 0.35 + (i / 5) * 0.65 }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate("/v2/bob?chat=1")}
            className="relative z-10 w-full py-2.5 rounded-[10px] bg-white/15 text-white font-bold text-[12px] backdrop-blur-md"
          >
            Ask Bob for a breakdown →
          </button>
        </div>
      </div>

      <div className="px-5 pb-4">
        <KpiStrip
          items={[
            { label: "Students", value: coach?.activeStudents ?? 0 },
            { label: "30d", value: 68 },
            { label: "Reply", value: `${coach?.avgResponseMin ?? 12}m` },
            { label: "Rating", value: coach?.rating ?? 0, accent: "teal" },
          ]}
        />
      </div>

      <SectionHeader title="Quick actions" />
      <HScroll className="pb-2">
        {QUICK_ACTIONS.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.key}
              onClick={() => q.key === "reply" ? navigate("/v2/messages") : q.key === "upload" ? navigate("/v2/coach-me/content") : null}
              className={cn(
                "min-w-[88px] h-[88px] rounded-[16px] p-3 flex flex-col justify-between cursor-pointer text-left",
                q.tone === "teal" && "bg-teal text-navy-deep",
                q.tone === "orange" && "bg-orange text-white",
                q.tone === "default" && "bg-navy-card text-offwhite"
              )}
            >
              <Icon size={22} className={q.tone === "default" ? "text-teal" : ""} strokeWidth={2.5} />
              <div className="text-[12px] font-bold leading-tight">{q.label}</div>
            </button>
          );
        })}
      </HScroll>

      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            Booking requests
            {requests.length > 0 && <span className="bg-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{requests.length} new</span>}
          </span>
        }
        action="See all"
        onAction={() => navigate("/v2/coach-me/requests")}
      />
      <div className="px-5 flex flex-col gap-2.5">
        {requests.slice(0, 2).map((r) => (
          <RequestCard
            key={r.id}
            req={r}
            onAccept={() => action.mutate({ id: r.id, action: "accept" })}
            onDecline={() => action.mutate({ id: r.id, action: "decline" })}
          />
        ))}
        {requests.length === 0 && (
          <div className="text-center py-8 text-v2-muted text-[13px]">No pending requests · you're all caught up.</div>
        )}
      </div>

      <SectionHeader title="Upcoming this week" action="All" onAction={() => navigate("/v2/calendar")} />
      <div className="px-5 flex flex-col gap-2 mb-5">
        {[
          { day: "TUE", num: 10, title: "Daniel K. · Group clinic", sub: "17:00 → 18:30 · 4 of 4 confirmed" },
          { day: "FRI", num: 12, title: "Ron Shem · 1-on-1", sub: "16:00 → 17:00 · Paid" },
        ].map((s) => (
          <div key={s.title} className="p-3.5 rounded-[14px] bg-navy-card flex gap-3 items-center">
            <div className="w-12 text-center">
              <div className="text-[10px] text-teal font-bold tracking-wider">{s.day}</div>
              <div className="text-[22px] font-extrabold tracking-tight tnum">{s.num}</div>
            </div>
            <div className="w-px h-9 bg-navy-line" />
            <div className="flex-1">
              <div className="text-[13px] font-bold">{s.title}</div>
              <div className="text-[11px] text-v2-muted mt-0.5 tnum">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionHeader title="Top students" action="See all" />
      <div className="px-5 mb-4">
        <div className="p-3.5 rounded-[16px] bg-navy-card flex justify-around gap-2.5">
          {[
            { name: "Guy", grad: "teal-mint", streak: 12 },
            { name: "Yael", grad: "orange-peach", streak: 8 },
            { name: "Ron", grad: "teal-mint", streak: 6 },
            { name: "Amir", grad: "gold-teal", streak: 5 },
            { name: "Dan", grad: "orange-peach", streak: 4 },
          ].map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-1">
              <Avatar size={40} gradient={s.grad as "teal-mint" | "orange-peach" | "gold-teal"} />
              <div className="text-[11px] font-bold">{s.name}</div>
              <div className="text-[10px] text-orange font-bold tnum">🔥 {s.streak}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionHeader title="Next payout" />
      <div className="px-5 mb-4">
        <div className="p-4 rounded-[16px] bg-navy-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-teal-dim text-teal flex items-center justify-center shrink-0">
            <span className="text-xl">₪</span>
          </div>
          <div className="flex-1">
            <div className="text-[22px] font-extrabold tracking-tight tnum">{formatPrice(coach?.payoutILS ?? 0)}</div>
            <div className="text-[11px] text-v2-muted mt-0.5">
              On {coach ? new Date(coach.payoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} · Bank ···· 2841
            </div>
          </div>
          <button className="px-3.5 py-2 rounded-full bg-navy-card-2 text-offwhite font-semibold text-[12px]">Details</button>
        </div>
      </div>

      <SectionHeader title="Content performance" action="Library" onAction={() => navigate("/v2/coach-me/content")} />
      <div className="px-5 mb-4">
        <div className="p-4 rounded-[16px] bg-navy-card">
          <div className="flex justify-between mb-3">
            <div>
              <div className="text-[10px] text-v2-muted font-bold tracking-wider">VIEWS THIS WEEK</div>
              <div className="text-[22px] font-extrabold tracking-tight mt-0.5 tnum">{formatCompactNumber(coach?.contentViews ?? 0)}</div>
            </div>
            <div>
              <div className="text-[10px] text-v2-muted font-bold tracking-wider text-right">TOP PROGRAM</div>
              <div className="text-[13px] font-bold mt-0.5">30-Day Rebuild</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/v2/coach-me/content")}
            className="w-full py-3 rounded-[12px] bg-transparent border border-dashed border-navy-line text-v2-muted text-[13px] font-semibold flex items-center justify-center gap-1.5"
          >
            <Upload size={14} strokeWidth={2.5} />
            Upload new content
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 pb-2 text-center text-[11px] text-v2-muted-2">
        Coach mode · v0.8.2
      </div>

      <TabBar mode="coach" active="dashboard" />
    </PhoneFrame>
  );
}
