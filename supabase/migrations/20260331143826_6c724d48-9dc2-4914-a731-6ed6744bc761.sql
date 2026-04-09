
-- Function to count followers for a coach (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_follower_count(coach_id_input text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.user_follows WHERE coach_id = coach_id_input;
$$;

-- Function to get followers list for a coach (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_followers(coach_id_input text)
RETURNS TABLE(user_id uuid, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uf.user_id, uf.created_at FROM public.user_follows uf WHERE uf.coach_id = coach_id_input ORDER BY uf.created_at DESC;
$$;

-- Function to get following list for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_following(user_id_input uuid)
RETURNS TABLE(coach_id text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uf.coach_id, uf.created_at FROM public.user_follows uf WHERE uf.user_id = user_id_input ORDER BY uf.created_at DESC;
$$;
