-- =============================================================================
-- Migration 017: Tournament System
-- =============================================================================

-- ── Enums ──

CREATE TYPE tournament_format AS ENUM ('single_elimination', 'double_elimination');
CREATE TYPE tournament_status AS ENUM (
  'registration',
  'starting',
  'in_progress',
  'completed',
  'cancelled'
);

-- ── Table: tournaments ──

CREATE TABLE public.tournaments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  format                tournament_format NOT NULL DEFAULT 'single_elimination',
  status                tournament_status NOT NULL DEFAULT 'registration',

  -- Configuration
  max_participants      INTEGER NOT NULL DEFAULT 8 CHECK (max_participants IN (4, 8, 16, 32)),
  game_config           JSONB NOT NULL DEFAULT '{"initialDiceCount":5,"pacosAreWild":true,"turnTimer":30}',

  -- Scheduling
  registration_deadline TIMESTAMPTZ NOT NULL,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,

  -- Bracket state (entire bracket as JSON)
  bracket               JSONB NOT NULL DEFAULT '{}',
  current_round         INTEGER NOT NULL DEFAULT 0,

  -- Organizer
  created_by            UUID NOT NULL REFERENCES auth.users(id),
  winner_id             UUID REFERENCES auth.users(id),

  -- Rewards
  reward_skin_id        TEXT,
  elo_bonus_winner      INTEGER NOT NULL DEFAULT 50,
  elo_bonus_finalist    INTEGER NOT NULL DEFAULT 25,
  elo_bonus_semifinalist INTEGER NOT NULL DEFAULT 10,

  -- Auto-scheduling
  is_automatic          BOOLEAN NOT NULL DEFAULT true,

  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_registration ON public.tournaments(registration_deadline)
  WHERE status = 'registration';

-- ── Table: tournament_participants ──

CREATE TABLE public.tournament_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed            INTEGER,
  is_eliminated   BOOLEAN NOT NULL DEFAULT false,
  final_placement INTEGER,
  registered_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(tournament_id, user_id)
);

CREATE INDEX idx_tp_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX idx_tp_user ON public.tournament_participants(user_id);

-- ── Table: tournament_matches ──

CREATE TABLE public.tournament_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  game_id         UUID REFERENCES public.games(id),
  round           INTEGER NOT NULL,
  match_index     INTEGER NOT NULL,
  bracket_side    TEXT NOT NULL DEFAULT 'winners',

  player1_id      UUID REFERENCES auth.users(id),
  player2_id      UUID REFERENCES auth.users(id),
  winner_id       UUID REFERENCES auth.users(id),

  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'in_progress', 'completed', 'bye')),

  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(tournament_id, round, match_index, bracket_side)
);

CREATE INDEX idx_tm_tournament ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tm_game ON public.tournament_matches(game_id);
CREATE INDEX idx_tm_status ON public.tournament_matches(status);

-- ── Profile additions ──

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tournaments_played INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tournaments_won INTEGER NOT NULL DEFAULT 0;

-- ── ELO history: add tournament_id ──

ALTER TABLE public.elo_history
  ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id);

-- ── RLS ──

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Tournaments: anyone can read, admins + system can write
CREATE POLICY "tournaments_select" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "tournaments_insert" ON public.tournaments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "tournaments_update" ON public.tournaments
  FOR UPDATE USING (auth.uid() = created_by);

-- Participants: anyone can read, users can register/unregister themselves
CREATE POLICY "tp_select" ON public.tournament_participants
  FOR SELECT USING (true);

CREATE POLICY "tp_insert" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tp_delete" ON public.tournament_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Matches: anyone can read
CREATE POLICY "tm_select" ON public.tournament_matches
  FOR SELECT USING (true);

-- ── Updated_at trigger ──

CREATE OR REPLACE FUNCTION update_tournament_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tournament_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION update_tournament_updated_at();

CREATE TRIGGER trigger_tm_updated_at
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW EXECUTE FUNCTION update_tournament_updated_at();
