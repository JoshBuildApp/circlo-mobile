import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrainingSession {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  session_type: "personal" | "small_group" | "group";
  date: string;
  time: string;
  time_label: string;
  max_capacity: number;
  current_bookings: number;
  price: number | null;
  status: "open" | "full" | "cancelled";
  is_public: boolean;
  created_at: string;
  // joined fields
  coach_name?: string;
  coach_sport?: string;
  coach_image?: string | null;
}

export const SESSION_TYPES = [
  { value: "personal", label: "Personal", icon: "User", capacity: 1, desc: "1-on-1 training" },
  { value: "small_group", label: "Small Group", icon: "Users", capacity: 4, desc: "2–4 participants" },
  { value: "group", label: "Group", icon: "UsersRound", capacity: 15, desc: "5–15 participants" },
] as const;

export function useTrainingSessions(coachId: string | undefined) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!coachId) { setSessions([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("coach_id", coachId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    setSessions((data as TrainingSession[]) || []);
    setLoading(false);
  }, [coachId]);

  useEffect(() => { load(); }, [load]);

  return { sessions, loading, refresh: load };
}

export function useSessionsForDate(coachId: string | undefined, date: string | undefined) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coachId || !date) { setSessions([]); return; }
    setLoading(true);
    (supabase
      .from("training_sessions")
      .select("*")
      .eq("coach_id", coachId)
      .eq("date", date)
      .eq("is_public", true)
      .neq("status", "cancelled")
      .order("time", { ascending: true }) as any)
      .then(({ data }: any) => {
        setSessions((data as TrainingSession[]) || []);
        setLoading(false);
      });
  }, [coachId, date]);

  return { sessions, loading };
}

/** Fetch all upcoming public sessions across all coaches (for Discover) */
export function usePublicSessions() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase
        .from("training_sessions")
        .select("*, coach_profiles!inner(coach_name, sport, image_url)")
        .eq("is_public", true)
        .neq("status", "cancelled")
        .neq("status", "full")
        .gte("date", today)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(20) as any);

      if (data) {
        setSessions(
          (data as any[])
            .filter((s: any) => s.coach_profiles?.coach_name?.trim())
            .map((s: any) => ({
              ...s,
              coach_name: s.coach_profiles?.coach_name,
              coach_sport: s.coach_profiles?.sport,
              coach_image: s.coach_profiles?.image_url,
            }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  return { sessions, loading };
}
