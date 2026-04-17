import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, Dumbbell, Star, Play, Flame, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionRecommendations, type PracticeTip } from "@/hooks/use-session-recommendations";

const INTENSITY_CONFIG: Record<PracticeTip["intensity"], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  low: { label: "Light", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle },
  medium: { label: "Moderate", color: "text-amber-500", bg: "bg-amber-500/10", icon: Dumbbell },
  high: { label: "Intense", color: "text-red-500", bg: "bg-red-500/10", icon: Flame },
};

const SessionRecommendations = () => {
  const navigate = useNavigate();
  const { recommendations, loading } = useSessionRecommendations();

  if (loading) return <SessionRecommendationsSkeleton />;
  if (!recommendations) return null;

  const { sport, coachName, practiceTips, suggestedCoaches, suggestedVideos } = recommendations;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-2 mb-6"
    >
      {/* Section header */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Recommendations</p>
          <p className="text-[11px] text-muted-foreground/60">Based on your {sport} session with {coachName}</p>
        </div>
      </div>

      {/* Practice Tips */}
      <div className="mb-5">
        <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          What to Practice Next
        </p>
        <div className="px-4 flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {practiceTips.slice(0, 3).map((tip, i) => {
            const cfg = INTENSITY_CONFIG[tip.intensity];
            const IntensityIcon = cfg.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex-shrink-0 w-56 p-4 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", cfg.color, cfg.bg)}>
                    <IntensityIcon className="h-2.5 w-2.5" />
                    {cfg.label}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {tip.duration}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight mb-1.5">{tip.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{tip.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Suggested Coaches */}
      {suggestedCoaches.length > 0 && (
        <div className="mb-5">
          <div className="px-4 flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Coaches You Might Like
            </p>
            <button
              onClick={() => navigate(`/discover?sport=${encodeURIComponent(sport)}`)}
              className="flex items-center gap-0.5 text-[11px] font-semibold text-primary active:opacity-70"
            >
              See all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="px-4 flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {suggestedCoaches.map((coach, i) => (
              <motion.button
                key={coach.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => navigate(`/coach/${coach.id}`)}
                className="flex-shrink-0 w-40 text-left rounded-2xl bg-card border border-border overflow-hidden active:scale-95 transition-transform"
              >
                {/* Coach image */}
                <div className="h-24 bg-secondary relative">
                  {coach.image_url ? (
                    <img
                      src={coach.image_url}
                      alt={coach.coach_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground/30">
                        {coach.coach_name?.charAt(0) || "C"}
                      </span>
                    </div>
                  )}
                  {coach.is_verified && (
                    <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary/90 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                {/* Coach info */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground truncate">{coach.coach_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{coach.sport}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    {coach.rating ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold">
                        <Star className="h-2.5 w-2.5 fill-amber-400" />
                        {Number(coach.rating).toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">New</span>
                    )}
                    {coach.price && (
                      <span className="text-[10px] font-semibold text-foreground">₪{coach.price}</span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Videos */}
      {suggestedVideos.length > 0 && (
        <div>
          <div className="px-4 flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Videos for You
            </p>
            <button
              onClick={() => navigate("/plays")}
              className="flex items-center gap-0.5 text-[11px] font-semibold text-primary active:opacity-70"
            >
              See all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="px-4 flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {suggestedVideos.slice(0, 4).map((video, i) => (
              <motion.button
                key={video.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => navigate("/plays")}
                className="flex-shrink-0 w-44 text-left rounded-2xl bg-card border border-border overflow-hidden active:scale-95 transition-transform"
              >
                {/* Thumbnail */}
                <div className="h-24 bg-secondary relative">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
                {/* Video info */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1">{video.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {video.views != null && (
                      <span>{video.views >= 1000 ? `${(video.views / 1000).toFixed(1)}k` : video.views} views</span>
                    )}
                    {video.likes_count > 0 && (
                      <span>{video.likes_count} likes</span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

function SessionRecommendationsSkeleton() {
  return (
    <div className="mt-2 mb-6">
      <div className="px-4 pb-3 flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-xl" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-40" />
        </div>
      </div>
      <div className="px-4 mb-4">
        <Skeleton className="h-3 w-32 mb-2" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-56 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SessionRecommendations;
