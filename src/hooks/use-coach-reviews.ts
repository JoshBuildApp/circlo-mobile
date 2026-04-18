import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type RatingCategory =
  | "skill"
  | "communication"
  | "punctuality"
  | "value"
  | "environment";

export const RATING_CATEGORY_LABELS: Record<RatingCategory, string> = {
  skill: "Skill & expertise",
  communication: "Communication",
  punctuality: "Punctuality",
  value: "Value for money",
  environment: "Environment",
};

export interface Review {
  id: string;
  coach_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string | null;
  // Per-category scores (Phase 2.3.G). Null means not scored.
  rating_skill: number | null;
  rating_communication: number | null;
  rating_punctuality: number | null;
  rating_value: number | null;
  rating_environment: number | null;
  photos: string[] | null;
  helpful_count: number;
  coach_response: string | null;
  coach_response_at: string | null;
  is_verified_booking: boolean;
  session_type: string | null;
  // enriched
  reviewer_username?: string;
  reviewer_avatar?: string;
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  categoryAverages: Record<RatingCategory, number>;
  categoryCounts: Record<RatingCategory, number>;
  photoCount: number;
}

export function useCoachReviews(coachId: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    average: 0,
    count: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    categoryAverages: { skill: 0, communication: 0, punctuality: 0, value: 0, environment: 0 },
    categoryCounts: { skill: 0, communication: 0, punctuality: 0, value: 0, environment: 0 },
    photoCount: 0,
  });
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      setLoading(false);
      return;
    }

    // The row may have our new columns or not (pre-migration). Cast to a
    // permissive shape and read defensively.
    type Row = Record<string, unknown>;
    const reviewList = (data || []) as Row[];

    const reviewerIds = [...new Set(reviewList.map((r) => String(r.user_id)))];
    let profiles: Record<string, { username: string; avatar_url: string | null }> = {};

    if (reviewerIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", reviewerIds);

      if (profileData) {
        profiles = Object.fromEntries(
          profileData.map((p) => [p.id, { username: p.username, avatar_url: p.avatar_url }])
        );
      }
    }

    const nullableNum = (v: unknown): number | null =>
      typeof v === "number" && Number.isFinite(v) ? v : null;

    const enriched: Review[] = reviewList.map((r) => ({
      id: String(r.id),
      coach_id: String(r.coach_id),
      user_id: String(r.user_id),
      rating: Number(r.rating) || 0,
      comment: (r.comment as string | null) ?? null,
      created_at: String(r.created_at),
      user_name: (r.user_name as string | null) ?? null,
      rating_skill: nullableNum(r.rating_skill),
      rating_communication: nullableNum(r.rating_communication),
      rating_punctuality: nullableNum(r.rating_punctuality),
      rating_value: nullableNum(r.rating_value),
      rating_environment: nullableNum(r.rating_environment),
      photos: Array.isArray(r.photos) ? (r.photos as string[]) : null,
      helpful_count: typeof r.helpful_count === "number" ? r.helpful_count : 0,
      coach_response: (r.coach_response as string | null) ?? null,
      coach_response_at: (r.coach_response_at as string | null) ?? null,
      is_verified_booking: Boolean(r.is_verified_booking),
      session_type: (r.session_type as string | null) ?? null,
      reviewer_username:
        profiles[String(r.user_id)]?.username || (r.user_name as string) || "Anonymous",
      reviewer_avatar: profiles[String(r.user_id)]?.avatar_url || null,
    }));

    setReviews(enriched);

    if (enriched.length > 0) {
      const total = enriched.reduce((sum, r) => sum + r.rating, 0);
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
      enriched.forEach((r) => {
        const bucket = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        dist[bucket]++;
      });

      const cats: RatingCategory[] = ["skill", "communication", "punctuality", "value", "environment"];
      const catAvg = {} as Record<RatingCategory, number>;
      const catCount = {} as Record<RatingCategory, number>;
      for (const c of cats) {
        const key = `rating_${c}` as const;
        const scored = enriched
          .map((r) => r[key as keyof Review])
          .filter((v): v is number => typeof v === "number");
        catCount[c] = scored.length;
        // Fallback so the breakdown bars aren't empty for legacy reviews.
        catAvg[c] =
          scored.length > 0 ? scored.reduce((a, b) => a + b, 0) / scored.length : total / enriched.length;
      }

      const photoCount = enriched.reduce((n, r) => n + (r.photos?.length ?? 0), 0);

      setStats({
        average: total / enriched.length,
        count: enriched.length,
        distribution: dist,
        categoryAverages: catAvg,
        categoryCounts: catCount,
        photoCount,
      });
    } else {
      setStats({
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: { skill: 0, communication: 0, punctuality: 0, value: 0, environment: 0 },
        categoryCounts: { skill: 0, communication: 0, punctuality: 0, value: 0, environment: 0 },
        photoCount: 0,
      });
    }

    setLoading(false);
  }, [coachId]);

  const fetchHelpfulVotes = useCallback(async () => {
    if (!user) { setHelpfulVotes(new Set()); return; }
    type Row = { review_id: string };
    const query = (supabase as unknown as {
      from: (t: string) => {
        select: (q: string) => { eq: (c: string, v: string) => Promise<{ data: Row[] | null }> };
      };
    }).from("review_helpful_votes");
    const { data } = await query.select("review_id").eq("user_id", user.id);
    setHelpfulVotes(new Set((data || []).map((v) => v.review_id)));
  }, [user]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { fetchHelpfulVotes(); }, [fetchHelpfulVotes]);

  const submitReview = async (input: {
    rating: number;
    comment?: string;
    categories?: Partial<Record<RatingCategory, number>>;
    photos?: string[];
    session_type?: string;
  }): Promise<boolean> => {
    if (!user) { toast.error("Sign in to leave a review"); return false; }
    if (!coachId) return false;

    setSubmitting(true);
    const payload: Record<string, unknown> = {
      coach_id: coachId,
      user_id: user.id,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    };
    if (input.categories) {
      payload.rating_skill = input.categories.skill ?? null;
      payload.rating_communication = input.categories.communication ?? null;
      payload.rating_punctuality = input.categories.punctuality ?? null;
      payload.rating_value = input.categories.value ?? null;
      payload.rating_environment = input.categories.environment ?? null;
    }
    if (input.photos && input.photos.length > 0) payload.photos = input.photos;
    if (input.session_type) payload.session_type = input.session_type;

    const query = (supabase as unknown as {
      from: (t: string) => {
        upsert: (
          vals: Record<string, unknown>,
          opts: { onConflict: string },
        ) => Promise<{ error: unknown }>;
      };
    }).from("reviews");
    const { error } = await query.upsert(payload, { onConflict: "coach_id,user_id" });

    if (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
      setSubmitting(false);
      return false;
    }

    toast.success("Review submitted!");
    await fetchReviews();
    setSubmitting(false);
    return true;
  };

  const toggleHelpful = useCallback(
    async (reviewId: string) => {
      if (!user) { toast.error("Sign in to mark reviews helpful"); return; }
      const hasVoted = helpfulVotes.has(reviewId);
      const next = new Set(helpfulVotes);
      if (hasVoted) next.delete(reviewId); else next.add(reviewId);
      setHelpfulVotes(next);

      setReviews((prev) => prev.map((r) =>
        r.id === reviewId
          ? { ...r, helpful_count: Math.max(0, r.helpful_count + (hasVoted ? -1 : 1)) }
          : r
      ));

      const table = (supabase as unknown as {
        from: (t: string) => {
          delete: () => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: unknown }> } };
          insert: (v: Record<string, unknown>) => Promise<{ error: unknown }>;
        };
      }).from("review_helpful_votes");

      if (hasVoted) {
        await table.delete().eq("review_id", reviewId).eq("user_id", user.id);
      } else {
        await table.insert({ review_id: reviewId, user_id: user.id });
      }
    },
    [user, helpfulVotes],
  );

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : null;
  const isMarkedHelpful = (reviewId: string) => helpfulVotes.has(reviewId);

  return {
    reviews,
    stats,
    loading,
    submitting,
    submitReview,
    userReview,
    refresh: fetchReviews,
    toggleHelpful,
    isMarkedHelpful,
  };
}
