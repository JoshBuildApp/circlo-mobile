import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDataMode } from "@/contexts/DataModeContext";

export interface TrendingVideo {
  id: string;
  title: string;
  media_url: string;
  thumbnail_url: string | null;
  likes_count: number;
  views: number;
  coach_id: string;
  coach_name?: string;
  coach_image?: string;
}

export function useTrending(limit = 10) {
  const { isRealMode } = useDataMode();
  return useQuery({
    queryKey: ["trending", limit, isRealMode],
    queryFn: async () => {
      let query = supabase
        .from("coach_videos")
        .select("id, title, media_url, thumbnail_url, likes_count, views, coach_id")
        .order("likes_count", { ascending: false })
        .limit(limit);
      if (isRealMode) query = query.eq("is_fake", false);
      const { data, error } = await query;
      if (error) throw error;

      // Enrich with coach info
      const coachIds = [...new Set((data || []).map((v: any) => v.coach_id))];
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

      return (data || [])
        .map((v: any) => {
          const coach = coachMap[v.coach_id];
          if (!coach?.coach_name?.trim()) return null;

          return {
            ...v,
            coach_name: coach.coach_name,
            coach_image: coach.image_url || "/placeholder.svg",
          };
        })
        .filter((video): video is TrendingVideo => video !== null);
    },
    refetchInterval: 300000, // 5 min
  });
}
