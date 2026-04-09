import { Flame, Play, Eye, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useTrending } from "@/hooks/use-trending";
import SectionHeader from "./SectionHeader";
import { useState } from "react";

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString());

const HotRightNow = () => {
  const { data: trending = [] } = useTrending(4);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  if (trending.length === 0) return null;

  const featured = trending[0];
  const secondary = trending.length > 1 ? trending[1] : null;

  return (
    <div className="px-4">
      <SectionHeader
        title="Hot Right Now"
        icon={<Flame className="h-4 w-4 text-[#FF6B2C]" />}
        linkTo="/reels"
        linkLabel="See all"
      />

      <div className="flex gap-3">
        {/* Featured card — large */}
        <motion.button
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          onClick={() => setPlayingUrl(featured.media_url)}
          className={`relative rounded-2xl overflow-hidden group active:scale-[0.98] transition-transform duration-150 ${secondary ? "flex-[2]" : "w-full"}`}
        >
          <div className="aspect-[3/4]">
            {featured.thumbnail_url ? (
              <img src={featured.thumbnail_url} alt={featured.title} className="h-full w-full object-cover" />
            ) : (
              <video src={featured.media_url} className="h-full w-full object-cover" muted preload="metadata" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF6B2C] text-white text-[10px] font-bold shadow-lg">
            <Flame className="h-3 w-3" />
            Trending #1
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white text-[15px] font-bold line-clamp-2 mb-1.5 leading-tight">{featured.title}</p>
            <p className="text-white/80 text-[12px] font-medium mb-2">{featured.coach_name}</p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-white/70 text-[11px]">
                <Eye className="h-3 w-3" />{fmt(featured.views || 0)}
              </span>
              <span className="inline-flex items-center gap-1 text-white/70 text-[11px]">
                <Heart className="h-3 w-3" />{fmt(featured.likes_count)}
              </span>
            </div>
          </div>
        </motion.button>

        {/* Secondary card — tall, side-by-side */}
        {secondary && (
          <motion.button
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            onClick={() => setPlayingUrl(secondary.media_url)}
            className="flex-[1] relative rounded-2xl overflow-hidden group active:scale-[0.97] transition-transform duration-150"
          >
            <div className="aspect-[3/4]">
              {secondary.thumbnail_url ? (
                <img src={secondary.thumbnail_url} alt={secondary.title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <video src={secondary.media_url} className="h-full w-full object-cover" muted preload="metadata" />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-[12px] font-bold line-clamp-2 mb-1 leading-tight">{secondary.title}</p>
              <p className="text-white/70 text-[10px]">{secondary.coach_name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-0.5 text-white/60 text-[10px]">
                  <Heart className="h-2.5 w-2.5" />{fmt(secondary.likes_count)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-white/60 text-[10px]">
                  <Eye className="h-2.5 w-2.5" />{fmt(secondary.views || 0)}
                </span>
              </div>
            </div>
          </motion.button>
        )}
      </div>

      {/* Video modal */}
      {playingUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in-scale" onClick={() => setPlayingUrl(null)}>
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <video src={playingUrl} className="w-full rounded-2xl" controls autoPlay muted />
          </div>
        </div>
      )}
    </div>
  );
};

export default HotRightNow;
