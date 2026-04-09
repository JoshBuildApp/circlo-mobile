import { Play, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useFeedVideos } from "@/hooks/use-feed";
import SectionHeader from "./SectionHeader";
import { Dumbbell } from "lucide-react";
import { useState } from "react";

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const FeaturedWorkouts = () => {
  const { videos, loading } = useFeedVideos();
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // Take up to 10 videos that have media
  const workouts = videos
    .filter((v) => v.media_url)
    .slice(0, 10);

  if (loading || workouts.length === 0) return null;

  return (
    <div>
      <div className="px-4">
        <SectionHeader
          title="Featured Workouts"
          icon={<Dumbbell className="h-4 w-4 text-[#00D4AA]" />}
          linkTo="/plays"
          linkLabel="Watch all"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
        {workouts.map((video, i) => (
          <motion.button
            key={video.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            onClick={() => setPlayingUrl(video.media_url)}
            className="relative flex-shrink-0 w-36 rounded-2xl overflow-hidden group active:scale-[0.97] transition-transform duration-150 snap-start"
          >
            <div className="aspect-[9/16]">
              <video
                src={video.media_url}
                className="h-full w-full object-cover"
                muted
                preload="metadata"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Play className="h-4 w-4 text-white fill-white" />
              </div>
            </div>

            {/* Coach avatar + info */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                {video.coach_image ? (
                  <img
                    src={video.coach_image}
                    alt={video.coach_name}
                    className="h-5 w-5 rounded-full object-cover ring-1 ring-white/30"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[8px] text-white font-bold">
                    {video.coach_name?.charAt(0) || "C"}
                  </div>
                )}
                <span className="text-white/80 text-[10px] font-medium truncate">
                  {video.coach_name}
                </span>
              </div>
              <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight mb-1">
                {video.title}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5 text-white/60 text-[9px]">
                  <Eye className="h-2.5 w-2.5" />
                  {fmt(video.views || 0)}
                </span>
              </div>
            </div>

            {/* Sport badge */}
            {video.sport && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-[#00D4AA]/90 text-white text-[8px] font-bold uppercase tracking-wider">
                {video.sport}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Video modal */}
      {playingUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in-scale"
          onClick={() => setPlayingUrl(null)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <video
              src={playingUrl}
              className="w-full rounded-2xl"
              controls
              autoPlay
              muted
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedWorkouts;
