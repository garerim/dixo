-- =============================================================================
-- RESET — Vider complètement toutes les données de la BDD
-- =============================================================================
-- Supprime TOUTES les données de toutes les tables publiques + auth.
-- Les tables, triggers, fonctions et RLS sont conservés.
-- =============================================================================

-- Désactiver temporairement les triggers pour éviter les conflits
SET session_replication_role = 'replica';

-- ─── Vider les tables publiques ───
TRUNCATE public.elo_history        CASCADE;
TRUNCATE public.matchmaking_queue  CASCADE;
TRUNCATE public.games              CASCADE;
TRUNCATE public.profiles           CASCADE;

-- ─── Vider les tables auth (ordre FK) ───
-- Il faut nettoyer TOUTES les tables auth sinon on laisse des
-- entrées orphelines (identities, sessions, etc.) qui causent
-- "User not found" à la reconnexion OAuth.
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- Réactiver les triggers
SET session_replication_role = 'origin';
