import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type ScheduleType = "weekly" | "custom" | "recurring" | "specific";

export interface AvailabilitySlot {
  id: string
  coach_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  is_available: boolean
  schedule_type: ScheduleType
  specific_date: string | null
  max_participants: number
  allowed_training_types: string[]
  auto_approve: boolean
  template_id: string | null
  created_at: string
}

export const useAvailability = (coachId?: string) => {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const fetchAvailability = async () => {
    if (!coachId) {
      setLoading(false)
      return
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('availability')
        .select('*')
        .eq('coach_id', coachId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

      if (fetchError) throw fetchError

      setAvailability((data || []).map((d: any) => ({
        ...d,
        is_available: d.is_active ?? true,
      })))
    } catch (err) {
      console.error('Error fetching availability:', err)
      setError('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
  }, [coachId])

  const updateAvailability = async (slots: Partial<AvailabilitySlot>[]) => {
    if (!coachId) return { success: false, error: 'No coach ID' }
    try {
      const { error: updateError } = await supabase
        .from('availability')
        .upsert(
          slots.map(slot => ({
            ...slot,
            coach_id: coachId,
          })) as any
        )
      if (updateError) throw updateError
      await fetchAvailability()
      return { success: true }
    } catch (err) {
      console.error('Error updating availability:', err)
      setError('Failed to update availability')
      return { success: false, error: 'Failed to update availability' }
    }
  }

  return {
    availability,
    slots: availability,
    loading,
    error,
    updateAvailability,
    refresh: fetchAvailability,
  }
}

/* ── Blocked slots ── */
export const useBlockedSlots = (coachId?: string) => {
  const [blocked, setBlocked] = useState<{ date: string; time: string }[]>([])
  useEffect(() => {
    if (!coachId) return
    supabase
      .from('blocked_slots')
      .select('date, time')
      .eq('coach_id', coachId)
      .then(({ data }) => setBlocked(data || []))
  }, [coachId])
  return { blocked }
}

/* ── Booked slots ── */
export const useBookedSlots = (coachId?: string) => {
  const [bookedMap, setBookedMap] = useState<Record<string, string[]>>({})
  useEffect(() => {
    if (!coachId) return
    supabase
      .from('bookings')
      .select('date, time')
      .eq('coach_id', coachId)
      .in('status', ['confirmed', 'upcoming', 'pending'])
      .then(({ data }) => {
        const map: Record<string, string[]> = {}
        for (const b of data || []) {
          if (!map[b.date]) map[b.date] = []
          map[b.date].push(b.time)
        }
        setBookedMap(map)
      })
  }, [coachId])
  return { bookedMap }
}

/* ── Helper: convert "HH:MM" to minutes since midnight ── */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/* ── Utility: generate time slots for a date from availability ── */
export function getSlotsForDateFromAvailability(
  availability: AvailabilitySlot[],
  date: Date,
  bookedTimes: string[],
  blocked: { date: string; time: string }[],
  bufferMinutes: number = 0,
) {
  const dayOfWeek = date.getDay()
  const dateStr = date.toISOString().split('T')[0]
  const blockedTimes = blocked
    .filter(b => b.date === dateStr)
    .map(b => b.time)

  const matchingSlots = availability.filter(
    s => s.is_active !== false && s.day_of_week === dayOfWeek
  )

  const slots: { time: string; label: string }[] = []
  for (const slot of matchingSlots) {
    const [startH] = slot.start_time.split(':').map(Number)
    const [endH] = slot.end_time.split(':').map(Number)
    for (let h = startH; h < endH; h++) {
      const time = `${h.toString().padStart(2, '0')}:00`
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayH = h % 12 || 12
      const label = `${displayH}:00 ${ampm}`
      if (!blockedTimes.includes(time)) {
        slots.push({ time, label })
      }
    }
  }

  // Mark booked slots AND slots within the buffer window as unavailable
  const bookedSlots = bookedTimes.filter(t => slots.some(s => s.time === t))

  if (bufferMinutes > 0) {
    const bookedMinutes = bookedTimes.map(timeToMinutes)
    const bufferedSlots = slots
      .filter(s => {
        if (bookedSlots.includes(s.time)) return false
        const slotMin = timeToMinutes(s.time)
        // Check if this slot falls within the buffer of any booked slot
        // Each booked slot occupies 1 hour, so buffer extends from
        // (bookedStart - buffer) to (bookedEnd + buffer)
        return bookedMinutes.some(bookedMin => {
          const bookedEnd = bookedMin + 60 // 1-hour sessions
          const tooCloseAfter = slotMin >= bookedEnd && slotMin < bookedEnd + bufferMinutes
          const tooCloseBefore = (slotMin + 60) > bookedMin - bufferMinutes && (slotMin + 60) <= bookedMin
          return tooCloseAfter || tooCloseBefore
        })
      })
      .map(s => s.time)
    bookedSlots.push(...bufferedSlots)
  }

  return { slots, bookedSlots }
}

/* ── Check if a date has availability ── */
export function isDateAvailableFromSlots(availability: AvailabilitySlot[], date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) return false
  const dayOfWeek = date.getDay()
  return availability.some(s => s.is_active !== false && s.day_of_week === dayOfWeek)
}

/* ── Find next available date+time ── */
export function getNextAvailableFromSlots(
  availability: AvailabilitySlot[],
  bookedMap: Record<string, string[]>,
  blocked: { date: string; time: string }[],
  bufferMinutes: number = 0,
): { date: Date; time: string; label: string } | null {
  const today = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const booked = bookedMap[dateStr] || []
    const { slots, bookedSlots } = getSlotsForDateFromAvailability(availability, d, booked, blocked, bufferMinutes)
    const available = slots.filter(s => !bookedSlots.includes(s.time))
    if (available.length > 0) {
      return { date: d, time: available[0].time, label: available[0].label }
    }
  }
  return null
}

export function formatHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}