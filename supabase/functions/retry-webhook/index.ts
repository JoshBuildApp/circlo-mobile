import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { event_id } = await req.json()

    if (!event_id) {
      return new Response('Missing event_id', { status: 400 })
    }

    // Get the webhook event
    const { data: event, error: fetchError } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('id', event_id)
      .single()

    if (fetchError || !event) {
      return new Response('Event not found', { status: 404 })
    }

    if (event.status === 'success') {
      return new Response('Event already processed successfully', { status: 400 })
    }

    // Increment retry count
    const { error: updateError } = await supabase
      .from('webhook_events')
      .update({ retry_count: event.retry_count + 1 })
      .eq('id', event_id)

    if (updateError) {
      console.error('Error updating retry count:', updateError)
      return new Response('Failed to update retry count', { status: 500 })
    }

    // Re-process the event (you would implement the actual processing logic here)
    // For now, we'll just mark it as successful if retry count is less than 3
    if (event.retry_count < 2) {
      const { error: successError } = await supabase
        .from('webhook_events')
        .update({ 
          status: 'success',
          error_message: null 
        })
        .eq('id', event_id)

      if (successError) {
        console.error('Error marking event as successful:', successError)
        return new Response('Failed to update event status', { status: 500 })
      }
    }

    return new Response('Event retry initiated', { status: 200 })
  } catch (error) {
    console.error('Retry webhook error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})