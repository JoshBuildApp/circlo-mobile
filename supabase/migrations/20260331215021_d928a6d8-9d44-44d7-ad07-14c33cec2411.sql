ALTER TABLE public.coach_profiles 
  ADD COLUMN IF NOT EXISTS training_style text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ideal_for text DEFAULT '';