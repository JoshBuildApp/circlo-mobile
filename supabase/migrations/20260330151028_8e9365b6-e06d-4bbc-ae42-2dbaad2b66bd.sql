
CREATE TABLE public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  section_type text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  layout_size text NOT NULL DEFAULT 'full',
  is_visible boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page sections viewable by everyone"
  ON public.page_sections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Coaches can manage their own sections"
  ON public.page_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coach_profiles
      WHERE coach_profiles.id = page_sections.coach_id
        AND coach_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update their own sections"
  ON public.page_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles
      WHERE coach_profiles.id = page_sections.coach_id
        AND coach_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete their own sections"
  ON public.page_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles
      WHERE coach_profiles.id = page_sections.coach_id
        AND coach_profiles.user_id = auth.uid()
    )
  );
