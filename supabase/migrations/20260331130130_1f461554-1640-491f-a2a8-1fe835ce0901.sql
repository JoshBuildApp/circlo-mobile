
-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Profiles: fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);

-- Coach profiles: fast lookup by user_id and sport
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON public.coach_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_sport ON public.coach_profiles (sport);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_is_verified ON public.coach_profiles (is_verified);

-- Coach videos: fast queries for feeds and coach pages
CREATE INDEX IF NOT EXISTS idx_coach_videos_coach_id ON public.coach_videos (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_videos_user_id ON public.coach_videos (user_id);
CREATE INDEX IF NOT EXISTS idx_coach_videos_created_at ON public.coach_videos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_videos_category ON public.coach_videos (category);
CREATE INDEX IF NOT EXISTS idx_coach_videos_likes ON public.coach_videos (likes_count DESC);

-- Likes: fast lookup for user+content and count queries
CREATE INDEX IF NOT EXISTS idx_likes_user_content ON public.likes (user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_likes_content_id ON public.likes (content_id);

-- Comments: fast lookup by content
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON public.comments (content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments (user_id);

-- User follows: fast lookup
CREATE INDEX IF NOT EXISTS idx_user_follows_user_id ON public.user_follows (user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_coach_id ON public.user_follows (coach_id);

-- Bookings: fast queries for coach and user
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id ON public.bookings (coach_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings (date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);

-- Messages: fast inbox queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);

-- Reviews: fast coach review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_coach_id ON public.reviews (coach_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);

-- Stories: filter expired stories
CREATE INDEX IF NOT EXISTS idx_stories_coach_id ON public.stories (coach_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories (expires_at);

-- Saved items: user lookups
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON public.saved_items (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_content_id ON public.saved_items (content_id);

-- Availability: coach schedule
CREATE INDEX IF NOT EXISTS idx_availability_coach_id ON public.availability (coach_id);

-- Blocked slots
CREATE INDEX IF NOT EXISTS idx_blocked_slots_coach_id ON public.blocked_slots (coach_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON public.blocked_slots (date);

-- Community members
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members (user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_coach_id ON public.community_members (coach_id);

-- Coach posts
CREATE INDEX IF NOT EXISTS idx_coach_posts_coach_id ON public.coach_posts (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_posts_user_id ON public.coach_posts (user_id);

-- Video watches
CREATE INDEX IF NOT EXISTS idx_video_watches_user_id ON public.video_watches (user_id);
CREATE INDEX IF NOT EXISTS idx_video_watches_video_id ON public.video_watches (video_id);

-- Trending content
CREATE INDEX IF NOT EXISTS idx_trending_content_score ON public.trending_content (score DESC);

-- Page sections
CREATE INDEX IF NOT EXISTS idx_page_sections_coach_id ON public.page_sections (coach_id);

-- User roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

-- Challenge participants
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON public.challenge_participants (challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants (user_id);

-- Verification requests
CREATE INDEX IF NOT EXISTS idx_verification_requests_coach_id ON public.verification_requests (coach_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests (status);

-- ============================================
-- UNIQUE CONSTRAINTS (prevent duplicate data)
-- ============================================

-- Prevent duplicate likes (same user + content)
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique_user_content ON public.likes (user_id, content_id);

-- Prevent duplicate follows
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_follows_unique ON public.user_follows (user_id, coach_id);

-- Prevent duplicate saved items
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_items_unique ON public.saved_items (user_id, content_id, collection_name);

-- Prevent duplicate community membership
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_members_unique ON public.community_members (user_id, coach_id);

-- One profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_user ON public.profiles (user_id);

-- One coach profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_profiles_unique_user ON public.coach_profiles (user_id);

-- ============================================
-- NOT NULL CONSTRAINTS (data integrity)
-- ============================================

-- Ensure critical fields are not null
ALTER TABLE public.bookings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN coach_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN date SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN price SET NOT NULL;

ALTER TABLE public.coach_videos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.coach_videos ALTER COLUMN coach_id SET NOT NULL;
ALTER TABLE public.coach_videos ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.coach_videos ALTER COLUMN media_url SET NOT NULL;

ALTER TABLE public.messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN receiver_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN content SET NOT NULL;

ALTER TABLE public.reviews ALTER COLUMN coach_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN rating SET NOT NULL;

-- ============================================
-- ADD updated_at trigger to tables missing it
-- ============================================

-- Profiles already have updated_at, add trigger
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Coach profiles trigger
CREATE OR REPLACE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Page sections trigger
CREATE OR REPLACE TRIGGER update_page_sections_updated_at
  BEFORE UPDATE ON public.page_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RATING CONSTRAINT
-- ============================================
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_range;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_range CHECK (rating >= 1 AND rating <= 5);
