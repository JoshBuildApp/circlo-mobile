import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export const useBookingConflictPrevention = () => {
  const [checking, setChecking] = useState(false)

  const checkForConflicts = useCallback(async (
    coachId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ) => {
    setChecking(true)
    
    try {
      let query = supabase
        .from('bookings')
        .select('id, start_time, end_time')
        .eq('coach_id', coachId)
        .neq('status', 'cancelled')
        .or(`start_time.lte.${endTime},end_time.gte.${startTime}`)

      if (excludeBookingId) {
        query = query.neq('id', excludeBookingId)
      }

      const { data: conflicts, error } = await query

      if (error) throw error

      const hasConflict = conflicts && conflicts.length > 0
      
      return {
        hasConflict,
        conflicts: conflicts || [],
        message: hasConflict 
          ? 'This time slot conflicts with existing bookings'
          : 'No conflicts found'
      }
    } catch (error) {
      console.error('Error checking booking conflicts:', error)
      return {
        hasConflict: false,
        conflicts: [],
        message: 'Error checking for conflicts'
      }
    } finally {
      setChecking(false)
    }
  }, [])

  return {
    checkForConflicts,
    checking
  }
}