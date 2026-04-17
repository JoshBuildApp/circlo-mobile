import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DiscoverCoach } from "./use-discover-coaches";

/**
 * Smart Coach-Athlete Matching
 *
 * Scores coach compatibility across 4 dimensions (total 100 pts):
 *   Sport Match      — 30 pts: user's interest list vs coach sport
 *   Price Fit        — 25 pts: user's historical spend vs coach price
 *   Schedule Overlap — 25 pts: user's preferred booking days vs coach availability
 *   Skill Level Fit  — 20 pts: trainee_progress level → appropriate coach tier
 */

export interface MatchScore {
  coachId: string;
  total: number;       // 0–100
  sport: number;       // 0–30
  price: number;       // 0–25
  schedule: number;    // 0–25
  skill: number;       // 0–20
  reasons: string[];
}

export interface MatchedCoach extends DiscoverCoach {
  matchScore: MatchScore;
}

// ---------------------------------------------------------------------------
// Athlete skill tier derived from trainee_progress.level
// ---------------------------------------------------------------------------
type SkillTier = "beginner" | "intermediate" | "advanced" | "unknown";

function skillTierFromLevel(level: number | null): SkillTier {
  if (level == null || level <= 0) return "unknown";
  if (level <= 3) return "beginner";
  if (level <= 6) return "intermediate";
  return "advanced";
}

// ---------------------------------------------------------------------------
// Score: Sport Match (0-30)
// ---------------------------------------------------------------------------
function scoreSport(
  coachSport: string,
  interests: string[],
): { pts: number; reason: string | null } {
  if (!interests.length) return { pts: 0, reason: null };
  const sport = coachSport.toLowerCase();
  const match = interests.some((i) => i.toLowerCase() === sport);
  if (match) {
    return { pts: 30, reason: `Coaches ${coachSport}` };
  }
  return { pts: 0, reason: null };
}

// ---------------------------------------------------------------------------
// Score: Price Fit (0-25)
// ---------------------------------------------------------------------------
function scorePrice(
  coachPrice: number,
  userBudget: number | null,
): { pts: number; reason: string | null } {
  // No history — give a partial neutral score
  if (userBudget == null || userBudget <= 0) {
    return { pts: 10, reason: null };
  }

  const ratio = coachPrice / userBudget;

  if (ratio <= 1.0) {
    // Within or under budget
    const pts = ratio <= 0.8 ? 20 : 25; // great deal or perfect fit
    const reason = ratio <= 0.8 ? "Great value" : "Fits your budget";
    return { pts, reason };
  }
  if (ratio <= 1.25) {
    // Slightly above budget (≤25% over)
    return { pts: 15, reason: null };
  }
  if (ratio <= 1.5) {
    // Moderately above budget
    return { pts: 8, reason: null };
  }
  // Significantly above budget
  return { pts: 2, reason: null };
}

// ---------------------------------------------------------------------------
// Score: Schedule Overlap (0-25)
// ---------------------------------------------------------------------------
function scoreSchedule(
  coachAvailableDays: Set<number>,
  preferredDays: Set<number>,
): { pts: number; reason: string | null } {
  if (preferredDays.size === 0 || coachAvailableDays.size === 0) {
    // No data — give baseline
    return { pts: 10, reason: null };
  }

  let overlap = 0;
  for (const day of preferredDays) {
    if (coachAvailableDays.has(day)) overlap++;
  }

  const ratio = overlap / preferredDays.size;
  if (ratio >= 0.8) return { pts: 25, reason: "Available on your schedule" };
  if (ratio >= 0.5) return { pts: 18, reason: "Good schedule overlap" };
  if (ratio >= 0.25) return { pts: 10, reason: null };
  return { pts: 3, reason: null };
}

// ---------------------------------------------------------------------------
// Score: Skill Level Fit (0-20)
// ---------------------------------------------------------------------------
function scoreSkillFit(
  tier: SkillTier,
  coach: DiscoverCoach,
  availabilitySlotCount: number,
): { pts: number; reason: string | null } {
  switch (tier) {
    case "beginner":
      // Beginners benefit from accessible, approachable coaches with more open slots
      if (availabilitySlotCount >= 5) return { pts: 20, reason: "Great for beginners" };
      if (availabilitySlotCount >= 3) return { pts: 14, reason: null };
      return { pts: 8, reason: null };

    case "intermediate":
      // Intermediate athletes need verified, well-rated coaches
      if (coach.isVerified && coach.rating >= 4.0) {
        return { pts: 20, reason: "Verified — rated for your level" };
      }
      if (coach.isVerified || coach.rating >= 4.0) return { pts: 14, reason: null };
      return { pts: 6, reason: null };

    case "advanced":
      // Advanced athletes benefit from pro/top-rated coaches
      if (coach.isPro && coach.rating >= 4.5) {
        return { pts: 20, reason: "Elite pro coach" };
      }
      if (coach.isPro || coach.rating >= 4.5) return { pts: 16, reason: null };
      if (coach.isVerified && coach.rating >= 4.0) return { pts: 10, reason: null };
      return { pts: 4, reason: null };

    case "unknown":
    default:
      // New athlete — neutral baseline that favors quality
      if (coach.isVerified) return { pts: 14, reason: null };
      return { pts: 8, reason: null };
  }
}

// ---------------------------------------------------------------------------
// Athlete signals fetched once per session
// ---------------------------------------------------------------------------
interface AthleteSignals {
  interests: string[];
  budget: number | null;          // avg price from booking history
  preferredDays: Set<number>;     // 0=Sun, 6=Sat
  skillTier: SkillTier;
}

async function fetchAthleteSignals(userId: string): Promise<AthleteSignals> {
  const [profileRes, progressRes, bookingsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("interests")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("trainee_progress")
      .select("level")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("date, price")
      .eq("user_id", userId)
      .in("status", ["confirmed", "completed", "upcoming"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const interests = (profileRes.data?.interests as string[] | null) ?? [];

  const level = progressRes.data?.level ?? null;
  const skillTier = skillTierFromLevel(level);

  const pastBookings = bookingsRes.data ?? [];
  const budget =
    pastBookings.length > 0
      ? pastBookings.reduce((sum, b) => sum + (b.price ?? 0), 0) / pastBookings.length
      : null;

  const preferredDays = new Set<number>(
    pastBookings.map((b) => new Date(b.date).getDay()),
  );

  return { interests, budget, preferredDays, skillTier };
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------
interface UseCoachMatchingOptions {
  /** Coaches already fetched by useDiscoverCoaches (or similar) */
  coaches: DiscoverCoach[];
  /** Map of coachId → availability slot count (days with at least 1 active slot) */
  availabilitySlotCount?: Record<string, number>;
  /** Map of coachId → Set of available day_of_week numbers */
  availabilityDays?: Record<string, Set<number>>;
}

export interface UseCoachMatchingResult {
  matched: MatchedCoach[];
  loading: boolean;
}

export function useCoachMatching({
  coaches,
  availabilitySlotCount = {},
  availabilityDays = {},
}: UseCoachMatchingOptions): UseCoachMatchingResult {
  const { user } = useAuth();
  const [signals, setSignals] = useState<AthleteSignals | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);

    fetchAthleteSignals(user.id).then((s) => {
      if (!cancelled) {
        setSignals(s);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const matched = useMemo<MatchedCoach[]>(() => {
    if (!signals || coaches.length === 0) {
      // No user data — return coaches unchanged with zero match scores
      return coaches.map((c) => ({
        ...c,
        matchScore: {
          coachId: c.id,
          total: 0,
          sport: 0,
          price: 0,
          schedule: 0,
          skill: 0,
          reasons: [],
        },
      }));
    }

    const scored: MatchedCoach[] = coaches.map((coach) => {
      const reasons: string[] = [];

      const sportResult = scoreSport(coach.sport, signals.interests);
      const priceResult = scorePrice(coach.price, signals.budget);
      const schedResult = scoreSchedule(
        availabilityDays[coach.id] ?? new Set(),
        signals.preferredDays,
      );
      const skillResult = scoreSkillFit(
        signals.skillTier,
        coach,
        availabilitySlotCount[coach.id] ?? 0,
      );

      if (sportResult.reason) reasons.push(sportResult.reason);
      if (priceResult.reason) reasons.push(priceResult.reason);
      if (schedResult.reason) reasons.push(schedResult.reason);
      if (skillResult.reason) reasons.push(skillResult.reason);

      // Verified + boosted bonus reasons (display only, not scored separately)
      if (coach.isVerified && !reasons.includes("Verified — rated for your level")) {
        reasons.push("Verified coach");
      }
      if (coach.isBoosted) reasons.push("Featured");

      const total =
        sportResult.pts + priceResult.pts + schedResult.pts + skillResult.pts;

      return {
        ...coach,
        matchScore: {
          coachId: coach.id,
          total: Math.min(100, total),
          sport: sportResult.pts,
          price: priceResult.pts,
          schedule: schedResult.pts,
          skill: skillResult.pts,
          reasons: reasons.slice(0, 3),
        },
      };
    });

    // Sort by total match score descending
    scored.sort((a, b) => b.matchScore.total - a.matchScore.total);

    return scored;
  }, [coaches, signals, availabilitySlotCount, availabilityDays]);

  return { matched, loading };
}
