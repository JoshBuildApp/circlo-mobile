import { Skeleton } from "@/components/ui/skeleton";

export function CoachProfileSkeleton() {
  return (
    <div className="pb-24">
      {/* Cover */}
      <div className="relative -mx-4 -mt-4">
        <Skeleton className="h-44 md:h-52 w-full rounded-none" />
        <div className="max-w-3xl mx-auto px-4 relative -mt-20">
          <div className="flex items-end gap-4">
            <Skeleton className="h-32 w-32 rounded-full flex-shrink-0" />
            <div className="space-y-2 pb-1 flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 mt-6 px-4 max-w-3xl mx-auto">
        <Skeleton className="h-11 w-36" />
        <Skeleton className="h-11 w-24" />
        <Skeleton className="h-11 w-24" />
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mt-6 px-4 max-w-3xl mx-auto overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-[100px] rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Content sections */}
      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
