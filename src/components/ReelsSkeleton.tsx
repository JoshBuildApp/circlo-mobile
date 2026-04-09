import { Skeleton } from "@/components/ui/skeleton"

export const ReelsSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Mobile view - single reel */}
      <div className="md:hidden">
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '9/16', height: 'calc(100vh - 140px)' }}>
          <Skeleton className="absolute inset-0" />
          
          {/* Overlay content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Side actions */}
          <div className="absolute right-4 bottom-20 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop view - grid */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '9/16' }}>
            <Skeleton className="absolute inset-0" />
            
            {/* Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>

            {/* Play indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}