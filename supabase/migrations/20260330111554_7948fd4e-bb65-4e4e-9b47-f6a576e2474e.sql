
-- Extend verification_requests with more fields
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS coach_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sport text DEFAULT '',
  ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certifications_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS links text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT '',
  ADD COLUMN IF NOT EXISTS admin_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS coach_image_url text DEFAULT '';

-- Create verification-docs storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT DO NOTHING;

-- RLS for verification-docs bucket
CREATE POLICY "Coaches can upload verification docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Coaches can view own verification docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all verification docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verification-docs' AND public.has_role(auth.uid(), 'admin'));
