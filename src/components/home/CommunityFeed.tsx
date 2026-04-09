import {
  Heart, MessageCircle, Share2, Bookmark, Play, Eye, Trophy,
  Flame, Clock, Zap, FileText, Film
} from "lucide-react";
import { motion } from "framer-motion";
import { useForYouFeed, ForYouItem } from "@/hooks/use-for-you-feed";
import { useBatchLikes } from "@/hooks/use-feed";
import { useNewContent } from "@/hooks/use-new-content";
import NewPostsPill from "@/components/NewPostsPill";
import SectionHeader from "./SectionHeader";
import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
};

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const SPORT_COLORS: Record<string, string> = {
  padel: "bg-blue-500",
  tennis: "bg-green-500",
  fitness: "bg-orange-500",
  boxing: "bg-red-500",
  soccer: "bg-emerald-500",
  basketball: "bg-amber-500",
  yoga: "bg-purple-500",
  swimming: "bg-cyan-500",
  running: "bg-pink-500",
  mma: "bg-rose-600",
  crossfit: "bg-yellow-500",
};

const TYPE_BADGES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  video: { label: "Video", color: "bg-red-500/15 text-red-400", icon: Film },
  post: { label: "Post", color: "bg-emerald-500/15 text-emerald-400", icon: FileText },
  challenge: { label: "Challenge", color: "bg-amber-500/15 text-amber-400", icon: Trophy },
  coach_update: { label: "Update", color: "bg-blue-500/15 text-blue-400", icon: Zap },
  article: { label: "Article", color: "bg-purple-500/15 text-purple-400", icon: FileText },
  reel: { label: "Reel", color: "bg-pink-500/15 text-pink-400", icon: Play },
};

/* ── Avatar helper ── */
const Avatar = ({ src, name }: { src: string | null; name: string }) =>
  src ? (
    <img src={src} alt={name} className="h-9 w-9 rounded-full object-cover ring-2 ring-[#00D4AA]/30" />
  ) : (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#00D4AA] to-[#00D4AA]/60 flex items-center justify-center text-white text-sm font-bold">
      {name.charAt(0)}
    </div>
  );

/* ── Engagement bar ── */
const EngagementBar = ({
  item,
  liked,
  likeCount,
}: {
  item: ForYouItem;
  liked: boolean;
  likeCount: number;
}) => (
  <div className="flex items-center gap-1 px-3 py-2.5">
    <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted/60 transition-colors active:scale-95">
      <Heart className={`h-4 w-4 ${liked ? "text-red-500 fill-red-500" : "text-muted-foreground"}`} />
      <span className="text-[12px] text-muted-foreground font-medium">{fmt(likeCount)}</span>
    </button>
    <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted/60 transition-colors active:scale-95">
      <MessageCircle className="h-4 w-4 text-muted-foreground" />
      <span className="text-[12px] text-muted-foreground font-medium">{fmt(item.comments_count)}</span>
    </button>
    <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted/60 transition-colors active:scale-95">
      <Share2 className="h-4 w-4 text-muted-foreground" />
    </button>
    <div className="flex-1" />
    <button className="p-1 rounded-lg hover:bg-muted/60 transition-colors active:scale-95">
      <Bookmark className="h-4 w-4 text-muted-foreground" />
    </button>
  </div>
);

/* ── Card header ── */
const CardHeader = ({ item }: { item: ForYouItem }) => {
  const badge = TYPE_BADGES[item.type];
  const BadgeIcon = badge?.icon;
  return (
    <div className="flex items-center gap-3 p-3 pb-2">
      <Avatar src={item.coach_image} name={item.coach_name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-foreground truncate">{item.coach_name}</span>
          {item.sport && (
            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-wider ${SPORT_COLORS[item.sport.toLowerCase()] || "bg-gray-500"}`}>
              {item.sport}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
          {badge && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${badge.color}`}>
              {BadgeIcon && <BadgeIcon className="h-2.5 w-2.5" />}
              {badge.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════ CARD: Video ════════════ */
const VideoCard = ({ item, liked, likeCount, navigate }: { item: ForYouItem; liked: boolean; likeCount: number; navigate: (path: string) => void }) => (
  <motion.div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
    <CardHeader item={item} />
    {item.description && (
      <p className="px-3 pb-2 text-[13px] text-foreground/90 leading-relaxed line-clamp-2">
        {item.title && <span className="font-semibold">{item.title} — </span>}
        {item.description}
      </p>
    )}
    {item.media_url && (
      <div className="relative cursor-pointer group" onClick={() => navigate("/feed")}>
        <div className="aspect-video bg-muted">
          <video src={item.media_url} className="h-full w-full object-cover" muted preload="metadata" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-colors">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {item.views !== undefined && item.views > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
            <Eye className="h-3 w-3 text-white/80" />
            <span className="text-[10px] text-white/80 font-medium">{fmt(item.views)}</span>
          </div>
        )}
      </div>
    )}
    <EngagementBar item={item} liked={liked} likeCount={likeCount} />
  </motion.div>
);

/* ════════════ CARD: Text Post ════════════ */
const PostCard = ({ item, liked, likeCount }: { item: ForYouItem; liked: boolean; likeCount: number }) => (
  <motion.div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
    <CardHeader item={item} />
    <div className="px-3 pb-3">
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 p-4">
        <p className="text-[14px] text-foreground leading-relaxed line-clamp-4">
          {item.description}
        </p>
      </div>
    </div>
    <EngagementBar item={item} liked={liked} likeCount={likeCount} />
  </motion.div>
);

/* ════════════ CARD: Challenge ════════════ */
const ChallengeCard = ({ item }: { item: ForYouItem }) => (
  <motion.div className="rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-orange-500/5">
    <div className="flex items-center gap-3 p-3 pb-2">
      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
        <Trophy className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Workout Challenge</span>
        <h3 className="text-[15px] font-bold text-foreground truncate">{item.title}</h3>
      </div>
    </div>
    {item.description && (
      <p className="px-3 pb-2 text-[13px] text-foreground/80 leading-relaxed line-clamp-2">
        {item.description}
      </p>
    )}
    <div className="flex items-center gap-4 px-3 pb-3">
      {item.duration_days && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[12px] font-medium">{item.duration_days} days</span>
        </div>
      )}
      {item.coach_name && item.coach_name !== "Circlo" && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-[12px]">by <span className="font-semibold text-foreground">{item.coach_name}</span></span>
        </div>
      )}
    </div>
    <div className="px-3 pb-3">
      <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold active:scale-[0.98] transition-transform">
        Join Challenge
      </button>
    </div>
  </motion.div>
);

/* ════════════ CARD: Reel ════════════ */
const ReelCard = ({ item, navigate }: { item: ForYouItem; navigate: (path: string) => void }) => (
  <motion.div
    className="rounded-2xl overflow-hidden border border-pink-500/20 bg-card cursor-pointer group"
    onClick={() => navigate("/reels")}
  >
    <div className="relative">
      <div className="aspect-[9/14] max-h-72 bg-muted">
        {item.media_url && (
          <video src={item.media_url} className="h-full w-full object-cover" muted preload="metadata" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-14 w-14 rounded-full bg-pink-500/30 backdrop-blur-md flex items-center justify-center border border-pink-400/30 group-hover:scale-110 transition-transform">
          <Play className="h-6 w-6 text-white fill-white ml-0.5" />
        </div>
      </div>
      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/80 backdrop-blur-sm">
        <Flame className="h-3 w-3 text-white" />
        <span className="text-[10px] text-white font-bold">REEL</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Avatar src={item.coach_image} name={item.coach_name} />
          <span className="text-white text-[13px] font-bold truncate">{item.coach_name}</span>
        </div>
        {item.title && (
          <p className="text-white/90 text-[12px] font-medium line-clamp-2">{item.title}</p>
        )}
        {item.views !== undefined && item.views > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Eye className="h-3 w-3 text-white/60" />
            <span className="text-[10px] text-white/60 font-medium">{fmt(item.views)} views</span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

/* ════════════ CARD: Coach Update ════════════ */
const CoachUpdateCard = ({ item }: { item: ForYouItem }) => (
  <motion.div className="rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-card to-cyan-500/5">
    <div className="flex items-center gap-3 p-3">
      <Avatar src={item.coach_image} name={item.coach_name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-foreground truncate">{item.coach_name}</span>
          <Zap className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
      </div>
    </div>
    <div className="px-3 pb-3">
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3">
        <p className="text-[13px] text-foreground/90 leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  </motion.div>
);

/* ════════════ MAIN COMPONENT ════════════ */
const CommunityFeed = () => {
  const { items: feedItems, loading, refresh } = useForYouFeed();
  const navigate = useNavigate();

  const handleNewContent = useCallback(() => {
    refresh();
  }, [refresh]);

  const { newCount, acknowledge } = useNewContent({
    tables: ["coach_videos", "coach_posts"],
    onAcknowledge: handleNewContent,
  });

  const videoIds = useMemo(
    () => feedItems.filter((i) => i.type === "video" || i.type === "reel").map((i) => i.id),
    [feedItems]
  );
  const likeMap = useBatchLikes(videoIds);

  if (loading || feedItems.length === 0) return null;

  const renderCard = (item: ForYouItem, i: number) => {
    const liked = likeMap[item.id]?.liked || false;
    const likeCount = likeMap[item.id]?.count ?? item.likes_count;

    const card = (() => {
      switch (item.type) {
        case "video":
          return <VideoCard item={item} liked={liked} likeCount={likeCount} navigate={navigate} />;
        case "reel":
          return <ReelCard item={item} navigate={navigate} />;
        case "challenge":
          return <ChallengeCard item={item} />;
        case "coach_update":
          return <CoachUpdateCard item={item} />;
        case "post":
        case "article":
        default:
          return <PostCard item={item} liked={liked} likeCount={likeCount} />;
      }
    })();

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06, duration: 0.35 }}
      >
        {card}
      </motion.div>
    );
  };

  return (
    <div className="px-4">
      <SectionHeader
        title="For You"
        icon={<Flame className="h-4 w-4 text-[#FF6B2C]" />}
        linkTo="/feed"
        linkLabel="View all"
      />

      <div className="flex justify-center mb-3">
        <NewPostsPill count={newCount} onClick={acknowledge} />
      </div>

      <div className="space-y-4">
        {feedItems.map((item, i) => renderCard(item, i))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => navigate("/feed")}
        className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#FF6B2C]/10 to-[#00D4AA]/10 border border-[#FF6B2C]/20 text-[#FF6B2C] text-sm font-semibold hover:from-[#FF6B2C]/20 hover:to-[#00D4AA]/20 transition-all active:scale-[0.98]"
      >
        Explore More
      </motion.button>
    </div>
  );
};

export default CommunityFeed;
