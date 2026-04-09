import { Link } from "react-router-dom";
import { Play, Eye } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { SafeImage } from "@/components/ui/safe-image";

interface ForYouCard {
  id: string;
  coachId: string;
  coachName: string;
  sport: string;
  image: string;
  videoSrc: string;
  caption: string;
  views: number;
}

interface ForYouStripProps {
  items: ForYouCard[];
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const ForYouStrip = ({ items }: ForYouStripProps) => {
  if (items.length === 0) return null;

  return (
    <div className="px-4">
      <SectionHeader title="For You" linkTo="/reels" linkLabel="More" />
      <div className="flex w-full max-w-full gap-3 overflow-x-auto hide-scrollbar pb-1">
        {items.slice(0, 8).map((item) => (
          <Link
            key={item.id}
            to={`/coach/${item.coachId}`}
            className="flex-shrink-0 w-[140px] active:scale-[0.97] transition-transform duration-150"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary">
              {item.image ? (
                <SafeImage src={item.image} alt={item.caption} className="absolute inset-0 h-full w-full object-cover" loading="lazy" displayWidth={200} srcSetWidths={[150, 300]} sizes="150px" />
              ) : item.videoSrc ? (
                <video src={item.videoSrc} className="absolute inset-0 h-full w-full object-cover" muted preload="metadata" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-2.5 right-2.5">
                <Play className="h-3.5 w-3.5 text-white/50 fill-white/50" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-white text-[11px] font-semibold line-clamp-2 mb-0.5">{item.caption}</p>
                <div className="flex items-center gap-1 text-white/40">
                  <Eye className="h-3 w-3" />
                  <span className="text-[10px]">{fmt(item.views)}</span>
                </div>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground truncate">{item.coachName} · {item.sport}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ForYouStrip;
