import { useRef } from "react";
import { Link } from "react-router-dom";
import { Star, CheckCircle2, Users, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { describeReason, type BecauseYouReason } from "@/hooks/use-because-you-rail";
import type { DiscoverCoach } from "@/hooks/use-discover-coaches";

interface DiscoverBecauseYouRailProps {
  coaches: DiscoverCoach[];
  reason: BecauseYouReason;
  videoCoachIds?: Set<string>;
}

export function DiscoverBecauseYouRail({
  coaches,
  reason,
  videoCoachIds,
}: DiscoverBecauseYouRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!reason || coaches.length === 0) return null;
  const label = describeReason(reason);
  const items = coaches.slice(0, 6);

  const scrollBy = (dir: "prev" | "next") => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rail-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  };

  return (
    <section className="px-4 md:px-8 lg:px-12 xl:px-16 pt-10 md:pt-14 pb-2">
      <div className="flex items-end justify-between mb-5 md:mb-6">
        <div>
          <div className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] font-bold text-primary capitalize">
            {label}
          </div>
          <h3 className="mt-2 text-xl md:text-3xl font-extrabold tracking-tight text-foreground">
            More coaches you'll love
          </h3>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy("prev")}
            aria-label="Scroll left"
            className="h-[42px] w-[42px] rounded-[12px] border border-border bg-card text-foreground grid place-items-center transition-all hover:border-foreground hover:-translate-y-0.5 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy("next")}
            aria-label="Scroll right"
            className="h-[42px] w-[42px] rounded-[12px] border border-border bg-card text-foreground grid place-items-center transition-all hover:border-foreground hover:-translate-y-0.5 active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 md:-mx-8 lg:-mx-12 xl:-mx-16 px-4 md:px-8 lg:px-12 xl:px-16 pb-2 scroll-smooth"
      >
        {items.map((c) => {
          const hasVideo = videoCoachIds?.has(c.id) ?? false;
          return (
            <Link
              key={c.id}
              to={`/coach/${c.id}`}
              data-rail-card
              className="snap-start flex-shrink-0 w-[180px] md:w-[calc((100%-5rem)/6)] rounded-[18px] overflow-hidden bg-card border border-border/50 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="relative aspect-square bg-secondary overflow-hidden">
                {c.image ? (
                  <SafeImage
                    src={c.image}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.05]"
                    loading="lazy"
                    fallbackIcon={<Users className="h-10 w-10 text-muted-foreground/20" />}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                {c.isVerified && (
                  <div className="absolute top-3 left-3 h-[22px] w-[22px] rounded-full bg-success grid place-items-center shadow-card">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
                {hasVideo && (
                  <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/95 backdrop-blur grid place-items-center shadow-card">
                    <Play className="h-3.5 w-3.5 text-[#1A1A2E] fill-[#1A1A2E] ml-0.5" />
                  </div>
                )}
              </div>
              <div className="px-4 py-3.5">
                <p className="text-[14px] font-bold tracking-tight text-foreground truncate">
                  {c.name}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5 capitalize truncate">
                  {c.sport || "Coaching"}
                </p>
                <div className="flex items-center justify-between mt-3 text-[12.5px]">
                  <span className="flex items-center gap-1 font-semibold text-foreground/80">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {c.rating.toFixed(1)}
                  </span>
                  <span className="font-bold text-primary">₪{c.price}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
