import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Heart, MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/contexts/DataModeContext";
import SectionHeader from "./SectionHeader";

interface FollowingVideo {
  id: string;
  title: string;
  media_url: string | null;
  views: number;
  likes_count: number;
  created_at: string;
  coach_name: string;
  coach_image: string | null;
  sport: string;
}

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const FollowingFeed = () => {
  const { user } = useAuth();
  const { isRealMode } = useDataMode();
  const [videos, setVideos] = useState<FollowingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

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

    // Fetch recent videos from followed coaches — slimmed to 2 for the home tease.
    let query = supabase
      .from("coach_videos")
      .select("*")
      .in("coach_id", coachIds)
      .order("created_at", { ascending: false })
      .limit(2);

    if (isRealMode) query = query.eq("is_fake", false);

    const { data: vids, error } = await query;
    if (error) {
      console.error("FollowingFeed error:", error);
      setLoading(false);
      return;
    }

    if (!vids || vids.length === 0) {
      setLoading(false);
      return;
    }

    // Enrich with coach profiles
    const { data: profiles } = await supabase
      .from("coach_profiles")
      .select("id, coach_name, sport, image_url")
      .in("id", coachIds);

    const profileMap: Record<string, { coach_name: string; sport: string; image_url: string | null }> = {};
    if (profiles) {
      for (const p of profiles) {
        profileMap[p.id] = { coach_name: p.coach_name, sport: p.sport || "", image_url: p.image_url };
      }
    }

    const mapped: FollowingVideo[] = vids
      .map((v: any) => {
        const profile = profileMap[v.coach_id];
        if (!profile?.coach_name?.trim()) return null;
        return {
          id: v.id,
          title: v.title || "",
          media_url: v.media_url,
          views: v.views || 0,
          likes_count: v.likes_count || 0,
          created_at: v.created_at,
          coach_name: profile.coach_name,
          coach_image: profile.image_url,
          sport: profile.sport,
        };
      })
      .filter((v): v is FollowingVideo => v !== null);

    setVideos(mapped);
    setLoading(false);
  }, [user, isRealMode]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Don't render for logged-out users or if no followed content
  if (!user || loading || videos.length === 0) return null;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <SectionHeader title="Personalized Feed" />
      <div className="flex flex-col gap-4">
        {videos.map((v, i) => (
          <motion.button
            key={v.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            onClick={() => navigate("/feed")}
            className="text-left rounded-[24px] bg-card border border-border/40 p-5 hover:border-[#FF6B2C]/30 hover:shadow-[0_8px_24px_-12px_rgba(255,107,44,0.18)] transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              {v.coach_image ? (
                <img
                  src={v.coach_image}
                  alt={v.coach_name}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-[#FF6B2C]/20"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-[#FF6B2C]/20 flex items-center justify-center text-sm font-black text-[#FF6B2C]">
                  {v.coach_name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground truncate">{v.coach_name}</h4>
                  {v.sport && (
                    <span className="bg-[#FF6B2C]/10 text-[#FF6B2C] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {v.sport}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Shared a Play · {timeAgo(v.created_at)}
                </p>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-foreground/85 leading-relaxed mb-4 line-clamp-3">
              {v.title || "New training video — open to watch."}
            </p>

            {/* Thumbnail */}
            {v.media_url && (
              <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-muted">
                <video
                  src={v.media_url}
                  className="h-full w-full object-cover"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            )}

            {/* Engagement */}
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Heart className="h-4 w-4" />
                {fmt(v.likes_count)}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {fmt(Math.floor(v.likes_count / 8))}
              </span>
            </div>
          </motion.button>
        ))}

        <Link
          to="/feed"
          className="group inline-flex items-center justify-center gap-2 text-[#FF6B2C] font-black text-sm py-3 hover:gap-3 transition-all"
        >
          Open full feed
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default FollowingFeed;
