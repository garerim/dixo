// =============================================================================
// LEGAL — Politique de confidentialité (RGPD)
// Conformité Règlement (UE) 2016/679 (RGPD) + Loi Informatique et Libertés.
// Dernière révision : 1er mai 2026.
// =============================================================================

import type { Metadata } from "next";
import { MainHeader } from "@/components/main-header";
import { LegalFooter } from "@/components/legal-footer";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Dixo",
  description:
    "Politique de protection des données personnelles applicable sur Dixo (dixo-game.com).",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <MainHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <article className="prose prose-invert max-w-none prose-headings:scroll-mt-24">
          <h1>Politique de confidentialité</h1>
          <p className="text-sm text-muted-foreground">
            En vigueur au 1<sup>er</sup> mai 2026.
          </p>

          <p>
            La présente politique décrit les modalités de collecte, d’utilisation et de protection
            des données personnelles des utilisateurs du site Dixo ({" "}
            <a href="https://www.dixo-game.com">www.dixo-game.com</a>), en application du Règlement
            général sur la protection des données (RGPD — UE 2016/679) et de la loi Informatique et
            Libertés.
          </p>

          <h2>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données est&nbsp;:{" "}
            <strong>Mathéo GARERI</strong>, entrepreneur individuel exerçant sous le nom commercial
            «&nbsp;Gama EI&nbsp;», SIREN 103&nbsp;100&nbsp;061. Contact pour toute question relative
            à la protection des données&nbsp;:{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>.
          </p>
          <p>
            En raison de l’absence de traitement à grande échelle de données sensibles ou de
            surveillance systématique, l’Éditeur n’a pas désigné de Délégué à la Protection des
            Données (DPO) au sens de l’article&nbsp;37 du RGPD. Toute demande peut être adressée à
            l’adresse de contact ci-dessus.
          </p>

          <h2>2. Données collectées</h2>
          <p>L’Éditeur collecte les catégories de données suivantes&nbsp;:</p>

          <h3>2.1. Données fournies par l’utilisateur</h3>
          <ul>
            <li>
              <strong>Compte&nbsp;:</strong> adresse e-mail, pseudo, mot de passe (chiffré), avatar
              (image téléversée par l’utilisateur).
            </li>
            <li>
              <strong>Profil&nbsp;:</strong> bio, préférences (thème, langue, skin de dés
              sélectionné).
            </li>
            <li>
              <strong>Communications in-game&nbsp;:</strong> messages échangés en partie ou via la
              messagerie privée entre amis.
            </li>
            <li>
              <strong>Signalements&nbsp;:</strong> motifs et contenus signalés via la fonction de
              modération.
            </li>
          </ul>

          <h3>2.2. Données générées par l’utilisation du service</h3>
          <ul>
            <li>
              <strong>Activité de jeu&nbsp;:</strong> historique des parties, ELO 1v1 et 4 joueurs,
              statistiques (parties jouées, gagnées, etc.), historique de tournois.
            </li>
            <li>
              <strong>Achats&nbsp;:</strong> historique des transactions Premium et achats de skins,
              identifiants de session Stripe (les données de carte bancaire ne sont jamais stockées
              par l’Éditeur).
            </li>
            <li>
              <strong>Données techniques&nbsp;:</strong> adresse IP, type de navigateur, dates et
              heures de connexion (logs serveur, conservés pour la sécurité et le respect des
              obligations légales).
            </li>
          </ul>

          <h2>3. Finalités et bases légales</h2>
          <table>
            <thead>
              <tr>
                <th>Finalité</th>
                <th>Base légale (RGPD art.&nbsp;6)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Création et gestion du compte utilisateur</td>
                <td>Exécution du contrat (art.&nbsp;6.1.b)</td>
              </tr>
              <tr>
                <td>Fourniture du service de jeu et des fonctionnalités sociales</td>
                <td>Exécution du contrat (art.&nbsp;6.1.b)</td>
              </tr>
              <tr>
                <td>Traitement des paiements et facturation</td>
                <td>Exécution du contrat (art.&nbsp;6.1.b) + obligation légale (art.&nbsp;6.1.c)</td>
              </tr>
              <tr>
                <td>Modération, lutte contre la fraude et le harcèlement</td>
                <td>Intérêt légitime (art.&nbsp;6.1.f)</td>
              </tr>
              <tr>
                <td>Sécurité du service, journalisation, prévention des abus</td>
                <td>Intérêt légitime (art.&nbsp;6.1.f)</td>
              </tr>
              <tr>
                <td>Réponse aux demandes des utilisateurs</td>
                <td>Exécution du contrat / intérêt légitime</td>
              </tr>
              <tr>
                <td>Respect des obligations comptables et fiscales</td>
                <td>Obligation légale (art.&nbsp;6.1.c)</td>
              </tr>
            </tbody>
          </table>

          <h2>4. Destinataires et sous-traitants</h2>
          <p>
            Les données sont accessibles uniquement à l’Éditeur. Elles sont hébergées et traitées par
            les sous-traitants suivants, qui agissent sur instruction de l’Éditeur et présentent des
            garanties suffisantes en matière de protection des données (RGPD art.&nbsp;28)&nbsp;:
          </p>
          <ul>
            <li>
              <strong>Supabase Inc.</strong> (Singapour) — base de données, authentification, e-mails
              transactionnels (vérification, réinitialisation de mot de passe), stockage des avatars.
              Conforme RGPD&nbsp;:{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                supabase.com/privacy
              </a>
              .
            </li>
            <li>
              <strong>Stripe Payments Europe Ltd.</strong> (Irlande) — traitement des paiements et
              gestion des abonnements. Conforme RGPD &amp; PCI-DSS&nbsp;:{" "}
              <a
                href="https://stripe.com/fr/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                stripe.com/fr/privacy
              </a>
              .
            </li>
            <li>
              <strong>Vercel Inc.</strong> (États-Unis) — hébergement de l’application web. Encadré
              par les Clauses Contractuelles Types (CCT) approuvées par la Commission européenne.
              Conforme RGPD&nbsp;:{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                vercel.com/legal/privacy-policy
              </a>
              .
            </li>
          </ul>
          <p>
            Aucune donnée n’est cédée, vendue ou louée à des tiers à des fins commerciales ou
            publicitaires.
          </p>

          <h2>5. Transferts hors Union européenne</h2>
          <p>
            L’hébergement Vercel et certains services Supabase peuvent impliquer un transfert de
            données vers des pays situés hors de l’Union européenne (notamment les États-Unis ou
            Singapour). Ces transferts sont encadrés soit par une décision d’adéquation de la
            Commission européenne (Data Privacy Framework pour les États-Unis le cas échéant), soit
            par les Clauses Contractuelles Types adoptées par la Commission européenne.
          </p>

          <h2>6. Durées de conservation</h2>
          <ul>
            <li>
              <strong>Compte actif&nbsp;:</strong> données conservées tant que le compte est actif.
            </li>
            <li>
              <strong>Compte inactif&nbsp;:</strong> 3&nbsp;ans après la dernière connexion, après
              quoi le compte est supprimé ou anonymisé.
            </li>
            <li>
              <strong>Données de facturation&nbsp;:</strong> 10&nbsp;ans (obligation comptable et
              fiscale, art.&nbsp;L.&nbsp;123-22 du Code de commerce).
            </li>
            <li>
              <strong>Logs de connexion&nbsp;:</strong> 1&nbsp;an (LCEN art.&nbsp;6 II).
            </li>
            <li>
              <strong>Signalements et messages modérés&nbsp;:</strong> 1&nbsp;an après résolution.
            </li>
          </ul>

          <h2>7. Droits de l’utilisateur</h2>
          <p>Conformément aux articles&nbsp;15 à 22 du RGPD, le Client dispose des droits suivants&nbsp;:</p>
          <ul>
            <li>
              <strong>Droit d’accès&nbsp;:</strong> obtenir une copie des données vous concernant.
            </li>
            <li>
              <strong>Droit de rectification&nbsp;:</strong> corriger des données inexactes.
            </li>
            <li>
              <strong>Droit à l’effacement («&nbsp;droit à l’oubli&nbsp;»)&nbsp;:</strong> demander
              la suppression de votre compte et de vos données, sous réserve des obligations légales
              de conservation (facturation notamment).
            </li>
            <li>
              <strong>Droit à la limitation&nbsp;:</strong> restreindre le traitement de vos
              données.
            </li>
            <li>
              <strong>Droit à la portabilité&nbsp;:</strong> recevoir vos données dans un format
              structuré et lisible par machine.
            </li>
            <li>
              <strong>Droit d’opposition&nbsp;:</strong> vous opposer au traitement fondé sur
              l’intérêt légitime.
            </li>
            <li>
              <strong>Droit de définir des directives post-mortem</strong> sur le sort de vos
              données après votre décès.
            </li>
          </ul>
          <p>
            Pour exercer ces droits, écrivez à{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a> en précisant votre
            demande et en joignant si nécessaire une preuve d’identité (carte d’identité). Une réponse
            sera apportée dans un délai maximum d’<strong>un mois</strong>.
          </p>
          <p>
            Vous disposez par ailleurs du droit de déposer une réclamation auprès de la{" "}
            <strong>CNIL</strong> (Commission Nationale de l’Informatique et des Libertés) —{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
              www.cnil.fr
            </a>
            .
          </p>

          <h2>8. Sécurité</h2>
          <p>
            L’Éditeur met en œuvre les mesures techniques et organisationnelles appropriées pour
            garantir un niveau de sécurité adapté au risque&nbsp;: chiffrement des mots de passe
            (hash), connexion HTTPS, contrôle d’accès basé sur les rôles, isolation des données par
            Row-Level Security (RLS) au niveau de la base de données, et journalisation des accès
            sensibles.
          </p>

          <h2>9. Cookies et traceurs</h2>
          <p>Le site Dixo utilise uniquement des cookies <strong>strictement nécessaires</strong> au fonctionnement du service&nbsp;:</p>
          <ul>
            <li>
              <strong>Cookies d’authentification</strong> (Supabase) — permettent de maintenir la
              session de l’utilisateur connecté. Durée&nbsp;: jusqu’à 1&nbsp;an, renouvelés à chaque
              connexion.
            </li>
            <li>
              <strong>Cookie de préférence linguistique</strong> (
              <code>NEXT_LOCALE</code>) — mémorise la langue choisie. Durée&nbsp;: 1&nbsp;an.
            </li>
          </ul>
          <p>
            Ces cookies étant nécessaires au fonctionnement du service, leur dépôt n’est pas soumis
            au consentement préalable de l’utilisateur (art.&nbsp;82 de la loi Informatique et
            Libertés). Aucun cookie publicitaire, de mesure d’audience ou de profilage n’est déposé.
          </p>

          <h2>10. Mineurs</h2>
          <p>
            Le service Dixo est ouvert aux personnes âgées d’<strong>au moins 15&nbsp;ans</strong>.
            Les mineurs doivent obtenir l’accord préalable de leur représentant légal pour s’inscrire
            et effectuer un achat. L’Éditeur se réserve le droit de demander une justification de
            cet accord en cas de doute.
          </p>

          <h2>11. Modification de la présente politique</h2>
          <p>
            La présente politique peut être mise à jour à tout moment. La date de dernière révision
            est indiquée en haut de page. En cas de modification substantielle, les utilisateurs
            seront informés par e-mail ou bandeau sur le site.
          </p>

          <h2>12. Contact</h2>
          <p>
            Pour toute question relative à la présente politique ou à vos données personnelles,
            écrivez à&nbsp;:{" "}
            <a href="mailto:gama.studiodev@gmail.com">gama.studiodev@gmail.com</a>.
          </p>
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}
