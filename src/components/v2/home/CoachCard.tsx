import { cn } from "@/lib/utils";
import type { Coach } from "@/types/v2";

interface CoachCardProps {
  coach: Coach;
  variant?: "teal" | "orange" | "auto";
  ctaLabel?: string;
  onClick?: () => void;
}

export function CoachCard({ coach, variant = "auto", ctaLabel = "Follow", onClick }: CoachCardProps) {
  const tag = coach.badges.includes("verified")
    ? "Verified"
    : coach.badges.includes("new")
    ? "New"
    : coach.badges.includes("regular")
    ? "Regular"
    : null;

  const resolvedVariant =
    variant === "auto" ? (coach.avatarGradient === "orange-peach" ? "orange" : "teal") : variant;

  return (
    <button
      onClick={onClick}
      className={cn(
        "min-w-[155px] h-[170px] rounded-card p-3.5 flex flex-col justify-between relative text-left",
        resolvedVariant === "orange" ? "bg-orange text-white" : "bg-teal text-navy-deep"
      )}
    >
      {tag && (
        <span className="absolute top-2.5 right-2.5 bg-black/30 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
          {tag}
        </span>
      )}
      <div />
      <div>
        <div className="font-bold text-[15px]">{coach.firstName} {coach.name.split(" ").slice(-1)[0][0]}.</div>
        <div className="text-[11px] opacity-80 mt-0.5">
          {coach.sports[0]} · {coach.rating}★
        </div>
      </div>
      <div className="flex justify-between items-center text-[12px] font-semibold">
        <span>{ctaLabel}</span>
        <span aria-hidden>›</span>
      </div>
    </button>
  );
}
