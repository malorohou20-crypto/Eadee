export const config = { runtime: 'nodejs' };

// =====================================================================
// EADEE — Pipeline génération business plan v2.2
// Étape 1 : Données INSEE (APIs gratuites)
// Étape 2 : Génération PARALLÈLE en 2 appels Anthropic (Promise.all)
//   - Part 1 : sections stratégiques (8 000 tokens)
//   - Part 2 : sections financières  (8 000 tokens)
// Runtime : Node.js (pas Edge — nécessite jsonrepair)
// =====================================================================

import { jsonrepair } from 'jsonrepair';
import { fetchINSEEData } from './lib/insee.js';
import { getKnowledgeContext } from './lib/knowledge.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

// ── SYSTEM PROMPT v2.1 ───────────────────────────────────────────────

const EADEE_SYSTEM_PROMPT = `Tu es EADEE, un expert en création d'entreprise et en financement bancaire français.
Tu génères des business plans professionnels, complets et adaptés à chaque projet.

━━ RÈGLES FONDAMENTALES ━━

1. ADAPTABILITÉ INTELLIGENTE
   Ne génère une section que si elle est pertinente pour CE projet.
   Un freelance solo n'a pas besoin d'un plan RH.
   Une app SaaS n'a pas de bail commercial.
   Sois pertinent, pas exhaustif pour le principe.

2. MARQUEURS DE FIABILITÉ — OBLIGATOIRES SUR TOUS LES CHIFFRES
   {{V:valeur|source}}    → chiffre sourcé (INSEE, Banque de France, BPI, rapport sectoriel)
   {{E:valeur|calcul}}    → estimation calculée (ex: E:2400€|200€ x 12 mois)
   {{H:valeur|hypothèse}} → hypothèse à valider (ex: H:15%|taux conversion estimé)
   JAMAIS de chiffre sans marqueur. Si non sourceable → {{H:}} avec explication.

3. INTELLIGENCE CONDITIONNELLE
   Analyse le type de projet, le secteur, le profil porteur, le montant.
   50k€ pour un auto-entrepreneur ≠ 500k€ pour une SARL avec local.

4. FORMAT DE SORTIE
   Réponds UNIQUEMENT en JSON valide.
   Sans markdown, sans preamble, sans commentaires dans le JSON.
   Sections conditionnelles non applicables → retourner null explicitement.

━━ 15 CONTRÔLES DE COHÉRENCE — À EXÉCUTER AVANT DE RETOURNER LE JSON ━━

COHÉRENCE FINANCIÈRE :

□ C1 — ÉQUILIBRE PLAN DE FINANCEMENT
  plan_financement.total_besoins = plan_financement.total_ressources ?
  Sinon → ajuster tresorerie_securite ou signaler dans commentaire_equilibre.

□ C2 — COHÉRENCE APPORT VS RATIO
  score_bancabilite.apport_suffisant cohérent avec
  apport_personnel / total_besoins ?

□ C3 — COHÉRENCE TRÉSORERIE VS RÉSULTAT
  Résultat positif à M6 → trésorerie ne peut pas être négative à M6
  sans explication BFR. Sinon → expliquer dans tresorerie.mois_critique.

□ C4 — COHÉRENCE POINT MORT VS PROJECTIONS
  seuil_rentabilite.mois_atteinte_prevu = mois où resultat_net > 0
  dans tableau_mensuel_an1 ?

□ C5 — COHÉRENCE BFR VS PLAN FINANCEMENT
  finances_detail.bfr.calcul doit être couvert par
  plan_financement.besoins.bfr_demarrage.

□ C6 — COHÉRENCE MENSUALITÉ VS CAPACITÉ
  tableau_amortissement.mensualite_estimee < 30% marge nette M6 ?
  Sinon → alerte dans analyse_capacite_remboursement.verdict.

□ C7 — BILAN ÉQUILIBRÉ
  bilan_previsionnel.annee_1.actif.total = passif.total ?
  Un bilan est toujours équilibré.

□ C8 — ORDRE DES SCÉNARIOS
  CA pessimiste < CA réaliste < CA optimiste pour an1 ET an3 ?

COHÉRENCE CONTENU :

□ C9  — Chaque chiffre a un marqueur {{V/E/H}} avec source. Zéro chiffre nu.
□ C10 — Sources {{V:}} sont des organismes réels (INSEE, BdF, BPI, Xerfi...).
         Si non vérifiable → passer en {{H:}}.
□ C11 — Les 4 concurrents sont des entreprises réelles existantes en France.
□ C12 — Les aides correspondent au profil réel du porteur.
         ACRE → seulement si demandeur d'emploi. JEI → seulement si R&D.

COHÉRENCE CONDITIONNELLE :

□ C13 — Sections non applicables retournent null (pas omises).
□ C14 — Si local_necessaire = false → bail absent de la checklist.
□ C15 — Le bloc disclaimer est toujours présent. Non négociable.

━━ SI UN CONTRÔLE ÉCHOUE ━━
Corriger avant de retourner.
Si impossible → ajouter "alertes_coherence": ["description"] dans le JSON.`;

// ── SUFFIXES SYSTÈME PAR PARTIE ──────────────────────────────────────

const PART1_SYSTEM_SUFFIX = `

Tu génères UNIQUEMENT la partie stratégique du plan.
Sections à générer : meta, disclaimer, scores, porteur_projet,
resume_executif, presentation_projet, persona, marche,
proposition_valeur, concurrents, modele_economique,
strategie_commerciale, acquisition, aspects_juridiques,
aspects_organisationnels, risques, plan_actions_90j,
templates_communication.
NE PAS générer les sections financières.
Concision : 1-2 phrases max par champ texte, 3 items max par liste.`;

const PART2_SYSTEM_SUFFIX = `

Tu génères UNIQUEMENT la partie financière du plan.
Le contexte du projet est fourni dans le user prompt.
Sections à générer : plan_financement, investissements,
finances_detail, seuil_rentabilite, projections_revenus,
projections_an2_an3, tresorerie, tableau_amortissement,
bilan_previsionnel, aides_subventions, demarches_administratives,
kpis, annexes_checklist, propriete_intellectuelle, cap_table,
franchise_specifique, reprise_specifique, alertes_coherence.
NE PAS générer les sections stratégiques.
Concision : 1-2 phrases max par champ texte, 3 items max par liste.

COHÉRENCE FINANCIÈRE OBLIGATOIRE :
plan_financement.total_besoins doit strictement égaler
plan_financement.total_ressources.
Si les ressources dépassent les besoins, augmente
tresorerie_securite pour absorber l'écart.
bilan_previsionnel.annee_X.actif.total doit égaler
bilan_previsionnel.annee_X.passif.total pour chaque année.`;

// ── CONTEXTE PROJET (partagé entre part1 et part2) ───────────────────

function buildProjectContext(data) {
  return `━━ INFORMATIONS DE BASE ━━
Nom du projet      : ${data.nom_projet || data.idea || 'Non renseigné'}
Secteur            : ${data.secteur || data.sector || 'Non renseigné'}
Type de projet     : ${data.type_projet || 'creation'}
Forme juridique    : ${data.forme_juridique || 'à recommander'}
Stade              : ${data.stade || data.time || 'lancement'}

━━ PORTEUR DE PROJET ━━
Prénom             : ${data.prenom || 'Non renseigné'}
Expérience secteur : ${data.experience_secteur || '0'} ans
Expérience gestion : ${data.experience_gestion || 'non'}
Formation          : ${data.formation || 'Non renseignée'}
Situation actuelle : ${data.situation || data.profile || 'non renseigné'}
Apport personnel   : ${data.apport_personnel || data.budget || '0'}€
Charges perso/mois : ${data.charges_personnelles || 'non renseigné'}€
Crédits en cours   : ${data.credits_en_cours || 'aucun'}

━━ PROJET ━━
Description        : ${data.description_projet || data.idea || 'Non renseignée'}
Zone géographique  : ${data.zone_geo || data.city || 'France'}
Local nécessaire   : ${data.local_necessaire || 'non'}
Bail signé         : ${data.bail_signe || 'non'}
Employés prévus    : ${data.employes_prevus || 0}
Clientèle cible    : ${data.clientele || 'mixte'}

━━ FINANCIER ━━
Investissement total : ${data.investissement_total || data.budget || 'à estimer'}€
Montant prêt visé    : ${data.montant_pret || 'à calculer'}€
Durée souhaitée      : ${data.duree_pret || 'à recommander'} ans
Autres financements  : ${data.autres_financements || 'aucun'}
CA visé année 1      : ${data.ca_an1 || 'à estimer'}€
CA visé année 3      : ${data.ca_an3 || 'à estimer'}€

━━ CONTEXTE SPÉCIFIQUE ━━
Secteur réglementé          : ${data.secteur_reglemente || 'non'}
Autorisations déjà obtenues : ${data.autorisations || 'aucune'}
Concurrents identifiés      : ${data.concurrents_connus || 'non renseigné'}
Preuves de marché           : ${data.preuves_marche || 'aucune'}

━━ DONNÉES MARCHÉ VÉRIFIÉES (INSEE) ━━
${JSON.stringify(data._verifiedData || {}, null, 2)}`;
}

// ── SCHÉMA PARTIE 1 (stratégique) ────────────────────────────────────

function buildPart1Schema(date) {
  return `{
  "meta": {
    "nom_business": "string",
    "tagline": "string",
    "pitch_30s": "string",
    "date_generation": "${date}",
    "version": "2.2",
    "type_projet_detecte": "string",
    "secteur_reglemente": false,
    "complexite_dossier": "standard"
  },

  "disclaimer": {
    "message_entrepreneur": {
      "titre": "Ce plan est un point de départ solide — pas un document certifié.",
      "corps": "EADEE a structuré votre projet selon les standards bancaires français. Ce business plan vous fait gagner plusieurs semaines de travail. Mais avant tout engagement financier, faites-le valider par un expert-comptable ou un conseiller CCI.",
      "recommandation_concrete": "Prévoyez 2 à 4h avec un expert-comptable (~300 à 600€) ou un RDV gratuit à votre CCI avant votre rendez-vous bancaire."
    },
    "fiabilite_des_chiffres": {
      "V_verifie": "Chiffre sourcé — issu d'une source publique identifiée.",
      "E_estime": "Chiffre estimé — calculé à partir de vos données et d'hypothèses sectorielles standard.",
      "H_hypothese": "Hypothèse — à valider impérativement avant de présenter à une banque."
    },
    "ce_que_ce_plan_fait": [
      "Structure votre projet selon les standards bancaires français",
      "Calcule vos projections financières de façon cohérente et justifiée",
      "Vous prépare aux questions d'un banquier ou d'un conseiller BPI"
    ],
    "ce_que_ce_plan_ne_fait_pas": [
      "Ne remplace pas les vrais documents physiques (Kbis, devis, avis d'imposition...)",
      "Ne garantit pas l'obtention d'un financement bancaire",
      "Ne remplace pas le conseil d'un expert-comptable ou d'un conseiller juridique"
    ],
    "ressources_gratuites": [
      { "organisme": "BPI France Création", "url": "bpifrance-creation.fr", "cout": "Gratuit" },
      { "organisme": "CCI France", "url": "cci.fr", "cout": "Gratuit à faible coût" },
      { "organisme": "BGE Boutique de Gestion", "url": "bge.asso.fr", "cout": "Gratuit ou subventionné" }
    ]
  },

  "scores": {
    "score_viabilite": {
      "note": 0,
      "interpretation": "string",
      "detail": {
        "taille_marche":      { "points": 0, "commentaire": "string" },
        "differentiation":    { "points": 0, "commentaire": "string" },
        "proposition_valeur": { "points": 0, "commentaire": "string" },
        "preuves_marche":     { "points": 0, "commentaire": "string" },
        "experience_porteur": { "points": 0, "commentaire": "string" },
        "clarte_modele_eco":  { "points": 0, "commentaire": "string" }
      },
      "points_forts": ["string", "string", "string"],
      "points_vigilance": ["string", "string", "string"]
    },
    "score_bancabilite": {
      "note": 0,
      "interpretation": "string",
      "detail": {
        "apport_suffisant":       { "points": 0, "commentaire": "string" },
        "point_mort_rapide":      { "points": 0, "commentaire": "string" },
        "tresorerie_positive_m6": { "points": 0, "commentaire": "string" },
        "garanties_disponibles":  { "points": 0, "commentaire": "string" },
        "secteur_risque_faible":  { "points": 0, "commentaire": "string" },
        "experience_porteur":     { "points": 0, "commentaire": "string" }
      },
      "message_banquier": "string"
    }
  },

  "porteur_projet": {
    "profil": {
      "presentation": "string",
      "competences_cles": ["string", "string", "string"],
      "parcours_synthetique": "string",
      "points_differenciants": ["string", "string"]
    },
    "profil_financier_personnel": {
      "apport_personnel": "{{V:montant€|déclaré}}",
      "origine_apport": "string",
      "ratio_apport_projet": "{{E:XX%|apport / investissement total}}",
      "appreciation_ratio": "string",
      "charges_mensuelles_perso": "{{H:montant€|déclaré}}",
      "credits_en_cours": "string",
      "capacite_remboursement_estimee": "{{E:montant€/mois|revenus projetés - charges perso - crédits}}",
      "documents_a_fournir": [
        "Pièce d'identité valide",
        "CV détaillé",
        "Avis d'imposition N-1 et N-2"
      ]
    }
  },

  "resume_executif": {
    "synthese_projet": "string",
    "chiffres_cles": {
      "investissement_total": "{{V/E:montant€|...}}",
      "apport_personnel": "{{V:montant€|déclaré}}",
      "financement_externe": "{{E:montant€|...}}",
      "ca_annee_1": "{{H:montant€|hypothèse}}",
      "ca_annee_3": "{{H:montant€|...}}",
      "point_mort_mois": "{{E:X mois|calcul}}",
      "premier_benefice_mois": "{{E:X mois|...}}"
    },
    "vision_banquier": {
      "montant_demande": "{{V:montant€|formulaire}}",
      "duree_souhaitee": "string",
      "mensualite_estimee": "{{E:montant€/mois|amortissement}}",
      "capacite_remboursement": "string",
      "garanties_proposees": ["string"],
      "point_mort_vs_premiere_echeance": "string",
      "argument_principal_bancaire": "string"
    }
  },

  "presentation_projet": {
    "origine_idee": "string",
    "probleme_resolu": "string",
    "vision_3_ans": "string",
    "stade_actuel": "string",
    "preuves_concept": null
  },

  "persona": {
    "nom_fictif": "string",
    "age": 0,
    "situation": "string",
    "revenus_mensuels": "{{H:montant€|...}}",
    "probleme_principal": "string",
    "motivations": ["string", "string", "string"],
    "freins_achat": ["string", "string"],
    "canal_acquisition_prefere": "string",
    "citation_typique": "string"
  },

  "marche": {
    "taille_marche_france": "{{V:montant€|source + année}}",
    "taux_croissance_annuel": "{{V:XX%|source + année}}",
    "tendances_cles": ["string", "string", "string"],
    "zone_chalandise": "string",
    "part_marche_visee_an1": "{{H:XX%|hypothèse justifiée}}",
    "analyse_sectorielle": "string"
  },

  "proposition_valeur": {
    "usp": "string",
    "benefices_clients": ["string", "string", "string"],
    "preuves_valeur": "string"
  },

  "concurrents": [
    {
      "nom": "Entreprise réelle 1",
      "type": "direct",
      "prix_indicatif": "{{V:fourchette€|source}}",
      "points_forts": "string",
      "points_faibles": "string",
      "niveau_menace": "élevé",
      "avantage_differentiel": "string"
    },
    {
      "nom": "Entreprise réelle 2",
      "type": "direct",
      "prix_indicatif": "{{V:fourchette€|source}}",
      "points_forts": "string",
      "points_faibles": "string",
      "niveau_menace": "moyen",
      "avantage_differentiel": "string"
    },
    {
      "nom": "Entreprise réelle 3",
      "type": "indirect",
      "prix_indicatif": "{{E:fourchette€|observation}}",
      "points_forts": "string",
      "points_faibles": "string",
      "niveau_menace": "moyen",
      "avantage_differentiel": "string"
    },
    {
      "nom": "Entreprise réelle 4",
      "type": "substitut",
      "prix_indicatif": "{{H:fourchette€|estimation}}",
      "points_forts": "string",
      "points_faibles": "string",
      "niveau_menace": "faible",
      "avantage_differentiel": "string"
    }
  ],

  "modele_economique": {
    "type": "string",
    "description": "string",
    "offres": [
      {
        "nom": "string",
        "description": "string",
        "prix_ht": "{{H:montant€|...}}",
        "marge_estimee": "{{E:XX%|...}}",
        "volume_ventes_m1": "{{H:nombre|...}}",
        "volume_ventes_m12": "{{H:nombre|...}}"
      }
    ],
    "panier_moyen": "{{E:montant€|calcul pondéré}}",
    "frequence_achat": "string"
  },

  "strategie_commerciale": {
    "canaux_distribution": ["string", "string"],
    "tunnel_vente": "string",
    "strategie_prix": "string",
    "objectif_clients_m3": "{{H:nombre|...}}",
    "objectif_clients_m12": "{{H:nombre|...}}"
  },

  "acquisition": {
    "canaux": [
      {
        "canal": "string",
        "description": "string",
        "cac_estime": "{{H:montant€|...}}",
        "priorite": "principale",
        "delai_premier_client": "string"
      },
      {
        "canal": "string",
        "description": "string",
        "cac_estime": "{{H:montant€|...}}",
        "priorite": "secondaire",
        "delai_premier_client": "string"
      }
    ]
  },

  "aspects_juridiques": {
    "statut_recommande": "string",
    "justification_statut": "string",
    "regime_fiscal": "string",
    "regime_social": "string",
    "avantages_statut": ["string", "string", "string"],
    "etapes_creation": [
      { "etape": "string", "delai": "string", "cout": "{{V/E:montant€|...}}", "organisme": "string" }
    ],
    "autorisations_sectorielles": null,
    "garanties_bancaires": {
      "caution_personnelle": "recommandée",
      "nantissement_fonds_commerce": "non applicable",
      "garantie_bpi": "à vérifier",
      "commentaire_garanties": "string"
    }
  },

  "aspects_organisationnels": {
    "structure_equipe": "string",
    "postes_cles": null,
    "locaux": {
      "necessaire": false,
      "type": null,
      "surface": null,
      "loyer_mensuel": null,
      "bail_statut": null,
      "commentaire_bancaire": null
    },
    "outils_operationnels": [
      { "outil": "string", "usage": "string", "cout_mensuel": "{{V:montant€|prix public}}", "indispensable": true }
    ]
  },

  "risques": [
    { "risque": "string", "probabilite": "moyenne", "impact": "moyen", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "faible",  "impact": "élevé", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "élevée",  "impact": "moyen", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" }
  ],

  "plan_actions_90j": {
    "phases": [
      { "semaine": "S1-S2",  "titre": "string", "actions": ["string", "string", "string"], "livrable": "string", "budget_phase": null },
      { "semaine": "S3-S4",  "titre": "string", "actions": ["string", "string", "string"], "livrable": "string", "budget_phase": null },
      { "semaine": "S5-S6",  "titre": "string", "actions": ["string", "string", "string"], "livrable": "string", "budget_phase": null },
      { "semaine": "S7-S8",  "titre": "string", "actions": ["string", "string", "string"], "livrable": "string", "budget_phase": null },
      { "semaine": "S9-S10", "titre": "string", "actions": ["string", "string", "string"], "livrable": "string", "budget_phase": null },
      { "semaine": "S11-S13","titre": "string", "actions": ["string", "string", "string"], "livrable": "string", "budget_phase": null }
    ]
  },

  "templates_communication": {
    "email_presentation_banque": { "objet": "string", "corps": "string" },
    "email_prospection_client":  { "objet": "string", "corps": "string" },
    "email_relance":             { "objet": "string", "corps": "string" },
    "email_fournisseur":         { "objet": "string", "corps": "string" }
  }
}`;
}

// ── SCHÉMA PARTIE 2 (financière) ─────────────────────────────────────

function buildPart2Schema() {
  return `{
  "plan_financement": {
    "besoins": {
      "investissements_materiels": "{{E:montant€|...}}",
      "investissements_immateriels": "{{E:montant€|...}}",
      "frais_etablissement": "{{E:montant€|...}}",
      "bfr_demarrage": "{{E:montant€|...}}",
      "tresorerie_securite": "{{E:montant€|2-3 mois charges fixes}}",
      "total_besoins": "{{E:montant€|somme}}"
    },
    "ressources": {
      "apport_personnel": "{{V:montant€|déclaré}}",
      "pret_bancaire": "{{E:montant€|à négocier}}",
      "pret_bpi": null,
      "pret_honneur": null,
      "subventions": null,
      "love_money": null,
      "total_ressources": "{{E:montant€|somme — DOIT ÉGALER total_besoins}}"
    },
    "equilibre": true,
    "commentaire_equilibre": "string",
    "ratio_apport": "{{E:XX%|apport / total besoins}}",
    "message_banquier": "string"
  },

  "investissements": {
    "postes": [
      {
        "poste": "string",
        "niveau": "indispensable",
        "montant": "{{V/E:montant€|...}}",
        "nb_devis_recommandes": 1,
        "financable_bpi": false,
        "commentaire": null
      }
    ],
    "total_investissements": "{{E:montant€|somme}}",
    "conseil_devis": "Obtenez 2 devis comparatifs pour tout poste supérieur à 1 000€."
  },

  "finances_detail": {
    "charges_fixes_mensuelles": [
      { "poste": "string", "montant": "{{E:montant€|...}}" }
    ],
    "total_charges_fixes": "{{E:montant€|somme}}",
    "charges_variables": "string — description + % du CA",
    "taux_marge_brute": "{{E:XX%|...}}",
    "taux_marge_nette_an1": "{{E:XX%|...}}",
    "taux_marge_nette_an3": "{{E:XX%|...}}",
    "bfr": {
      "definition_contextuelle": "string",
      "calcul": "{{E:montant€|...}}",
      "interpretation": "string",
      "conseil": "string"
    }
  },

  "seuil_rentabilite": {
    "ca_seuil_mensuel": "{{E:montant€|charges fixes / taux marge}}",
    "ca_seuil_annuel": "{{E:montant€|x12}}",
    "nb_ventes_necessaires": "{{E:nombre|CA seuil / panier moyen}}",
    "mois_atteinte_prevu": "{{E:X mois|montée en puissance}}",
    "marge_securite_an1": "{{E:XX%|(CA prévu - CA seuil) / CA prévu}}",
    "interpretation_bancaire": "string"
  },

  "projections_revenus": {
    "jalons": [
      { "mois": 1,  "ca": "{{H:montant€|...}}", "commentaire": "string" },
      { "mois": 3,  "ca": "{{H:montant€|...}}", "commentaire": "string" },
      { "mois": 6,  "ca": "{{H:montant€|...}}", "commentaire": "string" },
      { "mois": 9,  "ca": "{{H:montant€|...}}", "commentaire": "string" },
      { "mois": 12, "ca": "{{H:montant€|...}}", "commentaire": "string" },
      { "mois": 24, "ca": "{{H:montant€|...}}", "commentaire": "string" },
      { "mois": 36, "ca": "{{H:montant€|...}}", "commentaire": "string" }
    ],
    "tableau_mensuel_an1": [
      { "mois": "Janvier",   "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Février",   "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Mars",      "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Avril",     "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Mai",       "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Juin",      "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Juillet",   "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Août",      "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Septembre", "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Octobre",   "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Novembre",  "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
      { "mois": "Décembre",  "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" }
    ],
    "scenarios": {
      "pessimiste": { "hypothese": "string", "ca_an1": "{{H:montant€|...}}", "ca_an3": "{{H:montant€|...}}", "point_mort_mois": "{{E:X mois|...}}", "viabilite": "string" },
      "realiste":   { "hypothese": "string", "ca_an1": "{{H:montant€|...}}", "ca_an3": "{{H:montant€|...}}", "point_mort_mois": "{{E:X mois|...}}", "viabilite": "string" },
      "optimiste":  { "hypothese": "string", "ca_an1": "{{H:montant€|...}}", "ca_an3": "{{H:montant€|...}}", "point_mort_mois": "{{E:X mois|...}}", "viabilite": "string" }
    }
  },

  "projections_an2_an3": {
    "annee_2": {
      "tableau_trimestriel": [
        { "trimestre": "T1 An2", "ca_ht": "{{H:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
        { "trimestre": "T2 An2", "ca_ht": "{{H:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
        { "trimestre": "T3 An2", "ca_ht": "{{H:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
        { "trimestre": "T4 An2", "ca_ht": "{{H:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" }
      ],
      "ca_annuel": "{{H:montant€|somme des 4 trimestres}}",
      "resultat_annuel": "{{E:montant€|somme des 4 trimestres}}",
      "taux_croissance_vs_an1": "{{E:XX%|(CA an2 - CA an1) / CA an1}}"
    },
    "annee_3": {
      "tableau_trimestriel": [
        { "trimestre": "T1 An3", "ca_ht": "{{H:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
        { "trimestre": "T2 An3", "ca_ht": "{{H:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
        { "trimestre": "T3 An3", "ca_ht": "{{H:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" },
        { "trimestre": "T4 An3", "ca_ht": "{{H:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|...}}" }
      ],
      "ca_annuel": "{{H:montant€|somme des 4 trimestres}}",
      "resultat_annuel": "{{E:montant€|somme des 4 trimestres}}",
      "taux_croissance_vs_an2": "{{E:XX%|(CA an3 - CA an2) / CA an2}}"
    },
    "synthese_3_ans": {
      "evolution_ca": "string",
      "evolution_rentabilite": "string",
      "message_banquier": "string"
    }
  },

  "tresorerie": {
    "tableau_12_mois": [
      { "mois": "Janvier",   "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Février",   "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Mars",      "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Avril",     "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Mai",       "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Juin",      "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Juillet",   "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Août",      "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Septembre", "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Octobre",   "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Novembre",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "Décembre",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null }
    ],
    "solde_minimum": "{{E:montant€|point bas}}",
    "mois_critique": null,
    "recommandations": ["string", "string"]
  },

  "tableau_amortissement": null,

  "bilan_previsionnel": {
    "annee_1": {
      "actif": {
        "immobilisations_nettes": "{{E:montant€|...}}",
        "stocks": null,
        "creances_clients": "{{E:montant€|...}}",
        "disponibilites": "{{E:montant€|trésorerie fin an 1}}",
        "total_actif": "{{E:montant€|somme}}"
      },
      "passif": {
        "capital_social": "{{V:montant€|...}}",
        "reserves": "{{E:montant€|...}}",
        "resultat": "{{E:montant€|...}}",
        "dettes_financieres": "{{E:montant€|capital restant dû}}",
        "dettes_fournisseurs": "{{E:montant€|...}}",
        "dettes_fiscales_sociales": "{{E:montant€|...}}",
        "total_passif": "{{E:montant€|somme — DOIT ÉGALER total_actif}}"
      },
      "ratios": {
        "autonomie_financiere": "{{E:XX%|fonds propres / total bilan}}",
        "ratio_endettement": "{{E:XX%|dettes / fonds propres}}",
        "interpretation": "string"
      }
    },
    "annee_2": {
      "actif": {
        "immobilisations_nettes": "{{E:montant€|...}}",
        "stocks": null,
        "creances_clients": "{{E:montant€|...}}",
        "disponibilites": "{{E:montant€|trésorerie fin an2}}",
        "total_actif": "{{E:montant€|somme}}"
      },
      "passif": {
        "capital_social": "{{V:montant€|identique an1}}",
        "reserves": "{{E:montant€|résultat an1 mis en réserve}}",
        "resultat": "{{E:montant€|résultat net an2}}",
        "dettes_financieres": "{{E:montant€|capital restant dû fin an2}}",
        "dettes_fournisseurs": "{{E:montant€|...}}",
        "dettes_fiscales_sociales": "{{E:montant€|...}}",
        "total_passif": "{{E:montant€|somme — DOIT ÉGALER total_actif}}"
      },
      "ratios": {
        "autonomie_financiere": "{{E:XX%|...}}",
        "ratio_endettement": "{{E:XX%|...}}",
        "interpretation": "string"
      },
      "compte_resultat": {
        "ca_ht": "{{H:montant€|projection an2}}",
        "charges_fixes": "{{E:montant€|...}}",
        "charges_variables": "{{E:montant€|...}}",
        "marge_brute": "{{E:montant€|CA - charges variables}}",
        "resultat_exploitation": "{{E:montant€|marge brute - charges fixes}}",
        "resultat_net": "{{E:montant€|après IS}}",
        "taux_marge_nette": "{{E:XX%|résultat net / CA}}"
      }
    },
    "annee_3": {
      "actif": {
        "immobilisations_nettes": "{{E:montant€|...}}",
        "stocks": null,
        "creances_clients": "{{E:montant€|...}}",
        "disponibilites": "{{E:montant€|trésorerie fin an3}}",
        "total_actif": "{{E:montant€|somme}}"
      },
      "passif": {
        "capital_social": "{{V:montant€|identique an1}}",
        "reserves": "{{E:montant€|résultats an1+an2 mis en réserve}}",
        "resultat": "{{E:montant€|résultat net an3}}",
        "dettes_financieres": "{{E:montant€|capital restant dû fin an3}}",
        "dettes_fournisseurs": "{{E:montant€|...}}",
        "dettes_fiscales_sociales": "{{E:montant€|...}}",
        "total_passif": "{{E:montant€|somme — DOIT ÉGALER total_actif}}"
      },
      "ratios": {
        "autonomie_financiere": "{{E:XX%|...}}",
        "ratio_endettement": "{{E:XX%|...}}",
        "interpretation": "string"
      },
      "compte_resultat": {
        "ca_ht": "{{H:montant€|projection an3}}",
        "charges_fixes": "{{E:montant€|...}}",
        "charges_variables": "{{E:montant€|...}}",
        "marge_brute": "{{E:montant€|CA - charges variables}}",
        "resultat_exploitation": "{{E:montant€|marge brute - charges fixes}}",
        "resultat_net": "{{E:montant€|après IS}}",
        "taux_marge_nette": "{{E:XX%|résultat net / CA}}"
      }
    }
  },

  "aides_subventions": {
    "eligibles": [
      {
        "aide": "string",
        "organisme": "string",
        "montant": "{{V/E:montant€|source}}",
        "conditions": ["string", "string"],
        "demarche": "string",
        "delai_reponse": "string",
        "cumulable": true,
        "priorite": "haute",
        "profil_eligible": "string"
      }
    ],
    "total_aides_potentielles": "{{E:montant€|somme}}",
    "conseil_strategique": "string"
  },

  "demarches_administratives": [
    { "etape": "string", "organisme": "string", "delai_reel": "string", "cout": "{{V:montant€|tarif officiel}}", "documents_requis": ["string"], "bloquante": true }
  ],

  "kpis": {
    "operationnels": [
      { "kpi": "string", "cible_m3": "{{H:valeur|...}}", "cible_m12": "{{H:valeur|...}}", "comment_mesurer": "string" }
    ],
    "financiers_bancaires": [
      { "kpi": "string", "valeur_actuelle": "string", "cible": "string", "interpretation_bancaire": "string" }
    ]
  },

  "annexes_checklist": {
    "categorie_1_documents_personnels": {
      "titre": "Documents personnels du porteur",
      "ordre_preparation": 1,
      "items": [
        { "document": "Pièce d'identité valide",                     "statut_requis": "bloquant",       "delai_obtention": "immédiat" },
        { "document": "CV détaillé orienté entrepreneur",             "statut_requis": "bloquant",       "delai_obtention": "1-2 jours" },
        { "document": "Avis d'imposition N-1 et N-2",                "statut_requis": "bloquant",       "delai_obtention": "immédiat — impots.gouv.fr" },
        { "document": "Relevés de compte personnel 3 derniers mois", "statut_requis": "bloquant",       "delai_obtention": "immédiat" },
        { "document": "Justificatifs d'apport personnel",             "statut_requis": "bloquant",       "delai_obtention": "immédiat" }
      ]
    },
    "categorie_2_documents_juridiques": {
      "titre": "Documents juridiques & réglementaires",
      "ordre_preparation": 2,
      "items": [
        { "document": "Statut juridique choisi et justifié",          "statut_requis": "bloquant",       "delai_obtention": "1 jour" },
        { "document": "Statuts de la société rédigés",                "statut_requis": "bloquant",       "delai_obtention": "3-10 jours" },
        { "document": "Extrait Kbis ou récépissé d'immatriculation",  "statut_requis": "bloquant",       "delai_obtention": "3-5 jours après dépôt" }
      ]
    },
    "categorie_3_autorisations_sectorielles": {
      "titre": "Autorisations & licences spécifiques",
      "ordre_preparation": 2,
      "applicable": false,
      "items": []
    },
    "categorie_4_documents_financiers": {
      "titre": "Documents financiers prévisionnels",
      "ordre_preparation": 3,
      "items": [
        { "document": "Business plan complet",                             "statut_requis": "bloquant",       "delai_obtention": "généré par EADEE ✅" },
        { "document": "Plan de financement besoins / ressources",         "statut_requis": "bloquant",       "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Compte de résultat prévisionnel 3 ans",            "statut_requis": "bloquant",       "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Plan de trésorerie 12 mois",                       "statut_requis": "bloquant",       "delai_obtention": "inclus dans ce plan ✅" }
      ]
    },
    "categorie_5_preuves_marche": {
      "titre": "Preuves de marché & validation commerciale",
      "ordre_preparation": 3,
      "items": [
        { "document": "Étude de marché avec sources datées",    "statut_requis": "tres_important", "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Au moins 1 lettre d'intention client",   "statut_requis": "tres_important", "delai_obtention": "variable — à obtenir avant RDV" }
      ]
    },
    "categorie_6_aides_et_presentation": {
      "titre": "Dossiers d'aides & présentation banque",
      "ordre_preparation": 4,
      "items": [
        { "document": "Subventions régionales / CCI identifiées", "statut_requis": "souhaitable",    "delai_obtention": "1-2 jours de recherche" },
        { "document": "Executive summary 1-2 pages",              "statut_requis": "tres_important", "delai_obtention": "1 jour" }
      ]
    },
    "score_readiness": {
      "description": "Score de préparation du dossier bancaire",
      "calcul": "items bloquants cochés / total items bloquants × 100",
      "seuils": {
        "rouge":  "< 60% — Dossier incomplet, RDV prématuré",
        "orange": "60-80% — Dossier partiel, RDV possible avec réserves",
        "vert":   "> 80% — Dossier solide, RDV recommandé"
      }
    }
  },

  "propriete_intellectuelle": null,
  "cap_table": null,
  "franchise_specifique": null,
  "reprise_specifique": null,
  "alertes_coherence": null
}`;
}

// ── UTILITAIRES ───────────────────────────────────────────────────────

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Pas de JSON dans la réponse');
  let raw = text.slice(start, end + 1);

  // Fix marqueurs {{V/E/H:...}} non quotés
  raw = raw.replace(/(?<!"):(\s*)(\{\{[VEH]:[^\n"]*?\}\})(?!")/g, ':$1"$2"');
  // Fix marqueurs tronqués en fin (max_tokens coupé dans un marqueur)
  raw = raw.replace(/(?<!"):(\s*)(\{\{[VEH]:[^\n"]*)$/g, ':$1"$2}}"');

  try {
    return JSON.parse(raw);
  } catch(e1) {
    try {
      return JSON.parse(jsonrepair(raw));
    } catch(e2) {
      const posMatch = e2.message.match(/position (\d+)/);
      if (posMatch) {
        const errPos = parseInt(posMatch[1]);
        const truncated = raw.substring(0, Math.max(0, errPos - 1));
        try { return JSON.parse(jsonrepair(truncated)); } catch {}
      }
      throw new Error(e2.message);
    }
  }
}

// ── GÉNÉRATION PARTIE 1 (STRATÉGIQUE) ────────────────────────────────

async function generatePart1(formData, sysPrompt) {
  const userPrompt = `Génère la partie STRATÉGIQUE du business plan pour ce projet.
⚠️ CONCISION : 1-2 phrases max par champ texte, 3 items max par liste.
Retourne UNIQUEMENT le JSON ci-dessous rempli, sans markdown, sans backtick.

${buildProjectContext(formData)}

${buildPart1Schema(new Date().toISOString())}`;

  const resp = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      temperature: 0.3,
      system: sysPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(250000),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const e = new Error(`Part1 API error ${resp.status}`);
    e.apiError = err;
    throw e;
  }

  const data = await resp.json();
  const text = (data.content || []).map(c => c.text || '').join('');
  console.log(`[generate-plan v2.2] Part1 done — stop_reason: ${data.stop_reason} — ${text.length} chars`);
  return extractJSON(text);
}

// ── GÉNÉRATION PARTIE 2 (FINANCIÈRE) ─────────────────────────────────

async function generatePart2(formData, sysPrompt) {
  const userPrompt = `Génère la partie FINANCIÈRE du business plan pour ce projet.
⚠️ CONCISION : 1-2 phrases max par champ texte, 3 items max par liste.
⚠️ COHÉRENCE OBLIGATOIRE : plan_financement.besoins.total_besoins DOIT strictement égaler plan_financement.ressources.total_ressources (ajuste tresorerie_securite si nécessaire).
Retourne UNIQUEMENT le JSON ci-dessous rempli, sans markdown, sans backtick.

${buildProjectContext(formData)}

${buildPart2Schema()}`;

  const resp = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      temperature: 0.3,
      system: sysPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(250000),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const e = new Error(`Part2 API error ${resp.status}`);
    e.apiError = err;
    throw e;
  }

  const data = await resp.json();
  const text = (data.content || []).map(c => c.text || '').join('');
  console.log(`[generate-plan v2.2] Part2 done — stop_reason: ${data.stop_reason} — ${text.length} chars`);
  return extractJSON(text);
}

// ── WEB SEARCH (conservé, désactivé par défaut) ───────────────────────

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
    let maxTurns = 2;

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
          max_tokens: 2000,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
          messages,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.error('[web_search] API error:', resp.status, err);
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

// ── NORMALISATION DES DONNÉES FORMULAIRE ─────────────────────────────

function normalizeFormData(body) {
  return {
    nom_projet:           body.nom_projet         || body.idea        || '',
    secteur:              body.secteur             || body.sector      || '',
    type_projet:          body.type_projet         || 'creation',
    forme_juridique:      body.forme_juridique     || '',
    stade:                body.stade               || body.time        || 'lancement',
    prenom:               body.prenom              || '',
    experience_secteur:   body.experience_secteur  || '0',
    experience_gestion:   body.experience_gestion  || 'non',
    formation:            body.formation           || '',
    situation:            body.situation           || body.profile     || '',
    apport_personnel:     body.apport_personnel    || body.budget      || '0',
    charges_personnelles: body.charges_personnelles|| '',
    credits_en_cours:     body.credits_en_cours    || 'aucun',
    description_projet:   body.description_projet  || body.idea        || '',
    zone_geo:             body.zone_geo            || body.city        || 'France',
    local_necessaire:     body.local_necessaire    || 'non',
    bail_signe:           body.bail_signe          || 'non',
    employes_prevus:      body.employes_prevus      || 0,
    clientele:            body.clientele           || 'mixte',
    investissement_total: body.investissement_total || body.budget      || '',
    montant_pret:         body.montant_pret         || '',
    duree_pret:           body.duree_pret           || '',
    autres_financements:  body.autres_financements  || 'aucun',
    ca_an1:               body.ca_an1               || '',
    ca_an3:               body.ca_an3               || '',
    secteur_reglemente:   body.secteur_reglemente   || 'non',
    autorisations:        body.autorisations         || 'aucune',
    concurrents_connus:   body.concurrents_connus    || '',
    preuves_marche:       body.preuves_marche        || 'aucune',
    credits:              body.credits,
  };
}

// ── HANDLER PRINCIPAL ─────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const startTime = Date.now();

  try {
    const { messages } = req.body;

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

    // ── Nouveau pipeline v2.2 (génération parallèle) ─────────────────
    const formData = normalizeFormData(req.body);
    if (!formData.description_projet && !formData.nom_projet) {
      return res.status(400).json({ error: 'Champ "idea" ou "description_projet" requis' });
    }

    const credits = parseInt(formData.credits ?? '1', 10);
    const isDiscovery = credits === 0;

    console.log(`[generate-plan v2.2] Début — ${(formData.nom_projet || formData.description_projet).substring(0, 60)} [${isDiscovery ? 'DÉCOUVERTE' : 'COMPLET'}]`);

    // ÉTAPE 1 — Données INSEE
    const inseeData = await fetchINSEEData(formData.secteur, formData.zone_geo);
    const webData = null; // web search désactivé pour tenir dans maxDuration

    console.log(`[generate-plan v2.2] INSEE: ${!!inseeData?.city} — ${Date.now() - startTime}ms`);

    formData._verifiedData = {
      insee: inseeData,
      web_search: webData,
      generated_at: new Date().toISOString(),
    };

    // ── MODE DÉCOUVERTE (appel unique léger) ─────────────────────────
    if (isDiscovery) {
      const knowledgeBase = getKnowledgeContext();
      const sysPrompt = EADEE_SYSTEM_PROMPT + `\n\nKNOWLEDGE BASE :\n${knowledgeBase}`;
      const discoveryPrompt = `${buildProjectContext(formData)}

Génère UNIQUEMENT : meta, scores.score_viabilite, porteur_projet.profil, presentation_projet, marche, proposition_valeur, concurrents, disclaimer.
Toutes les autres sections → null.
Retourne UNIQUEMENT le JSON, sans markdown.
{ "meta": {...}, "disclaimer": {...}, "scores": {...}, "porteur_projet": {...}, "presentation_projet": {...}, "marche": {...}, "proposition_valeur": {...}, "concurrents": [...] }`;

      const discResp = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: 2000, temperature: 0.3, system: sysPrompt, messages: [{ role: 'user', content: discoveryPrompt }] }),
        signal: AbortSignal.timeout(60000),
      });
      if (!discResp.ok) {
        const err = await discResp.json().catch(() => ({}));
        return res.status(discResp.status).json(err);
      }
      const discData = await discResp.json();
      const discText = (discData.content || []).map(c => c.text || '').join('');
      let discPlan;
      try { discPlan = extractJSON(discText); } catch (e) {
        return res.status(500).json({ error: { message: 'JSON invalide: ' + e.message } });
      }
      discPlan._discovery = true;
      discPlan._watermark = 'Plan incomplet — Passe à Solo pour le plan complet';
      discPlan._meta = { generation_ms: Date.now() - startTime, pipeline_version: 'v2.2-discovery' };
      return res.status(200).json({ ...discData, content: [{ type: 'text', text: JSON.stringify(discPlan) }] });
    }

    // ── GÉNÉRATION COMPLÈTE — 2 APPELS PARALLÈLES ───────────────────
    const knowledgeBase = getKnowledgeContext();
    const sysPrompt1 = EADEE_SYSTEM_PROMPT + `\n\nKNOWLEDGE BASE :\n${knowledgeBase}` + PART1_SYSTEM_SUFFIX;
    const sysPrompt2 = EADEE_SYSTEM_PROMPT + `\n\nKNOWLEDGE BASE :\n${knowledgeBase}` + PART2_SYSTEM_SUFFIX;

    console.log(`[generate-plan v2.2] Lancement Promise.all Part1 + Part2...`);

    const [part1Result, part2Result] = await Promise.allSettled([
      generatePart1(formData, sysPrompt1),
      generatePart2(formData, sysPrompt2),
    ]);

    const part1Failed = part1Result.status === 'rejected';
    const part2Failed = part2Result.status === 'rejected';

    if (part1Failed) console.error('[generate-plan v2.2] Part1 FAILED:', part1Result.reason?.message);
    if (part2Failed) console.error('[generate-plan v2.2] Part2 FAILED:', part2Result.reason?.message);

    // Si les deux échouent → erreur totale
    if (part1Failed && part2Failed) {
      return res.status(500).json({
        error: { message: `Erreur génération Part1: ${part1Result.reason?.message} | Part2: ${part2Result.reason?.message}` }
      });
    }

    const plan1 = part1Failed ? {} : part1Result.value;
    const plan2 = part2Failed ? {} : part2Result.value;

    // ── MERGE ────────────────────────────────────────────────────────
    let fullPlan = { ...plan1, ...plan2 };

    // Flag si génération incomplète
    if (part1Failed) {
      fullPlan._generation_incomplete = true;
      fullPlan._partie_manquante = 'part1';
    } else if (part2Failed) {
      fullPlan._generation_incomplete = true;
      fullPlan._partie_manquante = 'part2';
    }

    // ── NETTOYAGE CLÉS PARASITES ─────────────────────────────────────
    delete fullPlan.score_viabilite;
    delete fullPlan.nom_business;
    delete fullPlan.tresorerie_mensuelle;
    delete fullPlan.scenarios;
    delete fullPlan._completeness;
    delete fullPlan._meta;
    delete fullPlan.porteur_profil_financier;
    delete fullPlan.rev_mensuel;
    delete fullPlan.acquisition_list;
    delete fullPlan.tresorerie_mensuelle;

    // ── COMPAT DESCENDANTE (clés attendues par les renderers) ────────
    if (!fullPlan.score_viabilite && fullPlan.scores?.score_viabilite?.note !== undefined) {
      fullPlan.score_viabilite = fullPlan.scores.score_viabilite.note;
    }
    if (!fullPlan.nom_business && fullPlan.meta?.nom_business) {
      fullPlan.nom_business = fullPlan.meta.nom_business;
    }
    if (!fullPlan.porteur_profil_financier && fullPlan.porteur_projet?.profil_financier_personnel) {
      fullPlan.porteur_profil_financier = fullPlan.porteur_projet.profil_financier_personnel;
    }
    if (!fullPlan.tresorerie_mensuelle && fullPlan.tresorerie?.tableau_12_mois) {
      fullPlan.tresorerie_mensuelle = fullPlan.tresorerie.tableau_12_mois;
    }
    if (!fullPlan.acquisition_list && fullPlan.acquisition?.canaux) {
      fullPlan.acquisition_list = fullPlan.acquisition.canaux;
    }
    if (!fullPlan.rev_mensuel && fullPlan.projections_revenus?.tableau_mensuel_an1) {
      fullPlan.rev_mensuel = fullPlan.projections_revenus.tableau_mensuel_an1.map(m => {
        const val = String(m.ca_ht || '0').replace(/[^0-9]/g, '');
        return parseInt(val, 10) || 0;
      });
    }
    if (!fullPlan.scenarios && fullPlan.projections_revenus?.scenarios) {
      fullPlan.scenarios = fullPlan.projections_revenus.scenarios;
    }

    // ── MÉTA COMPLÉTUDE ──────────────────────────────────────────────
    const REQUIRED_SECTIONS = [
      'disclaimer', 'scores', 'porteur_projet', 'resume_executif',
      'presentation_projet', 'marche', 'proposition_valeur', 'concurrents',
      'modele_economique', 'strategie_commerciale', 'acquisition',
      'aspects_juridiques', 'aspects_organisationnels', 'plan_financement',
      'investissements', 'finances_detail', 'seuil_rentabilite',
      'projections_revenus', 'tresorerie', 'bilan_previsionnel',
      'risques', 'plan_actions_90j', 'aides_subventions', 'annexes_checklist'
    ];
    const presentSections = REQUIRED_SECTIONS.filter(k => {
      const v = fullPlan[k];
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.length > 5;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    });

    fullPlan._completeness = {
      present: presentSections.length,
      total: REQUIRED_SECTIONS.length,
      sections: presentSections,
    };
    fullPlan._meta = {
      verified_data: formData._verifiedData,
      generation_ms: Date.now() - startTime,
      pipeline_version: 'v2.2-parallel',
      part1_ok: !part1Failed,
      part2_ok: !part2Failed,
    };

    console.log(`[generate-plan v2.2] Généré — ${presentSections.length}/${REQUIRED_SECTIONS.length} sections — ${Date.now() - startTime}ms`);

    return res.status(200).json({
      id: `gen-${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: JSON.stringify(fullPlan) }],
      stop_reason: 'end_turn',
    });

  } catch (err) {
    console.error('[generate-plan v2.2] Error:', err);
    return res.status(500).json({ error: { message: 'Erreur serveur: ' + err.message } });
  }
}
