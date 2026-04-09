import { Skeleton } from "@/components/ui/skeleton"

export const ChatSkeleton = () => {
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>

        {/* Search */}
        <Skeleton className="h-10 w-full" />

        {/* Chat list */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-2">
              <div className="relative">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="border-b p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={`flex gap-2 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              {index % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
              <div className={`max-w-xs space-y-1 ${index % 2 === 0 ? 'items-start' : 'items-end'} flex flex-col`}>
                <Skeleton className={`h-10 ${index % 2 === 0 ? 'w-48' : 'w-32'} rounded-2xl`} />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t p-4 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="flex-1 h-10 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  )
}