
-- Add is_fake flag to main content tables
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS is_fake boolean NOT NULL DEFAULT false;
ALTER TABLE public.coach_videos ADD COLUMN IF NOT EXISTS is_fake boolean NOT NULL DEFAULT false;
ALTER TABLE public.coach_posts ADD COLUMN IF NOT EXISTS is_fake boolean NOT NULL DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_fake boolean NOT NULL DEFAULT false;

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_coach_profiles_is_fake ON public.coach_profiles (is_fake);
CREATE INDEX IF NOT EXISTS idx_coach_videos_is_fake ON public.coach_videos (is_fake);
