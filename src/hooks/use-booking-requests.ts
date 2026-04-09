import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BookingRequest {
  id: string;
  user_id: string;
  coach_id: string;
  coach_name: string;
  date: string;
  time: string;
  time_label: string;
  training_type: string;
  status: string;
  price: number;
  is_group: boolean;
  total_participants: number;
  created_at: string;
  booking_code: string | null;
  // Joined fields
  user_name?: string;
  user_avatar?: string | null;
}

export const useBookingRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Get coach profile for this user
    const { data: coachProfile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!coachProfile) {
      // Also load user's own pending bookings
      const { data: myBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "upcoming", "confirmed"])
        .order("created_at", { ascending: false });

      setRequests((myBookings as BookingRequest[]) || []);
      setLoading(false);
      return;
    }

    // Coach: get incoming booking requests
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("coach_id", coachProfile.id)
      .order("created_at", { ascending: false });

    if (!bookings || bookings.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Get user profiles for requesters
    const userIds = [...new Set(bookings.map((b) => b.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    if (profiles) {
      for (const p of profiles) {
        profileMap[p.user_id] = { name: p.username, avatar: p.avatar_url };
      }
    }

    const enriched: BookingRequest[] = bookings.map((b) => ({
      ...b,
      user_name: profileMap[b.user_id]?.name || "User",
      user_avatar: profileMap[b.user_id]?.avatar || null,
    }));

    setRequests(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Real-time subscription for new bookings
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("booking-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => { refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  const acceptRequest = useCallback(async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);
    if (error) {
      toast.error("Failed to accept request");
      return;
    }
    toast.success("Booking confirmed!");
    setRequests((prev) => prev.map((r) => r.id === bookingId ? { ...r, status: "confirmed" } : r));
  }, []);

  const rejectRequest = useCallback(async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    if (error) {
      toast.error("Failed to reject request");
      return;
    }
    toast.success("Request declined");
    setRequests((prev) => prev.map((r) => r.id === bookingId ? { ...r, status: "cancelled" } : r));
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending" || r.status === "upcoming").length;

  return { requests, loading, refresh, acceptRequest, rejectRequest, pendingCount };
};
