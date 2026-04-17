import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/contexts/DataModeContext";
import type { ForYouItem, FeedItemType } from "@/hooks/use-for-you-feed";

export type FeedSource = "following" | "trending" | "recommended";

export interface PersonalizedItem extends ForYouItem {
  source: FeedSource;
  score: number;
}

interface AffinitySignals {
  sportCounts: Record<string, number>;
  coachCounts: Record<string, number>;
  watchedIds: Set<string>;
  totalWatches: number;
}

const EMPTY_SIGNALS: AffinitySignals = {
  sportCounts: {},
  coachCounts: {},
  watchedIds: new Set(),
  totalWatches: 0,
};

/** Engagement-aware post scoring with recency, social, affinity, and booking signals */
function scorePost(
  post: {
    coach_id?: string;
    sport: string;
    likes_count: number;
    comments_count?: number;
    created_at: string;
    is_boosted?: boolean;
  },
  userFollowing: string[],
  userSports: string[],
  userBookedCoachIds: string[]
): number {
  let score = 0;
  // Recency: posts from last 24h get +50, last 3 days +30, last week +10
  const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
  if (hoursOld < 24) score += 50;
  else if (hoursOld < 72) score += 30;
  else if (hoursOld < 168) score += 10;
  // Social: likes boost
  score += Math.min((post.likes_count || 0) * 0.5, 30);
  // Following: +40 if user follows this coach
  if (post.coach_id && userFollowing.includes(post.coach_id)) score += 40;
  // Sport match: +25 if post sport matches user's sports
  if (userSports.some((s) => post.sport?.toLowerCase().includes(s.toLowerCase()))) score += 25;
  // Booked coach: +20 if user has booked this coach
  if (post.coach_id && userBookedCoachIds.includes(post.coach_id)) score += 20;
  // Comments engagement
  score += Math.min((post.comments_count || 0) * 1, 20);
  // Boost bonus
  if (post.is_boosted) score += 15;
  return score;
}

/** Build user affinity from watch history */
async function buildAffinitySignals(userId: string): Promise<AffinitySignals> {
  const { data: watches } = await supabase
    .from("video_watches")
    .select("video_id, watch_seconds")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(150);

  if (!watches || watches.length === 0) return EMPTY_SIGNALS;

  const watchedIds = new Set(watches.map((w) => w.video_id));
  const videoIds = [...watchedIds];

  const { data: videos } = await supabase
    .from("coach_videos")
    .select("id, coach_id")
    .in("id", videoIds);

  if (!videos) return { ...EMPTY_SIGNALS, watchedIds, totalWatches: watches.length };

  const watchMap: Record<string, number> = {};
  for (const w of watches) {
    watchMap[w.video_id] = (watchMap[w.video_id] || 0) + w.watch_seconds;
  }

  const coachIds = [...new Set(videos.map((v) => v.coach_id))];
  const { data: profiles } = await supabase
    .from("coach_profiles")
    .select("id, sport")
    .in("id", coachIds);

  const coachSportMap: Record<string, string> = {};
  if (profiles) for (const p of profiles) coachSportMap[p.id] = p.sport;

  const sportCounts: Record<string, number> = {};
  const coachCounts: Record<string, number> = {};

  for (const v of videos) {
    const weight = watchMap[v.id] || 1;
    const sport = coachSportMap[v.coach_id] || "other";
    sportCounts[sport] = (sportCounts[sport] || 0) + weight;
    coachCounts[v.coach_id] = (coachCounts[v.coach_id] || 0) + weight;
  }

  return { sportCounts, coachCounts, watchedIds, totalWatches: watches.length };
}

/** Score a single feed item for personalization */
function scoreItem(
  item: {
    coach_id?: string;
    sport: string;
    likes_count: number;
    views?: number;
    created_at: string;
    is_boosted?: boolean;
  },
  followedIds: Set<string>,
  signals: AffinitySignals,
  maxLikes: number,
  maxViews: number,
  nowMs: number
): { score: number; source: FeedSource } {
  // --- Following boost ---
  const isFollowed = item.coach_id ? followedIds.has(item.coach_id) : false;
  const followBoost = isFollowed ? 0.4 : 0;

  // --- Engagement (trending signal) ---
  const engLikes = maxLikes > 0 ? item.likes_count / maxLikes : 0;
  const engViews = maxViews > 0 ? (item.views || 0) / maxViews : 0;
  const engagement = engLikes * 0.6 + engViews * 0.4;

  // --- Recency (0-1, decays over 14 days) ---
  const ageMs = nowMs - new Date(item.created_at).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const recency = Math.max(0, 1 - ageHours / (24 * 14));

  // --- Affinity (recommended signal) ---
  let affinity = 0;
  if (signals.totalWatches > 0) {
    const totalSport = Object.values(signals.sportCounts).reduce((a, b) => a + b, 0) || 1;
    const totalCoach = Object.values(signals.coachCounts).reduce((a, b) => a + b, 0) || 1;
    const sportAff = (signals.sportCounts[item.sport?.toLowerCase() || ""] || 0) / totalSport;
    const coachAff = item.coach_id ? (signals.coachCounts[item.coach_id] || 0) / totalCoach : 0;
    affinity = sportAff * 0.6 + coachAff * 0.4;
  }

  // --- Unseen bonus ---
  const unseenBonus = item.coach_id && signals.watchedIds.has(item.coach_id) ? 0 : 0.05;

  // --- Boost ---
  const boostBonus = item.is_boosted ? 0.1 : 0;

  // Weights shift based on whether user has history
  const hasHistory = signals.totalWatches >= 5;
  const score =
    followBoost +
    engagement * (hasHistory ? 0.2 : 0.4) +
    recency * 0.15 +
    affinity * (hasHistory ? 0.3 : 0.1) +
    unseenBonus +
    boostBonus +
    Math.random() * 0.03;

  // Determine primary source label
  let source: FeedSource = "recommended";
  if (isFollowed) source = "following";
  else if (engagement > 0.5) source = "trending";

  return { score, source };
}

/**
 * Personalized home feed: followed coaches + trending + recommended.
 * Authenticated users get a scored, personalized mix.
 * Guests get engagement + recency ranked content.
 */
export const usePersonalizedFeed = (limit = 15) => {
  const { user } = useAuth();
  const { isRealMode } = useDataMode();
  const [items, setItems] = useState<PersonalizedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [signals, setSignals] = useState<AffinitySignals>(EMPTY_SIGNALS);

  // Extra signals for the new scorePost algorithm
  const [userFollowingList, setUserFollowingList] = useState<string[]>([]);
  const [userSports, setUserSports] = useState<string[]>([]);
  const [userBookedCoachIds, setUserBookedCoachIds] = useState<string[]>([]);

  // Fetch followed coach IDs + affinity signals + sports + booked coaches in parallel
  useEffect(() => {
    if (!user) return;

    Promise.all([
      // Followed coaches
      supabase.from("user_follows").select("coach_id").eq("user_id", user.id),
      // Affinity signals
      buildAffinitySignals(user.id),
      // User sport preferences from profile
      supabase.from("profiles").select("sport").eq("user_id", user.id).maybeSingle(),
      // Booked coach IDs
      supabase
        .from("bookings")
        .select("coach_id, coach_profiles(id)")
        .eq("user_id", user.id)
        .neq("status", "cancelled"),
    ]).then(([followsRes, affinitySignals, profileRes, bookingsRes]) => {
      if (followsRes.data) {
        const ids = followsRes.data.map((f: any) => f.coach_id);
        setFollowedIds(new Set(ids));
        setUserFollowingList(ids);
      }
      setSignals(affinitySignals);

      // Extract sport from profile
      const sport = (profileRes.data as any)?.sport;
      if (sport) setUserSports([sport]);

      // Extract unique booked coach IDs
      if (bookingsRes.data) {
        const bookedIds = [...new Set(bookingsRes.data.map((b: any) => b.coach_id).filter(Boolean))] as string[];
        setUserBookedCoachIds(bookedIds);
      }
    });
  }, [user]);

  const refresh = useCallback(async () => {
    setLoading(true);

    // Fetch all content types in parallel
    const [videosRes, postsRes, challengesRes, reelsRes] = await Promise.all([
      (() => {
        let q = supabase
          .from("coach_videos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(25);
        if (isRealMode) q = q.eq("is_fake", false);
        return q;
      })(),
      supabase
        .from("coach_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
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

    // Batch enrich coach profiles
    const allCoachIds = new Set<string>();
    for (const v of videos) if (v.coach_id) allCoachIds.add(v.coach_id);
    for (const r of reels) if (r.coach_id) allCoachIds.add(r.coach_id);
    for (const c of challenges) if (c.coach_id) allCoachIds.add(c.coach_id);
    for (const p of posts) if (p.coach_id) allCoachIds.add(p.coach_id);

    const profileMap: Record<string, { coach_name: string; sport: string; image_url: string | null; is_boosted?: boolean }> = {};
    if (allCoachIds.size > 0) {
      const { data: profiles } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, is_boosted")
        .in("id", [...allCoachIds]);
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = {
            coach_name: p.coach_name,
            sport: p.sport || "",
            image_url: p.image_url,
            is_boosted: p.is_boosted || false,
          };
        }
      }
    }

    // Build raw items
    const reelIds = new Set(reels.map((r: any) => r.id));
    const rawItems: Array<ForYouItem & { coach_id?: string; is_boosted?: boolean }> = [];

    // Videos (exclude reels)
    for (const v of videos) {
      if (reelIds.has(v.id)) continue;
      const profile = profileMap[v.coach_id];
      if (!profile?.coach_name?.trim()) continue;
      rawItems.push({
        id: v.id,
        type: (v.media_type === "image" ? "post" : "video") as FeedItemType,
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
        coach_id: v.coach_id,
        is_boosted: profile.is_boosted,
      });
    }

    // Reels
    for (const r of reels) {
      const profile = profileMap[r.coach_id];
      if (!profile?.coach_name?.trim()) continue;
      rawItems.push({
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
        coach_id: r.coach_id,
        is_boosted: profile.is_boosted,
      });
    }

    // Text posts
    for (const p of posts) {
      const profile = profileMap[p.coach_id];
      rawItems.push({
        id: p.id,
        type: "post",
        title: "",
        description: p.text || "",
        coach_name: profile?.coach_name || "Coach",
        coach_image: profile?.image_url || null,
        sport: profile?.sport || "",
        likes_count: 0,
        comments_count: 0,
        created_at: p.created_at,
        coach_id: p.coach_id,
      });
    }

    // Challenges
    for (const c of challenges) {
      const profile = profileMap[c.coach_id];
      rawItems.push({
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
        coach_id: c.coach_id,
      });
    }

    // Score all items using the engagement-aware scorePost algorithm
    const scored: PersonalizedItem[] = rawItems.map((item) => {
      // Use the new scorePost algorithm for primary ranking
      const postScore = scorePost(
        {
          coach_id: item.coach_id,
          sport: item.sport,
          likes_count: item.likes_count,
          comments_count: item.comments_count,
          created_at: item.created_at,
          is_boosted: item.is_boosted,
        },
        userFollowingList,
        userSports,
        userBookedCoachIds
      );

      // Also run legacy scoreItem for blended signal
      const nowMs = Date.now();
      const maxLikes = Math.max(1, ...rawItems.map((i) => i.likes_count));
      const maxViews = Math.max(1, ...rawItems.map((i) => i.views || 0));
      const { score: legacyScore, source } = scoreItem(
        {
          coach_id: item.coach_id,
          sport: item.sport,
          likes_count: item.likes_count,
          views: item.views,
          created_at: item.created_at,
          is_boosted: item.is_boosted,
        },
        followedIds,
        signals,
        maxLikes,
        maxViews,
        nowMs
      );

      // Blend: 60% new scorePost (normalized to 0-1 range assuming max ~200), 40% legacy
      const blendedScore = (postScore / 200) * 0.6 + legacyScore * 0.4;

      // Remove internal fields before returning
      const { coach_id: _cid, is_boosted: _b, ...cleanItem } = item;
      return { ...cleanItem, score: blendedScore, source };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Anti-repetition: no same coach back-to-back
    const deduped: PersonalizedItem[] = [];
    const remaining = [...scored];
    while (remaining.length > 0 && deduped.length < limit) {
      const lastCoach = deduped.length > 0 ? deduped[deduped.length - 1].coach_name : null;
      const diffIdx = remaining.findIndex((item) => item.coach_name !== lastCoach);
      if (diffIdx >= 0) {
        deduped.push(remaining.splice(diffIdx, 1)[0]);
      } else {
        deduped.push(remaining.shift()!);
      }
    }

    // Ensure at least some variety of sources in the top results
    // If user follows coaches, guarantee at least 2 "following" items in top 6
    if (followedIds.size > 0) {
      const top6 = deduped.slice(0, 6);
      const followingInTop = top6.filter((i) => i.source === "following").length;
      if (followingInTop < 2) {
        const followingBelow = deduped.slice(6).filter((i) => i.source === "following");
        for (const item of followingBelow.slice(0, 2 - followingInTop)) {
          const idx = deduped.indexOf(item);
          if (idx > -1) {
            deduped.splice(idx, 1);
            // Insert at position 1 or 3 for good interleaving
            const insertAt = followingInTop === 0 ? 1 : 3;
            deduped.splice(Math.min(insertAt, deduped.length), 0, item);
          }
        }
      }
    }

    setItems(deduped.slice(0, limit));
    setLoading(false);
  }, [isRealMode, followedIds, signals, limit, userFollowingList, userSports, userBookedCoachIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Computed breakdowns
  const sourceCounts = useMemo(() => {
    const counts = { following: 0, trending: 0, recommended: 0 };
    for (const item of items) counts[item.source]++;
    return counts;
  }, [items]);

  const result = useMemo(
    () => ({ items, loading, refresh, sourceCounts }),
    [items, loading, refresh, sourceCounts]
  );
  return result;
};
