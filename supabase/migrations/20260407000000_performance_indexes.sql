-- Performance indexes for commonly queried columns
-- Fixes Supabase database health warnings

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id ON public.bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Coach videos
CREATE INDEX IF NOT EXISTS idx_coach_videos_coach_id ON public.coach_videos(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_videos_sport ON public.coach_videos(sport);
CREATE INDEX IF NOT EXISTS idx_coach_videos_created_at ON public.coach_videos(created_at DESC);

-- User follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

-- Likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_content_id ON public.likes(content_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Coach profiles
CREATE INDEX IF NOT EXISTS idx_coach_profiles_sport ON public.coach_profiles(sport);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_is_verified ON public.coach_profiles(is_verified);

-- Agent tables
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_priority ON public.agent_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_assigned_to ON public.agent_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created_at ON public.agent_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_chat_conversation_id ON public.agent_chat(conversation_id);

-- Stories
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_coach_id ON public.stories(coach_id);

-- Video watches (for smart feed algorithm)
CREATE INDEX IF NOT EXISTS idx_video_watches_user_id ON public.video_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_video_watches_video_id ON public.video_watches(video_id);

-- ANALYZE to update query planner statistics
ANALYZE;
