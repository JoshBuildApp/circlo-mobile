
-- Create products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ILS',
  image_url text,
  category text DEFAULT '',
  stock integer DEFAULT -1,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT
USING (true);

-- Coaches can insert their own products
CREATE POLICY "Coaches can insert their own products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = products.coach_id AND user_id = auth.uid())
);

-- Coaches can update their own products
CREATE POLICY "Coaches can update their own products"
ON public.products FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = products.coach_id AND user_id = auth.uid())
);

-- Coaches can delete their own products
CREATE POLICY "Coaches can delete their own products"
ON public.products FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = products.coach_id AND user_id = auth.uid())
);

-- Admins can delete any product
CREATE POLICY "Admins can delete any product"
ON public.products FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer')
);

-- Timestamp trigger
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Coaches can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Coaches can delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
