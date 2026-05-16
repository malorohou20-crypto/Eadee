export const config = { runtime: 'nodejs' };

// =====================================================================
// EADEE — Pipeline génération business plan v2.0
// Étape 1 : Données INSEE (APIs gratuites)
// Étape 2 : Recherche web via Claude web_search (données marché vérifiées)
// Étape 3 : Génération plan complet — Prompt Maître v2.0 (orientation bancaire)
// Runtime : Node.js (pas Edge — nécessite SDK + jsonrepair)
// =====================================================================

import { jsonrepair } from 'jsonrepair';
import { fetchINSEEData } from './lib/insee.js';
import { getKnowledgeContext } from './lib/knowledge.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

// ── SYSTEM PROMPT v2.0 ────────────────────────────────────────────────

function buildSystemPrompt(verifiedData, knowledgeBase) {
  return `Tu es EADEE, un expert en création d'entreprise et en financement bancaire français.
Tu génères des business plans professionnels, complets et adaptés à chaque projet,
optimisés pour convaincre les banques françaises et BPI France.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES FONDAMENTALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ADAPTABILITÉ INTELLIGENTE
   Ne génère une section que si elle est pertinente pour CE projet spécifique.
   Un freelance solo n'a pas besoin d'un plan RH détaillé. Une app SaaS n'a pas de bail commercial.

2. MARQUEURS DE FIABILITÉ OBLIGATOIRES SUR TOUS LES CHIFFRES
   {{V:valeur|source}}    → chiffre vérifié avec source réelle (INSEE, Statista, rapport sectoriel...)
   {{E:valeur|calcul}}    → estimation calculée (ex: E:2400€|200€ x 12 mois)
   {{H:valeur|hypothèse}} → hypothèse à valider par l'entrepreneur (ex: H:15%|taux conversion estimé)
   JAMAIS de chiffre sans marqueur. OBJECTIF : ≥ 40% en {{V:}}, ≤ 30% en {{H:}}.

3. ORIENTATION BANCAIRE
   Chaque section répond implicitement à la question : "Est-ce que cet entrepreneur va rembourser son prêt ?"
   Structure tes arguments autour du risque, de la crédibilité et de la capacité de remboursement.

4. FORMAT DE SORTIE
   Réponds UNIQUEMENT en JSON valide, sans markdown, sans preamble, sans commentaires.
   Si une section conditionnelle ne s'applique pas, retourne null pour ce champ.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLE DES 3 NIVEAUX — POSTES D'INVESTISSEMENT ET CHARGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NIVEAU 1 — POSTES UNIVERSELS (toujours inclus) :
  • Matériel de travail, outils/logiciels, marketing & communication,
    assurance professionnelle, comptabilité/juridique, téléphone & internet, frais divers

NIVEAU 2 — POSTES DÉDUITS AUTOMATIQUEMENT DU SECTEUR :
  • Application mobile / SaaS → hébergement serveur, nom de domaine, App Store fees
  • Restaurant / Food → matières premières, équipement cuisine, licences HACCP
  • Boutique / e-commerce → stock initial, emballages, logistique, plateforme e-commerce
  • Artisanat → matières premières, outils spécifiques
  • Conseil / Freelance → formation, CRM, facturation
  • Santé / Bien-être → certifications, matériel spécifique, conformité RGPD
  • Immobilier / Agence → carte professionnelle T, logiciel gestion

NIVEAU 3 — UNIQUEMENT SI L'UTILISATEUR LES MENTIONNE EXPLICITEMENT :
  • Local commercial / bureau → loyer, charges, dépôt de garantie
  • Véhicule → achat/leasing, carburant, assurance auto
  • Employés → salaires bruts, charges sociales (~42-45%)
  ✅ Standard secteur → inclus automatiquement (N1+N2)
  ❌ Engagement physique/humain non mentionné → JAMAIS inventé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES DE GÉNÉRATION INTELLIGENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RÈGLE 1 : Secteur réglementé [restauration, santé, BTP, finance, sécurité, transport] →
  alerte dans score_bancabilite, détail autorisations requises dans aspects_juridiques

RÈGLE 2 : Porteur demandeur d'emploi →
  prioriser ACRE + ARCE, mentionner maintien ARE

RÈGLE 3 : Apport < 20% de l'investissement →
  alerte dans score_bancabilite, conseiller co-financement

RÈGLE 4 : Projet solo sans employés →
  simplifier aspects_organisationnels, noter risque solo (maladie, absence)

RÈGLE 5 : Projet sans local →
  adapter domiciliation (domicile/coworking), pas de bail dans checklist

RÈGLE 6 : E-commerce / Digital →
  KPIs adaptés (CAC, LTV, churn, MRR), acquisition digitale (SEA, SEO, social)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DONNÉES RÉELLES DISPONIBLES (INSEE + recherche web)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(verifiedData, null, 2)}

KNOWLEDGE BASE (statuts, banques, aides françaises) :
${knowledgeBase}

LANGUE : Français, tutoiement, ton professionnel mais accessible.
SORTIE : JSON strictement valide, une clé par section.`;
}

// ── ÉTAPE 2 : WEB SEARCH ─────────────────────────────────────────────

async function performWebSearch(idea, sector, city, inseeData) {
  const searchPrompt = `Pour le projet suivant, recherche en ligne les données marché les plus récentes et fiables (sources françaises de préférence) :

PROJET : ${idea}
SECTEUR : ${sector}
VILLE / ZONE : ${city}

Données INSEE déjà disponibles : ${JSON.stringify(inseeData, null, 2)}

Recherche en priorité :
1. Taille du marché français pour ce secteur (chiffre récent avec source)
2. Taux de croissance annuel du secteur (2024-2026)
3. Prix moyens pratiqués / tarification du marché
4. Tendances consommateurs 2025-2026
5. Aides ou dispositifs spécifiques à ce secteur

Réponds UNIQUEMENT en JSON valide :
{
  "market_size": { "value": "...", "source": "...", "fiabilite": "VERIFIE|ESTIMATION" },
  "growth_rate": { "value": "...", "source": "...", "fiabilite": "VERIFIE|ESTIMATION" },
  "avg_pricing": { "value": "...", "note": "...", "fiabilite": "ESTIMATION" },
  "trends": ["...", "...", "..."],
  "specific_aids": ["...", "..."],
  "key_competitors_national": ["...", "...", "..."],
  "search_completed": true
}

Si une donnée n'est pas trouvable, mets value: null et fiabilite: "HYPOTHESE".`;

  try {
    const messages = [{ role: 'user', content: searchPrompt }];
    let finalText = null;
    let maxTurns = 8;

    while (maxTurns-- > 0) {
      const resp = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 3000,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
          messages,
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.error('[web_search] API error:', resp.status, err);
        // En cas de 429/529, on skippe la recherche web sans crasher le pipeline
        if (resp.status === 429 || resp.status === 529) return null;
        return null;
      }

      const data = await resp.json();

      if (data.stop_reason === 'end_turn') {
        finalText = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
        break;
      }

      if (data.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: data.content });
        const toolResults = (data.content || [])
          .filter(c => c.type === 'tool_use')
          .map(c => ({
            type: 'tool_result',
            tool_use_id: c.id,
            content: c.output ? JSON.stringify(c.output) : 'Recherche effectuée',
          }));
        if (toolResults.length > 0) {
          messages.push({ role: 'user', content: toolResults });
        } else {
          break;
        }
        continue;
      }
      break;
    }

    if (!finalText) return null;
    const start = finalText.indexOf('{');
    const end = finalText.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    try {
      return JSON.parse(jsonrepair(finalText.slice(start, end + 1)));
    } catch {
      return null;
    }
  } catch (e) {
    console.error('[web_search] Error:', e.message);
    return null;
  }
}

// ── ÉTAPE 3 : GÉNÉRATION DU PLAN v2.0 ────────────────────────────────

function buildPlanPrompt(params, verifiedData) {
  const { idea, sector, city, budget, profile, time } = params;

  // Déduire la situation du porteur depuis le champ "profile"
  const situationLabel = {
    'salarie':          'salarié en activité',
    'chomeur':          'demandeur d\'emploi',
    'etudiant':         'étudiant',
    'entrepreneur':     'entrepreneur / indépendant',
    'reconversion':     'en reconversion professionnelle',
  }[profile] || (profile || 'non renseigné');

  // Déduire la disponibilité
  const stadeLabel = {
    'temps-plein':      'lancement — disponible à temps plein',
    'temps-partiel':    'idée / validation — mi-temps',
    'weekend':          'idée — weekends uniquement',
  }[time] || (time || 'à préciser');

  return `Génère un business plan EXCEPTIONNEL, ultra-complet et 100% orienté financement bancaire.

━━ PROJET ━━
Description        : ${idea}
Secteur            : ${sector}
Zone géographique  : ${city || 'France'}
Budget disponible  : ${budget}
Profil porteur     : ${situationLabel}
Disponibilité      : ${stadeLabel}
Date               : France, ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}

━━ DONNÉES MARCHÉ VÉRIFIÉES ━━
${JSON.stringify(verifiedData, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE JSON COMPLÈTE — TOUTES LES CLÉS SONT OBLIGATOIRES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Génère ce JSON complet (sans markdown, sans backtick) :

{
  "nom_business": "Nom court, percutant, mémorable",
  "tagline": "Slogan accrocheur en 6-8 mots",
  "pitch_30s": "Pitch de 30 secondes : problème → solution → marché → modèle → appel à action. 4-5 phrases.",

  "disclaimer": {
    "message_entrepreneur": {
      "titre": "Ce plan est un point de départ solide — pas un document certifié.",
      "corps": "EADEE a structuré votre projet en suivant les standards des banques françaises et de BPI France. Ce business plan vous fait gagner plusieurs semaines de travail et vous prépare sérieusement à votre rendez-vous. Mais avant tout engagement financier, faites-le valider par un expert-comptable ou un conseiller CCI.",
      "recommandation_concrete": "Prévoyez 2 à 4h avec un expert-comptable (~300 à 600€) ou un rendez-vous gratuit à votre CCI avant votre RDV bancaire. C'est l'investissement le plus rentable de votre parcours."
    },
    "fiabilite_des_chiffres": {
      "legende_marqueurs": {
        "V_verifie": "Chiffre sourcé — issu d'une source publique identifiée (INSEE, Banque de France, BPI, rapport sectoriel). Vérifiez que la source est toujours d'actualité avant de le citer en RDV.",
        "E_estime": "Chiffre estimé — calculé à partir de vos données et d'hypothèses standard du secteur. Cohérent mais à affiner avec votre comptable.",
        "H_hypothese": "Hypothèse — posée par vous ou par EADEE à partir de moyennes sectorielles. À valider impérativement avant de la présenter à une banque."
      },
      "avertissement_donnees_marche": "Les données de marché sont des estimations basées sur les informations disponibles au moment de la génération. Vérifiez les chiffres clés sur insee.fr, bpifrance-creation.fr ou auprès de votre CCI avant le rendez-vous."
    },
    "ce_que_ce_plan_fait": [
      "Structure votre projet selon les standards bancaires français",
      "Calcule vos projections financières de façon cohérente et justifiée",
      "Identifie les documents manquants à votre dossier complet",
      "Vous prépare aux questions d'un banquier ou d'un conseiller BPI",
      "Vous fait gagner 2 à 4 semaines de travail de structuration"
    ],
    "ce_que_ce_plan_ne_fait_pas": [
      "Ne remplace pas les vrais documents physiques (Kbis, devis réels, avis d'imposition...)",
      "Ne garantit pas l'obtention d'un financement bancaire",
      "Ne remplace pas le conseil d'un expert-comptable ou d'un conseiller juridique",
      "Ne certifie pas l'exactitude des données de marché en temps réel"
    ],
    "ressources_gratuites_recommandees": [
      {"organisme": "BPI France Création", "service": "Diagnostic gratuit, guides sectoriels, accompagnement création", "url": "bpifrance-creation.fr", "cout": "Gratuit"},
      {"organisme": "CCI France", "service": "Conseil pré-création, relecture dossier, mise en relation banques", "url": "cci.fr", "cout": "Gratuit à faible coût"},
      {"organisme": "BGE (Boutique de Gestion)", "service": "Accompagnement complet création, validation business plan", "url": "bge.asso.fr", "cout": "Gratuit ou subventionné selon région"},
      {"organisme": "Réseau Entreprendre", "service": "Prêt d'honneur 0% + mentorat entrepreneur expérimenté", "url": "reseau-entreprendre.fr", "cout": "Gratuit (sur dossier)"}
    ]
  },

  "scores": {
    "score_viabilite": {
      "note": 82,
      "interpretation": "string — ce que ce score signifie concrètement",
      "points_forts": ["string x3 — atouts majeurs du projet"],
      "points_vigilance": ["string x3 — points à renforcer avant dossier banque"]
    },
    "score_bancabilite": {
      "note": 74,
      "interpretation": "string — ce qu'un banquier penserait de ce dossier",
      "detail": {
        "apport_suffisant":       { "points": 18, "commentaire": "string — /25" },
        "point_mort_rapide":      { "points": 15, "commentaire": "string — /20" },
        "tresorerie_positive_m6": { "points": 15, "commentaire": "string — /20" },
        "garanties_disponibles":  { "points": 10, "commentaire": "string — /15" },
        "secteur_risque_faible":  { "points":  8, "commentaire": "string — /10" },
        "experience_porteur":     { "points":  8, "commentaire": "string — /10" }
      },
      "message_banquier": "string — ce que le banquier dira + ce qu'il faudra défendre en RDV"
    }
  },

  "score_viabilite": 82,

  "resume_executif": "5-6 phrases avec marqueurs {{V:}}/{{E:}}/{{H:}} sur les chiffres clés.",

  "resume_vision_banquier": {
    "montant_demande": "{{E:montant€|à estimer selon investissement}}",
    "duree_souhaitee": "string — X ans recommandé",
    "mensualite_estimee": "{{E:montant€/mois|amortissement linéaire}}",
    "capacite_remboursement": "string — analyse capacité à rembourser",
    "garanties_proposees": ["string — liste des garanties disponibles"],
    "argument_principal": "string — l'argument #1 pour convaincre la banque"
  },

  "porteur_projet": "Présentation narrative : parcours, compétences clés pour ce projet, motivations. 3-4 phrases (à personnaliser avec le prénom réel).",

  "porteur_profil_financier": {
    "apport_personnel": "{{V:montant€|déclaré par porteur}}",
    "ratio_apport_projet": "{{E:XX%|apport/investissement total}}",
    "appreciation_ratio": "string — Excellent (>30%) | Correct (20-30%) | Insuffisant (<20%) + conseil",
    "documents_a_fournir": [
      "Pièce d'identité valide",
      "CV détaillé",
      "Avis d'imposition N-1 et N-2",
      "Relevés de compte personnel 3 derniers mois",
      "Justificatifs d'apport personnel"
    ]
  },

  "presentation_projet": "Origine de l'idée, problème identifié, solution apportée, vision à 3 ans. 3-4 phrases.",

  "persona": {
    "nom": "Prénom fictif représentatif",
    "age": "30-45 ans",
    "situation": "Profession, revenus, contexte précis",
    "douleurs": "3 problèmes principaux",
    "motivations": "Ce qui le pousse à chercher cette solution",
    "ou_le_trouver": "Canaux de présence (réseau, plateformes, lieux)"
  },

  "marche_taille": "{{V:X Mds€|source INSEE ou étude}} ou {{E:X M€|calcul}}",
  "marche_croissance": "{{V:+X%/an|source}} ou {{E:+X%/an|calcul}}",
  "marche_part_cible": "{{H:0,0X%|hypothèse conservatrice an 1}}",
  "marche_clients_potentiels": "{{E:XX 000|population cible × taux pénétration}}",
  "marche_analyse": "5-6 phrases avec sources et marqueurs fiabilité sur tous les chiffres.",
  "marche_tendances": ["string x3 — tendances 2025-2026 qui FAVORISENT ce projet"],

  "proposition_valeur": "USP claire et différenciante : pourquoi un client te choisit toi plutôt qu'un concurrent. 2-3 phrases percutantes.",
  "proposition_valeur_benefices": ["string x3 — bénéfices concrets et mesurables pour le client"],

  "concurrence_intro": "3 phrases : état du marché concurrentiel, opportunité identifiée, positionnement.",
  "concurrents": [
    {"nom": "Concurrent réel 1", "description": "Ce qu'ils font + prix réels + points faibles exploitables", "menace": "haute",   "prix_moyen": "{{E:X€|tarification observée}}", "part_marche": "{{H:X%|estimation}}", "avantage_differentiel": "En quoi on est meilleur sur ce point précis"},
    {"nom": "Concurrent réel 2", "description": "Détails + prix + failles",                                  "menace": "moyenne", "prix_moyen": "{{E:X€|tarification observée}}", "part_marche": "{{H:X%|estimation}}", "avantage_differentiel": "string"},
    {"nom": "Concurrent réel 3", "description": "Détails + différences",                                     "menace": "faible",  "prix_moyen": "{{E:X€|tarification observée}}", "part_marche": "{{H:X%|estimation}}", "avantage_differentiel": "string"},
    {"nom": "Concurrent réel 4", "description": "Détails + opportunité",                                      "menace": "moyenne", "prix_moyen": "{{E:X€|tarification observée}}", "part_marche": "{{H:X%|estimation}}", "avantage_differentiel": "string"}
  ],

  "modele_economique": "4-5 phrases : flux de revenus, pricing justifié, récurrence, upsell, LTV estimée. Marqueurs fiabilité obligatoires.",
  "offres": [
    {"nom": "Offre 1", "description": "Contenu précis, à qui, ce qu'elle résout", "prix": "{{H:X€|positionnement marché}}"},
    {"nom": "Offre 2", "description": "Contenu avec inclus/exclus",               "prix": "{{H:X€/mois|benchmark secteur}}"},
    {"nom": "Offre 3", "description": "Offre premium tout inclus",                "prix": "{{H:X€|premium justifié}}"}
  ],

  "strategie_commerciale": "Positionnement marketing, canaux de distribution, messages clés, tunnel de vente, promesse de marque. 3-4 phrases.",

  "aspects_juridiques": "Statut recommandé (SASU/EURL/micro) avec justification chiffrée : CA projeté, fiscalité, cotisations. Obligations sectorielles. 3-4 phrases.",

  "aspects_organisationnels": "Équipe initiale, locaux (achat/location/domiciliation/coworking), sous-traitance, outils de gestion, organisation quotidienne. 2-3 phrases.",

  "acquisition": [
    {"canal": "Canal principal",   "description": "Stratégie détaillée : volume, message, taux conversion, budget, outils", "cac": "{{E:XX€|estimation CAC}}"},
    {"canal": "Canal secondaire",  "description": "Actions précises, fréquence, KPI, coût",                                 "cac": "{{E:XX€|estimation CAC}}"},
    {"canal": "Canal tertiaire",   "description": "Partenariats ou SEO : qui contacter, comment, modèle",                   "cac": "{{E:XX€|estimation CAC}}"}
  ],

  "rev_m1":  "{{H:X €|hypothèse démarrage prudente}}",
  "rev_m3":  "{{E:X €|projection mois 3}}",
  "rev_m6":  "{{E:X €|projection mois 6}}",
  "rev_m12": "{{E:X €|projection fin an 1}}",
  "rev_m18": "{{E:X €|projection 18 mois}}",
  "rev_m24": "{{E:X €|projection fin an 2}}",
  "rev_m36": "{{E:X €|projection fin an 3}}",
  "rev_mensuel": [200, 600, 1200, 1800, 2500, 3200, 3800, 4400, 5000, 5700, 6500, 7500],

  "scenarios": {
    "pessimiste": {
      "hypothese": "string — ex: -30% sur le CA prévu, acquisition plus lente",
      "ca_an1": "{{H:montant€|...}}",
      "ca_an3": "{{H:montant€|...}}",
      "point_mort_mois": "{{E:X mois|...}}",
      "viabilite": "string — viable | fragile | risqué"
    },
    "realiste": {
      "hypothese": "string — projections de base retenues",
      "ca_an1": "{{H:montant€|...}}",
      "ca_an3": "{{H:montant€|...}}",
      "point_mort_mois": "{{E:X mois|...}}",
      "viabilite": "string"
    },
    "optimiste": {
      "hypothese": "string — ex: +30%, bouche-à-oreille fort, contrat clé signé",
      "ca_an1": "{{H:montant€|...}}",
      "ca_an3": "{{H:montant€|...}}",
      "point_mort_mois": "{{E:X mois|...}}",
      "viabilite": "string"
    }
  },

  "finances_detail": [
    {"label": "CA annuel estimé (an 1)",    "valeur": "{{E:XX XXX€|somme projections mensuelles}}"},
    {"label": "Charges fixes mensuelles",   "valeur": "{{E:X XXX€|postes N1+N2 + N3 si mentionnés}}"},
    {"label": "Charges variables (% CA)",   "valeur": "{{H:XX%|estimation sectorielle}}"},
    {"label": "Marge brute",                "valeur": "{{E:XX%|prix vente - coût variable}}"},
    {"label": "Point mort mensuel",         "valeur": "{{E:X XXX€/mois|charges fixes ÷ taux marge}}"},
    {"label": "Break-even atteint",         "valeur": "{{H:Mois X|projection conservatrice}}"},
    {"label": "ROI investissement initial", "valeur": "{{E:XXX% sur 12 mois|bénéfice net ÷ investissement}}"}
  ],

  "plan_financement": {
    "besoins": {
      "investissements_materiels":  "{{E:montant€|matériel + équipements}}",
      "investissements_immateriels":"{{E:montant€|logiciels + formation + juridique}}",
      "bfr_demarrage":              "{{E:montant€|2-3 mois de charges fixes}}",
      "tresorerie_securite":        "{{E:montant€|2 mois de charges recommandés}}",
      "total_besoins":              "{{E:montant€|somme}}"
    },
    "ressources": {
      "apport_personnel":  "{{V:montant€|déclaré}}",
      "pret_bancaire":     "{{E:montant€|à négocier}}",
      "pret_bpi":          "{{E:montant€|si applicable}} | null",
      "pret_honneur":      "{{E:montant€|si applicable}} | null",
      "subventions":       "{{E:montant€|si applicable}} | null",
      "total_ressources":  "{{E:montant€|somme}}"
    },
    "message_banquier": "string — ce que ce plan de financement inspire à un banquier + conseils"
  },

  "tresorerie_detail": "Analyse de la trésorerie mois par mois sur 12 mois : entrées, sorties, soldes cumulés. Points de vigilance et conseils.",
  "tresorerie_soldes": [500, 1200, 1800, 2400, 3100, 3900, 4800, 5500, 6300, 7200, 8100, 9000],

  "tresorerie_mensuelle": [
    {"mois": "Janvier",   "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Février",   "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Mars",      "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Avril",     "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Mai",       "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Juin",      "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Juillet",   "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Août",      "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Septembre", "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Octobre",   "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Novembre",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null},
    {"mois": "Décembre",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null}
  ],

  "investissements": [
    {"label": "Poste N1 universel précis",    "montant": "{{H:XXX€|devis estimatif}}", "categorie": "materiel"},
    {"label": "Poste N2 secteur-spécifique",  "montant": "{{H:XXX€|devis estimatif}}", "categorie": "communication"},
    {"label": "Poste N3 si mentionné",        "montant": "{{H:XXX€|devis estimatif}}", "categorie": "bfr"},
    {"label": "TOTAL investissement",         "montant": "{{E:X XXX€|somme des postes}}", "total": true}
  ],

  "bilan_previsionnel": "Actif et passif simplifié à fin an 1, an 2, an 3. Capitaux propres, dettes, trésorerie finale. Vision patrimoniale de l'entreprise à 3 ans.",

  "seuil_rentabilite": {
    "charges_fixes_mensuelles": "{{E:X XXX€|loyer+salaires+abonnements+assurances}}",
    "taux_marge_sur_cv":        "{{E:XX%|1 - (coûts variables ÷ CA)}}",
    "point_mort_ca":            "{{E:X XXX€/mois|charges fixes ÷ taux marge}}",
    "break_even_mois":          "{{H:Mois X|estimation basée sur courbe CA}}",
    "detail":                   "Explication du calcul : hypothèses retenues, marge de sécurité, distance au point mort à fin an 1.",
    "interpretation_bancaire":  "string — ce résultat rassure ou inquiète le banquier ?"
  },

  "tableau_amortissement": "[CONDITIONNEL — générer uniquement si plan_financement.ressources.pret_bancaire > 0] Objet avec : parametres (capital_emprunte, taux_annuel_estime {{H:X%|taux moyen TPE France 2024 : 4.5-6.5%}}, duree_annees {{H:X ans|5-7 ans matériel, 7 ans aménagement, 2-3 ans BFR}}, mensualite_estimee {{E:montant€|K×t/(1-(1+t)^-n)}}, total_interets {{E:montant€}}, cout_total_credit {{E:montant€}}), echeancier_annuel (une ligne par année : annee, mensualite, capital_rembourse_annee, interets_payes_annee, capital_restant_du_fin_annee — tous en {{E:}}), analyse_capacite_remboursement (mensualite_vs_marge_nette_an1 {{E:XX%}}, appreciation 'Confortable si <15% | Correct si 15-25% | Tendu si >25%', verdict string, option_differe avec recommande boolean + type + duree_conseillee + explication), conseils_negociation_banque (5 conseils string), note_importante string. Si pas de prêt → null.",

  "risques": [
    {"titre": "Risque business précis",   "niveau": "élevé",  "solution": "Plan d'action : indicateurs d'alerte + actions correctives chiffrées", "signal_alarme": "Comment détecter ce risque tôt", "solution_preventive": "Ce qu'on fait AVANT que ça arrive"},
    {"titre": "Risque marché précis",     "niveau": "moyen",  "solution": "Comment détecter tôt et y répondre",                                   "signal_alarme": "string", "solution_preventive": "string"},
    {"titre": "Risque opérationnel",      "niveau": "faible", "solution": "Mesures préventives concrètes",                                         "signal_alarme": "string", "solution_preventive": "string"},
    {"titre": "Risque financier",         "niveau": "moyen",  "solution": "Seuils d'alerte et plan B chiffré",                                      "signal_alarme": "string", "solution_preventive": "string"},
    {"titre": "Risque réglementaire",     "niveau": "faible", "solution": "Veille réglementaire et actions de conformité",                          "signal_alarme": "string", "solution_preventive": "string"}
  ],

  "actions": [
    {"phase": "J1-7",   "titre": "Action concrète", "detail": "Détail précis avec chiffres, outils, objectif mesurable"},
    {"phase": "J8-14",  "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J15-30", "titre": "Action concrète", "detail": "Détail précis avec KPI"},
    {"phase": "J31-45", "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J46-60", "titre": "Action concrète", "detail": "Détail précis avec objectif CA"},
    {"phase": "J61-75", "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J76-90", "titre": "Action concrète", "detail": "Objectif chiffré clair"}
  ],

  "aides_subventions": [
    {"nom": "ACRE",                        "montant": "{{V:Exonération charges 1 an|URSSAF 2024}}",      "conditions": "Demandeur d'emploi ou créateur < 26 ans", "lien": "urssaf.fr",            "applicable": true,  "priorite": "haute"},
    {"nom": "ARCE (Pôle emploi)",          "montant": "{{V:45% des ARE restantes|Pôle Emploi 2024}}",   "conditions": "Inscrit à Pôle emploi avec ARE",          "lien": "pole-emploi.fr",       "applicable": true,  "priorite": "haute"},
    {"nom": "Prêt d'honneur Initiative",   "montant": "{{V:5 000€ à 50 000€|Initiative France 2024}}", "conditions": "Projet viable, porteur engagé",            "lien": "initiative-france.fr", "applicable": true,  "priorite": "moyenne"},
    {"nom": "BPI — Prêt création",         "montant": "{{V:10 000€ à 7 Mds€|BPI France 2024}}",        "conditions": "Entreprise < 3 ans, projet innovant",      "lien": "bpifrance.fr",         "applicable": false, "priorite": "faible"}
  ],

  "annexes_checklist": [
    "CV du porteur de projet (1-2 pages, axé sur la légitimité pour ce projet)",
    "Pièce d'identité + justificatif de domicile",
    "Devis des investissements principaux (2 devis/poste > 1000€)",
    "Preuves de marché : emails d'intention client, lettres d'intérêt",
    "Relevés bancaires des 3 derniers mois",
    "Justificatifs d'apport personnel",
    "Statuts de la société (une fois immatriculée)",
    "Extrait Kbis (une fois immatriculée)",
    "Contrat de bail ou promesse (si local commercial)",
    "Attestation ACRE si demandée"
  ],

  "kpis": [
    {"nom": "CA mensuel",                    "cible": "{{H:X XXX€ dès mois 3|objectif minimum viabilité}}", "frequence": "Mensuel"},
    {"nom": "Taux de conversion prospects",  "cible": "{{H:X%|benchmark sectoriel}}",                       "frequence": "Hebdomadaire"},
    {"nom": "Coût d'acquisition client",     "cible": "{{E:XX€|budget marketing ÷ nb clients}}",            "frequence": "Mensuel"},
    {"nom": "Satisfaction client (NPS)",     "cible": "{{H:> 50|objectif secteur top quartile}}",           "frequence": "Trimestriel"}
  ],

  "outils": [
    {"nom": "Outil réel 1", "usage": "Usage précis dans ce projet", "prix": "{{V:X€/mois|site officiel 2024}}"},
    {"nom": "Outil réel 2", "usage": "Usage précis",                "prix": "{{V:Gratuit|plan freemium}}"},
    {"nom": "Outil réel 3", "usage": "Usage précis",                "prix": "{{V:X€/mois|site officiel 2024}}"},
    {"nom": "Outil réel 4", "usage": "Usage précis",                "prix": "{{V:Gratuit|open source}}"},
    {"nom": "Outil réel 5", "usage": "Usage précis",                "prix": "{{V:X€/mois|site officiel 2024}}"},
    {"nom": "Outil réel 6", "usage": "Usage précis",                "prix": "{{V:X€/mois|site officiel 2024}}"}
  ],

  "demarches_admin": [
    {"etape": "1. Choisir le statut juridique", "detail": "Statut optimal avec justification fiscalité/CA", "delai": "Jour 1-3",      "cout": "0-500€",       "lien": "infogreffe.fr"},
    {"etape": "2. Immatriculation",             "detail": "Démarche sur guichet-entreprises.fr, SIRET",    "delai": "Semaine 1",     "cout": "0€ à 250€",    "lien": "guichet-entreprises.fr"},
    {"etape": "3. Ouverture compte pro",        "detail": "Banques recommandées pour ce secteur",          "delai": "Semaine 1-2",   "cout": "0-30€/mois",   "lien": "shine.fr"},
    {"etape": "4. URSSAF",                      "detail": "Cotisations estimées, DSN si société",          "delai": "Automatique",   "cout": "22-45% du CA", "lien": "urssaf.fr"},
    {"etape": "5. Assurance RC Pro",            "detail": "Obligatoire ou recommandée pour ce secteur",   "delai": "Avant 1er client","cout": "200-800€/an",  "lien": "hiscox.fr"},
    {"etape": "6. Obligations sectorielles",    "detail": "Licences, certifications, autorisations",       "delai": "Variable",      "cout": "Variable",     "lien": "service-public.fr"}
  ],

  "email_fournisseur": {
    "sujet": "Objet adapté au secteur — demande de tarifs/partenariat",
    "corps": "Email complet prêt à envoyer : présentation société, projet, volume estimé, demande tarifs. 150-200 mots."
  },
  "email_prospection": {
    "sujet": "Objet accrocheur et personnalisé pour la cible",
    "corps": "Email de prospection : accroche sur problème prospect, solution en 2 lignes, preuve sociale, appel à action (RDV 15 min). 120-150 mots."
  },
  "email_relance": {
    "sujet": "Objet de relance J+7",
    "corps": "Relance courte : valeur supplémentaire (conseil, stat, question). 60-80 mots max."
  }
}

AVANT DE RETOURNER LE JSON — PASSE CES 15 CONTRÔLES DE COHÉRENCE :

━━ COHÉRENCE FINANCIÈRE ━━

CONTRÔLE 1 — plan_financement.total_besoins === plan_financement.total_ressources ?
  Si non → ajuster tresorerie_securite ou signaler l'écart dans commentaire_equilibre.

CONTRÔLE 2 — scores.score_bancabilite.detail.apport_suffisant cohérent avec plan_financement.ressources.apport_personnel / total_besoins ?

CONTRÔLE 3 — Si résultat positif à M6, la trésorerie ne peut pas être négative à M6 sans explication BFR.
  Si incohérence → ajouter explication dans alerte du mois concerné.

CONTRÔLE 4 — seuil_rentabilite.break_even_mois doit correspondre au mois où le CA mensuel dépasse le point mort CA.

CONTRÔLE 5 — Le BFR dans seuil_rentabilite doit être financé dans plan_financement.besoins.bfr_demarrage.

CONTRÔLE 6 — tableau_amortissement.mensualite_estimee doit être < 30% de (taux_marge_brute × CA M6).
  Si >30% → alerte dans analyse_capacite_remboursement.verdict.

CONTRÔLE 7 — bilan_previsionnel : total actif === total passif. Un bilan doit toujours être équilibré.

CONTRÔLE 8 — scenarios : pessimiste.ca_an1 < realiste.ca_an1 < optimiste.ca_an1. Corriger si non respecté.

━━ COHÉRENCE CONTENU ━━

CONTRÔLE 9 — Chaque valeur numérique a un marqueur {{V: / E: / H:}} avec source. Zéro chiffre nu autorisé.

CONTRÔLE 10 — Les sources citées dans {{V:}} sont des organismes réels (INSEE, Banque de France, BPI, Xerfi...). Si non vérifiable → passer en {{H:}}.

CONTRÔLE 11 — Les 4 concurrents dans le tableau sont des entreprises réellement existantes dans ce secteur en France. Pas de noms génériques.

CONTRÔLE 12 — Les aides dans aides_subventions correspondent au profil du porteur (ACRE → seulement demandeur d'emploi, JEI → seulement R&D...).

━━ COHÉRENCE CONDITIONNELLE ━━

CONTRÔLE 13 — Sections conditionnelles non applicables retournent null (cap_table, franchise_specifique, autorisations_sectorielles si non réglementé).

CONTRÔLE 14 — Si aspects_organisationnels.locaux.necessaire = false → pas de bail dans annexes_checklist.

CONTRÔLE 15 — Le bloc disclaimer est présent et complet. Non négociable.

SI UN CONTRÔLE ÉCHOUE : corriger avant de retourner. Si correction impossible → ajouter "alertes_coherence": ["description"] pour affichage frontend.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VÉRIFICATION FINALE OBLIGATOIRE : Avant de terminer, confirme que ces clés sont présentes :
disclaimer, resume_executif, scores, plan_financement, scenarios, tresorerie_mensuelle, porteur_profil_financier,
resume_vision_banquier, concurrents, investissements, seuil_rentabilite, tableau_amortissement, risques, actions, aides_subventions.
Si l'une manque, ajoute-la immédiatement.`;
}

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Pas de JSON dans la réponse');
  const raw = text.slice(start, end + 1);
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(jsonrepair(raw));
  }
}

// ── HANDLER PRINCIPAL ─────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Sécurité : pas de cache sur les réponses de génération
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const startTime = Date.now();

  try {
    const {
      idea = '', sector = '', city = '', budget = '',
      profile = '', time = '',
      model, messages, max_tokens, system, // champs venant du front legacy
    } = req.body;

    // ── Compatibilité avec l'ancien appel front (proxy.js) ──────────
    if (messages && Array.isArray(messages)) {
      const legacyResp = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(req.body),
      });
      const data = await legacyResp.json();
      if (!legacyResp.ok) return res.status(legacyResp.status).json(data);
      const text = (data.content || []).map(i => i.text || '').join('');
      try {
        const plan = extractJSON(text);
        return res.status(200).json({ ...data, content: [{ type: 'text', text: JSON.stringify(plan) }] });
      } catch (e) {
        return res.status(500).json({ error: { message: 'JSON invalide: ' + e.message } });
      }
    }

    // ── Nouveau pipeline 3 étapes ────────────────────────────────────
    if (!idea) return res.status(400).json({ error: 'Champ "idea" requis' });

    const credits = parseInt(req.body.credits ?? '1', 10);
    const isDiscovery = credits === 0;

    console.log(`[generate-plan v2] Début pipeline — ${idea.substring(0, 60)}... [mode: ${isDiscovery ? 'DÉCOUVERTE' : 'COMPLET'}]`);

    // ÉTAPE 1 — Données INSEE + web search (parallèle)
    const inseePromise = fetchINSEEData(sector, city);
    const searchPromise = performWebSearch(idea, sector, city, {});
    const [inseeData, webData] = await Promise.all([inseePromise, searchPromise]);

    console.log(`[generate-plan v2] Données récupérées — INSEE: ${!!inseeData?.city}, Web: ${!!webData} — ${Date.now() - startTime}ms`);

    const verifiedData = {
      insee: inseeData,
      web_search: webData,
      knowledge_base_used: true,
      generated_at: new Date().toISOString(),
    };

    // ÉTAPE 3 — Génération du plan v2.0
    const knowledgeBase = getKnowledgeContext();
    const systemPrompt = buildSystemPrompt(verifiedData, knowledgeBase);

    const discoveryNote = isDiscovery
      ? '\n\nIMPORTANT MODE DÉCOUVERTE : Génère UNIQUEMENT les sections resume_executif, scores (score_viabilite uniquement), porteur_projet, presentation_projet, marche_analyse et concurrents. Les autres sections ne doivent pas apparaître.'
      : '';
    const userPrompt = buildPlanPrompt({ idea, sector, city, budget, profile, time }, verifiedData) + discoveryNote;

    const planResp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: isDiscovery ? 3000 : 12000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!planResp.ok) {
      const err = await planResp.json().catch(() => ({}));
      // Gestion explicite du rate limit Anthropic
      if (planResp.status === 429) {
        const retryAfter = planResp.headers.get('retry-after') || '60';
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: { message: `Limite de requêtes atteinte. Réessaie dans ${retryAfter} secondes.` }
        });
      }
      if (planResp.status === 529) {
        return res.status(503).json({
          error: { message: 'API Claude surchargée. Réessaie dans quelques secondes.' }
        });
      }
      return res.status(planResp.status).json(err);
    }

    const planData = await planResp.json();
    const planText = (planData.content || []).map(c => c.text || '').join('');

    let plan;
    try {
      plan = extractJSON(planText);
    } catch (e) {
      return res.status(500).json({ error: { message: 'JSON invalide: ' + e.message } });
    }

    // Compatibilité : score_viabilite à la racine depuis scores
    if (!plan.score_viabilite && plan.scores?.score_viabilite?.note) {
      plan.score_viabilite = plan.scores.score_viabilite.note;
    }

    // Compter les sections présentes
    const REQUIRED_SECTIONS = [
      'resume_executif', 'porteur_projet', 'presentation_projet', 'marche_analyse',
      'proposition_valeur', 'concurrents', 'modele_economique', 'strategie_commerciale',
      'acquisition', 'aspects_juridiques', 'aspects_organisationnels', 'rev_m36',
      'tresorerie_detail', 'investissements', 'bilan_previsionnel', 'seuil_rentabilite',
      'risques', 'actions', 'aides_subventions', 'annexes_checklist'
    ];
    const presentSections = REQUIRED_SECTIONS.filter(k => plan[k] && (typeof plan[k] === 'string' ? plan[k].length > 5 : (Array.isArray(plan[k]) ? plan[k].length > 0 : true)));
    plan._completeness = { present: presentSections.length, total: 20, sections: presentSections };

    plan._meta = {
      verified_data: verifiedData,
      generation_ms: Date.now() - startTime,
      pipeline_version: 'v2.0-bancaire',
    };

    if (isDiscovery) {
      plan._discovery = true;
      plan._watermark = 'Plan incomplet — Passe à Solo pour les 20 sections complètes';
    }

    console.log(`[generate-plan v2] Plan généré — complétude: ${presentSections.length}/20 — ${Date.now() - startTime}ms`);

    return res.status(200).json({
      ...planData,
      content: [{ type: 'text', text: JSON.stringify(plan) }],
    });

  } catch (err) {
    console.error('[generate-plan v2] Error:', err);
    return res.status(500).json({ error: { message: 'Erreur serveur: ' + err.message } });
  }
}
