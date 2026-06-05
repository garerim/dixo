import { test, expect } from "@playwright/test";

// =============================================================================
// Smoke tests E2E — pages publiques + protection des routes
// =============================================================================
// Ces tests parcourent l'app comme un vrai utilisateur (vrai navigateur), mais
// restent volontairement "smoke" : pas d'authentification, pas d'écriture en
// base. Ils vérifient que les pages clés se chargent et que le middleware
// protège bien les routes privées.

test.describe("Pages publiques", () => {
  test("la page d'accueil se charge", async ({ page }) => {
    await page.goto("/");

    // Le <title> vient des métadonnées Next.js (indépendant de la locale).
    await expect(page).toHaveTitle(/Dixo/i);

    // Un lien de navigation stable doit être présent.
    await expect(
      page.getByRole("link", { name: "Tarifs" }).first(),
    ).toBeVisible();
  });

  test("la page de connexion affiche le bouton Google", async ({ page }) => {
    await page.goto("/login");

    // Logo (alt codé en dur, pas de traduction).
    await expect(page.getByAltText("Dixo")).toBeVisible();
    // Le seul moyen de connexion est Google OAuth.
    await expect(page.getByText("Continuer avec Google")).toBeVisible();
  });

  test("la page des tarifs se charge", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("Passer Premium").first()).toBeVisible();
  });

  test("la page 'Comment jouer' se charge", async ({ page }) => {
    await page.goto("/how-to-play");
    await expect(page.getByText("Dixo — Règles & Guide").first()).toBeVisible();
  });
});

test.describe("Pages légales", () => {
  const legalPages = [
    "/legal/legal-notice",
    "/legal/privacy-policy",
    "/legal/terms-of-sale",
    "/legal/terms-of-use",
  ];

  for (const path of legalPages) {
    test(`${path} se charge avec un titre`, async ({ page }) => {
      const response = await page.goto(path);
      // La réponse HTTP doit être un succès (pas de 404/500).
      expect(response?.ok()).toBeTruthy();
      // La page doit contenir au moins un titre visible.
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });
  }
});

test.describe("Protection des routes (middleware)", () => {
  test("une route /game protégée redirige vers /login quand non connecté", async ({
    page,
  }) => {
    await page.goto("/game/partie-inexistante-e2e");

    // Le middleware doit rediriger vers /login en conservant la destination.
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Continuer avec Google")).toBeVisible();
  });
});
