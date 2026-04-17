import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  CheckCircle2,
  MapPin,
  Play,
  Users,
  ArrowRight,
  Bookmark,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSavedItems } from "@/hooks/use-saved-items";
import type { DiscoverCoach } from "@/hooks/use-discover-coaches";
import {
  formatSlotDay,
  formatSlotTime,
  type AvailabilityPreviewMap,
} from "@/hooks/use-coach-availability-preview";
import { haversineKm, type LatLng } from "@/lib/geocode";
import { SPORT_ICONS } from "@/components/discover/DiscoverHeader";
import {
  useCoachTrailer,
  isTrailerVideo,
  type CoachTrailerItem,
} from "@/hooks/use-coach-trailer";

interface CoachPreviewHoverProps {
  coach: DiscoverCoach;
  availability: AvailabilityPreviewMap;
  userCoords: LatLng | null;
  onPlayVideo?: (coach: DiscoverCoach) => void;
  onBook?: (coach: DiscoverCoach) => void;
  children: ReactNode;
}

/**
 * Rich hover preview for a coach card. Matches the Circlo Discover mockup:
 * 16:10 cover with optional play button + avatar overlap, then body with
 * bio, sport tags, next-available session options, and two actions
 * (save + view full profile). Wraps a shadcn HoverCard so it only fires
 * on devices with hover (no effect on touch).
 */
export function CoachPreviewHover({
  coach,
  availability,
  userCoords,
  onPlayVideo,
  onBook,
  children,
}: CoachPreviewHoverProps) {
  const { isItemSaved, saveItem, unsaveItem } = useSavedItems();
  const [hoverOpen, setHoverOpen] = useState(false);
  const slots = availability[coach.id] || [];
  const distance =
    userCoords && coach.coords ? Math.round(haversineKm(userCoords, coach.coords)) : null;
  const saved = isItemSaved(coach.id);
  const sportKey = coach.sport.toLowerCase().trim();
  const sportIcon = SPORT_ICONS[coach.sport] || SPORT_ICONS[sportKey] || "🏅";

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (saved) {
        await unsaveItem.mutateAsync(coach.id);
        toast.success("Removed from saved");
      } else {
        await saveItem.mutateAsync({ contentId: coach.id, collectionName: "Coaches" });
        toast.success("Saved");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save";
      toast.error(msg === "Must be logged in" ? "Sign in to save coaches" : "Save failed");
    }
  };

  return (
    <HoverCard openDelay={450} closeDelay={120} onOpenChange={setHoverOpen}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={16}
        collisionPadding={20}
        className="w-[360px] p-0 overflow-hidden rounded-[22px] border border-border/50 bg-card shadow-elevated"
      >
        {/* Cover strip — rotates through coach's pinned videos/photos */}
        <div className="relative aspect-[16/10] bg-secondary overflow-hidden">
          <TrailerCarousel
            coachId={coach.id}
            fallbackImage={coach.image}
            name={coach.name}
            enabled={hoverOpen}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 50%, rgba(26,26,46,0.75) 100%)",
            }}
          />
          {onPlayVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPlayVideo(coach);
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/95 backdrop-blur shadow-elevated flex items-center justify-center hover:scale-[1.05] transition-transform z-10"
              aria-label="Watch intro"
            >
              <Play className="h-6 w-6 text-[#1A1A2E] fill-[#1A1A2E] ml-1" />
            </button>
          )}

          {/* Avatar — bottom-left overlap */}
          {coach.image && (
            <div className="absolute left-4 -bottom-[22px] z-10">
              <div className="h-14 w-14 rounded-full overflow-hidden border-[3px] border-card shadow-card">
                <SafeImage
                  src={coach.image}
                  alt={coach.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-[18px] pt-[30px] pb-[18px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[19px] font-extrabold tracking-tight text-foreground truncate">
                  {coach.name}
                </h3>
                {coach.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                )}
              </div>
              <p className="text-[12.5px] text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {coach.location || "Israel"}
                {distance != null && (
                  <>
                    <span className="opacity-50">·</span>
                    <span>{distance} km away</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[13px] font-bold text-foreground shrink-0">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              {coach.rating.toFixed(1)}
              {coach.followers > 0 && (
                <span className="text-muted-foreground font-medium ml-0.5">
                  ({coach.followers})
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {coach.tagline && (
            <p className="mt-3 text-[13px] leading-[1.55] text-foreground/70 line-clamp-3">
              {coach.tagline}
            </p>
          )}

          {/* Sport tag chips */}
          <div className="flex items-center gap-1.5 mt-3.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 h-7 px-[11px] rounded-full bg-secondary border border-border/50 text-[11.5px] font-semibold text-foreground/80">
              <span className="text-[13px] leading-none">{sportIcon}</span>
              <span className="capitalize">{coach.sport || "Coaching"}</span>
            </span>
            {coach.isPro && (
              <span className="inline-flex items-center gap-1 h-7 px-[11px] rounded-full bg-primary/10 border border-primary/20 text-[11.5px] font-bold text-primary">
                PRO
              </span>
            )}
          </div>

          {/* Next available */}
          {slots.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <h5 className="text-[10.5px] tracking-[0.14em] uppercase font-bold text-muted-foreground mb-2.5">
                Next available
              </h5>
              <div className="flex items-center gap-1.5 flex-wrap">
                {slots.slice(0, 3).map((s, idx) => (
                  <button
                    key={`${s.coach_id}-${idx}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onBook?.(coach);
                    }}
                    className={cn(
                      "inline-flex items-center h-[28px] px-2.5 rounded-[10px] text-[11.5px] font-semibold transition-all",
                      idx === 0
                        ? "bg-primary/[0.08] border border-primary/25 text-primary"
                        : "bg-card border border-border/60 text-foreground/80 hover:border-primary hover:text-primary",
                    )}
                  >
                    {formatSlotDay(s.day_of_week)} {formatSlotTime(s.start_time)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-[18px] flex items-center gap-2">
            <Link
              to={`/coach/${coach.id}`}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-[13.5px] flex items-center justify-center gap-1.5 shadow-[0_8px_22px_-6px_rgba(255,107,44,0.5)] hover:bg-primary/90 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              View full profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleSave}
              aria-label={saved ? "Unsave coach" : "Save coach"}
              className={cn(
                "h-11 w-11 rounded-xl border border-border/60 flex items-center justify-center transition-all active:scale-95",
                saved
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-foreground hover:border-primary hover:text-primary",
              )}
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
            </button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * Mini-trailer that cycles through a coach's pinned videos/photos in the
 * hover preview cover area. Only fetches when `enabled` (the popover is
 * actually open) so we don't fire N queries on page render.
 */
function TrailerCarousel({
  coachId,
  fallbackImage,
  name,
  enabled,
}: {
  coachId: string;
  fallbackImage: string;
  name: string;
  enabled: boolean;
}) {
  const { items } = useCoachTrailer(coachId, enabled);
  const [idx, setIdx] = useState(0);

  // Reset index whenever the popover re-opens on a new coach
  useEffect(() => {
    setIdx(0);
  }, [coachId, enabled]);

  // Cycle every 2.5s across the pinned items. Videos are muted and
  // usually loop, but we still advance after 2.5s so mixed photo/video
  // trailers keep moving.
  useEffect(() => {
    if (!enabled) return;
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 2500);
    return () => clearInterval(t);
  }, [enabled, items.length]);

  // Nothing loaded yet or no media — show static fallback
  if (!enabled || items.length === 0) {
    return fallbackImage ? (
      <SafeImage
        src={fallbackImage}
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
        fallbackIcon={<Users className="h-10 w-10 text-muted-foreground/20" />}
      />
    ) : (
      <div className="h-full w-full flex items-center justify-center">
        <Users className="h-10 w-10 text-muted-foreground/20" />
      </div>
    );
  }

  const current = items[idx];

  return (
    <>
      <TrailerFrame item={current} fallbackImage={fallbackImage} name={name} />
      {items.length > 1 && (
        <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === idx ? "w-5 bg-white" : "w-1 bg-white/50",
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}

function TrailerFrame({
  item,
  fallbackImage,
  name,
}: {
  item: CoachTrailerItem;
  fallbackImage: string;
  name: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = isTrailerVideo(item);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  }, [item.id]);

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        key={item.id}
        src={item.media_url}
        poster={item.thumbnail_url || fallbackImage || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover animate-fade-in"
      />
    );
  }

  return (
    <SafeImage
      key={item.id}
      src={item.thumbnail_url || item.media_url || fallbackImage}
      alt={item.title || name}
      className="absolute inset-0 h-full w-full object-cover animate-fade-in"
      loading="lazy"
      fallbackIcon={<Users className="h-10 w-10 text-muted-foreground/20" />}
    />
  );
}
