ALTER TABLE public.coach_profiles 
  ADD COLUMN IF NOT EXISTS bit_link text DEFAULT '',
  ADD COLUMN IF NOT EXISTS paybox_link text DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_phone text DEFAULT '';