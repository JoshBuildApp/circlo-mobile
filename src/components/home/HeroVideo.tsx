import { useRef, useEffect } from "react";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroVideoProps {
  videoSrc: string;
  coachName: string;
  caption: string;
  coachId: string;
}

const HeroVideo = ({ videoSrc, coachName, caption, coachId }: HeroVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [videoSrc]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-secondary" style={{ aspectRatio: "16/10" }}>
      <video
        ref={videoRef}
        src={videoSrc}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold mb-1">Featured</p>
        <h2 className="text-base font-bold text-white leading-snug mb-1 max-w-[260px]">
          {caption}
        </h2>
        <p className="text-[13px] text-white/70 mb-3">{coachName}</p>
        <Link
          to={`/coach/${coachId}`}
          className="inline-flex items-center gap-2 bg-white text-foreground h-10 px-5 rounded-xl text-[13px] font-bold active:scale-95 transition-transform touch-target"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Watch Now
        </Link>
      </div>
    </div>
  );
};

export default HeroVideo;
