import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch real-time follower count for a coach from user_follows table.
 * Listens for optimistic "follow-changed" events for instant UI sync.
 */
export const useFollowerCount = (coachId: string | undefined) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!coachId) { setLoading(false); return; }
    const { data, error } = await supabase.rpc("get_follower_count", {
      coach_id_input: coachId,
    });
    if (!error && typeof data === "number") setCount(data);
    setLoading(false);
  }, [coachId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Listen for optimistic follow changes
  useEffect(() => {
    if (!coachId) return;
    const handler = (e: Event) => {
      const { coachId: cId, following } = (e as CustomEvent).detail;
      if (cId === coachId) {
        setCount((prev) => Math.max(0, prev + (following ? 1 : -1)));
      }
    };
    window.addEventListener("follow-changed", handler);
    return () => window.removeEventListener("follow-changed", handler);
  }, [coachId]);

  // Realtime sync from DB
  useEffect(() => {
    if (!coachId) return;
    const channel = supabase
      .channel(`follower-count-${coachId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "user_follows",
        filter: `coach_id=eq.${coachId}`,
      }, () => {
        // Re-fetch accurate count on any DB change
        refresh();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [coachId, refresh]);

  return { followerCount: count, refreshCount: refresh, loading };
};

/**
 * Fetch the list of followers for a coach (user_ids).
 */
export const useFollowersList = (coachId: string | undefined) => {
  const [followers, setFollowers] = useState<{ user_id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    const { data } = await supabase.rpc("get_followers", { coach_id_input: coachId });
    if (data) setFollowers(data as any);
    setLoading(false);
  }, [coachId]);

  return { followers, loadFollowers: load, loading };
};

/**
 * Fetch the list of coaches a user follows.
 */
export const useFollowingList = (userId: string | undefined) => {
  const [following, setFollowing] = useState<{ coach_id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.rpc("get_following", { user_id_input: userId });
    if (data) setFollowing(data as any);
    setLoading(false);
  }, [userId]);

  return { following, loadFollowing: load, loading };
};
