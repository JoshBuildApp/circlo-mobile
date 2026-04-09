import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PlaysSkeletonProps {
  count?: number;
  className?: string;
  variant?: "grid" | "list";
}

export const PlaysSkeleton = ({ count = 8, className, variant = "grid" }: PlaysSkeletonProps) => {
  if (variant === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-start space-x-4">
              {/* Thumbnail */}
              <Skeleton className="h-20 w-20 md:h-24 md:w-24 rounded-lg flex-shrink-0" />
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                
                {/* Creator info */}
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                
                {/* Stats */}
                <div className="flex items-center space-x-4 text-sm">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
              
              {/* Action button */}
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Video thumbnail */}
          <div className="relative">
            <Skeleton className="h-48 w-full" />
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            
            {/* Duration badge */}
            <div className="absolute bottom-2 right-2">
              <Skeleton className="h-5 w-12 rounded" />
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            {/* Creator info */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};