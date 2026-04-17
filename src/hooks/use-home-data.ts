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

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HomeData {
  totalCoaches: number;
  totalBookings: number;
  activeSports: string[];
  featuredCoaches: HomeCoach[];
  topCoaches: HomeCoach[];
  trendingCoaches: HomeCoach[];
}

export function useHomeData() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Parallel fetches for speed
      const [countRes, bookingsRes, coachesRes] = await Promise.all([
        supabase.from('coach_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('coach_profiles').select(
          'id, coach_name, sport, image_url, rating, price, is_verified, is_pro, is_boosted, followers, is_top_creator, location, bio, tagline'
        ).limit(20),
      ]);

      const coaches: HomeCoach[] = (coachesRes.data || []) as HomeCoach[];

      const activeSports = Array.from(
        new Set(coaches.map(c => c.sport).filter(Boolean))
      );

      // Top coaches: highest rated
      const topCoaches = [...coaches]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);

      // Trending: most followers
      const trendingCoaches = [...coaches]
        .sort((a, b) => (b.followers || 0) - (a.followers || 0))
        .slice(0, 8);

      // Featured: verified or top creators first
      const featuredCoaches = [...coaches]
        .sort((a, b) => {
          const aScore = (a.is_top_creator ? 10 : 0) + (a.is_verified ? 5 : 0) + (a.rating || 0);
          const bScore = (b.is_top_creator ? 10 : 0) + (b.is_verified ? 5 : 0) + (b.rating || 0);
          return bScore - aScore;
        })
        .slice(0, 9);

      setData({
        totalCoaches: countRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        activeSports,
        featuredCoaches,
        topCoaches,
        trendingCoaches,
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stable = useMemo(() => ({ data, loading, refetch: fetchHomeData }), [data, loading]);
  return stable;
}
