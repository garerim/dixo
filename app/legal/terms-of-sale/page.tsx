// =============================================================================
// LEGAL — Conditions Générales de Vente (CGV)
// Conformité Code de la consommation L.111-1, L.221-5, L.221-28, L.215-1-1.
// Dernière révision : 1er mai 2026.
// =============================================================================

import type { Metadata } from "next";
import { MainHeader } from "@/components/main-header";
import { LegalFooter } from "@/components/legal-footer";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — Dixo",
  description: "CGV applicables aux abonnements Premium et aux achats de skins sur Dixo.",
  robots: { index: true, follow: true },
};

export default function TermsOfSalePage() {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <MainHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <article className="prose prose-invert max-w-none prose-headings:scroll-mt-24">
          <h1>Conditions Générales de Vente</h1>
          <p className="text-sm text-muted-foreground">
            En vigueur au 1<sup>er</sup> mai 2026.
          </p>

          <h2>1. Identification du vendeur</h2>
          <p>
            Les présentes Conditions Générales de Vente (ci-après «&nbsp;CGV&nbsp;») sont conclues
            entre&nbsp;:
          </p>
          <ul>
            <li>
              D’une part, <strong>Mathéo GARERI</strong>, entrepreneur individuel exerçant sous le nom
              commercial «&nbsp;Gama EI&nbsp;», SIREN 103&nbsp;100&nbsp;061, immatriculé au RNE le
              31&nbsp;mars&nbsp;2026, contact&nbsp;:{" "}
              <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a> (ci-après
              «&nbsp;l’Éditeur&nbsp;»).
            </li>
            <li>
              D’autre part, toute personne physique majeure ou âgée d’au moins 15&nbsp;ans avec
              accord parental, agissant à titre non professionnel, qui réalise un achat sur le site{" "}
              <a href="https://www.dixo-game.com">www.dixo-game.com</a> (ci-après le
              «&nbsp;Client&nbsp;»).
            </li>
          </ul>

          <h2>2. Objet</h2>
          <p>
            Les présentes CGV ont pour objet de définir les modalités de vente entre l’Éditeur et le
            Client portant sur deux types de produits numériques&nbsp;:
          </p>
          <ul>
            <li>
              <strong>L’abonnement Premium</strong>, formule mensuelle reconductible donnant accès
              à des fonctionnalités et contenus additionnels.
            </li>
            <li>
              <strong>Les skins de dés</strong>, achats unitaires (one-time) déverrouillant un
              cosmétique appliqué à l’interface du jeu.
            </li>
          </ul>
          <p>
            Toute commande implique l’acceptation pleine et entière des présentes CGV par le Client,
            sans réserve.
          </p>

          <h2>3. Caractéristiques essentielles des produits</h2>

          <h3>3.1. Abonnement Premium</h3>
          <ul>
            <li>Prix&nbsp;: <strong>4,99&nbsp;€ TTC par mois</strong> (TVA non applicable, art.&nbsp;293&nbsp;B du CGI).</li>
            <li>
              Avantages inclus&nbsp;: utilisation d’avatars animés au format GIF, badge
              «&nbsp;Premium&nbsp;» visible en partie et sur le profil, accès à l’historique ELO
              complet, déverrouillage des skins de dés exclusifs réservés aux abonnés Premium.
            </li>
            <li>
              Durée&nbsp;: indéterminée, avec reconduction automatique mensuelle, sauf résiliation
              par le Client (voir article&nbsp;7).
            </li>
          </ul>

          <h3>3.2. Skins de dés</h3>
          <ul>
            <li>
              Prix&nbsp;: variable selon le skin, généralement compris entre <strong>2,99&nbsp;€</strong> et{" "}
              <strong>9,99&nbsp;€ TTC</strong> (TVA non applicable, art.&nbsp;293&nbsp;B du CGI).
            </li>
            <li>
              Caractéristiques&nbsp;: élément cosmétique numérique appliqué à l’affichage des dés du
              Client en partie. Achat unitaire, déverrouillage permanent (sous réserve du maintien du
              compte).
            </li>
            <li>
              Certains skins, dits «&nbsp;exclusifs tournoi&nbsp;», ne sont pas disponibles à la
              vente et s’obtiennent uniquement en remportant un tournoi sur Dixo. Ces skins ne sont
              ni cessibles, ni remboursables, ni échangeables.
            </li>
          </ul>

          <h2>4. Prix</h2>
          <p>
            Les prix sont indiqués en euros, toutes taxes comprises (TTC). En tant qu’entrepreneur
            individuel sous le régime de la franchise en base de TVA, l’Éditeur ne facture pas la TVA
            (mention «&nbsp;TVA non applicable, art.&nbsp;293&nbsp;B du CGI&nbsp;»). Les prix
            affichés au moment de la commande sont ceux qui s’appliquent. L’Éditeur se réserve le
            droit de modifier ses prix à tout moment, étant entendu que les prix applicables sont
            ceux affichés au moment de la validation de la commande.
          </p>

          <h2>5. Commande et paiement</h2>
          <p>
            La commande est validée par le Client après acceptation des CGV et règlement via la
            plateforme de paiement sécurisée <strong>Stripe</strong>. L’Éditeur ne stocke ni ne traite
            directement les données de carte bancaire&nbsp;: celles-ci sont collectées et traitées
            exclusivement par Stripe Payments Europe Ltd., conformément aux normes PCI-DSS. Un
            récépissé de paiement est envoyé au Client par Stripe à l’adresse électronique du compte.
          </p>
          <p>
            La livraison du produit numérique (activation de l’abonnement Premium ou déblocage du
            skin) est effectuée automatiquement et instantanément à la confirmation du paiement par
            Stripe.
          </p>

          <h2>6. Droit de rétractation et renoncement exprès</h2>
          <p>
            Conformément à l’article L.&nbsp;221-18 du Code de la consommation, le Client dispose
            d’un droit de rétractation de <strong>14&nbsp;jours</strong> à compter de la conclusion
            du contrat, sans avoir à motiver sa décision.
          </p>
          <p>
            Toutefois, conformément à l’article <strong>L.&nbsp;221-28, 13°</strong> du Code de la
            consommation, ce droit de rétractation <strong>ne s’applique pas</strong> aux contrats de
            fourniture d’un contenu numérique non fourni sur un support matériel dont l’exécution a
            commencé après accord préalable exprès du Client et renoncement exprès à son droit de
            rétractation.
          </p>
          <p>
            En conséquence, lors de chaque commande, le Client est invité, avant validation du
            paiement, à&nbsp;:
          </p>
          <ul>
            <li>
              <strong>Donner son accord exprès</strong> pour l’exécution immédiate de la commande
              (activation de l’abonnement ou déblocage du skin), et
            </li>
            <li>
              <strong>Renoncer expressément</strong> à son droit de rétractation.
            </li>
          </ul>
          <p>
            Cet accord et ce renoncement sont matérialisés par une case à cocher au moment du
            paiement. Sans cocher cette case, la commande ne peut pas être validée.
          </p>
          <p>
            Si le Client n’a pas exprimé ce renoncement (commande effectuée avant la mise en place de
            la case dédiée, ou anomalie technique), il peut exercer son droit de rétractation dans le
            délai de 14&nbsp;jours en écrivant à{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>. Un formulaire-type
            est disponible sur demande.
          </p>

          <h2>7. Résiliation de l’abonnement Premium</h2>
          <p>
            Conformément à l’article L.&nbsp;215-1-1 du Code de la consommation (loi du 16&nbsp;novembre
            2022), le Client peut résilier son abonnement Premium à tout moment, sans frais ni
            justification, en <strong>trois clics au maximum</strong> depuis son espace personnel
            sur le site (page profil, section «&nbsp;Premium&nbsp;»).
          </p>
          <p>
            La résiliation prend effet à la fin de la période mensuelle en cours. Le Client conserve
            l’accès aux fonctionnalités Premium jusqu’à cette date. Aucun remboursement prorata
            temporis n’est effectué pour la période en cours.
          </p>
          <p>
            Le Client peut également résilier en écrivant à{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a> ou via le portail
            client Stripe accessible depuis son espace personnel.
          </p>

          <h2>8. Politique de remboursement</h2>
          <p>
            Hormis le droit de rétractation décrit à l’article&nbsp;6 (et ses exceptions), tous les
            achats de skins et abonnements Premium sont définitifs et non remboursables, sauf en cas
            de défaut technique avéré imputable à l’Éditeur (skin non débloqué après paiement, accès
            Premium non activé, double facturation, etc.) où un remboursement intégral sera effectué
            via Stripe sous 14&nbsp;jours à compter de la confirmation du défaut.
          </p>
          <p>
            Aucun remboursement ne sera accordé pour insatisfaction subjective, changement d’avis
            post-rétractation, ou suite à un bannissement pour violation des Conditions Générales
            d’Utilisation.
          </p>

          <h2>9. Service après-vente</h2>
          <p>
            Toute réclamation peut être adressée par email à{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>. L’Éditeur s’engage
            à répondre dans un délai de <strong>5&nbsp;jours ouvrés</strong>.
          </p>

          <h2>10. Résolution amiable des litiges</h2>
          <p>
            En cas de différend lié à l’exécution des présentes CGV, le Client est invité à
            adresser une réclamation écrite à l’Éditeur à{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>. L’Éditeur
            s’engage à répondre dans un délai de 5&nbsp;jours ouvrés et à rechercher de bonne foi
            une solution amiable.
          </p>
          <p>
            Le Client peut, à tout moment, recourir à la plateforme européenne de Règlement en
            Ligne des Litiges (RLL) mise à disposition par la Commission européenne&nbsp;:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            .
          </p>

          <h2>11. Garanties légales</h2>
          <p>
            Le Client bénéficie de la garantie légale de conformité (art.&nbsp;L.&nbsp;217-3 et
            suivants du Code de la consommation) et de la garantie contre les vices cachés
            (art.&nbsp;1641 et suivants du Code civil) pour les produits numériques fournis,
            applicables conformément aux dispositions légales en vigueur.
          </p>

          <h2>12. Force majeure</h2>
          <p>
            La responsabilité de l’Éditeur ne pourra être engagée en cas d’inexécution ou d’exécution
            tardive de ses obligations consécutive à un cas de force majeure tel que défini par la
            jurisprudence française.
          </p>

          <h2>13. Modification des CGV</h2>
          <p>
            L’Éditeur se réserve le droit de modifier les présentes CGV à tout moment. Les CGV
            applicables à une commande sont celles en vigueur à la date de cette commande. Toute
            modification fera l’objet d’une notification au Client (par email ou bandeau sur le site)
            pour les abonnements en cours, au moins 30&nbsp;jours avant son entrée en vigueur. Le
            Client pourra, dans ce délai, résilier son abonnement sans frais s’il refuse les
            modifications.
          </p>

          <h2>14. Droit applicable et juridiction compétente</h2>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, et après tentative
            de résolution amiable et de médiation, les juridictions françaises seront seules
            compétentes, conformément aux règles de droit commun applicables en matière de
            consommation.
          </p>
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}
