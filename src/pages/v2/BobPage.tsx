import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Send, Sparkles, BarChart3, MessageSquare, Users, DollarSign, ChevronRight, Bot } from "lucide-react";
import { PhoneFrame, StatusBar } from "@/components/v2/shared";
import { BobHeader } from "@/components/v2/bob/BobHeader";
import { CoachOnly } from "@/components/v2/bob/CoachOnly";
import { useMyCoachProfile } from "@/hooks/v2/useMocks";
import { formatPrice } from "@/lib/v2/currency";

const SUGGESTIONS: { icon: typeof BarChart3; label: string }[] = [
  { icon: BarChart3, label: "Summarize this month's revenue" },
  { icon: MessageSquare, label: "Draft a post about my serve clinic" },
  { icon: Users, label: "Which members might churn?" },
  { icon: DollarSign, label: "Should I raise my session price?" },
];

export default function BobPage() {
  const [params] = useSearchParams();
  const hasChat = params.get("chat") === "1";
  return (
    <CoachOnly>
      <PhoneFrame className="min-h-[100dvh] pb-24">
        <StatusBar />
        {hasChat ? <BobChat /> : <BobEmpty />}
      </PhoneFrame>
    </CoachOnly>
  );
}

function BobEmpty() {
  const navigate = useNavigate();
  const { data: coach } = useMyCoachProfile();
  return (
    <>
      <BobHeader />
      <main className="px-5 pt-8 pb-2 text-center">
        <div className="w-[90px] h-[90px] rounded-3xl bg-orange flex items-center justify-center mx-auto mb-5 relative">
          <Bot size={42} stroke="white" />
          <span className="absolute bottom-[-3px] right-[-3px] w-[18px] h-[18px] bg-teal border-[3px] border-navy-deep rounded-full" />
        </div>
        <h1 className="text-[28px] font-extrabold tracking-tight">Hey {coach?.firstName ?? "Coach"} 👋</h1>
        <p className="text-[13px] text-v2-muted mt-2 leading-relaxed">
          I read your bookings, messages, and payouts. Ask me anything.
        </p>

        <section
          className="mt-5 mb-6 p-3.5 rounded-[16px] border border-teal-dim text-left"
          data-grad="teal-soft"
        >
          <div className="text-[10px] font-extrabold text-teal tracking-wider uppercase flex items-center gap-1">
            <Sparkles size={12} /> INSIGHT FOR TODAY
          </div>
          <p className="text-[13px] mt-2 leading-snug">
            3 of your Fridays this month are under 50% booked. Want me to suggest a campaign?
          </p>
        </section>

        <div className="text-left">
          <div className="text-[10px] text-v2-muted font-bold tracking-wider mb-2">TRY ASKING</div>
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => navigate("/v2/bob?chat=1")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] bg-navy-card mb-2 text-left"
              >
                <Icon size={16} className="text-teal" />
                <span className="flex-1 text-[13px]">{s.label}</span>
                <ChevronRight size={14} className="text-v2-muted" />
              </button>
            );
          })}
        </div>
      </main>
      <BobInputBar />
    </>
  );
}

function BobChat() {
  const navigate = useNavigate();
  return (
    <>
      <BobHeader sub="active" showMore />
      <main className="px-0 pb-2 flex flex-col gap-2.5 mt-3">
        <div className="self-end max-w-[80%] mr-5 px-3.5 py-2.5 rounded-[18px_18px_4px_18px] bg-orange text-white text-sm">
          How's my revenue this month?
        </div>
        <div className="self-end mr-5 -mt-1 text-[10px] text-v2-muted">9:41</div>
        <div className="self-start ml-5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-navy-card rounded-full text-[11px] text-v2-muted">
          <span className="text-teal font-bold">✓</span> Read bookings & payouts · 0.8s
        </div>
        <div className="self-start max-w-[85%] ml-5 px-3.5 py-2.5 rounded-[18px_18px_18px_4px] bg-navy-card text-[13px] leading-snug">
          You're up <span className="text-teal font-bold">28% vs last month.</span> Here's the breakdown:
        </div>
        <div className="self-start w-[calc(100%-2.5rem)] mx-5 p-4 rounded-[16px] bg-navy-card mt-1">
          <div className="flex justify-between items-center mb-3">
            <div className="text-[10px] font-extrabold text-v2-muted tracking-wider uppercase">November Revenue</div>
            <div className="bg-teal-dim text-teal px-2 py-0.5 rounded-full text-[11px] font-bold tnum">↑ 28%</div>
          </div>
          <div className="flex items-end gap-1.5 h-[60px] mb-2.5">
            {[30, 40, 35, 65, 85, 100].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-md ${i < 3 ? "bg-navy-card-2" : i < 5 ? "bg-teal" : "bg-orange"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="text-[26px] font-extrabold tracking-tight tnum">
            {formatPrice(8420)} <span className="text-[11px] text-v2-muted ml-1.5 font-semibold">vs {formatPrice(6580)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-navy-line text-[12px]">
            {[
              { label: "VIP subscriptions", val: formatPrice(5050) },
              { label: "Private sessions", val: formatPrice(2240) },
              { label: "Shop (programs)", val: formatPrice(1130) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between py-1 text-v2-muted">
                <span>{r.label}</span>
                <span className="text-offwhite font-bold">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="self-start max-w-[85%] ml-5 px-3.5 py-2.5 rounded-[18px_18px_18px_4px] bg-navy-card text-[13px] leading-snug">
          VIP subs drove 60% of growth. Want me to draft a thank-you post for your VIPs?
        </div>
      </main>
      <div className="flex flex-wrap gap-1.5 px-5 mt-2.5 mb-2">
        <button onClick={() => navigate("/v2/bob/inbox")} className="px-3 py-1.5 rounded-full bg-orange-dim text-orange text-[12px] font-semibold">→ Yes, draft it</button>
        <button className="px-3 py-1.5 rounded-full bg-teal-dim text-teal text-[12px] font-semibold">Full report</button>
        <button className="px-3 py-1.5 rounded-full bg-teal-dim text-teal text-[12px] font-semibold">Export CSV</button>
      </div>
      <BobInputBar />
    </>
  );
}

function BobInputBar() {
  const [val, setVal] = useState("");
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-4 pb-6 pt-3 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom flex gap-2.5 items-center">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Ask Bob anything..."
        className="flex-1 px-4 py-3 rounded-full bg-navy-card border-none text-offwhite text-sm outline-none placeholder:text-v2-muted"
      />
      <button
        aria-label="Send"
        className="w-10 h-10 rounded-full bg-orange text-white flex items-center justify-center"
      >
        <Send size={18} fill="currentColor" />
      </button>
    </div>
  );
}
