-- =============================================================================
-- MIGRATION 006 — Double ELO (1v1 + 4 joueurs) + choix du nombre de joueurs
-- =============================================================================
-- 1. profiles : elo → elo_1v1 + ajout elo_4p
-- 2. matchmaking_queue : ajout player_count
-- 3. elo_history : ajout ranked_mode ('1v1' | '4p')
-- =============================================================================

-- ─── 1. Profiles : double ELO ───
ALTER TABLE public.profiles RENAME COLUMN elo TO elo_1v1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS elo_4p INTEGER DEFAULT 1000 NOT NULL;

-- Mettre à jour l'index du classement
DROP INDEX IF EXISTS idx_profiles_elo;
CREATE INDEX idx_profiles_elo_1v1 ON public.profiles(elo_1v1 DESC);
CREATE INDEX idx_profiles_elo_4p ON public.profiles(elo_4p DESC);

-- ─── 2. Matchmaking queue : nombre de joueurs ───
ALTER TABLE public.matchmaking_queue ADD COLUMN IF NOT EXISTS player_count INTEGER DEFAULT 2 NOT NULL;

-- ─── 3. ELO history : mode classé ───
ALTER TABLE public.elo_history ADD COLUMN IF NOT EXISTS ranked_mode TEXT DEFAULT '1v1' NOT NULL;
