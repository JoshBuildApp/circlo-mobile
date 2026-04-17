import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, UserCheck, Star, MapPin, Calendar, ChevronRight, Play, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SafeImage } from "@/components/ui/safe-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataMode } from "@/contexts/DataModeContext";

interface FollowedCoach {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  rating: number | null;
  price: number | null;
  location: string | null;
  is_verified: boolean | null;
  tagline: string | null;
}

interface RecentVideo {
  id: string;
  coach_id: string;
  title: string;
  media_url: string | null;
  views: number;
  created_at: string;
}

const Following = () => {
  const { user } = useAuth();
  const { isRealMode } = useDataMode();
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState<FollowedCoach[]>([]);
  const [videos, setVideos] = useState<RecentVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Get followed coach IDs
    const { data: follows } = await supabase
      .from("user_follows")
      .select("coach_id")
      .eq("user_id", user.id);

    if (!follows || follows.length === 0) {
      setLoading(false);
      return;
    }

    const coachIds = follows.map((f) => f.coach_id);

    // Fetch coach profiles
    const { data: profiles } = await supabase
      .from("coach_profiles")
      .select("id, coach_name, sport, image_url, rating, price, location, is_verified, tagline")
      .in("id", coachIds);

    if (profiles) setCoaches(profiles as FollowedCoach[]);

    // Fetch recent videos
    let q = supabase
      .from("coach_videos")
      .select("id, coach_id, title, media_url, views, created_at")
      .in("coach_id", coachIds)
      .order("created_at", { ascending: false })
      .limit(6);
    if (isRealMode) q = q.eq("is_fake", false);
    const { data: vids } = await q;
    if (vids) setVideos(vids);

    setLoading(false);
  }, [user, isRealMode]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
          <UserCheck className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Sign in to follow coaches</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Follow coaches and get updates on their sessions, videos and availability.
        </p>
        <Link to="/login" className="mt-2 px-6 py-2.5 rounded-xl bg-brand-gradient text-white font-semibold text-sm">
          Log in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[180px] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (coaches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
          <UserCheck className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">You're not following anyone yet</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Follow coaches to see their updates, sessions and content here.
        </p>
        <Link to="/discover" className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-gradient text-white font-semibold text-sm">
          <Compass className="h-4 w-4" />
          Discover Coaches
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 pb-28 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Following</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{coaches.length} coach{coaches.length !== 1 ? "es" : ""}</p>
        </div>
      </div>

      {/* ── Followed Coaches Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {coaches.map((coach, i) => (
          <motion.div
            key={coach.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div
              className="bg-card border border-border/50 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.98] transition-all duration-200"
              onClick={() => navigate(`/coach/${coach.id}`)}
            >
              {/* Cover / Avatar */}
              <div className="relative h-[120px] bg-muted">
                {coach.image_url ? (
                  <SafeImage
                    src={coach.image_url}
                    alt={coach.coach_name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    protect={false}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-orange-500/10">
                    <span className="text-3xl font-bold text-primary/60">
                      {coach.coach_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {coach.is_verified && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white">
                    ✓ PRO
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-bold text-foreground text-sm truncate">{coach.coach_name}</p>
                <p className="text-xs text-primary font-medium mt-0.5">{coach.sport}</p>
                {coach.tagline && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{coach.tagline}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {coach.rating && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {coach.rating.toFixed(1)}
                      </span>
                    )}
                    {coach.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {coach.location}
                      </span>
                    )}
                  </div>
                  {coach.price && (
                    <span className="text-[11px] font-semibold text-foreground">₪{coach.price}</span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/book?coach=${coach.id}`); }}
                  className="mt-2.5 w-full py-1.5 rounded-lg bg-brand-gradient text-white text-[11px] font-semibold active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  Book Session
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Recent Videos from Coaches You Follow ── */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-primary fill-primary" />
              <h2 className="text-sm font-bold text-foreground">Recent Videos</h2>
            </div>
            <Link to="/plays?view=feed" className="flex items-center gap-1 text-xs text-primary font-medium">
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {videos.map((v) => {
              const coach = coaches.find(c => c.id === v.coach_id);
              return (
                <div
                  key={v.id}
                  className="rounded-xl overflow-hidden bg-card border border-border/40 cursor-pointer active:scale-[0.97] transition-all"
                  onClick={() => navigate("/plays?view=feed")}
                >
                  <div className="relative aspect-video bg-muted">
                    {v.media_url && (
                      <video src={v.media_url} className="h-full w-full object-cover" muted preload="metadata" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {v.views > 0 && (
                      <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/50">
                        <Eye className="h-2 w-2 text-white/80" />
                        <span className="text-[9px] text-white/80">{v.views >= 1000 ? `${(v.views/1000).toFixed(1)}K` : v.views}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight">{v.title}</p>
                    {coach && <p className="text-[10px] text-muted-foreground mt-0.5">{coach.coach_name}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Following;
