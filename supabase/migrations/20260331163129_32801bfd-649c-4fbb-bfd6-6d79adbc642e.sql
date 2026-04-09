
-- Training sessions table
CREATE TABLE public.training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  session_type TEXT NOT NULL DEFAULT 'personal' CHECK (session_type IN ('personal', 'small_group', 'group')),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  time_label TEXT NOT NULL DEFAULT '',
  max_capacity INTEGER NOT NULL DEFAULT 1,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  price INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- Everyone can view sessions
CREATE POLICY "Training sessions viewable by everyone"
  ON public.training_sessions FOR SELECT
  TO public USING (true);

-- Coaches can insert their own sessions
CREATE POLICY "Coaches can insert their own sessions"
  ON public.training_sessions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.coach_profiles
    WHERE coach_profiles.id = training_sessions.coach_id
    AND coach_profiles.user_id = auth.uid()
  ));

-- Coaches can update their own sessions
CREATE POLICY "Coaches can update their own sessions"
  ON public.training_sessions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.coach_profiles
    WHERE coach_profiles.id = training_sessions.coach_id
    AND coach_profiles.user_id = auth.uid()
  ));

-- Coaches can delete their own sessions
CREATE POLICY "Coaches can delete their own sessions"
  ON public.training_sessions FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.coach_profiles
    WHERE coach_profiles.id = training_sessions.coach_id
    AND coach_profiles.user_id = auth.uid()
  ));

-- Add session_id to bookings table to link bookings to sessions
ALTER TABLE public.bookings ADD COLUMN session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL;

-- Function to increment booking count and auto-set status
CREATE OR REPLACE FUNCTION public.increment_session_booking(session_id_input UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.training_sessions
  SET current_bookings = current_bookings + 1,
      status = CASE 
        WHEN current_bookings + 1 >= max_capacity THEN 'full'
        ELSE 'open'
      END
  WHERE id = session_id_input AND status != 'cancelled';
END;
$$;

-- Allow authenticated users to call the function
CREATE POLICY "Anyone can update session booking counts"
  ON public.training_sessions FOR UPDATE
  TO authenticated
  USING (true);
