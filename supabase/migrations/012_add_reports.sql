-- =============================================================================
-- Migration 012 — Système de signalement (reports)
-- =============================================================================

-- Colonne is_admin sur profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Table reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_message_id UUID REFERENCES public.game_messages(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('player', 'message')),
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate_content', 'harassment', 'cheating', 'spam', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reporter peut créer
CREATE POLICY "reporters_insert" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Reporter peut voir ses propres signalements
CREATE POLICY "reporters_select_own" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
