import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Review {
  id: string;
  coach_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string | null;
  // enriched
  reviewer_username?: string;
  reviewer_avatar?: string;
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function useCoachReviews(coachId: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
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

    const reviewList = data || [];

    // Batch enrich with reviewer profiles
    const reviewerIds = [...new Set(reviewList.map((r) => r.user_id))];
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

    const enriched: Review[] = reviewList.map((r) => ({
      ...r,
      reviewer_username: profiles[r.user_id]?.username || r.user_name || "Anonymous",
      reviewer_avatar: profiles[r.user_id]?.avatar_url || null,
    }));

    setReviews(enriched);

    // Calculate stats
    if (enriched.length > 0) {
      const total = enriched.reduce((sum, r) => sum + r.rating, 0);
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
      enriched.forEach((r) => { dist[r.rating as 1 | 2 | 3 | 4 | 5]++; });
      setStats({ average: total / enriched.length, count: enriched.length, distribution: dist });
    } else {
      setStats({ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    }

    setLoading(false);
  }, [coachId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const submitReview = async (rating: number, comment: string): Promise<boolean> => {
    if (!user) { toast.error("Sign in to leave a review"); return false; }
    if (!coachId) return false;

    setSubmitting(true);
    const { error } = await supabase.from("reviews").upsert({
      coach_id: coachId,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
    }, { onConflict: "coach_id,user_id" });

    if (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
      setSubmitting(false);
      return false;
    }

    toast.success("Review submitted! ⭐");
    await fetchReviews();
    setSubmitting(false);
    return true;
  };

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  return { reviews, stats, loading, submitting, submitReview, userReview, refresh: fetchReviews };
}
