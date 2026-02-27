-- =============================================================================
-- MIGRATION — Table profiles
-- =============================================================================
-- Profil utilisateur avec pseudo, avatar, ELO, abonnement et statistiques.
-- Auto-créé à l'inscription via un trigger sur auth.users.
-- =============================================================================

-- ─── Type ENUM pour les abonnements ───
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'vip');

-- ─── Table profiles ───
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identité
  pseudo        TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,

  -- Classement
  elo_1v1       INTEGER DEFAULT 1000 NOT NULL,
  elo_4p        INTEGER DEFAULT 1000 NOT NULL,

  -- Abonnement
  subscription  subscription_tier DEFAULT 'free' NOT NULL,
  subscription_expires_at TIMESTAMPTZ,

  -- Statistiques
  games_played        INTEGER DEFAULT 0 NOT NULL,
  games_won           INTEGER DEFAULT 0 NOT NULL,
  total_challenge_calls    INTEGER DEFAULT 0 NOT NULL,
  total_challenge_success  INTEGER DEFAULT 0 NOT NULL,
  best_win_streak     INTEGER DEFAULT 0 NOT NULL,
  current_win_streak  INTEGER DEFAULT 0 NOT NULL,

  -- Métadonnées
  is_online     BOOLEAN DEFAULT false NOT NULL,
  last_seen_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Index pour les recherches rapides ───
CREATE INDEX idx_profiles_pseudo ON public.profiles(pseudo);
CREATE INDEX idx_profiles_elo_1v1 ON public.profiles(elo_1v1 DESC);
CREATE INDEX idx_profiles_elo_4p ON public.profiles(elo_4p DESC);

-- ─── Trigger : mise à jour automatique de updated_at ───
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Trigger : auto-création du profil à l'inscription ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _pseudo TEXT;
  _avatar TEXT;
BEGIN
  -- Récupérer les infos depuis les metadata Google OAuth
  _pseudo := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  _avatar := NEW.raw_user_meta_data ->> 'avatar_url';

  -- S'assurer que le pseudo est unique en ajoutant un suffixe si nécessaire
  IF EXISTS (SELECT 1 FROM public.profiles WHERE pseudo = _pseudo) THEN
    _pseudo := _pseudo || '_' || LEFT(NEW.id::TEXT, 4);
  END IF;

  INSERT INTO public.profiles (id, pseudo, avatar_url)
  VALUES (NEW.id, _pseudo, _avatar);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ───
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les profils (pseudo, avatar, elo, stats)
CREATE POLICY "Profils visibles publiquement"
  ON public.profiles FOR SELECT
  USING (true);

-- Seul le propriétaire peut modifier son profil
CREATE POLICY "Le propriétaire peut modifier son profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insertion uniquement via le trigger (service role)
CREATE POLICY "Insertion via trigger uniquement"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
