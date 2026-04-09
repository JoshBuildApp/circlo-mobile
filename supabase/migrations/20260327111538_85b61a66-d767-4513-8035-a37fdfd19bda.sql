
-- Add age and interests columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- Add 'coach' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coach';

-- Create user_follows table
CREATE TABLE public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coach_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, coach_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows"
  ON public.user_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follows"
  ON public.user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows"
  ON public.user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coach_id text NOT NULL,
  coach_name text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  time_label text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  price integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user to store age and interests from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  IF NEW.email = 'admin@circlo.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;
