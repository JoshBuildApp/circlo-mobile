import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatEngineItem {
  label: string;
  value: number;
  /** Max value for the gauge ring (e.g. 100). Determines fill ratio. */
  max?: number;
  /** Suffix appended to the value (e.g. "%", "/100", "k"). */
  suffix?: string;
  icon: LucideIcon;
  color?: "teal" | "orange" | "purple" | "cyan" | "green" | "yellow";
}

interface StatEngineProps {
  title?: string;
  stats: StatEngineItem[];
  /** Elite tier renders a gold accent treatment. */
  elite?: boolean;
}

const colorMap = {
  teal: { stroke: "#00D4AA", text: "text-teal", glow: "rgba(0, 212, 170, 0.4)" },
  orange: { stroke: "#FF6B2C", text: "text-orange-400", glow: "rgba(255, 107, 44, 0.4)" },
  purple: { stroke: "#A855F7", text: "text-purple-400", glow: "rgba(168, 85, 247, 0.4)" },
  cyan: { stroke: "#06B6D4", text: "text-cyan-400", glow: "rgba(6, 182, 212, 0.4)" },
  green: { stroke: "#22C55E", text: "text-green-400", glow: "rgba(34, 197, 94, 0.4)" },
  yellow: { stroke: "#FACC15", text: "text-yellow-400", glow: "rgba(250, 204, 21, 0.4)" },
};

/**
 * Animated counter that ticks from 0 to value when entering view.
 */
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return <span ref={ref}>{display}</span>;
}

/**
 * Circular SVG gauge with animated stroke fill.
 */
function StatGauge({ stat, elite }: { stat: StatEngineItem; elite?: boolean }) {
  const max = stat.max ?? 100;
  const ratio = Math.min(stat.value / max, 1);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const color = colorMap[stat.color || "teal"];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const Icon = stat.icon;

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        {/* Outer glow */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full blur-xl opacity-50"
          style={{ background: color.glow }}
        />
        <svg className="relative w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress ring */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            stroke={color.stroke}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={
              isInView
                ? { strokeDashoffset: circumference * (1 - ratio) }
                : {}
            }
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${color.glow})` }}
          />
        </svg>
        {/* Center icon + value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <Icon className={cn("w-4 h-4", color.text)} />
          <span className="text-base font-bold text-foreground">
            <AnimatedNumber value={stat.value} />
            {stat.suffix ?? ""}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {stat.label}
      </span>
    </div>
  );
}

export default function StatEngine({
  title = "Stats Engine",
  stats,
  elite = false,
}: StatEngineProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 border backdrop-blur-md",
        elite
          ? "border-yellow-400/30 bg-gradient-to-br from-yellow-400/5 to-orange-400/5"
          : "border-border bg-muted/30",
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {elite && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-yellow-300">
            Elite
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, i) => (
          <StatGauge key={i} stat={stat} elite={elite} />
        ))}
      </div>
    </div>
  );
}
