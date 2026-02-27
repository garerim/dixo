-- =============================================================================
-- MIGRATION CORRECTIVE — Fix matchmaking RLS + contraintes
-- =============================================================================
-- Corrige 3 bugs :
-- 1. RLS SELECT trop restrictif → chaque joueur ne voyait que ses entrées
-- 2. UNIQUE(user_id, status) → crash quand 2+ entrées "cancelled"
-- 3. markAsMatched impossible cross-user → ajout fonction SECURITY DEFINER
-- =============================================================================

-- ─── 1. VIDER la table pour repartir proprement ───
TRUNCATE public.matchmaking_queue;

-- ─── 2. Supprimer l'ancienne contrainte UNIQUE ───
ALTER TABLE public.matchmaking_queue
  DROP CONSTRAINT IF EXISTS unique_user_in_queue;

-- ─── 3. Créer un index unique partiel (seulement sur status='waiting') ───
DROP INDEX IF EXISTS idx_unique_user_waiting;
CREATE UNIQUE INDEX idx_unique_user_waiting
  ON public.matchmaking_queue (user_id)
  WHERE status = 'waiting';

-- ─── 4. Supprimer les anciennes policies RLS ───
DROP POLICY IF EXISTS "Voir ses propres entrées" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Queue visible par les utilisateurs authentifiés" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Insérer ses propres entrées" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Modifier ses propres entrées" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Supprimer ses propres entrées" ON public.matchmaking_queue;

-- ─── 5. Recréer les policies corrigées ───

-- LECTURE : tous les authentifiés voient TOUTE la queue
-- (nécessaire pour que getWaitingEntries et countWaiting fonctionnent)
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

-- ─── 6. Fonction SECURITY DEFINER pour le matchmaking cross-user ───
-- Permet à Player B de marquer l'entrée de Player A comme "matched"
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

-- ─── 7. Mettre à jour la fonction de nettoyage ───
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
