import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface WebhookEvent {
  id: string
  type: string
  processed_at: string
  status: 'success' | 'failed'
  error_message?: string
}

interface WebhookStats {
  total_events: number
  successful_events: number
  failed_events: number
  success_rate: number
}

export const useWebhookMonitoring = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWebhookEvents = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch recent webhook events (would need to create this table)
      const { data: eventsData, error: eventsError } = await (supabase
        .from('webhook_events' as any)
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(100) as any)

      if (eventsError) throw eventsError

      setEvents((eventsData || []) as any[])

      // Calculate stats
      const total = eventsData?.length || 0
      const successful = eventsData?.filter(e => e.status === 'success').length || 0
      const failed = total - successful

      setStats({
        total_events: total,
        successful_events: successful,
        failed_events: failed,
        success_rate: total > 0 ? (successful / total) * 100 : 0
      })
    } catch (err) {
      console.error('Error fetching webhook events:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const retryFailedEvent = async (eventId: string) => {
    try {
      // Call edge function to retry processing
      const { error } = await supabase.functions.invoke('retry-webhook', {
        body: { event_id: eventId }
      })

      if (error) throw error

      // Refresh events
      await fetchWebhookEvents()
    } catch (err) {
      console.error('Error retrying webhook event:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchWebhookEvents()
  }, [])

  return {
    events,
    stats,
    isLoading,
    error,
    retryFailedEvent,
    refresh: fetchWebhookEvents
  }
}