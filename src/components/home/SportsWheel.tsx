import { useRef, useEffect } from "react";

export const SPORTS = [
  { label: "All",        value: "all",        emoji: "🏅" },
  { label: "Padel",      value: "Padel",      emoji: "🎾" },
  { label: "Tennis",     value: "Tennis",     emoji: "🎾" },
  { label: "Fitness",    value: "Fitness",    emoji: "🏋️" },
  { label: "Boxing",     value: "Boxing",     emoji: "🥊" },
  { label: "Yoga",       value: "Yoga",       emoji: "🧘" },
  { label: "Basketball", value: "Basketball", emoji: "🏀" },
  { label: "Swimming",   value: "Swimming",   emoji: "🏊" },
  { label: "Soccer",     value: "Soccer",     emoji: "⚽" },
  { label: "Running",    value: "Running",    emoji: "🏃" },
  { label: "MMA",        value: "MMA",        emoji: "🥋" },
  { label: "CrossFit",   value: "CrossFit",   emoji: "💪" },
] as const;

interface SportsWheelProps {
  selected: string;
  onSelect: (sport: string) => void;
}

const SportsWheel = ({ selected, onSelect }: SportsWheelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [selected]);

  return (
    <div
      ref={scrollRef}
      className="flex w-full max-w-full gap-2 overflow-x-auto hide-scrollbar px-4 py-3 snap-x snap-mandatory"
    >
      {SPORTS.map((sport) => {
        const isActive = selected === sport.value;
        return (
          <button
            key={sport.value}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(sport.value)}
            className={`
              snap-center flex-shrink-0 flex items-center gap-2
              px-4 py-2.5 rounded-2xl text-[13px] font-bold
              whitespace-nowrap transition-all duration-200
              active:scale-[0.93]
              ${isActive
                ? "text-white shadow-lg scale-[1.03]"
                : "bg-secondary/80 text-muted-foreground hover:bg-secondary border border-border/30"
              }
            `}
            style={isActive ? {
              background: "linear-gradient(135deg, #00D4AA, #FF6B2C)",
              boxShadow: "0 4px 15px rgba(0,212,170,0.3)"
            } : {}}
          >
            <span className="text-base leading-none">{sport.emoji}</span>
            {sport.label}
          </button>
        );
      })}
    </div>
  );
};

export default SportsWheel;
