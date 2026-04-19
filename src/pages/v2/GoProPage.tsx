import { useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowRight, Heart, Store, Video, Star, Bot } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { formatPrice } from "@/lib/v2/currency";

const PLUS_FEATURES = [
  { icon: Heart, title: "Circle Memberships", desc: "Monthly subscribers on your profile" },
  { icon: Store, title: "Unlimited Shop", desc: "Sell plans, packs, merch" },
  { icon: Video, title: "Video review tool", desc: "Frame annotations + slow-mo" },
  { icon: Star, title: "Verified + priority ranking", desc: "Rank higher in Discover" },
];

export default function GoProPage() {
  const navigate = useNavigate();

  return (
    <PhoneFrame className="min-h-[100dvh] pb-32">
      <StatusBar />
      <header className="px-5 pt-3.5">
        <RoundButton ariaLabel="Back" variant="solid-navy" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
        </RoundButton>
      </header>

      <section className="text-center px-5 pt-6 pb-3">
        <span className="inline-flex items-center gap-1 bg-orange-dim text-orange px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase">
          ⚡ FOR COACHES
        </span>
        <h1 className="text-[34px] font-extrabold tracking-tight leading-tight mt-4">
          Go Pro. <br />
          <span className="text-orange">Grow faster.</span>
        </h1>
        <p className="text-[13px] text-v2-muted mt-2">
          Unlock Bob AI, subscriptions, shop, analytics — the full platform.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2.5 px-5 my-4">
        <div className="p-4 rounded-[16px] bg-navy-card relative">
          <div className="text-[11px] font-extrabold text-v2-muted tracking-wider">FREE</div>
          <div className="text-[24px] font-extrabold tnum mt-1 mb-3">{formatPrice(0)} <span className="text-[11px] text-v2-muted font-semibold">/ mo</span></div>
          <ul className="text-[12px] text-v2-muted space-y-1 mb-2">
            <li>Basic profile</li>
            <li>Session bookings</li>
            <li>Post content</li>
          </ul>
          <div className="text-[11px] text-v2-muted-2">20% Circlo fee</div>
        </div>
        <div className="p-4 rounded-[16px] bg-gradient-to-b from-[#3a1c0f] to-[#1f140a] border border-orange relative">
          <span className="absolute -top-2.5 right-2.5 bg-orange text-white px-2.5 py-1 rounded-full text-[10px] font-bold">Recommended</span>
          <div className="text-[11px] font-extrabold text-orange tracking-wider">PRO</div>
          <div className="text-[24px] font-extrabold tnum mt-1 mb-3">{formatPrice(149)} <span className="text-[11px] text-v2-muted font-semibold">/ mo</span></div>
          <ul className="text-[12px] text-v2-muted space-y-1 mb-2">
            <li>All Free features</li>
            <li>+ Bob AI &amp; more</li>
          </ul>
          <div className="text-[11px] text-orange">10% fee · not 20%</div>
        </div>
      </div>

      <div
        className="mx-5 mb-3.5 p-4 rounded-[18px] border border-orange-dim"
        style={{ background: "linear-gradient(135deg, #3a1c0f, #1f140a)" }}
      >
        <div className="flex gap-2.5 items-center mb-3">
          <div className="w-11 h-11 rounded-[12px] bg-orange flex items-center justify-center">
            <Bot size={22} stroke="white" />
          </div>
          <div>
            <h4 className="text-[15px] font-bold">
              Bob AI <span className="bg-orange-dim text-orange px-2 py-0.5 rounded-full text-[10px] font-bold ml-1">PRO</span>
            </h4>
            <p className="text-[12px] text-v2-muted mt-px">Your AI coaching assistant. Ask anything about your business.</p>
          </div>
        </div>
        <div className="px-3.5 py-2.5 rounded-[14px] bg-navy-card-2 text-[13px] mb-1.5">
          How's my revenue trending vs last month?
        </div>
        <div className="px-3.5 py-2.5 rounded-[14px] bg-navy-card text-[13px]">
          Up 28% ({formatPrice(8420)} vs {formatPrice(6580)}). Your...
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {["Weekly reports", "Pricing advice", "Content ideas", "Session recaps", "Member insights"].map((c) => (
            <span key={c} className="px-2.5 py-1.5 rounded-full bg-orange-dim text-orange text-[11px] font-semibold">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-5 mb-3.5 p-4 rounded-[16px] bg-navy-card">
        <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-2.5">PLUS EVERYTHING ELSE</div>
        {PLUS_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex gap-3 py-2">
              <div className="w-8 h-8 rounded-[10px] bg-navy-card-2 flex items-center justify-center text-orange">
                <Icon size={14} />
              </div>
              <div>
                <h5 className="text-[13px] font-bold">{f.title}</h5>
                <p className="text-[11px] text-v2-muted mt-px">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-5 mb-3.5 px-4 py-3 rounded-[14px] bg-navy-card flex items-center gap-2.5">
        <div className="flex">
          <div className="w-6 h-6 rounded-full border-2 border-navy-card" style={{ background: "linear-gradient(135deg, #00D4AA, #3dd9b1)" }} />
          <div className="w-6 h-6 rounded-full border-2 border-navy-card -ml-2" style={{ background: "linear-gradient(135deg, #FF6B2C, #ff9d6c)" }} />
          <div className="w-6 h-6 rounded-full border-2 border-navy-card -ml-2" style={{ background: "linear-gradient(135deg, #fff, #00D4AA)" }} />
        </div>
        <div className="text-[11px] text-v2-muted flex-1">
          <strong className="text-offwhite">142 coaches upgraded</strong> · avg. 3.2× revenue in 6 months
        </div>
      </div>

      <button
        onClick={() => navigate("/v2/book/upgrade/success?tier=pro")}
        className="mx-5 mt-2 mb-6 px-4 py-4 rounded-[14px] bg-orange text-white font-extrabold text-[15px] w-[calc(100%-2.5rem)] flex items-center justify-center gap-1.5"
      >
        Upgrade to Pro — {formatPrice(149)} / mo <ArrowRight size={16} />
      </button>
    </PhoneFrame>
  );
}
