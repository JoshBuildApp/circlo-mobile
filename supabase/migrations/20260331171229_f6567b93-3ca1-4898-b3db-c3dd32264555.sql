
-- Training Templates table
CREATE TABLE public.training_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  duration_minutes integer DEFAULT 60,
  price integer DEFAULT 50,
  location text DEFAULT '',
  max_participants integer NOT NULL DEFAULT 1,
  training_type text NOT NULL DEFAULT 'personal',
  notes text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view templates
CREATE POLICY "Training templates viewable by everyone"
  ON public.training_templates FOR SELECT
  TO public USING (true);

-- Coaches can manage their own templates
CREATE POLICY "Coaches can insert their own templates"
  ON public.training_templates FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM coach_profiles WHERE coach_profiles.id = training_templates.coach_id AND coach_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Coaches can update their own templates"
  ON public.training_templates FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_profiles WHERE coach_profiles.id = training_templates.coach_id AND coach_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Coaches can delete their own templates"
  ON public.training_templates FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_profiles WHERE coach_profiles.id = training_templates.coach_id AND coach_profiles.user_id = auth.uid()
  ));

-- Add template_id to training_sessions
ALTER TABLE public.training_sessions ADD COLUMN template_id uuid REFERENCES public.training_templates(id) ON DELETE SET NULL;

-- Add location to training_sessions
ALTER TABLE public.training_sessions ADD COLUMN location text DEFAULT '';

-- Updated at trigger for training_templates
CREATE TRIGGER update_training_templates_updated_at
  BEFORE UPDATE ON public.training_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create default templates for new coach profiles
CREATE OR REPLACE FUNCTION public.create_default_training_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.training_templates (coach_id, title, description, max_participants, training_type, price)
  VALUES
    (NEW.id, '1 on 1 Training', 'Personal one-on-one training session', 1, 'personal', COALESCE(NEW.price, 50)),
    (NEW.id, 'Group Training', 'Group training session for multiple participants', 10, 'group', COALESCE(NEW.price, 50));
  RETURN NEW;
END;
$$;

-- Trigger on coach_profiles insert
CREATE TRIGGER create_default_templates_trigger
  AFTER INSERT ON public.coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_training_templates();
