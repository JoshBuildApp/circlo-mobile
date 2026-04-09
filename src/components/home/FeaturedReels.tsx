import { Link } from "react-router-dom";
import { Play, Heart } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { SafeImage } from "@/components/ui/safe-image";

interface ReelCard {
  id: string;
  coachId: string;
  coachName: string;
  sport: string;
  image: string;
  videoSrc: string;
  caption: string;
  likes: number;
}

interface FeaturedReelsProps {
  items: ReelCard[];
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const FeaturedReels = ({ items }: FeaturedReelsProps) => {
  if (items.length === 0) return null;

  return (
    <div className="px-4">
      <SectionHeader title="Featured Reels" linkTo="/reels" linkLabel="Watch all" />
      <div className="flex w-full max-w-full gap-3 overflow-x-auto hide-scrollbar pb-1">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/coach/${item.coachId}`}
            className="flex-shrink-0 w-[150px] active:scale-[0.97] transition-transform duration-150"
          >
            <div className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-secondary">
              {item.image ? (
                <SafeImage src={item.image} alt={item.caption} className="absolute inset-0 h-full w-full object-cover" loading="lazy" displayWidth={200} srcSetWidths={[150, 300]} sizes="150px" />
              ) : (
                <video src={item.videoSrc} className="absolute inset-0 h-full w-full object-cover" muted preload="metadata" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-2.5 right-2.5">
                <div className="h-7 w-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-3 w-3 text-white fill-white ml-[1px]" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2 mb-1">{item.caption}</p>
                <div className="flex items-center gap-1 text-white/50">
                  <Heart className="h-3 w-3" />
                  <span className="text-[10px]">{fmt(item.likes)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedReels;
