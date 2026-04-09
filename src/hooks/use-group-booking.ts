import { useState, useEffect, useCallback, useId } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BookingParticipant {
  id: string;
  booking_id: string;
  user_id: string;
  payment_status: string;
  joined_at: string;
  // enriched
  username?: string;
  avatar_url?: string;
}

export interface GroupBooking {
  id: string;
  coach_id: string;
  title: string;
  date: string;
  time: string;
  price: number;
  max_participants: number;
  status: string;
  participants: BookingParticipant[];
  spotsLeft: number;
  isFull: boolean;
  hasJoined: boolean;
}

export function useGroupBooking(bookingId: string) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<BookingParticipant[]>([]);
  const [booking, setBooking] = useState<GroupBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const instanceId = useId();

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      console.error("[useGroupBooking] fetch booking error:", bookingError.message);
      setLoading(false);
      return;
    }

    const { data: participantData, error: participantError } = await supabase
      .from("booking_participants")
      .select("*")
      .eq("booking_id", bookingId);

    if (participantError) {
      console.error("[useGroupBooking] fetch participants error:", participantError.message);
    }

    const rawParticipants = participantData || [];

    // Batch enrich with profiles
    const userIds = [...new Set(rawParticipants.map((p: { user_id: string }) => p.user_id))];
    let profileMap: Record<string, { username: string; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      if (profileError) {
        console.error("[useGroupBooking] fetch profiles error:", profileError.message);
      }

      if (profiles) {
        profileMap = Object.fromEntries(
          profiles.map((p: { user_id: string; username: string; avatar_url: string | null }) => [
            p.user_id,
            { username: p.username, avatar_url: p.avatar_url },
          ])
        );
      }
    }

    const enriched: BookingParticipant[] = rawParticipants.map((p: BookingParticipant) => ({
      ...p,
      username: profileMap[p.user_id]?.username || "Unknown",
      avatar_url: profileMap[p.user_id]?.avatar_url || null,
    }));

    setParticipants(enriched);

    const maxParticipants = bookingData.total_participants || 1;
    const spotsLeft = Math.max(0, maxParticipants - enriched.length);
    const hasJoined = user ? enriched.some(p => p.user_id === user.id) : false;

    setBooking({
      ...bookingData,
      title: bookingData.training_type || "Group Session",
      max_participants: maxParticipants,
      participants: enriched,
      spotsLeft,
      isFull: spotsLeft === 0,
      hasJoined,
    } as GroupBooking);

    setLoading(false);
  }, [bookingId, user]);

  useEffect(() => {
    fetchBooking();

    // Real-time subscription for participant changes
    const channel = supabase
      .channel(`group-booking-${bookingId}-${instanceId.replace(/:/g, "")}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "booking_participants",
        filter: `booking_id=eq.${bookingId}`,
      }, () => { fetchBooking(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBooking, bookingId, instanceId]);

  const joinBooking = useCallback(async (): Promise<boolean> => {
    if (!user) { toast.error("Sign in to join"); return false; }
    if (!booking) return false;
    if (booking.isFull) { toast.error("This session is full"); return false; }
    if (booking.hasJoined) { toast.info("You're already in this session"); return false; }

    setJoining(true);
    const { error } = await supabase.from("booking_participants").insert({
      booking_id: bookingId,
      user_id: user.id,
      payment_status: "pending",
    });

    if (error) {
      console.error("[useGroupBooking] join error:", error.message);
      toast.error("Failed to join session");
      setJoining(false);
      return false;
    }

    toast.success("🎉 You joined the session!");
    await fetchBooking();
    setJoining(false);
    return true;
  }, [user, booking, bookingId, fetchBooking]);

  const leaveBooking = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const participant = participants.find(p => p.user_id === user.id);
    if (!participant) return false;

    const { error } = await supabase
      .from("booking_participants")
      .delete()
      .eq("id", participant.id);

    if (error) {
      console.error("[useGroupBooking] leave error:", error.message);
      toast.error("Failed to leave session");
      return false;
    }

    toast.success("You left the session");
    await fetchBooking();
    return true;
  }, [user, participants, fetchBooking]);

  const updatePaymentStatus = useCallback(async (
    participantId: string,
    status: "pending" | "paid" | "refunded"
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("booking_participants")
      .update({ payment_status: status })
      .eq("id", participantId);

    if (error) {
      console.error("[useGroupBooking] payment update error:", error.message);
      toast.error("Failed to update payment status");
      return false;
    }

    await fetchBooking();
    return true;
  }, [fetchBooking]);

  return {
    booking,
    participants,
    loading,
    joining,
    joinBooking,
    leaveBooking,
    updatePaymentStatus,
    refresh: fetchBooking,
  };
}
