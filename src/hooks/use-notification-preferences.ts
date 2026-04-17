import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  bookings: boolean;
  messages: boolean;
  system: boolean;
  push_enabled: boolean;
  push_likes: boolean;
  push_comments: boolean;
  push_follows: boolean;
  push_bookings: boolean;
  push_messages: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  likes: true,
  comments: true,
  follows: true,
  bookings: true,
  messages: true,
  system: true,
  push_enabled: true,
  push_likes: true,
  push_comments: true,
  push_follows: true,
  push_bookings: true,
  push_messages: true,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase
      .from("notification_preferences" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle() as any);

    if (error) {
      console.error("Error fetching notification preferences:", error);
    } else if (data) {
      setPreferences({
        likes: data.likes,
        comments: data.comments,
        follows: data.follows,
        bookings: data.bookings,
        messages: data.messages,
        system: data.system,
        push_enabled: data.push_enabled,
        push_likes: data.push_likes,
        push_comments: data.push_comments,
        push_follows: data.push_follows,
        push_bookings: data.push_bookings,
        push_messages: data.push_messages,
        quiet_hours_enabled: data.quiet_hours_enabled,
        quiet_hours_start: data.quiet_hours_start || "22:00",
        quiet_hours_end: data.quiet_hours_end || "08:00",
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = useCallback(async (prefs: NotificationPreferences) => {
    if (!user) return false;
    setSaving(true);

    // Upsert — insert if not exists, update if exists
    const { error } = await (supabase
      .from("notification_preferences" as any)
      .upsert(
        {
          user_id: user.id,
          ...prefs,
        },
        { onConflict: "user_id" }
      ) as any);

    setSaving(false);

    if (error) {
      console.error("Error saving notification preferences:", error);
      return false;
    }

    setPreferences(prefs);
    return true;
  }, [user]);

  return { preferences, loading, saving, savePreferences, refresh: fetchPreferences };
}
