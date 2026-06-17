// =============================================================================
// Déclaration d’accessibilité
// Référentiel : OPQUAST (bonnes pratiques web) + WCAG 2.1 / RGAA en référence.
// Dernière révision : 15 juin 2026.
// =============================================================================

import type { Metadata } from "next";
import { MainHeader } from "@/components/main-header";
import { LegalFooter } from "@/components/legal-footer";
import { LegalArticle } from "@/components/legal-article";

export const metadata: Metadata = {
  title: "Déclaration d’accessibilité — Dixo",
  description:
    "Déclaration d’accessibilité de Dixo : référentiel OPQUAST, mesures mises en œuvre, limitations connues et contact.",
  robots: { index: true, follow: true },
};

export default function AccessibilityPage() {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <MainHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <LegalArticle>
          <h1>Déclaration d’accessibilité</h1>
          <p className="!mb-8 text-xs uppercase tracking-wider text-muted-foreground/70">
            Dernière mise à jour&nbsp;: 15&nbsp;juin&nbsp;2026
          </p>

          <p>
            L’éditeur de <strong>Dixo</strong> s’engage à rendre son application accessible au plus
            grand nombre, conformément à une démarche d’amélioration continue. La présente
            déclaration s’appuie sur la check-list <strong>OPQUAST</strong> (bonnes pratiques web) et
            prend pour cadre normatif de référence les <strong>WCAG&nbsp;2.1 niveau&nbsp;AA</strong>,
            socle commun du <strong>RGAA&nbsp;4.1</strong>.
          </p>

          <h2>1. État de conformité</h2>
          <p>
            Dixo est en <strong>conformité partielle</strong> avec les référentiels précités. La
            structure technique de l’application respecte un grand nombre de bonnes pratiques, mais
            certaines limitations subsistent (voir §4) et font l’objet d’un plan d’amélioration.
          </p>

          <h2>2. Mesures mises en œuvre</h2>
          <ul>
            <li>
              <strong>Structure sémantique</strong>&nbsp;: utilisation des repères HTML
              (<code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code>,{" "}
              <code>section</code>) et attribut <code>lang</code> dynamique selon la langue active.
            </li>
            <li>
              <strong>Navigation au clavier</strong>&nbsp;: lien d’évitement «&nbsp;Aller au contenu
              principal&nbsp;», indicateurs de focus visibles, ordre de tabulation naturel, aucun
              <code>tabindex</code> positif.
            </li>
            <li>
              <strong>Composants accessibles</strong>&nbsp;: l’interface est construite sur les
              primitives <strong>Radix UI</strong> (boîtes de dialogue, menus, onglets, listes
              déroulantes…), qui intègrent nativement la gestion du focus, la navigation au clavier et
              les attributs ARIA.
            </li>
            <li>
              <strong>Formulaires</strong>&nbsp;: champs systématiquement associés à une étiquette
              (<code>label</code>), états d’erreur signalés via <code>aria-invalid</code> et{" "}
              <code>aria-describedby</code>.
            </li>
            <li>
              <strong>Contenus non textuels</strong>&nbsp;: alternatives textuelles sur les images
              porteuses d’information&nbsp;; libellés accessibles sur les boutons à icône.
            </li>
            <li>
              <strong>Couleurs et thème</strong>&nbsp;: thèmes clair et sombre, palette en espace
              colorimétrique OKLCH pensée pour le contraste.
            </li>
            <li>
              <strong>Internationalisation</strong>&nbsp;: contenus disponibles en français, anglais
              et espagnol.
            </li>
            <li>
              <strong>Contrôle qualité</strong>&nbsp;: règles <code>eslint-plugin-jsx-a11y</code>{" "}
              actives dans l’intégration continue.
            </li>
          </ul>

          <h2>3. Technologies utilisées</h2>
          <p>
            L’accessibilité de Dixo s’appuie sur HTML, CSS (Tailwind CSS), JavaScript/TypeScript
            (React, Next.js) et les composants Radix UI. La restitution dépend de la combinaison du
            navigateur et des technologies d’assistance utilisées.
          </p>

          <h2>4. Limitations connues</h2>
          <p>
            Malgré nos efforts, certains contenus peuvent présenter des défauts d’accessibilité. Les
            limitations actuellement identifiées sont notamment&nbsp;:
          </p>
          <ul>
            <li>
              les contrastes de couleurs n’ont pas encore fait l’objet d’un audit automatisé
              documenté&nbsp;;
            </li>
            <li>
              certaines mises à jour dynamiques en cours de partie (temps réel) ne sont pas encore
              annoncées via des régions <code>aria-live</code>&nbsp;;
            </li>
            <li>
              l’application n’a pas encore fait l’objet d’un test complet avec lecteur d’écran sur
              l’ensemble du parcours de jeu.
            </li>
          </ul>

          <h2>5. Voies de recours et contact</h2>
          <p>
            Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou à
            une fonctionnalité, vous pouvez nous contacter à l’adresse{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a> afin d’obtenir une
            assistance ou une alternative.
          </p>
        </LegalArticle>
      </main>
      <LegalFooter />
    </div>
  );
}
