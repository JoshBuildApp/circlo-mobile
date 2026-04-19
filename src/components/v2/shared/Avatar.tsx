import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type GradientKey = "teal-gold" | "orange-peach" | "teal-mint" | "gold-teal";

interface AvatarProps {
  /** Image URL — when present, renders the photo with the gradient as placeholder behind. */
  src?: string;
  alt?: string;
  size?: number;
  gradient?: GradientKey;
  initials?: string;
  online?: boolean;
  verified?: boolean;
  className?: string;
  onClick?: () => void;
}

// Brand placeholder gradients. Constant across themes by design — the gradient
// IS the identity when no photo is available. Defined as CSS utility classes
// in index.css so the hex values live in one place.
const GRADIENT_CLASS: Record<GradientKey, string> = {
  "teal-gold": "v2-avatar-grad-award",
  "orange-peach": "v2-avatar-grad-orange",
  "teal-mint": "v2-avatar-grad-teal",
  "gold-teal": "v2-avatar-grad-award",
};

export function Avatar({
  src,
  alt = "",
  size = 40,
  gradient = "teal-gold",
  initials,
  online,
  verified,
  className,
  onClick,
}: AvatarProps) {
  const badgeSize = Math.max(10, Math.round(size * 0.22));
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(src) && !errored;
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "relative shrink-0 rounded-full flex items-center justify-center font-bold text-navy-deep overflow-hidden",
        GRADIENT_CLASS[gradient],
        onClick && "cursor-pointer",
        className
      )}
      style={{ width: size, height: size }}
    >
      {showImage && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {!showImage && initials && (
        <span style={{ fontSize: Math.round(size * 0.36) }}>{initials}</span>
      )}
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
