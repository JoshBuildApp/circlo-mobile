import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { followCoach, unfollowCoach } from "@/hooks/v2/useSupabaseQueries";
import { useCoachReviews, useCoachReviewSummary, useMyCoachProfile } from "@/hooks/v2/useMocks";
import { ProfileBuilder } from "@/components/v2/builder/ProfileBuilder";
import type { Coach } from "@/types/v2";

/**
 * Drop-in replacement for AboutTab that delegates to the layout-driven
 * ProfileBuilder. Handles the data fetching + follow state so the builder
 * itself stays a pure renderer.
 *
 * Owner detection: if the authed user's coach profile id matches the coach
 * being viewed, show the "Edit layout" entry and unlock the builder's edit
 * mode.
 */

interface AboutBuilderTabProps {
  coach: Coach;
  onFollow: () => void;
  onMessage: () => void;
}

export function AboutBuilderTab({ coach, onFollow, onMessage }: AboutBuilderTabProps) {
  const { user } = useAuth();
  const { data: summary } = useCoachReviewSummary(coach.id);
  const { data: reviews = [] } = useCoachReviews(coach.id);
  const { data: myCoachProfile } = useMyCoachProfile();

  const ratingValue = summary?.avg && summary.avg > 0 ? summary.avg : coach.rating;
  const reviewCount = summary?.count && summary.count > 0 ? summary.count : coach.reviewCount;

  const canEdit = Boolean(user && myCoachProfile?.id === coach.id);

  const [following, setFollowing] = useState(false);
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
      onFollow();
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
    <ProfileBuilder
      coach={coach}
      ratingValue={ratingValue}
      reviewCount={reviewCount}
      reviews={reviews}
      following={following}
      followBusy={followBusy}
      onFollow={handleFollow}
      onMessage={onMessage}
      canEdit={canEdit}
    />
  );
}
