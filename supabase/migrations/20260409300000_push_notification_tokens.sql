-- Push notification tokens table
-- Stores device tokens for push notification delivery (FCM, APNs, Expo)
-- Security: RLS ensures users can only manage their own tokens

CREATE TABLE public.push_notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- RLS: mandatory
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tokens
CREATE POLICY "Users can view own push tokens"
  ON public.push_notification_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only register tokens for themselves
CREATE POLICY "Users can insert own push tokens"
  ON public.push_notification_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tokens (e.g. deactivate)
CREATE POLICY "Users can update own push tokens"
  ON public.push_notification_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own tokens (e.g. logout/unregister)
CREATE POLICY "Users can delete own push tokens"
  ON public.push_notification_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (SECURITY DEFINER functions) can query all tokens for delivery
-- This is handled by service_role key in edge functions, which bypasses RLS

-- Indexes for efficient lookups
CREATE INDEX idx_push_tokens_user_id ON public.push_notification_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON public.push_notification_tokens(user_id, is_active) WHERE is_active = true;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_push_token_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_token_updated_at
  BEFORE UPDATE ON public.push_notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_token_timestamp();
