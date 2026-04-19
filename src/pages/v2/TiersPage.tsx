import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { useCoach } from "@/hooks/v2/useMocks";
import { formatPrice } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";

interface Tier {
  key: "follower" | "member" | "vip";
  label: string;
  price: number | null;
  cadence?: string;
  features: string[];
  popular?: boolean;
  vip?: boolean;
  cta: string;
  ctaTone: "ghost" | "teal" | "orange";
}

const TIERS: Tier[] = [
  { key: "follower", label: "FOLLOWER", price: 0, cta: "+ Follow", ctaTone: "ghost", features: [
    "Public posts + reels",
    "Open community chat",
    "Book sessions at standard rate",
  ] },
  { key: "member", label: "CIRCLE MEMBER", price: 59, cadence: "/ mo", popular: true, cta: "Start 7-day free trial", ctaTone: "teal", features: [
    "All 42 premium training videos",
    "Private Circle chat + weekly Q&A",
    "Priority booking (1 day early)",
    "15% off every session",
  ] },
  { key: "vip", label: "VIP ★", price: 149, cadence: "/ mo", vip: true, cta: "Become VIP", ctaTone: "orange", features: [
    "Everything in Member",
    "Monthly 1:1 video review",
    "Custom training plan",
  ] },
];

export default function TiersPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: coach } = useCoach(id);

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />

      <header className="px-5 pt-2.5 flex items-center justify-between">
        <RoundButton ariaLabel="Back" variant="solid-navy" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
        </RoundButton>
        <h3 className="text-[16px] font-bold">Join {coach?.firstName ?? "Coach"}'s Circle</h3>
        <div className="w-10" />
      </header>

      <section className="text-center px-5 pt-5 pb-2">
        <div className="w-[120px] h-[120px] rounded-full mx-auto mb-5 v2-avatar-grad-award" />
        <div className="text-[10px] font-extrabold text-teal tracking-widest uppercase">{coach?.firstName ?? "Coach"}'s Circle</div>
        <h2 className="mt-2 text-[24px] font-extrabold">Pick your tier</h2>
        <p className="text-[12px] text-v2-muted mt-1">
          {coach?.followerCount ?? 0} followers · {coach?.memberCount ?? 0} members · {coach?.vipCount ?? 0} VIPs
        </p>
      </section>

      <div className="flex flex-col gap-3 mt-5">
        {TIERS.map((t) => (
          <article
            key={t.key}
            data-grad={t.popular ? "teal-soft" : t.vip ? "orange-soft" : undefined}
            className={cn(
              "mx-5 p-4 rounded-[18px] border relative",
              t.popular && "border-teal",
              t.vip && "border-orange",
              !t.popular && !t.vip && "border-navy-line bg-navy-card"
            )}
          >
            {t.popular && (
              <span className="absolute -top-2.5 right-5 bg-teal text-navy-deep px-2.5 py-1 rounded-full text-[10px] font-bold">
                Most popular
              </span>
            )}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className={cn(
                  "text-[10px] font-extrabold tracking-widest",
                  t.popular ? "text-teal" : t.vip ? "text-orange" : "text-v2-muted"
                )}>{t.label}</div>
                <div className="text-[22px] font-extrabold tracking-tight mt-1 tnum">
                  {t.price === 0 ? "Free" : formatPrice(t.price ?? 0)}
                  {t.cadence && <span className="text-[12px] text-v2-muted ml-1.5 font-semibold">{t.cadence}</span>}
                </div>
              </div>
              {t.popular && (
                <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center">
                  <Check size={18} strokeWidth={3} className="text-navy-deep" />
                </div>
              )}
            </div>
            <ul className="space-y-2 mb-3">
              {t.features.map((f) => (
                <li key={f} className="text-[13px] flex gap-2 items-start">
                  <span className={cn("font-bold", t.vip ? "text-orange" : "text-teal")}>{t.vip ? "★" : "✓"}</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                t.key === "follower"
                  ? navigate("/v2/profile")
                  : navigate(`/v2/book/${id}/success?tier=${t.key}`)
              }
              className={cn(
                "w-full py-3.5 rounded-[12px] font-bold text-[14px]",
                t.ctaTone === "teal" && "bg-teal text-navy-deep",
                t.ctaTone === "orange" && "bg-orange text-white",
                t.ctaTone === "ghost" && "bg-transparent text-offwhite border border-navy-line"
              )}
            >
              {t.cta}
            </button>
          </article>
        ))}
      </div>
    </PhoneFrame>
  );
}
