import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CancellationPolicy {
  /** True when the session starts more than 24h in the future. */
  isFree: boolean;
  hoursUntilSession: number;
  /** % fee charged if cancelled now (0 when free). */
  feePercent: number;
}

/**
 * Compute the cancel policy for a booking. Policy is spec 4.4:
 * - Free until 24h before the session
 * - 50% fee within 24h
 * - 100% "no-show" fee once the session has started/finished
 */
export function cancellationPolicy(dateISO: string, time: string): CancellationPolicy {
  const [hh, mm] = (time || "00:00:00").split(":").map((v) => Number(v) || 0);
  const when = new Date(`${dateISO}T00:00:00`);
  when.setHours(hh, mm, 0, 0);
  const hoursUntil = (when.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil >= 24) return { isFree: true, hoursUntilSession: hoursUntil, feePercent: 0 };
  if (hoursUntil >= 0) return { isFree: false, hoursUntilSession: hoursUntil, feePercent: 50 };
  return { isFree: false, hoursUntilSession: hoursUntil, feePercent: 100 };
}

/**
 * Mutations for an existing booking — cancel + reschedule (reschedule just
 * updates the date/time fields in-place; full flow lives in BookingModal).
 */
export function useBookingActions() {
  const [working, setWorking] = useState(false);

  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    setWorking(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    setWorking(false);
    if (error) {
      console.error(error);
      toast.error("Couldn't cancel — please try again.");
      return false;
    }
    toast.success("Booking cancelled.");
    return true;
  }, []);

  const rescheduleBooking = useCallback(
    async (bookingId: string, nextDate: string, nextTime: string): Promise<boolean> => {
      setWorking(true);
      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          update: (vals: Record<string, unknown>) => {
            eq: (c: string, v: string) => Promise<{ error: unknown }>;
          };
        };
      }).from("bookings").update({
        date: nextDate,
        time: nextTime,
        status: "upcoming",
      }).eq("id", bookingId);
      setWorking(false);
      if (error) {
        console.error(error);
        toast.error("Couldn't reschedule — please try again.");
        return false;
      }
      toast.success("Session rescheduled.");
      return true;
    },
    [],
  );

  return { working, cancelBooking, rescheduleBooking };
}
