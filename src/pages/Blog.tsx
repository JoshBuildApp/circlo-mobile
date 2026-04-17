import { useNavigate } from "react-router-dom";
import { ChevronLeft, Newspaper, AlertTriangle } from "lucide-react";

const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Blog</h1>
      </div>

      <div className="px-4 space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Placeholder — coming soon</p>
            <p className="text-xs text-muted-foreground mt-1">
              The Circlo Blog isn't live yet. This page is a stub so the /blog route renders.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/10 bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">What will live here</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Coaching tips, athlete stories, training guides, and platform updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Blog;
