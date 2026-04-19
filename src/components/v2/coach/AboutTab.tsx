import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PulseDot, StatCard, Chip } from "@/components/v2/shared";
import { formatPrice } from "@/lib/v2/currency";
import type { Coach } from "@/types/v2";
import { useCoachReviews, useCoachReviewSummary } from "@/hooks/v2/useMocks";
import { useAuth } from "@/contexts/AuthContext";
import { followCoach, unfollowCoach } from "@/hooks/v2/useSupabaseQueries";
import { supabase } from "@/integrations/supabase/client";

interface AboutTabProps {
  coach: Coach;
  onFollow: () => void;
  onMessage: () => void;
}

export function AboutTab({ coach, onFollow, onMessage }: AboutTabProps) {
  const { user } = useAuth();
  const { data: summary } = useCoachReviewSummary(coach.id);
  const { data: reviews = [] } = useCoachReviews(coach.id);
  const ratingValue = summary?.avg && summary.avg > 0 ? summary.avg : coach.rating;
  const reviewCount = summary?.count && summary.count > 0 ? summary.count : coach.reviewCount;
  const [following, setFollowing] = useState<boolean>(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("coach_id", coach.id)
        .maybeSingle();
      if (!cancelled) setFollowing(Boolean(data));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, coach.id]);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Sign in to follow coaches.");
      onFollow(); // delegate to navigation (e.g., to tiers / signup)
      return;
    }
    if (followBusy) return;
    setFollowBusy(true);
    try {
      if (following) {
        await unfollowCoach(user.id, coach.id);
        setFollowing(false);
        toast.success(`Unfollowed ${coach.firstName}`);
      } else {
        await followCoach(user.id, coach.id);
        setFollowing(true);
        toast.success(`Following ${coach.firstName}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update follow.");
    } finally {
      setFollowBusy(false);
    }
  };
  return (
    <div className="pb-32">
      <div className="px-5 pt-3 pb-3">
        <div data-grad="teal-soft" className="px-3.5 py-2.5 rounded-[12px] border border-teal-dim flex items-center gap-2.5">
          <PulseDot />
          <div className="flex-1">
            <div className="text-[11px] text-teal font-bold tracking-wider">AVAILABLE FOR BOOKINGS</div>
            <div className="text-[12px] text-offwhite font-medium mt-px">
              Usually replies within {coach.avgResponseMin ?? 12}m
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-5 mb-3.5">
        <button
          onClick={handleFollow}
          disabled={followBusy}
          className={`py-3 rounded-[12px] font-bold text-[14px] disabled:opacity-60 ${
            following ? "bg-teal text-navy-deep" : "border border-teal text-teal"
          }`}
        >
          {following ? "✓ Following" : "+ Follow"}
        </button>
        <button
          onClick={onMessage}
          className="bg-navy-card text-offwhite py-3 rounded-[12px] font-bold text-[14px]"
        >
          Message
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-5 mb-3.5">
        <StatCard
          label="Rating"
          value={
            <span>
              {ratingValue.toFixed(1)} <span className="text-teal">★</span>
            </span>
          }
          sub={`${reviewCount} reviews`}
        />
        <StatCard
          label="From"
          value={formatPrice(coach.priceFromILS)}
          sub="/ session"
          accent="orange"
        />
      </div>

      <div className="mx-5 p-4 rounded-[14px] bg-navy-card">
        <div className="text-[10px] text-v2-muted font-bold uppercase tracking-wider mb-2">About</div>
        <p className="text-[13px] leading-relaxed text-offwhite mb-2.5">{coach.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {(coach.tags ?? []).map((tag, i) => (
            <Chip key={tag} variant={i % 3 === 2 ? "orange" : "teal"} className="text-[12px]">
              {tag}
            </Chip>
          ))}
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="mx-5 mt-3 p-4 rounded-[14px] bg-navy-card">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] text-v2-muted font-bold uppercase tracking-wider">Reviews</div>
            <div className="text-[11px] text-v2-muted tnum">{reviewCount} total</div>
          </div>
          <div className="flex flex-col gap-3">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="border-b border-navy-line last:border-b-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[13px] font-semibold">{r.authorName}</div>
                  <div className="text-[12px] text-orange tnum">{"★".repeat(Math.max(1, r.rating))}{"☆".repeat(Math.max(0, 5 - r.rating))}</div>
                </div>
                {r.comment && <div className="text-[12px] text-v2-muted leading-snug italic">"{r.comment}"</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
