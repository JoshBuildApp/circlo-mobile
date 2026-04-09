-- User packages: tracks purchased bundles and remaining sessions
CREATE TABLE IF NOT EXISTS public.user_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.coach_packages(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(user_id) ON DELETE CASCADE,
  sessions_total integer NOT NULL CHECK (sessions_total > 0),
  sessions_used integer NOT NULL DEFAULT 0 CHECK (sessions_used >= 0),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'exhausted')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_packages_user_id ON public.user_packages(user_id);
CREATE INDEX idx_user_packages_coach_id ON public.user_packages(coach_id);

-- RLS
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;

-- Users can view their own packages
CREATE POLICY "Users can view own packages"
  ON public.user_packages FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches can view packages sold to their clients
CREATE POLICY "Coaches can view packages for their clients"
  ON public.user_packages FOR SELECT
  USING (auth.uid() = coach_id);

-- Insert allowed for authenticated users (buying a package)
CREATE POLICY "Authenticated users can purchase packages"
  ON public.user_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own packages (for session tracking)
CREATE POLICY "Users can update own packages"
  ON public.user_packages FOR UPDATE
  USING (auth.uid() = user_id);

-- Add package_id to bookings to link a booking to a purchased package
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.user_packages(id);
