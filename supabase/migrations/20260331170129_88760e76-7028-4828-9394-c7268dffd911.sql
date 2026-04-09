
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS bit_qr_url text DEFAULT '';
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS pay_on_arrival boolean NOT NULL DEFAULT false;

INSERT INTO storage.buckets (id, name, public) VALUES ('payment-qr', 'payment-qr', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Coaches can upload QR codes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-qr');

CREATE POLICY "QR codes are publicly readable" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'payment-qr');

CREATE POLICY "Coaches can update QR codes" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'payment-qr');

CREATE POLICY "Coaches can delete QR codes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'payment-qr');
