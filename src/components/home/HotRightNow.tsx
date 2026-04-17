import { useState, useRef } from "react";
import { Flame, Play, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useTrending } from "@/hooks/use-trending";
import SectionHeader from "./SectionHeader";

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const HotRightNow = () => {
  const { data: trending = [] } = useTrending(8);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  if (trending.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <SectionHeader
        title="Trending this week"
        icon={<Flame className="h-4 w-4 text-[#FF6B2C]" />}
        linkTo="/reels"
        linkLabel="See all shorts"
      />
      <div className="flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory">
        {trending.map((v, i) => (
          <TrendingCard
            key={v.id}
            video={v}
            index={i}
            onPlay={() => setPlayingUrl(v.media_url)}
          />
        ))}
      </div>

      {playingUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in-scale"
          onClick={() => setPlayingUrl(null)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <video src={playingUrl} className="w-full rounded-2xl" controls autoPlay muted />
          </div>
        </div>
      )}
    </div>
  );
};

interface TrendingCardProps {
  video: ReturnType<typeof useTrending>["data"] extends (infer T)[] | undefined ? T : never;
  index: number;
  onPlay: () => void;
}

function TrendingCard({ video, index, onPlay }: TrendingCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  const handleEnter = () => {
    setHovering(true);
    const el = videoRef.current;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  };

  const handleLeave = () => {
    setHovering(false);
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onPlay}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="relative flex-shrink-0 w-[160px] md:w-[180px] aspect-[9/16] rounded-[24px] overflow-hidden snap-start group active:scale-[0.97] transition-transform duration-150 shadow-lg hover:shadow-2xl"
    >
      {video.thumbnail_url && !hovering && (
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}
      <video
        ref={videoRef}
        src={video.media_url}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        preload="none"
        poster={video.thumbnail_url || undefined}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

      {/* Trending #1 badge on first card */}
      {index === 0 && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-[#FF6B2C] text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
          <Flame className="h-2.5 w-2.5" />
          #1 Trending
        </div>
      )}

      {/* Play overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="h-12 w-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center">
          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 p-3 text-left">
        <p className="text-white text-xs font-bold leading-tight line-clamp-2 mb-1 drop-shadow-md">
          {video.title || "Untitled"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-[10px] font-medium truncate">
            {video.coach_name ? `@${video.coach_name.split(" ")[0].toLowerCase()}` : ""}
          </span>
          {video.views > 0 && (
            <span className="flex items-center gap-0.5 text-white/70 text-[10px] font-semibold">
              <Eye className="h-2.5 w-2.5" />
              {fmt(video.views)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default HotRightNow;
