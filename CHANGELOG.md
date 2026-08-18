# Changelog — Dixo

Journal des versions déployées de Dixo. Le format suit [Keep a Changelog](https://keepachangelog.com/fr/)
et les versions respectent [Semantic Versioning](https://semver.org/lang/fr/) (`0.x` : produit en évolution rapide).

Chaque version correspond à un déploiement en production (https://www.dixo-game.com) via le pipeline
CI/CD ; les correctifs y sont documentés avec la référence du commit.

## [0.12.0] — 2026-06-18

### Ajouté
- Supervision : sonde de disponibilité `GET /api/health` (état serveur + base de données + latence, `503` en cas de dégradation) interrogée par le monitoring externe.
- Collecte d'erreurs applicatives (Sentry) avec alertes.
- Mises à jour automatiques des dépendances (Dependabot : npm hebdomadaire, GitHub Actions mensuel).
- Journal des versions (`CHANGELOG.md`).

## [0.11.0] — 2026-06-17

### Ajouté
- Accessibilité : lien d'évitement « Aller au contenu principal », libellés `aria-label` sur les boutons à icône, page de déclaration d'accessibilité `/accessibility` (référentiel OPQUAST) — `b4362aa`.
- Sécurité : en-têtes HTTP (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) — `b4362aa`.

## [0.10.0] — 2026-06-12

### Ajouté
- Pipeline CI/CD GitHub Actions : lint + tests unitaires + couverture (seuils bloquants) + déploiements Vercel aperçu/production (PR #4) — `f49e35e`, `2d723d7`.
- Suite E2E Playwright (smoke tests) exécutée en CI comme barrière avant déploiement (PR #5) — `cf3083b`, `7b6259d`.
- Rapport HTML Playwright généré en CI (artefact téléchargeable) — `19609dd`.

### Corrigé
- Clé de traduction `login.loading` manquante (erreur `MISSING_MESSAGE` détectée par les tests E2E) — `cf3083b`.
- Build cassé en l'absence de `STRIPE_SECRET_KEY` : initialisation paresseuse du client Stripe — `c619d6c`.

## [0.9.0] — 2026-05-08

### Ajouté
- Annulation d'abonnement Premium depuis l'application — `d87171a`.
- Codes promotionnels sur le checkout et les achats — `7748178`.
- Pied de page légal et pages légales complètes (mentions, CGU, CGV, confidentialité) — `03224e5`.

### Corrigé
- Compatibilité de l'annulation d'abonnement avec l'évolution de l'API Stripe — `1ee8c85`.

## [0.8.0] — 2026-04-15

### Ajouté
- Tournois automatiques : tâche cron Vercel (toutes les 10 min) et créateur nullable — `646ba43`, `10fa38e`.
- Skins de dés exclusifs Premium — `2b5db89`.

## [0.7.0] — 2026-04-11

### Ajouté
- Mécanique « Pile Poil » (Spot On) et animations de lancer de dés — `26f1e65`.
- Bascule de thème clair/sombre — `a29f81e`.
- Détection de webview sur la page de connexion (guidage OAuth Google) — `8d817f6`.
- Avance automatique entre les phases de jeu — `4124cba`.
- Refonte de style de l'interface de jeu (PR #3) — `e199900`.

### Corrigé
- Mise en page responsive des composants enchères/chat — `3ea2399`.

## [0.6.0] — 2026-04-04

### Ajouté
- SEO : données structurées et métadonnées enrichies (PR #1) — `1e0b0af`.
- Intégration Google AdSense et offre Premium « sans publicité » (PR #2) — `ced850a`, `5975ba3`.

## [0.5.0] — 2026-03-30

### Ajouté
- Tournois (bracket, inscriptions, pages dédiées) — `cd7a160`.
- Mode entraînement contre des bots (IA) et tutoriel interactif — `7c28a26`, `3ac84ec`.
- Succès (achievements) avec suivi utilisateur — `de60bd1`.
- Internationalisation (fr/en/es) — `bd10f42`.
- PWA : mode hors-ligne et service worker — `984441d`.
- Suppression de compte conforme RGPD — `f52c8b5`.
- Effets sonores et notifications sonores — `acb50ca`, `4d8a487`.

## [0.4.0] — 2026-03-21

### Ajouté
- Skins de dés personnalisables — `24cfc16`.
- Système de notifications (demandes d'amis, messages, invitations) — `2b24911`.

## [0.3.0] — 2026-03-14

### Ajouté
- Paramètres de partie modifiables par l'hôte — `075acc7`.
- Invitations en partie et sortie de partie — `5bf805a`.
- Niveaux et XP sur profils et classement ; page des rangs — `e3881fd`, `b7bc485`.
- Revanche (rematch) en 1v1 — `5a68372`.
- Animations (framer-motion) — `90644ea`.

## [0.2.0] — 2026-03-07

### Ajouté
- Avatars et amélioration des profils — `5129679`.
- Abonnement Premium (fondations) — `0080a8e`.
- Signalement de messages et de profils — `47662c0`.
- Landing page, page « Comment jouer », classement ELO — `c592d80`, `4afeb93`, `1045ba5`.

## [0.1.0] — 2026-02-27

### Ajouté
- Version initiale jouable : moteur de jeu Perudo (machine à états, enchères, contestation « Dudo »), parties multijoueur temps réel (Supabase Realtime), authentification Google, chat en partie — `1976aff`, `1afde5d`, `3d9aa3d`.
