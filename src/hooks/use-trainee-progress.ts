import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TraineeProgress {
  total_sessions: number;
  xp: number;
  level: number;
  streak_days: number;
  last_training_date: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export interface EarnedBadge extends Badge {
  unlocked_at: string;
}

const DEFAULT_PROGRESS: TraineeProgress = {
  total_sessions: 0,
  xp: 0,
  level: 1,
  streak_days: 0,
  last_training_date: null,
};

export function useTraineeProgress(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const [progress, setProgress] = useState<TraineeProgress>(DEFAULT_PROGRESS);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const xpForNextLevel = progress.level * 500;
  const xpInCurrentLevel = progress.xp - (progress.level - 1) * 500;
  const xpProgress = Math.min(100, Math.round((xpInCurrentLevel / 500) * 100));

  const refresh = useCallback(async () => {
    if (!targetUserId) { setLoading(false); return; }
    setLoading(true);

    const [{ data: prog }, { data: earned }, { data: catalog }] = await Promise.all([
      supabase
        .from("trainee_progress")
        .select("total_sessions, xp, level, streak_days, last_training_date")
        .eq("user_id", targetUserId)
        .maybeSingle(),
      supabase
        .from("user_badges")
        .select("unlocked_at, badges(id, name, description, icon, requirement_type, requirement_value)")
        .eq("user_id", targetUserId)
        .order("unlocked_at", { ascending: false }) as any,
      supabase.from("badges").select("*").order("requirement_value", { ascending: true }),
    ]);

    if (prog) setProgress(prog as TraineeProgress);
    else setProgress(DEFAULT_PROGRESS);

    if (earned) {
      setBadges(
        earned.map((e: any) => ({
          ...e.badges,
          unlocked_at: e.unlocked_at,
        }))
      );
    }
    if (catalog) setAllBadges(catalog as Badge[]);

    setLoading(false);
  }, [targetUserId]);

  useEffect(() => { refresh(); }, [refresh]);

  const awardXp = useCallback(async (userId: string, xpAmount = 100) => {
    const { data, error } = await supabase.rpc("award_training_xp", {
      _user_id: userId,
      _xp_amount: xpAmount,
    });
    if (!error) await refresh();
    return { data, error };
  }, [refresh]);

  return {
    progress,
    badges,
    allBadges,
    loading,
    refresh,
    awardXp,
    xpForNextLevel,
    xpInCurrentLevel,
    xpProgress,
  };
}
