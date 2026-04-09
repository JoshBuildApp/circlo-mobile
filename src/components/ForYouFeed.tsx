import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Volume2, VolumeX, User, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import type { Coach, Video } from "@/data/coaches";

interface FeedItem {
  video: Video;
  coach: Coach;
}

interface ForYouFeedProps {
  items: FeedItem[];
  onBookSession: (coach: Coach) => void;
}

const ForYouFeed = ({ items, onBookSession }: ForYouFeedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const itemHeight = el.clientHeight;
    const idx = Math.round(scrollTop / itemHeight);
    setActiveIndex(Math.min(idx, items.length - 1));
  }, [items.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <section className="py-16">
      <div className="container mb-8">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          <h2 className="font-heading text-2xl font-bold text-foreground">For You</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-5">Swipe through content curated for you</p>
      </div>

      <div className="container">
        <div
          ref={containerRef}
          className="relative h-[70vh] max-h-[600px] overflow-y-auto snap-y-mandatory hide-scrollbar rounded-2xl"
        >
          {items.map((item, i) => (
            <div
              key={`${item.coach.id}-${i}`}
              className="relative h-full snap-start flex-shrink-0"
            >
              <img
                src={item.coach.image}
                alt={item.video.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-transparent" />

              {/* Play icon center */}
              {i !== activeIndex && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-background/30 flex items-center justify-center backdrop-blur-sm">
                    <Play className="h-7 w-7 text-foreground fill-foreground ml-0.5" />
                  </div>
                </div>
              )}

              {/* Right side actions */}
              <div className="absolute right-4 bottom-28 flex flex-col items-center gap-5 z-10">
                <Link
                  to={`/coach/${item.coach.id}`}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary bg-secondary">
                    {item.coach.image ? (
                      <img
                        src={item.coach.image}
                        alt={item.coach.name}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <div className={`h-full w-full flex items-center justify-center text-sm font-bold text-primary ${item.coach.image ? 'hidden' : ''}`}>
                      {item.coach.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setMuted(!muted)}
                  className="h-10 w-10 rounded-full bg-secondary/60 flex items-center justify-center backdrop-blur-sm hover:bg-secondary transition-colors"
                >
                  {muted ? <VolumeX className="h-4 w-4 text-foreground" /> : <Volume2 className="h-4 w-4 text-foreground" />}
                </button>
              </div>

              {/* Bottom overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1">
                    <Link to={`/coach/${item.coach.id}`}>
                      <p className="font-heading font-bold text-foreground text-lg hover:text-primary transition-colors">
                        {item.coach.name}
                      </p>
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.coach.sport}</p>
                    <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{item.video.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/coach/${item.coach.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-secondary/60 backdrop-blur-sm text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <User className="h-4 w-4" />
                    View Profile
                  </Link>
                  <button
                    onClick={() => onBookSession(item.coach)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:brightness-110 transition-all active:scale-95"
                  >
                    <Calendar className="h-4 w-4" />
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {items.slice(0, 6).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ForYouFeed;
