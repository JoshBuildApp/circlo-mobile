import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CoachWithScore {
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
}

export function useCoachRecommendations() {
  const [recommendedCoaches, setRecommendedCoaches] = useState<CoachWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedCoaches();
  }, []);

  const fetchRecommendedCoaches = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('interests, bio')
        .eq('user_id', user.id)
        .single();

      const { data: coaches } = await supabase
        .from('coach_profiles')
        .select('id, coach_name, image_url, bio, sport, location, price, is_verified, rating')
        .eq('is_verified', true)
        .limit(20);

      if (!coaches) { setLoading(false); return; }

      const coachIds = coaches.map(c => c.id);

      const { data: reviews } = await supabase
        .from('reviews')
        .select('coach_id, rating')
        .in('coach_id', coachIds);

      const scoredCoaches: CoachWithScore[] = coaches.map((coach: any) => {
        let score = 0;
        const reasons: string[] = [];

        const coachReviews = (reviews || []).filter((r: any) => r.coach_id === coach.id);
        const avgRating = coachReviews.length > 0
          ? coachReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / coachReviews.length
          : coach.rating || 0;

        if (avgRating >= 4.0) {
          score += 1;
          reasons.push(`Highly rated (${avgRating.toFixed(1)}⭐)`);
        }

        if (coach.is_verified) {
          score += 2;
          reasons.push('Verified coach');
        }

        if (userProfile?.interests?.length && coach.sport) {
          if ((userProfile.interests as string[]).includes(coach.sport)) {
            score += 3;
            reasons.push(`Teaches ${coach.sport}`);
          }
        }

        return {
          id: coach.id,
          coach_name: coach.coach_name,
          avatar_url: coach.image_url,
          bio: coach.bio,
          sport: coach.sport,
          location: coach.location,
          rating: avgRating,
          reviews_count: coachReviews.length,
          price: coach.price,
          is_verified: coach.is_verified,
          recommendation_score: score,
          recommendation_reasons: reasons,
        };
      });

      const topRecommendations = scoredCoaches
        .sort((a, b) => b.recommendation_score - a.recommendation_score)
        .slice(0, 10);

      setRecommendedCoaches(topRecommendations);
    } catch (error) {
      console.error('Error fetching recommended coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  return { recommendedCoaches, loading, refetch: fetchRecommendedCoaches };
}
