
-- Group pricing rules per coach
CREATE TABLE public.group_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  participant_count integer NOT NULL,
  price_per_person integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group pricing viewable by everyone" ON public.group_pricing FOR SELECT TO public USING (true);
CREATE POLICY "Coaches can manage their own pricing" ON public.group_pricing FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM coach_profiles WHERE coach_profiles.id = group_pricing.coach_id AND coach_profiles.user_id = auth.uid()));
CREATE POLICY "Coaches can update their own pricing" ON public.group_pricing FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM coach_profiles WHERE coach_profiles.id = group_pricing.coach_id AND coach_profiles.user_id = auth.uid()));
CREATE POLICY "Coaches can delete their own pricing" ON public.group_pricing FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM coach_profiles WHERE coach_profiles.id = group_pricing.coach_id AND coach_profiles.user_id = auth.uid()));

-- Booking participants for group bookings
CREATE TABLE public.booking_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  user_id uuid NOT NULL,
  payment_status text NOT NULL DEFAULT 'unpaid',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, user_id)
);

ALTER TABLE public.booking_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants viewable by booking owner and coach" ON public.booking_participants FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_participants.booking_id AND bookings.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM bookings b JOIN coach_profiles cp ON cp.id::text = b.coach_id WHERE b.id = booking_participants.booking_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Authenticated users can join" ON public.booking_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own participation" ON public.booking_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add group booking fields to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_invite_code text,
  ADD COLUMN IF NOT EXISTS total_participants integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS group_status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS training_type text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS price_per_person integer;
