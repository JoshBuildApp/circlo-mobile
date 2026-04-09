import { Skeleton } from "@/components/ui/skeleton";

export const CommunitySkeleton = () => {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Community Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Community Feed */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-4">
            {/* Post Header */}
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Post Image */}
            <Skeleton className="aspect-video w-full rounded-lg" />

            {/* Post Actions */}
            <div className="flex items-center space-x-6">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center space-x-1">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Trending Communities Sidebar */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};