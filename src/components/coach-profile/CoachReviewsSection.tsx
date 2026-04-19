import { useMemo, useState } from "react";
import { Star, ThumbsUp, CheckCircle2, Image as ImageIcon, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCoachReviews,
  type Review,
  type RatingCategory,
  RATING_CATEGORY_LABELS,
} from "@/hooks/use-coach-reviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  coachId: string;
  coachName: string;
}

type Filter = "all" | "5" | "4" | "3-below" | "photos" | "recent" | "helpful";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  "5": "5 star",
  "4": "4 star",
  "3-below": "3 & below",
  photos: "With photos",
  recent: "Most recent",
  helpful: "Most helpful",
};

const PAGE_SIZE = 6;

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        style={{ width: size, height: size }}
        className={cn(
          "transition-colors",
          i < Math.round(value) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
        )}
      />
    ))}
  </div>
);

const CategoryBar = ({
  label, value, count,
}: { label: string; value: number; count: number }) => {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-muted-foreground w-[120px] flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden" role="progressbar"
        aria-label={`${label} ${value.toFixed(1)} out of 5`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={5}>
        <div
          className="h-full bg-gradient-kinetic rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-black text-foreground w-8 text-right">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
      {count > 0 && (
        <span className="text-[10px] text-muted-foreground/70 w-8 text-right hidden sm:block">
          ({count})
        </span>
      )}
    </div>
  );
};

const ReviewCard = ({
  review, coachName, isMarkedHelpful, onToggleHelpful,
}: {
  review: Review;
  coachName: string;
  isMarkedHelpful: boolean;
  onToggleHelpful: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const long = (review.comment?.length ?? 0) > 240;

  return (
    <article className="rounded-2xl bg-card border border-border/40 p-4">
      <header className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={review.reviewer_avatar || undefined} />
          <AvatarFallback className="bg-[#46f1c5]/10 text-[#46f1c5] font-bold">
            {review.reviewer_username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-foreground truncate">{review.reviewer_username}</p>
            {review.is_verified_booking && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[9px] font-black uppercase tracking-wider">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Verified booking
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars value={review.rating} size={12} />
            <span className="text-[11px] text-muted-foreground">{timeAgo(review.created_at)}</span>
            {review.session_type && (
              <span className="text-[10px] text-muted-foreground/60">· {review.session_type}</span>
            )}
          </div>
        </div>
      </header>

      {review.comment && (
        <div className="mt-3">
          <p className={cn("text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap",
            !expanded && long && "line-clamp-4")}>
            {review.comment}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#46f1c5]"
              aria-expanded={expanded}
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {review.photos && review.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {review.photos.slice(0, 4).map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt="Reviewer photo"
              className="h-20 w-20 rounded-xl object-cover flex-shrink-0 border border-border/30"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {review.coach_response && (
        <aside className="mt-3 ml-6 pl-4 border-l-2 border-[#46f1c5]/40 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#46f1c5] mb-1">
            Response from {coachName}
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{review.coach_response}</p>
          {review.coach_response_at && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(review.coach_response_at)}</p>
          )}
        </aside>
      )}

      <footer className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onToggleHelpful}
          aria-pressed={isMarkedHelpful}
          aria-label={isMarkedHelpful ? "Unmark as helpful" : "Mark as helpful"}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-bold transition-colors",
            isMarkedHelpful
              ? "bg-[#46f1c5]/15 text-[#46f1c5]"
              : "bg-muted/40 text-muted-foreground hover:text-foreground"
          )}
        >
          <ThumbsUp className={cn("h-3 w-3", isMarkedHelpful && "fill-current")} />
          Helpful
          {review.helpful_count > 0 && <span className="font-black">· {review.helpful_count}</span>}
        </button>
      </footer>
    </article>
  );
};

const CoachReviewsSection = ({ coachId, coachName }: Props) => {
  const { reviews, stats, loading, toggleHelpful, isMarkedHelpful } = useCoachReviews(coachId);
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let list = [...reviews];
    switch (filter) {
      case "5": list = list.filter((r) => Math.round(r.rating) === 5); break;
      case "4": list = list.filter((r) => Math.round(r.rating) === 4); break;
      case "3-below": list = list.filter((r) => r.rating <= 3); break;
      case "photos": list = list.filter((r) => r.photos && r.photos.length > 0); break;
      case "recent":
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "helpful":
        list.sort((a, b) => b.helpful_count - a.helpful_count);
        break;
      default: break;
    }
    return list;
  }, [reviews, filter]);

  const shown = filtered.slice(0, visible);
  const canShowMore = visible < filtered.length;

  if (loading && reviews.length === 0) {
    return (
      <section className="space-y-4">
        <div className="h-32 rounded-2xl bg-card border border-border/30 animate-pulse" />
        <div className="h-24 rounded-2xl bg-card border border-border/30 animate-pulse" />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {/* Summary card */}
      <div className="bg-card rounded-2xl p-5 border border-border/40">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center">
            <div className="text-5xl font-black text-foreground leading-none">
              {stats.average.toFixed(1)}
            </div>
            <Stars value={stats.average} size={14} />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">
              {stats.count} {stats.count === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* Per-category breakdown bars */}
          <div className="flex-1 min-w-0 space-y-2">
            {(Object.keys(RATING_CATEGORY_LABELS) as RatingCategory[]).map((c) => (
              <CategoryBar
                key={c}
                label={RATING_CATEGORY_LABELS[c]}
                value={stats.categoryAverages[c]}
                count={stats.categoryCounts[c]}
              />
            ))}
          </div>
        </div>

        {stats.count > 0 &&
          (Object.values(stats.categoryCounts) as number[]).every((c) => c === 0) && (
          <p className="mt-4 text-[10px] text-muted-foreground/70 italic">
            Based on overall rating — per-category reviews coming from new sessions.
          </p>
        )}
      </div>

      {/* Filter chips */}
      {stats.count > 0 && (
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 snap-x"
          role="tablist"
          aria-label="Filter reviews"
        >
          {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => {
            const active = filter === key;
            const disabled =
              (key === "photos" && stats.photoCount === 0) ||
              (key === "5" && stats.distribution[5] === 0) ||
              (key === "4" && stats.distribution[4] === 0) ||
              (key === "3-below" && stats.distribution[1] + stats.distribution[2] + stats.distribution[3] === 0);
            if (disabled) return null;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => { setFilter(key); setVisible(PAGE_SIZE); }}
                className={cn(
                  "flex-shrink-0 snap-start inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[11px] font-black uppercase tracking-[0.14em] transition-colors",
                  active
                    ? "bg-gradient-kinetic text-white shadow-[0_6px_18px_rgba(0,212,170,0.25)]"
                    : "bg-card border border-border/40 text-muted-foreground"
                )}
              >
                {key === "photos" && <ImageIcon className="h-3 w-3" />}
                {FILTER_LABELS[key]}
              </button>
            );
          })}
        </div>
      )}

      {/* Cards */}
      {shown.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/40">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground">
            {stats.count === 0 ? "No reviews yet" : "No reviews match this filter"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.count === 0 ? "Be the first to book and review." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              coachName={coachName}
              isMarkedHelpful={isMarkedHelpful(r.id)}
              onToggleHelpful={() => toggleHelpful(r.id)}
            />
          ))}
        </div>
      )}

      {canShowMore && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full h-11 rounded-full border border-border/60 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          Show more reviews
        </button>
      )}
    </section>
  );
};

export default CoachReviewsSection;
