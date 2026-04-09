import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AvailabilitySlot {
  id: string;
  coach_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  schedule_type: string;
  specific_date: string | null;
  max_participants: number;
  allowed_training_types: string[];
  auto_approve: boolean;
  template_id: string | null;
  created_at: string;
}

export interface BookingConflict {
  slot_id: string;
  booking_id: string;
  start_time: string;
  end_time: string;
  conflict_type: 'double_booking' | 'slot_unavailable';
}

export interface SmartAvailabilityState {
  slots: AvailabilitySlot[];
  conflicts: BookingConflict[];
  loading: boolean;
  syncing: boolean;
}

export const useSmartAvailabilitySync = (coachId?: string) => {
  const [state, setState] = useState<SmartAvailabilityState>({
    slots: [],
    conflicts: [],
    loading: true,
    syncing: false
  });

  const fetchAvailabilitySlots = useCallback(async () => {
    if (!coachId) return;
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('coach_id', coachId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setState(prev => ({
        ...prev,
        slots: (data || []) as unknown as AvailabilitySlot[],
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching availability slots:', error);
      toast.error("Failed to load availability slots");
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [coachId]);

  const blockSlotForBooking = useCallback(async (slotId: string, bookingId: string) => {
    try {
      setState(prev => ({ ...prev, syncing: true }));
      const { error } = await supabase
        .from('availability')
        .update({ is_active: false } as any)
        .eq('id', slotId);

      if (error) throw error;
      setState(prev => ({
        ...prev,
        slots: prev.slots.map(slot =>
          slot.id === slotId ? { ...slot, is_active: false } : slot
        ),
        syncing: false
      }));
      return true;
    } catch (error) {
      console.error('Error blocking slot:', error);
      setState(prev => ({ ...prev, syncing: false }));
      toast.error("Failed to block availability slot");
      return false;
    }
  }, []);

  const releaseSlotFromBooking = useCallback(async (slotId: string, _bookingId: string) => {
    try {
      setState(prev => ({ ...prev, syncing: true }));
      const { error } = await supabase
        .from('availability')
        .update({ is_active: true } as any)
        .eq('id', slotId);

      if (error) throw error;
      setState(prev => ({
        ...prev,
        slots: prev.slots.map(slot =>
          slot.id === slotId ? { ...slot, is_active: true } : slot
        ),
        syncing: false
      }));
      toast.success("Time slot released and available for booking");
      return true;
    } catch (error) {
      console.error('Error releasing slot:', error);
      setState(prev => ({ ...prev, syncing: false }));
      toast.error("Failed to release availability slot");
      return false;
    }
  }, []);

  const checkTimeConflicts = useCallback((startTime: string, endTime: string, excludeSlotId?: string) => {
    return state.slots.filter(slot => {
      if (excludeSlotId && slot.id === excludeSlotId) return false;
      if (slot.is_active) return false;
      return true;
    });
  }, [state.slots]);

  useEffect(() => {
    fetchAvailabilitySlots();
  }, [fetchAvailabilitySlots]);

  const clearConflict = useCallback((conflictIndex: number) => {
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter((_, index) => index !== conflictIndex)
    }));
  }, []);

  const refreshAvailability = useCallback(() => {
    fetchAvailabilitySlots();
  }, [fetchAvailabilitySlots]);

  return {
    ...state,
    blockSlotForBooking,
    releaseSlotFromBooking,
    checkTimeConflicts,
    clearConflict,
    refreshAvailability
  };
};
