import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AvailabilitySlot {
  coach_id: string;
  day_of_week: number;
  start_time: string;
}

export type AvailabilityPreviewMap = Record<string, AvailabilitySlot[]>;

/**
 * For a list of coach IDs, fetch the next ~3 upcoming availability slots per coach.
 * Returns a map of coach_id -> slots sorted by soonest-first.
 *
 * This is intentionally lightweight — grabs recurring availability rows, filters in JS
 * to "today or later this week", and caps at 3 per coach. Swap for a server-side
 * next_slot() RPC when traffic grows.
 */
export function useCoachAvailabilityPreview(coachIds: string[]) {
  const [map, setMap] = useState<AvailabilityPreviewMap>({});
  const [loading, setLoading] = useState(false);

  const key = coachIds.join(",");

  useEffect(() => {
    if (coachIds.length === 0) {
      setMap({});
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("availability")
        .select("coach_id, day_of_week, start_time")
        .in("coach_id", coachIds)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });
      if (cancelled) return;
      if (error || !data) {
        setMap({});
        setLoading(false);
        return;
      }

      const today = new Date().getDay();
      const rows = data as AvailabilitySlot[];
      const grouped: AvailabilityPreviewMap = {};
      for (const row of rows) {
        // distance from today (0..6)
        const dist = (row.day_of_week - today + 7) % 7;
        const scored = { ...row, _dist: dist } as AvailabilitySlot & { _dist: number };
        if (!grouped[row.coach_id]) grouped[row.coach_id] = [];
        grouped[row.coach_id].push(scored);
      }
      for (const id of Object.keys(grouped)) {
        grouped[id] = grouped[id]
          .sort(
            (a, b) =>
              ((a as AvailabilitySlot & { _dist: number })._dist -
                (b as AvailabilitySlot & { _dist: number })._dist) ||
              a.start_time.localeCompare(b.start_time),
          )
          .slice(0, 3);
      }
      setMap(grouped);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { availability: map, loading };
}

/** Format an HH:MM:SS or HH:MM string as "16:00". */
export function formatSlotTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  return `${h}:${m ?? "00"}`;
}

/** Format day_of_week (0=Sun) relative to today: "Today", "Tomorrow", "Mon". */
export function formatSlotDay(dow: number): string {
  const today = new Date().getDay();
  const diff = (dow - today + 7) % 7;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tmrw";
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[dow] || "";
}
