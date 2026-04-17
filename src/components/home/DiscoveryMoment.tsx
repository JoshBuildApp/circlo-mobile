import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Flame, Sparkles, TrendingUp, ChevronRight, Star, Users, CheckCircle2 } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { resolveCoachImage } from "@/lib/coach-placeholders";
import type { HomeCoach } from "@/hooks/use-home-data";

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : n.toString();

interface DiscoveryMomentProps {
  type: "trending" | "new" | "because";
  title: string;
  subtitle?: string;
  coaches: HomeCoach[];
}

const iconMap = {
  trending: Flame,
  new: Sparkles,
  because: TrendingUp,
};

const colorMap = {
  trending: "text-destructive",
  new: "text-accent",
  because: "text-primary",
};

const DiscoveryMoment = forwardRef<HTMLDivElement, DiscoveryMomentProps>(({ type, title, subtitle, coaches }, ref) => {
  if (coaches.length === 0) return null;

  const Icon = iconMap[type];

  return (
    <div ref={ref} className="col-span-full py-4 px-4 md:px-6 lg:px-8 bg-secondary/30 border-y border-border/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colorMap[type]}`} />
          <div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <Link to="/discover" className="flex items-center gap-0.5 text-[11px] text-primary font-semibold">
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex w-full max-w-full gap-3 md:gap-4 overflow-x-auto hide-scrollbar pb-1 md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-visible">
        {coaches.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            to={`/coach/${c.id}`}
            className="flex-shrink-0 w-[130px] md:w-full active:scale-[0.97] transition-transform"
          >
            <div className="relative h-[130px] md:h-[160px] w-full rounded-2xl overflow-hidden bg-secondary mb-2">
              <SafeImage
                src={resolveCoachImage(c.image_url, c.id)}
                alt={c.coach_name}
                className="h-full w-full object-cover"
                loading="lazy"
                displayWidth={200}
                srcSetWidths={[130, 260]}
                sizes="130px"
                fallbackIcon={<Users className="h-8 w-8 text-muted-foreground/15" />}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {c.is_verified && (
                <div className="absolute top-2 right-2 bg-primary rounded-full p-[3px]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <Star className="h-2.5 w-2.5 text-accent fill-accent" />
                <span className="text-[9px] text-white font-bold">{c.rating || 5}</span>
              </div>
            </div>
            <p className="text-[11px] font-bold text-foreground truncate">{c.coach_name}</p>
            <p className="text-[9px] text-muted-foreground">{c.sport} · {fmt(c.followers || 0)} fans</p>
          </Link>
        ))}
      </div>
    </div>
  );
});

DiscoveryMoment.displayName = "DiscoveryMoment";

export default DiscoveryMoment;
