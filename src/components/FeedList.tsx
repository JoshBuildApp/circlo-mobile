import { memo } from "react";
import { Video } from "lucide-react";
import { LazySection } from "@/components/LazySection";

interface FeedListProps {
  data: any[];
  activeTab: string;
}

const PostSkeleton = memo(() => (
  <div className="animate-pulse p-4 border-b border-border">
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-10 h-10 bg-secondary rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-secondary rounded w-1/4 mb-1"></div>
        <div className="h-3 bg-secondary rounded w-1/6"></div>
      </div>
    </div>
    <div className="h-64 bg-secondary rounded-lg mb-3"></div>
    <div className="h-4 bg-secondary rounded w-3/4"></div>
  </div>
));

PostSkeleton.displayName = "PostSkeleton";

const FeedList = memo(({ data, activeTab }: FeedListProps) => {
  if (!data?.length) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
          <Video className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">No posts yet</h3>
        <p className="text-sm text-muted-foreground">
          {activeTab === "following"
            ? "Follow some coaches to see their posts here"
            : "Check back later for new content"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {data.map((post: any, index: number) => (
        <LazySection
          key={post.id || index}
          fallback={<PostSkeleton />}
          rootMargin="200px"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground">{post.title || 'Post'}</h3>
            <p className="text-sm text-muted-foreground mt-1">{post.description || post.text || ''}</p>
          </div>
        </LazySection>
      ))}
    </div>
  );
});

FeedList.displayName = "FeedList";

export default FeedList;
