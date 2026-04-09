import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CoachCardSkeleton() {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-6">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Specialties */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}