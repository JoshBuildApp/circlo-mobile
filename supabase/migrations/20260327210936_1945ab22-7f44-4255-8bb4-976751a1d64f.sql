
-- Add comments_count to coach_videos
ALTER TABLE public.coach_videos ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid NOT NULL REFERENCES public.coach_videos(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to increment likes_count
CREATE OR REPLACE FUNCTION public.increment_likes(video_id uuid, delta integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coach_videos SET likes_count = GREATEST(0, likes_count + delta) WHERE id = video_id;
$$;

-- Function to increment comments_count
CREATE OR REPLACE FUNCTION public.increment_comments(video_id uuid, delta integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coach_videos SET comments_count = GREATEST(0, comments_count + delta) WHERE id = video_id;
$$;

-- Function to increment views
CREATE OR REPLACE FUNCTION public.increment_views(video_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coach_videos SET views = COALESCE(views, 0) + 1 WHERE id = video_id;
$$;
