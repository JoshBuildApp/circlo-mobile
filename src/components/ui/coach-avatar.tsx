import { memo, useState, useCallback } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { unsplashUrl } from "@/lib/image-utils";

interface CoachAvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "h-8 w-8 text-[10px]",
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-lg",
} as const;

const pxMap = { xs: 32, sm: 40, md: 56, lg: 80 } as const;

const isValidSrc = (s?: string | null): s is string =>
  !!s && s.trim() !== "" && !(/\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(s));

/**
 * Reliable avatar component with 3-tier fallback:
 * 1. Image (optimized for size)
 * 2. Initial letter from name
 * 3. Generic user icon
 */
const CoachAvatar = memo(({ src, name, size = "sm", className }: CoachAvatarProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const valid = isValidSrc(src) && !imgFailed;

  const handleError = useCallback(() => setImgFailed(true), []);

  const initial = name?.trim()?.[0]?.toUpperCase();
  const px = pxMap[size];
  const optimized = valid ? unsplashUrl(src, px * 2) : undefined;

  return (
    <div className={cn("rounded-full overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0", sizeMap[size], className)}>
      {valid ? (
        <img
          src={optimized}
          alt={name || "Avatar"}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={handleError}
        />
      ) : initial ? (
        <span className="font-bold text-primary select-none">{initial}</span>
      ) : (
        <User className="h-1/2 w-1/2 text-muted-foreground/40" />
      )}
    </div>
  );
});

CoachAvatar.displayName = "CoachAvatar";

export { CoachAvatar };
export type { CoachAvatarProps };
