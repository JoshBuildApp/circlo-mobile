import { Skeleton } from "@/components/ui/skeleton";

export const DiscoverSkeleton = () => {
  return (
    <div className="space-y-6 p-4">
      {/* Header Section */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Search Bar */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Featured Coaches */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-4" />
                  ))}
                </div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg text-center space-y-2">
              <Skeleton className="h-8 w-8 mx-auto rounded" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};