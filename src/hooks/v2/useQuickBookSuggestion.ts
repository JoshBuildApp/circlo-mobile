import { useQuery } from "@tanstack/react-query";
import { mockCoaches } from "@/lib/v2/mockData";

export interface QuickBookSuggestion {
  coachId: string;
  coachName: string;
  whenLabel: string;
}

/**
 * Returns the next suggested coach + slot for the Book landing page's
 * "Quick book" tile. Current implementation just picks the first mock
 * coach and hardcodes "today 18:00" — the real version will query the
 * user's last-booked coach + their earliest open slot today/tomorrow.
 */
export function useQuickBookSuggestion() {
  return useQuery<QuickBookSuggestion | null>({
    queryKey: ["v2", "quick-book-suggestion"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      const top = mockCoaches[0];
      if (!top) return null;
      return {
        coachId: top.id,
        coachName: top.firstName ?? top.name.split(" ")[0],
        whenLabel: "today 18:00",
      };
    },
    staleTime: 30_000,
  });
}
