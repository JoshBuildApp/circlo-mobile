INSERT INTO storage.buckets (id, name, public) VALUES ('coach-videos', 'coach-videos', true);

CREATE POLICY "Anyone can view coach videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'coach-videos');

CREATE POLICY "Authenticated users can upload coach videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'coach-videos');

CREATE POLICY "Users can delete their own coach videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'coach-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE TABLE public.coach_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id text NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  media_url text NOT NULL,
  thumbnail_url text DEFAULT NULL,
  views integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are viewable by everyone"
ON public.coach_videos FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert their own videos"
ON public.coach_videos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
ON public.coach_videos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);