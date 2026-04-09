-- Enable pg_trgm extension for fuzzy / trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes on coach_profiles for full-text search
CREATE INDEX IF NOT EXISTS idx_coach_profiles_coach_name_trgm
  ON public.coach_profiles USING gin (coach_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_coach_profiles_sport_trgm
  ON public.coach_profiles USING gin (sport gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_coach_profiles_bio_trgm
  ON public.coach_profiles USING gin (bio gin_trgm_ops);

-- RPC function for trigram coach search
-- Returns coaches matching a search term across name, sport, and bio
-- ranked by similarity score
CREATE OR REPLACE FUNCTION public.search_coaches(search_term text)
RETURNS TABLE (
  id uuid,
  coach_name text,
  sport text,
  bio text,
  image_url text,
  price integer,
  specialties text[],
  rating numeric,
  location text,
  tagline text,
  is_verified boolean,
  is_pro boolean,
  is_boosted boolean,
  followers integer,
  is_fake boolean,
  similarity_score real
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cp.id,
    cp.coach_name,
    cp.sport,
    cp.bio,
    cp.image_url,
    cp.price,
    cp.specialties,
    cp.rating,
    cp.location,
    cp.tagline,
    cp.is_verified,
    cp.is_pro,
    cp.is_boosted,
    cp.followers,
    cp.is_fake,
    GREATEST(
      similarity(cp.coach_name, search_term),
      similarity(cp.sport, search_term),
      similarity(COALESCE(cp.bio, ''), search_term)
    ) AS similarity_score
  FROM public.coach_profiles cp
  WHERE
    cp.coach_name % search_term
    OR cp.sport % search_term
    OR COALESCE(cp.bio, '') % search_term
  ORDER BY similarity_score DESC;
$$;
