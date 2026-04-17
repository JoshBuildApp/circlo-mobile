import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CoachStatsData {
  coach_id: string;
  follower_count: number;
  total_bookings: number;
  pending_bookings: number;
  active_bookings: number;
  total_revenue: number;
  revenue_30d: number;
  video_count: number;
  total_views: number;
  total_likes: number;
  review_count: number;
  avg_rating: number;
  refreshed_at: string;
  /** true when the materialized view data is older than 30 minutes */
  is_stale: boolean;
}

export function useCoachStats(userId?: string) {
  const [stats, setStats] = useState<CoachStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc("get_coach_stats", { p_user_id: userId });

      if (rpcError) {
        console.error("[useCoachStats]", rpcError);
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setStats(null);
        setLoading(false);
        return;
      }

      const refreshedAt = new Date(row.refreshed_at);
      const minutesOld = (Date.now() - refreshedAt.getTime()) / 60_000;

      setStats({
        coach_id:        row.coach_id,
        follower_count:  row.follower_count  ?? 0,
        total_bookings:  row.total_bookings  ?? 0,
        pending_bookings: row.pending_bookings ?? 0,
        active_bookings: row.active_bookings  ?? 0,
        total_revenue:   row.total_revenue   ?? 0,
        revenue_30d:     row.revenue_30d     ?? 0,
        video_count:     row.video_count     ?? 0,
        total_views:     row.total_views     ?? 0,
        total_likes:     row.total_likes     ?? 0,
        review_count:    row.review_count    ?? 0,
        avg_rating:      row.avg_rating      ?? 0,
        refreshed_at:    row.refreshed_at,
        is_stale:        minutesOld > 30,
      });
      setLoading(false);
    };

    fetch();
  }, [userId]);

  return { stats, loading, error };
}
