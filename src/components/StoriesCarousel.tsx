import { useStories } from "@/hooks/use-stories";
import { memo } from "react";
import { Plus } from "lucide-react";

const StoriesCarousel = memo(() => {
  const { data: stories, isLoading } = useStories();

  if (isLoading) {
    return (
      <div className="p-4 border-b border-border">
        <div className="flex space-x-3 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-16 h-16 bg-secondary rounded-full flex-shrink-0 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stories?.length) return null;

  return (
    <div className="p-4 border-b border-border">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        <button className="flex-shrink-0 flex flex-col items-center space-y-1">
          <div className="w-16 h-16 border-2 border-dashed border-muted-foreground/30 rounded-full flex items-center justify-center">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">Your story</span>
        </button>

        {stories.map((story) => (
          <button key={story.id} className="flex-shrink-0 flex flex-col items-center space-y-1">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full p-0.5">
              <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                <img 
                  src={story.display_image || "/placeholder.svg"} 
                  alt={story.display_name || "Story"}
                  className="w-14 h-14 rounded-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground max-w-[64px] truncate">
              {story.display_name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

StoriesCarousel.displayName = "StoriesCarousel";

export default StoriesCarousel;
