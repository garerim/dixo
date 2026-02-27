-- =============================================================================
-- MIGRATION 005 — Table elo_history
-- =============================================================================
-- Historise chaque changement d'ELO pour chaque joueur.
-- Permet d'afficher un graphe d'évolution dans le profil.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.elo_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  elo         INTEGER NOT NULL,
  delta       INTEGER NOT NULL DEFAULT 0,
  game_id     UUID REFERENCES public.games(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour récupérer l'historique d'un joueur rapidement
CREATE INDEX IF NOT EXISTS idx_elo_history_user_id ON public.elo_history(user_id, created_at DESC);

-- RLS
ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur peut lire son propre historique
CREATE POLICY "Users can read their own elo history"
  ON public.elo_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Seul le service role peut insérer (via le backend)
CREATE POLICY "Service role can insert elo history"
  ON public.elo_history
  FOR INSERT
  WITH CHECK (true);
