import { Bookmark, FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useSavedItems } from "@/hooks/use-saved-items";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

const SavedCollections = () => {
  const { user } = useAuth();
  const { savedItems, collections, loading } = useSavedItems();
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const filteredItems = activeCollection
    ? savedItems.filter((i) => i.collection_name === activeCollection)
    : savedItems;

  const contentIds = filteredItems.map((i) => i.content_id);

  const { data: videos = [] } = useQuery({
    queryKey: ["saved_videos", contentIds],
    enabled: contentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_videos")
        .select("id, title, media_url, thumbnail_url, likes_count, views")
        .in("id", contentIds);
      if (error) throw error;
      return data || [];
    },
  });

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-5">
        <div className="text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Log in to see your saved content</p>
          <Link to="/login" className="text-primary text-sm font-semibold">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Saved"
        subtitle={`${savedItems.length} items saved`}
        className="px-5 pt-6 pb-4"
      />

      {/* Collection chips */}
      <div className="flex w-full max-w-full gap-2 overflow-x-auto hide-scrollbar px-5 pb-4">
        <button
          onClick={() => setActiveCollection(null)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium flex-shrink-0 transition-all ${
            !activeCollection ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          All
        </button>
        {collections.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCollection(c)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium flex-shrink-0 transition-all ${
              activeCollection === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {videos.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          illustration="saved"
          title={savedItems.length === 0 ? "Nothing saved yet" : "No videos here"}
          description={
            savedItems.length === 0
              ? "Bookmark coaching videos and plays to watch them anytime"
              : "Try a different collection or save more content"
          }
          action={savedItems.length === 0 ? { label: "Explore Videos", to: "/plays" } : undefined}
          secondaryAction={savedItems.length === 0 ? { label: "Browse coaches", to: "/discover" } : undefined}
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 px-5">
          {videos.map((v: any) => (
            <button
              key={v.id}
              onClick={() => setPlayingUrl(v.media_url)}
              className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-secondary group"
            >
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt={v.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              ) : (
                <video src={v.media_url} className="absolute inset-0 h-full w-full object-cover" muted preload="metadata" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[10px] font-semibold text-white line-clamp-2">{v.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {playingUrl && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center" onClick={() => setPlayingUrl(null)}>
          <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <video src={playingUrl} className="w-full rounded-2xl" controls autoPlay muted />
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedCollections;
