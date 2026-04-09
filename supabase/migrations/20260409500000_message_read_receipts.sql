-- Add read_at timestamp and message_type to messages table
-- read_at replaces the boolean is_read with a precise timestamp
-- message_type enables text, image, and voice message support

ALTER TABLE public.messages
  ADD COLUMN read_at timestamptz DEFAULT NULL,
  ADD COLUMN message_type text NOT NULL DEFAULT 'text';

-- Backfill: set read_at for messages already marked as read
UPDATE public.messages
  SET read_at = created_at
  WHERE is_read = true AND read_at IS NULL;

-- Sync is_read as a generated column so existing queries still work
-- We keep is_read for backwards compatibility but it's now derived from read_at
-- (Supabase/Postgres 12+ supports generated columns)
-- NOTE: We cannot convert an existing column to generated, so we update the
-- column via a trigger instead.

CREATE OR REPLACE FUNCTION public.sync_message_is_read()
RETURNS trigger AS $$
BEGIN
  NEW.is_read := (NEW.read_at IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_message_is_read
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_message_is_read();

-- Index for efficient unread queries
CREATE INDEX idx_messages_read_at ON public.messages (receiver_id, read_at)
  WHERE read_at IS NULL;

-- Validate message_type values
ALTER TABLE public.messages
  ADD CONSTRAINT chk_message_type
  CHECK (message_type IN ('text', 'image', 'voice'));
