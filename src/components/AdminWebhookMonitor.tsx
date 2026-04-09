import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useWebhookMonitoring } from '@/hooks/use-webhook-monitoring'
import { cn } from '@/lib/utils'

export const AdminWebhookMonitor = () => {
  const { events, stats, isLoading, error, retryFailedEvent, refresh } = useWebhookMonitoring()
  const [retryingEvents, setRetryingEvents] = useState<Set<string>>(new Set())

  const handleRetry = async (eventId: string) => {
    setRetryingEvents(prev => new Set(prev).add(eventId))
    try {
      await retryFailedEvent(eventId)
    } catch (err) {
      console.error('Failed to retry event:', err)
    } finally {
      setRetryingEvents(prev => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading webhook events...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_events}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.successful_events}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.failed_events}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Webhook Events</CardTitle>
            <CardDescription>
              Latest Stripe webhook events and their processing status
            </CardDescription>
          </div>
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No webhook events found
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {event.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    
                    <div>
                      <div className="font-medium">{event.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.processed_at).toLocaleString()}
                      </div>
                      {event.error_message && (
                        <div className="text-sm text-red-600 mt-1">
                          {event.error_message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={event.status === 'success' ? 'default' : 'destructive'}
                    >
                      {event.status}
                    </Badge>
                    
                    {event.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(event.id)}
                        disabled={retryingEvents.has(event.id)}
                      >
                        {retryingEvents.has(event.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Retry'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}