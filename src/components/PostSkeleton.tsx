import { Skeleton } from "@/components/ui/skeleton"

export const PostSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-6" />
      </div>
      
      {/* Content */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Media placeholder */}
      <Skeleton className="h-64 w-full rounded-lg mb-3" />
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  )
}