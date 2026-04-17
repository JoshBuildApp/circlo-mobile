import { Link } from "react-router-dom";
import { Star, CheckCircle2, Sparkles, Flame, Users, Bookmark, Calendar, MapPin, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSavedItems } from "@/hooks/use-saved-items";
import {
  formatSlotDay,
  formatSlotTime,
  type AvailabilityPreviewMap,
} from "@/hooks/use-coach-availability-preview";
import { haversineKm, type LatLng } from "@/lib/geocode";
import type { DiscoverCoach } from "@/hooks/use-discover-coaches";
import { CoachPreviewHover } from "@/components/discover/CoachPreviewHover";

interface DiscoverGridProps {
  coaches: DiscoverCoach[];
  availability: AvailabilityPreviewMap;
  userCoords: LatLng | null;
  onBook: (coach: DiscoverCoach) => void;
  totalMatches: number;
  videoCoachIds?: Set<string>;
}

export function DiscoverGrid({
  coaches,
  availability,
  userCoords,
  onBook,
  totalMatches,
  videoCoachIds,
}: DiscoverGridProps) {
  const { t } = useTranslation();
  const { isItemSaved, saveItem, unsaveItem } = useSavedItems();

  const handleSave = async (coachId: string, saved: boolean) => {
    try {
      if (saved) {
        await unsaveItem.mutateAsync(coachId);
        toast.success(t("discover.grid.removedToast"));
      } else {
        await saveItem.mutateAsync({ contentId: coachId, collectionName: "Coaches" });
        toast.success(t("discover.grid.savedToast"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save";
      toast.error(msg === "Must be logged in" ? t("discover.grid.signInToSave") : t("discover.grid.saveFailed"));
    }
  };

  return (
    <section className="px-4 md:px-8 lg:px-12 xl:px-16 pt-10 md:pt-14 pb-2">
      {/* Section header — desktop cinematic */}
      <div className="hidden md:flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">
            {t("discover.grid.kicker")}
          </div>
          <h3 className="mt-2 text-[30px] font-extrabold tracking-tight text-foreground">
            <span className="text-muted-foreground/60 font-semibold">
              {t("discover.grid.browseCount", { count: totalMatches })}
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground font-medium">
          <span>
            {t("discover.grid.showing")}{" "}
            <b className="text-foreground font-semibold">
              1–{Math.min(coaches.length, totalMatches)}
            </b>
          </span>
          <span className="opacity-40">·</span>
          <span>
            {t("discover.grid.updated")} <b className="text-foreground font-semibold">{t("discover.grid.justNow")}</b>
          </span>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">{t("discover.grid.browseCoaches")}</h3>
        <span className="text-[11px] text-muted-foreground">
          {t("discover.grid.coachCount", { count: totalMatches })}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {coaches.map((c) => {
          const saved = isItemSaved(c.id);
          const slots = availability[c.id] || [];
          const distance =
            userCoords && c.coords ? Math.round(haversineKm(userCoords, c.coords)) : null;
          const hasVideo = videoCoachIds?.has(c.id) ?? false;

          return (
            <CoachPreviewHover
              key={c.id}
              coach={c}
              availability={availability}
              userCoords={userCoords}
              onBook={onBook}
            >
              <div className="group cursor-pointer">
                <Link to={`/coach/${c.id}`} className="block">
                  <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden bg-secondary shadow-card transition-all duration-300 group-hover:shadow-elevated group-hover:-translate-y-1">
                    {c.image ? (
                      <SafeImage
                        src={c.image}
                        alt={c.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                        loading="lazy"
                        fallbackIcon={<Users className="h-10 w-10 text-muted-foreground/20" />}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Users className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 40%, rgba(26,26,46,0.75) 100%)",
                      }}
                    />

                    {/* Verified chip */}
                    {c.isVerified && (
                      <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1 h-[22px] pl-2 pr-2.5 rounded-full bg-success text-white text-[11px] font-bold shadow-card">
                        <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
                        {t("discover.grid.verified")}
                      </span>
                    )}

                    {/* Boosted/Pro badges — fallback when no verified */}
                    {!c.isVerified && (c.isBoosted || c.isPro) && (
                      <span
                        className={cn(
                          "absolute top-3.5 left-3.5 inline-flex items-center gap-1 h-[22px] px-2.5 rounded-full text-[11px] font-bold shadow-card",
                          c.isBoosted
                            ? "bg-accent text-accent-foreground"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {c.isBoosted ? (
                          <>
                            <Flame className="h-3 w-3" />
                            {t("discover.grid.featured")}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            {t("discover.grid.pro")}
                          </>
                        )}
                      </span>
                    )}

                    {/* Save button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSave(c.id, saved);
                      }}
                      aria-label={saved ? t("discover.grid.unsaveCoach") : t("discover.grid.saveCoach")}
                      className={cn(
                        "absolute top-3 right-3 h-9 w-9 rounded-full backdrop-blur flex items-center justify-center active:scale-90 transition-all shadow-card",
                        saved
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/95 text-[#1A1A2E] hover:bg-white hover:scale-[1.08]",
                      )}
                    >
                      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
                    </button>

                    {/* Distance pill */}
                    {distance != null && (
                      <div className="absolute top-[58px] right-3 inline-flex items-center gap-1 h-[22px] px-2.5 rounded-full bg-white/95 backdrop-blur text-[11px] font-semibold text-[#1A1A2E] shadow-card">
                        <MapPin className="h-3 w-3" />
                        {distance} {t("discover.filter.kmShort")}
                      </div>
                    )}

                    {/* Intro video indicator */}
                    {hasVideo && (
                      <div
                        aria-hidden
                        className="absolute top-[58px] left-3 h-[30px] w-[30px] rounded-full bg-white/95 backdrop-blur grid place-items-center shadow-card"
                      >
                        <Play className="h-3.5 w-3.5 text-[#1A1A2E] fill-[#1A1A2E] ml-0.5" />
                      </div>
                    )}

                    {/* Bottom info */}
                    <div className="absolute left-4 right-4 bottom-4 text-white">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[17px] font-bold tracking-tight truncate">{c.name}</p>
                      </div>
                      <p className="text-[12.5px] text-white/80 mt-0.5 font-medium capitalize truncate">
                        {c.sport ? t(`sports.${c.sport.toLowerCase()}`, { defaultValue: c.sport }) : t("nav.coachDashboard")}
                      </p>
                      <div className="flex items-center justify-between mt-2.5 text-[13px] font-semibold">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {c.rating.toFixed(1)}
                          {c.followers > 0 && (
                            <span className="opacity-60 font-medium">({c.followers})</span>
                          )}
                        </span>
                        <span className="font-extrabold text-white">
                          ₪{c.price}
                          <span className="font-medium opacity-70 text-[11px]">{t("discover.grid.perHr")}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Availability slots — rendered below card to match mockup */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {slots.length > 0 ? (
                    slots.slice(0, 3).map((s, idx) => (
                      <button
                        key={`${s.coach_id}-${idx}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onBook(c);
                        }}
                        className={cn(
                          "inline-flex items-center h-[30px] px-2.5 rounded-[10px] text-[11.5px] font-semibold bg-card border border-border/60 text-foreground transition-all hover:border-primary hover:text-primary",
                          idx === 0 && "bg-primary/[0.08] border-primary/25 text-primary",
                        )}
                      >
                        {formatSlotDay(s.day_of_week)} {formatSlotTime(s.start_time)}
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onBook(c);
                      }}
                      className="inline-flex items-center gap-1 h-[30px] px-2.5 rounded-[10px] bg-secondary text-[11.5px] font-semibold text-muted-foreground active:scale-95 transition-all"
                    >
                      <Calendar className="h-3 w-3" />
                      {t("discover.grid.checkAvailability")}
                    </button>
                  )}
                </div>
              </div>
            </CoachPreviewHover>
          );
        })}
      </div>
    </section>
  );
}
