import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  Search,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PhoneFrame, StatusBar, TabBar } from "@/components/v2/shared";
import { RoundButton } from "@/components/v2/shared";
import { useCoaches, useMySessions } from "@/hooks/v2/useMocks";
import { useQuickBookSuggestion } from "@/hooks/v2/useQuickBookSuggestion";
import { usePendingBooking } from "@/hooks/v2/usePendingBooking";
import type { Coach, Session } from "@/types/v2";
import { formatPrice } from "@/lib/v2/currency";

/**
 * Player-facing Book landing page. Reached via the raised center Book tab
 * from any player-mode screen. Serves as the booking hub with:
 *   1. Hero + two quick-action tiles (Quick book, Browse coaches)
 *   2. Pending-booking banner (if any Supabase session is pending)
 *   3. "Book again" horizontal rail of recently booked coaches
 *   4. Upcoming sessions list
 *
 * Tapping any coach or quick-book entry hands off to the existing 5-step
 * flow at /v2/book/:coachId (BookingFlowPage). This screen deliberately
 * doesn't replicate the flow — it's the entry point that was missing
 * between the tab bar and coach-specific bookings.
 */
export default function BookLandingPage() {
  const navigate = useNavigate();
  const { data: coaches = [] } = useCoaches();
  const { data: pending } = usePendingBooking();
  const { data: upcoming = [] } = useMySessions("upcoming");
  const { data: quick } = useQuickBookSuggestion();

  const confirmedUpcoming = useMemo(
    () => upcoming.filter((s) => s.status === "confirmed").slice(0, 3),
    [upcoming],
  );

  const handleQuickBook = () => {
    if (quick?.coachId) {
      navigate(`/v2/book/${quick.coachId}?prefill=quick`);
    }
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header className="px-5 pt-5 pb-4 flex items-center gap-3">
        <div className="w-10" />
        <h1 className="flex-1 text-center text-[16px] font-bold">
          Book a session
        </h1>
        <RoundButton
          ariaLabel="Search coaches"
          size="sm"
          variant="solid-navy"
          onClick={() => navigate("/v2/discover")}
        >
          <Search size={14} />
        </RoundButton>
      </header>

      <section className="px-5 pt-7 pb-5 text-center">
        <p
          className="text-[11px] font-bold uppercase"
          style={{ color: "var(--orange, #FF6B2C)", letterSpacing: "1.5px" }}
        >
          Ready when you are
        </p>
        <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-offwhite">
          Train with the right coach
        </h2>
        <p
          className="mt-2 text-[13px] leading-[1.5]"
          style={{ color: "var(--muted, #8A8A9B)" }}
        >
          Pick a coach you trust, choose your format, and lock in your next
          session in under a minute.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 px-5 pb-5">
        <QuickAction
          tone="orange"
          Icon={Zap}
          title="Quick book"
          desc={
            quick
              ? `${quick.coachName} · earliest slot ${quick.whenLabel}`
              : "Grab the next open slot"
          }
          onClick={handleQuickBook}
          disabled={!quick}
        />
        <QuickAction
          tone="teal"
          Icon={Search}
          title="Browse coaches"
          desc="Filter by sport & area"
          onClick={() => navigate("/v2/discover")}
        />
      </section>

      {pending ? (
        <UpcomingCard
          accent="orange"
          session={pending}
          status="Pending"
          statusColor="var(--orange, #FF6B2C)"
          onClick={() =>
            navigate(`/v2/book/${pending.coachId}?bookingId=${pending.id}`)
          }
        />
      ) : null}

      <SectionHeader
        title="Book again"
        actionLabel="See all"
        onAction={() => navigate("/v2/discover")}
      />
      <div className="flex gap-2.5 px-5 pb-2.5 overflow-x-auto no-scrollbar">
        {coaches.slice(0, 8).map((c) => (
          <CoachChip
            key={c.id}
            coach={c}
            onClick={() => navigate(`/v2/book/${c.id}`)}
          />
        ))}
      </div>

      <SectionHeader
        title="Upcoming sessions"
        actionLabel="See all"
        onAction={() => navigate("/v2/profile/bookings")}
      />
      {confirmedUpcoming.length === 0 ? (
        <EmptyUpcoming onBrowse={() => navigate("/v2/discover")} />
      ) : (
        confirmedUpcoming.map((s) => (
          <UpcomingCard
            key={s.id}
            accent="teal"
            session={s}
            status="✓ Confirmed"
            statusColor="var(--teal, #00D4AA)"
            onClick={() => navigate("/v2/profile/bookings")}
          />
        ))
      )}

      <TabBar mode="player" active="book" />
    </PhoneFrame>
  );
}

/* ------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* ------------------------------------------------------------------------- */

interface QuickActionProps {
  tone: "orange" | "teal";
  Icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}

function QuickAction({ tone, Icon, title, desc, onClick, disabled }: QuickActionProps) {
  const toneColor = tone === "orange" ? "var(--orange, #FF6B2C)" : "var(--teal, #00D4AA)";
  const toneBg = tone === "orange" ? "var(--orange-soft, rgba(255,107,44,0.15))" : "var(--teal-soft, rgba(0,212,170,0.15))";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-left rounded-2xl p-3.5 flex flex-col gap-2 transition-transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: "var(--navy-card, #1A1A2E)",
        border: "0.5px solid var(--navy-line, rgba(255,255,255,0.08))",
        color: "var(--offwhite, #F5F5F7)",
      }}
    >
      <span
        className="w-9 h-9 rounded-[10px] flex items-center justify-center"
        style={{ background: toneBg, color: toneColor }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="text-[13px] font-extrabold">{title}</span>
      <span
        className="text-[11px] leading-[1.4]"
        style={{ color: "var(--muted, #8A8A9B)" }}
      >
        {desc}
      </span>
    </button>
  );
}

function CoachChip({ coach, onClick }: { coach: Coach; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl p-3 min-w-[160px] text-left cursor-pointer"
      style={{
        background: "var(--navy-card, #1A1A2E)",
        border: "0.5px solid var(--navy-line, rgba(255,255,255,0.08))",
        color: "var(--offwhite, #F5F5F7)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-extrabold text-navy-deep"
          style={{ background: gradientFor(coach.avatarGradient) }}
          aria-hidden="true"
        >
          {coach.firstName?.charAt(0) ?? coach.name.charAt(0)}
        </div>
        <div>
          <div className="text-[13px] font-bold">{coach.firstName ?? coach.name.split(" ")[0]}</div>
          <div
            className="text-[10px] mt-0.5"
            style={{ color: "var(--muted, #8A8A9B)" }}
          >
            {coach.sports[0]?.replace(/_/g, " ")} · {shortCity(coach.city)}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2.5 text-[11px]">
        <span className="font-bold" aria-label={`Rating ${coach.rating}`}>
          <span style={{ color: "#FFB800" }}>★</span> {coach.rating.toFixed(1)}
        </span>
        <span className="font-bold" style={{ color: "var(--teal, #00D4AA)" }}>
          {formatPrice(coach.priceFromILS)}
        </span>
      </div>
    </button>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex justify-between items-center px-5 pt-4 pb-3">
      <h3 className="text-[14px] font-extrabold">{title}</h3>
      <button
        type="button"
        onClick={onAction}
        className="text-[12px] font-bold cursor-pointer bg-transparent border-0"
        style={{ color: "var(--teal, #00D4AA)" }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

interface UpcomingCardProps {
  accent: "teal" | "orange";
  session: Session;
  status: string;
  statusColor: string;
  onClick: () => void;
}

function UpcomingCard({ accent, session, status, statusColor, onClick }: UpcomingCardProps) {
  const accentColor = accent === "teal" ? "var(--teal, #00D4AA)" : "var(--orange, #FF6B2C)";
  const { dayLabel, dayNum, timeLabel } = formatSessionDate(session.startsAt);
  const formatLabel = `${formatFormat(session.format)} · ${session.durationMin} min`;
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative mx-5 mb-2.5 p-3.5 rounded-2xl flex items-center gap-3 text-left overflow-hidden w-[calc(100%-40px)]"
      style={{
        background: "var(--navy-card, #1A1A2E)",
        border: "0.5px solid var(--navy-line, rgba(255,255,255,0.08))",
        color: "var(--offwhite, #F5F5F7)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0"
        style={{ width: 3, background: accentColor }}
      />
      <div className="w-[52px] text-center shrink-0">
        <div
          className="text-[10px] font-bold uppercase tracking-wide"
          style={{ color: accentColor }}
        >
          {dayLabel}
        </div>
        <div className="text-[22px] font-extrabold mt-0.5">{dayNum}</div>
      </div>
      <div
        className="flex-1 min-w-0 border-l pl-3"
        style={{ borderColor: "var(--navy-line, rgba(255,255,255,0.08))" }}
      >
        <div className="text-[14px] font-bold">
          {session.coachName} · {timeLabel}
        </div>
        <div
          className="text-[11px] mt-1 flex gap-1.5 flex-wrap items-center"
          style={{ color: "var(--muted, #8A8A9B)" }}
        >
          <span>{formatLabel}</span>
          <span className="font-bold" style={{ color: statusColor }}>
            {status}
          </span>
        </div>
      </div>
      <ChevronRight
        size={18}
        aria-hidden="true"
        style={{ color: "var(--muted, #8A8A9B)" }}
      />
    </button>
  );
}

function EmptyUpcoming({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div
      className="mx-5 mb-4 p-5 rounded-2xl text-center"
      style={{
        border: "0.5px dashed var(--navy-line-strong, rgba(255,255,255,0.14))",
        color: "var(--muted, #8A8A9B)",
      }}
    >
      <Calendar
        size={24}
        className="mx-auto mb-2"
        aria-hidden="true"
        style={{ color: "var(--muted, #8A8A9B)" }}
      />
      <p className="text-[13px]">No sessions booked yet.</p>
      <button
        type="button"
        onClick={onBrowse}
        className="mt-3 px-4 py-2 rounded-full text-[12px] font-bold cursor-pointer border-0 text-white"
        style={{ background: "var(--orange, #FF6B2C)" }}
      >
        Find a coach
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Formatting helpers                                                        */
/* ------------------------------------------------------------------------- */

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" });
  const dayNum = d.getDate();
  const timeLabel = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { dayLabel, dayNum, timeLabel };
}

function formatFormat(format: Session["format"]) {
  if (format === "one-on-one") return "1-on-1";
  if (format === "group") return "Group";
  return "Video review";
}

function shortCity(city: string): string {
  // Shorten "Tel Aviv" → "TLV" etc. in the chip so the card doesn't overflow.
  const cleaned = city.replace(/[^A-Za-z ]/g, "").trim();
  if (!cleaned) return city;
  if (cleaned.length <= 8) return cleaned;
  return cleaned
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .slice(0, 3)
    .join("");
}

function gradientFor(g: Coach["avatarGradient"]): string {
  switch (g) {
    case "teal-gold":
      return "linear-gradient(135deg, #00D4AA 0%, #FFD700 100%)";
    case "orange-peach":
      return "linear-gradient(135deg, #FF6B2C 0%, #FF8A4C 100%)";
    case "gold-teal":
      return "linear-gradient(135deg, #FFD700 0%, #00D4AA 100%)";
    case "teal-mint":
    default:
      return "linear-gradient(135deg, #00D4AA 0%, #00B894 100%)";
  }
}
