import { useCallback } from "react";
import { useSavedItems } from "@/hooks/use-saved-items";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const COACH_COLLECTION = "Coaches";

/**
 * Thin adapter over `useSavedItems` that stores coach IDs in the generic
 * `saved_items` table under the "Coaches" collection. Lets every coach card
 * in the app drop a heart icon with optimistic toggle, zero extra schema.
 */
export function useSavedCoaches() {
  const { user } = useAuth();
  const { savedItems, saveItem, unsaveItem, loading } = useSavedItems();

  const savedCoachIds = savedItems
    .filter((s) => s.collection_name === COACH_COLLECTION)
    .map((s) => s.content_id);

  const isCoachSaved = useCallback(
    (coachId: string) => savedCoachIds.includes(coachId),
    [savedCoachIds],
  );

  const toggleSave = useCallback(
    (coachId: string, coachName?: string) => {
      if (!user) {
        toast.error("Log in to save coaches");
        return;
      }
      if (isCoachSaved(coachId)) {
        unsaveItem.mutate(coachId, {
          onSuccess: () => toast(`Removed${coachName ? ` ${coachName}` : ""} from saved`),
        });
      } else {
        saveItem.mutate(
          { contentId: coachId, collectionName: COACH_COLLECTION },
          { onSuccess: () => toast.success(`Saved${coachName ? ` ${coachName}` : ""}`) },
        );
      }
    },
    [user, isCoachSaved, saveItem, unsaveItem],
  );

  return { savedCoachIds, isCoachSaved, toggleSave, loading };
}
