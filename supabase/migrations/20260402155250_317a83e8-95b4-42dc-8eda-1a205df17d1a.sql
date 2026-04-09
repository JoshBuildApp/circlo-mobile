
-- Add activity tracking fields to profiles
ALTER TABLE public.profiles
ADD COLUMN last_active_at timestamp with time zone DEFAULT now(),
ADD COLUMN show_activity_status boolean NOT NULL DEFAULT true;

-- Index for fast active user lookups
CREATE INDEX idx_profiles_last_active_at ON public.profiles (last_active_at DESC);
