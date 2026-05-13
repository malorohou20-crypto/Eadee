export const config = { runtime: 'nodejs' };

// =====================================================================
// EADEE — Pipeline génération business plan (3 étapes)
// Étape 1 : Données INSEE (APIs gratuites)
// Étape 2 : Recherche web via Claude web_search (données marché vérifiées)
// Étape 3 : Génération plan complet avec données consolidées
// Runtime : Node.js (pas Edge — nécessite SDK + jsonrepair)
// v2 — 14000 tokens, 7 jalons crescendo, marqueurs fiabilité, 20 sections forcées
// =====================================================================

import { jsonrepair } from 'jsonrepair';
import { fetchINSEEData } from './lib/insee.js';
import { getKnowledgeContext } from './lib/knowledge.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────

function buildSystemPrompt(verifiedData, knowledgeBase) {
  return `Tu es un expert business plan senior français qui produit des dossiers conformes aux attentes des banques, BPI, et CCI.

MARQUEURS DE FIABILITÉ — OBLIGATOIRES POUR CHAQUE CHIFFRE :
Pour tout chiffre numérique important, utilise ce format inline dans le texte :
- {{V:VALEUR|source exacte}} → donnée VÉRIFIÉE (INSEE, BPI, Xerfi, étude sectorielle citée)
- {{E:VALEUR|méthode de calcul}} → ESTIMATION (calcul sur hypothèses raisonnables)
- {{H:VALEUR|hypothèse utilisée}} → HYPOTHÈSE IA (à valider avant dossier banque)

Exemples corrects :
  "Le marché pèse {{V:2,4 Mds€|INSEE Enquête annuelle 2023}} en France"
  "Marge brute estimée à {{E:68%|prix moyen 45€ − coût variable 14,4€}}"
  "Score de viabilité : {{H:84/100|analyse IA multi-critères}}"

OBJECTIF qualité : ≥ 40 % de chiffres en {{V:...}}, ≤ 30 % en {{H:...}}.

RÈGLES STRICTES SUR LES CHIFFRES :
1. Chaque chiffre marché DOIT être sourcé.
2. Ne JAMAIS inventer un chiffre exact sans source. Préfère une fourchette.
3. Les projections financières listent les hypothèses en début de section.

═══════════════════════════════════════════════════════════════
RÈGLE DES 3 NIVEAUX — POSTES D'INVESTISSEMENT ET CHARGES
Tu DOIS appliquer cette logique à chaque plan pour les sections
"investissements", "seuil_rentabilite" et "finances_detail".
═══════════════════════════════════════════════════════════════

NIVEAU 1 — POSTES UNIVERSELS (toujours inclus, peu importe le projet) :
Ces postes apparaissent dans TOUS les plans, adaptés au contexte :
  • Matériel de travail (ordinateur, périphériques…)
  • Outils et logiciels métier (abonnements SaaS, licences…)
  • Marketing & communication (site web, réseaux sociaux, visuels…)
  • Assurance professionnelle (RC Pro…)
  • Comptabilité / Juridique (expert-comptable, création société…)
  • Téléphone & internet professionnel
  • Frais divers & imprévus (buffer 5-10 %)

NIVEAU 2 — POSTES DÉDUITS AUTOMATIQUEMENT DU SECTEUR :
Identifie le type de projet et ajoute LES postes typiques de ce secteur
SANS que l'utilisateur ait besoin de les mentionner explicitement.
Mapping secteur → postes à ajouter automatiquement :
  • Application mobile / SaaS / Tech
      → hébergement serveur & cloud, nom de domaine + SSL,
        frais de développement (si pas fait en interne), frais App Store / Google Play
  • Restaurant / Food / Traiteur
      → matières premières / approvisionnement, équipement cuisine,
        licences alimentaires & HACCP, emballages/ustensiles
  • Boutique physique ou e-commerce
      → stock initial, emballages & conditionnement, logistique & livraison,
        plateforme e-commerce (Shopify, WooCommerce…)
  • Artisanat / Fabrication
      → matières premières, outils et équipements spécifiques au métier,
        atelier ou espace de production (si mentionné)
  • Conseil / Coaching / Freelance
      → formation & certifications professionnelles,
        outil CRM / gestion client, plateforme de facturation
  • Santé / Bien-être / Beauté
      → certifications et diplômes requis, matériel spécifique,
        conformité RGPD & données santé
  • Immobilier / Agence
      → carte professionnelle T, logiciel de gestion, caution garantie

NIVEAU 3 — POSTES INCLUS UNIQUEMENT SI L'UTILISATEUR LES MENTIONNE :
N'AJOUTE CES POSTES QUE si l'utilisateur en parle EXPLICITEMENT
dans sa description de projet. Ne jamais les inventer ou supposer.
  • Local commercial ou bureau
      → loyer mensuel, charges locatives, dépôt de garantie, travaux d'aménagement
  • Véhicule professionnel
      → achat ou leasing, carburant, assurance auto professionnelle
  • Employés ou associés salariés
      → salaires bruts, charges sociales patronales (~42-45 % du brut)
  • Livraison / flotte
      → véhicules de livraison, partenaires logistiques (Chronopost, Stuart…)
  • Tout équipement très spécifique non standard mentionné par l'utilisateur

RÈGLE D'OR :
  ✅ Standard pour le secteur → inclus automatiquement (Niveau 1 + 2)
  ✅ Mentionné explicitement par l'utilisateur → toujours inclus (Niveau 3)
  ❌ Engagement physique ou humain majeur NON mentionné → JAMAIS inventé
  ❌ Poste spéculatif hors secteur → JAMAIS inventé

EXEMPLES D'APPLICATION :
  • "Je crée une appli mobile" (sans mention de bureau ni d'employés)
      → Niveau 1 + hébergement/domaine/App Store (Niveau 2)
      → PAS de loyer, PAS de salariés
  • "Je veux ouvrir une boulangerie artisanale"
      → Niveau 1 + matières premières/équipement cuisine/licences (Niveau 2)
      → PAS de véhicule (sauf si mentionné), PAS d'employés (sauf si mentionné)
  • "Je crée une appli, j'ai un bureau et deux développeurs"
      → Niveau 1 + Niveau 2 tech + loyer bureau + salaires 2 devs (Niveau 3 mentionné)
═══════════════════════════════════════════════════════════════

DONNÉES RÉELLES DISPONIBLES (issues INSEE + recherche web) :
${JSON.stringify(verifiedData, null, 2)}

KNOWLEDGE BASE INTERNE (statuts, banques, aides françaises) :
${knowledgeBase}

STRUCTURE OBLIGATOIRE — 20 SECTIONS, AUCUNE NE PEUT ÊTRE OMISE :
01. resume_executif
02. porteur_projet
03. presentation_projet
04. etude_marche (marche_taille, marche_croissance, marche_analyse…)
05. analyse_concurrentielle (concurrents)
06. proposition_valeur
07. modele_economique (offres)
08. strategie_commerciale
09. plan_acquisition (acquisition)
10. aspects_juridiques
11. aspects_organisationnels
12. compte_resultat_3ans (rev_m1 → rev_m36, 7 jalons, rev_mensuel[12])
13. tresorerie_detail
14. plan_investissement (investissements)
15. bilan_previsionnel
16. seuil_rentabilite
17. risques
18. plan_action_90jours (actions)
19. aides_subventions
20. annexes_checklist

RÈGLE ANTI-COUPURE : Avant de terminer, vérifie mentalement que les 20 sections JSON sont présentes. Si une manque, ajoute-la immédiatement même sous forme minimale.

LANGUE : Français, tutoiement, ton professionnel mais accessible.
SORTIE : JSON strictement valide, une clé par section. Pas de markdown dans les clés.`;
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
        console.error('[web_search] API error:', err);
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

// ── ÉTAPE 3 : GÉNÉRATION DU PLAN ─────────────────────────────────────

function buildPlanPrompt(params, verifiedData) {
  const { idea, sector, city, budget, profile, time } = params;
  return `Génère un business plan EXCEPTIONNEL, ultra-complet et 100% actionnable pour cet entrepreneur français.

PROJET :
- Idée : ${idea}
- Secteur : ${sector}
- Ville / zone : ${city || 'France'}
- Budget disponible : ${budget}
- Profil porteur : ${profile}
- Disponibilité : ${time}
- Date : France, ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}

DONNÉES MARCHÉ VÉRIFIÉES :
${JSON.stringify(verifiedData, null, 2)}

INSTRUCTION CRITIQUE — TOUTES LES 20 SECTIONS SONT OBLIGATOIRES.
Génère ce JSON complet (sans markdown, sans backtick) :

{
  "nom_business": "Nom court, percutant, mémorable",
  "tagline": "Slogan accrocheur en 6-8 mots",
  "score_viabilite": 82,
  "pitch_30s": "Pitch de 30 secondes : problème → solution → marché → modèle → appel à action. 4-5 phrases.",

  "resume_executif": "5-6 phrases avec marqueurs {{V:}}/{{E:}}/{{H:}} sur les chiffres clés.",

  "porteur_projet": "Template de présentation : Nom/prénom (à compléter), formation, expérience pertinente, compétences clés pour ce projet, motivations personnelles. 150 mots minimum.",

  "presentation_projet": "Origine de l'idée, problème identifié, solution apportée, vision à 3 ans, mission de l'entreprise. 150 mots minimum.",

  "persona": {
    "nom": "Prénom fictif représentatif",
    "age": "30-45 ans",
    "situation": "Description précise",
    "douleurs": "3 problèmes principaux",
    "motivations": "Ce qui le pousse à chercher",
    "ou_le_trouver": "Canaux de présence"
  },

  "marche_taille": "{{V:X Mds€|source INSEE ou étude}} ou {{E:X Mds€|calcul}}",
  "marche_croissance": "{{V:+X%/an|source}} ou {{E:+X%/an|calcul}}",
  "marche_part_cible": "{{H:0,0X%|hypothèse conservatrice an 1}}",
  "marche_clients_potentiels": "{{E:XX 000|population cible × taux pénétration}}",
  "marche_analyse": "5-6 phrases avec sources et marqueurs fiabilité sur tous les chiffres.",

  "proposition_valeur": "USP claire et différenciante : pourquoi un client te choisit toi. 2-3 phrases percutantes.",

  "concurrence_intro": "3 phrases : état du marché concurrentiel, opportunité identifiée, positionnement.",
  "concurrents": [
    {"nom": "Concurrent réel 1", "description": "Ce qu'ils font + prix réels + points faibles exploitables", "menace": "haute", "prix_moyen": "{{E:X€|tarification observée}}", "part_marche": "{{H:X%|estimation}}"},
    {"nom": "Concurrent réel 2", "description": "Détails + prix + failles", "menace": "moyenne", "prix_moyen": "{{E:X€|tarification observée}}", "part_marche": "{{H:X%|estimation}}"},
    {"nom": "Concurrent réel 3", "description": "Détails + différences", "menace": "faible", "prix_moyen": "{{E:X€|tarification observée}}", "part_marche": "{{H:X%|estimation}}"},
    {"nom": "Concurrent réel 4", "description": "Détails + opportunité", "menace": "moyenne", "prix_moyen": "{{E:X€|tarification observée}}", "part_marche": "{{H:X%|estimation}}"}
  ],

  "modele_economique": "4-5 phrases : flux de revenus, pricing justifié, récurrence, upsell, LTV estimée. Marqueurs fiabilité obligatoires.",
  "offres": [
    {"nom": "Offre 1", "description": "Contenu précis, à qui, ce qu'elle résout", "prix": "{{H:X€|positionnement marché}}"},
    {"nom": "Offre 2", "description": "Contenu avec inclus/exclus", "prix": "{{H:X€/mois|benchmark secteur}}"},
    {"nom": "Offre 3", "description": "Offre premium tout inclus", "prix": "{{H:X€|premium justifié}}"}
  ],

  "strategie_commerciale": "Positionnement marketing, canaux de distribution, messages clés, tunnel de vente, promesse de marque. 150 mots minimum.",

  "aspects_juridiques": "Statut recommandé pour ce projet (SASU/EURL/micro…) avec justification chiffrée : CA projeté, fiscalité, cotisations. Includes obligations sectorielles spécifiques.",

  "aspects_organisationnels": "Équipe initiale, locaux nécessaires (achat/location/domiciliation), sous-traitance, outils de gestion, organisation quotidienne. 100 mots minimum.",

  "acquisition": [
    {"canal": "Canal principal", "description": "Stratégie détaillée : volume, message, taux conversion, budget, outils", "cac": "{{E:XX€|estimation CAC par canal}}"},
    {"canal": "Canal secondaire", "description": "Actions précises, fréquence, KPI, coût", "cac": "{{E:XX€|estimation CAC}}"},
    {"canal": "Canal tertiaire", "description": "Partenariats ou SEO : qui contacter, comment, modèle", "cac": "{{E:XX€|estimation CAC}}"}
  ],

  "rev_m1":  "{{H:X €|hypothèse démarrage prudente}}",
  "rev_m3":  "{{E:X €|projection mois 3}}",
  "rev_m6":  "{{E:X €|projection mois 6}}",
  "rev_m12": "{{E:X €|projection fin an 1}}",
  "rev_m18": "{{E:X €|projection 18 mois}}",
  "rev_m24": "{{E:X €|projection fin an 2}}",
  "rev_m36": "{{E:X €|projection fin an 3}}",
  "rev_mensuel": [200, 600, 1200, 1800, 2500, 3200, 3800, 4400, 5000, 5700, 6500, 7500],
  "finances_detail": [
    {"label": "CA annuel estimé (an 1)", "valeur": "{{E:XX XXX€|somme projections mensuelles}}"},
    {"label": "Charges fixes mensuelles", "valeur": "{{E:X XXX€|postes Niv1+Niv2 + Niv3 si mentionnés}}"},
    // RÈGLE : intègre UNIQUEMENT dans les charges les postes validés par les 3 niveaux.
    // Ex : si pas de local mentionné → PAS de loyer dans les charges fixes.
    // Ex : si pas d'employé mentionné → PAS de salaires dans les charges fixes.
    {"label": "Charges variables (% CA)", "valeur": "{{H:XX%|estimation sectorielle}}"},
    {"label": "Marge brute", "valeur": "{{E:XX%|prix vente - coût variable}}"},
    {"label": "Point mort mensuel", "valeur": "{{E:X XXX€/mois|charges fixes ÷ taux marge}}"},
    {"label": "Break-even atteint", "valeur": "{{H:Mois X|projection conservatrice}}"},
    {"label": "ROI investissement initial", "valeur": "{{E:XXX% sur 12 mois|bénéfice net ÷ investissement}}"}
  ],

  "tresorerie_detail": "Analyse de la trésorerie mois par mois sur 12 mois : entrées, sorties, soldes cumulés. Points de vigilance et conseils de gestion.",
  "tresorerie_soldes": [500, 1200, 1800, 2400, 3100, 3900, 4800, 5500, 6300, 7200, 8100, 9000],

  "investissements": [
    // APPLIQUE ICI LA RÈGLE DES 3 NIVEAUX :
    // → Niveau 1 (universels) : toujours présents (matériel, outils, marketing, assurance, compta, téléphone, divers)
    // → Niveau 2 (déduits du secteur) : ajoute les postes typiques de CE secteur sans que l'utilisateur ait à les demander
    // → Niveau 3 (engagement physique/humain) : UNIQUEMENT si l'utilisateur l'a mentionné explicitement
    // → Ne JAMAIS inventer un loyer, des salariés ou un véhicule si non mentionné
    {"label": "Poste Niveau 1 ou 2 précis", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "materiel"},
    {"label": "Poste Niveau 1 ou 2 précis", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "communication"},
    {"label": "Poste Niveau 1 ou 2 précis", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "bfr"},
    {"label": "Poste Niveau 2 secteur-spécifique", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "autres"},
    {"label": "Poste Niveau 3 si mentionné par l'utilisateur", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "autres"},
    {"label": "TOTAL investissement", "montant": "{{E:X XXX€|somme des postes}}", "total": true}
  ],

  "bilan_previsionnel": "Actif et passif simplifié à fin an 1, an 2, an 3. Capitaux propres, dettes, trésorerie finale. Vision patrimoniale de l'entreprise à 3 ans.",

  "seuil_rentabilite": {
    "charges_fixes_mensuelles": "{{E:X XXX€|loyer+salaires+abonnements+assurances}}",
    "taux_marge_sur_cv": "{{E:XX%|1 - (coûts variables ÷ CA)}}",
    "point_mort_ca": "{{E:X XXX€/mois|charges fixes ÷ taux marge}}",
    "break_even_mois": "{{H:Mois X|estimation basée sur courbe CA}}",
    "detail": "Explication du calcul : hypothèses retenues, marge de sécurité, distance au point mort à fin an 1."
  },

  "risques": [
    {"titre": "Risque business précis", "niveau": "élevé", "solution": "Plan d'action : indicateurs d'alerte + actions correctives chiffrées"},
    {"titre": "Risque marché précis", "niveau": "moyen", "solution": "Comment détecter tôt et y répondre"},
    {"titre": "Risque opérationnel", "niveau": "faible", "solution": "Mesures préventives concrètes"},
    {"titre": "Risque financier", "niveau": "moyen", "solution": "Seuils d'alerte et plan B chiffré"},
    {"titre": "Risque réglementaire", "niveau": "faible", "solution": "Veille réglementaire et actions de conformité"}
  ],

  "actions": [
    {"phase": "J1-7", "titre": "Action concrète", "detail": "Détail précis avec chiffres, outils, objectif mesurable"},
    {"phase": "J8-14", "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J15-30", "titre": "Action concrète", "detail": "Détail précis avec KPI"},
    {"phase": "J31-45", "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J46-60", "titre": "Action concrète", "detail": "Détail précis avec objectif CA"},
    {"phase": "J61-75", "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J76-90", "titre": "Action concrète", "detail": "Objectif chiffré clair"}
  ],

  "aides_subventions": [
    {"nom": "ACRE", "montant": "{{V:Exonération charges 1 an|URSSAF 2024}}", "conditions": "Demandeur d'emploi ou créateur < 26 ans", "lien": "urssaf.fr", "applicable": true},
    {"nom": "ARCE (Pôle emploi)", "montant": "{{V:45% des ARE restantes|Pôle Emploi 2024}}", "conditions": "Inscrit à Pôle emploi avec ARE", "lien": "pole-emploi.fr", "applicable": true},
    {"nom": "Prêt d'honneur réseau Initiative", "montant": "{{V:5 000€ à 50 000€|Initiative France 2024}}", "conditions": "Projet viable, porteur engagé", "lien": "initiative-france.fr", "applicable": true},
    {"nom": "BPI — Prêt création", "montant": "{{V:10 000€ à 7 Mds€|BPI France 2024}}", "conditions": "Entreprise < 3 ans, projet innovant ou export", "lien": "bpifrance.fr", "applicable": false}
  ],

  "annexes_checklist": [
    "CV du porteur de projet (1-2 pages, axé sur la légitimité pour ce projet)",
    "Pièce d'identité + justificatif de domicile",
    "Devis des investissements principaux (matériel, travaux)",
    "Preuves de marché : emails d'intention client, lettres d'intérêt",
    "Relevés bancaires des 3 derniers mois",
    "Justificatifs d'apport personnel",
    "Statuts de la société (une fois immatriculée)",
    "Extrait Kbis (une fois immatriculée)",
    "Contrat de bail ou promesse (si local commercial)",
    "Attestation ACRE si demandée"
  ],

  "kpis": [
    {"nom": "CA mensuel", "cible": "{{H:X XXX€ dès mois 3|objectif minimum viabilité}}", "frequence": "Mensuel"},
    {"nom": "Taux de conversion prospects", "cible": "{{H:X%|benchmark sectoriel}}", "frequence": "Hebdomadaire"},
    {"nom": "Coût d'acquisition client (CAC)", "cible": "{{E:XX€|budget marketing ÷ nb clients}}", "frequence": "Mensuel"},
    {"nom": "Satisfaction client (NPS)", "cible": "{{H:> 50|objectif secteur top quartile}}", "frequence": "Trimestriel"}
  ],

  "outils": [
    {"nom": "Outil réel 1", "usage": "Usage précis dans ce projet", "prix": "{{V:X€/mois|site officiel 2024}}"},
    {"nom": "Outil réel 2", "usage": "Usage précis", "prix": "{{V:Gratuit|plan freemium}}"},
    {"nom": "Outil réel 3", "usage": "Usage précis", "prix": "{{V:X€/mois|site officiel 2024}}"},
    {"nom": "Outil réel 4", "usage": "Usage précis", "prix": "{{V:Gratuit|open source}}"},
    {"nom": "Outil réel 5", "usage": "Usage précis", "prix": "{{V:X€/mois|site officiel 2024}}"},
    {"nom": "Outil réel 6", "usage": "Usage précis", "prix": "{{V:X€/mois|site officiel 2024}}"}
  ],

  "demarches_admin": [
    {"etape": "1. Choisir le statut juridique", "detail": "Pour ce projet : statut optimal avec justification fiscalité/CA", "delai": "Jour 1-3", "cout": "0-500€", "lien": "infogreffe.fr"},
    {"etape": "2. Immatriculation", "detail": "Démarche sur guichet-entreprises.fr, documents, SIRET sous 3-5 jours", "delai": "Semaine 1", "cout": "0€ à 250€", "lien": "guichet-entreprises.fr"},
    {"etape": "3. Ouverture compte pro", "detail": "Banques recommandées pour ce secteur avec comparatif", "delai": "Semaine 1-2", "cout": "0-30€/mois", "lien": "shine.fr"},
    {"etape": "4. URSSAF", "detail": "Cotisations estimées pour ce projet, DSN si société", "delai": "Automatique", "cout": "22-45% du CA", "lien": "urssaf.fr"},
    {"etape": "5. Assurance RC Pro", "detail": "Obligatoire ou recommandée pour ce secteur", "delai": "Avant premier client", "cout": "200-800€/an", "lien": "hiscox.fr"},
    {"etape": "6. Obligations sectorielles", "detail": "Licences, certifications, autorisations spécifiques à ce secteur", "delai": "Variable", "cout": "Variable", "lien": "service-public.fr"}
  ],

  "email_fournisseur": {
    "sujet": "Objet adapté au secteur — demande de tarifs/partenariat",
    "corps": "Email complet prêt à envoyer : présentation société, projet, volume estimé, demande tarifs/catalogue. 150-200 mots."
  },
  "email_prospection": {
    "sujet": "Objet accrocheur et personnalisé pour la cible",
    "corps": "Email de prospection : accroche sur problème prospect, solution en 2 lignes, preuve sociale, appel à action clair (RDV 15 min). 120-150 mots."
  },
  "email_relance": {
    "sujet": "Objet de relance J+7",
    "corps": "Relance courte : valeur supplémentaire (conseil, stat, question). 60-80 mots max."
  }
}

VÉRIFICATION FINALE OBLIGATOIRE avant de terminer : Confirme mentalement que les 20 clés suivantes sont présentes dans ton JSON : resume_executif, porteur_projet, presentation_projet, marche_analyse, proposition_valeur, concurrents, modele_economique, strategie_commerciale, acquisition, aspects_juridiques, aspects_organisationnels, rev_m36, tresorerie_detail, investissements, bilan_previsionnel, seuil_rentabilite, risques, actions, aides_subventions, annexes_checklist. Si l'une manque, ajoute-la avant de terminer.`;
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

    console.log(`[generate-plan] Début pipeline — ${idea.substring(0, 60)}... [mode: ${isDiscovery ? 'DÉCOUVERTE' : 'COMPLET'}]`);

    // ÉTAPE 1 — Données INSEE (parallèle avec étape 2)
    const inseePromise = fetchINSEEData(sector, city);
    const searchPromise = performWebSearch(idea, sector, city, {});
    const [inseeData, webData] = await Promise.all([inseePromise, searchPromise]);

    console.log(`[generate-plan] Données récupérées — INSEE: ${!!inseeData?.city}, Web: ${!!webData} — ${Date.now() - startTime}ms`);

    const verifiedData = {
      insee: inseeData,
      web_search: webData,
      knowledge_base_used: true,
      generated_at: new Date().toISOString(),
    };

    // ÉTAPE 3 — Génération du plan
    const knowledgeBase = getKnowledgeContext();
    const systemPrompt = buildSystemPrompt(verifiedData, knowledgeBase);

    const discoveryNote = isDiscovery
      ? '\n\nIMPORTANT MODE DÉCOUVERTE : Génère UNIQUEMENT les sections resume_executif, porteur_projet, presentation_projet, marche_analyse et concurrents. Les autres sections ne doivent pas apparaître.'
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
        max_tokens: isDiscovery ? 3000 : 14000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!planResp.ok) {
      const err = await planResp.json();
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

    // Compter les sections présentes pour le score de complétude
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
      pipeline_version: '3-step-v2',
    };

    if (isDiscovery) {
      plan._discovery = true;
      plan._watermark = "Plan incomplet — Passe à Solo pour les 20 sections complètes";
    }

    console.log(`[generate-plan] Plan généré — complétude: ${presentSections.length}/20 — ${Date.now() - startTime}ms`);

    return res.status(200).json({
      ...planData,
      content: [{ type: 'text', text: JSON.stringify(plan) }],
    });

  } catch (err) {
    console.error('[generate-plan] Error:', err);
    return res.status(500).json({ error: { message: 'Erreur serveur: ' + err.message } });
  }
}
