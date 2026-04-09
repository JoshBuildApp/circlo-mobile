import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Listens for new content inserts via Supabase realtime.
 * Returns a count of new items and a function to acknowledge (dismiss).
 *
 * @param tables - Which tables to subscribe to (defaults to coach_videos + coach_posts)
 * @param onAcknowledge - Callback when user taps the pill (trigger refresh)
 */
interface UseNewContentOptions {
  tables?: string[];
  onAcknowledge?: () => void;
}

export function useNewContent({ tables = ["coach_videos", "coach_posts"], onAcknowledge }: UseNewContentOptions = {}) {
  const [newCount, setNewCount] = useState(0);
  const mountedAtRef = useRef<string>(new Date().toISOString());

  const acknowledge = useCallback(() => {
    setNewCount(0);
    onAcknowledge?.();
  }, [onAcknowledge]);

  useEffect(() => {
    mountedAtRef.current = new Date().toISOString();
    setNewCount(0);

    const channel = supabase.channel("new-content-pill");

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table },
        () => {
          setNewCount((prev) => prev + 1);
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tables.join(",")]);

  return { newCount, acknowledge };
}
