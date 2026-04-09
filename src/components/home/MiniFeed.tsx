import { Link } from "react-router-dom";
import { Play, Heart, Eye } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { SafeImage } from "@/components/ui/safe-image";

interface MiniFeedCard {
  id: string;
  coachId: string;
  coachName: string;
  sport: string;
  image: string;
  videoSrc: string;
  caption: string;
  likes: number;
  views: number;
}

interface MiniFeedProps {
  items: MiniFeedCard[];
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const MiniFeed = ({ items }: MiniFeedProps) => {
  if (items.length === 0) return null;

  return (
    <div className="px-4">
      <SectionHeader title="Latest" linkTo="/reels" linkLabel="More" />
      <div className="flex flex-col gap-3">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            to={`/coach/${item.coachId}`}
            className="flex gap-3 p-3 rounded-2xl bg-card border border-border active:bg-secondary transition-colors duration-150"
          >
            <div className="relative w-24 aspect-[3/4] rounded-xl overflow-hidden bg-secondary flex-shrink-0">
              {item.image ? (
                <SafeImage src={item.image} alt={item.caption} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <video src={item.videoSrc} className="h-full w-full object-cover" muted preload="metadata" />
              )}
              <div className="absolute inset-0 bg-black/5" />
              <div className="absolute top-2 right-2">
                <Play className="h-3.5 w-3.5 text-white/70 fill-white/70" />
              </div>
            </div>
            <div className="flex-1 py-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground leading-snug line-clamp-2 mb-1.5">
                {item.caption}
              </p>
              <p className="text-[11px] text-muted-foreground mb-3">
                {item.coachName} · {item.sport}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground">{fmt(item.likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground">{fmt(item.views)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MiniFeed;
