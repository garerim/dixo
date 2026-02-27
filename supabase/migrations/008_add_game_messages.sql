-- =============================================================================
-- MIGRATION 008 — Messages de chat dans les parties
-- =============================================================================
-- Table pour gérer les messages de chat en temps réel dans les parties.
-- =============================================================================

-- ─── Table game_messages ───
CREATE TABLE IF NOT EXISTS public.game_messages (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id       UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Contrainte : le contenu ne peut pas être vide
  CHECK (length(trim(content)) > 0)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_game_messages_game_id ON public.game_messages(game_id, created_at DESC);
CREATE INDEX idx_game_messages_user_id ON public.game_messages(user_id);

-- ─── Fonction helper : vérifie si un utilisateur est dans une partie ───
CREATE OR REPLACE FUNCTION public.is_user_in_game(
  p_game_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_state JSONB;
BEGIN
  -- Récupérer le state de la partie
  SELECT state INTO v_state
  FROM public.games
  WHERE id = p_game_id;
  
  -- Si la partie n'existe pas, retourner false
  IF v_state IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier si l'utilisateur est dans le tableau des joueurs
  -- Le state contient un champ "players" qui est un tableau d'objets avec un champ "id"
  RETURN EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_state->'players') AS player
    WHERE (player->>'id')::UUID = p_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── RLS pour game_messages ───
ALTER TABLE public.game_messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les messages des parties auxquelles ils participent
CREATE POLICY "Players can view messages from their games"
  ON public.game_messages FOR SELECT
  USING (
    public.is_user_in_game(game_id, auth.uid())
  );

-- Les utilisateurs peuvent envoyer des messages dans les parties auxquelles ils participent
CREATE POLICY "Players can send messages in their games"
  ON public.game_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_user_in_game(game_id, auth.uid())
  );
