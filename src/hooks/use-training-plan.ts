import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  duration_minutes?: number;
  intensity: "low" | "medium" | "high";
  description: string;
}

export interface TrainingDay {
  day: string;
  isRest: boolean;
  focus: string;
  duration_minutes: number;
  exercises: Exercise[];
  coachTip: string;
}

export interface CoachRecommendation {
  id: string;
  coach_name: string;
  sport: string;
  price: number | null;
  rating: number;
  image_url: string | null;
  reason: string;
}

export interface TrainingPlan {
  goal: string;
  sport: string;
  fitnessLevel: string;
  summary: string;
  weeklyDays: TrainingDay[];
  coachRecommendations: CoachRecommendation[];
}

export interface GeneratePlanInput {
  sport: string;
  goal: string;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  sessionsPerWeek: number;
}

export function useTrainingPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);

  const generate = useCallback(async (input: GeneratePlanInput) => {
    if (!user) { setError("You must be logged in to generate a plan."); return; }
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      // Fetch athlete history in parallel
      const [bookingsRes, profileRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("date, training_type, coach_name, coach_id")
          .eq("user_id", user.id)
          .neq("status", "cancelled")
          .order("date", { ascending: false })
          .limit(20),
        supabase
          .from("profiles")
          .select("interests")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const sessionHistory = (bookingsRes.data || []).map((b: any) => ({
        date: b.date,
        training_type: b.training_type,
        coach_name: b.coach_name,
        sport: input.sport,
      }));

      const interests: string[] = (profileRes.data?.interests as string[]) || [];

      // Fetch verified coach specialties for the sport
      const { data: coachData } = await supabase
        .from("coach_profiles")
        .select("sport")
        .eq("is_verified", true)
        .limit(50);

      const coachSpecialties = [...new Set((coachData || []).map((c: any) => c.sport).filter(Boolean))];

      const { data, error: fnError } = await supabase.functions.invoke("training-plan-generator", {
        body: {
          input: {
            ...input,
            sessionHistory,
            coachSpecialties,
            interests,
          },
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setPlan(data.plan);
      setSource(data.source);
    } catch (e: any) {
      console.error("Training plan error:", e);
      setError(e?.message || "Failed to generate training plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const reset = useCallback(() => {
    setPlan(null);
    setError(null);
    setSource(null);
  }, []);

  return { plan, loading, error, source, generate, reset };
}
