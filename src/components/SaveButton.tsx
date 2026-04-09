import { Bookmark, BookMarked, FolderPlus, X } from "lucide-react";
import { useSavedItems } from "@/hooks/use-saved-items";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

interface SaveButtonProps {
  contentId: string;
  size?: "sm" | "md";
}

export const SaveButton = ({ contentId, size = "sm" }: SaveButtonProps) => {
  const { isItemSaved, saveItem, unsaveItem } = useSavedItems();
  const { user } = useAuth();
  const [showCollections, setShowCollections] = useState(false);
  const { collections } = useSavedItems();
  const saved = isItemSaved(contentId);

  const handleToggle = () => {
    if (!user) {
      toast.error("Log in to save content");
      return;
    }
    if (saved) {
      unsaveItem.mutate(contentId, { onSuccess: () => toast("Removed from saved") });
    } else {
      setShowCollections(true);
    }
  };

  const handleSaveToCollection = (name: string) => {
    saveItem.mutate({ contentId, collectionName: name }, {
      onSuccess: () => {
        toast.success(`Saved to "${name}"`);
        setShowCollections(false);
      },
    });
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <>
      <button
        onClick={handleToggle}
        className={`${btnSize} rounded-xl flex items-center justify-center transition-all active:scale-90 ${
          saved ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
        }`}
      >
        {saved ? <BookMarked className={iconSize} /> : <Bookmark className={iconSize} />}
      </button>

      {/* Collection picker */}
      {showCollections && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setShowCollections(false)}>
          <div
            className="w-full max-w-md bg-card rounded-t-3xl border-t border-border/10 p-5 pb-10 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm font-bold text-foreground">Save to collection</h3>
              <button onClick={() => setShowCollections(false)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              {["Saved", "Training ideas", "Coaches to try", ...collections.filter((c) => !["Saved", "Training ideas", "Coaches to try"].includes(c))].map((name) => (
                <button
                  key={name}
                  onClick={() => handleSaveToCollection(name)}
                  className="w-full h-11 rounded-xl bg-secondary text-foreground text-xs font-medium flex items-center gap-3 px-4 active:scale-[0.98] transition-all"
                >
                  <FolderPlus className="h-4 w-4 text-muted-foreground" />
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveButton;
