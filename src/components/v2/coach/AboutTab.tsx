import { PulseDot, StatCard, Chip } from "@/components/v2/shared";
import { formatPrice } from "@/lib/v2/currency";
import type { Coach } from "@/types/v2";

interface AboutTabProps {
  coach: Coach;
  onFollow: () => void;
  onMessage: () => void;
}

export function AboutTab({ coach, onFollow, onMessage }: AboutTabProps) {
  return (
    <div className="pb-32">
      <div className="px-5 pt-3 pb-3">
        <div className="px-3.5 py-2.5 rounded-[12px] bg-gradient-to-br from-[#0f3b33] to-[#0a2722] border border-teal-dim flex items-center gap-2.5">
          <PulseDot />
          <div className="flex-1">
            <div className="text-[11px] text-teal font-bold tracking-wider">AVAILABLE FOR BOOKINGS</div>
            <div className="text-[12px] text-offwhite font-medium mt-px">
              Usually replies within {coach.avgResponseMin ?? 12}m
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-5 mb-3.5">
        <button
          onClick={onFollow}
          className="border border-teal text-teal py-3 rounded-[12px] font-bold text-[14px]"
        >
          + Follow
        </button>
        <button
          onClick={onMessage}
          className="bg-navy-card text-offwhite py-3 rounded-[12px] font-bold text-[14px]"
        >
          Message
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-5 mb-3.5">
        <StatCard
          label="Rating"
          value={
            <span>
              {coach.rating.toFixed(1)} <span className="text-teal">★</span>
            </span>
          }
          sub={`${coach.reviewCount} reviews`}
        />
        <StatCard
          label="From"
          value={formatPrice(coach.priceFromILS)}
          sub="/ session"
          accent="orange"
        />
      </div>

      <div className="mx-5 p-4 rounded-[14px] bg-navy-card">
        <div className="text-[10px] text-v2-muted font-bold uppercase tracking-wider mb-2">About</div>
        <p className="text-[13px] leading-relaxed text-offwhite mb-2.5">{coach.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {(coach.tags ?? []).map((tag, i) => (
            <Chip key={tag} variant={i % 3 === 2 ? "orange" : "teal"} className="text-[12px]">
              {tag}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
