export interface HomeCoach {
  id: string;
  coach_name: string;
  sport: string;
  image_url?: string;
  rating?: number;
  price?: number;
  is_verified?: boolean;
  is_pro?: boolean;
  is_boosted?: boolean;
  followers?: number;
  is_top_creator?: boolean;
  location?: string;
  bio?: string;
  tagline?: string;
}

export interface UpcomingSessionItem {
  id: string;
  coach_id: string;
  coach_name: string;
  date: string;          // ISO date "YYYY-MM-DD"
  time: string;          // "HH:mm:ss" or label
  time_label?: string | null;
  training_type?: string | null;
  price?: number | null;
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HomeData {
  totalCoaches: number;
  totalBookings: number;
  activeSports: string[];
  featuredCoaches: HomeCoach[];
  topCoaches: HomeCoach[];
  trendingCoaches: HomeCoach[];
  /** Coaches ranked by the user's `profile.interests` (falls back to rating). */
  recommendedCoaches: HomeCoach[];
  /** Most recently created coach profiles (new on Circlo). */
  newCoaches: HomeCoach[];
  /** Next upcoming booking(s) for the current user. Empty if not logged in. */
  upcomingSessions: UpcomingSessionItem[];
  /** Counts of coaches per sport, for the Browse-by-sport chips. */
  sportCounts: Record<string, number>;
}

// Minimal row shape we select; extended with created_at for "new" sort.
interface CoachRow extends HomeCoach {
  created_at?: string | null;
}

export function useHomeData() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);

      const [countRes, bookingsRes, coachesRes, upcomingRes] = await Promise.all([
        supabase.from('coach_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase
          .from('coach_profiles')
          .select(
            'id, coach_name, sport, image_url, rating, price, is_verified, is_pro, is_boosted, followers, is_top_creator, location, bio, tagline, created_at'
          )
          .limit(40),
        user
          ? supabase
              .from('bookings')
              .select('id, coach_id, coach_name, date, time, time_label, training_type, price, status')
              .eq('user_id', user.id)
              .in('status', ['upcoming', 'confirmed', 'pending'])
              .gte('date', new Date().toISOString().split('T')[0])
              .order('date', { ascending: true })
              .limit(5)
          : Promise.resolve({ data: [] as UpcomingSessionItem[] }),
      ]);

      const coaches: CoachRow[] = (coachesRes.data as CoachRow[] | null) || [];

      const activeSports = Array.from(
        new Set(coaches.map((c) => c.sport).filter(Boolean))
      );

      const sportCounts: Record<string, number> = {};
      for (const c of coaches) {
        if (!c.sport) continue;
        sportCounts[c.sport] = (sportCounts[c.sport] || 0) + 1;
      }

      const topCoaches = [...coaches]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);

      const trendingCoaches = [...coaches]
        .sort((a, b) => (b.followers || 0) - (a.followers || 0))
        .slice(0, 8);

      const featuredCoaches = [...coaches]
        .sort((a, b) => {
          const aScore = (a.is_top_creator ? 10 : 0) + (a.is_verified ? 5 : 0) + (a.rating || 0);
          const bScore = (b.is_top_creator ? 10 : 0) + (b.is_verified ? 5 : 0) + (b.rating || 0);
          return bScore - aScore;
        })
        .slice(0, 9);

      // New on Circlo — freshest created_at first.
      const newCoaches = [...coaches]
        .filter((c) => !!c.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 8);

      // Recommended — weight by interest match, then rating. If no interests,
      // fall back to rating (same as top).
      const interests = (profile?.interests || []).map((i) => i.toLowerCase());
      const recommendedCoaches = [...coaches]
        .map((c) => {
          const sport = (c.sport || '').toLowerCase();
          const interestScore = interests.includes(sport) ? 100 : 0;
          return { c, score: interestScore + (c.rating || 0) * 2 + (c.followers || 0) / 1000 };
        })
        .sort((a, b) => b.score - a.score)
        .map(({ c }) => c)
        .slice(0, 8);

      const upcomingSessions = ((upcomingRes as { data: UpcomingSessionItem[] | null }).data || [])
        .map((b) => ({
          id: b.id,
          coach_id: b.coach_id,
          coach_name: b.coach_name,
          date: b.date,
          time: b.time,
          time_label: b.time_label ?? null,
          training_type: b.training_type ?? null,
          price: b.price ?? null,
        }));

      setData({
        totalCoaches: countRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        activeSports,
        featuredCoaches,
        topCoaches,
        trendingCoaches,
        recommendedCoaches,
        newCoaches,
        upcomingSessions,
        sportCounts,
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const stable = useMemo(() => ({ data, loading, refetch: fetchHomeData }), [data, loading, fetchHomeData]);
  return stable;
}
