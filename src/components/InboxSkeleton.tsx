import { Skeleton } from "@/components/ui/skeleton";

export const InboxSkeleton = () => {
  return (
    <div className="flex h-screen">
      {/* Chat List Sidebar */}
      <div className="w-full md:w-1/3 border-r bg-white">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border-b space-y-2">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages Area - Only visible on desktop */}
      <div className="hidden md:flex flex-1 flex-col">
        <div className="p-4 border-b flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs space-y-2 ${i % 2 === 0 ? 'items-end' : 'items-start'} flex flex-col`}>
                <Skeleton className="h-10 w-48 rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Skeleton className="flex-1 h-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};