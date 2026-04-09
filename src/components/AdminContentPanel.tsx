import { useState, useCallback } from "react";
import { Trash2, Search, Image, Video, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SafeImage } from "@/components/ui/safe-image";

interface ContentRow {
  id: string;
  title: string;
  media_url: string;
  media_type: string;
  coach_id: string;
  coach_name?: string;
  likes_count: number;
  views: number | null;
  created_at: string;
}

const AdminContentPanel = () => {
  const [content, setContent] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coach_videos")
      .select("id, title, media_url, media_type, coach_id, likes_count, views, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      toast.error("Failed to load content");
      setLoading(false);
      return;
    }

    // Fetch coach names
    const coachIds = [...new Set((data || []).map((v) => v.coach_id))];
    let coachMap: Record<string, string> = {};
    if (coachIds.length > 0) {
      const { data: coaches } = await supabase
        .from("coach_profiles")
        .select("id, coach_name")
        .in("id", coachIds);
      if (coaches) coaches.forEach((c: any) => { coachMap[c.id] = c.coach_name; });
    }

    setContent((data || []).map((v) => ({ ...v, coach_name: coachMap[v.coach_id] || "Unknown" })));
    setLoading(false);
    setLoaded(true);
  }, []);

  const handleDelete = async (item: ContentRow) => {
    setDeleting(item.id);
    try {
      // Try to delete from storage if it's a Supabase storage URL
      if (item.media_url.includes("/storage/v1/object/public/")) {
        const parts = item.media_url.split("/storage/v1/object/public/");
        if (parts[1]) {
          const [bucket, ...pathParts] = parts[1].split("/");
          const filePath = pathParts.join("/");
          if (bucket && filePath) {
            await supabase.storage.from(bucket).remove([filePath]);
          }
        }
      }

      // Delete related likes and comments
      await supabase.from("likes").delete().eq("content_id", item.id);
      await supabase.from("comments").delete().eq("content_id", item.id);
      await supabase.from("saved_items").delete().eq("content_id", item.id);

      // Delete the video record
      const { error } = await supabase.from("coach_videos").delete().eq("id", item.id);
      if (error) throw error;

      setContent((prev) => prev.filter((c) => c.id !== item.id));
      toast.success("Content deleted");
    } catch (err: any) {
      toast.error("Failed to delete: " + (err.message || "Unknown error"));
    }
    setDeleting(null);
    setConfirmId(null);
  };

  const filtered = content.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.coach_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!loaded) {
    return (
      <div className="bg-card rounded-2xl border border-border/10 p-6 text-center">
        <button
          onClick={fetchContent}
          disabled={loading}
          className="px-6 h-10 rounded-xl bg-foreground text-background text-sm font-bold disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load All Content"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or coach…"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} items</p>

      {/* Content list */}
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden divide-y divide-border/10">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No content found</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              {/* Thumbnail */}
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {item.media_type === "video" ? (
                  <div className="h-full w-full flex items-center justify-center bg-secondary">
                    <Video className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                ) : (
                  <SafeImage src={item.media_url} alt="" className="h-full w-full object-cover" protect={false} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {item.coach_name} · {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Delete */}
              {confirmId === item.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deleting === item.id}
                    className="px-3 h-8 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-bold disabled:opacity-50"
                  >
                    {deleting === item.id ? "…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(item.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete content"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminContentPanel;
