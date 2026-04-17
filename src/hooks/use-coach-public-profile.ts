import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCoachPublicProfile = (coachId: string | undefined) => {
  return useQuery({
    queryKey: ['public-coach-profile', coachId],
    queryFn: async () => {
      if (!coachId) throw new Error('Coach ID is required');

      const { data, error } = await supabase
        .from('coach_profiles')
        .select('id, user_id, coach_name, sport, bio, tagline, image_url, cover_media, location, price, rating, followers, total_sessions, years_experience, is_verified, specialties, certifications, achievements, intro_video_url, session_duration, training_style, ideal_for, languages, response_time, updated_at')
        .eq('id', coachId)
        .maybeSingle();

      if (error) { console.error('Error fetching public coach profile:', error); throw error; }
      if (!data) throw new Error('Coach not found');

      // Also fetch the profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('user_id', data.user_id)
        .maybeSingle();

      return {
        ...(data as any),
        username: profile?.username,
        profile_avatar: profile?.avatar_url,
        profile_bio: profile?.bio,
      };
    },
    enabled: !!coachId,
    retry: false,
  });
};
