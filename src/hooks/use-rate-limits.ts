import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Types ─── */
export interface UploadLimits {
  current: number;
  cap: number;
  storageBytes: number;
  canUpload: boolean;
  role: string | null;
  loading: boolean;
}

export interface MessageLimits {
  sentToday: number;
  cap: number;
  canSend: boolean;
  hasBooking: boolean;
  inboxFull: boolean;
  loading: boolean;
}

export interface FeedActionLimits {
  count: number;
  cap: number;
  canAct: boolean;
  loading: boolean;
}

export interface BookingLimits {
  pendingCount: number;
  cap: number;
  canBook: boolean;
  loading: boolean;
}

/* ─── File validation constants ─── */
export const UPLOAD_LIMITS = {
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,       // 5MB
  VIDEO_MAX_BYTES: 50 * 1024 * 1024,       // 50MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/quicktime"],
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"],
};

export function validateFile(file: File): string | null {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, WebP, MP4, MOV files are supported";
  }
  if (isImage && file.size > UPLOAD_LIMITS.IMAGE_MAX_BYTES) {
    return `Image exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  }
  if (isVideo && file.size > UPLOAD_LIMITS.VIDEO_MAX_BYTES) {
    return `Video exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  }
  return null;
}

/* ─── Upload Limits Hook ─── */
export function useUploadLimits() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<UploadLimits>({
    current: 0, cap: 1, storageBytes: 0, canUpload: true, role: null, loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("check_upload_limit", { _user_id: user.id });
      if (error) throw error;
      const d = data as any;
      setLimits({
        current: d.current,
        cap: d.cap,
        storageBytes: d.storage_bytes,
        canUpload: d.can_upload,
        role: d.role,
        loading: false,
      });
    } catch {
      setLimits(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const incrementUsage = useCallback(async (fileSize: number) => {
    if (!user) return;
    // Upsert user_usage row
    const { data: existing } = await supabase
      .from("user_usage")
      .select("id, upload_count, total_storage_bytes")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_usage")
        .update({
          upload_count: existing.upload_count + 1,
          total_storage_bytes: existing.total_storage_bytes + fileSize,
          last_upload_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("user_usage")
        .insert({
          user_id: user.id,
          upload_count: 1,
          total_storage_bytes: fileSize,
          last_upload_at: new Date().toISOString(),
        });
    }
    await refresh();
  }, [user, refresh]);

  const decrementUsage = useCallback(async (fileSize: number) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("user_usage")
      .select("id, upload_count, total_storage_bytes")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_usage")
        .update({
          upload_count: Math.max(0, existing.upload_count - 1),
          total_storage_bytes: Math.max(0, existing.total_storage_bytes - fileSize),
        })
        .eq("user_id", user.id);
    }
    await refresh();
  }, [user, refresh]);

  return { ...limits, refresh, incrementUsage, decrementUsage };
}

/* ─── Message Limits Hook ─── */
export function useMessageLimits(receiverId: string | undefined) {
  const { user } = useAuth();
  const [limits, setLimits] = useState<MessageLimits>({
    sentToday: 0, cap: 5, canSend: true, hasBooking: false, inboxFull: false, loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user || !receiverId) return;
    try {
      const { data, error } = await supabase.rpc("check_daily_messages", {
        _sender_id: user.id,
        _receiver_id: receiverId,
      });
      if (error) throw error;
      const d = data as any;
      setLimits({
        sentToday: d.sent_today,
        cap: d.cap,
        canSend: d.can_send,
        hasBooking: d.has_booking,
        inboxFull: d.inbox_full,
        loading: false,
      });
    } catch {
      setLimits(prev => ({ ...prev, loading: false }));
    }
  }, [user, receiverId]);

  useEffect(() => { refresh(); }, [refresh]);

  const incrementMessageCount = useCallback(async () => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("user_usage")
      .select("id, daily_messages_sent, last_message_reset_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const today = new Date().toISOString().split("T")[0];

    if (existing) {
      const resetNeeded = existing.last_message_reset_at !== today;
      await supabase
        .from("user_usage")
        .update({
          daily_messages_sent: resetNeeded ? 1 : existing.daily_messages_sent + 1,
          last_message_reset_at: today,
        })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("user_usage")
        .insert({
          user_id: user.id,
          daily_messages_sent: 1,
          last_message_reset_at: today,
        });
    }
    await refresh();
  }, [user, refresh]);

  return { ...limits, refresh, incrementMessageCount };
}

/* ─── Feed Action Rate Limits Hook ─── */
export function useFeedActionLimits() {
  const { user } = useAuth();
  // Client-side counters for instant feedback
  const countersRef = useRef({ like: 0, comment: 0, follow: 0 });

  const checkAction = useCallback(async (actionType: "like" | "comment" | "follow"): Promise<FeedActionLimits> => {
    if (!user) return { count: 0, cap: 999, canAct: true, loading: false };

    try {
      const { data, error } = await supabase.rpc("check_feed_action_rate", {
        _user_id: user.id,
        _action_type: actionType,
      });
      if (error) throw error;
      const d = data as any;
      countersRef.current[actionType] = d.count;
      return {
        count: d.count,
        cap: d.cap,
        canAct: d.can_act,
        loading: false,
      };
    } catch {
      return { count: 0, cap: 999, canAct: true, loading: false };
    }
  }, [user]);

  return { checkAction };
}

/* ─── Booking Limits Hook ─── */
export function useBookingLimits() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<BookingLimits>({
    pendingCount: 0, cap: 5, canBook: true, loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("check_pending_bookings", { _user_id: user.id });
      if (error) throw error;
      const d = data as any;
      setLimits({
        pendingCount: d.pending_count,
        cap: d.cap,
        canBook: d.can_book,
        loading: false,
      });
    } catch {
      setLimits(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Check for duplicate pending booking with same coach
  const hasPendingWithCoach = useCallback(async (coachId: string): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", user.id)
      .eq("coach_id", coachId)
      .eq("status", "pending")
      .limit(1);
    return (data?.length ?? 0) > 0;
  }, [user]);

  return { ...limits, refresh, hasPendingWithCoach };
}

/* ─── Profile View Tracking (Scraping Detection) ─── */
export function useProfileViewTracker() {
  const { user } = useAuth();

  const trackView = useCallback(async (coachProfileId: string) => {
    if (!user) return;
    // Don't track self-views
    const { data: ownProfile } = await supabase
      .from("coach_profiles")
      .select("user_id")
      .eq("id", coachProfileId)
      .maybeSingle();
    if (ownProfile?.user_id === user.id) return;

    await supabase.from("profile_views").insert({
      viewer_id: user.id,
      coach_profile_id: coachProfileId,
    });
  }, [user]);

  return { trackView };
}
