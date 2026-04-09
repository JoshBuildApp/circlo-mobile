
-- Add rich profile fields to coach_profiles
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS tagline text DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS session_duration integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS achievements text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS intro_video_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_sessions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time text DEFAULT 'Under 1 hour';

-- Add duration to coach_videos
ALTER TABLE public.coach_videos
  ADD COLUMN IF NOT EXISTS duration integer DEFAULT NULL;

-- Add user_name to reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS user_name text DEFAULT 'Anonymous';
