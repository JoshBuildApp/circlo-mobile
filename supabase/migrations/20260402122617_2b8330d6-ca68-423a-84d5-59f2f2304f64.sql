
-- Add user_id to stories
ALTER TABLE public.stories ADD COLUMN user_id uuid;

-- Make coach_id nullable for user stories
ALTER TABLE public.stories ALTER COLUMN coach_id DROP NOT NULL;

-- Drop old coach-only RLS policies
DROP POLICY IF EXISTS "Coaches can insert stories" ON public.stories;
DROP POLICY IF EXISTS "Coaches can delete their stories" ON public.stories;

-- Any authenticated user can insert their own story
CREATE POLICY "Users can insert their own stories"
ON public.stories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Any authenticated user can delete their own story
CREATE POLICY "Users can delete their own stories"
ON public.stories FOR DELETE TO authenticated
USING (auth.uid() = user_id);
