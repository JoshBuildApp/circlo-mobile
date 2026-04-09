-- Add buffer_minutes to coach_profiles so coaches can set
-- a gap between consecutive bookable sessions.
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.coach_profiles.buffer_minutes
  IS 'Minutes of buffer time between consecutive sessions (0 = no buffer)';
