import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Calendar, BookOpen, Video, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton, Avatar, Chip } from "@/components/v2/shared";
import { useTrainingPlan } from "@/hooks/v2/useMocks";
import { formatPrice } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";

const REVIEWS = [
  { id: "r1", author: "Guy Cohen", quote: "Changed my game in 2 weeks. The drills are gold.", stars: 5 },
  { id: "r2", author: "Yael Avraham", quote: "Best plan I've followed. Clear, focused, no fluff.", stars: 5 },
  { id: "r3", author: "Ron Shem", quote: "Solid for intermediate players. The week 3 footwork drills slap.", stars: 4 },
];

export default function TrainingPlanDetailPage() {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const { data: plan, isLoading } = useTrainingPlan(planId);
  const [openWeek, setOpenWeek] = useState<number | null>(1);

  if (isLoading || !plan) {
    return (
      <PhoneFrame className="min-h-[100dvh]">
        <StatusBar />
        <div className="px-5 pt-12 animate-pulse">
          <div className="h-40 bg-navy-card rounded-2xl mb-4" />
          <div className="h-6 bg-navy-card rounded mb-2" />
        </div>
      </PhoneFrame>
    );
  }

  const weeks = Math.max(...plan.workouts.map((w) => w.weekNumber));

  return (
    <PhoneFrame className="min-h-[100dvh] pb-32">
      <StatusBar />
      <header className="px-5 pt-2.5 flex justify-between items-center">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} />
        </RoundButton>
        <div className="text-[14px] font-bold truncate max-w-[230px]">{plan.title}</div>
        <div className="w-9" />
      </header>

      <div
        className="mx-5 mt-4 mb-3.5 p-5 rounded-[18px] relative overflow-hidden"
        data-grad="orange-soft"
      >
        {plan.isBestSeller && (
          <Chip variant="orange" className="text-[10px] mb-3">★ BEST SELLER</Chip>
        )}
        <h1 className="text-[24px] font-extrabold tracking-tight mb-2.5">{plan.title}</h1>
        <div className="flex gap-2.5 items-center mb-3">
          <Avatar size={32} gradient="teal-gold" verified />
          <div>
            <div className="text-[13px] font-bold">{plan.coachName}</div>
            <div className="text-[11px] text-v2-muted tnum">{plan.rating} ★ · {plan.reviewCount} reviews</div>
          </div>
        </div>
        <div className="text-[28px] font-extrabold tracking-tight tnum mt-2">
          {formatPrice(plan.priceILS)} <span className="text-[12px] text-v2-muted ml-1.5 font-semibold uppercase">{plan.priceLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-5 mb-4">
        {[
          { label: "DAYS", value: plan.durationDays },
          { label: "WORKOUTS", value: plan.totalWorkouts },
          { label: "LEVEL", value: plan.difficulty.slice(0, 3).toUpperCase() },
          { label: "EQUIP", value: "Court" },
        ].map((m) => (
          <div key={m.label} className="text-center bg-navy-card rounded-[14px] py-2.5">
            <div className="text-[16px] font-extrabold tnum">{m.value}</div>
            <div className="text-[9px] text-v2-muted font-semibold tracking-wider mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="px-5 mb-3.5">
        <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-2">ABOUT</div>
        <p className="text-[13px] leading-relaxed">{plan.description}</p>
      </div>

      <div className="px-5 mb-3.5">
        <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-2">WHAT'S INCLUDED</div>
        <div className="bg-navy-card rounded-[14px] p-4 flex flex-col gap-3">
          {[
            { icon: BookOpen, t: `${plan.totalWorkouts} structured workouts` },
            { icon: Calendar, t: "Weekly check-ins" },
            { icon: Video, t: "Video demonstrations" },
            { icon: FileText, t: "Printable PDF" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.t} className="flex gap-2.5 items-center">
                <Icon size={16} className="text-teal" />
                <div className="text-[13px]">{f.t}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 mb-4">
        <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-2">DAY BY DAY</div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: weeks }).map((_, i) => {
            const week = i + 1;
            const open = openWeek === week;
            const items = plan.workouts.filter((w) => w.weekNumber === week);
            return (
              <div key={week} className="bg-navy-card rounded-[14px]">
                <button
                  onClick={() => setOpenWeek(open ? null : week)}
                  className="w-full flex justify-between items-center p-3.5 text-left"
                >
                  <div>
                    <div className="text-[13px] font-bold">Week {week}</div>
                    <div className="text-[11px] text-v2-muted mt-0.5 tnum">{items.length} workouts</div>
                  </div>
                  {open ? <ChevronUp size={16} className="text-v2-muted" /> : <ChevronDown size={16} className="text-v2-muted" />}
                </button>
                {open && (
                  <div className="px-3.5 pb-3.5 flex flex-col gap-1.5">
                    {items.map((w) => (
                      <div key={w.id} className="flex items-center gap-3 p-2.5 rounded-md bg-navy-card-2">
                        <div className="w-9 h-9 rounded-md bg-teal-dim text-teal flex items-center justify-center font-bold text-[12px] tnum">
                          D{w.dayNumber}
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold">{w.title}</div>
                          <div className="text-[11px] text-v2-muted mt-0.5 tnum">{w.durationMin} min · {w.drillCount ?? 0} drills</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">REVIEWS</div>
      <div className="px-5 pb-32 flex flex-col gap-2">
        {REVIEWS.map((r) => (
          <div key={r.id} className="p-3.5 rounded-[14px] bg-navy-card">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[13px] font-bold">{r.author}</div>
              <div className="text-[12px] text-orange">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
            </div>
            <p className="text-[12px] text-v2-muted leading-snug italic">"{r.quote}"</p>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-5 py-3.5 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom">
        <button
          onClick={() => navigate(`/v2/plans/${plan.id}/subscribe`)}
          className="w-full py-3.5 rounded-[14px] bg-orange text-white font-bold text-[14px]"
        >
          Subscribe — {formatPrice(plan.priceILS)} {plan.priceLabel === "monthly" ? "/ mo" : "one-time"}
        </button>
      </div>
    </PhoneFrame>
  );
}
