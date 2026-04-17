import { useMemo } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DiscoverCoach } from "@/hooks/use-discover-coaches";

interface DiscoverHeroStripProps {
  coaches: DiscoverCoach[];
  totalMatches: number;
}

export function DiscoverHeroStrip({ coaches, totalMatches }: DiscoverHeroStripProps) {
  const { t } = useTranslation();
  const stats = useMemo(() => {
    const verified = coaches.filter((c) => c.isVerified).length;
    const avg = coaches.length
      ? coaches.reduce((a, c) => a + c.rating, 0) / coaches.length
      : 0;
    const sports = new Set(
      coaches.map((c) => c.sport.toLowerCase().trim()).filter(Boolean),
    );
    return { verified, avg, sportsCount: sports.size };
  }, [coaches]);

  const verifiedLabel = stats.verified || totalMatches;
  const sportsLabel = stats.sportsCount || 12;

  return (
    <section className="hidden md:flex items-end justify-between gap-10 px-8 lg:px-12 xl:px-16 pt-11 pb-8">
      <div>
        <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[0.95] text-foreground">
          {t("discover.hero.headline")} <span className="text-primary">{t("discover.hero.headlineAccent")}</span>
        </h1>
        <p className="mt-4 text-[17px] text-muted-foreground max-w-[520px] leading-snug font-medium">
          <span className="text-foreground font-semibold">
            {t("discover.hero.verifiedCoaches", { count: verifiedLabel })}
          </span>{" "}
          {t("discover.hero.subheadlineSuffix", { sportsLabel })}
        </p>
      </div>
      <div className="flex gap-3">
        <StatCard value={totalMatches.toLocaleString()} valueAccent label={t("discover.hero.coachesAvailable")} />
        <StatCard
          value={
            <span className="inline-flex items-center gap-2">
              {stats.avg > 0 ? stats.avg.toFixed(1) : "—"}
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </span>
          }
          label={t("discover.hero.avgRating")}
        />
        <StatCard value={t("discover.hero.twoMin")} label={t("discover.hero.responseTime")} />
      </div>
    </section>
  );
}

function StatCard({
  value,
  valueAccent = false,
  label,
}: {
  value: React.ReactNode;
  valueAccent?: boolean;
  label: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-card px-5 py-4 min-w-[170px]">
      <div
        className={
          "text-[28px] font-bold tracking-tight leading-none " +
          (valueAccent ? "text-primary" : "text-foreground")
        }
      >
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
