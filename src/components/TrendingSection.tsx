import { useTrending } from "@/hooks/use-trending";
import { Button } from "@/components/ui/button";
import { LazyIcon } from "@/components/LazyIcon";
import { ActionIcons } from "@/lib/icons";

const TrendingSection = () => {
  const { data: trending, isLoading } = useTrending();

  if (isLoading) {
    return (
      <div className="p-4 border-b">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
        <div className="flex space-x-3 overflow-x-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-32 h-20 bg-gray-200 rounded flex-shrink-0 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!trending?.length) return null;

  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Trending Now</h2>
        <Button variant="ghost" size="sm">
          <LazyIcon iconLoader={ActionIcons.MoreVertical} className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        {trending.map((item, index) => (
          <div key={index} className="flex-shrink-0 w-32">
            <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-2 flex items-center justify-center">
              <LazyIcon iconLoader={ActionIcons.Heart} className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-medium line-clamp-2">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.views} views</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingSection;