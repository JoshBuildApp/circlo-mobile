
-- Add 'developer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- Update handle_new_user to assign 'developer' role for the developer email
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
  IF lower(NEW.email) = 'devuser@developer.com' THEN
    selected_role := 'developer';
  ELSIF NEW.email = 'admin@circlo.com' THEN
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

-- Create assign_admin function - only developer can call it
CREATE OR REPLACE FUNCTION public.assign_admin(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only developer role can assign admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can assign admin roles';
  END IF;

  -- Update existing role or insert
  UPDATE public.user_roles SET role = 'admin' WHERE user_id = _target_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, 'admin');
  END IF;
END;
$$;

-- Grant execute to authenticated users (RLS in the function body handles authorization)
GRANT EXECUTE ON FUNCTION public.assign_admin(uuid) TO authenticated;
