import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Periodically updates the user's `last_active_at` timestamp in the profiles table.
 * This keeps the existing online-status system (`useOnlineStatus`) fed with fresh data.
 * Mount this once near the app root or on pages where presence matters.
 */
export const usePresenceHeartbeat = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const ping = () => {
      supabase
        .from("profiles")
        .update({ last_active_at: new Date().toISOString() } as any)
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) console.error("Heartbeat failed:", error);
        });
    };

    // Ping immediately, then on interval
    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    // Also ping on visibility change (tab becomes active)
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);
};
