
-- Trainee progress table
CREATE TABLE public.trainee_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_sessions integer NOT NULL DEFAULT 0,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak_days integer NOT NULL DEFAULT 0,
  last_training_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trainee_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON public.trainee_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view progress (public profiles)"
ON public.trainee_progress FOR SELECT TO authenticated
USING (true);

CREATE POLICY "System can insert progress"
ON public.trainee_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_trainee_progress_updated_at
BEFORE UPDATE ON public.trainee_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Badges catalog
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🏅',
  requirement_type text NOT NULL DEFAULT 'sessions',
  requirement_value integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges viewable by everyone"
ON public.badges FOR SELECT TO public
USING (true);

-- Seed default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('First Training', 'Completed your first training session', '🎯', 'sessions', 1),
  ('Getting Started', 'Completed 3 training sessions', '💪', 'sessions', 3),
  ('Dedicated', 'Completed 5 training sessions', '⭐', 'sessions', 5),
  ('Committed', 'Completed 10 training sessions', '🔥', 'sessions', 10),
  ('Elite Trainee', 'Completed 25 training sessions', '🏆', 'sessions', 25),
  ('Legend', 'Completed 50 training sessions', '👑', 'sessions', 50),
  ('On Fire', '3-day training streak', '🔥', 'streak', 3),
  ('Consistency King', '7-day training streak', '👊', 'streak', 7),
  ('Unstoppable', '14-day training streak', '⚡', 'streak', 14),
  ('Marathon', '30-day training streak', '🏅', 'streak', 30),
  ('Rising Star', 'Reached 500 XP', '🌟', 'xp', 500),
  ('Pro Player', 'Reached 2000 XP', '💎', 'xp', 2000),
  ('Champion', 'Reached 5000 XP', '🏆', 'xp', 5000);

-- User badges (earned)
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all earned badges"
ON public.user_badges FOR SELECT TO authenticated
USING (true);

CREATE POLICY "System can insert badges"
ON public.user_badges FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Award XP function (called when booking completed)
CREATE OR REPLACE FUNCTION public.award_training_xp(
  _user_id uuid,
  _xp_amount integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _progress trainee_progress%ROWTYPE;
  _new_xp integer;
  _new_level integer;
  _old_level integer;
  _new_sessions integer;
  _new_streak integer;
  _today date := current_date;
  _leveled_up boolean := false;
  _new_badges jsonb := '[]'::jsonb;
  _badge record;
BEGIN
  -- Upsert progress row
  INSERT INTO trainee_progress (user_id, total_sessions, xp, level, streak_days, last_training_date)
  VALUES (_user_id, 0, 0, 1, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _progress FROM trainee_progress WHERE user_id = _user_id FOR UPDATE;

  _new_sessions := _progress.total_sessions + 1;
  _new_xp := _progress.xp + _xp_amount;
  _old_level := _progress.level;
  _new_level := GREATEST(1, floor(_new_xp / 500.0)::integer + 1);

  -- Streak logic
  IF _progress.last_training_date = _today THEN
    _new_streak := _progress.streak_days; -- same day, no change
  ELSIF _progress.last_training_date = _today - 1 THEN
    _new_streak := _progress.streak_days + 1; -- consecutive
  ELSE
    _new_streak := 1; -- reset
  END IF;

  UPDATE trainee_progress SET
    total_sessions = _new_sessions,
    xp = _new_xp,
    level = _new_level,
    streak_days = _new_streak,
    last_training_date = _today
  WHERE user_id = _user_id;

  _leveled_up := _new_level > _old_level;

  -- Check and award badges
  FOR _badge IN
    SELECT b.id, b.name FROM badges b
    WHERE b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = _user_id)
    AND (
      (b.requirement_type = 'sessions' AND _new_sessions >= b.requirement_value) OR
      (b.requirement_type = 'streak' AND _new_streak >= b.requirement_value) OR
      (b.requirement_type = 'xp' AND _new_xp >= b.requirement_value)
    )
  LOOP
    INSERT INTO user_badges (user_id, badge_id) VALUES (_user_id, _badge.id);
    _new_badges := _new_badges || jsonb_build_object('name', _badge.name);
    -- Notify
    PERFORM create_notification(_user_id, 'badge', 'Badge Unlocked! 🏅', 'You earned: ' || _badge.name);
  END LOOP;

  -- Level up notification
  IF _leveled_up THEN
    PERFORM create_notification(_user_id, 'level_up', 'Level Up! 🎉', 'You reached Level ' || _new_level || '!');
  END IF;

  RETURN jsonb_build_object(
    'xp', _new_xp,
    'level', _new_level,
    'sessions', _new_sessions,
    'streak', _new_streak,
    'leveled_up', _leveled_up,
    'new_badges', _new_badges
  );
END;
$$;

-- Index for fast lookups
CREATE INDEX idx_trainee_progress_user ON public.trainee_progress(user_id);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
