import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Compass, Users } from "lucide-react";
import FeedVideoCard from "@/components/FeedVideoCard";
import { useFeedVideos } from "@/hooks/use-feed";
import { useFollowedCoachIds } from "@/hooks/use-follow";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ErrorState";

const Following = () => {
  const { user } = useAuth();
  const { videos, loading, error, refresh } = useFeedVideos();
  const { followedCoachIds } = useFollowedCoachIds();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter to only followed coaches
  const followedVideos = videos.filter((v) => followedCoachIds.includes(v.coach_id));

  useEffect(() => {
    const container = containerRef.current;
    if (!container || followedVideos.length === 0) return;

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
  }, [followedVideos]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-72px)] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[calc(100vh-72px)] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Users className="h-12 w-12 text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold text-foreground">Sign in to see your feed</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Follow coaches and their content will appear here.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (followedVideos.length === 0) {
    return (
      <div className="h-[calc(100vh-72px)] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Users className="h-12 w-12 text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold text-foreground">No videos yet</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Follow some coaches and their videos will show up here.
        </p>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm"
        >
          <Compass className="h-4 w-4" />
          Discover Coaches
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-72px)] bg-black flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center px-4 pt-4 pb-2 bg-gradient-to-b from-black/60 to-transparent">
        <span className="font-heading text-sm font-bold text-white">Following</span>
      </div>

      {/* Progress dots */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
        {followedVideos.slice(0, 8).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-primary scale-125" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Feed — virtualized */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {followedVideos.map((video, index) => (
          <div key={video.id} data-index={index} className="h-full w-full snap-start snap-always">
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

export default Following;
