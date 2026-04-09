import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDataMode } from "@/contexts/DataModeContext";

/**
 * Unified "For You" feed item — each content type maps to this shape.
 */
export type FeedItemType =
  | "video"
  | "post"
  | "challenge"
  | "coach_update"
  | "article"
  | "reel";

export interface ForYouItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string | null;
  media_url?: string;
  media_type?: string;
  coach_name: string;
  coach_image: string | null;
  sport: string;
  likes_count: number;
  comments_count: number;
  views?: number;
  created_at: string;
  // Challenge-specific
  duration_days?: number;
  participants_count?: number;
  // Coach update-specific
  update_type?: string;
}

/**
 * Fetches ALL content types and merges them into a single mixed feed
 * with smart interleaving to ensure variety.
 */
export const useForYouFeed = () => {
  const [items, setItems] = useState<ForYouItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isRealMode } = useDataMode();

  const refresh = useCallback(async () => {
    setLoading(true);

    // Fetch all content types in parallel
    const [videosRes, postsRes, challengesRes, reelsRes] = await Promise.all([
      // Videos
      (() => {
        let q = supabase
          .from("coach_videos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15);
        if (isRealMode) q = q.eq("is_fake", false);
        return q;
      })(),
      // Text posts
      supabase
        .from("coach_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
      // Challenges
      supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
      // Reels (short videos < 60s or marked as reels)
      (() => {
        let q = supabase
          .from("coach_videos")
          .select("*")
          .eq("media_type", "video")
          .order("views", { ascending: false })
          .limit(6);
        if (isRealMode) q = q.eq("is_fake", false);
        return q;
      })(),
    ]);

    const videos = videosRes.data || [];
    const posts = postsRes.data || [];
    const challenges = challengesRes.data || [];
    const reels = reelsRes.data || [];

    // Collect all coach IDs for batch enrichment
    const allCoachIds = new Set<string>();
    for (const v of videos) if (v.coach_id) allCoachIds.add(v.coach_id);
    for (const r of reels) if (r.coach_id) allCoachIds.add(r.coach_id);
    for (const c of challenges) if (c.coach_id) allCoachIds.add(c.coach_id);

    // Batch fetch coach profiles
    const profileMap: Record<string, { coach_name: string; sport: string; image_url: string | null }> = {};
    if (allCoachIds.size > 0) {
      const { data: profiles } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url")
        .in("id", [...allCoachIds]);
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = { coach_name: p.coach_name, sport: p.sport || "", image_url: p.image_url };
        }
      }
    }

    const reelIds = new Set(reels.map((r: any) => r.id));
    const allItems: ForYouItem[] = [];

    // Map videos (exclude ones already in reels)
    for (const v of videos) {
      if (reelIds.has(v.id)) continue;
      const profile = profileMap[v.coach_id];
      if (!profile?.coach_name?.trim()) continue;
      allItems.push({
        id: v.id,
        type: v.media_type === "image" ? "post" : "video",
        title: v.title || "",
        description: v.description,
        media_url: v.media_url,
        media_type: v.media_type,
        coach_name: profile.coach_name,
        coach_image: profile.image_url,
        sport: profile.sport,
        likes_count: v.likes_count || 0,
        comments_count: v.comments_count || 0,
        views: v.views || 0,
        created_at: v.created_at,
      });
    }

    // Map reels
    for (const r of reels) {
      const profile = profileMap[r.coach_id];
      if (!profile?.coach_name?.trim()) continue;
      allItems.push({
        id: r.id,
        type: "reel",
        title: r.title || "",
        description: r.description,
        media_url: r.media_url,
        media_type: r.media_type,
        coach_name: profile.coach_name,
        coach_image: profile.image_url,
        sport: profile.sport,
        likes_count: r.likes_count || 0,
        comments_count: r.comments_count || 0,
        views: r.views || 0,
        created_at: r.created_at,
      });
    }

    // Map text posts
    for (const p of posts) {
      allItems.push({
        id: p.id,
        type: "post",
        title: "",
        description: p.text || "",
        coach_name: profileMap[p.coach_id]?.coach_name || "Coach",
        coach_image: profileMap[p.coach_id]?.image_url || null,
        sport: profileMap[p.coach_id]?.sport || "",
        likes_count: 0,
        comments_count: 0,
        created_at: p.created_at,
      });
    }

    // Map challenges
    for (const c of challenges) {
      const profile = profileMap[c.coach_id];
      allItems.push({
        id: c.id,
        type: "challenge",
        title: c.title || "Challenge",
        description: c.description,
        coach_name: profile?.coach_name || "Circlo",
        coach_image: profile?.image_url || null,
        sport: profile?.sport || "",
        likes_count: 0,
        comments_count: 0,
        created_at: c.created_at,
        duration_days: c.duration_days,
        participants_count: 0,
      });
    }

    // Smart interleave: sort by recency but ensure no two items of the same type appear consecutively
    allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const interleaved: ForYouItem[] = [];
    const remaining = [...allItems];

    while (remaining.length > 0) {
      const lastType = interleaved.length > 0 ? interleaved[interleaved.length - 1].type : null;
      // Find next item that is a different type
      const diffIdx = remaining.findIndex((item) => item.type !== lastType);
      if (diffIdx >= 0) {
        interleaved.push(remaining.splice(diffIdx, 1)[0]);
      } else {
        // No variety left, just add the rest
        interleaved.push(...remaining);
        break;
      }
    }

    setItems(interleaved.slice(0, 12));
    setLoading(false);
  }, [isRealMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
};
