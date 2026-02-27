-- =============================================================================
-- MIGRATION — Matchmaking + Mode de jeu
-- =============================================================================
-- Ajoute le mode de jeu aux parties et la file d'attente de matchmaking.
-- =============================================================================

-- ─── Type ENUM pour les modes de jeu ───
CREATE TYPE game_mode AS ENUM ('PRIVATE', 'NORMAL', 'RANKED');

-- ─── Ajouter le mode de jeu à la table games ───
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS game_mode game_mode DEFAULT 'PRIVATE' NOT NULL;

CREATE INDEX idx_games_game_mode ON public.games(game_mode);

-- ─── Table matchmaking_queue ───
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  elo          INTEGER NOT NULL DEFAULT 1000,
  game_mode    game_mode NOT NULL DEFAULT 'RANKED',
  status       TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'cancelled')),
  matched_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  joined_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Un joueur ne peut avoir qu'UNE SEULE entrée "waiting" à la fois
-- (pas de contrainte sur matched/cancelled pour éviter les conflits)
CREATE UNIQUE INDEX idx_unique_user_waiting
  ON public.matchmaking_queue (user_id)
  WHERE status = 'waiting';

-- ─── Index pour le matchmaking ───
CREATE INDEX idx_queue_status ON public.matchmaking_queue(status) WHERE status = 'waiting';
CREATE INDEX idx_queue_game_mode_status ON public.matchmaking_queue(game_mode, status);
CREATE INDEX idx_queue_elo ON public.matchmaking_queue(elo) WHERE status = 'waiting';
CREATE INDEX idx_queue_user ON public.matchmaking_queue(user_id);

-- ─── Nettoyage automatique des entrées expirées (> 10 min) ───
CREATE OR REPLACE FUNCTION public.cleanup_expired_queue_entries()
RETURNS void AS $$
BEGIN
  -- Supprimer les anciennes entrées cancelled/matched (> 1h)
  DELETE FROM public.matchmaking_queue
  WHERE status IN ('cancelled', 'matched')
    AND updated_at < NOW() - INTERVAL '1 hour';

  -- Annuler les entrées waiting expirées (> 10 min)
  UPDATE public.matchmaking_queue
  SET status = 'cancelled', updated_at = NOW()
  WHERE status = 'waiting'
    AND joined_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Row Level Security ───
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- LECTURE : tous les utilisateurs authentifiés peuvent voir toute la queue
-- (nécessaire pour que le matchmaking côté serveur voie tous les joueurs)
CREATE POLICY "Queue visible par les utilisateurs authentifiés"
  ON public.matchmaking_queue FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERTION : un joueur ne peut insérer que ses propres entrées
CREATE POLICY "Insérer ses propres entrées"
  ON public.matchmaking_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- MISE À JOUR : un joueur peut modifier ses propres entrées (annuler)
CREATE POLICY "Modifier ses propres entrées"
  ON public.matchmaking_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- SUPPRESSION : un joueur peut supprimer ses propres entrées
CREATE POLICY "Supprimer ses propres entrées"
  ON public.matchmaking_queue FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- FONCTIONS SECURITY DEFINER — Pour le matchmaking côté serveur
-- =============================================================================
-- Ces fonctions contournent les RLS pour permettre au serveur de
-- matcher des joueurs et mettre à jour des entrées qui ne lui appartiennent pas.
-- =============================================================================

-- Fonction pour marquer des entrées comme matchées (bypass RLS)
CREATE OR REPLACE FUNCTION public.match_queue_entries(
  p_entry_ids UUID[],
  p_game_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE public.matchmaking_queue
  SET status = 'matched',
      matched_game_id = p_game_id,
      updated_at = NOW()
  WHERE id = ANY(p_entry_ids)
    AND status = 'waiting';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
