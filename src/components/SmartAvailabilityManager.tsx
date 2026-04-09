import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useSmartAvailabilitySync } from '@/hooks/use-smart-availability-sync';
import { cn } from '@/lib/utils';

interface SmartAvailabilityManagerProps {
  coachId: string;
  className?: string;
}

export const SmartAvailabilityManager: React.FC<SmartAvailabilityManagerProps> = ({
  coachId,
  className
}) => {
  const {
    slots,
    conflicts,
    loading,
    syncing,
    clearConflict,
    refreshAvailability
  } = useSmartAvailabilitySync(coachId);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const availableSlots = slots.filter(slot => slot.is_active);
  const bookedSlots = slots.filter(slot => !slot.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading availability...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Sync Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Smart Availability</h3>
          {syncing && (
            <Badge variant="secondary" className="animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Syncing...
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAvailability}
          disabled={loading || syncing}
        >
          Refresh
        </Button>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {conflicts.length} booking conflict{conflicts.length > 1 ? 's' : ''} detected
            <div className="mt-2 space-y-2">
              {conflicts.map((conflict, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                  <div className="text-sm">
                    <div className="font-medium">
                      {conflict.conflict_type === 'double_booking' ? 'Double Booking' : 'Slot Unavailable'}
                    </div>
                    <div className="text-muted-foreground">
                      {formatTime(conflict.start_time)} - {formatTime(conflict.end_time)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => clearConflict(index)}
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {availableSlots.length}
                </div>
                <div className="text-sm text-muted-foreground">Available Slots</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {bookedSlots.length}
                </div>
                <div className="text-sm text-muted-foreground">Booked Slots</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {conflicts.length}
                </div>
                <div className="text-sm text-muted-foreground">Conflicts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Available Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableSlots.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No available slots
            </p>
          ) : (
            <div className="space-y-2">
              {availableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {formatTime(slot.start_time)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {Math.round(
                        (new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / (1000 * 60)
                      )} minutes
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Available
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booked Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Booked Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookedSlots.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No booked slots
            </p>
          ) : (
            <div className="space-y-2">
              {bookedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {formatTime(slot.start_time)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Slot ID: {slot.id}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Booked
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};