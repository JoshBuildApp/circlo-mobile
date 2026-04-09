import { Play } from "lucide-react";
import type { Video, Coach } from "@/data/coaches";

interface VideoCardProps {
  video: Video;
  coach: Coach;
  onClick: () => void;
  featured?: boolean;
}

const formatViews = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k views`;
  return `${n} views`;
};

const VideoCard = ({ video, coach, onClick, featured }: VideoCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full overflow-hidden rounded-lg bg-card border border-border/50 transition-all duration-200 hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_8px_32px_hsl(0,100%,59%,0.08)]"
    >
      <div className="relative aspect-video bg-secondary overflow-hidden">
        <img
          src={coach.image}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-background/20 group-hover:bg-background/10 transition-colors duration-200" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-11 w-11 rounded-lg bg-primary/90 flex items-center justify-center backdrop-blur-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-primary">
            <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <span className="absolute bottom-2 right-2 text-[10px] bg-background/80 text-foreground px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
            {video.duration}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-1 mb-1">{video.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{coach.name}</span>
          {video.views && (
            <>
              <span className="text-border">·</span>
              <span>{formatViews(video.views)}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export default VideoCard;
