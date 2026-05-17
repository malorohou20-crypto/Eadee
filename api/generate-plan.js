export const config = { runtime: 'nodejs' };

// =====================================================================
// EADEE — Pipeline génération business plan v2.1
// Étape 1 : Données INSEE (APIs gratuites)
// Étape 2 : Recherche web via Claude web_search (données marché vérifiées)
// Étape 3 : Génération plan complet — Prompt Maître v2.1 (bancabilité)
// Runtime : Node.js (pas Edge — nécessite SDK + jsonrepair)
// =====================================================================

import { jsonrepair } from 'jsonrepair';
import { fetchINSEEData } from './lib/insee.js';
import { getKnowledgeContext } from './lib/knowledge.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

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

// ── USER PROMPT BUILDER v2.1 ─────────────────────────────────────────

function buildUserPrompt(data) {
  return `Génère un business plan complet pour le projet suivant.

━━ INFORMATIONS DE BASE ━━
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

━━ DONNÉES MARCHÉ VÉRIFIÉES (INSEE + recherche web) ━━
${JSON.stringify(data._verifiedData || {}, null, 2)}

Génère maintenant le business plan complet en JSON selon la structure EADEE v2.1 ci-dessous.
Retourne UNIQUEMENT le JSON, sans markdown, sans backtick.

{
  "meta": {
    "nom_business": "string",
    "tagline": "string",
    "pitch_30s": "string",
    "date_generation": "${new Date().toISOString()}",
    "version": "2.1",
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
      "V_verifie": "Chiffre sourcé — issu d'une source publique identifiée. Vérifiez l'actualité avant de le citer.",
      "E_estime": "Chiffre estimé — calculé à partir de vos données et d'hypothèses sectorielles standard.",
      "H_hypothese": "Hypothèse — à valider impérativement avant de présenter à une banque."
    },
    "ce_que_ce_plan_fait": [
      "Structure votre projet selon les standards bancaires français",
      "Calcule vos projections financières de façon cohérente et justifiée",
      "Identifie les documents manquants à votre dossier complet",
      "Vous prépare aux questions d'un banquier ou d'un conseiller BPI",
      "Vous fait gagner 2 à 4 semaines de travail de structuration"
    ],
    "ce_que_ce_plan_ne_fait_pas": [
      "Ne remplace pas les vrais documents physiques (Kbis, devis, avis d'imposition...)",
      "Ne garantit pas l'obtention d'un financement bancaire",
      "Ne remplace pas le conseil d'un expert-comptable ou d'un conseiller juridique",
      "Ne certifie pas l'exactitude des données de marché en temps réel"
    ],
    "ressources_gratuites": [
      { "organisme": "BPI France Création", "url": "bpifrance-creation.fr", "cout": "Gratuit" },
      { "organisme": "CCI France", "url": "cci.fr", "cout": "Gratuit à faible coût" },
      { "organisme": "BGE Boutique de Gestion", "url": "bge.asso.fr", "cout": "Gratuit ou subventionné" },
      { "organisme": "Réseau Entreprendre", "url": "reseau-entreprendre.fr", "cout": "Gratuit sur dossier" }
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
      "points_forts": ["string x3"],
      "points_vigilance": ["string x3"]
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
      "competences_cles": ["string x4"],
      "parcours_synthetique": "string",
      "points_differenciants": ["string x2"]
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
        "Avis d'imposition N-1 et N-2",
        "Relevés de compte personnel 3 derniers mois",
        "Justificatifs d'apport",
        "Situation patrimoniale complète"
      ]
    }
  },

  "resume_executif": {
    "synthese_projet": "string 5-6 phrases",
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
    "motivations": ["string x3"],
    "freins_achat": ["string x2"],
    "canal_acquisition_prefere": "string",
    "citation_typique": "string"
  },

  "marche": {
    "taille_marche_france": "{{V:montant€|source + année}}",
    "taux_croissance_annuel": "{{V:XX%|source + année}}",
    "tendances_cles": ["string x3"],
    "zone_chalandise": "string",
    "part_marche_visee_an1": "{{H:XX%|hypothèse justifiée}}",
    "analyse_sectorielle": "string"
  },

  "proposition_valeur": {
    "usp": "string",
    "benefices_clients": ["string x3"],
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
    "canaux_distribution": ["string x2-3"],
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
    "avantages_statut": ["string x3"],
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
      "total_ressources": "{{E:montant€|somme}}"
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
      "pessimiste": {
        "hypothese": "string",
        "ca_an1": "{{H:montant€|...}}",
        "ca_an3": "{{H:montant€|...}}",
        "point_mort_mois": "{{E:X mois|...}}",
        "viabilite": "string"
      },
      "realiste": {
        "hypothese": "string",
        "ca_an1": "{{H:montant€|...}}",
        "ca_an3": "{{H:montant€|...}}",
        "point_mort_mois": "{{E:X mois|...}}",
        "viabilite": "string"
      },
      "optimiste": {
        "hypothese": "string",
        "ca_an1": "{{H:montant€|...}}",
        "ca_an3": "{{H:montant€|...}}",
        "point_mort_mois": "{{E:X mois|...}}",
        "viabilite": "string"
      }
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
    "recommandations": ["string x2-3"]
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
        "total_passif": "{{E:montant€|somme}}"
      },
      "ratios": {
        "autonomie_financiere": "{{E:XX%|fonds propres / total bilan}}",
        "ratio_endettement": "{{E:XX%|dettes / fonds propres}}",
        "interpretation": "string"
      }
    },
    "annee_2": { "actif": {}, "passif": {}, "ratios": {} },
    "annee_3": { "actif": {}, "passif": {}, "ratios": {} }
  },

  "risques": [
    { "risque": "string", "probabilite": "moyenne", "impact": "moyen", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "faible",  "impact": "élevé", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "élevée",  "impact": "moyen", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "faible",  "impact": "faible","solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "moyenne", "impact": "élevé", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" }
  ],

  "plan_actions_90j": {
    "phases": [
      { "semaine": "S1-S2", "titre": "string", "actions": ["string x3"], "livrable": "string", "budget_phase": null },
      { "semaine": "S3-S4", "titre": "string", "actions": ["string x3"], "livrable": "string", "budget_phase": null },
      { "semaine": "S5-S6", "titre": "string", "actions": ["string x3"], "livrable": "string", "budget_phase": null },
      { "semaine": "S7-S8", "titre": "string", "actions": ["string x3"], "livrable": "string", "budget_phase": null },
      { "semaine": "S9-S10","titre": "string", "actions": ["string x3"], "livrable": "string", "budget_phase": null },
      { "semaine": "S11-S13","titre": "string","actions": ["string x3"], "livrable": "string", "budget_phase": null }
    ]
  },

  "aides_subventions": {
    "eligibles": [
      {
        "aide": "string",
        "organisme": "string",
        "montant": "{{V/E:montant€|source}}",
        "conditions": ["string x2"],
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

  "templates_communication": {
    "email_presentation_banque": { "objet": "string", "corps": "string" },
    "email_prospection_client":  { "objet": "string", "corps": "string" },
    "email_relance":             { "objet": "string", "corps": "string" },
    "email_fournisseur":         { "objet": "string", "corps": "string" }
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
        { "document": "Justificatifs d'apport personnel",             "statut_requis": "bloquant",       "delai_obtention": "immédiat" },
        { "document": "Situation patrimoniale complète",              "statut_requis": "tres_important", "delai_obtention": "2-3 jours" }
      ]
    },
    "categorie_2_documents_juridiques": {
      "titre": "Documents juridiques & réglementaires",
      "ordre_preparation": 2,
      "items": [
        { "document": "Statut juridique choisi et justifié",          "statut_requis": "bloquant",       "delai_obtention": "1 jour" },
        { "document": "Statuts de la société rédigés",                "statut_requis": "bloquant",       "delai_obtention": "3-10 jours" },
        { "document": "Extrait Kbis ou récépissé d'immatriculation",  "statut_requis": "bloquant",       "delai_obtention": "3-5 jours après dépôt" },
        { "document": "Justificatif de domiciliation",                "statut_requis": "bloquant",       "delai_obtention": "immédiat à 1 semaine" },
        { "document": "Attestation RC Pro ou devis assurance",        "statut_requis": "conditionnel",   "delai_obtention": "1-5 jours" }
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
        { "document": "Bilan prévisionnel 3 ans",                         "statut_requis": "bloquant",       "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Plan de trésorerie 12 mois",                       "statut_requis": "bloquant",       "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Seuil de rentabilité avec délai en mois",          "statut_requis": "bloquant",       "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Détail du BFR",                                    "statut_requis": "tres_important", "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Scénarios pessimiste / réaliste / optimiste",      "statut_requis": "tres_important", "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Tableau d'amortissement du prêt",                  "statut_requis": "tres_important", "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Devis investissements (2 devis par poste >1000€)", "statut_requis": "bloquant",       "delai_obtention": "1-3 semaines" }
      ]
    },
    "categorie_5_preuves_marche": {
      "titre": "Preuves de marché & validation commerciale",
      "ordre_preparation": 3,
      "items": [
        { "document": "Étude de marché avec sources datées",    "statut_requis": "tres_important", "delai_obtention": "inclus dans ce plan ✅" },
        { "document": "Au moins 1 lettre d'intention client",   "statut_requis": "tres_important", "delai_obtention": "variable — à obtenir avant RDV" },
        { "document": "Preuve de concept / MVP / test marché",  "statut_requis": "souhaitable",    "delai_obtention": "variable" },
        { "document": "Benchmark concurrentiel documenté",      "statut_requis": "souhaitable",    "delai_obtention": "inclus dans ce plan ✅" }
      ]
    },
    "categorie_6_aides_et_presentation": {
      "titre": "Dossiers d'aides & présentation banque",
      "ordre_preparation": 4,
      "items": [
        { "document": "Contact BPI France pris",                  "statut_requis": "conditionnel",   "condition": "Si montant >50k€ ou projet innovant" },
        { "document": "Subventions régionales / CCI identifiées", "statut_requis": "souhaitable",    "delai_obtention": "1-2 jours de recherche" },
        { "document": "Executive summary 1-2 pages",              "statut_requis": "tres_important", "delai_obtention": "1 jour" },
        { "document": "Courrier de présentation banque",          "statut_requis": "tres_important", "delai_obtention": "inclus dans ce plan ✅" }
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

// ── UTILITAIRES ───────────────────────────────────────────────────────

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

// Compat : mappe les anciens champs du formulaire vers la structure v2.1
function normalizeFormData(body) {
  return {
    // Nouveaux champs v2.1
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
    // Champs internes
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
    const { model, messages, max_tokens, system } = req.body;

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

    // ── Nouveau pipeline 3 étapes v2.1 ───────────────────────────────
    const formData = normalizeFormData(req.body);
    if (!formData.description_projet && !formData.nom_projet) {
      return res.status(400).json({ error: 'Champ "idea" ou "description_projet" requis' });
    }

    const credits = parseInt(formData.credits ?? '1', 10);
    const isDiscovery = credits === 0;

    console.log(`[generate-plan v2.1] Début — ${(formData.nom_projet || formData.description_projet).substring(0, 60)}... [${isDiscovery ? 'DÉCOUVERTE' : 'COMPLET'}]`);

    // ÉTAPE 1 — Données INSEE + web search (parallèle)
    const inseePromise = fetchINSEEData(formData.secteur, formData.zone_geo);
    const searchPromise = performWebSearch(
      formData.description_projet || formData.nom_projet,
      formData.secteur,
      formData.zone_geo,
      {}
    );
    const [inseeData, webData] = await Promise.all([inseePromise, searchPromise]);

    console.log(`[generate-plan v2.1] Données — INSEE: ${!!inseeData?.city}, Web: ${!!webData} — ${Date.now() - startTime}ms`);

    // Injecter les données vérifiées dans le prompt
    formData._verifiedData = {
      insee: inseeData,
      web_search: webData,
      generated_at: new Date().toISOString(),
    };

    // ÉTAPE 3 — Génération du plan v2.1
    const knowledgeBase = getKnowledgeContext();
    const systemPrompt = EADEE_SYSTEM_PROMPT + `\n\nKNOWLEDGE BASE (statuts, banques, aides françaises) :\n${knowledgeBase}`;

    const discoveryNote = isDiscovery
      ? '\n\nIMPORTANT MODE DÉCOUVERTE : Génère UNIQUEMENT les sections meta, scores (score_viabilite uniquement), porteur_projet.profil, presentation_projet, marche, proposition_valeur, concurrents et disclaimer. Toutes les autres sections → null.'
      : '';

    const userPrompt = buildUserPrompt(formData) + discoveryNote;

    const planResp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: isDiscovery ? 3000 : 10000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!planResp.ok) {
      const err = await planResp.json().catch(() => ({}));
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

    // ── Compat descendante : exposer les clés que le renderer attend ─
    // score_viabilite à la racine
    if (!plan.score_viabilite && plan.scores?.score_viabilite?.note !== undefined) {
      plan.score_viabilite = plan.scores.score_viabilite.note;
    }
    // nom_business à la racine
    if (!plan.nom_business && plan.meta?.nom_business) {
      plan.nom_business = plan.meta.nom_business;
    }
    // porteur_profil_financier à la racine (pour les anciens renderers)
    if (!plan.porteur_profil_financier && plan.porteur_projet?.profil_financier_personnel) {
      plan.porteur_profil_financier = plan.porteur_projet.profil_financier_personnel;
    }
    // tresorerie_mensuelle à la racine (compat renderer)
    if (!plan.tresorerie_mensuelle && plan.tresorerie?.tableau_12_mois) {
      plan.tresorerie_mensuelle = plan.tresorerie.tableau_12_mois;
    }
    // acquisition à la racine (compat renderer)
    if (!plan.acquisition_list && plan.acquisition?.canaux) {
      plan.acquisition_list = plan.acquisition.canaux;
    }
    // rev_mensuel array pour charts
    if (!plan.rev_mensuel && plan.projections_revenus?.tableau_mensuel_an1) {
      plan.rev_mensuel = plan.projections_revenus.tableau_mensuel_an1.map(m => {
        const val = String(m.ca_ht || '0').replace(/[^0-9]/g, '');
        return parseInt(val, 10) || 0;
      });
    }
    // scenarios à la racine
    if (!plan.scenarios && plan.projections_revenus?.scenarios) {
      plan.scenarios = plan.projections_revenus.scenarios;
    }

    // ── Méta complétude ──────────────────────────────────────────────
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
      const v = plan[k];
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.length > 5;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    });
    plan._completeness = { present: presentSections.length, total: REQUIRED_SECTIONS.length, sections: presentSections };
    plan._meta = {
      verified_data: formData._verifiedData,
      generation_ms: Date.now() - startTime,
      pipeline_version: 'v2.1-bancabilite',
    };

    if (isDiscovery) {
      plan._discovery = true;
      plan._watermark = 'Plan incomplet — Passe à Solo pour le plan complet';
    }

    console.log(`[generate-plan v2.1] Généré — ${presentSections.length}/${REQUIRED_SECTIONS.length} sections — ${Date.now() - startTime}ms`);

    return res.status(200).json({
      ...planData,
      content: [{ type: 'text', text: JSON.stringify(plan) }],
    });

  } catch (err) {
    console.error('[generate-plan v2.1] Error:', err);
    return res.status(500).json({ error: { message: 'Erreur serveur: ' + err.message } });
  }
}
