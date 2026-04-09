import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, Globe } from 'lucide-react';
import { CoachLocationMap } from './CoachLocationMap';
import { useCoachLocation } from '@/hooks/use-coach-location';
import { cn } from '@/lib/utils';

interface CoachLocationCardProps {
  coachId: string;
  className?: string;
}

export const CoachLocationCard: React.FC<CoachLocationCardProps> = ({
  coachId,
  className
}) => {
  const { location, locationString, loading, error } = useCoachLocation(coachId);

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !locationString) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Location</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CoachLocationMap location={locationString} />
        
        <div className="space-y-3">
          {/* Location Details */}
          <div className="flex items-start space-x-3">
            <Globe className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">{locationString}</p>
              <p className="text-xs text-gray-500">General area</p>
            </div>
          </div>

          {/* Timezone */}
          {location?.timezone && (
            <div className="flex items-start space-x-3">
              <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900">
                  {new Intl.DateTimeFormat('en-US', {
                    timeZone: location.timezone,
                    timeStyle: 'short',
                    hour12: true
                  }).format(new Date())}
                </p>
                <p className="text-xs text-gray-500">Local time ({location.timezone})</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};