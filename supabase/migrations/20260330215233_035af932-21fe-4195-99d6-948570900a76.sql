
ALTER TABLE public.coach_profiles 
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_boosted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boost_expires_at timestamp with time zone;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS platform_fee integer NOT NULL DEFAULT 0;
