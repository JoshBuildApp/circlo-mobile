import { Star, CheckCircle2, Zap } from "lucide-react";

interface CoachTrustSignalsProps {
  rating?: number;
  reviewCount?: number;
  sessionsCompleted?: number;
  coachingSince?: number;
  isVerified?: boolean;
  /** "Instant" confirms immediately; "Request" needs coach approval. */
  bookingMode?: "instant" | "request";
  /** Compact layout for cards, expanded for profile hero. */
  variant?: "card" | "hero";
  className?: string;
}

const priceBand = (price?: number) => {
  if (price == null || price <= 0) return null;
  if (price < 120) return "$";
  if (price < 250) return "$$";
  return "$$$";
};

/**
 * Row of trust chips shown on every coach card and the coach profile hero.
 * Order follows the reading hierarchy: rating → reviews → sessions → verified.
 * Hides each chip independently when the underlying data is missing.
 */
export const CoachTrustSignals = ({
  rating,
  reviewCount,
  sessionsCompleted,
  coachingSince,
  isVerified,
  bookingMode,
  variant = "card",
  className = "",
}: CoachTrustSignalsProps) => {
  const isHero = variant === "hero";

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {rating != null && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full font-bold ${
            isHero ? "bg-black/55 text-white px-2 py-1 text-[11px]" : "bg-black/55 text-white px-1.5 py-0.5 text-[10px]"
          } backdrop-blur-sm`}
        >
          <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
          {rating.toFixed(1)}
          {reviewCount != null && reviewCount > 0 && (
            <span className="text-white/70 font-medium ml-0.5">({reviewCount})</span>
          )}
        </span>
      )}

      {sessionsCompleted != null && sessionsCompleted > 0 && (
        <span
          className={`inline-flex items-center rounded-full bg-white/10 text-white/90 font-semibold ${
            isHero ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[9px]"
          } backdrop-blur-sm`}
        >
          {sessionsCompleted}+ sessions
        </span>
      )}

      {coachingSince != null && coachingSince > 0 && !sessionsCompleted && (
        <span
          className={`inline-flex items-center rounded-full bg-white/10 text-white/90 font-semibold ${
            isHero ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[9px]"
          } backdrop-blur-sm`}
        >
          Since {coachingSince}
        </span>
      )}

      {isVerified && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full font-bold ${
            isHero ? "bg-emerald-500/90 text-white px-2 py-1 text-[11px]" : "bg-emerald-500/90 text-white px-1.5 py-0.5 text-[9px]"
          } backdrop-blur-sm`}
        >
          <CheckCircle2 className={isHero ? "h-3 w-3" : "h-2.5 w-2.5"} />
          Verified
        </span>
      )}

      {bookingMode === "instant" && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full font-black uppercase tracking-wider ${
            isHero ? "bg-[#46f1c5] text-[#005643] px-2 py-1 text-[10px]" : "bg-[#46f1c5] text-[#005643] px-1.5 py-0.5 text-[9px]"
          }`}
        >
          <Zap className={isHero ? "h-3 w-3" : "h-2.5 w-2.5"} fill="currentColor" strokeWidth={0} />
          Instant
        </span>
      )}
      {bookingMode === "request" && (
        <span
          className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${
            isHero ? "bg-white/10 text-white/80 px-2 py-1 text-[10px]" : "bg-white/10 text-white/80 px-1.5 py-0.5 text-[9px]"
          } backdrop-blur-sm`}
        >
          Request
        </span>
      )}
    </div>
  );
};

export { priceBand };
export default CoachTrustSignals;
