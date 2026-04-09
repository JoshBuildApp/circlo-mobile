import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useStories } from "@/hooks/use-stories";
import type { Story } from "@/hooks/use-stories";
import { SafeImage } from "@/components/ui/safe-image";
import { useAuth } from "@/contexts/AuthContext";

const StoriesStrip = () => {
  const { user } = useAuth();
  const { data: stories = [] } = useStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Group by owner key (coach_id or user_id)
  const grouped = stories.reduce<Record<string, Story[]>>((acc, s) => {
    const key = s.coach_id || s.user_id || s.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const ownerStories = Object.entries(grouped).map(([ownerId, items]) => ({
    ownerId,
    name: items[0].display_name || "User",
    image: items[0].display_image || "/placeholder.svg",
    stories: items,
  }));

  const allStories = ownerStories.flatMap((os) => os.stories);
  const currentStory = allStories[currentIndex];

  const goNext = () => {
    if (currentIndex < allStories.length - 1) setCurrentIndex((i) => i + 1);
    else setViewerOpen(false);
  };
  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };
  const openStory = (ownerId: string) => {
    const idx = allStories.findIndex((s) => (s.coach_id || s.user_id || s.id) === ownerId);
    setCurrentIndex(idx >= 0 ? idx : 0);
    setViewerOpen(true);
  };

  const openCreateStory = () => {
    window.dispatchEvent(new CustomEvent("open-create-content", { detail: "story" }));
  };

  if (ownerStories.length === 0 && !user) return null;

  return (
    <>
      <div className="px-4 pt-3 pb-2">
        <div className="flex w-full max-w-full gap-3 overflow-x-auto hide-scrollbar">
          {/* Add Story button for any logged-in user */}
          {user && (
            <button
              onClick={openCreateStory}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform touch-target"
            >
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground font-medium w-16 text-center truncate">
                Add Story
              </span>
            </button>
          )}
          {ownerStories.map((os) => (
            <button
              key={os.ownerId}
              onClick={() => openStory(os.ownerId)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform touch-target"
            >
              <div className="h-16 w-16 rounded-full p-[2.5px] bg-brand-gradient shadow-brand-sm">
                <div className="h-full w-full rounded-full overflow-hidden ring-2 ring-card">
                  <SafeImage src={os.image} alt={os.name} className="h-full w-full object-cover" loading="lazy" protect={false} displayWidth={80} srcSetWidths={[64, 128]} sizes="64px" />
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium w-16 text-center truncate">
                {os.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewerOpen && currentStory && (
        <div className="fixed inset-0 z-[60] bg-foreground flex flex-col animate-fade-in-scale">
          {/* Progress */}
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-[3px] px-3 pt-3 safe-area-top">
            {allStories.map((_, i) => (
              <div key={i} className="flex-1 h-[2.5px] rounded-full bg-primary-foreground/20 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    i <= currentIndex ? "bg-primary-foreground w-full" : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-0 right-0 z-10 flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-primary-foreground/20">
                <SafeImage src={currentStory.display_image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" protect={false} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-primary-foreground">{currentStory.display_name}</p>
                <p className="text-[11px] text-primary-foreground/50">
                  {new Date(currentStory.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewerOpen(false)}
              className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center active:bg-primary-foreground/20 transition-colors touch-target"
            >
              <X className="h-5 w-5 text-primary-foreground" />
            </button>
          </div>

          {/* Media */}
          <div className="flex-1 flex items-center justify-center">
            {/\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(currentStory.media_url) ? (
              <video src={currentStory.media_url} className="h-full w-full object-contain" autoPlay muted playsInline onEnded={goNext} />
            ) : (
              <SafeImage src={currentStory.media_url} alt="" className="h-full w-full object-contain" />
            )}
          </div>

          {/* Tap zones */}
          <button onClick={goPrev} className="absolute left-0 top-20 bottom-20 w-1/3" aria-label="Previous" />
          <button onClick={goNext} className="absolute right-0 top-20 bottom-20 w-1/3" aria-label="Next" />
        </div>
      )}
    </>
  );
};

export default StoriesStrip;
