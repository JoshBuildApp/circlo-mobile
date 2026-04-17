import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCoachMatching } from './use-coach-matching';
import type { DiscoverCoach } from './use-discover-coaches';
import type { MatchedCoach } from './use-coach-matching';

export type { MatchedCoach };

export interface CoachWithScore {
  id: string;
  coach_name: string;
  avatar_url: string | null;
  bio: string | null;
  sport: string;
  location: string | null;
  rating: number;
  reviews_count: number;
  price: number | null;
  is_verified: boolean;
  recommendation_score: number;
  recommendation_reasons: string[];
  match_score: number;
}

/** Fetch coaches for recommendations (verified coaches only, up to 40) */
async function fetchCandidateCoaches(): Promise<DiscoverCoach[]> {
  const { data: coaches, error } = await supabase
    .from('coach_profiles')
    .select('id, coach_name, image_url, bio, sport, location, price, is_verified, is_pro, is_boosted, rating, followers, tagline')
    .eq('is_verified', true)
    .limit(40);

  if (error || !coaches) return [];

  return coaches
    .filter((c: any) => c.coach_name?.trim())
    .map((c: any) => ({
      id: c.id,
      name: c.coach_name,
      sport: c.sport || '',
      image: c.image_url || '',
      tagline: c.tagline || c.bio || '',
      rating: c.rating ?? 0,
      price: c.price ?? 0,
      isVerified: !!c.is_verified,
      isPro: !!c.is_pro,
      isBoosted: !!c.is_boosted,
      followers: c.followers ?? 0,
      location: c.location || '',
      coords: null,
    }));
}

/** Fetch availability map for a list of coach IDs */
async function fetchAvailabilityMaps(coachIds: string[]): Promise<{
  slotCount: Record<string, number>;
  days: Record<string, Set<number>>;
}> {
  if (coachIds.length === 0) return { slotCount: {}, days: {} };

  const { data } = await supabase
    .from('availability')
    .select('coach_id, day_of_week')
    .in('coach_id', coachIds)
    .eq('is_active', true);

  const slotCount: Record<string, number> = {};
  const days: Record<string, Set<number>> = {};

  for (const row of data ?? []) {
    const id = row.coach_id as string;
    const dow = row.day_of_week as number;
    slotCount[id] = (slotCount[id] ?? 0) + 1;
    if (!days[id]) days[id] = new Set();
    days[id].add(dow);
  }

  return { slotCount, days };
}

/**
 * Hook that returns top recommended coaches using the smart matching algorithm.
 * Scores across: sport match, price fit, schedule overlap, and skill level fit.
 */
export function useCoachRecommendations() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<DiscoverCoach[]>([]);
  const [availabilitySlotCount, setAvailabilitySlotCount] = useState<Record<string, number>>({});
  const [availabilityDays, setAvailabilityDays] = useState<Record<string, Set<number>>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);

    fetchCandidateCoaches().then(async (coaches) => {
      if (cancelled) return;
      setCandidates(coaches);

      const ids = coaches.map((c) => c.id);
      const { slotCount, days } = await fetchAvailabilityMaps(ids);
      if (cancelled) return;
      setAvailabilitySlotCount(slotCount);
      setAvailabilityDays(days);
      setDataLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.id]); // re-run if user changes

  const { matched, loading: matchLoading } = useCoachMatching({
    coaches: candidates,
    availabilitySlotCount,
    availabilityDays,
  });

  const loading = dataLoading || matchLoading;

  // Shape back to CoachWithScore for backwards compatibility
  const recommendedCoaches: CoachWithScore[] = matched.slice(0, 10).map((m) => ({
    id: m.id,
    coach_name: m.name,
    avatar_url: m.image || null,
    bio: m.tagline || null,
    sport: m.sport,
    location: m.location || null,
    rating: m.rating,
    reviews_count: 0,
    price: m.price,
    is_verified: m.isVerified,
    recommendation_score: m.matchScore.total,
    recommendation_reasons: m.matchScore.reasons,
    match_score: m.matchScore.total,
  }));

  return {
    recommendedCoaches,
    loading,
    /** Full scored result for advanced consumers */
    matchedCoaches: matched.slice(0, 10),
    refetch: () => {
      // Trigger a re-fetch by clearing candidates, which re-runs the effect
      setCandidates([]);
    },
  };
}
