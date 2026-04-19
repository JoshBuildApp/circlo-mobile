import { Heart } from "lucide-react";
import { useSavedCoaches } from "@/hooks/use-saved-coaches";
import { useHaptics } from "@/native/useNative";

interface CoachHeartButtonProps {
  coachId: string;
  coachName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Stop bubbling so it works inside <Link> cards. */
  stopPropagation?: boolean;
}

const SIZES = {
  sm: { btn: "h-8 w-8", icon: "h-3.5 w-3.5" },
  md: { btn: "h-10 w-10", icon: "h-4 w-4" },
  lg: { btn: "h-11 w-11", icon: "h-5 w-5" },
};

/**
 * Reusable heart/favorite toggle for coach cards + profile.
 * Uses optimistic state via `useSavedCoaches` (saved_items table), plays a
 * light haptic on native, and carries an aria-label for screen readers.
 */
export const CoachHeartButton = ({
  coachId,
  coachName,
  size = "md",
  className = "",
  stopPropagation = true,
}: CoachHeartButtonProps) => {
  const { isCoachSaved, toggleSave } = useSavedCoaches();
  const { tap } = useHaptics();
  const saved = isCoachSaved(coachId);
  const s = SIZES[size];

  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        tap("light");
        toggleSave(coachId, coachName);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${coachName || "coach"} from saved` : `Save ${coachName || "coach"}`}
      className={`${s.btn} rounded-full flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm ${
        saved
          ? "bg-[#ff4d6d]/90 text-white shadow-lg shadow-[#ff4d6d]/30"
          : "bg-black/40 text-white hover:bg-black/55"
      } ${className}`}
    >
      <Heart
        className={`${s.icon} transition-all ${saved ? "fill-current scale-105" : ""}`}
        strokeWidth={saved ? 2 : 2}
      />
    </button>
  );
};

export default CoachHeartButton;
