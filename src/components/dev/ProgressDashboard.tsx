import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, Clock, Zap } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const PHASES = [
  {
    number: 1,
    name: "Foundation & Design System",
    status: "done" as const,
    items: [
      "Brand tokens & typography scale",
      "Dark theme base setup",
      "Component library scaffolding",
      "CircloLogo + icon system",
      "Navigation shell",
      "Route architecture",
      "Auth flow skeleton",
      "Supabase project init",
      "Mobile-first layout grid",
      "Storybook / dev tooling",
    ],
    total: 10,
    done: 10,
  },
  {
    number: 2,
    name: "Core Flows",
    status: "done" as const,
    items: [
      "Sign up / sign in",
      "Onboarding wizard",
      "Profile setup",
      "Role selection (athlete/coach)",
      "Home feed skeleton",
      "Search & discovery",
      "Basic booking flow",
      "Push notification opt-in",
      "Deep linking setup",
      "Session persistence",
    ],
    total: 10,
    done: 10,
  },
  {
    number: 3,
    name: "Coach Experience",
    status: "done" as const,
    items: [
      "Coach profile page",
      "Availability calendar",
      "Session type management",
      "Coach dashboard",
      "Client roster view",
      "Booking confirmation flow",
      "Session notes",
      "Coach onboarding",
      "Earnings overview",
      "Coach settings",
    ],
    total: 10,
    done: 10,
  },
  {
    number: 4,
    name: "User Experience",
    status: "done" as const,
    items: [
      "Athlete profile",
      "Booking history",
      "Session reminders",
      "Chat with coach",
      "Rating & review",
      "Saved coaches",
      "Goal tracking",
      "Progress photos",
      "Notification center",
      "Help & support flow",
    ],
    total: 10,
    done: 10,
  },
  {
    number: 5,
    name: "Content Platform",
    status: "done" as const,
    items: [
      "Coach AMA feature",
      "Community feed",
      "Video upload support",
      "Content discovery",
      "Shorts / reels format",
      "Content moderation hooks",
      "Tags & categories",
      "Trending algorithm",
      "Creator analytics",
      "Content scheduling",
    ],
    total: 10,
    done: 10,
  },
  {
    number: 6,
    name: "Scale & Performance",
    status: "in-progress" as const,
    items: [
      "Desktop responsiveness",
      "Image optimization pipeline",
      "Lazy loading + code split",
      "Skeleton screens everywhere",
      "Offline / stale-while-revalidate",
      "Push notifications end-to-end",
      "Error boundary polish",
      "Supabase edge functions",
      "Rate limiting",
      "Load testing",
    ],
    total: 10,
    done: 6,
  },
  {
    number: 7,
    name: "Revenue & Analytics",
    status: "in-progress" as const,
    items: [
      "Stripe payment integration",
      "Premium coach cards",
      "Subscription tiers",
      "Revenue dashboard",
      "Conversion funnels",
      "Retention analytics",
      "A/B test framework",
      "Referral system",
      "Promo codes",
      "Finance reports",
    ],
    total: 10,
    done: 7,
  },
];

const NEXT_UP = [
  { label: "Set VAPID keys in Supabase for push notifications", priority: "High" as const, done: false },
  { label: "Verify circloclub.com domain in Resend", priority: "High" as const, done: false },
  { label: "First real user test — invite beta athletes", priority: "High" as const, done: false },
  { label: "Booking flow end-to-end test", priority: "Medium" as const, done: false },
  { label: "Add real coaches to platform", priority: "Medium" as const, done: false },
  { label: "App Store listing preparation", priority: "Low" as const, done: false },
];

const RECENT_WINS = [
  { label: "Desktop responsiveness fix", date: "Apr 11" },
  { label: "Premium coach cards with sparklines", date: "Apr 11" },
  { label: "Push notifications end-to-end", date: "Apr 11" },
  { label: "Onboarding polish", date: "Apr 11" },
  { label: "13 missing features built", date: "Apr 11" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const priorityStyle: Record<string, string> = {
  High: "text-red-400 bg-red-500/10 border border-red-500/20",
  Medium: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
  Low: "text-slate-400 bg-slate-500/10 border border-slate-500/20",
};

const StatusBadge = ({ status }: { status: "done" | "in-progress" | "pending" }) => {
  if (status === "done")
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Done
      </span>
    );
  if (status === "in-progress")
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#FF6B2B] bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2B] animate-pulse" /> In Progress
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-500/10 border border-slate-500/20 rounded-full px-2 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Pending
    </span>
  );
};

const MiniBar = ({ done, total, active }: { done: number; total: number; active: boolean }) => {
  const pct = Math.round((done / total) * 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        className={`h-full rounded-full ${active ? "bg-gradient-to-r from-[#FF6B2B] to-[#FF9B5E]" : "bg-green-500"}`}
      />
    </div>
  );
};

const PhaseCard = ({
  phase,
  index,
  expanded,
  onToggle,
}: {
  phase: (typeof PHASES)[0];
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const pct = Math.round((phase.done / phase.total) * 100);
  const isActive = phase.status === "in-progress";
  const isDone = phase.status === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
        expanded
          ? "bg-white/5 border-[#FF6B2B]/30 shadow-[0_0_20px_rgba(255,107,43,0.08)]"
          : isActive
          ? "bg-[#FF6B2B]/5 border-[#FF6B2B]/20 hover:border-[#FF6B2B]/40"
          : "bg-white/[0.025] border-white/8 hover:bg-white/[0.04]"
      }`}
      onClick={onToggle}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Phase number bubble */}
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
              isDone
                ? "bg-green-500/15 text-green-400"
                : isActive
                ? "bg-[#FF6B2B]/15 text-[#FF6B2B]"
                : "bg-white/5 text-slate-500"
            }`}
          >
            {phase.number}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white leading-tight truncate">{phase.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {phase.done}/{phase.total} complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={phase.status} />
          <div className="text-slate-600">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="mt-3">
        <MiniBar done={phase.done} total={phase.total} active={isActive} />
      </div>

      {/* Expanded items list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-1.5 pt-3 border-t border-white/5">
              {phase.items.map((item, i) => {
                const itemDone = i < phase.done;
                return (
                  <div key={i} className="flex items-center gap-2.5 text-[11px]">
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        itemDone
                          ? "border-green-500/50 bg-green-500/15"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      {itemDone && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    </div>
                    <span className={itemDone ? "text-slate-400 line-through decoration-slate-600" : "text-slate-300"}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProgressDashboard = () => {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const togglePhase = (n: number) => setExpandedPhase((prev) => (prev === n ? null : n));
  const toggleCheck = (i: number) =>
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="bg-[#070912] min-h-full px-4 pb-10 pt-2 space-y-6 overflow-y-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-1 pt-2"
      >
        <h1 className="text-xl font-bold text-white tracking-tight">Circlo Build Progress</h1>
        <p className="text-[11px] text-slate-500">Phase 6–7 in progress · 70+ features shipped</p>

        {/* Overall progress bar */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400">Overall Completion</span>
            <span className="text-[11px] font-bold text-[#FF6B2B]">75%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B2B] via-[#FF8C4B] to-[#FFB080] shadow-[0_0_12px_rgba(255,107,43,0.5)]"
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-1.5">75% Complete — 53 of 70 features shipped</p>
        </div>
      </motion.div>

      {/* ── Phase Cards ── */}
      <div>
        <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Phases</h2>
        <div className="space-y-2.5">
          {PHASES.map((phase, index) => (
            <PhaseCard
              key={phase.number}
              phase={phase}
              index={index}
              expanded={expandedPhase === phase.number}
              onToggle={() => togglePhase(phase.number)}
            />
          ))}
        </div>
      </div>

      {/* ── Next Up ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Next Up</h2>
        <div className="bg-white/[0.025] border border-white/8 rounded-2xl divide-y divide-white/5 overflow-hidden">
          {NEXT_UP.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
              onClick={() => toggleCheck(i)}
            >
              {/* Checkbox */}
              <div
                className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-all duration-150 ${
                  checkedItems.has(i)
                    ? "bg-[#FF6B2B] border-[#FF6B2B]"
                    : "border-white/15 bg-white/5"
                }`}
              >
                {checkedItems.has(i) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span
                className={`flex-1 text-[12px] leading-snug transition-all duration-150 ${
                  checkedItems.has(i) ? "text-slate-600 line-through" : "text-slate-300"
                }`}
              >
                {item.label}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${priorityStyle[item.priority]}`}>
                {item.priority}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Recent Wins ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
      >
        <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Recent Wins</h2>
        <div className="space-y-2">
          {RECENT_WINS.map((win, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 + i * 0.06 }}
              className="flex items-center gap-3 bg-white/[0.025] border border-white/8 rounded-xl px-4 py-3"
            >
              <div className="h-6 w-6 rounded-lg bg-[#FF6B2B]/15 flex items-center justify-center shrink-0">
                <Zap className="h-3 w-3 text-[#FF6B2B]" />
              </div>
              <span className="flex-1 text-[12px] text-slate-300">{win.label}</span>
              <span className="text-[10px] text-slate-600 shrink-0">{win.date}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressDashboard;
