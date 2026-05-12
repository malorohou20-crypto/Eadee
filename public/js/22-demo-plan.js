// ═══════════════════════════════════════════════════════════════════
// PLAN DÉMO — Données figées pour tester l'UI sans appel API
// Appelle fillPlan(DEMO_PLAN) directement, zéro coût.
// ═══════════════════════════════════════════════════════════════════

const DEMO_PLAN = {
  nom_business: "ZenCoach Pro",
  tagline: "La méditation pour entrepreneurs qui n'ont pas le temps",
  score_viabilite: 81,
  pitch_30s: "85% des entrepreneurs français souffrent de stress chronique, mais les apps de méditation classiques sont trop longues et trop génériques. ZenCoach Pro propose des sessions de 5 minutes ultra-ciblées pour les moments de crise (avant un meeting, après un refus client, lors d'une décision difficile). Notre modèle freemium/abonnement nous permet de monétiser dès le 2e mois. Nous ciblons 50 000 entrepreneurs en France — avec 1% de pénétration, c'est 500 abonnés dès l'an 1.",

  resume_executif: "ZenCoach Pro répond à un besoin réel : {{V:85% des entrepreneurs|INSEE 2023}} souffrent de stress chronique, mais seuls {{V:12%|Etude Ifop 2024}} utilisent une app de bien-être. Notre solution : des sessions de méditation de {{H:5 minutes|format validé par test utilisateurs}} ultra-contextuelles (avant une négo, après un refus, lors d'un doute). Marché adressable : {{E:2,3 Mds€|marché bien-être digital France 2024}}, croissance {{V:+18%/an|Xerfi 2024}}. Objectif an 1 : {{H:500 abonnés payants|hypothèse conservatrice 1% pénétration}}, CA {{E:36 000€|500 × 6€/mois × 12}}. Break-even estimé au {{H:Mois 8|projection sur charges de 2 800€/mois}}.",

  porteur_projet: "Porteur passionné par l'intersection tech et bien-être, avec 5 ans d'expérience en développement d'applications mobiles et une certification de coach de vie obtenue en 2023. A accompagné 80+ entrepreneurs dans la gestion du stress pendant son parcours de coaching. Motivation profonde : avoir vécu le burn-out en 2021 et trouvé dans la méditation la clé de la résilience entrepreneuriale. Compétences clés pour ce projet : développement iOS/Android, marketing digital, réseau entrepreneurial actif.",

  presentation_projet: "ZenCoach Pro est né d'un constat simple : les apps de méditation existantes (Headspace, Calm) sont conçues pour le grand public, pas pour l'entrepreneur sous pression. L'idée est venue lors d'un atelier avec 15 fondateurs de startups qui tous déclaraient 'ne pas avoir le temps' de méditer. Solution : sessions de 5 min déclenchées par des contextes business précis. Vision 3 ans : devenir la référence bien-être pour les entrepreneurs francophones (France, Belgique, Québec). Mission : permettre à chaque entrepreneur de performer sans se détruire.",

  persona: {
    nom: "Sophie",
    age: "34 ans",
    situation: "Fondatrice d'une agence marketing, 2 employés, CA 120k€/an, célibataire sans enfant",
    douleurs: "Difficile de 'débrancher' le soir, ruminations avant les gros meetings, culpabilité de ne pas prendre soin d'elle",
    motivations: "Performer durablement, garder l'énergie pour ses équipes, arrêter le cycle anxiété-burnout",
    ou_le_trouver: "LinkedIn, podcasts entrepreneurs (Génération Do It Yourself), communautés Slack startup"
  },

  marche_taille: "{{V:2,3 Mds€|Xerfi marché bien-être digital France 2024}}",
  marche_croissance: "{{V:+18%/an|Xerfi 2024}}",
  marche_part_cible: "{{H:0,02%|hypothèse conservatrice an 1}}",
  marche_clients_potentiels: "{{E:480 000|entrepreneurs solo + dirigeants PME actifs France}}",
  marche_analyse: "Le marché du bien-être digital en France représente {{V:2,3 Mds€|Xerfi 2024}} et croît de {{V:+18% par an|même source}}. Le segment 'mindfulness professionnelle' est émergent : {{V:67% des DRH|Baromètre Malakoff Humanis 2024}} classent le bien-être mental comme priorité RH n°1. La cible entrepreneurs solo/TPE représente {{V:3,2 millions de personnes|INSEE 2024}}, dont {{E:480 000|15% digitalement actifs et sensibilisés au bien-être}} sont réellement accessibles. La fenêtre d'opportunité est ouverte : les acteurs généralistes (Headspace, Petit Bambou) ne font aucune segmentation métier.",

  proposition_valeur: "{{H:La seule app de méditation conçue pour les moments de crise entrepreneuriale|différenciation validée par 20 interviews}} — pas des sessions génériques, mais des protocoles anti-stress contextuels (avant une négociation, lors d'une décision difficile, après un refus). En 5 minutes, pas 20.",

  concurrence_intro: "Le marché est dominé par des généralistes bien financés, mais aucun ne cible spécifiquement l'entrepreneur. La barrière à l'entrée est le contenu contextuel et la légitimité business — c'est notre avantage durable.",
  concurrents: [
    { nom: "Petit Bambou", description: "Leader français avec 5M d'utilisateurs. App généraliste, bon contenu mais zéro focus professionnel. Abonnement à 59,99€/an. Faiblesse : pas de sessions business-specific.", menace: "haute", prix_moyen: "{{V:5€/mois|site officiel 2024}}", part_marche: "{{H:35%|estimation marché FR}}" },
    { nom: "Headspace", description: "Référence mondiale, quelques contenus pro mais en anglais. Leur section 'Headspace for Work' vise les grandes entreprises (B2B), pas les indépendants. Prix élevé.", menace: "moyenne", prix_moyen: "{{V:12,99€/mois|App Store 2024}}", part_marche: "{{H:20%|estimation marché FR}}" },
    { nom: "Calm", description: "Fort sur le sommeil et la relaxation, faible sur la performance pro. Audience très grand public. Peu de traction en France.", menace: "faible", prix_moyen: "{{V:14,99€/mois|App Store 2024}}", part_marche: "{{H:10%|estimation marché FR}}" },
    { nom: "Coaching indiv.", description: "Coachs bien-être freelance — solution premium (150-300€/h). Concurrent indirect mais positionne notre prix comme une évidence.", menace: "faible", prix_moyen: "{{E:200€/séance|benchmark marché coaching FR}}", part_marche: "{{H:15%|estimation diffuse}}" }
  ],

  modele_economique: "Modèle freemium avec 3 accès gratuits/mois pour créer l'habitude, puis abonnement mensuel {{H:6,99€/mois|benchmark apps bien-être mid-market}} ou annuel {{H:59€/an|remise 30%}}. LTV estimée à {{E:42€|6 mois de rétention moyenne × 6,99€}}. Second flux : licences B2B pour accélérateurs et incubateurs ({{H:290€/mois pour 20 accès|tarif SaaS B2B validé par 3 devis informels}}). Marge brute numérique : {{E:85%|charges variables limitées aux frais de plateforme App Store}}.",
  offres: [
    { nom: "Free", description: "3 sessions/mois, accès aux 5 protocoles de base, sans compte", prix: "{{V:0€|gratuit}}" },
    { nom: "Solo", description: "Sessions illimitées, 30+ protocoles contextuels, suivi stress hebdo, mode hors-ligne", prix: "{{H:6,99€/mois|positionnement mid-market}}" },
    { nom: "Incubateur", description: "Jusqu'à 25 accès Solo, tableau de bord admin, sessions live mensuelles avec coach certifié", prix: "{{H:290€/mois|tarif B2B testé informellement}}" }
  ],

  strategie_commerciale: "Positionnement : 'La méditation pour ceux qui n'ont pas le temps'. Distribution : 100% digital, App Store + Google Play. Tunnel de vente : contenu LinkedIn organique → landing page → essai gratuit (3 sessions) → conversion payant au mois 2. Message clé : 'Stop aux sessions de 20 minutes. 5 minutes avant ton prochain meeting peut tout changer.' Partenariats prioritaires : Station F, BGE, réseau BGE Planète Auto pour accès B2B.",

  aspects_juridiques: "Statut recommandé : {{H:SASU|flexibilité IS + protection sociale TNS si dirigeant seul}}. Avantages : optimisation fiscale dès 15k€ de bénéfices, levée de fonds facilitée ultérieurement. SIREN à obtenir sur guichet-entreprises.fr. Obligations sectorielles : aucune certification médicale requise car positionnement 'bien-être' (pas 'thérapeutique' — distinction juridique critique). Protection de la marque ZenCoach Pro à déposer à l'INPI ({{V:190€|tarif INPI 2024}} pour une classe).",

  aspects_organisationnels: "Structure légère : 1 porteur (dev + marketing), 1 coach certifié en freelance pour le contenu ({{H:400€/contenu|tarif négocié}}). Locaux : 100% télétravail, domiciliation {{H:20-40€/mois|prestataire domiciliation}}. Sous-traitance contenu audio à 2 voix professionnelles. Outils : Figma (design), React Native (dev cross-platform), Stripe (paiements), RevenueCat (abonnements in-app).",

  acquisition: [
    { canal: "LinkedIn organique", description: "3 posts/semaine ciblant entrepreneurs et fondateurs : témoignages, conseils anti-stress, coulisses du projet. Objectif : 500 abonnés qualifiés en 3 mois, 5% de conversion vers essai gratuit.", cac: "{{E:0€|organique (temps seulement)}}" },
    { canal: "Communautés niche", description: "Présence active dans 10 Slack/Discord d'entrepreneurs FR (IndieHackers FR, Failory, 1000 Entrepreneurs). Apport de valeur avant toute promo. 1 session AMA par mois.", cac: "{{E:12€|temps valorisé à 50€/h, 15min/jour}}" },
    { canal: "Partenariats B2B", description: "Approche directe de 30 incubateurs et accélérateurs FR (Station F, Pepite, BGE). Offre : 2 mois gratuits pour leurs cohortes. Objectif : 5 partenaires en 6 mois.", cac: "{{E:140€|temps devis + démo + suivi par prospect}}" }
  ],

  rev_m1: "{{H:0€|phase build — pas de revenus}}",
  rev_m3: "{{E:1 400€|200 utilisateurs × 7€, taux conversion 10%}}",
  rev_m6: "{{E:4 200€|600 abonnés × 7€}}",
  rev_m12: "{{E:8 400€|1 200 abonnés + 2 contrats B2B}}",
  rev_m18: "{{E:12 600€|1 800 abonnés + 5 B2B}}",
  rev_m24: "{{E:18 900€|2 700 abonnés + 8 B2B}}",
  rev_m36: "{{E:34 000€|4 500 abonnés + 15 B2B}}",
  rev_mensuel: [0, 420, 1400, 2100, 2800, 4200, 5040, 5880, 6720, 7560, 8400, 9240],

  finances_detail: [
    { label: "CA annuel estimé (an 1)", valeur: "{{E:53 340€|somme mensuelle}}" },
    { label: "Charges fixes mensuelles", valeur: "{{E:2 800€|dev tools + hébergement + freelance}}" },
    { label: "Charges variables (% CA)", valeur: "{{H:15%|frais App Store + Stripe}}" },
    { label: "Marge brute", valeur: "{{E:85%|modèle SaaS}}" },
    { label: "Point mort mensuel", valeur: "{{E:3 300€/mois|charges ÷ taux marge}}" },
    { label: "Break-even atteint", valeur: "{{H:Mois 8|projection conservatrice}}" },
    { label: "ROI investissement initial", valeur: "{{E:280% sur 18 mois|bénéfice ÷ invest initial}}" }
  ],

  tresorerie_detail: "La trésorerie est critique les 4 premiers mois ({{E:-2 000€ à -800€|avant les premiers revenus significatifs}}). Le pic de tension se situe au mois 2 lors de la mise en production de l'app (frais dev + comptes développeurs). À partir du mois 5, les entrées couvrent les charges fixes. Vigilance : les commissions App Store ({{V:30% des achats in-app|Apple 2024}}, {{V:15% si CA < 1M€|programme Small Business}}) impactent directement la trésorerie nette.",
  tresorerie_soldes: [-500, -1800, -800, 200, 1100, 2400, 3600, 4900, 6300, 7800, 9400, 11000],

  investissements: [
    { label: "Développement app (React Native)", montant: "{{H:3 500€|devis freelance × 3 semaines}}", categorie: "materiel" },
    { label: "Design UI/UX + branding", montant: "{{H:800€|designer freelance}}", categorie: "communication" },
    { label: "Production contenus audio (10 sessions)", montant: "{{H:600€|voix pro × 10 scripts}}", categorie: "communication" },
    { label: "Marketing lancement (3 mois)", montant: "{{H:500€|LinkedIn Ads test A/B}}", categorie: "communication" },
    { label: "Juridique + immatriculation", montant: "{{V:300€|frais INPI + greffe}}", categorie: "autres" },
    { label: "BFR (fonds de roulement)", montant: "{{E:800€|3 mois de charges fixes mini}}", categorie: "bfr" },
    { label: "TOTAL investissement", montant: "{{E:6 500€|somme des postes}}", total: true }
  ],

  bilan_previsionnel: "Fin an 1 : actif total {{E:12 000€|trésorerie + créances}}, capitaux propres {{E:8 500€|apport + bénéfice cumulé}}, dettes {{E:3 500€|dettes fournisseurs court terme}}. Fin an 2 : capitaux propres passent à {{E:28 000€|accumulation des bénéfices}}, aucune dette bancaire. Fin an 3 : bilan sain avec {{E:55 000€|capitaux propres}}, position nette très positive permettant un premier recrutement ou une levée de fonds seed.",

  seuil_rentabilite: {
    charges_fixes_mensuelles: "{{E:2 800€|abonnements SaaS + freelance + hébergement}}",
    taux_marge_sur_cv: "{{E:85%|1 - frais App Store 15%}}",
    point_mort_ca: "{{E:3 300€/mois|2 800€ ÷ 85%}}",
    break_even_mois: "{{H:Mois 8|projection conservative}}",
    detail: "Avec des charges fixes de {{E:2 800€/mois}} et une marge sur coûts variables de {{E:85%}}, le point mort est atteint à {{E:3 300€ de CA mensuel}}, soit environ {{H:470 abonnés à 7€|calcul}} ou {{H:380 abonnés à 7€ + 2 contrats B2B à 290€}}. La projection indique l'atteinte du seuil au mois 8, avec une marge de sécurité de 15% fin an 1."
  },

  risques: [
    { titre: "Rétention faible — utilisateurs qui abandonnent après 2 semaines", niveau: "élevé", solution: "Push notifications intelligentes, gamification du streak de méditation, email séquence d'onboarding 7 jours. Alarme si taux rétention J30 < 30%." },
    { titre: "Concurrence d'un géant avec feature similaire (Headspace, Calm)", niveau: "moyen", solution: "Surveillance Trustpilot + Product Hunt mensuelle. Pivot possible vers ultra-niche (médecins, avocats). Différenciation par communauté et coach live." },
    { titre: "Refus App Store Review pour contenu médical perçu", niveau: "faible", solution: "Wording validé par juriste : 'bien-être' et non 'thérapeutique'. Dossier legal préparé. Compte développeur Apple actif avant soumission." },
    { titre: "Chiffre d'affaires insuffisant pour couvrir les charges au mois 6", niveau: "moyen", solution: "Seuil d'alerte à 150 abonnés au mois 4. Plan B : pivot B2B accéléré (un seul contrat incubateur couvre 50% des charges). Reserve de 2 mois de charges." },
    { titre: "Dépendance technique à une seule plateforme (React Native)", niveau: "faible", solution: "Documentation technique complète, backup hebdomadaire sur GitHub. Deuxième dev freelance identifié pour urgences." }
  ],

  actions: [
    { phase: "J1-7",   titre: "Immatriculation + comptes dev", detail: "Créer SASU sur guichet-entreprises.fr, ouvrir compte Shine Pro, créer comptes Apple Developer (99$/an) et Google Play (25$). Installer environnement React Native." },
    { phase: "J8-14",  titre: "Brief design + contenus", detail: "Brief designer sur Malt.fr, sélectionner 2 voix pour production audio, écrire les 10 premiers scripts de méditation contextuels." },
    { phase: "J15-30", titre: "MVP app — version alpha", detail: "Développer le core de l'app : 5 sessions, onboarding, compte gratuit. Objectif : APK testable par 10 bêta-testeurs. KPI : 80% des testeurs complètent une session." },
    { phase: "J31-45", titre: "Bêta privée (50 utilisateurs)", detail: "Recruter 50 entrepreneurs via LinkedIn + réseau perso. Collecte feedback structuré (Typeform). Itération sur UX selon retours." },
    { phase: "J46-60", titre: "Soumission App Store + lancement contenu", detail: "Soumettre l'app (délai review 1-3 jours). Lancer la série LinkedIn '5 min pour entrepreneurs'. Objectif : 300 abonnés LinkedIn, 100 téléchargements dès la sortie." },
    { phase: "J61-75", titre: "Activation canaux acquisition", detail: "Contacter 15 incubateurs pour partenariats. Lancer 1 AMA dans la communauté IndieHackers FR. Objectif : 3 rendez-vous B2B qualifiés." },
    { phase: "J76-90", titre: "Premier bilan + pivot si besoin", detail: "Bilan : downloads, taux conversion free→payant, NPS. Si < 80 abonnés payants → accélérer pivot B2B. Si ≥ 80 → doubler le contenu LinkedIn. CA cible J90 : 1 400€." }
  ],

  aides_subventions: [
    { nom: "ACRE", montant: "{{V:Exonération charges 1 an|URSSAF 2024}}", conditions: "Demandeur emploi ou moins de 26 ans à la création", lien: "urssaf.fr", applicable: true },
    { nom: "ARCE Pôle Emploi", montant: "{{V:45% des ARE restantes|Pôle Emploi 2024}}", conditions: "Inscrit Pôle emploi avec droits ARE en cours", lien: "francetravail.fr", applicable: true },
    { nom: "Prêt d'honneur Initiative France", montant: "{{V:5 000€ à 50 000€|Initiative France 2024}}", conditions: "Projet viable, porteur engagé, sans garantie personnelle", lien: "initiative-france.fr", applicable: true },
    { nom: "BPI — Prêt création numérique", montant: "{{V:10 000€ à 50 000€|BPI France 2024}}", conditions: "Entreprise numérique < 3 ans, business plan solide", lien: "bpifrance.fr", applicable: false }
  ],

  annexes_checklist: [
    "CV du porteur (1-2 pages, axé sur expérience tech + coaching)",
    "Pièce d'identité + justificatif de domicile",
    "Devis du développeur freelance",
    "Devis de la voix professionnelle pour contenu audio",
    "Captures écran du prototype Figma (MVP validé)",
    "Preuves de marché : 20 retours utilisateurs bêta",
    "Relevés bancaires 3 derniers mois",
    "Statuts de la SASU signés",
    "Extrait Kbis (après immatriculation)",
    "Attestation ACRE si applicable"
  ],

  kpis: [
    { nom: "Abonnés payants", cible: "{{H:80 à J90|objectif minimum}}", frequence: "Hebdomadaire" },
    { nom: "Taux rétention J30", cible: "{{H:> 35%|benchmark apps bien-être}}", frequence: "Mensuel" },
    { nom: "CAC moyen", cible: "{{E:< 15€|budget ÷ nb abonnés}}", frequence: "Mensuel" },
    { nom: "NPS utilisateurs", cible: "{{H:> 45|objectif top-quartile}}", frequence: "Trimestriel" }
  ],

  outils: [
    { nom: "React Native", usage: "Développement app iOS + Android cross-platform", prix: "{{V:Gratuit|open source}}" },
    { nom: "RevenueCat", usage: "Gestion abonnements in-app + analytics revenu", prix: "{{V:Gratuit < 2 500$/mois MRR|revenucat.com}}" },
    { nom: "Stripe", usage: "Paiements web + licences B2B", prix: "{{V:1,4% + 0,25€/transaction|stripe.com}}" },
    { nom: "Notion", usage: "Roadmap produit, suivi KPIs, CRM basique", prix: "{{V:Gratuit plan solo|notion.so}}" },
    { nom: "Malt", usage: "Recrutement freelances (dev, design, voix)", prix: "{{V:Gratuit|commission côté freelance}}" },
    { nom: "Buffer", usage: "Planification des posts LinkedIn", prix: "{{V:0€ plan gratuit 3 canaux|buffer.com}}" }
  ],

  demarches_admin: [
    { etape: "1. Choisir le statut : SASU", detail: "Rédiger les statuts (modèle gratuit sur guichet-entreprises.fr), dépôt du capital social (1€ minimum)", delai: "Jour 1-3", cout: "0€ à 300€ si expert-comptable", lien: "guichet-entreprises.fr" },
    { etape: "2. Immatriculation SASU", detail: "Dépôt dossier complet sur guichet-entreprises.fr, SIRET reçu sous 3-5 jours ouvrés", delai: "Semaine 1", cout: "0€ en ligne", lien: "guichet-entreprises.fr" },
    { etape: "3. Ouverture compte pro", detail: "Shine (0€/mois) ou Qonto (9€/mois) recommandés pour TPE digital. IBAN professionnel obligatoire pour la SASU.", delai: "Semaine 1-2", cout: "0-9€/mois", lien: "shine.fr" },
    { etape: "4. Comptes développeurs", detail: "Apple Developer Program (99$/an), Google Play Console (25$ unique). Obligatoires pour publier l'app.", delai: "Jour 1", cout: "~115€", lien: "developer.apple.com" },
    { etape: "5. Dépôt marque INPI", detail: "Déposer 'ZenCoach Pro' en classe 42 (logiciels) sur inpi.fr. Protection 10 ans renouvelable.", delai: "Semaine 2", cout: "190€ pour 1 classe", lien: "inpi.fr" }
  ],

  email_fournisseur: {
    sujet: "Demande de devis — Production 10 sessions audio bien-être (format MP3)",
    corps: "Bonjour,\n\nJe développe ZenCoach Pro, une application mobile de bien-être pour entrepreneurs. Je recherche une voix professionnelle (ton chaleureux, posé, inspirant confiance) pour produire 10 sessions audio de méditation guidée.\n\nCaractéristiques techniques :\n- Format : MP3, 128kbps minimum\n- Durée par session : 3-5 minutes\n- Scripts fournis et validés\n- Livraison : 3 semaines\n\nPourriez-vous me communiquer vos tarifs pour ce volume ? Je suis disponible pour un call de 15 minutes cette semaine.\n\nCordialement,\n[Prénom Nom]\nFondateur, ZenCoach Pro"
  },
  email_prospection: {
    sujet: "Vos coachs et entrepreneurs méditent-ils en 5 minutes ?",
    corps: "Bonjour [Prénom],\n\nJe remarque que vous accompagnez des entrepreneurs chez [Incubateur/Accélérateur]. Saviez-vous que 85% d'entre eux déclarent manquer de temps pour prendre soin de leur santé mentale ?\n\nJ'ai développé ZenCoach Pro : des sessions de méditation de 5 minutes conçues pour les moments de crise entrepreneuriale (avant une négo, après un refus, lors d'une décision difficile).\n\nJe propose 2 mois gratuits pour votre prochaine cohorte (jusqu'à 25 personnes). En échange : vos retours pour améliorer le produit.\n\nIntéressé·e pour en discuter 15 minutes cette semaine ?\n\nCordialement,\n[Prénom Nom]"
  },
  email_relance: {
    sujet: "Re: ZenCoach Pro — 1 entrepreneuse sur 3 de votre cohorte l'utilise déjà",
    corps: "Bonjour [Prénom],\n\nJe vous relance suite à mon message de la semaine dernière.\n\nBonne nouvelle : 3 fondatrices de votre réseau ont déjà téléchargé ZenCoach Pro et nous ont donné un NPS de 72. Je serais ravi de vous montrer leurs retours.\n\n15 minutes cette semaine ?\n\n[Prénom Nom]"
  },

  _completeness: { present: 20, total: 20 }
};

// ── Charger le plan démo dans l'UI ──────────────────────────────────
function loadDemoPlan() {
  if (typeof fillPlan !== 'function') {
    alert('fillPlan() non disponible — assure-toi que 20-generator.js est chargé.');
    return;
  }

  // Simuler un vrai plan chargé (pour les fonctions qui vérifient currentResult)
  currentResult = { ...DEMO_PLAN, idea: 'App méditation entrepreneurs', date: new Date(), id: Date.now(), _demo: true };

  // Afficher la section résultat
  const el = document.getElementById('dashEmptyState');
  if (el) el.style.display = 'none';
  const gen = document.getElementById('dashGenerating');
  if (gen) gen.style.display = 'none';
  setPreviewState(null);
  document.getElementById('dashResult').style.display = 'flex';

  // Remplir le plan
  fillPlan(DEMO_PLAN);

  // Animation
  setTimeout(() => animatePlanSections(), 100);

  console.log('[DEMO] Plan chargé sans appel API ✓');
}
