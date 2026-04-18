import { Play, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoThumbProps {
  className?: string;
  aspect?: "16/9" | "4/5";
  durationSec?: number;
  progressPct?: number;
  isLive?: boolean;
  viewerCount?: number;
  tierBadge?: "NEW" | "CIRCLE" | "VIP" | null;
  newBadge?: boolean;
  watchedPct?: number;
  onClick?: () => void;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoThumb({
  className,
  aspect = "16/9",
  durationSec,
  progressPct,
  isLive,
  viewerCount,
  tierBadge,
  newBadge,
  watchedPct,
  onClick,
}: VideoThumbProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-[14px] overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        aspectRatio: aspect.replace("/", " / "),
        background: "linear-gradient(135deg, #1a2a3a, #0f1822)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 30% 40%, rgba(0,212,170,0.18), transparent 60%)" }}
      />
      {!isLive && (
        <button
          aria-label="Play"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 text-navy-deep flex items-center justify-center shadow-lg"
        >
          <Play size={18} fill="currentColor" />
        </button>
      )}
      {isLive && (
        <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-danger text-white text-[10px] font-extrabold tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white v2-pulse-dot" />
          LIVE
        </span>
      )}
      {newBadge && !isLive && (
        <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-teal-dim text-teal text-[10px] font-bold">NEW</span>
      )}
      {tierBadge && !isLive && !newBadge && (
        <span
          className={cn(
            "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider",
            tierBadge === "VIP" ? "bg-orange-dim text-orange" : "bg-teal-dim text-teal"
          )}
        >
          {tierBadge}
        </span>
      )}
      {viewerCount !== undefined && (
        <span className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-semibold flex items-center gap-1 tnum">
          <Eye size={10} />
          {viewerCount}
        </span>
      )}
      {durationSec !== undefined && !isLive && (
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-semibold tnum">
          {fmt(durationSec)}
        </span>
      )}
      {watchedPct !== undefined && (
        <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-bold">
          {watchedPct}% watched
        </span>
      )}
      {progressPct !== undefined && (
        <span
          className="absolute bottom-0 left-0 h-[3px] bg-teal"
          style={{ width: `${progressPct}%` }}
        />
      )}
    </div>
  );
}
