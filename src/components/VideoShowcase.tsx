import { memo, useRef, useEffect } from "react";
import { Play, Eye } from "lucide-react";

interface ShowcaseVideo {
  id: string;
  title: string;
  media_url?: string;
  url?: string;
  thumbnail?: string;
  views?: number;
  media_type?: string;
}

interface VideoShowcaseProps {
  videos: ShowcaseVideo[];
  onPlay: (url: string) => void;
}

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`
    : n.toString();

const ShowcaseItem = memo(
  ({ video, onPlay }: { video: ShowcaseVideo; onPlay: (url: string) => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLButtonElement>(null);
    const mediaUrl = video.media_url || video.url || "";
    const isVideo =
      video.media_type === "video" ||
      /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(mediaUrl);

    useEffect(() => {
      const el = videoRef.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => {
          e.isIntersecting ? el.play().catch(() => {}) : el.pause();
        },
        { threshold: 0.5 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    return (
      <button
        ref={containerRef}
        onClick={() => onPlay(mediaUrl)}
        className="relative flex-shrink-0 w-40 aspect-[9/16] rounded-2xl overflow-hidden bg-secondary group active:scale-[0.97] transition-transform snap-start"
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={video.thumbnail || mediaUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {isVideo && (
          <div className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
            <Play className="h-3 w-3 text-white fill-white ml-[1px]" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">
            {video.title}
          </p>
          {video.views !== undefined && video.views > 0 && (
            <span className="flex items-center gap-1 text-white/60 text-[9px] mt-1">
              <Eye className="h-2.5 w-2.5" />
              {fmt(video.views)}
            </span>
          )}
        </div>
      </button>
    );
  }
);
ShowcaseItem.displayName = "ShowcaseItem";

const VideoShowcase = ({ videos, onPlay }: VideoShowcaseProps) => {
  // Show only video-type items, max 6
  const showcase = videos
    .filter((v) => {
      const url = v.media_url || v.url || "";
      return (
        v.media_type === "video" ||
        /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url)
      );
    })
    .slice(0, 6);

  if (showcase.length === 0) return null;

  return (
    <div className="pb-4">
      <div className="px-5 mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
          <Play className="h-4 w-4 text-primary" />
          Video Showcase
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {showcase.length} clip{showcase.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 snap-x snap-mandatory scrollbar-hide">
        {showcase.map((video) => (
          <ShowcaseItem key={video.id} video={video} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
};

export default VideoShowcase;
