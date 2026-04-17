import { AlertTriangle, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { DISCOVER_SPORTS } from "./DiscoverHeader";

export function DiscoverLoading() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[280px] w-[220px] rounded-2xl flex-shrink-0" />
        ))}
      </div>
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

interface DiscoverErrorProps {
  error: Error;
  onRetry: () => void;
}

export function DiscoverError({ error, onRetry }: DiscoverErrorProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{t("discover.states.couldNotLoad")}</h3>
      <p className="text-xs text-muted-foreground mb-6 max-w-xs">
        {error.message || t("discover.states.fetchFailed")}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all"
      >
        {t("discover.states.tryAgain")}
      </button>
    </div>
  );
}

interface DiscoverEmptyProps {
  isFiltered: boolean;
  onClearFilters: () => void;
  onPickSport: (sport: string) => void;
}

export function DiscoverEmpty({ isFiltered, onClearFilters, onPickSport }: DiscoverEmptyProps) {
  const { t } = useTranslation();
  return (
    <div className="px-4 py-12 text-center">
      <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
      <h3 className="text-base font-bold text-foreground mb-1">{t("discover.noResults")}</h3>
      <p className="text-xs text-muted-foreground mb-6">
        {isFiltered ? t("discover.tryAdjusting") : t("discover.tryDifferent")}
      </p>
      {isFiltered && (
        <button
          onClick={onClearFilters}
          className="mb-4 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all"
        >
          {t("discover.clearAllFilters")}
        </button>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {DISCOVER_SPORTS.slice(0, 4).map((c) => (
          <button
            key={c}
            onClick={() => onPickSport(c)}
            className="px-4 py-2 rounded-full bg-secondary text-xs font-semibold text-foreground active:scale-95 transition-all"
          >
            {t(`sports.${c.toLowerCase()}`, { defaultValue: c })}
          </button>
        ))}
      </div>
    </div>
  );
}
