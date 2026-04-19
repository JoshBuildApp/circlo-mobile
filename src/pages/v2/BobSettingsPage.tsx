import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Bot, Sparkles, Zap, AlertTriangle, Edit3, Star } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { CoachOnly } from "@/components/v2/bob/CoachOnly";
import { isBobEnabled } from "@/lib/v2/featureFlag";
import { cn } from "@/lib/utils";

type Frequency = "minimal" | "balanced" | "frequent";

const NOTIF_TYPES = [
  { key: "insights", icon: Sparkles, title: "Insights", desc: "Revenue, engagement, trends", iconClass: "text-teal", default: true },
  { key: "ops", icon: Zap, title: "Opportunities", desc: "Suggested actions to grow", iconClass: "text-orange", default: true },
  { key: "alerts", icon: AlertTriangle, title: "Alerts", desc: "Churn risk, failed payments · always on", iconClass: "text-danger", default: true, locked: true },
  { key: "drafts", icon: Edit3, title: "Drafts ready", desc: "Posts, replies, emails Bob wrote", iconClass: "text-teal", default: true },
  { key: "celebrate", icon: Star, title: "Celebrations", desc: "Milestones, personal bests", iconClass: "text-orange", default: false },
];

export default function BobSettingsPage() {
  const navigate = useNavigate();
  const [freq, setFreq] = useState<Frequency>("balanced");
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_TYPES.map((n) => [n.key, n.default]))
  );
  const [dnd, setDnd] = useState(true);
  if (!isBobEnabled()) return <Navigate to="/v2/home" replace />;

  return (
    <CoachOnly>
      <PhoneFrame className="min-h-[100dvh] pb-12">
        <StatusBar />
        <header className="px-5 pt-3.5 pb-4 flex items-center gap-3.5">
          <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft size={14} />
          </RoundButton>
          <h3 className="text-[17px] font-bold">Bob settings</h3>
        </header>

        <div className="px-5 pb-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-[14px] bg-orange flex items-center justify-center relative">
            <Bot size={26} stroke="white" />
            <span className="absolute bottom-[-2px] right-[-2px] w-3.5 h-3.5 bg-teal border-2 border-navy-deep rounded-full" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold">Bob</h3>
            <p className="text-[12px] text-teal mt-0.5">● Active · learning your voice</p>
          </div>
        </div>

        <section className="px-5 pb-5">
          <div className="text-[10px] text-v2-muted font-bold tracking-widest uppercase mb-2.5">HOW OFTEN BOB REACHES OUT</div>
          <div className="flex bg-navy-card rounded-[12px] p-1 mb-2.5">
            {(["minimal", "balanced", "frequent"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFreq(f)}
                className={cn(
                  "flex-1 py-2.5 rounded-[8px] capitalize text-[13px] font-bold transition-colors",
                  freq === f ? "bg-orange text-white" : "text-v2-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-v2-muted leading-snug">
            {freq === "minimal" && "About 1 insight a week. Only urgent alerts surface."}
            {freq === "balanced" && "About 3–5 insights a week. You'll still hear about anything urgent."}
            {freq === "frequent" && "Daily insights. Bob proposes posts and campaigns proactively."}
          </div>
        </section>

        <section className="px-5 pb-5">
          <div className="text-[10px] text-v2-muted font-bold tracking-widest uppercase mb-2.5">NOTIFICATION TYPES</div>
          {NOTIF_TYPES.map((n, i) => {
            const Icon = n.icon;
            const on = toggles[n.key];
            return (
              <div
                key={n.key}
                className={cn(
                  "flex gap-3 py-3.5 items-center",
                  i < NOTIF_TYPES.length - 1 && "border-b border-navy-line"
                )}
              >
                <div className="w-9 h-9 rounded-[10px] bg-navy-card flex items-center justify-center">
                  <Icon size={16} className={n.iconClass} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-bold">{n.title}</h4>
                  <p className="text-[12px] text-v2-muted mt-0.5">{n.desc}</p>
                </div>
                <button
                  aria-label={`Toggle ${n.title}`}
                  onClick={() => !n.locked && setToggles((t) => ({ ...t, [n.key]: !on }))}
                  className={cn(
                    "w-11 h-[26px] rounded-full relative transition-colors",
                    on ? "bg-teal" : "bg-navy-line",
                    n.locked && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all",
                      on ? "right-[3px]" : "left-[3px]"
                    )}
                  />
                </button>
              </div>
            );
          })}
        </section>

        <section className="px-5 pb-12">
          <div className="text-[10px] text-v2-muted font-bold tracking-widest uppercase mb-2.5">QUIET HOURS</div>
          <div className="flex gap-3 py-3 items-center">
            <div className="flex-1">
              <h4 className="text-[14px] font-bold">Do not disturb</h4>
              <p className="text-[12px] text-v2-muted mt-0.5">22:00 → 08:00</p>
            </div>
            <button
              aria-label="Toggle DND"
              onClick={() => setDnd(!dnd)}
              className={cn("w-11 h-[26px] rounded-full relative transition-colors", dnd ? "bg-teal" : "bg-navy-line")}
            >
              <span className={cn("absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all", dnd ? "right-[3px]" : "left-[3px]")} />
            </button>
          </div>
        </section>
      </PhoneFrame>
    </CoachOnly>
  );
}
