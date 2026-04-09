import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/contexts/DataModeContext";
import type { FeedVideo } from "@/hooks/use-feed";

/**
 * Smart feed algorithm — scores & ranks videos based on:
 * - User watch history (sport affinity, coach affinity)
 * - Video engagement (likes, comments, views)
 * - Recency
 * - Boost status
 * - Anti-repetition (no same coach back-to-back)
 * - Discovery mix (10% random fresh content)
 */

interface UserSignals {
  sportCounts: Record<string, number>;
  coachCounts: Record<string, number>;
  watchedIds: Set<string>;
  totalWatches: number;
}

const EMPTY_SIGNALS: UserSignals = {
  sportCounts: {},
  coachCounts: {},
  watchedIds: new Set(),
  totalWatches: 0,
};

/** Fetch user watch history to build affinity signals */
async function fetchUserSignals(userId: string): Promise<UserSignals> {
  // Get recent watches (last 200)
  const { data: watches } = await supabase
    .from("video_watches")
    .select("video_id, watch_seconds")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!watches || watches.length === 0) return EMPTY_SIGNALS;

  const watchedIds = new Set(watches.map((w) => w.video_id));

  // Get video metadata for watched videos to learn sport/coach preferences
  const videoIds = [...watchedIds];
  const { data: videos } = await supabase
    .from("coach_videos")
    .select("id, coach_id")
    .in("id", videoIds);

  if (!videos) return { ...EMPTY_SIGNALS, watchedIds, totalWatches: watches.length };

  // Build watch-time weighted affinity maps
  const watchMap: Record<string, number> = {};
  for (const w of watches) {
    watchMap[w.video_id] = (watchMap[w.video_id] || 0) + w.watch_seconds;
  }

  // Get coach profiles for sport info
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

/** Score a single video for a user */
function scoreVideo(
  video: FeedVideo,
  signals: UserSignals,
  maxLikes: number,
  maxViews: number,
  nowMs: number
): number {
  // --- Engagement score (0-1) ---
  const engagementLikes = maxLikes > 0 ? video.likes_count / maxLikes : 0;
  const engagementViews = maxViews > 0 ? (video.views || 0) / maxViews : 0;
  const engagement = engagementLikes * 0.6 + engagementViews * 0.4;

  // --- Recency score (0-1) — newer is higher ---
  const ageMs = nowMs - new Date(video.created_at).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const recency = Math.max(0, 1 - ageHours / (24 * 30)); // decays over 30 days

  // --- Affinity score (0-1) — based on user's sport/coach preferences ---
  let affinity = 0;
  if (signals.totalWatches > 0) {
    const totalSportWeight = Object.values(signals.sportCounts).reduce((a, b) => a + b, 0) || 1;
    const totalCoachWeight = Object.values(signals.coachCounts).reduce((a, b) => a + b, 0) || 1;
    
    const sportAffinity = (signals.sportCounts[video.sport || ""] || 0) / totalSportWeight;
    const coachAffinity = (signals.coachCounts[video.coach_id] || 0) / totalCoachWeight;
    affinity = sportAffinity * 0.6 + coachAffinity * 0.4;
  }

  // --- Freshness bonus: unseen content gets a small bump ---
  const unseenBonus = signals.watchedIds.has(video.id) ? 0 : 0.1;

  // --- Boost bonus (monetization) ---
  const boostBonus = (video as any).is_boosted ? 0.15 : 0;

  // --- Final weighted score ---
  // New users (totalWatches < 5): rely more on engagement + recency
  // Returning users: lean into affinity
  const affinityWeight = signals.totalWatches >= 5 ? 0.4 : 0.1;
  const engagementWeight = signals.totalWatches >= 5 ? 0.25 : 0.5;
  const recencyWeight = 0.15;

  return (
    engagement * engagementWeight +
    recency * recencyWeight +
    affinity * affinityWeight +
    unseenBonus +
    boostBonus +
    Math.random() * 0.05 // tiny random jitter for discovery
  );
}

/** Anti-repetition: ensure no same coach appears back-to-back */
function dedupeCoachOrder(videos: FeedVideo[]): FeedVideo[] {
  if (videos.length <= 2) return videos;

  const result: FeedVideo[] = [videos[0]];
  const remaining = videos.slice(1);

  while (remaining.length > 0) {
    const lastCoach = result[result.length - 1].coach_id;
    // Find first video from a different coach
    const diffIdx = remaining.findIndex((v) => v.coach_id !== lastCoach);
    if (diffIdx >= 0) {
      result.push(remaining.splice(diffIdx, 1)[0]);
    } else {
      // All remaining are same coach, just append
      result.push(remaining.shift()!);
    }
  }

  return result;
}

/** Insert discovery items at ~every 10th position */
function injectDiscovery(ranked: FeedVideo[], allVideos: FeedVideo[], signals: UserSignals): FeedVideo[] {
  if (signals.totalWatches < 3 || allVideos.length <= ranked.length) return ranked;

  // Find videos the user hasn't interacted with much, from unfamiliar sports
  const rankedIds = new Set(ranked.map((v) => v.id));
  const topSports = Object.entries(signals.sportCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([s]) => s);

  const discoveryPool = allVideos.filter(
    (v) => !rankedIds.has(v.id) && !topSports.includes(v.sport || "")
  );

  if (discoveryPool.length === 0) return ranked;

  const result = [...ranked];
  let inserted = 0;
  for (let i = 9; i < result.length + inserted && discoveryPool.length > 0; i += 10) {
    const pick = discoveryPool.splice(Math.floor(Math.random() * discoveryPool.length), 1)[0];
    result.splice(i, 0, pick);
    inserted++;
  }

  return result;
}

export interface SmartFeedResult {
  videos: FeedVideo[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  trackWatch: (videoId: string, seconds: number, completed: boolean) => void;
}

export const useSmartFeed = (): SmartFeedResult => {
  const { user } = useAuth();
  const { isRealMode } = useDataMode();
  const [allVideos, setAllVideos] = useState<FeedVideo[]>([]);
  const [signals, setSignals] = useState<UserSignals>(EMPTY_SIGNALS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const signalsFetched = useRef(false);

  // Fetch all videos
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("coach_videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (isRealMode) {
        query = query.eq("is_fake", false);
      }

      const { data: vids, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!vids || vids.length === 0) {
        setAllVideos([]);
        setLoading(false);
        return;
      }

      const coachIds = [...new Set(vids.map((v: any) => v.coach_id))];
      const { data: profiles } = await supabase
        .from("coach_profiles")
        .select("id, user_id, coach_name, sport, image_url, is_boosted")
        .in("id", coachIds);

      const profileMap: Record<string, any> = {};
      if (profiles) for (const p of profiles) profileMap[p.id] = p;

      const mapped = vids
        .map((v: any) => {
          const profile = profileMap[v.coach_id];
          if (!profile?.coach_name?.trim()) return null;
          return {
            ...v,
            coach_name: profile.coach_name,
            sport: profile.sport || "",
            coach_image: profile.image_url || null,
            is_boosted: profile.is_boosted || false,
          };
        })
        .filter((v): v is FeedVideo => v !== null);

      setAllVideos(mapped);
    } catch (err: unknown) {
      console.error("Failed to load smart feed:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [isRealMode]);

  // Fetch user signals
  useEffect(() => {
    if (user && !signalsFetched.current) {
      signalsFetched.current = true;
      fetchUserSignals(user.id).then(setSignals);
    }
  }, [user]);

  useEffect(() => {
    fetchVideos();

    // Re-fetch when new content is uploaded
    const handleUpload = () => fetchVideos();
    window.addEventListener("content-uploaded", handleUpload);
    return () => window.removeEventListener("content-uploaded", handleUpload);
  }, [fetchVideos]);

  // Score and rank
  const rankedVideos = useMemo(() => {
    if (allVideos.length === 0) return [];

    const nowMs = Date.now();
    const maxLikes = Math.max(1, ...allVideos.map((v) => v.likes_count));
    const maxViews = Math.max(1, ...allVideos.map((v) => v.views || 0));

    const scored = allVideos.map((v) => ({
      video: v,
      score: scoreVideo(v, signals, maxLikes, maxViews, nowMs),
    }));

    scored.sort((a, b) => b.score - a.score);
    const sorted = scored.map((s) => s.video);

    // Anti-repetition
    const deduped = dedupeCoachOrder(sorted);

    // Inject discovery content
    return injectDiscovery(deduped, allVideos, signals);
  }, [allVideos, signals]);

  // Track watch event
  const trackWatch = useCallback(
    async (videoId: string, seconds: number, completed: boolean) => {
      if (!user || seconds < 1) return;
      await supabase.from("video_watches").insert({
        user_id: user.id,
        video_id: videoId,
        watch_seconds: seconds,
        completed,
      });
    },
    [user]
  );

  return {
    videos: rankedVideos,
    loading,
    error,
    refresh: fetchVideos,
    trackWatch,
  };
};
