import { cn } from "@/lib/utils";

interface LiveCardProps {
  title: string;
  coach: string;
  viewers: number;
  variant?: "teal" | "orange";
  onClick?: () => void;
}

export function LiveCard({ title, coach, viewers, variant = "teal", onClick }: LiveCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-w-[140px] h-[150px] rounded-card p-3.5 flex flex-col justify-between text-left",
        variant === "teal" ? "bg-teal text-navy-deep" : "bg-orange text-white"
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-current v2-pulse-dot" />
        LIVE
      </span>
      <div>
        <div className="font-bold text-sm">{title}</div>
        <div className="text-[11px] opacity-80 mt-0.5">
          {coach} · <span className="tnum">{viewers}</span> watching
        </div>
      </div>
    </button>
  );
}
