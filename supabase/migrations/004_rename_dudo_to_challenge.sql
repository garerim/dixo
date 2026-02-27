-- =============================================================================
-- MIGRATION — Renommage des colonnes dudo → challenge
-- =============================================================================
-- Renomme les colonnes total_dudo_calls et total_dudo_success
-- en total_challenge_calls et total_challenge_success.
-- =============================================================================

ALTER TABLE public.profiles
  RENAME COLUMN total_dudo_calls TO total_challenge_calls;

ALTER TABLE public.profiles
  RENAME COLUMN total_dudo_success TO total_challenge_success;
