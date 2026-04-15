-- =============================================================================
-- Migration 019: Allow automatic tournaments without a creator
-- =============================================================================
-- Automatic tournaments are created by the cron job and have no human creator.
-- Drop the NOT NULL so created_by can be NULL for system-created tournaments.

ALTER TABLE public.tournaments
  ALTER COLUMN created_by DROP NOT NULL;
