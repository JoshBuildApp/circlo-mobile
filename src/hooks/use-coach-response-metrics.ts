import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CoachResponseMetrics {
  id: string;
  coach_id: string;
  avg_response_time_minutes: number | null;
  response_rate_percentage: number | null;
  total_conversations: number;
  responded_conversations: number;
  last_updated_at: string;
}

export const useCoachResponseMetrics = (coachId: string) => {
  return useQuery({
    queryKey: ["coach-response-metrics", coachId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("coach_response_metrics")
        .select("*")
        .eq("coach_id", coachId)
        .single();

      if (error) {
        console.error("Error fetching coach response metrics:", error);
        return null;
      }

      return data as CoachResponseMetrics;
    },
    enabled: !!coachId,
    staleTime: 1000 * 60 * 30,
  });
};

export const formatResponseTime = (minutes: number | null): string => {
  if (!minutes) return "Response time not available";
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  const days = Math.round(minutes / 1440);
  return `${days} day${days !== 1 ? 's' : ''}`;
};

export const getResponseTimeLabel = (minutes: number | null): string => {
  if (!minutes) return "Response time varies";
  if (minutes < 60) return "Responds within 1 hour";
  if (minutes < 240) return "Responds within a few hours";
  if (minutes < 1440) return "Responds within a day";
  return "Response time varies";
};
