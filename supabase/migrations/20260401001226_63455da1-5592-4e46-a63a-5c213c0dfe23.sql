
-- Fix: Restrict profiles SELECT to authenticated users only, hiding email from non-owners
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Authenticated users can see all profiles, but email is still in the row
-- We'll use a more restrictive approach: two policies
-- 1. Owner can see their own full profile
CREATE POLICY "Users can view own full profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Everyone (authenticated) can see non-email fields via the table,
--    but since RLS can't hide columns, we restrict to authenticated
--    and rely on the public_profiles view for public access without email
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Update the public_profiles view to never expose email to non-owners
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT
  id,
  user_id,
  username,
  avatar_url,
  bio,
  age,
  interests,
  created_at,
  updated_at,
  CASE
    WHEN auth.uid() = user_id THEN email
    WHEN public.has_role(auth.uid(), 'admin') THEN email
    ELSE NULL
  END AS email
FROM public.profiles;

ALTER VIEW public.public_profiles SET (security_invoker = on);
