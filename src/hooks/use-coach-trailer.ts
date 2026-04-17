import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CoachTrailerItem {
  id: string;
  media_url: string;
  media_type: string | null;
  thumbnail_url: string | null;
  title: string | null;
}

// Module-level cache so repeat hovers on the same coach are instant.
const cache = new Map<string, CoachTrailerItem[]>();

/**
 * Fetch up to 5 of a coach's most-viewed uploaded media items so the
 * hover preview can play them as a mini-trailer. The caller can gate the
 * hook behind `enabled` (e.g. only fetch when the hover popover is open)
 * to avoid N background queries for every card on the page.
 */
export function useCoachTrailer(coachId: string, enabled: boolean = true) {
  const cached = cache.get(coachId);
  const [items, setItems] = useState<CoachTrailerItem[]>(cached ?? []);
  const [loading, setLoading] = useState(() => enabled && !cached);

  useEffect(() => {
    if (!enabled) return;
    if (cache.has(coachId)) {
      setItems(cache.get(coachId) ?? []);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("coach_videos")
        .select("id, media_url, media_type, thumbnail_url, title")
        .eq("coach_id", coachId)
        .order("views", { ascending: false })
        .limit(5);

      if (cancelled) return;

      if (error || !data) {
        cache.set(coachId, []);
        setItems([]);
      } else {
        const list = data as CoachTrailerItem[];
        cache.set(coachId, list);
        setItems(list);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [coachId, enabled]);

  return { items, loading };
}

export function isTrailerVideo(item: CoachTrailerItem): boolean {
  if (item.media_type === "video") return true;
  return /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(item.media_url);
}
