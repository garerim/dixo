-- =============================================================================
-- MIGRATION 015 — Système de notifications in-app
-- =============================================================================
-- Table pour stocker les notifications persistantes des utilisateurs.
-- Réception en temps réel via Supabase Realtime (postgres_changes).
-- =============================================================================

-- ─── Table notifications ───
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN (
    'friend_request_received',
    'friend_request_accepted',
    'message_received',
    'game_invite_received',
    'game_started'
  )),
  title         TEXT NOT NULL,
  body          TEXT,
  data          JSONB DEFAULT '{}' NOT NULL,
  is_read       BOOLEAN DEFAULT false NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index principal : notifications récentes d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id, created_at DESC);

-- Index pour le comptage rapide des non-lues
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id) WHERE is_read = false;

-- ─── RLS ───
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Insertion : autorisé pour le service role (admin) uniquement
-- Les notifications sont créées côté serveur via le admin client
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Les utilisateurs peuvent marquer leurs notifications comme lues
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Nettoyage automatique : supprimer les notifications de plus de 30 jours ───
-- (à exécuter via un cron job ou manuellement)
-- DELETE FROM public.notifications WHERE created_at < now() - INTERVAL '30 days';
