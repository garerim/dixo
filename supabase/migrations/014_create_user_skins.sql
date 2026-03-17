-- Tracks which skins a user owns
CREATE TABLE user_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skin_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  stripe_session_id TEXT,
  UNIQUE (user_id, skin_id)
);

-- RLS
ALTER TABLE user_skins ENABLE ROW LEVEL SECURITY;

-- Users can read their own skins
CREATE POLICY "Users can read own skins"
  ON user_skins FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (via webhook)
CREATE POLICY "Service role can insert skins"
  ON user_skins FOR INSERT
  WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX idx_user_skins_user_id ON user_skins(user_id);
