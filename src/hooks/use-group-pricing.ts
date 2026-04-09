import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GroupPricingRule {
  id: string;
  coach_id: string;
  participant_count: number;
  price_per_person: number;
}

export const useGroupPricing = (coachId: string | undefined) => {
  const [rules, setRules] = useState<GroupPricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!coachId) {
      setRules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: _e } = await supabase
      .from("group_pricing")
      .select("*")
      .eq("coach_id", coachId)
      .order("participant_count", { ascending: true });
    if (data) setRules(data as GroupPricingRule[]);
    setLoading(false);
  }, [coachId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rules, loading, refresh };
};

/** Get the price per person for a given participant count */
export function getPriceForCount(
  rules: GroupPricingRule[],
  count: number,
  basePrice: number
): number {
  // Find exact match first
  const exact = rules.find((r) => r.participant_count === count);
  if (exact) return exact.price_per_person;

  // Find closest lower rule
  const sorted = [...rules].sort((a, b) => b.participant_count - a.participant_count);
  const lower = sorted.find((r) => r.participant_count <= count);
  if (lower) return lower.price_per_person;

  // Fallback: base price
  return basePrice;
}
