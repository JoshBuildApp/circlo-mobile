import { useQuery } from "@tanstack/react-query";
import { mockSessions } from "@/lib/v2/mockData";
import type { Session } from "@/types/v2";

/**
 * Returns the most recent pending session for the current player, if any.
 * Used by the Book landing page to surface a "Pending" banner that links
 * back into the booking flow where the user can see / cancel the request.
 */
export function usePendingBooking() {
  return useQuery<Session | null>({
    queryKey: ["v2", "pending-booking"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return mockSessions.find((s) => s.status === "pending") ?? null;
    },
    staleTime: 30_000,
  });
}
