
-- Add is_active column to availability
ALTER TABLE public.availability ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create blocked_slots table
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  date text NOT NULL,
  time text NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, date, time)
);
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blocked slots viewable by everyone" ON public.blocked_slots FOR SELECT TO public USING (true);
CREATE POLICY "Coaches can insert their own blocked slots" ON public.blocked_slots FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = coach_id AND user_id = auth.uid())
);
CREATE POLICY "Coaches can delete their own blocked slots" ON public.blocked_slots FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = coach_id AND user_id = auth.uid())
);

-- Add policy for coaches to view their own bookings
CREATE POLICY "Coaches can view bookings for them" ON public.bookings FOR SELECT TO authenticated USING (
  coach_id::text IN (SELECT id::text FROM public.coach_profiles WHERE user_id = auth.uid())
);

-- Allow coaches to update booking status
CREATE POLICY "Coaches can update their bookings" ON public.bookings FOR UPDATE TO authenticated USING (
  coach_id::text IN (SELECT id::text FROM public.coach_profiles WHERE user_id = auth.uid())
);

-- Allow users to update their own bookings (cancel)
CREATE POLICY "Users can update their own bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
