// =============================================================================
// LEGAL — Conditions Générales d'Utilisation (CGU)
// Dernière révision : 1er mai 2026.
// =============================================================================

import type { Metadata } from "next";
import { MainHeader } from "@/components/main-header";
import { LegalFooter } from "@/components/legal-footer";
import { LegalArticle } from "@/components/legal-article";

export const metadata: Metadata = {
  title: "Conditions Générales d’Utilisation — Dixo",
  description: "Règles d’utilisation du service Dixo et de la communauté.",
  robots: { index: true, follow: true },
};

export default function TermsOfUsePage() {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <MainHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <LegalArticle>
          <h1>Conditions Générales d’Utilisation</h1>
          <p className="!mb-8 text-xs uppercase tracking-wider text-muted-foreground/70">
            En vigueur au 1<sup>er</sup> mai 2026
          </p>

          <h2>1. Objet</h2>
          <p>
            Les présentes Conditions Générales d’Utilisation (ci-après «&nbsp;CGU&nbsp;») régissent
            l’accès et l’usage du service de jeu en ligne <strong>Dixo</strong>, accessible à
            l’adresse <a href="https://www.dixo-game.com">www.dixo-game.com</a> (ci-après le
            «&nbsp;Service&nbsp;»), édité par Mathéo GARERI, entrepreneur individuel exerçant sous le
            nom commercial «&nbsp;Gama EI&nbsp;» (ci-après «&nbsp;l’Éditeur&nbsp;»). L’utilisation du
            Service implique l’acceptation pleine et entière des présentes CGU.
          </p>

          <h2>2. Accès au Service et inscription</h2>
          <p>
            L’accès au Service nécessite la création d’un compte gratuit. Pour s’inscrire, l’utilisateur
            doit&nbsp;:
          </p>
          <ul>
            <li>
              être âgé d’au moins <strong>15&nbsp;ans</strong>. Les mineurs doivent disposer de
              l’accord préalable de leur représentant légal&nbsp;;
            </li>
            <li>fournir une adresse e-mail valide&nbsp;;</li>
            <li>choisir un pseudonyme respectant les règles de comportement de l’article 5&nbsp;;</li>
            <li>accepter les présentes CGU et la politique de confidentialité.</li>
          </ul>
          <p>
            Chaque utilisateur ne peut détenir qu’un seul compte. La création de comptes multiples
            («&nbsp;smurf&nbsp;») dans le but de contourner une sanction, fausser le matchmaking ou
            manipuler le classement ELO est strictement interdite.
          </p>

          <h2>3. Description du Service</h2>
          <p>
            Dixo est un jeu de bluff et de dés multijoueur en ligne (variante de Liar’s Dice /
            Perudo) proposant&nbsp;:
          </p>
          <ul>
            <li>parties classées (ranked) et amicales, en 1v1 et jusqu’à 4 joueurs&nbsp;;</li>
            <li>système d’ELO dual (1v1 et 4 joueurs)&nbsp;;</li>
            <li>tournois automatisés réguliers à élimination directe&nbsp;;</li>
            <li>fonctionnalités sociales (amis, messages privés, signalements)&nbsp;;</li>
            <li>cosmétiques (skins de dés, avatars)&nbsp;;</li>
            <li>abonnement Premium optionnel donnant accès à des fonctionnalités additionnelles.</li>
          </ul>
          <p>
            Le Service est fourni «&nbsp;en l’état&nbsp;». L’Éditeur se réserve le droit de modifier,
            ajouter ou supprimer toute fonctionnalité à tout moment.
          </p>

          <h2>4. Compte utilisateur — Sécurité</h2>
          <p>
            L’utilisateur est seul responsable de la confidentialité de ses identifiants et de toute
            activité réalisée depuis son compte. En cas de perte, vol ou utilisation non autorisée
            de son compte, il s’engage à en informer sans délai l’Éditeur à{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>.
          </p>
          <p>
            La cession, le prêt, la vente ou le partage d’un compte sont interdits.
          </p>

          <h2>5. Règles de comportement</h2>
          <p>L’utilisateur s’engage à&nbsp;:</p>
          <ul>
            <li>
              <strong>Respecter autrui</strong>&nbsp;: aucun harcèlement, insulte, discrimination,
              propos haineux, racistes, sexistes, homophobes, transphobes, ou incitant à la violence
              ne sera toléré, que ce soit dans le pseudo, l’avatar, les messages in-game, la
              messagerie privée ou tout autre moyen de communication offert par le Service.
            </li>
            <li>
              <strong>Ne pas tricher</strong>&nbsp;: l’usage de logiciels tiers, bots, scripts,
              d’exploitation de bugs, de comptes multiples («&nbsp;smurf&nbsp;»), de bookmark de
              sessions, de manipulation de classements (par exemple via l’abandon volontaire répété
              ou la collusion entre joueurs) est strictement interdit.
            </li>
            <li>
              <strong>Ne pas spammer</strong>&nbsp;: aucun envoi répété, automatisé ou massif de
              messages, demandes d’ami, signalements abusifs, ou contenu commercial non sollicité.
            </li>
            <li>
              <strong>Respecter la propriété intellectuelle</strong>&nbsp;: ne pas téléverser
              d’avatars protégés par le droit d’auteur sans autorisation, ne pas reproduire ou
              redistribuer le code source, les graphismes ou les contenus du Service.
            </li>
            <li>
              <strong>Ne pas porter atteinte au Service</strong>&nbsp;: pas de tentative
              d’intrusion, d’exploitation de faille, de surcharge volontaire des serveurs, de
              rétro-ingénierie ou de contournement des mesures techniques de protection.
            </li>
            <li>
              <strong>Respecter la loi</strong>&nbsp;: ne pas utiliser le Service à des fins
              illégales (publication de contenus pédopornographiques, apologie du terrorisme,
              menaces, atteinte à la vie privée, usurpation d’identité, etc.).
            </li>
          </ul>

          <h2>6. Signalement et modération</h2>
          <p>
            Le Service intègre un système de signalement permettant à tout utilisateur de notifier un
            comportement contraire aux présentes CGU (motifs disponibles&nbsp;: contenu inapproprié,
            harcèlement, triche, spam, autre). Conformément au Règlement (UE) 2022/2065 sur les
            services numériques (DSA), les signalements sont traités dans un délai raisonnable et
            l’utilisateur signalé peut être informé des suites données à un signalement le concernant.
          </p>
          <p>
            Tout signalement manifestement infondé ou de mauvaise foi peut lui-même donner lieu à
            sanction.
          </p>

          <h2>7. Sanctions</h2>
          <p>
            En cas de violation des présentes CGU, l’Éditeur peut, à sa discrétion et selon la
            gravité des faits, appliquer une ou plusieurs des sanctions suivantes&nbsp;:
          </p>
          <ul>
            <li>
              <strong>Avertissement</strong>&nbsp;: notification adressée à l’utilisateur, sans
              restriction d’accès.
            </li>
            <li>
              <strong>Mute temporaire</strong>&nbsp;: privation de l’accès au chat in-game et/ou à la
              messagerie privée pour une durée définie.
            </li>
            <li>
              <strong>Suspension temporaire</strong>&nbsp;: privation totale d’accès au Service pour
              une durée définie (24&nbsp;h, 7&nbsp;jours, 30&nbsp;jours selon les cas).
            </li>
            <li>
              <strong>Bannissement définitif</strong>&nbsp;: suppression du compte et interdiction
              définitive d’accès au Service. Réservé aux infractions les plus graves ou aux récidives
              avérées.
            </li>
            <li>
              <strong>Réinitialisation des classements</strong>&nbsp;: en cas de manipulation avérée
              de l’ELO ou des résultats de tournoi.
            </li>
            <li>
              <strong>Confiscation des récompenses</strong>&nbsp;: retrait des skins exclusifs
              obtenus en tournoi en cas de fraude.
            </li>
          </ul>
          <p>
            Le bannissement n’ouvre droit à aucun remboursement des sommes éventuellement déjà
            versées (abonnement Premium, achats de skins). L’utilisateur sanctionné peut contester la
            décision en écrivant à{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>&nbsp;; chaque
            réclamation sera examinée dans un délai de 5&nbsp;jours ouvrés.
          </p>

          <h2>8. Contenus générés par les utilisateurs</h2>
          <p>
            Les utilisateurs restent propriétaires des contenus qu’ils publient (pseudonyme, avatar,
            bio, messages). En téléversant un contenu, ils concèdent à l’Éditeur une licence non
            exclusive, gratuite et limitée à la durée nécessaire à l’exploitation du Service, pour
            héberger, afficher et reproduire ce contenu dans le cadre du Service.
          </p>
          <p>
            L’Éditeur peut, à tout moment et sans préavis, supprimer ou modifier un contenu
            manifestement contraire aux présentes CGU ou à la loi.
          </p>

          <h2>9. Disponibilité du Service</h2>
          <p>
            L’Éditeur s’efforce de maintenir le Service accessible 24&nbsp;h/24, 7&nbsp;jours/7. Il
            ne saurait toutefois être tenu pour responsable des interruptions liées à la maintenance,
            à des défaillances de l’hébergeur, à des cas de force majeure ou à toute cause
            indépendante de sa volonté.
          </p>

          <h2>10. Propriété intellectuelle</h2>
          <p>
            Le Service, sa structure, son code source, ses graphismes, son interface, ses sons et
            l’ensemble de ses éléments sont la propriété exclusive de l’Éditeur ou utilisés avec
            l’autorisation de leurs ayants droit. Toute reproduction, modification ou exploitation,
            totale ou partielle, est interdite sans autorisation écrite préalable.
          </p>

          <h2>11. Données personnelles</h2>
          <p>
            Le traitement des données personnelles dans le cadre du Service est régi par la{" "}
            <a href="/legal/privacy-policy">politique de confidentialité</a>, partie intégrante des
            présentes CGU.
          </p>

          <h2>12. Achats et abonnements</h2>
          <p>
            Les modalités d’achat des skins et de souscription à l’abonnement Premium sont régies
            par les <a href="/legal/terms-of-sale">Conditions Générales de Vente</a>.
          </p>

          <h2>13. Suppression du compte par l’utilisateur</h2>
          <p>
            L’utilisateur peut demander la suppression de son compte à tout moment en écrivant à{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>. La suppression
            entraîne la perte définitive de l’ensemble des données associées au compte (skins,
            classement ELO, historique de parties), sans possibilité de récupération. La suppression
            ne dispense pas du règlement des sommes éventuellement dues.
          </p>

          <h2>14. Modification des CGU</h2>
          <p>
            L’Éditeur peut modifier les présentes CGU à tout moment. Les utilisateurs en seront
            informés par e-mail ou par bandeau sur le site. La poursuite de l’utilisation du Service
            après notification vaut acceptation des nouvelles CGU.
          </p>

          <h2>15. Droit applicable et juridiction</h2>
          <p>
            Les présentes CGU sont soumises au droit français. Tout litige relatif à leur
            interprétation ou à leur exécution relève des juridictions françaises compétentes, sous
            réserve des dispositions impératives en matière de consommation.
          </p>

          <h2>16. Contact</h2>
          <p>
            Pour toute question, signalement ou réclamation&nbsp;:{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>.
          </p>
        </LegalArticle>
      </main>
      <LegalFooter />
    </div>
  );
}
