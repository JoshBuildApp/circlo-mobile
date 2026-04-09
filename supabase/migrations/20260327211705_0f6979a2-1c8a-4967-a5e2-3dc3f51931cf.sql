
-- Add is_featured and category to coach_videos
ALTER TABLE public.coach_videos ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.coach_videos ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'training';

-- Add is_top_creator to coach_profiles
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS is_top_creator boolean NOT NULL DEFAULT false;
