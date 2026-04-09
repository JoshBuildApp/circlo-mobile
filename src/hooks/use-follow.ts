import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useFollow = (coachId: string | undefined) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!user || !coachId) { setLoading(false); return; }
    supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("coach_id", coachId)
      .maybeSingle()
      .then(({ data }) => {
        setFollowing(!!data);
        setLoading(false);
      });
  }, [user, coachId]);

  // Realtime sync — listen for changes from other devices/tabs
  useEffect(() => {
    if (!user || !coachId) return;
    const channel = supabase
      .channel(`follow-${user.id}-${coachId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "user_follows",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT" && (payload.new as any).coach_id === coachId) {
          setFollowing(true);
        }
        if (payload.eventType === "DELETE" && (payload.old as any).coach_id === coachId) {
          setFollowing(false);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, coachId]);

  const toggleFollow = useCallback(async () => {
    if (!user || !coachId || pendingRef.current) return;
    pendingRef.current = true;

    const wasFollowing = following;

    // Optimistic update
    setFollowing(!wasFollowing);

    // Dispatch global event for count updates
    window.dispatchEvent(new CustomEvent("follow-changed", { detail: { coachId, following: !wasFollowing } }));

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("user_id", user.id)
          .eq("coach_id", coachId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_follows")
          .insert({ user_id: user.id, coach_id: coachId });
        if (error) throw error;

        // Send follow notification (fire-and-forget)
        supabase.from("coach_profiles").select("user_id").eq("id", coachId).single().then(({ data }) => {
          if (data?.user_id && data.user_id !== user.id) {
            supabase.rpc("create_notification", {
              _user_id: data.user_id,
              _type: "follow",
              _title: "New Follower",
              _body: "Someone started following you!",
              _reference_id: user.id,
              _reference_type: "user",
            });
          }
        });
      }
    } catch {
      // Rollback on failure
      setFollowing(wasFollowing);
      window.dispatchEvent(new CustomEvent("follow-changed", { detail: { coachId, following: wasFollowing } }));
      toast.error("Something went wrong. Try again.");
    } finally {
      pendingRef.current = false;
    }
  }, [user, coachId, following]);

  return { following, toggleFollow, loading };
};

export const useFollowedCoachIds = () => {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data, error: _e } = await supabase
      .from("user_follows")
      .select("coach_id")
      .eq("user_id", user.id);
    if (data) setIds(data.map((f) => f.coach_id));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { followedCoachIds: ids, refreshFollows: refresh };
};

/**
 * Batch-fetch follow state for multiple coach IDs at once.
 * Returns a Set of followed coach IDs.
 */
export const useBatchFollows = (coachIds: string[]) => {
  const { user } = useAuth();
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set());
  const idsKey = coachIds.join(",");

  useEffect(() => {
    if (!user || coachIds.length === 0) return;

    const fetch = async () => {
      const { data, error: _e } = await supabase
        .from("user_follows")
        .select("coach_id")
        .eq("user_id", user.id)
        .in("coach_id", coachIds);
      if (data) {
        setFollowedSet(new Set(data.map((f) => f.coach_id)));
      }
    };

    fetch();
  }, [idsKey, user?.id]);

  return followedSet;
};
