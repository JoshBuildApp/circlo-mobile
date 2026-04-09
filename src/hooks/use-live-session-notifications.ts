import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useLiveSessionNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkUpcomingSessions = async () => {
      try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Check training_sessions for today
        const { data: sessions, error } = await supabase
          .from("training_sessions")
          .select("*")
          .eq('date', todayStr)
          .eq('status', 'open');

        if (error || !sessions) return;

        // Check if user has bookings for any of these sessions
        const sessionIds = sessions.map(s => s.id);
        if (sessionIds.length === 0) return;

        const { data: bookings } = await supabase
          .from("bookings")
          .select("session_id, coach_name")
          .eq('user_id', user.id)
          .in('session_id', sessionIds);

        bookings?.forEach(booking => {
          const session = sessions.find(s => s.id === booking.session_id);
          if (!session) return;

          const [hours, minutes] = (session.time || '00:00').split(':').map(Number);
          const sessionTime = new Date(now);
          sessionTime.setHours(hours, minutes, 0, 0);
          const minutesUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60);

          if (minutesUntil <= 15 && minutesUntil > 0) {
            toast.success(
              `Your session "${session.title}" starts in ${Math.round(minutesUntil)} minutes!`,
              { duration: 10000 }
            );
          }
        });
      } catch (error) {
        console.error('Failed to check upcoming sessions:', error);
      }
    };

    checkUpcomingSessions();
    const interval = setInterval(checkUpcomingSessions, 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
}
