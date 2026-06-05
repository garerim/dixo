import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Rapports : résumé console + HTML navigable + lcov (pour outils externes).
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      // On mesure les domaines métier réellement couverts par la suite de tests
      // (moteur de jeu + ELO). Les autres modules core/ (bot, tournament, xp…)
      // n'ont pas encore de tests : on les exclut pour garder un rapport lisible.
      include: ["core/game-engine/**/*.ts", "core/elo/**/*.ts"],
      // Barrels de ré-export, types et déclarations : non pertinents à mesurer.
      exclude: ["**/index.ts", "**/types.ts", "**/*.d.ts"],
      // Seuils minimaux : la commande échoue (et bloque la CI) sous ces valeurs.
      // Calibrés sous la couverture actuelle pour empêcher toute régression.
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 85,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
