
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ELSIF lower(NEW.email) = 'admin@circlo.com' OR lower(NEW.email) = 'admin@admin.com' THEN
    selected_role := 'admin';
  ELSIF NEW.raw_user_meta_data->>'role' = 'coach' THEN
    selected_role := 'coach';
  ELSE
    selected_role := 'user';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, selected_role);

  RETURN NEW;
END;
$function$;
