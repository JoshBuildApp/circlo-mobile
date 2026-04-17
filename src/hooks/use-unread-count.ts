import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Lightweight hook that returns the total unread message count
 * for the current user, with realtime updates.
 * Messages from archived conversations are excluded.
 */
export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      // Fetch archived partner IDs to exclude from unread count
      const { data: archived } = await supabase
        .from("archived_conversations" as any)
        .select("partner_id")
        .eq("user_id", user.id);

      const archivedSenderIds = (archived || []).map((r: any) => r.partner_id as string);

      let query = supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      // Exclude messages from archived conversations
      if (archivedSenderIds.length > 0) {
        for (const id of archivedSenderIds) {
          query = query.neq("sender_id", id);
        }
      }

      const { count: unread, error } = await query;
      if (!error && unread !== null) setCount(unread);
    };

    fetchCount();

    // Realtime: refresh count on any message change for this user
    const channel = supabase
      .channel("unread-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
