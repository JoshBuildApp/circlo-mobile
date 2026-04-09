
-- 1. coach_posts (mini community per coach)
CREATE TABLE public.coach_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coach_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach posts viewable by everyone" ON public.coach_posts FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own posts" ON public.coach_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.coach_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges viewable by everyone" ON public.challenges FOR SELECT TO public USING (true);
CREATE POLICY "Coaches can insert challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM coach_profiles WHERE coach_profiles.id::text = challenges.coach_id AND coach_profiles.user_id = auth.uid())
);
CREATE POLICY "Coaches can delete their challenges" ON public.challenges FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM coach_profiles WHERE coach_profiles.id::text = challenges.coach_id AND coach_profiles.user_id = auth.uid())
);

-- 3. challenge_participants
CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants viewable by everyone" ON public.challenge_participants FOR SELECT TO public USING (true);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.challenge_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave challenges" ON public.challenge_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. trending_content (score-based)
CREATE TABLE public.trending_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trending_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trending viewable by everyone" ON public.trending_content FOR SELECT TO public USING (true);

-- 5. highlights
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id TEXT NOT NULL,
  title TEXT NOT NULL,
  media_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Highlights viewable by everyone" ON public.highlights FOR SELECT TO public USING (true);
CREATE POLICY "Coaches can insert highlights" ON public.highlights FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM coach_profiles WHERE coach_profiles.id::text = highlights.coach_id AND coach_profiles.user_id = auth.uid())
);

-- 6. saved_items
CREATE TABLE public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  collection_name TEXT NOT NULL DEFAULT 'Saved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id, collection_name)
);
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own saved items" ON public.saved_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save items" ON public.saved_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave items" ON public.saved_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. stories (24h expiry)
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id TEXT NOT NULL,
  media_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stories viewable by everyone" ON public.stories FOR SELECT TO public USING (true);
CREATE POLICY "Coaches can insert stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM coach_profiles WHERE coach_profiles.id::text = stories.coach_id AND coach_profiles.user_id = auth.uid())
);
CREATE POLICY "Coaches can delete their stories" ON public.stories FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM coach_profiles WHERE coach_profiles.id::text = stories.coach_id AND coach_profiles.user_id = auth.uid())
);
