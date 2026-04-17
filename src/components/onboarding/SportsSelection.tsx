import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SPORTS = [
  { id: "football", name: "Football", emoji: "⚽" },
  { id: "basketball", name: "Basketball", emoji: "🏀" },
  { id: "tennis", name: "Tennis", emoji: "🎾" },
  { id: "swimming", name: "Swimming", emoji: "🏊" },
  { id: "running", name: "Running", emoji: "🏃" },
  { id: "cycling", name: "Cycling", emoji: "🚴" },
  { id: "yoga", name: "Yoga", emoji: "🧘" },
  { id: "boxing", name: "Boxing", emoji: "🥊" },
  { id: "golf", name: "Golf", emoji: "⛳" },
  { id: "baseball", name: "Baseball", emoji: "⚾" },
  { id: "volleyball", name: "Volleyball", emoji: "🏐" },
  { id: "skiing", name: "Skiing", emoji: "⛷️" },
  { id: "surfing", name: "Surfing", emoji: "🏄" },
  { id: "climbing", name: "Climbing", emoji: "🧗" },
  { id: "martial_arts", name: "Martial Arts", emoji: "🥋" },
  { id: "hockey", name: "Hockey", emoji: "🏒" },
];

interface SportsSelectionProps {
  selectedSports: string[];
  onSelectionChange: (sports: string[]) => void;
}

export function SportsSelection({ selectedSports, onSelectionChange }: SportsSelectionProps) {
  const handleSportToggle = (sportId: string) => {
    const newSelection = selectedSports.includes(sportId)
      ? selectedSports.filter((id) => id !== sportId)
      : [...selectedSports, sportId];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-5">
      {/* Header + count badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">What sports do you love?</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tap to select — we'll match you with the best coaches.
          </p>
        </div>

        <AnimatePresence>
          {selectedSports.length > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="shrink-0 mt-0.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm"
            >
              {selectedSports.length} selected
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3-column emoji grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {SPORTS.map((sport) => {
          const isSelected = selectedSports.includes(sport.id);
          return (
            <motion.button
              key={sport.id}
              onClick={() => handleSportToggle(sport.id)}
              whileTap={{ scale: 0.88 }}
              animate={{ scale: isSelected ? 1.04 : 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 px-2 cursor-pointer border-2 transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-gradient-to-b from-primary/20 to-primary/10 shadow-md"
                  : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/70"
              )}
              aria-pressed={isSelected}
            >
              {/* Checkmark pip */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="text-2xl leading-none">{sport.emoji}</span>
              <span
                className={cn(
                  "text-xs font-semibold leading-tight text-center",
                  isSelected ? "text-primary" : "text-foreground/70"
                )}
              >
                {sport.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Empty state hint */}
      <AnimatePresence>
        {selectedSports.length === 0 && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-center text-xs text-muted-foreground pt-1"
          >
            Select at least one sport to continue
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
