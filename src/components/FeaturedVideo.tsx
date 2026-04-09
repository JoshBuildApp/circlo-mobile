import { Play, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Coach, Video } from "@/data/coaches";

interface FeaturedVideoProps {
  coach: Coach;
  video: Video;
  onPlay: () => void;
}

const FeaturedVideo = ({ coach, video, onPlay }: FeaturedVideoProps) => {
  return (
    <section className="relative w-full aspect-[16/7] min-h-[400px] max-h-[600px] overflow-hidden group">
      <img
        src={coach.image}
        alt={video.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />

      {/* Play button center */}
      <button
        onClick={onPlay}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary glow-primary"
      >
        <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground ml-1" />
      </button>

      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 z-10">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          Featured
        </span>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
          {video.title}
        </h2>
        <p className="text-muted-foreground text-sm mb-5 max-w-md">
          {coach.name} · {coach.sport} · {coach.location}
        </p>
        <Link
          to={`/coach/${coach.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View Profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedVideo;
