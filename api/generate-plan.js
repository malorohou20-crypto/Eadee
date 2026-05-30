export const config = { runtime: 'nodejs' };

// =====================================================================
// EADEE — Pipeline génération business plan v3.0
// Appel unique Anthropic — 23 sections — Prompt Unifié v2.1
// Runtime : Node.js (jsonrepair)
// =====================================================================

import { jsonrepair } from 'jsonrepair';
import { fetchINSEEData } from './lib/insee.js';
import { getKnowledgeContext } from './lib/knowledge.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────

const EADEE_SYSTEM_PROMPT = `Tu es EADEE, un expert en création d'entreprise français. Tu génères des business plans complets, professionnels et personnalisés pour tout type de projet — de la structuration d'idée au dossier bancaire.

━━ RÈGLES FONDAMENTALES ━━

1. ADAPTABILITÉ INTELLIGENTE
   Ne génère une section que si elle est pertinente pour CE projet.
   Un freelance solo n'a pas besoin d'un plan RH.
   Une app SaaS n'a pas de bail commercial.
   Adapte toujours le niveau de détail au projet réel.

2. MARQUEURS DE FIABILITÉ — OBLIGATOIRES SUR TOUS LES CHIFFRES
   {{V:valeur|source}}    → chiffre sourcé (INSEE, Banque de France, rapport sectoriel...)
   {{E:valeur|calcul}}    → estimation calculée (ex: E:2400€|200€ x 12 mois)
   {{H:valeur|hypothèse}} → hypothèse à valider (ex: H:15%|taux conversion estimé)
   JAMAIS de chiffre sans marqueur. Si non sourcé → {{H:}} avec explication.

3. INTELLIGENCE CONDITIONNELLE
   Analyse le type de projet, secteur, profil porteur, montant.
   50k€ auto-entrepreneur ≠ 500k€ SARL avec local.

4. FORMAT DE SORTIE
   JSON valide uniquement. Zéro markdown. Zéro preamble. Zéro commentaire.
   Sections non applicables → retourner null explicitement (pas omis).

━━ RÈGLES DE CALCUL OBLIGATOIRES ━━

C1. BILAN ÉQUILIBRÉ : Calcule d'abord le passif (capital + résultat + dettes). Puis actif = passif — déduis les disponibilités comme résidu (disponibilites = total_actif - immobilisations_nettes - stocks - créances). total_actif DOIT toujours égaler total_passif.

C2. JALONS DEPUIS TABLEAU MENSUEL : Les jalons (mois 1/3/6/9/12) doivent reprendre les CA réels du tableau_mensuel_an1. Le jalon mois=12 = CA ANNUEL TOTAL (somme des 12 mois), pas la valeur mensuelle de décembre. Mois 24 et 36 = extrapolations cohérentes.

C3. TRÉSORERIE COHÉRENTE : solde_minimum = réel MIN(solde_cumule) sur 12 mois. Les alertes ne s'affichent que quand solde_cumule < 0. Ne pas mettre "alerte" pour des mois positifs.

C4. CAC JAMAIS 0€ : Chaque canal d'acquisition doit avoir un cac_estime non nul. Format : {{H:XX€/mois|explication}}.

━━ 15 CONTRÔLES DE COHÉRENCE AVANT DE RETOURNER LE JSON ━━

FINANCIERS :
□ plan_financement.total_besoins === plan_financement.total_ressources
  Si non → ajuster tresorerie_securite ou signaler dans commentaire_equilibre
□ score_bancabilite.apport_suffisant cohérent avec ratio apport/total_besoins réel
□ Si résultat positif à M6 → trésorerie ne peut pas être négative sans explication BFR
□ mois break-even dans seuil_rentabilite = mois où resultat_net > 0 dans tableau mensuel
□ BFR calculé = BFR financé dans plan_financement.besoins.bfr_demarrage
□ mensualite_estimee < 30% marge nette mensuelle an1 (sinon → alerte verdict)
□ bilan actif total === bilan passif total (bilan toujours équilibré)
□ scénario pessimiste CA < réaliste CA < optimiste CA

CONTENU :
□ Tous les chiffres ont un marqueur {{V/E/H}} avec source
□ Sources dans {{V:}} sont des organismes réels (INSEE, BPI, Xerfi...) — si non vérifiable → {{H:}}
□ Les 4-5 concurrents sont des entreprises réellement existantes en France
□ Les aides listées correspondent au profil réel (ACRE → demandeur emploi seulement, JEI → R&D)

CONDITIONNEL :
□ Sections non applicables retournent null
□ Si local = false → bail absent de la checklist
□ Bloc disclaimer présent et complet — non négociable

SI UN CONTRÔLE ÉCHOUE : Corriger avant de retourner. Si impossible → ajouter "alertes_coherence": ["description"] pour affichage frontend.`;

// ── USER PROMPT BUILDER ───────────────────────────────────────────────

function buildUserPrompt(data) {
  const kb = getKnowledgeContext();

  return `Génère un business plan complet pour le projet suivant.

━━ INFORMATIONS DE BASE ━━
Nom du projet      : ${data.nom_projet || 'Non renseigné'}
Secteur            : ${data.secteur || 'Non renseigné'}${data.sous_secteur ? ' / ' + data.sous_secteur : ''}
Type de projet     : ${data.type_projet || 'creation'}
Forme juridique    : ${data.forme_juridique || 'à recommander'}
Stade              : ${data.stade || 'lancement'}

━━ PORTEUR DE PROJET ━━
Prénom             : ${data.prenom || 'Non renseigné'}${data.nom_porteur ? ' ' + data.nom_porteur : ''}
Expérience secteur : ${data.experience_secteur || '0'} ans
Expérience gestion : ${data.experience_gestion || 'non'}
Formation          : ${data.formation || 'Non renseignée'}
Situation actuelle : ${data.situation || 'non renseigné'}
Apport personnel   : ${data.apport_personnel || '0'}€
Charges perso/mois : ${data.charges_personnelles || 'non renseigné'}€
Crédits en cours   : ${data.credits_en_cours || 'aucun'}

━━ PROJET ━━
Description        : ${data.description_projet || 'Non renseignée'}
Zone géographique  : ${data.zone_geo || 'France'}${data.region ? ' (' + data.region + ')' : ''}
Local nécessaire   : ${data.local_necessaire || 'non'}
Bail signé         : ${data.bail_signe || 'non'}
Employés prévus    : ${data.employes_prevus || 0}
Clientèle cible    : ${data.clientele || 'mixte'}
${data.loyer_mensuel ? 'Loyer mensuel         : ' + data.loyer_mensuel + '€' : ''}
${data.capacite_accueil ? 'Capacité accueil      : ' + data.capacite_accueil + ' couverts' : ''}
${data.ticket_moyen ? 'Ticket moyen          : ' + data.ticket_moyen + '€' : ''}
${data.jours_ouverture ? 'Jours ouverture/sem   : ' + data.jours_ouverture : ''}

━━ FINANCIER ━━
Investissement total : ${data.investissement_total || 'à estimer'}€
Montant prêt visé    : ${data.montant_pret || 'à calculer'}€
Durée souhaitée      : ${data.duree_pret || 'à recommander'} ans
Autres financements  : ${data.autres_financements || 'aucun'}
CA visé année 1      : ${data.ca_an1 || 'à estimer'}€
CA visé année 3      : ${data.ca_an3 || 'à estimer'}€

━━ CONTEXTE SPÉCIFIQUE ━━
Secteur réglementé          : ${data.secteur_reglemente || 'non'}
Autorisations déjà obtenues : ${data.autorisations || 'aucune'}
Concurrents identifiés      : ${data.concurrents_connus || 'non renseigné'}
Clients / preuves marché    : ${data.preuves_marche || 'aucune'}
Associés                    : ${data.nb_associes || 1}
${data.licence_iv ? 'Licence IV            : oui' : ''}
${data.haccp ? 'HACCP                 : oui' : ''}
${data.masse_salariale ? 'Masse salariale/mois  : ' + data.masse_salariale + '€' : ''}
${data.aides_visees && data.aides_visees.length ? 'Aides visées          : ' + data.aides_visees.join(', ') : ''}

━━ DONNÉES MARCHÉ VÉRIFIÉES (INSEE) ━━
${JSON.stringify(data._verifiedData || {}, null, 2)}

━━ RÈGLES INTELLIGENTES ━━
${buildIntelligentRules(data)}

Génère le business plan complet en JSON valide selon la structure EADEE v2.1 ci-dessous.
Retourne UNIQUEMENT le JSON, sans markdown, sans backtick, sans commentaire.

${buildOutputSchema(data)}`;
}

// ── RÈGLES INTELLIGENTES CONTEXTUELLES ───────────────────────────────

function buildIntelligentRules(data) {
  const rules = [];
  const secteur = (data.secteur || '').toLowerCase();
  const desc = (data.description_projet || '').toLowerCase();
  const situation = (data.situation || '').toLowerCase();
  const investissement = parseInt(String(data.investissement_total || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const apport = parseInt(String(data.apport_personnel || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const employes = parseInt(String(data.employes_prevus || '0'), 10) || 0;
  const localNecessaire = data.local_necessaire === 'oui' || data.local_necessaire === true;
  const associes = parseInt(String(data.nb_associes || '1'), 10) || 1;

  // R1 — Secteur réglementé
  const secteurReglemente = ['restauration','bar','tabac','pharmacie','medecine','médecine','droit','comptabilite','comptabilité','securite','sécurité','finance','assurance','btp','transport','creche','crèche','ecole','école'].some(s => secteur.includes(s) || desc.includes(s));
  if (secteurReglemente || data.secteur_reglemente === 'oui') {
    rules.push('RÈGLE 1 — SECTEUR RÉGLEMENTÉ DÉTECTÉ : mettre categorie_4 avec applicable:true et items spécifiques au secteur (licences, diplômes, autorisations préfectorales...). Alerter dans score_bancabilite sur autorisations bloquantes.');
  }

  // R2 — Demandeur d'emploi
  if (situation.includes('demandeur') || situation === 'demandeur_emploi') {
    rules.push('RÈGLE 2 — DEMANDEUR D\'EMPLOI : prioriser ACRE + ARCE dans aides_subventions avec montants précis. Mentionner maintien ARE dans porteur_projet. Intégrer ARCE dans plan_financement si pertinent.');
  }

  // R3 — Montant élevé
  if (investissement > 100000) {
    rules.push('RÈGLE 3 — MONTANT ÉLEVÉ (>' + investissement.toLocaleString('fr-FR') + '€) : garantie BPI obligatoire dans garanties_bancaires. Bilan 3 ans complet et détaillé. Mentionner Réseau Entreprendre / Initiative France.');
  }

  // R4 — Apport insuffisant
  if (investissement > 0 && apport / investissement < 0.20) {
    rules.push('RÈGLE 4 — APPORT INSUFFISANT (<20%) : score_bancabilite.apport_suffisant = 0 points. Alerte dans plan_financement. Suggérer love money, prêt d\'honneur, subvention.');
  }

  // R5 — Solo
  if (employes === 0) {
    rules.push('RÈGLE 5 — SOLO SANS EMPLOYÉS : postes_cles = null ou tableau vide. Simplifier aspects_organisationnels. Inclure risque solo dans risques.');
  }

  // R6 — Sans local
  if (!localNecessaire && data.local_necessaire !== 'oui') {
    rules.push('RÈGLE 6 — SANS LOCAL : bail_commercial = non applicable dans checklist. Adapter domiciliation (domicile ou coworking). Pas de postes travaux dans investissements.');
  }

  // R7 — Digital/E-commerce
  if (['e-commerce','saas','app','digital','marketplace','web','tech','logiciel','software'].some(k => secteur.includes(k) || desc.includes(k))) {
    rules.push('RÈGLE 7 — DIGITAL/TECH : générer propriete_intellectuelle. RGPD + CGV dans autorisations. KPIs : CAC, LTV, churn, MRR. Acquisition : SEA, SEO, social ads.');
  }

  // R8 — Plusieurs associés
  if (associes > 1) {
    rules.push('RÈGLE 8 — PLUSIEURS ASSOCIÉS (' + associes + ') : générer cap_table. Pacte d\'associés dans aspects_juridiques. Complémentarité équipe dans porteur_projet.');
  }

  return rules.length ? rules.join('\n') : 'Aucune règle spéciale — projet standard.';
}

// ── SCHÉMA DE SORTIE JSON ─────────────────────────────────────────────

function buildOutputSchema(data) {
  const date = new Date().toISOString();
  const needsLoan = data.montant_pret && parseInt(String(data.montant_pret).replace(/[^0-9]/g, ''), 10) > 0;
  const associes = parseInt(String(data.nb_associes || '1'), 10) || 1;
  const isDigital = ['e-commerce','saas','app','digital','marketplace','web','tech'].some(k =>
    (data.secteur || '').toLowerCase().includes(k) || (data.description_projet || '').toLowerCase().includes(k));

  return `{
  "meta": {
    "nom_business": "string",
    "tagline": "string — accroche mémorable en 1 phrase",
    "pitch_30s": "string — pitch oral naturel, 30 secondes",
    "date_generation": "${date}",
    "version": "2.1",
    "type_projet_detecte": "string",
    "secteur_reglemente": false,
    "complexite_dossier": "simple | standard | complexe",
    "structure_plan": {
      "sections_principales": 23,
      "extras_inclus": ["templates_communication", "kpis", "demarches_administratives", "ressources_gratuites"],
      "label_extras": "Bonus inclus dans ton plan"
    }
  },

  "disclaimer": {
    "message_entrepreneur": {
      "titre": "Ce plan est un point de départ solide — pas un document certifié.",
      "corps": "EADEE a structuré votre projet selon les standards professionnels français. Ce business plan vous fait gagner plusieurs semaines de travail. Avant tout engagement financier, faites-le valider par un expert-comptable ou un conseiller CCI.",
      "recommandation": "Prévoyez 2 à 4h avec un expert-comptable (~300-600€) ou un RDV gratuit CCI avant votre rendez-vous bancaire."
    },
    "fiabilite_chiffres": {
      "V_verifie": "Sourcé — issu d'une source publique identifiée.",
      "E_estime": "Estimé — calculé à partir de vos données et d'hypothèses sectorielles standard.",
      "H_hypothese": "Hypothèse — à valider avant de présenter à une banque."
    },
    "ce_que_fait_ce_plan": [
      "Structure votre projet selon les standards professionnels français",
      "Calcule des projections financières cohérentes et justifiées",
      "Vous prépare aux questions d'un banquier ou d'un conseiller BPI"
    ],
    "ce_que_ne_fait_pas_ce_plan": [
      "Ne remplace pas les vrais documents physiques (Kbis, devis, avis d'imposition...)",
      "Ne garantit pas l'obtention d'un financement bancaire",
      "Ne remplace pas le conseil d'un expert-comptable"
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
        "differenciation":    { "points": 0, "commentaire": "string" },
        "proposition_valeur": { "points": 0, "commentaire": "string" },
        "preuves_marche":     { "points": 0, "commentaire": "string" },
        "experience_secteur": { "points": 0, "commentaire": "string" },
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
      "message_banquier": "string",
      "plan_amelioration": {
        "applicable": true,
        "actions": [
          { "priorite": 1, "action": "string — action concrète pour améliorer la bancabilité", "impact": "string", "delai": "string" },
          { "priorite": 2, "action": "string", "impact": "string", "delai": "string" },
          { "priorite": 3, "action": "string", "impact": "string", "delai": "string" }
        ],
        "message": "string — message d'encouragement synthétique"
      }
    }
  },

  "resume_executif": {
    "synthese_projet": "string — 3-4 phrases, chiffres sourcés, style factuel",
    "chiffres_cles": {
      "investissement_total": "{{V/E:montant€|...}}",
      "apport_personnel": "{{V:montant€|déclaré}}",
      "financement_externe": "{{E:montant€|...}}",
      "ca_annee_1": "{{H:montant€|...}}",
      "ca_annee_3": "{{H:montant€|...}}",
      "point_mort_mois": "{{E:X mois|...}}",
      "premier_benefice_mois": "{{E:X mois|...}}"
    },
    "vision_banquier": {
      "montant_demande": "{{V:montant€|...}}",
      "duree_souhaitee": "string",
      "mensualite_estimee": "{{E:montant€/mois|amortissement estimé}}",
      "garanties_proposees": ["string"],
      "argument_principal": "string"
    }
  },

  "porteur_projet": {
    "profil": {
      "presentation": "string — 3-4 phrases narratives",
      "competences_cles": ["string", "string", "string", "string"],
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
      "capacite_remboursement_estimee": "{{E:montant€/mois|revenus projetés - charges - crédits}}",
      "documents_a_fournir": [
        "Pièce d'identité valide",
        "CV détaillé",
        "Avis d'imposition N-1 et N-2",
        "Relevés de compte personnel 3 derniers mois",
        "Justificatifs d'apport personnel"
      ]
    }
  },

  "presentation_projet": {
    "origine_idee": "string",
    "probleme_resolu": "string — douleur concrète du client cible",
    "vision_3_ans": "string",
    "stade_actuel": "string",
    "preuves_concept": "string | null"
  },

  "persona": {
    "nom_fictif": "string",
    "age": 0,
    "situation": "string",
    "revenus_mensuels": "{{H:montant€|...}}",
    "probleme_principal": "string",
    "motivations": ["string", "string", "string"],
    "freins_achat": ["string", "string"],
    "canal_prefere": "string",
    "citation_typique": "string"
  },

  "marche": {
    "taille_france": "{{V:montant€|source + année}}",
    "taux_croissance": "{{V:XX%|source + année}}",
    "tendances_cles": ["string", "string", "string"],
    "zone_chalandise": "locale | régionale | nationale | internationale",
    "part_marche_visee_an1": "{{H:XX%|à justifier}}",
    "analyse_sectorielle": "string"
  },

  "proposition_valeur": {
    "usp": "string — différenciation réelle",
    "benefices_clients": ["string", "string", "string"],
    "preuves_valeur": "string"
  },

  "concurrents": [
    {
      "nom": "string — entreprise réelle existante",
      "type": "direct | indirect | substitut",
      "prix_indicatif": "{{V:fourchette€|source}}",
      "points_forts": "string",
      "points_faibles": "string",
      "niveau_menace": "faible | moyen | élevé",
      "notre_avantage": "string"
    }
  ],

  "modele_economique": {
    "type": "string — vente directe | abonnement | marketplace | freemium | licence",
    "description": "string",
    "offres": [
      {
        "nom": "string",
        "description": "string",
        "prix_ht": "{{V/H:montant€|...}}",
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
        "priorite": "principale | secondaire",
        "delai_premier_client": "string"
      }
    ]
  },

  "aspects_juridiques": {
    "statut_recommande": "string",
    "justification": "string",
    "regime_fiscal": "IS | IR | micro",
    "regime_social": "TNS | assimilé salarié",
    "avantages": ["string", "string", "string"],
    "etapes_creation": [
      { "etape": "string", "delai": "string", "cout": "{{V/E:montant€|...}}", "organisme": "string" }
    ],
    "autorisations_sectorielles": null,
    "garanties_bancaires": {
      "caution_personnelle": "recommandée | optionnelle | non applicable",
      "nantissement": "applicable | non applicable",
      "garantie_bpi": "applicable | à vérifier | non applicable",
      "commentaire": "string"
    }
  },

  "aspects_organisationnels": {
    "structure_equipe": "solo | associés | salariés",
    "postes_cles": null,
    "locaux": {
      "necessaire": false,
      "type": null,
      "loyer_mensuel": null,
      "bail_statut": null
    },
    "outils": [
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
      "pret_bancaire": "{{E:montant€|...}}",
      "pret_bpi": null,
      "pret_honneur": null,
      "subventions": null,
      "love_money": null,
      "total_ressources": "{{E:montant€|somme — DOIT ÉGALER total_besoins}}"
    },
    "equilibre": true,
    "commentaire_equilibre": "string",
    "ratio_apport": "{{E:XX%|apport/total besoins}}",
    "message_banquier": "string"
  },

  "investissements": {
    "postes": [
      {
        "poste": "string",
        "niveau": "indispensable | recommandé | optionnel",
        "montant": "{{V/E:montant€|...}}",
        "nb_devis_recommandes": 2,
        "financable_bpi": false
      }
    ],
    "total": "{{E:montant€|somme}}",
    "conseil_devis": "La banque demandera 2 devis comparatifs par poste important (>1000€)."
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
      "definition": "string",
      "calcul": "{{E:montant€|...}}",
      "interpretation": "string",
      "conseil": "string"
    }
  },

  "seuil_rentabilite": {
    "ca_seuil_mensuel": "{{E:montant€|charges fixes / taux marge}}",
    "ca_seuil_annuel": "{{E:montant€|x12}}",
    "nb_ventes_necessaires": "{{E:nombre|CA seuil / panier moyen}}",
    "mois_atteinte_prevu": "{{E:X mois|...}}",
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
      { "mois": "Janvier",   "ca_ht": "{{H:montant€|...}}", "charges_variables": "{{E:montant€|...}}", "charges_fixes": "{{E:montant€|...}}", "resultat_net": "{{E:montant€|CA - charges}}" },
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

  "tresorerie": {
    "tableau_12_mois": [
      { "mois": "M1",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M2",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M3",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M4",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M5",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M6",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M7",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M8",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M9",  "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M10", "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M11", "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null },
      { "mois": "M12", "encaissements": "{{H:montant€|...}}", "decaissements": "{{E:montant€|...}}", "solde_mois": "{{E:montant€|...}}", "solde_cumule": "{{E:montant€|...}}", "alerte": null }
    ],
    "solde_minimum": "{{E:montant€|point bas}}",
    "mois_critique": null,
    "recommandations": ["string", "string"]
  },

  "bilan_previsionnel": {
    "annee_1": {
      "actif": {
        "immobilisations_nettes": "{{E:montant€|...}}",
        "stocks": null,
        "creances_clients": "{{E:montant€|...}}",
        "disponibilites": "{{E:montant€|trésorerie fin an1}}",
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
        "autonomie_financiere": "{{E:XX%|fonds propres/total bilan}}",
        "ratio_endettement": "{{E:XX%|dettes/fonds propres}}",
        "interpretation": "string"
      }
    },
    "annee_2": {
      "actif": {
        "immobilisations_nettes": "{{E:montant€|...}}",
        "disponibilites": "{{E:montant€|trésorerie fin an2}}",
        "total_actif": "{{E:montant€|somme}}"
      },
      "passif": {
        "capital_social": "{{V:montant€|identique an1}}",
        "reserves": "{{E:montant€|résultat an1}}",
        "resultat": "{{E:montant€|...}}",
        "dettes_financieres": "{{E:montant€|capital restant dû fin an2}}",
        "total_passif": "{{E:montant€|somme}}"
      },
      "ratios": {
        "autonomie_financiere": "{{E:XX%|...}}",
        "interpretation": "string"
      }
    },
    "annee_3": {
      "actif": {
        "immobilisations_nettes": "{{E:montant€|...}}",
        "disponibilites": "{{E:montant€|trésorerie fin an3}}",
        "total_actif": "{{E:montant€|somme}}"
      },
      "passif": {
        "capital_social": "{{V:montant€|identique an1}}",
        "reserves": "{{E:montant€|résultats an1+an2}}",
        "resultat": "{{E:montant€|...}}",
        "dettes_financieres": "{{E:montant€|capital restant dû fin an3}}",
        "total_passif": "{{E:montant€|somme}}"
      },
      "ratios": {
        "autonomie_financiere": "{{E:XX%|...}}",
        "interpretation": "string"
      }
    }
  },

  ${needsLoan ? `"tableau_amortissement": {
    "parametres": {
      "capital_emprunte": "{{V:montant€|déclaré}}",
      "taux_annuel_estime": "{{H:XX%|taux moyen TPE France 2024 entre 4.5% et 6.5%}}",
      "duree_annees": "number",
      "mensualite_estimee": "{{E:montant€|K × t/(1-(1+t)^-n)}}",
      "total_interets": "{{E:montant€|...}}",
      "cout_total_credit": "{{E:montant€|...}}"
    },
    "echeancier_annuel": [
      { "annee": 1, "mensualite": "{{E:montant€|...}}", "capital_rembourse_annee": "{{E:montant€|...}}", "interets_payes_annee": "{{E:montant€|...}}", "capital_restant_du_fin_annee": "{{E:montant€|...}}" }
    ],
    "analyse_remboursement": {
      "mensualite_vs_marge_nette_an1": "{{E:XX%|...}}",
      "verdict": "string — Confortable <15% | Correct 15-25% | Tendu >25%",
      "option_differe": { "recommande": false, "type": "différé partiel", "duree": "string", "explication": "string" }
    },
    "conseils_negociation": ["string", "string", "string"]
  },` : `"tableau_amortissement": null,`}

  "risques": [
    { "risque": "string", "probabilite": "moyenne", "impact": "moyen", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "élevée",  "impact": "élevé", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "faible",  "impact": "élevé", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "moyenne", "impact": "faible","solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" },
    { "risque": "string", "probabilite": "faible",  "impact": "moyen", "solution_preventive": "string", "solution_curative": "string", "signal_alarme": "string" }
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

  "annexes_checklist": {
    "categorie_1": {
      "titre": "Identité et situation personnelle",
      "ordre": 1,
      "applicable": true,
      "items": [
        { "document": "Pièce d'identité valide",                     "statut": "bloquant",      "delai": "immédiat" },
        { "document": "CV détaillé orienté entrepreneur",             "statut": "bloquant",      "delai": "1-2 jours" },
        { "document": "Justificatif de domicile récent",              "statut": "bloquant",      "delai": "immédiat" },
        { "document": "Justificatif de domiciliation entreprise",     "statut": "bloquant",      "delai": "immédiat à 1 semaine" },
        { "document": "Statuts de la société rédigés",                "statut": "bloquant",      "delai": "3-10 jours" },
        { "document": "Attestation RC Pro ou devis assurance",        "statut": "conditionnel",  "delai": "1-5 jours" }
      ]
    },
    "categorie_2": {
      "titre": "Situation financière personnelle",
      "ordre": 2,
      "applicable": true,
      "items": [
        { "document": "Avis d'imposition N-1 et N-2",                "statut": "bloquant",      "delai": "immédiat" },
        { "document": "Relevés de compte personnel 3 derniers mois", "statut": "bloquant",      "delai": "immédiat" },
        { "document": "Justificatifs d'apport personnel",            "statut": "bloquant",      "delai": "immédiat" },
        { "document": "Situation patrimoniale détaillée",             "statut": "tres_important","delai": "2-3 jours" },
        { "document": "Tableau des crédits en cours",                 "statut": "tres_important","delai": "immédiat" }
      ]
    },
    "categorie_3": {
      "titre": "Dossier business plan & documents financiers",
      "ordre": 3,
      "applicable": true,
      "items": [
        { "document": "Business plan complet",                      "statut": "bloquant",      "delai": "inclus ✅" },
        { "document": "Plan de financement besoins/ressources",     "statut": "bloquant",      "delai": "inclus ✅" },
        { "document": "Compte de résultat prévisionnel 3 ans",      "statut": "bloquant",      "delai": "inclus ✅" },
        { "document": "Bilan prévisionnel 3 ans",                   "statut": "bloquant",      "delai": "inclus ✅" },
        { "document": "Plan de trésorerie 12 mois",                 "statut": "bloquant",      "delai": "inclus ✅" },
        { "document": "Seuil de rentabilité avec délai",            "statut": "bloquant",      "delai": "inclus ✅" },
        { "document": "Tableau d'amortissement",                    "statut": "bloquant",      "delai": "inclus ✅" },
        { "document": "2 devis comparatifs par poste >1000€",       "statut": "bloquant",      "delai": "1-3 semaines" },
        { "document": "Scénarios pessimiste/réaliste/optimiste",    "statut": "tres_important","delai": "inclus ✅" }
      ]
    },
    "categorie_4": {
      "titre": "Autorisations sectorielles",
      "ordre": 4,
      "applicable": false,
      "items": []
    },
    "categorie_5": {
      "titre": "Garanties et cautions",
      "ordre": 5,
      "applicable": true,
      "items": [
        { "document": "Caution personnelle (lettre d'engagement)",   "statut": "conditionnel",  "delai": "selon banque" },
        { "document": "Garantie BPI France — dossier initié",        "statut": "conditionnel",  "delai": "RDV sous 2-4 semaines" },
        { "document": "Nantissement fonds de commerce ou matériel",  "statut": "conditionnel",  "delai": "selon banque" },
        { "document": "Prêt d'honneur (réseau Initiative/Entreprendre)", "statut": "souhaitable","delai": "4-8 semaines" }
      ]
    },
    "categorie_6": {
      "titre": "Preuves de concept et marché",
      "ordre": 6,
      "applicable": true,
      "items": [
        { "document": "Étude de marché avec sources datées",         "statut": "tres_important", "delai": "inclus ✅" },
        { "document": "Benchmark concurrentiel",                     "statut": "tres_important", "delai": "inclus ✅" },
        { "document": "Lettre d'intention ou bon de commande client","statut": "tres_important", "delai": "à obtenir avant RDV" },
        { "document": "Subventions régionales identifiées",          "statut": "souhaitable",    "delai": "1-2 jours" },
        { "document": "Courrier de présentation banque",             "statut": "tres_important", "delai": "inclus ✅" }
      ]
    },
    "score_readiness": {
      "description": "Score de préparation du dossier bancaire",
      "calcul": "items bloquants cochés / total items bloquants × 100",
      "seuils": {
        "rouge": "< 60% — Dossier incomplet",
        "orange": "60-80% — Dossier partiel, RDV possible avec réserves",
        "vert": "> 80% — Dossier solide, RDV recommandé"
      }
    }
  },

  "kpis": {
    "operationnels": [
      { "kpi": "string", "cible_m3": "{{H:valeur|...}}", "cible_m12": "{{H:valeur|...}}", "comment_mesurer": "string" }
    ],
    "financiers_bancaires": [
      { "kpi": "string", "valeur": "string", "cible": "string", "interpretation_bancaire": "string" }
    ]
  },

  "aides_subventions": {
    "eligibles": [
      {
        "aide": "string — nom exact",
        "organisme": "string",
        "montant": "{{V/E:montant€|source officielle}}",
        "conditions": ["string", "string"],
        "demarche": "string",
        "delai_reponse": "string",
        "priorite": "haute | moyenne | faible",
        "pourquoi_eligible": "string"
      }
    ],
    "total_potentiel": "{{E:montant€|somme}}",
    "conseil_strategique": "string"
  },

  "demarches_administratives": [
    { "etape": "string", "organisme": "string", "delai_reel": "string", "cout": "{{V:montant€|tarif officiel}}", "bloquante": true }
  ],

  "templates_communication": {
    "email_presentation_banque": { "objet": "string", "corps": "string" },
    "email_prospection_client":  { "objet": "string", "corps": "string" },
    "email_relance":             { "objet": "string", "corps": "string" },
    "email_fournisseur":         { "objet": "string", "corps": "string" }
  },

  "propriete_intellectuelle": ${isDigital ? '{ "marques": [], "brevets": null, "droits_auteur": "string", "nom_domaine": "string" }' : 'null'},
  "cap_table": ${associes > 1 ? '{ "associes": [], "pacte_requis": true }' : 'null'},
  "franchise_specifique": null,
  "reprise_specifique": null,
  "alertes_coherence": []
}`;
}

// ── NORMALISATION DES DONNÉES FORMULAIRE ─────────────────────────────

function normalizeFormData(body) {
  const porteur = body.porteur || {};
  return {
    nom_projet:           body.nom_projet          || body.idea         || '',
    secteur:              body.secteur              || body.sector       || '',
    sous_secteur:         body.sous_secteur         || '',
    type_projet:          body.type_projet          || 'creation',
    forme_juridique:      body.forme_juridique      || body.statut_juridique || '',
    stade:                body.stade                || body.time         || 'lancement',
    prenom:               body.prenom               || porteur.prenom    || '',
    nom_porteur:          body.nom_porteur          || porteur.nom       || '',
    experience_secteur:   body.experience_secteur   || porteur.annees_experience || body.annees_experience || '0',
    experience_gestion:   body.experience_gestion   || 'non',
    formation:            body.formation            || porteur.diplome   || '',
    situation:            body.situation            || porteur.situation  || body.profile || '',
    apport_personnel:     body.apport_personnel     || body.budget       || '0',
    charges_personnelles: body.charges_personnelles || porteur.charges_mensuelles || '',
    credits_en_cours:     body.credits_en_cours     || 'aucun',
    description_projet:   body.description_projet   || body.description  || body.idea || '',
    zone_geo:             body.zone_geo             || body.ville        || body.city  || 'France',
    region:               body.region               || '',
    local_necessaire:     body.local_necessaire     !== undefined ? body.local_necessaire : (body.loyer_mensuel ? 'oui' : 'non'),
    bail_signe:           body.bail_signe           || 'non',
    employes_prevus:      body.employes_prevus      || body.nb_employes  || 0,
    clientele:            body.clientele            || 'mixte',
    investissement_total: body.investissement_total || body.budget_total || body.budget || '',
    montant_pret:         body.montant_pret         || '',
    duree_pret:           body.duree_pret           || '',
    autres_financements:  body.autres_financements  || 'aucun',
    ca_an1:               body.ca_an1               || '',
    ca_an3:               body.ca_an3               || '',
    secteur_reglemente:   body.secteur_reglemente   || 'non',
    autorisations:        body.autorisations        || 'aucune',
    concurrents_connus:   body.concurrents_connus   || (Array.isArray(body.concurrents_locaux) ? body.concurrents_locaux.join(', ') : '') || '',
    preuves_marche:       body.preuves_marche       || 'aucune',
    nb_associes:          body.nb_associes          || 1,
    licence_iv:           body.licence_iv           || false,
    type_restauration:    body.type_restauration    || '',
    haccp:                body.haccp                || false,
    aides_visees:         body.aides_visees         || [],
    loyer_mensuel:        body.loyer_mensuel        || '',
    masse_salariale:      body.masse_salariale_mensuelle || '',
    ticket_moyen:         body.ticket_moyen         || '',
    capacite_accueil:     body.capacite_accueil     || '',
    jours_ouverture:      body.jours_ouverture      || '',
    credits:              body.credits,
  };
}

// ── APPEL ANTHROPIC AVEC RETRY 429/529 ───────────────────────────────

async function callAnthropicAPI(body, label, signal, extraHeaders = {}) {
  const HEADERS = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    ...extraHeaders,
  };
  for (let attempt = 1; attempt <= 2; attempt++) {
    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body),
      signal,
    });
    if (resp.ok) return resp;
    const err = await resp.json().catch(() => ({}));
    const msg = `${label} API error ${resp.status}: ${err?.error?.message || JSON.stringify(err).slice(0, 200)}`;
    if ((resp.status === 529 || resp.status === 429) && attempt < 2) {
      const wait = resp.status === 429 ? 15000 : 8000;
      console.warn(`[EADEE] ${msg} — retry dans ${wait / 1000}s...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    const e = new Error(msg);
    e.apiError = err;
    e.status = resp.status;
    throw e;
  }
}

// ── EXTRACTION JSON ───────────────────────────────────────────────────

function extractJSON(text) {
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Pas de JSON dans la réponse');
  let raw = text.slice(start, end + 1);

  // Fix marqueurs {{V/E/H:...}} non quotés
  raw = raw.replace(/(?<!"):(\s*)(\{\{[VEH]:[^\n"]*?\}\})(?!")/g, ':$1"$2"');
  // Fix marqueurs tronqués en fin (max_tokens)
  raw = raw.replace(/(?<!"):(\s*)(\{\{[VEH]:[^\n"]*)$/g, ':$1"$2}}"');

  try {
    return JSON.parse(raw);
  } catch (e1) {
    try {
      return JSON.parse(jsonrepair(raw));
    } catch (e2) {
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

// ── HANDLER PRINCIPAL ─────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // ── Auth guard — Bearer JWT Supabase ──────────────────────────────────
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: { message: 'Non authentifié' } });
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
    });
    if (!userRes.ok) return res.status(401).json({ error: { message: 'Token invalide' } });
  } catch (_) {
    return res.status(401).json({ error: { message: 'Vérification auth échouée' } });
  }

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

    // ── Pipeline v3.0 — Appel unique ─────────────────────────────────
    const formData = normalizeFormData(req.body);
    if (!formData.description_projet && !formData.nom_projet) {
      return res.status(400).json({ error: 'Champ "idea" ou "description_projet" requis' });
    }

    const credits   = parseInt(String(formData.credits ?? '1'), 10);
    const isDiscovery = credits === 0;

    console.log(`[EADEE v3.0] Début — ${(formData.nom_projet || formData.description_projet).substring(0, 60)} [${isDiscovery ? 'DÉCOUVERTE' : 'COMPLET'}]`);

    // ── Données INSEE (non bloquant) ─────────────────────────────────
    let inseeData = null;
    try {
      inseeData = await fetchINSEEData(formData.secteur, formData.zone_geo);
    } catch (inseeErr) {
      console.warn(`[EADEE v3.0] INSEE failed (non-fatal): ${inseeErr.message}`);
    }
    console.log(`[EADEE v3.0] INSEE: ${!!inseeData?.city} — ${Date.now() - startTime}ms`);

    formData._verifiedData = {
      insee: inseeData,
      generated_at: new Date().toISOString(),
    };

    // ── MODE DÉCOUVERTE (appel unique léger) ─────────────────────────
    if (isDiscovery) {
      const discoveryPrompt = `${buildUserPrompt(formData)}

IMPORTANT — MODE DÉCOUVERTE : génère UNIQUEMENT meta, disclaimer, scores.score_viabilite, porteur_projet.profil, presentation_projet, marche, proposition_valeur, concurrents.
Toutes les autres sections → null.
JSON uniquement, sans markdown.`;

      const discResp = await callAnthropicAPI({
        model: MODEL,
        max_tokens: 3000,
        temperature: 0.3,
        system: EADEE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: discoveryPrompt }],
      }, 'Discovery', AbortSignal.timeout(60000));

      const discData = await discResp.json();
      const discText = (discData.content || []).map(c => c.text || '').join('');
      let discPlan;
      try { discPlan = extractJSON(discText); }
      catch (e) { return res.status(500).json({ error: { message: 'JSON invalide: ' + e.message } }); }

      discPlan._discovery   = true;
      discPlan._watermark   = 'Plan incomplet — Passe à Solo pour le plan complet';
      discPlan._meta        = { generation_ms: Date.now() - startTime, pipeline_version: 'v3.0-discovery' };
      return res.status(200).json({ ...discData, content: [{ type: 'text', text: JSON.stringify(discPlan) }] });
    }

    // ── GÉNÉRATION COMPLÈTE — Appel Anthropic (web_search optionnel) ─
    const userPrompt = buildUserPrompt(formData);

    let resp;
    // Essai avec web_search (beta) — fallback sans outils si 400
    try {
      console.log(`[EADEE v3.0] Appel Anthropic + web_search...`);
      resp = await callAnthropicAPI({
        model: MODEL,
        max_tokens: 16000,
        temperature: 0.3,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: EADEE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }, 'Main', AbortSignal.timeout(280000), {
        'anthropic-beta': 'web-search-2025-03-05',
      });
    } catch (wsErr) {
      if (wsErr.status === 400) {
        console.warn(`[EADEE v3.0] web_search indisponible (${wsErr.message}) — fallback sans outils`);
        resp = await callAnthropicAPI({
          model: MODEL,
          max_tokens: 16000,
          temperature: 0.3,
          system: EADEE_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }, 'Main-fallback', AbortSignal.timeout(280000));
      } else {
        throw wsErr;
      }
    }

    const apiData    = await resp.json();
    const content    = apiData.content || [];

    // ── Extraction texte — ignorer tool_use et tool_result ───────────
    const text       = content.filter(c => c.type === 'text').map(c => c.text || '').join('');
    const stopReason = apiData.stop_reason;
    const tokens     = apiData.usage?.output_tokens;

    // Log du nb de recherches web effectuées
    const searchCalls = content.filter(c => c.type === 'tool_use' && c.name === 'web_search');
    console.log(`[EADEE v3.0] stop_reason: ${stopReason} — tokens: ${tokens} — web_search: ${searchCalls.length}x — ${text.length} chars`);
    if (stopReason === 'max_tokens') {
      console.warn(`[EADEE v3.0] ⚠️ Réponse coupée à max_tokens — JSON potentiellement incomplet`);
    }

    let plan;
    try { plan = extractJSON(text); }
    catch (e) { return res.status(500).json({ error: { message: 'JSON invalide: ' + e.message } }); }

    // ── COMPAT ALIASES (pour le renderer — SANS suppression) ────────
    // score racine pour l'historique
    if (plan.scores?.score_viabilite?.note !== undefined) {
      plan._score_viabilite  = plan.scores.score_viabilite.note;
      plan._score_bancabilite = plan.scores.score_bancabilite?.note || 0;
    }
    // nom_business racine pour l'historique
    if (plan.meta?.nom_business) {
      plan._nom_business = plan.meta.nom_business;
    }

    // ── MÉTA COMPLÉTUDE ──────────────────────────────────────────────
    const REQUIRED = [
      'disclaimer','scores','porteur_projet','resume_executif','presentation_projet',
      'marche','proposition_valeur','concurrents','modele_economique','strategie_commerciale',
      'acquisition','aspects_juridiques','aspects_organisationnels','plan_financement',
      'investissements','finances_detail','seuil_rentabilite','projections_revenus',
      'tresorerie','bilan_previsionnel','risques','plan_actions_90j',
      'aides_subventions','annexes_checklist',
    ];
    const present = REQUIRED.filter(k => {
      const v = plan[k];
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.length > 5;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    });

    const durationMs = Date.now() - startTime;
    console.log(`[EADEE v3.0] Généré — ${present.length}/${REQUIRED.length} sections — ${durationMs}ms`);

    // ── DEBUG ────────────────────────────────────────────────────────
    plan._debug = {
      stop_reason: stopReason,
      tokens_output: tokens,
      duration_ms: durationMs,
      sections_present: present.length,
      sections_total: REQUIRED.length,
      pipeline_version: 'v3.0-websearch',
      sections_ok: stopReason === 'end_turn',
      web_search_calls: searchCalls.length,
      web_search_queries: searchCalls.map(c => c.input?.query).filter(Boolean),
    };

    return res.status(200).json({
      id: `gen-${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: JSON.stringify(plan) }],
      stop_reason: stopReason,
    });

  } catch (err) {
    console.error('[EADEE v3.0] Error:', err);
    return res.status(500).json({ error: { message: 'Erreur serveur: ' + err.message } });
  }
}
