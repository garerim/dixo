-- =============================================================================
-- MIGRATION 007 — Système d'amis et messages privés
-- =============================================================================
-- Tables pour gérer les amitiés et les messages privés entre utilisateurs.
-- =============================================================================

-- ─── Table friendships ───
CREATE TABLE IF NOT EXISTS public.friendships (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Contrainte : pas de doublons (user_id, friend_id)
  UNIQUE(user_id, friend_id),
  -- Contrainte : on ne peut pas être ami avec soi-même
  CHECK (user_id != friend_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_both_users ON public.friendships(user_id, friend_id);

-- ─── Table private_messages ───
-- Note: Realtime est activé automatiquement par Supabase pour cette table
-- pour permettre les notifications en temps réel des nouveaux messages.
CREATE TABLE IF NOT EXISTS public.private_messages (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT false NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Contrainte : on ne peut pas s'envoyer un message à soi-même
  CHECK (sender_id != receiver_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.private_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.private_messages(receiver_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.private_messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- ─── Trigger : mise à jour automatique de updated_at pour friendships ───
DROP TRIGGER IF EXISTS friendships_updated_at ON public.friendships;
CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ─── RLS pour friendships ───
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres amitiés
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Les utilisateurs peuvent créer des demandes d'amitié
DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
CREATE POLICY "Users can create friendship requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent accepter/refuser leurs propres demandes reçues
DROP POLICY IF EXISTS "Users can update received friendship requests" ON public.friendships;
CREATE POLICY "Users can update received friendship requests"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = friend_id AND status = 'pending')
  WITH CHECK (auth.uid() = friend_id);

-- ─── RLS pour private_messages ───
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs messages (envoyés ou reçus)
DROP POLICY IF EXISTS "Users can view their own messages" ON public.private_messages;
CREATE POLICY "Users can view their own messages"
  ON public.private_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Les utilisateurs peuvent envoyer des messages
DROP POLICY IF EXISTS "Users can send messages" ON public.private_messages;
CREATE POLICY "Users can send messages"
  ON public.private_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Les utilisateurs peuvent marquer leurs messages reçus comme lus
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.private_messages;
CREATE POLICY "Users can mark received messages as read"
  ON public.private_messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
