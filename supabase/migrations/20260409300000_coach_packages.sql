-- Coach packages: bundle offerings (price, session_count, validity_days)
CREATE TABLE IF NOT EXISTS public.coach_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'ILS',
  session_count integer NOT NULL CHECK (session_count > 0),
  validity_days integer NOT NULL CHECK (validity_days > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by coach
CREATE INDEX idx_coach_packages_coach_id ON public.coach_packages(coach_id);

-- Auto-update updated_at
CREATE TRIGGER set_coach_packages_updated_at
  BEFORE UPDATE ON public.coach_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.coach_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active coach packages"
  ON public.coach_packages
  FOR SELECT
  USING (is_active = true);

-- Coaches can manage their own packages
CREATE POLICY "Coaches can insert own packages"
  ON public.coach_packages
  FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own packages"
  ON public.coach_packages
  FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own packages"
  ON public.coach_packages
  FOR DELETE
  USING (auth.uid() = coach_id);
