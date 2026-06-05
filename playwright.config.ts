import { defineConfig, devices } from "@playwright/test";

// =============================================================================
// Configuration Playwright — Tests End-to-End
// =============================================================================
// Les tests E2E lancent un vrai navigateur (Chromium) contre l'application
// réelle. En local, Playwright démarre automatiquement `npm run dev` (voir
// `webServer` ci-dessous) puis exécute les specs du dossier `e2e/`.

const PORT = 3000;
// Permet de cibler une URL externe (ex. déploiement preview) en définissant
// PLAYWRIGHT_BASE_URL ; sinon Playwright démarre l'app locale (voir webServer).
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",

  // Exécute les tests d'un même fichier en parallèle.
  fullyParallel: true,

  // En CI : interdit les `.only` oubliés, retente les tests instables.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? "github" : "html",

  // Le 1er rendu d'une route en dev (compilation Turbopack) peut être lent.
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    // Force la locale FR -> le middleware sert les textes français (assertions).
    locale: "fr-FR",
    // Aides au debug en cas d'échec.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Démarre l'app automatiquement avant les tests.
  //  - En local  : serveur de dev (`npm run dev`), réutilisé s'il tourne déjà.
  //  - En CI      : serveur de prod (`npm run start`) — nécessite un `npm run
  //    build` au préalable (fait par le job GitHub Actions).
  //  - Si PLAYWRIGHT_BASE_URL est défini : on cible cette URL et on ne démarre
  //    aucun serveur (tests contre un déploiement distant).
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "npm run start" : "npm run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
