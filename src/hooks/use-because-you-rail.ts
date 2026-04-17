import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DiscoverCoach } from "./use-discover-coaches";

export type BecauseYouReason =
  | { type: "sport"; sport: string }
  | { type: "followed" }
  | { type: "similar_to"; coachName: string }
  | null;

interface UseBecauseYouRailResult {
  coaches: DiscoverCoach[];
  reason: BecauseYouReason;
  loading: boolean;
}

/**
 * Builds a single "Because you..." rail for Discover. Uses the strongest signal
 * available (in priority order):
 *   1. Last booked coach → "Similar to {coach}" (same sport, not same coach)
 *   2. Most watched sport → "Because you watched {sport} videos"
 *   3. Following → "Coaches followed by people you follow" (2-hop)
 *
 * Returns up to 6 coaches, scored and ranked against the candidate pool.
 * Server-side ranking is out of scope for this hook — intentionally uses
 * simple in-memory filtering from the candidate list Discover already loaded.
 */
export function useBecauseYouRail(candidates: DiscoverCoach[]): UseBecauseYouRailResult {
  const { user } = useAuth();
  const [reason, setReason] = useState<BecauseYouReason>(null);
  const [signalCoachIds, setSignalCoachIds] = useState<Set<string>>(new Set());
  const [signalSport, setSignalSport] = useState<string | null>(null);
  const [excludeCoachId, setExcludeCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setReason(null);
      return;
    }
    let cancelled = false;

    const run = async () => {
      setLoading(true);

      // 1) Last booked coach → similar_to
      const { data: bookings } = await supabase
        .from("bookings")
        .select("coach_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (cancelled) return;

      if (bookings && bookings.length > 0 && bookings[0].coach_id) {
        const lastCoachId = (bookings[0] as { coach_id: string }).coach_id;
        const { data: coach } = await supabase
          .from("coach_profiles")
          .select("id, coach_name, sport")
          .eq("id", lastCoachId)
          .maybeSingle();
        if (cancelled) return;
        if (coach) {
          setExcludeCoachId(coach.id);
          setSignalSport(((coach as { sport: string | null }).sport || "").toLowerCase() || null);
          setReason({ type: "similar_to", coachName: (coach as { coach_name: string }).coach_name });
          setLoading(false);
          return;
        }
      }

      // 2) Most watched sport → sport affinity
      const { data: watches } = await supabase
        .from("video_watches")
        .select("video_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60);
      if (cancelled) return;

      if (watches && watches.length > 0) {
        const videoIds = [...new Set(watches.map((w) => (w as { video_id: string }).video_id))];
        const { data: videos } = await supabase
          .from("coach_videos")
          .select("coach_id")
          .in("id", videoIds);
        if (cancelled) return;
        const coachIds = [
          ...new Set((videos || []).map((v) => (v as { coach_id: string }).coach_id).filter(Boolean)),
        ];
        if (coachIds.length > 0) {
          const { data: coaches } = await supabase
            .from("coach_profiles")
            .select("sport")
            .in("id", coachIds);
          if (cancelled) return;
          const sportCounts: Record<string, number> = {};
          for (const c of (coaches || []) as { sport: string | null }[]) {
            const s = (c.sport || "").toLowerCase();
            if (!s) continue;
            sportCounts[s] = (sportCounts[s] || 0) + 1;
          }
          const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
          if (topSport) {
            setSignalSport(topSport);
            setReason({ type: "sport", sport: topSport });
            setLoading(false);
            return;
          }
        }
      }

      // 3) Followed → coaches followed by people you follow (friend-of-friend, light version)
      const { data: myFollows } = await supabase
        .from("user_follows")
        .select("coach_id")
        .eq("user_id", user.id)
        .limit(40);
      if (cancelled) return;
      const followedIds = ((myFollows as unknown as { coach_id: string }[] | null) || []).map(
        (r) => r.coach_id,
      );
      if (followedIds.length > 0) {
        const { data: fof } = await supabase
          .from("user_follows")
          .select("coach_id")
          .in("user_id", followedIds as unknown as string[])
          .limit(200);
        if (cancelled) return;
        const ids = new Set(
          ((fof as unknown as { coach_id: string }[] | null) || [])
            .map((r) => r.coach_id)
            .filter((id) => !followedIds.includes(id)),
        );
        if (ids.size > 0) {
          setSignalCoachIds(ids);
          setReason({ type: "followed" });
          setLoading(false);
          return;
        }
      }

      setReason(null);
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const coaches = useMemo(() => {
    if (!reason) return [];
    let pool = candidates;
    if (excludeCoachId) pool = pool.filter((c) => c.id !== excludeCoachId);

    switch (reason.type) {
      case "similar_to":
      case "sport": {
        const sport = reason.type === "sport" ? reason.sport : signalSport;
        if (!sport) return [];
        return pool
          .filter((c) => c.sport.toLowerCase() === sport.toLowerCase())
          .slice(0, 6);
      }
      case "followed":
        return pool.filter((c) => signalCoachIds.has(c.id)).slice(0, 6);
      default:
        return [];
    }
  }, [candidates, reason, excludeCoachId, signalCoachIds, signalSport]);

  return { coaches, reason, loading };
}

export function describeReason(reason: BecauseYouReason): string {
  if (!reason) return "";
  switch (reason.type) {
    case "similar_to":
      return `Similar to ${reason.coachName}`;
    case "sport":
      return `Because you watched ${reason.sport} videos`;
    case "followed":
      return "Coaches followed by people you follow";
    default:
      return "";
  }
}
