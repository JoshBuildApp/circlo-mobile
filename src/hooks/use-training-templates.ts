import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrainingTemplate {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price: number;
  location: string;
  max_participants: number;
  training_type: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTrainingTemplates(coachProfileId: string | undefined) {
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!coachProfileId) { setTemplates([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("training_templates")
      .select("*")
      .eq("coach_id", coachProfileId)
      .order("created_at", { ascending: true });
    setTemplates((data as TrainingTemplate[]) || []);
    setLoading(false);
  }, [coachProfileId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { templates, loading, refresh };
}
