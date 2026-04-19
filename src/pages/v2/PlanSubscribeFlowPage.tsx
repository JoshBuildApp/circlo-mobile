import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Check, Calendar, Lock } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { useTrainingPlan, useSubscribeToPlan } from "@/hooks/v2/useMocks";
import { formatPrice } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";

export default function PlanSubscribeFlowPage() {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const { data: plan } = useTrainingPlan(planId);
  const subscribe = useSubscribeToPlan();
  const [start, setStart] = useState<"today" | "monday" | "custom">("monday");
  const [customDate, setCustomDate] = useState(new Date().toISOString().slice(0, 10));

  const startDate = (() => {
    if (start === "today") return new Date();
    if (start === "monday") {
      const d = new Date();
      d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
      return d;
    }
    return new Date(customDate);
  })();

  const submit = async () => {
    if (!plan) return;
    await subscribe.mutateAsync({ planId: plan.id, startDate });
    navigate("/v2/calendar");
  };

  if (!plan) {
    return (
      <PhoneFrame className="min-h-[100dvh]">
        <StatusBar />
        <div className="px-5 pt-12 text-center text-v2-muted">Plan not found.</div>
      </PhoneFrame>
    );
  }

  const previewDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <PhoneFrame className="min-h-[100dvh] pb-32">
      <StatusBar />
      <header className="px-5 pt-2.5 flex items-center justify-between">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} />
        </RoundButton>
        <h3 className="text-[16px] font-bold">Get {plan.title}</h3>
        <div className="w-9" />
      </header>

      <div className="px-5 pt-5 pb-3.5">
        <div className="p-4 rounded-[16px] bg-navy-card flex justify-between items-center">
          <div>
            <div className="text-[15px] font-bold">{plan.title}</div>
            <div className="text-[12px] text-v2-muted mt-0.5 tnum">{plan.durationDays} days · {plan.totalWorkouts} workouts</div>
          </div>
          <div className="text-[20px] font-extrabold tracking-tight tnum">{formatPrice(plan.priceILS)}</div>
        </div>
      </div>

      <div className="px-5 pt-2 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">START DATE</div>
      <div className="px-5 mb-3.5 flex flex-col gap-2">
        {(["today", "monday", "custom"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setStart(opt)}
            className={cn(
              "p-3.5 rounded-[12px] flex justify-between items-center text-left",
              start === opt ? "bg-teal-dim border border-teal" : "bg-navy-card"
            )}
          >
            <div>
              <div className={cn("text-[14px] font-bold capitalize", start === opt && "text-teal")}>
                {opt === "monday" ? "Next Monday" : opt}
              </div>
              {opt === "today" && <div className="text-[11px] text-v2-muted mt-0.5">Begin immediately</div>}
              {opt === "monday" && <div className="text-[11px] text-v2-muted mt-0.5">Recommended</div>}
            </div>
            {start === opt && <Check size={16} className="text-teal" />}
          </button>
        ))}
        {start === "custom" && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal"
          />
        )}
      </div>

      <div className="px-5 pt-2 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">FIRST 7 DAYS</div>
      <div className="px-5 mb-3.5">
        <div className="bg-navy-card rounded-[14px] p-3 grid grid-cols-7 gap-1">
          {previewDays.map((d, i) => {
            const has = i % 2 === 0;
            return (
              <div key={i} className="text-center">
                <div className="text-[9px] text-v2-muted font-bold uppercase tracking-wider">
                  {d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}
                </div>
                <div className={cn("text-[12px] font-bold mt-1 tnum", has && "text-teal")}>{d.getDate()}</div>
                {has && <div className="w-1 h-1 mx-auto mt-1 rounded-full bg-teal" />}
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-v2-muted mt-2 text-center">We'll add these to your calendar</div>
      </div>

      <div className="px-5 pt-2 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">PAYMENT METHOD</div>
      <div className="px-5 mb-3.5">
        <div className="p-4 rounded-[16px] bg-navy-card border-2 border-teal flex items-center gap-3.5">
          <div className="w-11 h-8 rounded-md bg-gradient-to-br from-[#1a1f71] to-[#0f1447] flex items-center justify-center text-white text-[11px] font-extrabold italic">VISA</div>
          <div className="flex-1">
            <div className="text-[14px] font-bold">Visa ···· 4242</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Default</div>
          </div>
          <Check size={16} className="text-teal" />
        </div>
      </div>

      <div className="px-5 mb-12">
        <div className="px-3.5 py-3 rounded-[12px] bg-navy-card-2 flex gap-2.5 items-start">
          <Lock size={16} className="text-teal shrink-0 mt-0.5" />
          <div className="text-[12px] text-v2-muted leading-relaxed">
            Cancel anytime. Plan items remain on your calendar.
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-5 py-3.5 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom">
        <button
          onClick={submit}
          disabled={subscribe.isPending}
          className="w-full py-3.5 rounded-[14px] bg-teal text-navy-deep font-bold text-[14px] flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <Calendar size={16} strokeWidth={2.5} />
          {subscribe.isPending ? "Subscribing…" : "Subscribe + add to calendar"}
        </button>
      </div>
    </PhoneFrame>
  );
}
