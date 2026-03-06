-- =============================================================================
-- Migration 011 : Ajout du champ stripe_customer_id sur les profils
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
