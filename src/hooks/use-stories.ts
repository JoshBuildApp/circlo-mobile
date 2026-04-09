import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDataMode } from "@/contexts/DataModeContext";

export interface Story {
  id: string;
  coach_id?: string;
  user_id?: string;
  media_url: string;
  created_at: string;
  expires_at: string;
  display_name?: string;
  display_image?: string;
}

export function useStories() {
  const { isRealMode } = useDataMode();
  return useQuery({
    queryKey: ["stories", isRealMode],
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = supabase
        .from("stories")
        .select("*")
        .gt("expires_at", now)
        .order("created_at", { ascending: false });
      if (isRealMode) query = query.eq("is_fake", false);
      const { data, error } = await query;
      if (error) throw error;

      // Gather coach IDs and user IDs
      const coachIds = [...new Set((data || []).filter((s: any) => s.coach_id).map((s: any) => s.coach_id))];
      const userIds = [...new Set((data || []).map((s: any) => s.user_id).filter(Boolean))];

      let coachMap: Record<string, { coach_name: string; image_url: string | null }> = {};
      if (coachIds.length > 0) {
        const { data: coaches } = await supabase
          .from("coach_profiles")
          .select("id, coach_name, image_url")
          .in("id", coachIds);
        if (coaches) {
          coaches.forEach((c: any) => {
            coachMap[c.id] = { coach_name: c.coach_name, image_url: c.image_url };
          });
        }
      }

      let profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);
        if (profiles) {
          profiles.forEach((p: any) => {
            profileMap[p.user_id] = { username: p.username, avatar_url: p.avatar_url };
          });
        }
      }

      return (data || [])
        .map((s: any) => {
          const coach = s.coach_id ? coachMap[s.coach_id] : null;
          const profile = s.user_id ? profileMap[s.user_id] : null;

          const displayName = coach?.coach_name?.trim() || profile?.username?.trim();
          if (!displayName) return null;

          return {
            ...s,
            display_name: displayName,
            display_image: coach?.image_url || profile?.avatar_url || "/placeholder.svg",
          };
        })
        .filter((story): story is Story => story !== null);
    },
    refetchInterval: 60000,
  });
}
