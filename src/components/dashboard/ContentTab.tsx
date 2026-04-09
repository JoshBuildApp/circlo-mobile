import { useMemo } from "react";
import {
  Eye, Heart, MessageCircle, Play, Upload, Trash2, Video,
  TrendingUp, Users, BarChart3, Crown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const BRAND_TEAL = "#00D4AA";
const BRAND_ORANGE = "#FF6B2C";

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

export interface VideoRecord {
  id: string;
  title: string;
  media_url: string;
  thumbnail_url?: string | null;
  views: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  category?: string | null;
}

export interface ContentTabProps {
  videos: VideoRecord[];
  followerGrowth: { week: string; followers: number }[];
  profileVisits: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  loading: boolean;
  onUpload: () => void;
  onDelete: (video: VideoRecord) => void;
}

const ContentTab = ({
  videos, followerGrowth, profileVisits, totalViews, totalLikes,
  totalComments, loading, onUpload, onDelete,
}: ContentTabProps) => {
  // Best performing content
  const bestContent = useMemo(() => {
    return [...videos]
      .sort((a, b) => ((b.views || 0) + (b.likes_count || 0) * 3) - ((a.views || 0) + (a.likes_count || 0) * 3))
      .slice(0, 3);
  }, [videos]);

  // Content performance by post
  const contentChart = useMemo(() => {
    return videos
      .slice(0, 10)
      .map(v => ({
        title: v.title.length > 12 ? v.title.slice(0, 12) + "..." : v.title,
        views: v.views || 0,
        likes: v.likes_count || 0,
      }));
  }, [videos]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Eye, label: "Views", value: fmt(totalViews), color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Heart, label: "Likes", value: fmt(totalLikes), color: "text-rose-500", bg: "bg-rose-500/10" },
          { icon: MessageCircle, label: "Comments", value: fmt(totalComments), color: "text-violet-500", bg: "bg-violet-500/10" },
          { icon: Users, label: "Visits", value: fmt(profileVisits), color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-xl p-3 text-center", s.bg)}>
            <s.icon className={cn("h-4 w-4 mx-auto mb-1", s.color)} />
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Best Performing */}
      {bestContent.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-bold text-foreground">Best Performing</h3>
          </div>
          <div className="space-y-2">
            {bestContent.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/50">
                <div className="relative h-12 w-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                  <video src={v.media_url} className="h-full w-full object-cover" muted preload="metadata" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-4 w-4 text-white/80 fill-white/80" />
                  </div>
                  <div className="absolute top-0.5 left-0.5">
                    <span className={cn(
                      "text-[8px] font-bold px-1 py-0.5 rounded",
                      i === 0 ? "bg-yellow-500 text-white" : "bg-secondary text-foreground"
                    )}>
                      #{i + 1}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{v.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" /> {fmt(v.views || 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Heart className="h-2.5 w-2.5" /> {fmt(v.likes_count || 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MessageCircle className="h-2.5 w-2.5" /> {fmt(v.comments_count || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Performance Chart */}
      {contentChart.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Content Performance</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={contentChart} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="title" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Bar dataKey="views" fill={BRAND_TEAL} radius={[4, 4, 0, 0]} name="Views" />
              <Bar dataKey="likes" fill={BRAND_ORANGE} radius={[4, 4, 0, 0]} name="Likes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Follower Growth */}
      {followerGrowth.length > 0 && followerGrowth.some(d => d.followers > 0) && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-heading font-bold text-foreground uppercase tracking-wide">Follower Growth</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={followerGrowth} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="followerGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_TEAL} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND_TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Area type="monotone" dataKey="followers" stroke={BRAND_TEAL} strokeWidth={2} fill="url(#followerGrowthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* All Content Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">All Content</h2>
          <Button size="sm" onClick={onUpload} className="gap-1.5 rounded-xl h-9">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center">
            <Video className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">No content yet</p>
            <p className="text-xs text-muted-foreground mb-4">Upload your first video to grow your audience.</p>
            <Button onClick={onUpload} className="rounded-xl gap-1.5">
              <Upload className="h-4 w-4" /> Upload Video
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {videos.map((video) => (
              <div key={video.id} className="rounded-xl border border-border/30 bg-card overflow-hidden group">
                <div className="relative aspect-video bg-secondary">
                  <video src={video.media_url} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity fill-white" />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground truncate">{video.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" /> {video.views || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Heart className="h-2.5 w-2.5" /> {video.likes_count || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MessageCircle className="h-2.5 w-2.5" /> {video.comments_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onDelete(video)}
                      className="h-6 w-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentTab;
