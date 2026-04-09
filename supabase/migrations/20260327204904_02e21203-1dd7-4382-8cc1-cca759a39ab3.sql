
-- Add missing columns to coach_profiles
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_media text DEFAULT NULL;

-- Add missing columns to coach_videos (likes_count, media_type)
ALTER TABLE public.coach_videos
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'video';

-- Create likes table
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid NOT NULL REFERENCES public.coach_videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create availability table
CREATE TABLE public.availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is viewable by everyone" ON public.availability FOR SELECT TO public USING (true);
CREATE POLICY "Coaches can manage their own availability" ON public.availability FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = coach_id AND user_id = auth.uid())
);
CREATE POLICY "Coaches can update their own availability" ON public.availability FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = coach_id AND user_id = auth.uid())
);
CREATE POLICY "Coaches can delete their own availability" ON public.availability FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = coach_id AND user_id = auth.uid())
);

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, coach_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create verification_requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  experience_text text NOT NULL DEFAULT '',
  documents_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own requests" ON public.verification_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = coach_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all requests" ON public.verification_requests FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Coaches can insert their own requests" ON public.verification_requests FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = coach_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can update requests" ON public.verification_requests FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
);
