-- Media assets table: centralizes all uploads (images, videos, documents)
-- Provides a single source of truth for media metadata, CDN URLs, and processing status.

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Original upload info
  url text NOT NULL,                     -- Supabase Storage URL
  cdn_url text DEFAULT NULL,             -- CDN-delivered URL (populated after processing)
  storage_path text DEFAULT NULL,        -- Supabase Storage bucket path (e.g. "avatars/abc123.jpg")

  -- File metadata
  file_name text NOT NULL,
  file_type text NOT NULL,               -- MIME type (e.g. "image/jpeg", "video/mp4")
  file_size bigint DEFAULT NULL,         -- Size in bytes
  media_category text NOT NULL DEFAULT 'image'
    CHECK (media_category IN ('image', 'video', 'document', 'audio')),

  -- Dimensions (images/videos)
  width integer DEFAULT NULL,
  height integer DEFAULT NULL,
  duration_seconds numeric DEFAULT NULL, -- For video/audio

  -- Processing & status
  status text NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'ready', 'failed', 'deleted')),

  -- Context: which entity this asset belongs to
  entity_type text DEFAULT NULL,         -- e.g. "coach_video", "profile_avatar", "coach_post", "story"
  entity_id uuid DEFAULT NULL,           -- FK to the owning record (not enforced to stay flexible)

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id
  ON public.media_assets (user_id);

CREATE INDEX IF NOT EXISTS idx_media_assets_entity
  ON public.media_assets (entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_assets_status
  ON public.media_assets (status)
  WHERE status != 'ready';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_media_assets_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_assets_updated_at();

-- RLS policies
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Users can view their own assets
CREATE POLICY "Users can view own media assets"
  ON public.media_assets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Public assets are viewable when linked to public content (status = ready)
CREATE POLICY "Anyone can view ready assets"
  ON public.media_assets
  FOR SELECT
  USING (status = 'ready');

-- Users can insert their own assets
CREATE POLICY "Users can upload own media assets"
  ON public.media_assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own assets
CREATE POLICY "Users can update own media assets"
  ON public.media_assets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete (set status = 'deleted') their own assets
CREATE POLICY "Users can delete own media assets"
  ON public.media_assets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin access via has_role
CREATE POLICY "Admins can manage all media assets"
  ON public.media_assets
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
