-- Composite indexes on hot query paths
-- bookings: coach dashboard, schedule, and session queries filter by coach_id + date
-- messages: conversation queries filter by sender+receiver, ordered by created_at

-- Bookings: coach_id + date composite (covers coach schedule lookups)
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id_date
  ON public.bookings (coach_id, date);

-- Bookings: user_id + date composite (covers user schedule/history lookups)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id_date
  ON public.bookings (user_id, date);

-- Bookings: coach_id + status composite (covers dashboard status filtering)
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id_status
  ON public.bookings (coach_id, status);

-- Messages: sender + receiver + created_at composite (covers conversation thread queries)
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created
  ON public.messages (sender_id, receiver_id, created_at DESC);

-- Messages: receiver + sender + created_at composite (covers the reverse lookup direction)
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender_created
  ON public.messages (receiver_id, sender_id, created_at DESC);
