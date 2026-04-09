import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subWeeks, startOfWeek, endOfWeek } from "date-fns";

export interface CoachAnalytics {
  weeklyRevenue: {
    current: number;
    previous: number;
    percentageChange: number;
  };
  bookingRate: {
    current: number;
    previous: number;
    percentageChange: number;
  };
  topTimeSlots: Array<{ time: string; count: number }>;
  studentRetention: {
    rate: number;
    returningStudents: number;
    totalUniqueStudents: number;
  };
}

export const useCoachAnalytics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coach-analytics", user?.id],
    queryFn: async (): Promise<CoachAnalytics> => {
      if (!user?.id) throw new Error("User not authenticated");

      const now = new Date();
      const currentWeekStart = startOfWeek(now);
      const currentWeekEnd = endOfWeek(now);
      const previousWeekStart = startOfWeek(subWeeks(now, 1));
      const previousWeekEnd = endOfWeek(subWeeks(now, 1));

      const { data: allBookings } = await supabase
        .from("bookings").select("*").eq("coach_id", user.id).eq("status", "confirmed");

      const { data: currentWeekBookings } = await supabase
        .from("bookings").select("*").eq("coach_id", user.id).eq("status", "confirmed")
        .gte("date", currentWeekStart.toISOString()).lte("date", currentWeekEnd.toISOString());

      const { data: previousWeekBookings } = await supabase
        .from("bookings").select("*").eq("coach_id", user.id).eq("status", "confirmed")
        .gte("date", previousWeekStart.toISOString()).lte("date", previousWeekEnd.toISOString());

      const currentRevenue = currentWeekBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
      const previousRevenue = previousWeekBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
      const revenueChange = previousRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

      const currentCount = currentWeekBookings?.length || 0;
      const previousCount = previousWeekBookings?.length || 0;
      const bookingChange = previousCount === 0 ? (currentCount > 0 ? 100 : 0) : ((currentCount - previousCount) / previousCount) * 100;

      const timeSlotCounts: Record<string, number> = {};
      allBookings?.forEach(b => { if (b.time) timeSlotCounts[b.time] = (timeSlotCounts[b.time] || 0) + 1; });
      const topTimeSlots = Object.entries(timeSlotCounts).map(([time, count]) => ({ time, count })).sort((a, b) => b.count - a.count).slice(0, 5);

      const studentCounts: Record<string, number> = {};
      allBookings?.forEach(b => { if (b.user_id) studentCounts[b.user_id] = (studentCounts[b.user_id] || 0) + 1; });
      const totalUnique = Object.keys(studentCounts).length;
      const returning = Object.values(studentCounts).filter(c => c > 1).length;

      return {
        weeklyRevenue: { current: currentRevenue, previous: previousRevenue, percentageChange: revenueChange },
        bookingRate: { current: currentCount, previous: previousCount, percentageChange: bookingChange },
        topTimeSlots,
        studentRetention: { rate: totalUnique === 0 ? 0 : (returning / totalUnique) * 100, returningStudents: returning, totalUniqueStudents: totalUnique },
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
