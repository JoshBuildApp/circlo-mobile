import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { HomeCoach } from "@/hooks/use-home-data";

const STORAGE_KEY = "circlo_recently_viewed_coaches";
const MAX_ITEMS = 10;

/** Read the current list of recently-viewed coach IDs from localStorage. */
function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)));
  } catch {
    /* storage disabled — no-op */
  }
}

/**
 * Track and surface recently-viewed coach profiles.
 *
 * `trackView(coachId)` bumps the coach to the top of the list. `items` is the
 * hydrated coach data (name, image, sport) for the top N, ready to render.
 */
export function useRecentlyViewed(limit = 5) {
  const [ids, setIds] = useState<string[]>(() => readIds());
  const [items, setItems] = useState<HomeCoach[]>([]);
  const [loading, setLoading] = useState(false);

  const trackView = useCallback((coachId: string) => {
    if (!coachId) return;
    const current = readIds();
    const next = [coachId, ...current.filter((id) => id !== coachId)].slice(0, MAX_ITEMS);
    writeIds(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    writeIds([]);
    setIds([]);
    setItems([]);
  }, []);

  useEffect(() => {
    const sliced = ids.slice(0, limit);
    if (sliced.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, rating, price, is_verified, is_pro, followers, location, tagline")
        .in("id", sliced);
      if (cancelled) return;
      // Preserve the order of `sliced` (most-recent first).
      const map = new Map((data || []).map((c: HomeCoach) => [c.id, c]));
      setItems(sliced.map((id) => map.get(id)).filter(Boolean) as HomeCoach[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [ids, limit]);

  return { items, loading, trackView, clear };
}
