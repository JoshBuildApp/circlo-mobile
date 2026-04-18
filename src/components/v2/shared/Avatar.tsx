import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type GradientKey = "teal-gold" | "orange-peach" | "teal-mint" | "gold-teal";

interface AvatarProps {
  size?: number;
  gradient?: GradientKey;
  initials?: string;
  online?: boolean;
  verified?: boolean;
  className?: string;
  onClick?: () => void;
}

const gradients: Record<GradientKey, string> = {
  "teal-gold": "linear-gradient(135deg, #00D4AA, #ffd97a)",
  "orange-peach": "linear-gradient(135deg, #FF6B2C, #ff9d6c)",
  "teal-mint": "linear-gradient(135deg, #00D4AA, #3dd9b1)",
  "gold-teal": "linear-gradient(135deg, #ffd97a, #00D4AA)",
};

export function Avatar({
  size = 40,
  gradient = "teal-gold",
  initials,
  online,
  verified,
  className,
  onClick,
}: AvatarProps) {
  const badgeSize = Math.max(10, Math.round(size * 0.22));
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative shrink-0 rounded-full flex items-center justify-center font-bold text-navy-deep",
        onClick && "cursor-pointer",
        className
      )}
      style={{ width: size, height: size, background: gradients[gradient] }}
    >
      {initials && <span style={{ fontSize: Math.round(size * 0.36) }}>{initials}</span>}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-teal border-2 border-navy-deep"
          style={{ width: badgeSize, height: badgeSize }}
          aria-label="Online"
        />
      )}
      {verified && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-teal border-2 border-navy-deep flex items-center justify-center text-navy-deep"
          style={{ width: badgeSize + 4, height: badgeSize + 4 }}
          aria-label="Verified"
        >
          <Check size={Math.max(10, Math.round(size * 0.2))} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}
