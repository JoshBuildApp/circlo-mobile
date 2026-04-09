import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface BookingParticipant {
  id: string
  booking_id: string
  user_id: string
  status: string
  payment_status: string
  joined_at: string
}

export const useBookingParticipants = (bookingId?: string) => {
  const [participants, setParticipants] = useState<BookingParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!bookingId) {
      setLoading(false)
      return
    }

    const fetchParticipants = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('booking_participants')
          .select('id, booking_id, user_id, payment_status, joined_at')
          .eq('booking_id', bookingId)

        if (fetchError) throw fetchError
        setParticipants((data || []).map((d: any) => ({ ...d, status: d.payment_status })))
      } catch (err) {
        console.error('Error fetching participants:', err)
        setError('Failed to load participants')
      } finally {
        setLoading(false)
      }
    }

    fetchParticipants()
  }, [bookingId])

  const addParticipant = async (userId: string) => {
    if (!bookingId) return { success: false, error: 'No booking ID' }
    try {
      const { error: insertError } = await supabase
        .from('booking_participants')
        .insert({ booking_id: bookingId, user_id: userId })
      if (insertError) throw insertError
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to add participant' }
    }
  }

  const removeParticipant = async (participantId: string) => {
    try {
      await supabase.from('booking_participants').delete().eq('id', participantId)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to remove participant' }
    }
  }

  return { participants, loading, error, addParticipant, removeParticipant }
}