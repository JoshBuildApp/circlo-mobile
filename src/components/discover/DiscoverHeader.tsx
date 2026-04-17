import { useEffect, useRef, useState } from "react";
import { Search, X, SlidersHorizontal, List, Map as MapIcon, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DiscoverFilters, DiscoverSort } from "@/hooks/use-discover-coaches";

export const DISCOVER_SPORTS = [
  "Padel",
  "Fitness",
  "Basketball",
  "Tennis",
  "Boxing",
  "Soccer",
  "Yoga",
  "Swimming",
] as const;

export const SPORT_ICONS: Record<string, string> = {
  All: "🔥",
  Padel: "🎾",
  Fitness: "💪",
  Basketball: "🏀",
  Tennis: "🎾",
  Boxing: "🥊",
  Soccer: "⚽",
  Yoga: "🧘",
  Swimming: "🏊",
};

const CATEGORIES = ["All", ...DISCOVER_SPORTS];

const SORT_OPTIONS: { value: DiscoverSort; labelKey: string }[] = [
  { value: "relevance", labelKey: "discover.sort.relevance" },
  { value: "nearest", labelKey: "discover.sort.nearest" },
  { value: "top_rated", labelKey: "discover.sort.topRated" },
  { value: "price_asc", labelKey: "discover.sort.priceAsc" },
  { value: "price_desc", labelKey: "discover.sort.priceDesc" },
  { value: "newest", labelKey: "discover.sort.newest" },
];

export function activeFilterCount(f: DiscoverFilters): number {
  let c = 0;
  if (f.sport) c++;
  if (f.priceMin > 0 || f.priceMax < 500) c++;
  if (f.minRating > 0) c++;
  if (f.location.trim()) c++;
  if (f.availability !== "any") c++;
  if (f.maxDistanceKm != null) c++;
  return c;
}

interface DiscoverHeaderProps {
  filters: DiscoverFilters;
  onChange: (next: DiscoverFilters | ((prev: DiscoverFilters) => DiscoverFilters)) => void;
  onOpenFilters: () => void;
  onToggleMap: () => void;
  viewMode: "list" | "map";
  onClearAll: () => void;
}

export function DiscoverHeader({
  filters,
  onChange,
  onOpenFilters,
  onToggleMap,
  viewMode,
  onClearAll,
}: DiscoverHeaderProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState(filters.searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [sortOpen, setSortOpen] = useState(false);
  const [sportsExpanded, setSportsExpanded] = useState(true);

  useEffect(() => {
    setLocal(filters.searchQuery);
  }, [filters.searchQuery]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (local === filters.searchQuery) return;
    debounceRef.current = setTimeout(() => {
      onChange((prev) => ({ ...prev, searchQuery: local }));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSport = (sport: string) => {
    onChange((prev) => ({ ...prev, sport: sport === "All" ? null : sport }));
    // Auto-collapse the row after a pick so the list tucks away
    setSportsExpanded(false);
  };

  const setSort = (sort: DiscoverSort) => {
    onChange((prev) => ({ ...prev, sort }));
    setSortOpen(false);
  };

  const filterCount = activeFilterCount(filters);
  const activeCategory = filters.sport ?? "All";

  const activeChips: { label: string; remove: () => void }[] = [];
  if (filters.sport) {
    activeChips.push({
      label: t(`sports.${filters.sport.toLowerCase()}`, { defaultValue: filters.sport }),
      remove: () => onChange((prev) => ({ ...prev, sport: null })),
    });
  }
  if (filters.priceMin > 0 || filters.priceMax < 500) {
    activeChips.push({
      label: `₪${filters.priceMin}–${filters.priceMax}`,
      remove: () => onChange((prev) => ({ ...prev, priceMin: 0, priceMax: 500 })),
    });
  }
  if (filters.minRating > 0) {
    activeChips.push({
      label: `${filters.minRating}+ ★`,
      remove: () => onChange((prev) => ({ ...prev, minRating: 0 })),
    });
  }
  if (filters.location.trim()) {
    activeChips.push({
      label: filters.location,
      remove: () => onChange((prev) => ({ ...prev, location: "" })),
    });
  }
  if (filters.availability !== "any") {
    activeChips.push({
      label: filters.availability === "today" ? t("discover.filter.today") : t("discover.filter.thisWeek"),
      remove: () => onChange((prev) => ({ ...prev, availability: "any" })),
    });
  }
  if (filters.maxDistanceKm != null) {
    activeChips.push({
      label: `≤ ${filters.maxDistanceKm} ${t("discover.filter.kmShort")}`,
      remove: () => onChange((prev) => ({ ...prev, maxDistanceKm: null })),
    });
  }

  const currentSort = SORT_OPTIONS.find((o) => o.value === filters.sort) ?? SORT_OPTIONS[0];
  const sportLabel = (sport: string) =>
    sport === "All" ? t("discover.all") : t(`sports.${sport.toLowerCase()}`, { defaultValue: sport });

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/40">
      {/* Row 1: search + right-side controls. No pills here. */}
      <div className="flex items-center gap-2 md:gap-3 px-4 md:px-8 lg:px-12 xl:px-16 pt-4 md:pt-[18px] pb-3">
        <div className="relative flex-1 min-w-0 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder={t("discover.searchPlaceholder")}
            aria-label={t("discover.searchAria")}
            className="w-full h-12 pl-11 pr-9 rounded-2xl md:rounded-[14px] bg-secondary/70 md:bg-background border border-border/40 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all"
          />
          {local && (
            <button
              onClick={() => {
                setLocal("");
                onChange((prev) => ({ ...prev, searchQuery: "" }));
              }}
              aria-label={t("discover.clearSearch")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 flex items-center justify-center"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort dropdown — desktop only */}
          <div className="hidden lg:block relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-card border border-border/60 text-[13px] font-medium text-foreground hover:border-foreground transition-all"
            >
              {t(currentSort.labelKey)}
              <ChevronDown
                className={cn("h-3.5 w-3.5 opacity-60 transition-transform", sortOpen && "rotate-180")}
              />
            </button>
            {sortOpen && (
              <>
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setSortOpen(false)}
                  aria-label={t("discover.closeSortMenu")}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl bg-card border border-border/40 shadow-elevated overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors",
                        filters.sort === opt.value
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-secondary/60",
                      )}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={onToggleMap}
            aria-label={viewMode === "list" ? t("discover.switchToMap") : t("discover.switchToList")}
            className={cn(
              "h-11 w-11 lg:w-auto lg:px-4 rounded-xl border border-border/60 flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0",
              viewMode === "map"
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-foreground",
            )}
          >
            {viewMode === "list" ? (
              <>
                <MapIcon className="h-4 w-4" />
                <span className="hidden lg:inline text-[13px] font-medium">{t("discover.map")}</span>
              </>
            ) : (
              <>
                <List className="h-4 w-4" />
                <span className="hidden lg:inline text-[13px] font-medium">{t("discover.list")}</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenFilters}
            aria-label={t("discover.openFilters")}
            className={cn(
              "relative h-11 w-11 lg:w-auto lg:px-4 rounded-xl border border-border/60 flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0",
              filterCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden lg:inline text-[13px] font-medium">{t("discover.filters")}</span>
            {filterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-primary border-2 border-card text-[11px] font-bold text-primary-foreground flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Row 2: Collapsible sport pill toggle */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-8 lg:px-12 xl:px-16 pb-2">
        <button
          onClick={() => setSportsExpanded((v) => !v)}
          aria-expanded={sportsExpanded}
          aria-controls="discover-sport-pills"
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <span>{t("discover.browseBySport")}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary normal-case tracking-normal text-[11px]">
            <span>{SPORT_ICONS[activeCategory] || "🏅"}</span>
            {sportLabel(activeCategory)}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              sportsExpanded ? "rotate-180" : "rotate-0",
            )}
          />
        </button>

        {/* Mobile sort pill — only on narrow screens where the sort dropdown is hidden */}
        <div className="lg:hidden relative">
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 text-xs font-semibold text-foreground active:scale-95 transition-all"
          >
            <span className="text-muted-foreground">{t("discover.sortLabel")}</span>
            {t(currentSort.labelKey)}
            <ChevronDown className={cn("h-3 w-3 transition-transform", sortOpen && "rotate-180")} />
          </button>
          {sortOpen && (
            <>
              <button
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setSortOpen(false)}
                aria-label={t("discover.closeSortMenu")}
              />
              <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl bg-card border border-border/40 shadow-xl overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-semibold transition-colors",
                      filters.sort === opt.value
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary/60",
                    )}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 3: Collapsible sport pills row */}
      <div
        id="discover-sport-pills"
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-250 ease-out",
          sportsExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex w-full max-w-full gap-2 overflow-x-auto hide-scrollbar px-4 md:px-8 lg:px-12 xl:px-16 pb-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSport(cat)}
                className={cn(
                  "flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-medium transition-all whitespace-nowrap active:scale-95",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground font-semibold shadow-[0_4px_14px_-2px_rgba(255,107,44,0.3)]"
                    : "bg-card border border-border/60 text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                <span className="text-[14px] leading-none">{SPORT_ICONS[cat] || "🏅"}</span>
                {sportLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active chips row */}
      {activeChips.length > 0 && (
        <div className="flex w-full max-w-full items-center gap-2 overflow-x-auto hide-scrollbar px-4 md:px-8 lg:px-12 xl:px-16 pb-3 md:pb-4">
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              onClick={chip.remove}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-primary/10 border border-primary/20 text-[12.5px] font-semibold text-primary active:scale-95 transition-all"
            >
              {chip.label}
              <X className="h-3 w-3 opacity-70" />
            </button>
          ))}
          <button
            onClick={onClearAll}
            className="ml-auto text-[12.5px] font-semibold text-destructive px-2 py-1 active:scale-95 shrink-0"
          >
            {t("discover.clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}
