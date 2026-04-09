import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActivityStatus, getActivityStatus } from "./use-activity";

interface OnlineStatusResult {
  status: ActivityStatus;
  lastActiveAt: string | null;
  showStatus: boolean;
}

/**
 * Fetch a single user's online status. Lightweight single-row query.
 */
export const useOnlineStatus = (userId: string | undefined): OnlineStatusResult => {
  const [data, setData] = useState<OnlineStatusResult>({
    status: "offline",
    lastActiveAt: null,
    showStatus: true,
  });

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_active_at, show_activity_status")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile) {
        const lastActive = (profile as any).last_active_at as string | null;
        const showStatus = (profile as any).show_activity_status as boolean;
        setData({
          status: showStatus ? getActivityStatus(lastActive) : "offline",
          lastActiveAt: lastActive,
          showStatus,
        });
      }
    };

    fetch();
    // Refresh every 30s for live feel
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [userId]);

  return data;
};

/**
 * Batch fetch online statuses for multiple user IDs. 
 * Returns a map of userId → ActivityStatus.
 */
export const useBatchOnlineStatus = (userIds: string[]): Record<string, ActivityStatus> => {
  const [statuses, setStatuses] = useState<Record<string, ActivityStatus>>({});

  useEffect(() => {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, last_active_at, show_activity_status")
        .in("user_id", unique);

      if (data) {
        const map: Record<string, ActivityStatus> = {};
        for (const p of data) {
          const show = (p as any).show_activity_status as boolean;
          const lastActive = (p as any).last_active_at as string | null;
          map[p.user_id] = show ? getActivityStatus(lastActive) : "offline";
        }
        setStatuses(map);
      }
    };

    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, [userIds.join(",")]);

  return statuses;
};
