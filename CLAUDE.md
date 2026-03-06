# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run all tests (Vitest)
npm run test:watch   # Vitest in watch mode

# Run a single test file
npx vitest run tests/path/to/file.test.ts
```

## Architecture

Dixo is an online multiplayer Liar's Dice (Perudo) game built with Next.js 16, Supabase, and React 19. The codebase follows a strict layered architecture:

### Layer Overview

```
core/game-engine/     ← Pure domain logic (no external deps)
services/             ← Application services (orchestrate engine + DB)
lib/database/         ← Repository pattern (DB ↔ domain types)
lib/realtime/         ← Supabase Realtime subscriptions
lib/supabase/         ← Supabase client setup (browser/server/middleware)
app/api/              ← Next.js Route Handlers (REST API)
features/             ← Feature modules (UI + client API + hooks)
components/ui/        ← shadcn/ui primitives
types/                ← Shared types (database.ts, api.ts)
```

### Core Game Engine (`core/game-engine/`)

The game engine is completely pure — no database or network dependencies. It implements a state machine with these phases: `LOBBY → ROLLING → BIDDING → CHALLENGE → RESULT → GAME_OVER`.

Key files:
- `types.ts` — All domain types (`GameState`, `PlayerState`, `Bid`, `ChallengeResult`, enums)
- `state-machine.ts` — Main entry point: `createInitialGameState`, `addPlayer`, `startGame`, `placeBid`, `callChallenge`, `startNextRound`, `surrender`. Each function takes a `GameState` and returns a `GameActionResult` (immutable state transitions).
- `bid-validator.ts` — Bid validation rules (Paco/joker rules)
- `challenge-resolver.ts` — Challenge resolution + penalty application
- `dice.ts` — Dice rolling with injectable `RandomGenerator` (for testability)
- `turn-manager.ts` — Player turn advancement

### Services (`services/`)

Services orchestrate: load state from DB → call engine → save new state. `GameService` is the main orchestrator. `game-state-sanitizer.ts` masks other players' dice values before sending to clients (dice are only revealed in CHALLENGE/RESULT/GAME_OVER phases).

### Data Storage

The full `GameState` is serialized as JSON in the `state` column of the `games` Supabase table. `GameRepository` handles the serialization/deserialization — `rowToGameState` simply casts `row.state` back to `GameState`.

### API Layer (`app/api/`)

Next.js Route Handlers authenticate via Supabase server client, instantiate the appropriate service, and return `ApiResponse<T>`. All game actions go through `/api/game/[action]`. The server does **not** broadcast Realtime events itself — clients subscribe to Supabase Postgres changes on the `games` table.

### Feature Modules (`features/`)

Each feature (game, friends, messages, matchmaking, profile) has:
- `api/` — Typed fetch client (e.g., `gameClient.placeBid(...)`)
- `components/` — React components
- `hooks/` — React hooks (e.g., `useGame` handles state + Realtime subscription)
- `index.ts` — Public re-exports

`useGame` in `features/game/hooks/use-game.ts` is the main client hook: loads initial state, subscribes to Supabase Realtime for live updates, and exposes game actions.

### Real-time Updates

`lib/realtime/game-channel.ts` subscribes to `postgres_changes` on `games` table filtered by `game_id`, plus a `broadcast` channel for immediate updates. The hook calls `subscribeToGame()` and updates local state on every change.

### Authentication

Supabase auth with cookie-based sessions via `@supabase/ssr`. Middleware (`middleware.ts`) protects `/game` routes and redirects `/login` if already authenticated. Three Supabase clients: `lib/supabase/client.ts` (browser singleton), `lib/supabase/server.ts` (server-side), `lib/supabase/middleware.ts` (session refresh).

### Types

- `types/database.ts` — Row types matching Supabase tables + `Database` interface for typed client
- `types/api.ts` — Request/response contracts shared between client and server (`PublicGameState`, `ApiResponse<T>`, etc.)
- `@/` path alias maps to the project root

### ELO System

Dual ELO: `elo_1v1` and `elo_4p` per profile. ELO is only updated for `RANKED` games. `EloService` in `services/elo-service.ts` tracks elimination order in memory (`GameService.eliminationOrders` static Map) and applies changes on `GAME_OVER`.

### UI

Tailwind CSS v4 + shadcn/ui components (in `components/ui/`). Theme defaults to dark via `next-themes`. Toasts via `sonner`.

### Stripe / Billing

Premium plan (4,99 €/month) unlocks: GIF avatars, Premium badge (in-game + profile), full ELO history.

Required env vars (add to `.env.local`):
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

- `lib/stripe/server.ts` — Stripe SDK singleton (server-only)
- `app/api/billing/checkout` — creates Stripe Checkout session
- `app/api/billing/portal` — creates Stripe Customer Portal session
- `app/api/billing/webhook` — handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` (uses `getSupabaseAdminClient()` to bypass RLS)
- `features/billing/` — client API wrapper + `useBilling` hook
- `app/pricing/page.tsx` — public pricing page

To test locally: `stripe listen --forward-to localhost:3000/api/billing/webhook`

### Tests

Tests live in `tests/` and use Vitest. They test the pure `core/` domain logic (no mocking needed).

### Database Migrations

SQL migrations are in `supabase/migrations/` (numbered sequentially). `supabase/reset_data.sql` is a dev utility.
