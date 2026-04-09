import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Lightweight hook that returns the total unread message count
 * for the current user, with realtime updates.
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
      const { count: unread, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
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
