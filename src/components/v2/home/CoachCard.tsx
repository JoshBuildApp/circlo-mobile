import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Coach } from "@/types/v2";

interface CoachCardProps {
  coach: Coach;
  ctaLabel?: string;
  onClick?: () => void;
}

const GRADIENTS: Record<Coach["avatarGradient"], string> = {
  "teal-gold": "linear-gradient(135deg, #00D4AA 0%, #ffd97a 100%)",
  "orange-peach": "linear-gradient(135deg, #FF6B2C 0%, #ff9d6c 100%)",
  "teal-mint": "linear-gradient(135deg, #00D4AA 0%, #3dd9b1 100%)",
  "gold-teal": "linear-gradient(135deg, #ffd97a 0%, #00D4AA 100%)",
};

/**
 * Card that shows a coach photo when available, gradient placeholder otherwise.
 * Bottom-third has a dark gradient overlay so name + meta stay legible.
 */
export function CoachCard({ coach, ctaLabel = "Follow", onClick }: CoachCardProps) {
  const [imgErrored, setImgErrored] = useState(false);
  const showImage = Boolean(coach.avatarUrl) && !imgErrored;

  const tag = coach.badges.includes("verified")
    ? "Verified"
    : coach.badges.includes("new")
    ? "New"
    : coach.badges.includes("regular")
    ? "Regular"
    : null;

  const lastInitial = coach.name.split(" ").slice(-1)[0]?.[0] ?? "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "min-w-[155px] h-[170px] rounded-card p-3.5 flex flex-col justify-between relative text-left text-white overflow-hidden"
      )}
      style={{ background: GRADIENTS[coach.avatarGradient] }}
    >
      {showImage && (
        <img
          src={coach.avatarUrl}
          alt={coach.name}
          loading="lazy"
          onError={() => setImgErrored(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Dark overlay so text stays legible whether on image or gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {tag && (
        <span className="relative z-10 self-end bg-black/45 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
          {tag}
        </span>
      )}
      <div />
      <div className="relative z-10">
        <div className="font-bold text-[15px]">
          {coach.firstName} {lastInitial}.
        </div>
        <div className="text-[11px] opacity-90 mt-0.5">
          {coach.sports[0]} · {coach.rating}★
        </div>
      </div>
      <div className="relative z-10 flex justify-between items-center text-[12px] font-semibold">
        <span>{ctaLabel}</span>
        <span aria-hidden>›</span>
      </div>
    </button>
  );
}
