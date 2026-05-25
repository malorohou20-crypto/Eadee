// ========== MODAUX LÉGAUX ==========
const legalContent = {
  mentions: {
    title: 'Mentions légales',
    body: `
      <div class="legal-info-box">!Placeholders à remplacer avant mise en production. Voir CHECKLIST-CONFORMITE.md</div>
      <h3>Éditeur du site</h3>
      <p>
        <strong>Dénomination :</strong> [NOM_ENTREPRISE]<br>
        <strong>Forme juridique :</strong> [FORME_JURIDIQUE]<br>
        <strong>Siège social :</strong> [ADRESSE_SIEGE]<br>
        <strong>SIREN :</strong> [SIREN]<br>
        <strong>SIRET :</strong> [SIRET]<br>
        <strong>Code APE :</strong> [CODE_APE]<br>
        <strong>TVA intracommunautaire :</strong> [TVA_INTRA]
      </p>
      <h3>Directeur de la publication</h3>
      <p><strong>Nom :</strong> [NOM_DIRECTEUR]<br>
      <strong>Email :</strong> contact@eadee.fr</p>
      <h3>Contact</h3>
      <p>Email : <a href="mailto:contact@eadee.fr">contact@eadee.fr</a><br>
      Téléphone : [TELEPHONE]</p>
      <h3>Hébergement</h3>
      <p><strong>Vercel Inc.</strong><br>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br>
      Site : <a href="https://vercel.com" target="_blank">vercel.com</a></p>
      <h3>Propriété intellectuelle</h3>
      <p>L'ensemble du contenu de ce site (textes, images, logotypes, structure) est la propriété exclusive de EADEE. Toute reproduction totale ou partielle est interdite sans autorisation préalable écrite.</p>
      <h3>Responsabilité</h3>
      <p>EADEE s'efforce de maintenir les informations publiées exactes et à jour. EADEE ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site.</p>
      <h3>Droit applicable</h3>
      <p>Le présent site est soumis au droit français. Tout litige sera soumis aux tribunaux compétents de [VILLE].</p>
    `
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    body: `
      <div class="legal-info-box">!Placeholder [DATE_MAJ] et [EMAIL_RGPD] à remplacer. Acheter version complète sur LegalPlace.</div>
      <p><em>Dernière mise à jour : [DATE_MAJ] — Conformément au RGPD (Règlement UE 2016/679) et à la loi Informatique et Libertés.</em></p>
      <h3>1. Responsable du traitement</h3>
      <p>[NOM_ENTREPRISE] — [ADRESSE_SIEGE] — <a href="mailto:contact@eadee.fr">contact@eadee.fr</a></p>
      <h3>2. Données collectées</h3>
      <ul>
        <li><strong>Identification :</strong> email, prénom, mot de passe (hashé)</li>
        <li><strong>Usage :</strong> idées business, plans générés, conversations avec l'Expert Eadee</li>
        <li><strong>Technique :</strong> adresse IP (hashée), user agent, logs d'accès</li>
        <li><strong>Paiement :</strong> traité directement par Stripe — nous ne stockons jamais de numéro de carte</li>
      </ul>
      <h3>3. Bases légales et finalités</h3>
      <ul>
        <li>Exécution du contrat (art. 6.1.b RGPD) — fourniture du service</li>
        <li>Consentement (art. 6.1.a) — cookies non essentiels</li>
        <li>Obligation légale (art. 6.1.c) — facturation, conservation 10 ans</li>
        <li>Intérêt légitime (art. 6.1.f) — statistiques anonymisées, sécurité</li>
      </ul>
      <h3>4. Sous-traitants et transferts hors UE</h3>
      <ul>
        <li><strong>Supabase</strong> (base de données, UE) — profils, plans, conversations</li>
        <li><strong>Vercel Inc.</strong> (hébergement, USA) — couvert par Data Privacy Framework UE-USA</li>
        <li><strong>Anthropic PBC</strong> (IA Claude, USA) — idées envoyées pour génération</li>
        <li><strong>Stripe Inc.</strong> (paiements, USA/Europe) — données de paiement</li>
      </ul>
      <p>Transferts hors UE encadrés par les Clauses Contractuelles Types (CCT) de la Commission européenne.</p>
      <h3>5. Durée de conservation</h3>
      <ul>
        <li>Compte actif : durée de la relation contractuelle</li>
        <li>Compte supprimé : suppression sous 30 jours, sauf factures (10 ans légal)</li>
        <li>Logs techniques : 12 mois</li>
        <li>Consentements cookies : 13 mois (recommandation CNIL)</li>
      </ul>
      <h3>6. Tes droits RGPD</h3>
      <ul>
        <li>Accès, rectification, suppression (disponibles dans Paramètres)</li>
        <li>Portabilité — export JSON dans Paramètres → "Mes données"</li>
        <li>Opposition et limitation du traitement</li>
        <li>Retrait du consentement à tout moment</li>
      </ul>
      <p>Pour exercer tes droits : <a href="mailto:[EMAIL_RGPD]">[EMAIL_RGPD]</a> — réponse sous 30 jours.</p>
      <h3>7. Réclamation</h3>
      <p>En cas de désaccord, tu peux saisir la <a href="https://www.cnil.fr/fr/plaintes" target="_blank">CNIL</a>.</p>
    `
  },
  cgu: {
    title: "Conditions Générales d'Utilisation",
    body: `
      <div class="legal-info-box">![VILLE_TRIBUNAL] à remplacer. Acheter version complète sur LegalPlace.</div>
      <p><em>En vigueur au [DATE_MAJ] — Dernière mise à jour : [DATE_MAJ]</em></p>
      <h3>Article 1 — Objet</h3>
      <p>Les présentes CGU régissent l'accès et l'utilisation de la plateforme Eadee, service de génération de business plans par intelligence artificielle (modèle Anthropic Claude).</p>
      <h3>Article 2 — Accès au service</h3>
      <p>L'accès nécessite la création d'un compte avec une adresse email valide. Tu dois avoir au moins 18 ans. Tu es responsable de la confidentialité de tes identifiants.</p>
      <h3>Article 3 — Description du service</h3>
      <ul>
        <li>Génération automatisée de business plans complets (23 sections)</li>
        <li>Analyse de marché, projections financières, templates d'emails</li>
        <li>Dossier de création d'entreprise pré-rempli</li>
        <li>Conseiller Eadee (assistant IA) disponible 24h/24</li>
      </ul>
      <h3>Article 4 — Nature du service IA</h3>
      <p>Les contenus générés sont produits par intelligence artificielle et fournis à titre indicatif uniquement. Eadee ne garantit pas leur exactitude. Ils ne constituent pas un conseil financier, juridique ou fiscal professionnel. <strong>Faire valider par un professionnel avant tout engagement.</strong></p>
      <h3>Article 5 — Utilisation acceptable</h3>
      <p>Sont interdits : génération de contenu illicite ou frauduleux, tentative de contournement des systèmes, revente commerciale sans accord écrit, toute activité contraire au droit français et européen.</p>
      <h3>Article 6 — Propriété des contenus</h3>
      <p>Les business plans générés t'appartiennent. Eadee conserve le droit d'utiliser des données anonymisées pour améliorer le service.</p>
      <h3>Article 7 — Modification des CGU</h3>
      <p>Eadee peut modifier les CGU avec un préavis de 30 jours par email. La poursuite d'utilisation vaut acceptation.</p>
      <h3>Article 8 — Droit applicable</h3>
      <p>Droit français applicable. Tout litige relève des tribunaux de [VILLE_TRIBUNAL].</p>
    `
  },
  cgv: {
    title: 'Conditions Générales de Vente',
    body: `
      <p><em>En vigueur au 1er janvier 2025</em></p>
      <h3>Article 1 — Offres et tarifs</h3>
      <p>EADEE propose trois formules à la carte, sans abonnement :</p>
      <ul>
        <li><strong>Solo :</strong> 12,99 € TTC — 1 crédit de génération</li>
        <li><strong>Pro :</strong> 29,99 € TTC — pack de 3 générations de business plan + documents complets</li>
        <li><strong>Empire :</strong> 59,99 € TTC — pack de 8 crédits de génération</li>
      </ul>
      <p>Les crédits n'ont pas de date d'expiration. Les packs sont rechargeables à volonté. Les prix s'entendent en euros TTC. EADEE se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.</p>
      <h3>Article 2 — Paiement</h3>
      <p>Le paiement est effectué par carte bancaire via notre prestataire sécurisé Stripe. Il s'agit d'un paiement unique par pack acheté, sans prélèvement récurrent. Toutes les transactions sont sécurisées (protocole SSL/TLS).</p>
      <h3>Article 3 — Durée et résiliation</h3>
      <p>Il n'y a pas d'abonnement ni d'engagement. Chaque pack est un achat unique. Les crédits restants sont disponibles sans limite de durée.</p>
      <h3>Article 4 — Droit de rétractation</h3>
      <p>Conformément à l'article L.221-18 du Code de la consommation, vous disposez d'un <strong>délai de 14 jours</strong> à compter de la souscription pour exercer votre droit de rétractation, sans avoir à justifier de motifs.</p>
      <p>Pour exercer ce droit : <a href="mailto:contact@eadee.fr">contact@eadee.fr</a> en indiquant votre numéro de commande.</p>
      <p><em>Note : le droit de rétractation ne s'applique pas si vous avez expressément demandé l'exécution du service avant la fin du délai de rétractation (article L.221-28 du Code de la consommation).</em></p>
      <h3>Article 5 — Facturation</h3>
      <p>Une facture est émise automatiquement après chaque prélèvement et disponible dans votre espace client.</p>
      <h3>Article 6 — Défaut de paiement</h3>
      <p>En cas d'échec de paiement, l'accès aux fonctionnalités payantes sera suspendu après 3 tentatives infructueuses sur 7 jours. Vos données sont conservées 60 jours après la suspension.</p>
      <h3>Article 7 — Service après-vente</h3>
      <p>Pour toute réclamation : <a href="mailto:contact@eadee.fr">contact@eadee.fr</a>. Réponse garantie sous 48h ouvrées.</p>
      <h3>Article 8 — Médiation</h3>
      <p>En cas de litige non résolu, vous pouvez recourir gratuitement à un médiateur de la consommation conformément à la Directive 2013/11/UE.</p>
    `
  },
  cookies: {
    title: 'Politique de cookies',
    body: `
      <div class="legal-info-box">Conformément aux recommandations de la CNIL (délibération n°2020-091).</div>
      <h3>Qu'est-ce qu'un cookie ?</h3>
      <p>Un cookie est un petit fichier texte déposé sur votre terminal lors de votre visite. Il permet de mémoriser des informations relatives à votre navigation.</p>
      <h3>Cookies utilisés par EADEE</h3>
      <p><strong>Cookies strictement nécessaires (pas de consentement requis) :</strong></p>
      <ul>
        <li><code>eadee_cookie_consent</code> — mémorise votre choix relatif aux cookies</li>
        <li><code>eadee_user</code> — session utilisateur (authentification)</li>
        <li><code>eadee_plan</code> — votre plan d'abonnement actif</li>
      </ul>
      <p><strong>Cookies fonctionnels (avec votre consentement) :</strong></p>
      <ul>
        <li>Mémorisation de vos préférences d'interface</li>
        <li>Historique de vos derniers business plans</li>
      </ul>
      <p><strong>Cookies strictement nécessaires (sans consentement) :</strong></p>
      <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px">
        <thead><tr style="border-bottom:1px solid rgba(228,221,214,0.1)"><th style="text-align:left;padding:6px 8px;color:#7a7060">Nom</th><th style="text-align:left;padding:6px 8px;color:#7a7060">Finalité</th><th style="text-align:left;padding:6px 8px;color:#7a7060">Durée</th></tr></thead>
        <tbody>
          <tr><td style="padding:6px 8px"><code>sb-access-token</code></td><td style="padding:6px 8px">Session Supabase (auth)</td><td style="padding:6px 8px">1 heure</td></tr>
          <tr><td style="padding:6px 8px"><code>sb-refresh-token</code></td><td style="padding:6px 8px">Renouvellement session</td><td style="padding:6px 8px">1 mois</td></tr>
          <tr><td style="padding:6px 8px"><code>eadee_cookie_consent</code></td><td style="padding:6px 8px">Mémorisation du choix CNIL</td><td style="padding:6px 8px">13 mois</td></tr>
          <tr><td style="padding:6px 8px"><code>eadee_history</code></td><td style="padding:6px 8px">Historique local des plans (localStorage)</td><td style="padding:6px 8px">Permanent</td></tr>
          <tr><td style="padding:6px 8px"><code>eadee_session_id</code></td><td style="padding:6px 8px">Identifiant de session anonyme (CNIL)</td><td style="padding:6px 8px">Session</td></tr>
        </tbody>
      </table>
      <p><strong>Cookies analytiques :</strong> Aucun outil de mesure d'audience tiers (Google Analytics, Hotjar, etc.) n'est utilisé.</p>
      <p><strong>Cookies publicitaires :</strong> Aucun cookie publicitaire. Aucun tracking cross-site.</p>
      <h3>Modifier tes préférences</h3>
      <p>Tu peux retirer ton consentement à tout moment :</p>
      <ul>
        <li>Via les paramètres de ton navigateur (suppression des cookies)</li>
        <li>En effaçant le localStorage (données locales)</li>
      </ul>
      <p>La désactivation des cookies essentiels peut affecter le fonctionnement du service (déconnexion, perte de l'historique local).</p>
      <h3>Contact</h3>
      <p>Pour toute question : <a href="mailto:contact@eadee.fr">contact@eadee.fr</a></p>
    `
  }
};

function openLegal(type) {
  const content = legalContent[type];
  if (!content) return;
  document.getElementById('legalModalTitle').textContent = content.title;
  document.getElementById('legalModalBody').innerHTML = content.body;
  document.getElementById('legalModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLegal() {
  document.getElementById('legalModal').style.display = 'none';
  document.body.style.overflow = '';
}

// Fermer avec Escape
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLegal(); });


