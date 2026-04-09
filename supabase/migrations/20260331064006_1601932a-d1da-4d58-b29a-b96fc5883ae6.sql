
-- Track watch time and interactions for feed algorithm
CREATE TABLE public.video_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL,
  watch_seconds real NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast user-based queries
CREATE INDEX idx_video_watches_user ON public.video_watches (user_id, created_at DESC);
CREATE INDEX idx_video_watches_video ON public.video_watches (video_id);

ALTER TABLE public.video_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own watches"
ON public.video_watches FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own watches"
ON public.video_watches FOR SELECT TO authenticated
USING (auth.uid() = user_id);
