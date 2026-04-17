import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/contexts/DataModeContext";
import { useHaptics } from "@/native/useNative";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (s: string) => UUID_RE.test(s);

export interface FeedVideo {
  id: string;
  coach_id: string;
  user_id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  views: number;
  created_at: string;
  coach_name?: string;
  sport?: string;
  coach_image?: string | null;
}

/** Fetch all videos with coach info for the feed */
export const useFeedVideos = () => {
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isRealMode } = useDataMode();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("coach_videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (isRealMode) query = query.eq("is_fake", false);
      const { data: vids, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (vids && vids.length > 0) {
        const coachIds = [...new Set(vids.map((v: any) => v.coach_id))];
        const { data: profiles } = await supabase
          .from("coach_profiles")
          .select("id, user_id, coach_name, sport, image_url")
          .in("id", coachIds);

        const profileMap: Record<string, any> = {};
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.id] = p;
          }
        }

        setVideos(
          vids
            .map((v: any) => {
              const profile = profileMap[v.coach_id];
              if (!profile?.coach_name?.trim()) return null;

              return {
                ...v,
                coach_name: profile.coach_name,
                sport: profile.sport || "",
                coach_image: profile.image_url || null,
              };
            })
            .filter((video): video is FeedVideo => video !== null)
        );
      } else {
        setVideos([]);
      }
    } catch (err: unknown) {
      console.error("Failed to load feed videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [isRealMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { videos, loading, error, refresh };
};

/**
 * Batch-fetch like state for multiple content IDs at once.
 * Returns a map: contentId → { liked, count }
 */
export const useBatchLikes = (contentIds: string[]) => {
  const { user } = useAuth();
  const [likeMap, setLikeMap] = useState<Record<string, { liked: boolean; count: number }>>({});
  const idsKey = contentIds.join(",");

  useEffect(() => {
    if (contentIds.length === 0) return;

    const fetchBatch = async () => {
      // Fetch counts for all IDs in one query
      const { data: videos } = await supabase
        .from("coach_videos")
        .select("id, likes_count")
        .in("id", contentIds);

      const map: Record<string, { liked: boolean; count: number }> = {};
      if (videos) {
        for (const v of videos) {
          map[v.id] = { liked: false, count: v.likes_count };
        }
      }

      // Fetch user likes in one query
      if (user) {
        const { data: likes } = await supabase
          .from("likes")
          .select("content_id")
          .eq("user_id", user.id)
          .in("content_id", contentIds);

        if (likes) {
          for (const l of likes) {
            if (map[l.content_id]) {
              map[l.content_id].liked = true;
            }
          }
        }
      }

      setLikeMap(map);
    };

    fetchBatch();
  }, [idsKey, user?.id]);

  return likeMap;
};

/** Like/unlike a video — standalone with optimistic update + rollback */
export const useLike = (contentId: string) => {
  const { user } = useAuth();
  const { tap } = useHaptics();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!contentId || !isUUID(contentId)) return;

    const fetchLikeState = async () => {
      const { data: video } = await supabase
        .from("coach_videos")
        .select("likes_count")
        .eq("id", contentId)
        .maybeSingle();
      if (video) setCount(video.likes_count);

      if (user) {
        const { data, error: _e } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("content_id", contentId)
          .maybeSingle();
        setLiked(!!data);
      }
      setLoading(false);
    };

    fetchLikeState();
  }, [contentId, user]);

  const toggleLike = useCallback(async () => {
    if (!user || !contentId || !isUUID(contentId) || pendingRef.current) return;
    pendingRef.current = true;

    const wasLiked = liked;

    // Optimistic update — instant UI feedback
    setLiked(!wasLiked);
    setCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    tap("light");

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", contentId);
        if (error) throw error;
        const { error: rpcErr } = await supabase.rpc("increment_likes", { video_id: contentId, delta: -1 });
        if (rpcErr) throw rpcErr;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, content_id: contentId });
        if (error) throw error;
        const { error: rpcErr } = await supabase.rpc("increment_likes", { video_id: contentId, delta: 1 });
        if (rpcErr) throw rpcErr;
      }
    } catch {
      // Rollback on failure
      setLiked(wasLiked);
      setCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
    } finally {
      pendingRef.current = false;
    }
  }, [user, contentId, liked]);

  return { liked, count, toggleLike, loading };
};

/** Track a view */
export const trackView = async (videoId: string) => {
  if (!isUUID(videoId)) return;
  await supabase.rpc("increment_views", { video_id: videoId });
};

/** Comments hook */
export const useComments = (contentId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<{
    id: string;
    user_id: string;
    text: string;
    created_at: string;
    username: string;
    avatar_url: string | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!contentId) return;
    setLoading(true);

    const { data, error: _e } = await supabase
      .from("comments")
      .select("*")
      .eq("content_id", contentId)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.user_id] = p;
        }
      }

      setComments(
        data.map((c: any) => ({
          ...c,
          username: profileMap[c.user_id]?.username || "User",
          avatar_url: profileMap[c.user_id]?.avatar_url || null,
        }))
      );
      setCount(data.length);
    } else {
      setComments([]);
      setCount(0);
    }
    setLoading(false);
  }, [contentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addComment = useCallback(
    async (text: string) => {
      if (!user || !contentId || !text.trim()) return;
      await supabase.from("comments").insert({
        user_id: user.id,
        content_id: contentId,
        text: text.trim(),
      });
      await supabase.rpc("increment_comments", { video_id: contentId, delta: 1 });
      refresh();
    },
    [user, contentId, refresh]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      await supabase.from("comments").delete().eq("id", commentId);
      await supabase.rpc("increment_comments", { video_id: contentId, delta: -1 });
      refresh();
    },
    [contentId, refresh]
  );

  return { comments, count, loading, addComment, deleteComment, refresh };
};
