import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, ChevronRight } from "lucide-react";
import { CoachHeartButton } from "@/components/CoachHeartButton";

interface Similar {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  rating: number | null;
  price: number | null;
  location: string | null;
  is_verified: boolean | null;
}

interface Props {
  currentCoachId?: string;
  sport?: string;
  /** Fallback: if no sport is given, still surface top-rated coaches. */
  limit?: number;
}

/**
 * Horizontal rail of coaches the user might also like — same sport first,
 * falls back to top-rated. Rendered at the bottom of the coach profile as
 * section J of the profile depth redesign.
 */
const SimilarCoaches = ({ currentCoachId, sport, limit = 6 }: Props) => {
  const [coaches, setCoaches] = useState<Similar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let query = supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, rating, price, location, is_verified")
        .order("rating", { ascending: false })
        .limit(limit + 1);
      if (sport) query = query.eq("sport", sport);
      const { data } = await query;
      if (cancelled) return;
      const filtered = (data || []).filter((c: Similar) => c.id !== currentCoachId).slice(0, limit);
      setCoaches(filtered);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sport, currentCoachId, limit]);

  if (!loading && coaches.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between px-6 mb-4">
        <div>
          <span className="text-[10px] font-black tracking-[0.28em] text-[#ffb59a] uppercase">Similar</span>
          <h3 className="text-xl font-black text-foreground tracking-tight mt-1">
            More coaches like this
          </h3>
        </div>
        <Link
          to="/discover"
          className="text-[11px] font-black uppercase tracking-[0.18em] text-[#46f1c5] inline-flex items-center gap-0.5"
        >
          See all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="px-6 flex gap-3 overflow-x-auto scrollbar-hide snap-x">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[164px] aspect-[3/4] rounded-2xl bg-card border border-border/20 animate-pulse" />
            ))
          : coaches.map((c) => (
              <Link
                key={c.id}
                to={`/coach/${c.id}`}
                className="snap-start flex-shrink-0 w-[164px] aspect-[3/4] rounded-2xl overflow-hidden relative bg-card border border-border/30 active:scale-[0.98] transition-transform"
              >
                {c.image_url ? (
                  <img src={c.image_url} alt={c.coach_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-kinetic opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ff6b2c] text-white text-[9px] font-black uppercase tracking-wide shadow">
                    {c.sport}
                  </span>
                  <CoachHeartButton coachId={c.id} coachName={c.coach_name} size="sm" />
                </div>

                <div className="absolute bottom-0 inset-x-0 p-3">
                  <p className="text-white font-bold text-[13px] truncate">{c.coach_name}</p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    {c.rating != null && (
                      <span className="flex items-center gap-0.5 text-[10px] text-white/80">
                        <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                        {c.rating.toFixed(1)}
                      </span>
                    )}
                    {c.location && (
                      <span className="flex items-center gap-0.5 text-[10px] text-white/70 truncate max-w-[80px]">
                        <MapPin className="h-2.5 w-2.5" />{c.location}
                      </span>
                    )}
                    {c.price != null && c.price > 0 && (
                      <span className="flex-shrink-0 text-[10px] font-black text-white bg-[#46f1c5]/90 px-1.5 py-0.5 rounded-full">
                        ₪{c.price}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default SimilarCoaches;
