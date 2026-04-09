import { Skeleton } from "@/components/ui/skeleton";

export const UserProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        
        {/* Stats */}
        <div className="flex justify-center space-x-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-6 w-8 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>

        <Skeleton className="h-10 w-32 mx-auto rounded" />
      </div>

      {/* Bio Section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16" />
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};