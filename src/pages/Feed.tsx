import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Video } from "lucide-react";
import { motion } from "framer-motion";

import FeedVideoCard from "@/components/FeedVideoCard";
import FeedStoriesBar from "@/components/FeedStoriesBar";
import { useSmartFeed } from "@/hooks/use-smart-feed";
import { useNewContent } from "@/hooks/use-new-content";
import NewPostsPill from "@/components/NewPostsPill";
import { ErrorState } from "@/components/ErrorState";

const FEED_TABLES = ["coach_videos"];

const Feed = () => {
  const { videos, loading, error, refresh } = useSmartFeed();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNewContent = useCallback(() => {
    refresh();
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [refresh]);

  const { newCount, acknowledge } = useNewContent({
    tables: FEED_TABLES,
    onAcknowledge: handleNewContent,
  });

  // Observe which video is in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container || videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (!isNaN(index)) setActiveIndex(index);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    const children = container.querySelectorAll("[data-index]");
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [videos]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center px-6">
        <ErrorState
          title="Couldn't load your feed"
          description="Something went wrong while fetching videos. Please try again."
          onRetry={refresh}
        />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center gap-4 p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 shadow-lg max-w-sm w-full"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-heading text-xl font-bold text-foreground">No videos yet</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              When coaches upload videos, they'll appear here in your feed. Discover coaches to follow.
            </p>
          </div>
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-95 transition-all"
          >
            Discover Coaches
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-black flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 bg-gradient-to-b from-black/60 to-transparent">
        <Link to="/home" className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
            <span className="font-heading text-[8px] font-bold text-primary-foreground">C</span>
          </div>
          <span className="font-heading text-sm font-bold text-white">Feed</span>
        </div>
        <Link
          to="/discover"
          className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <Compass className="h-4 w-4" />
        </Link>
      </div>

      {/* Stories bar — visible on first video */}
      <FeedStoriesBar visible={activeIndex === 0} />

      {/* New posts pill */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+3.5rem)] left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <NewPostsPill count={newCount} onClick={acknowledge} />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
        {videos.slice(0, Math.min(videos.length, 8)).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-primary scale-125" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Video feed — virtualized */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {videos.map((video, index) => (
          <div key={video.id} data-index={index} className="h-[100dvh] w-full max-w-full snap-start snap-always overflow-hidden">
            {Math.abs(index - activeIndex) <= 1 ? (
              <FeedVideoCard video={video} isActive={index === activeIndex} />
            ) : (
              <div className="w-full h-full bg-secondary" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
