import { useState, useEffect, useRef } from "react";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStories } from "@/hooks/use-stories";
import type { Story } from "@/hooks/use-stories";
import { SafeImage } from "@/components/ui/safe-image";
import { useAuth } from "@/contexts/AuthContext";

interface FeedStoriesBarProps {
  visible: boolean;
}

const FeedStoriesBar = ({ visible }: FeedStoriesBarProps) => {
  const { user } = useAuth();
  const { data: stories = [] } = useStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STORY_DURATION = 5000;

  // Group stories by owner
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

  // Auto-advance timer
  useEffect(() => {
    if (!viewerOpen) return;
    setProgress(0);

    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed / STORY_DURATION, 1));
      if (elapsed >= STORY_DURATION) {
        goNext();
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen, currentIndex]);

  const goNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex < allStories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setViewerOpen(false);
    }
  };

  const goPrev = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const openStory = (ownerId: string) => {
    const idx = allStories.findIndex(
      (s) => (s.coach_id || s.user_id || s.id) === ownerId
    );
    setCurrentIndex(idx >= 0 ? idx : 0);
    setViewerOpen(true);
  };

  const openCreateStory = () => {
    window.dispatchEvent(
      new CustomEvent("open-create-content", { detail: "story" })
    );
  };

  if (ownerStories.length === 0 && !user) return null;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute top-[calc(env(safe-area-inset-top)+3rem)] left-0 right-0 z-10 px-3 py-2"
          >
            <div className="flex w-full gap-3 overflow-x-auto hide-scrollbar">
              {/* Add story */}
              {user && (
                <button
                  onClick={openCreateStory}
                  className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform"
                >
                  <div className="h-[60px] w-[60px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-white/25">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[10px] text-white/60 font-medium w-14 text-center truncate">
                    Add
                  </span>
                </button>
              )}

              {/* Story circles */}
              {ownerStories.map((os) => (
                <button
                  key={os.ownerId}
                  onClick={() => openStory(os.ownerId)}
                  className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform"
                >
                  <div className="h-[60px] w-[60px] rounded-full p-[2.5px] bg-gradient-to-br from-[#00D4AA] to-[#FF6B2C] shadow-[0_0_12px_rgba(0,212,170,0.3)]">
                    <div className="h-full w-full rounded-full overflow-hidden ring-2 ring-black">
                      <SafeImage
                        src={os.image}
                        alt={os.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        protect={false}
                        displayWidth={80}
                        srcSetWidths={[64, 128]}
                        sizes="64px"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-white/70 font-medium w-14 text-center truncate">
                    {os.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen story viewer */}
      <AnimatePresence>
        {viewerOpen && currentStory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[60] bg-black flex flex-col"
          >
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 z-10 flex gap-[3px] px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              {allStories.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-[2.5px] rounded-full bg-white/20 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width:
                        i < currentIndex
                          ? "100%"
                          : i === currentIndex
                          ? `${progress * 100}%`
                          : "0%",
                      transitionDuration: i === currentIndex ? "30ms" : "300ms",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-[calc(env(safe-area-inset-top)+1.25rem)] left-0 right-0 z-10 flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-white/20">
                  <SafeImage
                    src={currentStory.display_image || "/placeholder.svg"}
                    alt=""
                    className="h-full w-full object-cover"
                    protect={false}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">
                    {currentStory.display_name}
                  </p>
                  <p className="text-[11px] text-white/50">
                    {new Date(currentStory.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewerOpen(false)}
                className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Media */}
            <div className="flex-1 flex items-center justify-center">
              {/\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(
                currentStory.media_url
              ) ? (
                <video
                  src={currentStory.media_url}
                  className="h-full w-full object-contain"
                  autoPlay
                  muted
                  playsInline
                  onEnded={goNext}
                />
              ) : (
                <SafeImage
                  src={currentStory.media_url}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            {/* Navigation arrows (desktop) */}
            {currentIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center active:bg-white/20 transition-colors hidden md:flex"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
            )}
            {currentIndex < allStories.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center active:bg-white/20 transition-colors hidden md:flex"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            )}

            {/* Tap zones (mobile) */}
            <button
              onClick={goPrev}
              className="absolute left-0 top-20 bottom-20 w-1/3 md:hidden"
              aria-label="Previous"
            />
            <button
              onClick={goNext}
              className="absolute right-0 top-20 bottom-20 w-1/3 md:hidden"
              aria-label="Next"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedStoriesBar;
