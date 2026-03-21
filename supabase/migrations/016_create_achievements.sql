-- =============================================================================
-- MIGRATION 016 — Achievements / Badges
-- =============================================================================
-- Table de progression des achievements par utilisateur.
-- Les définitions des achievements sont dans le code (core/achievements/).
-- =============================================================================

-- ─── Table user_achievements ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT     NOT NULL,
  progress    JSONB       NOT NULL DEFAULT '{}',
  unlocked_at TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, achievement_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id
  ON public.user_achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked
  ON public.user_achievements(user_id)
  WHERE unlocked_at IS NOT NULL;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur peut voir ses propres achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Tout utilisateur peut voir les achievements débloqués des autres
CREATE POLICY "Anyone can view unlocked achievements"
  ON public.user_achievements
  FOR SELECT
  USING (unlocked_at IS NOT NULL);

-- Seul le service_role peut insérer/mettre à jour (via admin client)
CREATE POLICY "Service role can insert achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update achievements"
  ON public.user_achievements
  FOR UPDATE
  USING (true);

-- ─── Compteur de bluffs consécutifs (pour achievement Bluff Master) ──────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consecutive_bluff_wins INTEGER NOT NULL DEFAULT 0;
