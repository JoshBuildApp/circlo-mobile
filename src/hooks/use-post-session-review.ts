import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "circlo_review_dismissed";
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes
const POST_SESSION_DELAY_MS = 60 * 60 * 1000; // 1 hour after session end

interface ReviewableBooking {
  id: string;
  coach_id: string;
  coach_name: string;
  date: string;
  time: string;
  time_label: string;
}

function getDismissedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { ids: string[]; expiry: number };
    // Expire dismissed list after 7 days
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return parsed.ids;
  } catch {
    return [];
  }
}

function addDismissedId(bookingId: string) {
  const existing = getDismissedIds();
  const ids = [...new Set([...existing, bookingId])];
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ids, expiry: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  );
}

function parseSessionEndTime(date: string, time: string): Date {
  // date is "YYYY-MM-DD", time is "HH:MM" or "HH:MM:SS"
  const [hours, minutes] = time.split(":").map(Number);
  const sessionStart = new Date(`${date}T00:00:00`);
  sessionStart.setHours(hours, minutes, 0, 0);
  // Assume 1-hour session duration
  return new Date(sessionStart.getTime() + 60 * 60 * 1000);
}

export function usePostSessionReview() {
  const { user } = useAuth();
  const [pendingReview, setPendingReview] = useState<ReviewableBooking | null>(null);

  const dismiss = useCallback((bookingId: string) => {
    addDismissedId(bookingId);
    setPendingReview(null);
  }, []);

  const checkForReviewable = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    // Check bookings from the last 3 days that are completed or confirmed with a past date
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Fetch recent completed/confirmed bookings for this user
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, coach_id, coach_name, date, time, time_label, status")
      .eq("user_id", user.id)
      .in("status", ["completed", "confirmed", "upcoming"])
      .gte("date", threeDaysAgo)
      .lte("date", today)
      .order("date", { ascending: false });

    if (error || !bookings || bookings.length === 0) return;

    const dismissed = getDismissedIds();

    // Filter to bookings where session ended 1h+ ago and not dismissed
    const eligible = bookings.filter((b) => {
      if (dismissed.includes(b.id)) return false;
      const endTime = parseSessionEndTime(b.date, b.time);
      return now.getTime() - endTime.getTime() >= POST_SESSION_DELAY_MS;
    });

    if (eligible.length === 0) return;

    // Check which coaches the user already reviewed
    const coachIds = [...new Set(eligible.map((b) => b.coach_id))];
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("coach_id")
      .eq("user_id", user.id)
      .in("coach_id", coachIds);

    const reviewedCoachIds = new Set(
      (existingReviews || []).map((r) => r.coach_id)
    );

    // Find the first booking that hasn't been reviewed
    const target = eligible.find((b) => !reviewedCoachIds.has(b.coach_id));
    if (target) {
      setPendingReview({
        id: target.id,
        coach_id: target.coach_id,
        coach_name: target.coach_name,
        date: target.date,
        time: target.time,
        time_label: target.time_label,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Initial check after a short delay to not block rendering
    const timeout = setTimeout(checkForReviewable, 3000);
    const interval = setInterval(checkForReviewable, CHECK_INTERVAL_MS);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user, checkForReviewable]);

  return { pendingReview, dismiss };
}
