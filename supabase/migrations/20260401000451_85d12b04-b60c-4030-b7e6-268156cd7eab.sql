
-- Create a view that conditionally exposes email
CREATE OR REPLACE VIEW public.public_profiles AS
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
