// =============================================================================
// LEGAL — Mentions légales
// Conformité LCEN art. 6-III. Dernière révision : 1er mai 2026.
// =============================================================================

import type { Metadata } from "next";
import { MainHeader } from "@/components/main-header";
import { LegalFooter } from "@/components/legal-footer";
import { LegalArticle } from "@/components/legal-article";

export const metadata: Metadata = {
  title: "Mentions légales — Dixo",
  description: "Mentions légales du site Dixo (dixo-game.com).",
  robots: { index: true, follow: true },
};

export default function LegalNoticePage() {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <MainHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <LegalArticle>
          <h1>Mentions légales</h1>
          <p className="!mb-8 text-xs uppercase tracking-wider text-muted-foreground/70">
            En vigueur au 1<sup>er</sup> mai 2026
          </p>

          <h2>1. Éditeur du site</h2>
          <p>
            Le site <strong>Dixo</strong> (accessible à l’adresse{" "}
            <a href="https://www.dixo-game.com">https://www.dixo-game.com</a>) est édité par&nbsp;:
          </p>
          <ul>
            <li>
              <strong>Mathéo GARERI</strong>, entrepreneur individuel exerçant sous le nom commercial
              «&nbsp;Gama EI&nbsp;».
            </li>
            <li>
              Adresse&nbsp;: 225 rue du Grand Miceau, 73660 Saint-Rémy-de-Maurienne, France.
            </li>
            <li>
              Immatriculé au Registre National des Entreprises (RNE) — date d’immatriculation&nbsp;:
              31&nbsp;mars&nbsp;2026.
            </li>
            <li>SIREN&nbsp;: 103&nbsp;100&nbsp;061 — SIRET (siège)&nbsp;: 10310006100011</li>
            <li>Code APE&nbsp;: 6201Z (Programmation informatique)</li>
            <li>
              TVA&nbsp;: «&nbsp;TVA non applicable, art.&nbsp;293&nbsp;B du CGI&nbsp;» (franchise en
              base de TVA).
            </li>
            <li>
              Contact&nbsp;:{" "}
              <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>
            </li>
          </ul>
          <p>Directeur de la publication&nbsp;: Mathéo GARERI.</p>

          <h2>2. Hébergement</h2>
          <p>Le site est hébergé par&nbsp;:</p>
          <ul>
            <li>
              <strong>Vercel Inc.</strong> — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{" "}
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
                vercel.com
              </a>
            </li>
          </ul>
          <p>La base de données et les services associés sont fournis par&nbsp;:</p>
          <ul>
            <li>
              <strong>Supabase Inc.</strong> — 970 Toa Payoh North #07-04, Singapour —{" "}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                supabase.com
              </a>
            </li>
          </ul>

          <h2>3. Propriété intellectuelle</h2>
          <p>
            L’ensemble des éléments composant le site Dixo (textes, graphismes, logo, illustrations,
            interface, code source, base de données) est la propriété exclusive de l’éditeur ou est
            utilisé avec l’autorisation de leurs ayants droit. Toute reproduction, représentation,
            modification ou exploitation, totale ou partielle, sans autorisation écrite préalable, est
            interdite et constitue un acte de contrefaçon (art.&nbsp;L.&nbsp;335-2 et suivants du Code
            de la propriété intellectuelle).
          </p>

          <h2>4. Responsabilité</h2>
          <p>
            L’éditeur s’efforce d’assurer l’exactitude et la mise à jour des informations diffusées
            sur le site, mais ne garantit en aucun cas leur exhaustivité ou leur absence d’erreur.
            L’éditeur ne saurait être tenu responsable des dommages directs ou indirects résultant de
            l’accès au site ou de son utilisation, ni des éventuelles interruptions de service dues à
            la maintenance, à l’hébergeur, ou à tout cas de force majeure.
          </p>

          <h2>5. Liens vers des sites tiers</h2>
          <p>
            Le site peut contenir des liens vers des sites tiers. L’éditeur n’exerce aucun contrôle
            sur ces sites et décline toute responsabilité quant à leur contenu, leur disponibilité,
            leurs pratiques en matière de protection des données ou tout préjudice résultant de leur
            utilisation.
          </p>

          <h2>6. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. Tout litige relatif à leur
            interprétation ou à leur exécution relève des juridictions compétentes, sous réserve des
            dispositions impératives en matière de consommation.
          </p>

          <h2>7. Contact</h2>
          <p>
            Pour toute question relative au site ou pour exercer un droit reconnu par les présentes,
            écrivez à&nbsp;:{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>.
          </p>
        </LegalArticle>
      </main>
      <LegalFooter />
    </div>
  );
}
