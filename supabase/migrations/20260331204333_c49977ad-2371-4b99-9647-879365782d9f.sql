ALTER TABLE public.availability 
  ADD COLUMN IF NOT EXISTS allowed_training_types text[] NOT NULL DEFAULT '{personal,group}'::text[],
  ADD COLUMN IF NOT EXISTS auto_approve boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_participants integer NOT NULL DEFAULT 1;