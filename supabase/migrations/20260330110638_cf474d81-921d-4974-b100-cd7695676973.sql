
-- Community members table
CREATE TABLE public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coach_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, coach_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members viewable by everyone" ON public.community_members
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add is_exclusive to coach_videos
ALTER TABLE public.coach_videos ADD COLUMN IF NOT EXISTS is_exclusive boolean NOT NULL DEFAULT false;
