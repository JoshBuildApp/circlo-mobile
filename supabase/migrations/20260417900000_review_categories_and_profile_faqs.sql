-- Phase 2.3.G + 2.3.I — per-category review scores, review enrichments, coach FAQs.
--
-- Additive only: every new column is NULLABLE with a safe default so legacy
-- reviews keep rendering. No RLS changes — existing policies on `reviews` and
-- `coach_profiles` continue to apply unchanged.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Per-category rating columns on `reviews`
--    Each is 1..5 inclusive, or NULL when the reviewer didn't score that
--    category. Display bars should fall back to the overall `rating` when
--    all five are NULL.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS rating_skill         smallint NULL,
  ADD COLUMN IF NOT EXISTS rating_communication smallint NULL,
  ADD COLUMN IF NOT EXISTS rating_punctuality   smallint NULL,
  ADD COLUMN IF NOT EXISTS rating_value         smallint NULL,
  ADD COLUMN IF NOT EXISTS rating_environment   smallint NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_rating_categories_range'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_rating_categories_range
      CHECK (
        (rating_skill IS NULL OR rating_skill BETWEEN 1 AND 5) AND
        (rating_communication IS NULL OR rating_communication BETWEEN 1 AND 5) AND
        (rating_punctuality IS NULL OR rating_punctuality BETWEEN 1 AND 5) AND
        (rating_value IS NULL OR rating_value BETWEEN 1 AND 5) AND
        (rating_environment IS NULL OR rating_environment BETWEEN 1 AND 5)
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Review enrichments
--    - `photos`: reviewer-uploaded photos (public URLs).
--    - `helpful_count`: denormalised counter for "Was this helpful?" taps.
--    - `coach_response` / `coach_response_at`: coach's reply, rendered
--      indented under the review.
--    - `is_verified_booking`: set by a DB trigger or the review-submit path
--      when the author has a confirmed booking with this coach. Surfaces a
--      "Verified booking" chip on the review card.
--    - `session_type`: free-text copy of the session type the review is
--      about (e.g. "1-on-1"); purely display.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS photos               text[]   NULL,
  ADD COLUMN IF NOT EXISTS helpful_count        integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coach_response       text     NULL,
  ADD COLUMN IF NOT EXISTS coach_response_at    timestamptz NULL,
  ADD COLUMN IF NOT EXISTS is_verified_booking  boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_type         text     NULL;

CREATE INDEX IF NOT EXISTS reviews_helpful_idx
  ON public.reviews (coach_id, helpful_count DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 3. "Was this helpful" tracking table
--    One row per (user, review). `review_helpful_votes_unique` prevents
--    double-voting. A small trigger keeps `reviews.helpful_count` in sync.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS review_helpful_votes_user_idx
  ON public.review_helpful_votes (user_id);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_helpful_votes'
      AND policyname = 'review_helpful_votes_read_all'
  ) THEN
    CREATE POLICY review_helpful_votes_read_all
      ON public.review_helpful_votes
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_helpful_votes'
      AND policyname = 'review_helpful_votes_insert_own'
  ) THEN
    CREATE POLICY review_helpful_votes_insert_own
      ON public.review_helpful_votes
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_helpful_votes'
      AND policyname = 'review_helpful_votes_delete_own'
  ) THEN
    CREATE POLICY review_helpful_votes_delete_own
      ON public.review_helpful_votes
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger keeping reviews.helpful_count = COUNT(review_helpful_votes).
CREATE OR REPLACE FUNCTION public.bump_review_helpful_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.reviews
      SET helpful_count = helpful_count + 1
      WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.reviews
      SET helpful_count = GREATEST(helpful_count - 1, 0)
      WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS review_helpful_count_sync ON public.review_helpful_votes;
CREATE TRIGGER review_helpful_count_sync
  AFTER INSERT OR DELETE ON public.review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_review_helpful_count();

-- ─────────────────────────────────────────────────────────────────────
-- 4. Coach FAQs (Phase 2.3.I)
--    Stored as JSONB on coach_profiles so we don't need a separate table.
--    Shape: [{ "question": "...", "answer": "..." }, ...].
--    Defaults to an empty array; consumers render only when length > 0.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.coach_profiles.faqs
  IS 'Array of { question: text, answer: text } rendered as an expandable FAQ list on the public coach profile.';

COMMIT;
