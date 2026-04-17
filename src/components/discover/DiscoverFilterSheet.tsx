import { useEffect, useState } from "react";
import { X, MapPin, Star, Calendar, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DISCOVER_FILTERS,
  type DiscoverFilters,
} from "@/hooks/use-discover-coaches";
import { DISCOVER_SPORTS, SPORT_ICONS } from "./DiscoverHeader";

const AVAILABILITY_OPTIONS = [
  { labelKey: "discover.filter.anyTime", value: "any" },
  { labelKey: "discover.filter.today", value: "today" },
  { labelKey: "discover.filter.thisWeek", value: "week" },
] as const;

interface DiscoverFilterSheetProps {
  open: boolean;
  filters: DiscoverFilters;
  userCoords: [number, number] | null;
  locationDenied: boolean;
  onRequestLocation: () => void;
  onApply: (next: DiscoverFilters) => void;
  onClose: () => void;
}

export function DiscoverFilterSheet({
  open,
  filters,
  userCoords,
  locationDenied,
  onRequestLocation,
  onApply,
  onClose,
}: DiscoverFilterSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DiscoverFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  if (!open) return null;

  const toggleSport = (sport: string) => {
    setDraft((prev) => ({
      ...prev,
      sport: prev.sport === sport ? null : sport,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-label={t("discover.filters")}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl animate-slide-up safe-area-bottom"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background rounded-t-3xl z-10 px-5 pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{t("discover.filters")}</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-all"
              aria-label={t("discover.closeFilters")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="overflow-y-auto px-5 pb-6"
          style={{ maxHeight: "calc(88vh - 130px)" }}
        >
          {/* SPORT (single-select matches the chip row for one source of truth) */}
          <div className="mb-7">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              {t("discover.filter.sport")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {DISCOVER_SPORTS.map((sport) => {
                const selected = draft.sport === sport;
                return (
                  <button
                    key={sport}
                    onClick={() => toggleSport(sport)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95",
                      selected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <span>{SPORT_ICONS[sport] || "🏅"}</span>
                    {t(`sports.${sport.toLowerCase()}`, { defaultValue: sport })}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BUDGET */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {t("discover.filter.budget")}
              </h3>
              <span className="text-xs font-bold text-primary">
                ₪{draft.priceMin} – ₪{draft.priceMax}
              </span>
            </div>
            <div className="px-1">
              <Slider
                min={0}
                max={500}
                step={10}
                value={[draft.priceMin, draft.priceMax]}
                onValueChange={(val) =>
                  setDraft((p) => ({ ...p, priceMin: val[0], priceMax: val[1] }))
                }
                className="w-full"
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">₪0</span>
              <span className="text-[10px] text-muted-foreground">₪500</span>
            </div>
          </div>

          {/* RATING */}
          <div className="mb-7">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              {t("discover.filter.minRating")}
            </h3>
            <div className="flex gap-2">
              {[
                { label: t("discover.filter.any"), value: 0 },
                { label: "3.0+", value: 3 },
                { label: "4.0+", value: 4 },
                { label: "4.5+", value: 4.5 },
                { label: "5.0", value: 5 },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setDraft((p) => ({ ...p, minRating: r.value }))}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1",
                    draft.minRating === r.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {r.value > 0 && <Star className="h-3 w-3 fill-current" />}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="mb-7">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              {t("discover.filter.availability")}
            </h3>
            <div className="flex gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDraft((p) => ({ ...p, availability: opt.value }))}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5",
                    draft.availability === opt.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {opt.value !== "any" && <Calendar className="h-3 w-3" />}
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* NEAR ME */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {t("discover.filter.distance")}
              </h3>
              {userCoords ? (
                <span className="text-xs font-bold text-primary">
                  {draft.maxDistanceKm == null ? t("discover.filter.any") : `≤ ${draft.maxDistanceKm} ${t("discover.filter.kmShort")}`}
                </span>
              ) : (
                <button
                  onClick={onRequestLocation}
                  disabled={locationDenied}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary active:scale-95 disabled:text-muted-foreground"
                >
                  <Navigation className="h-3 w-3" />
                  {locationDenied ? t("discover.filter.permissionDenied") : t("discover.filter.useMyLocation")}
                </button>
              )}
            </div>
            {userCoords && (
              <div className="px-1">
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={[draft.maxDistanceKm ?? 100]}
                  onValueChange={(val) =>
                    setDraft((p) => ({ ...p, maxDistanceKm: val[0] === 100 ? null : val[0] }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{t("discover.filter.kmStart")}</span>
                  <span className="text-[10px] text-muted-foreground">{t("discover.filter.any")}</span>
                </div>
              </div>
            )}
          </div>

          {/* LOCATION */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              {t("discover.filter.city")}
            </h3>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                value={draft.location}
                onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
                placeholder={t("discover.filter.cityPlaceholder")}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {draft.location && (
                <button
                  onClick={() => setDraft((p) => ({ ...p, location: "" }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 flex items-center justify-center"
                  aria-label={t("discover.filter.clearLocation")}
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border/10 px-5 py-4 safe-area-bottom">
          <div className="flex gap-3">
            <button
              onClick={() =>
                setDraft({ ...DEFAULT_DISCOVER_FILTERS, searchQuery: draft.searchQuery })
              }
              className="flex-1 h-12 rounded-2xl bg-secondary text-sm font-bold text-muted-foreground active:scale-95 transition-all"
            >
              {t("discover.clearAll")}
            </button>
            <button
              onClick={() => onApply(draft)}
              className="flex-[2] h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all shadow-sm"
            >
              {t("discover.applyFilters")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
