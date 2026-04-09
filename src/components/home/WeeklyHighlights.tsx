import { Sparkles, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDataMode } from "@/contexts/DataModeContext";
import { SafeImage } from "@/components/ui/safe-image";
import SectionHeader from "./SectionHeader";
import { useState } from "react";

const WeeklyHighlights = () => {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const { isRealMode } = useDataMode();

  const { data: highlights = [] } = useQuery({
    queryKey: ["weekly_highlights", isRealMode],
    queryFn: async () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let query = supabase
        .from("coach_videos")
        .select("id, title, media_url, thumbnail_url, likes_count, views, coach_id")
        .gte("created_at", oneWeekAgo)
        .order("likes_count", { ascending: false })
        .limit(5);
      if (isRealMode) query = query.eq("is_fake", false);
      const { data, error } = await query;
      if (error) throw error;

      const coachIds = [...new Set((data || []).map((v: any) => v.coach_id))];
      let coachMap: Record<string, string> = {};
      if (coachIds.length > 0) {
        const { data: coaches } = await supabase
          .from("coach_profiles")
          .select("id, coach_name")
          .in("id", coachIds);
        if (coaches) coaches.forEach((c: any) => { coachMap[c.id] = c.coach_name; });
      }

      return (data || [])
        .map((v: any) => {
          const coachName = coachMap[v.coach_id]?.trim();
          if (!coachName) return null;

          return {
            ...v,
            coach_name: coachName,
          };
        })
        .filter((video): video is NonNullable<typeof video> => video !== null);
    },
    refetchInterval: 600000,
  });

  if (highlights.length === 0) return null;

  return (
    <div className="px-4">
      <SectionHeader
        title="Best of the Week"
        icon={<Sparkles className="h-4 w-4 text-foreground" />}
      />
      {/* Full-width stacked cards */}
      <div className="space-y-3">
        {highlights.map((h: any, i: number) => (
          <button
            key={h.id}
            onClick={() => setPlayingUrl(h.media_url)}
            className="relative w-full rounded-2xl overflow-hidden bg-secondary active:scale-[0.98] transition-transform duration-150 aspect-video touch-target"
          >
            {h.thumbnail_url ? (
              <SafeImage src={h.thumbnail_url} alt={h.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" displayWidth={400} srcSetWidths={[200, 400, 800]} sizes="(min-width: 768px) 50vw, 100vw" />
            ) : (
              <video src={h.media_url} className="absolute inset-0 h-full w-full object-cover" muted preload="metadata" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-[12px] font-semibold text-white line-clamp-1">{h.title}</p>
              <p className="text-[11px] text-white/50">{h.coach_name}</p>
            </div>
            {i === 0 && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-foreground text-background text-[10px] font-bold flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" /> #1 This Week
              </div>
            )}
          </button>
        ))}
      </div>

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

export default WeeklyHighlights;
