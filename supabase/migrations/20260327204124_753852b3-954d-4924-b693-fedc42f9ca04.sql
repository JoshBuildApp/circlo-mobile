-- Create coach_profiles table for coach-specific data
CREATE TABLE public.coach_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  coach_name text NOT NULL,
  sport text NOT NULL,
  bio text DEFAULT '',
  image_url text DEFAULT NULL,
  location text DEFAULT '',
  price integer DEFAULT 50,
  rating numeric(2,1) DEFAULT 5.0,
  followers integer DEFAULT 0,
  years_experience integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach profiles are viewable by everyone"
ON public.coach_profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert their own coach profile"
ON public.coach_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coach profile"
ON public.coach_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update handle_new_user to support role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  selected_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, username, email, age, interests)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    (NEW.raw_user_meta_data->>'age')::integer,
    CASE
      WHEN NEW.raw_user_meta_data->'interests' IS NOT NULL
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interests'))
      ELSE '{}'::text[]
    END
  );

  -- Determine role
  IF NEW.email = 'admin@circlo.com' THEN
    selected_role := 'admin';
  ELSIF NEW.raw_user_meta_data->>'role' = 'coach' THEN
    selected_role := 'coach';
  ELSE
    selected_role := 'user';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, selected_role);

  RETURN NEW;
END;
$$;