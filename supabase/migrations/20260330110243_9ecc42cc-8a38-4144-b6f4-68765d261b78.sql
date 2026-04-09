
-- Messages table for inbox/chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages (sent or received)
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read
CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- Index for fast conversation lookups
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id, created_at DESC);
