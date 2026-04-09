import { useState, useCallback, useRef, memo, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { unsplashUrl, unsplashSrcSet } from "@/lib/image-utils";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Fallback element when image fails to load */
  fallbackIcon?: React.ReactNode;
  /** Optional fallback image URL (e.g. coach avatar) before showing icon */
  fallbackSrc?: string;
  /** Show skeleton shimmer while loading */
  showSkeleton?: boolean;
  /** Aspect ratio class for stable layout (e.g. "aspect-square") */
  wrapperClassName?: string;
  /** Disable download protection (right-click, drag, long-press). Default: true */
  protect?: boolean;
  /** Optimal display width in px — Unsplash URLs will be resized to match */
  displayWidth?: number;
  /** Custom srcset widths for responsive images (Unsplash only) */
  srcSetWidths?: number[];
}

const isValidUrl = (url: string | undefined): url is string =>
  !!url && url.trim() !== "" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") || url.startsWith("data:"));

/**
 * A resilient image component that:
 * - Validates URLs before rendering
 * - Shows skeleton shimmer during load
 * - Retries twice on failure
 * - Falls back to a clean placeholder (never a broken icon)
 * - Prevents layout shifts with stable dimensions
 * - Blocks right-click / drag / long-press download by default
 */
const SafeImage = memo(({
  src,
  alt = "",
  fallbackIcon,
  fallbackSrc,
  showSkeleton = true,
  className,
  wrapperClassName,
  protect = true,
  displayWidth,
  srcSetWidths,
  onError,
  onLoad,
  onContextMenu,
  draggable,
  style,
  sizes,
  ...props
}: SafeImageProps) => {
  const valid = isValidUrl(src);

  // Auto-optimize Unsplash URLs
  const optimizedSrc = valid && src && displayWidth
    ? unsplashUrl(src, displayWidth)
    : src;
  const computedSrcSet = valid && src && srcSetWidths
    ? unsplashSrcSet(src, srcSetWidths)
    : undefined;
  const [state, setState] = useState<"loading" | "loaded" | "error">(valid ? "loading" : "error");
  const retryCount = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const usedFallbackSrc = useRef(false);

  // Reset when src changes
  useEffect(() => {
    retryCount.current = 0;
    usedFallbackSrc.current = false;
    setState(isValidUrl(src) ? "loading" : "error");
  }, [src]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setState("loaded");
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Retry up to 2 times with cache-busting
      if (retryCount.current < 2 && isValidUrl(src)) {
        retryCount.current += 1;
        const sep = src.includes("?") ? "&" : "?";
        const retryUrl = `${src}${sep}_retry=${Date.now()}`;
        if (imgRef.current) {
          imgRef.current.src = retryUrl;
        }
        return;
      }

      // Try fallbackSrc once
      if (!usedFallbackSrc.current && fallbackSrc && isValidUrl(fallbackSrc) && imgRef.current) {
        usedFallbackSrc.current = true;
        retryCount.current = 0;
        imgRef.current.src = fallbackSrc;
        return;
      }

      setState("error");
      if (process.env.NODE_ENV !== "production") {
        console.warn("[SafeImage] Failed to load:", src);
      }
      onError?.(e);
    },
    [src, fallbackSrc, onError]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (protect) e.preventDefault();
      onContextMenu?.(e);
    },
    [protect, onContextMenu]
  );

  // Protection styles
  const protectStyles: React.CSSProperties = protect
    ? {
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        pointerEvents: "auto",
        ...style,
      } as React.CSSProperties
    : { ...style };

  const fallbackEl = (
    <div className={cn("flex items-center justify-center bg-secondary", wrapperClassName || className)}>
      {fallbackIcon || <ImageOff className="h-6 w-6 text-muted-foreground/30" />}
    </div>
  );

  if (!isValidUrl(src) && !isValidUrl(fallbackSrc)) {
    return fallbackEl;
  }

  if (state === "error") {
    return fallbackEl;
  }

  return (
    <div className={cn("relative", wrapperClassName)} style={{ display: "contents" }}>
      <img
        ref={imgRef}
        src={optimizedSrc}
        srcSet={computedSrcSet}
        sizes={sizes}
        alt={alt}
        className={cn(
          className,
          state === "loading" && "invisible",
          state === "loaded" && "animate-in fade-in duration-200"
        )}
        onLoad={handleLoad}
        onError={handleError}
        onContextMenu={handleContextMenu}
        draggable={draggable ?? (protect ? false : undefined)}
        style={protectStyles}
        {...props}
      />
    </div>
  );
});

SafeImage.displayName = "SafeImage";

export { SafeImage, isValidUrl };
export type { SafeImageProps };
