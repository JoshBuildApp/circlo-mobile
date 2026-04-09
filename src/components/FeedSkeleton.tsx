import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FeedSkeletonProps {
  count?: number;
  className?: string;
}

export const FeedSkeleton = ({ count = 3, className }: FeedSkeletonProps) => {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          
          {/* Media placeholder */}
          <Skeleton className="h-48 w-full rounded-lg" />
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
};