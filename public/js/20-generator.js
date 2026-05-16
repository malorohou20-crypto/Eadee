// ========== GENERATE PLAN — V3 — 20 sections, crescendo 7 jalons, fiabilité ==========

// ─── Prompt 20 sections complet ────────────────────────────────────────────
function buildPlanPrompt20(idea, budget, profile, sector, time) {
  return `Tu es EADEE, expert business plan senior français. Génère un plan COMPLET, ultra-concret et 100% actionnable.

PROJET :
- Idée : ${idea}
- Budget : ${budget}
- Profil : ${profile}
- Secteur : ${sector}
- Disponibilité : ${time}
- Marché : France, ${new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}

MARQUEURS DE FIABILITÉ — OBLIGATOIRES sur chaque chiffre important :
{{V:VALEUR|source officielle}} → vérifié (INSEE, BPI, Xerfi, étude sectorielle)
{{E:VALEUR|méthode de calcul}} → estimation (calcul sur hypothèses)
{{H:VALEUR|hypothèse}} → hypothèse IA (à valider)

RÈGLE ANTI-COUPURE : Les 20 clés JSON DOIVENT toutes être présentes. Si tu risques de manquer de place, raccourcis chaque valeur mais n'omets JAMAIS une clé.

Réponds UNIQUEMENT avec un JSON valide (sans markdown ni backtick) contenant EXACTEMENT ces 20 clés + les métadonnées :

{
  "nom_business": "Nom court et percutant",
  "tagline": "Slogan en 6-8 mots",
  "score_viabilite": 82,
  "pitch_30s": "Pitch 30s : problème → solution → marché → modèle → appel à action. 4-5 phrases.",

  "resume_executif": "5-6 phrases avec {{V:}}/{{E:}}/{{H:}} sur les chiffres clés.",

  "porteur_projet": "Présentation porteur : parcours, compétences clés pour ce projet, motivations. 3-4 phrases (à personnaliser).",

  "presentation_projet": "Origine de l'idée, problème résolu, solution, vision 3 ans, mission. 3-4 phrases.",

  "persona": {
    "nom": "Prénom fictif",
    "age": "30-45 ans",
    "situation": "Profession, revenus, contexte",
    "douleurs": "3 problèmes principaux",
    "motivations": "Ce qui le pousse à chercher",
    "ou_le_trouver": "Canaux de présence"
  },

  "marche_taille": "{{V:X Mds€|source}} ou {{E:X M€|calcul}}",
  "marche_croissance": "{{V:+X%/an|source}} ou {{E:+X%/an|calcul}}",
  "marche_part_cible": "{{H:0,0X%|hypothèse an 1}}",
  "marche_clients_potentiels": "{{E:XX 000|population × taux pénétration}}",
  "marche_analyse": "4-5 phrases avec sources et marqueurs fiabilité.",

  "proposition_valeur": "USP différenciante : pourquoi choisir ce projet. 2 phrases percutantes.",

  "concurrence_intro": "2-3 phrases : état concurrentiel, opportunité, positionnement.",
  "concurrents": [
    {"nom": "Concurrent réel 1", "description": "Ce qu'ils font + prix réels + failles", "menace": "haute", "prix_moyen": "{{E:X€|tarif observé}}", "part_marche": "{{H:X%|estimation}}"},
    {"nom": "Concurrent réel 2", "description": "Détails + prix + différences", "menace": "moyenne", "prix_moyen": "{{E:X€|tarif observé}}", "part_marche": "{{H:X%|estimation}}"},
    {"nom": "Concurrent réel 3", "description": "Détails + opportunité", "menace": "faible", "prix_moyen": "{{E:X€|tarif observé}}", "part_marche": "{{H:X%|estimation}}"},
    {"nom": "Concurrent réel 4", "description": "Détails + positionnement", "menace": "moyenne", "prix_moyen": "{{E:X€|tarif observé}}", "part_marche": "{{H:X%|estimation}}"}
  ],

  "modele_economique": "3-4 phrases : flux revenus, pricing justifié, récurrence, LTV. Marqueurs obligatoires.",
  "offres": [
    {"nom": "Offre 1", "description": "Contenu précis", "prix": "{{H:X€|positionnement}}"},
    {"nom": "Offre 2", "description": "Contenu avec inclus/exclus", "prix": "{{H:X€/mois|benchmark}}"},
    {"nom": "Offre 3", "description": "Offre premium", "prix": "{{H:X€|premium}}"}
  ],

  "strategie_commerciale": "Positionnement, canaux distribution, message clé, tunnel de vente. 3-4 phrases.",

  "aspects_juridiques": "Statut recommandé (SASU/EURL/micro) avec justification CA/fiscalité. Obligations sectorielles. 3-4 phrases.",

  "aspects_organisationnels": "Équipe, locaux (achat/location/domiciliation), sous-traitance, organisation. 2-3 phrases.",

  "acquisition": [
    {"canal": "Canal principal", "description": "Stratégie : volume, message, taux conversion, budget, outils", "cac": "{{E:XX€|CAC estimé}}"},
    {"canal": "Canal secondaire", "description": "Actions, fréquence, KPI, coût", "cac": "{{E:XX€|CAC estimé}}"},
    {"canal": "Canal tertiaire", "description": "Partenariats ou SEO : qui, comment, modèle", "cac": "{{E:XX€|CAC estimé}}"}
  ],

  "rev_m1":  "{{H:X €|hypothèse démarrage}}",
  "rev_m3":  "{{E:X €|projection mois 3}}",
  "rev_m6":  "{{E:X €|projection mois 6}}",
  "rev_m12": "{{E:X €|fin an 1}}",
  "rev_m18": "{{E:X €|18 mois}}",
  "rev_m24": "{{E:X €|fin an 2}}",
  "rev_m36": "{{E:X €|fin an 3}}",
  "rev_mensuel": [200, 600, 1200, 1800, 2500, 3200, 3800, 4400, 5000, 5700, 6500, 7500],
  "finances_detail": [
    {"label": "CA annuel estimé (an 1)", "valeur": "{{E:XX XXX€|somme mensuelle}}"},
    {"label": "Charges fixes mensuelles", "valeur": "{{E:X XXX€|loyer+charges}}"},
    {"label": "Charges variables (% CA)", "valeur": "{{H:XX%|benchmark secteur}}"},
    {"label": "Marge brute", "valeur": "{{E:XX%|prix - coût variable}}"},
    {"label": "Point mort mensuel", "valeur": "{{E:X XXX€/mois|charges÷marge}}"},
    {"label": "Break-even atteint", "valeur": "{{H:Mois X|projection}}"},
    {"label": "ROI investissement initial", "valeur": "{{E:XXX% sur 12 mois|bénéfice÷invest}}"}
  ],

  "tresorerie_detail": "Analyse trésorerie sur 12 mois : entrées, sorties, points de vigilance. 2-3 phrases.",
  "tresorerie_soldes": [500, 1200, 1800, 2400, 3100, 3900, 4800, 5500, 6300, 7200, 8100, 9000],

  "investissements": [
    {"label": "Poste 1 précis", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "materiel"},
    {"label": "Poste 2 précis", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "communication"},
    {"label": "Poste 3 précis", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "bfr"},
    {"label": "Poste 4 précis", "montant": "{{H:XXX€|devis estimatif}}", "categorie": "autres"},
    {"label": "TOTAL investissement", "montant": "{{E:X XXX€|somme postes}}", "total": true}
  ],

  "bilan_previsionnel": "Actif/passif simplifié fin an 1, 2, 3. Capitaux propres, dettes, trésorerie. 2-3 phrases.",

  "seuil_rentabilite": {
    "charges_fixes_mensuelles": "{{E:X XXX€|loyer+salaires+abonnements}}",
    "taux_marge_sur_cv": "{{E:XX%|1 - coûts variables/CA}}",
    "point_mort_ca": "{{E:X XXX€/mois|charges fixes÷taux marge}}",
    "break_even_mois": "{{H:Mois X|estimation conservatrice}}",
    "detail": "Calcul du point mort : hypothèses, marge de sécurité, distance fin an 1."
  },

  "risques": [
    {"titre": "Risque business précis", "niveau": "élevé", "solution": "Actions correctives + indicateurs d'alerte"},
    {"titre": "Risque marché précis", "niveau": "moyen", "solution": "Détection précoce + réponse"},
    {"titre": "Risque opérationnel", "niveau": "faible", "solution": "Mesures préventives"},
    {"titre": "Risque financier", "niveau": "moyen", "solution": "Seuils d'alerte + plan B chiffré"},
    {"titre": "Risque réglementaire", "niveau": "faible", "solution": "Veille + conformité"}
  ],

  "actions": [
    {"phase": "J1-7",   "titre": "Action concrète", "detail": "Détail précis avec outils + objectif mesurable"},
    {"phase": "J8-14",  "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J15-30", "titre": "Action concrète", "detail": "Détail précis avec KPI"},
    {"phase": "J31-45", "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J46-60", "titre": "Action concrète", "detail": "Détail précis + objectif CA"},
    {"phase": "J61-75", "titre": "Action concrète", "detail": "Détail précis"},
    {"phase": "J76-90", "titre": "Action concrète", "detail": "Objectif chiffré clair"}
  ],

  "aides_subventions": [
    {"nom": "ACRE", "montant": "{{V:Exonération charges 1 an|URSSAF 2024}}", "conditions": "Demandeur emploi ou < 26 ans", "lien": "urssaf.fr", "applicable": true},
    {"nom": "ARCE Pôle emploi", "montant": "{{V:45% ARE restantes|Pôle Emploi 2024}}", "conditions": "Inscrit Pôle emploi avec ARE", "lien": "pole-emploi.fr", "applicable": true},
    {"nom": "Prêt d'honneur Initiative", "montant": "{{V:5 000€ à 50 000€|Initiative France 2024}}", "conditions": "Projet viable, porteur engagé", "lien": "initiative-france.fr", "applicable": true},
    {"nom": "BPI — Prêt création", "montant": "{{V:10 000€ à 7 Mds€|BPI France 2024}}", "conditions": "Entreprise < 3 ans", "lien": "bpifrance.fr", "applicable": false}
  ],

  "annexes_checklist": [
    "CV du porteur (1-2 pages, axé légitimité pour ce projet)",
    "Pièce d'identité + justificatif de domicile",
    "Devis des investissements principaux",
    "Preuves de marché : emails intention client, lettres d'intérêt",
    "Relevés bancaires 3 derniers mois",
    "Justificatifs d'apport personnel",
    "Statuts de la société (après immatriculation)",
    "Extrait Kbis (après immatriculation)",
    "Contrat de bail ou promesse si local commercial",
    "Attestation ACRE si applicable"
  ],

  "kpis": [
    {"nom": "CA mensuel", "cible": "{{H:X XXX€ dès mois 3|objectif minimum}}", "frequence": "Mensuel"},
    {"nom": "Taux conversion prospects", "cible": "{{H:X%|benchmark sectoriel}}", "frequence": "Hebdomadaire"},
    {"nom": "Coût acquisition client (CAC)", "cible": "{{E:XX€|budget÷nb clients}}", "frequence": "Mensuel"},
    {"nom": "Satisfaction client (NPS)", "cible": "{{H:> 50|objectif top quartile}}", "frequence": "Trimestriel"}
  ],

  "outils": [
    {"nom": "Outil réel 1", "usage": "Usage précis", "prix": "{{V:X€/mois|site officiel 2024}}"},
    {"nom": "Outil réel 2", "usage": "Usage précis", "prix": "{{V:Gratuit|plan freemium}}"},
    {"nom": "Outil réel 3", "usage": "Usage précis", "prix": "{{V:X€/mois|site officiel}}"},
    {"nom": "Outil réel 4", "usage": "Usage précis", "prix": "{{V:Gratuit|open source}}"},
    {"nom": "Outil réel 5", "usage": "Usage précis", "prix": "{{V:X€/mois|site officiel}}"},
    {"nom": "Outil réel 6", "usage": "Usage précis", "prix": "{{V:X€/mois|site officiel}}"}
  ],

  "demarches_admin": [
    {"etape": "1. Choisir le statut juridique", "detail": "Statut optimal pour ce projet avec justification", "delai": "Jour 1-3", "cout": "0-500€", "lien": "infogreffe.fr"},
    {"etape": "2. Immatriculation", "detail": "Démarche guichet-entreprises.fr, SIRET sous 3-5 jours", "delai": "Semaine 1", "cout": "0€ à 250€", "lien": "guichet-entreprises.fr"},
    {"etape": "3. Ouverture compte pro", "detail": "Banques recommandées pour ce secteur", "delai": "Semaine 1-2", "cout": "0-30€/mois", "lien": "shine.fr"},
    {"etape": "4. URSSAF", "detail": "Cotisations estimées, DSN si société", "delai": "Automatique", "cout": "22-45% du CA", "lien": "urssaf.fr"},
    {"etape": "5. Assurance RC Pro", "detail": "Obligatoire ou recommandée pour ce secteur", "delai": "Avant premier client", "cout": "200-800€/an", "lien": "hiscox.fr"},
    {"etape": "6. Obligations sectorielles", "detail": "Licences, certifications, autorisations spécifiques", "delai": "Variable", "cout": "Variable", "lien": "service-public.fr"}
  ],

  "email_fournisseur": {
    "sujet": "Objet adapté au secteur",
    "corps": "Email complet prêt à envoyer : présentation, projet, volume, demande tarifs. 150-200 mots."
  },
  "email_prospection": {
    "sujet": "Objet accrocheur pour la cible",
    "corps": "Email prospection : accroche sur problème, solution 2 lignes, preuve sociale, appel à action. 120-150 mots."
  },
  "email_relance": {
    "sujet": "Objet relance J+7",
    "corps": "Relance courte avec valeur supplémentaire. 60-80 mots."
  }
}`;
}

const genStatuses = [
  'Analyse de ton idée en profondeur...',
  'Recherche du marché et des chiffres réels...',
  'Identification des concurrents...',
  'Modélisation financière mois par mois...',
  'Construction du plan d\'action 90 jours...',
  'Calcul du score de viabilité...',
  'Finalisation du business plan complet...'
];

async function generateDashPlan() {
  if (!user) { showAuth('signup'); return; }

  const idea = document.getElementById('dashIdea').value.trim();
  if (!idea || idea.length < 8) {
    document.getElementById('dashIdea').style.borderColor = 'var(--rust)';
    setTimeout(() => document.getElementById('dashIdea').style.borderColor = '', 1500);
    toast('Décris ton idée d\'abord', 'error'); return;
  }

  if (userCredits <= 0) {
    toast('Plus de crédits — recharge un pack pour continuer', 'error');
    setTimeout(() => showView('billing'), 1000); return;
  }

  const budget  = document.getElementById('dashBudget').value;
  const profile = document.getElementById('dashProfile').value;
  const sector  = document.getElementById('dashSector').value;
  const time    = document.getElementById('dashTime').value;

  // UI state
  document.getElementById('dashGenBtn').disabled = true;
  document.getElementById('dashEmptyState').style.display = 'none';
  document.getElementById('dashResult').style.display = 'none';
  setPreviewState('C');

  let si = 0;
  const statusInterval = setInterval(() => {
    if (si < genStatuses.length - 1) document.getElementById('genStatusText').textContent = genStatuses[++si];
  }, 1800);

  try {
    // ── Pipeline complet v2.0 avec system prompt bancaire + INSEE + web search ──
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        sector,
        city: '',
        budget,
        profile,
        time,
        credits: userCredits,
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`API error ${res.status}: ${errData.error?.message || res.statusText}`);
    }

    const data = await res.json();

    if (!data.content || !data.content.length) throw new Error('Réponse vide de l\'API');

    const text = data.content.map(i => i.text || '').join('');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse invalide — réessaie');
    const plan = JSON.parse(jsonMatch[0]);

    clearInterval(statusInterval);
    fillPlan(plan);

    currentResult = { ...plan, idea, date: new Date(), id: Date.now() };
    plansHistory.unshift(currentResult);
    localStorage.setItem('eadee_history', JSON.stringify(plansHistory));
    userCredits = Math.max(0, userCredits - 1);
    updateUsage();

    if (IS_DEMO) {
      localStorage.setItem('eadee_demo_credits', String(userCredits));
    } else if (supabaseClient && user) {
      const userId = (await supabaseClient.auth.getUser()).data.user?.id;
      // Sauvegarder le plan dans Supabase (persistance cross-session)
      supabaseClient.from('plans').insert({
        user_id: userId,
        name: plan.nom_business || 'Plan sans nom',
        score: plan.score_viabilite || null,
        sections: plan,
      }).then(function(result) {
        if (result.error) { console.error('Save plan Supabase:', result.error); }
        else if (result.data && result.data[0]) {
          // Mettre à jour l'ID en mémoire avec l'ID Supabase
          currentResult._supabaseId = result.data[0].id;
          currentResult.id = result.data[0].id;
        }
      });
      // Décrémenter les crédits
      supabaseClient.from('profiles').update({ credits: userCredits }).eq('id', userId).then(() => {});
    }

    stopGenSectionsAnim();
    setPreviewState(null);
    document.getElementById('dashGenerating').style.display = 'none';
    document.getElementById('dashResult').style.display = 'flex';
    toast('Business plan complet généré ✓', 'success');

    // Animation fade-in séquentielle des sections
    setTimeout(() => animatePlanSections(), 100);

  } catch(err) {
    clearInterval(statusInterval);
    stopGenSectionsAnim();
    setPreviewState('A');
    console.error('Erreur génération:', err);
    document.getElementById('dashGenerating').style.display = 'none';
    const errStateEl = document.getElementById('dashEmptyState');
    errStateEl.innerHTML = `
      <div style="font-size:11px;font-family:'DM Mono',monospace;letter-spacing:0.15em;color:rgba(255,255,255,0.25);margin-bottom:12px">ERREUR</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.5);max-width:260px;line-height:1.6;text-align:center">
        <strong style="color:rgba(255,255,255,0.7)">Erreur :</strong><br><span id="dashErrMsg"></span>
      </div>
      <button onclick="resetGenerator()" style="margin-top:16px;padding:8px 20px;background:var(--acid);color:var(--ink);border:none;border-radius:4px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:0.1em;cursor:pointer;">Réessayer</button>
    `;
    errStateEl.style.display = 'flex';
    document.getElementById('dashErrMsg').textContent = err.message || 'Problème de connexion. Réessaie.';
    toast('Erreur — voir le détail dans le panneau', 'error');
  }

  document.getElementById('dashGenBtn').disabled = false;
}

function resetGenerator() {
  // Retirer le mode plein-écran du plan
  const genLayout = document.querySelector('.gen-layout');
  if (genLayout) genLayout.classList.remove('plan-visible');
  setPreviewState('A');
  document.getElementById('dashEmptyState').style.display = 'none';
  document.getElementById('dashResult').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════════
// FIABILITÉ — Parse les marqueurs {{V:val|src}} {{E:val|src}} {{H:val|src}}
// ═══════════════════════════════════════════════════════════════════

function renderReliability(text) {
  if (!text || typeof text !== 'string') return esc(text || '');
  // Échapper d'abord le texte brut, puis replacer les marqueurs
  return text.replace(/\{\{([VEH]):([^|{}]+)\|([^{}]+)\}\}/g, (match, type, value, source) => {
    const cfg = {
      V: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)',  label: 'Vérifié' },
      E: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)',  label: 'Estimation' },
      H: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   label: 'Hypothèse' },
    }[type] || { color: '#7a7f9a', bg: 'rgba(122,127,154,0.1)', border: 'rgba(122,127,154,0.2)', label: '?' };

    const safeVal = value.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const safeSrc = source.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    return `<span class="rel-chip rel-chip-${type}"
      style="--rc:#${type==='V'?'34d399':type==='E'?'fbbf24':'ef4444'};background:${cfg.bg};border:1px solid ${cfg.border};color:${cfg.color}"
      data-rel-label="${cfg.label}" data-rel-source="${safeSrc}">
      <span class="rel-chip-dot" style="background:${cfg.color}"></span>${safeVal}<span class="rel-chip-tooltip"><strong>${cfg.label}</strong><br>${safeSrc}</span>
    </span>`;
  })
  // Convertir les marqueurs anciens [VERIFIE] etc. en classe (backward compat)
  .replace(/\[VERIFIE\]/g, '<span class="rel-dot verifie" data-tooltip="Donnée vérifiée"></span>')
  .replace(/\[ESTIMATION\]/g, '<span class="rel-dot estimation" data-tooltip="Estimation"></span>')
  .replace(/\[HYPOTHESE\]/g, '<span class="rel-dot hypothese" data-tooltip="Hypothèse"></span>');
}

// Compter les marqueurs de fiabilité dans le plan
function calculateReliabilityScore(plan) {
  const all = JSON.stringify(plan);
  const V = (all.match(/\{\{V:/g) || []).length;
  const E = (all.match(/\{\{E:/g) || []).length;
  const H = (all.match(/\{\{H:/g) || []).length;
  const total = V + E + H;
  if (total === 0) return null;
  return {
    V, E, H, total,
    pctV: Math.round(V/total*100),
    pctE: Math.round(E/total*100),
    pctH: Math.round(H/total*100),
  };
}

// ═══════════════════════════════════════════════════════════════════
// SANITIZE
// ═══════════════════════════════════════════════════════════════════

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Rend le texte avec fiabilité inline (HTML safe)
function relText(str) {
  return renderReliability(str || '');
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION SECTIONS
// ═══════════════════════════════════════════════════════════════════

function animatePlanSections() {
  const blocks = document.querySelectorAll('#planScrollBody .plan-block');
  blocks.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'none';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * 80);
  });
}

// ═══════════════════════════════════════════════════════════════════
// COMPTEUR COMPLÉTUDE 20/20
// ═══════════════════════════════════════════════════════════════════

function renderCompletenessCounter(plan) {
  const KEYS = [
    'resume_executif','porteur_projet','presentation_projet','marche_analyse',
    'proposition_valeur','concurrents','modele_economique','strategie_commerciale',
    'acquisition','aspects_juridiques','aspects_organisationnels','rev_m36',
    'tresorerie_detail','investissements','bilan_previsionnel','seuil_rentabilite',
    'risques','actions','aides_subventions','annexes_checklist'
  ];
  const present = KEYS.filter(k => {
    const v = plan[k];
    if (!v) return false;
    if (typeof v === 'string') return v.length > 5;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return true;
  }).length;

  // Utiliser les données _completeness si disponibles
  const count = plan._completeness?.present ?? present;
  const total = 20;
  const isComplete = count >= 18; // tolérance 2

  return `<div class="plan-completeness ${isComplete ? 'complete' : 'incomplete'}">
    <span class="pc-icon">${isComplete ? '✓' : '⚠'}</span>
    <span class="pc-count">${count}/${total} sections générées</span>
    ${!isComplete ? `<span class="pc-action" onclick="generateDashPlan()" title="Régénérer">Régénérer pour compléter →</span>` : ''}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// SCORE FIABILITÉ GLOBAL
// ═══════════════════════════════════════════════════════════════════

function renderReliabilityScoreCard(plan) {
  const score = calculateReliabilityScore(plan);
  if (!score || score.total < 3) return '';
  return `<div class="rel-score-card">
    <div class="rsc-title">Fiabilité des chiffres</div>
    <div class="rsc-bars">
      <div class="rsc-bar-item">
        <div class="rsc-bar-label"><span class="rsc-dot" style="background:#34d399"></span>Vérifié</div>
        <div class="rsc-bar-track"><div class="rsc-bar-fill" style="width:${score.pctV}%;background:#34d399"></div></div>
        <div class="rsc-bar-pct">${score.pctV}%</div>
      </div>
      <div class="rsc-bar-item">
        <div class="rsc-bar-label"><span class="rsc-dot" style="background:#fbbf24"></span>Estimation</div>
        <div class="rsc-bar-track"><div class="rsc-bar-fill" style="width:${score.pctE}%;background:#fbbf24"></div></div>
        <div class="rsc-bar-pct">${score.pctE}%</div>
      </div>
      <div class="rsc-bar-item">
        <div class="rsc-bar-label"><span class="rsc-dot" style="background:#ef4444"></span>Hypothèse</div>
        <div class="rsc-bar-track"><div class="rsc-bar-fill" style="width:${score.pctH}%;background:#ef4444"></div></div>
        <div class="rsc-bar-pct">${score.pctH}%</div>
      </div>
    </div>
    <div class="rsc-note">${score.total} chiffres annotés · Les hypothèses (rouge) sont à valider avant dossier banque</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// GRAPHIQUES — Chart.js helpers
// ═══════════════════════════════════════════════════════════════════

function ensureChartJs(cb) {
  if (window.Chart) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
  s.onload = cb;
  document.head.appendChild(s);
}

function drawCrescendoChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  ensureChartJs(() => {
    // Détruire l'ancien si existe
    if (canvas._chart) { canvas._chart.destroy(); }
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(107,143,239,0.35)');
    gradient.addColorStop(1, 'rgba(167,139,250,0.02)');
    canvas._chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#a78bfa',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6b8fef',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.raw;
              return v >= 1000 ? (v/1000).toFixed(1) + 'k€' : v + '€';
            }
          }
        }},
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7a7f9a', font: { size: 10, family: 'DM Mono' } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7a7f9a', font: { size: 10, family: 'DM Mono' },
            callback: v => v >= 1000 ? (v/1000).toFixed(0)+'k€' : v+'€'
          } },
        }
      }
    });
  });
}

function drawDonutChart(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  ensureChartJs(() => {
    if (canvas._chart) { canvas._chart.destroy(); }
    const ctx = canvas.getContext('2d');
    canvas._chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderColor: '#13141a', borderWidth: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#7a7f9a', font: { size: 10, family: 'DM Mono' }, padding: 10, boxWidth: 10 } },
        }
      }
    });
  });
}

function drawBarChart(canvasId, labels, values, label) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  ensureChartJs(() => {
    if (canvas._chart) { canvas._chart.destroy(); }
    const ctx = canvas.getContext('2d');
    canvas._chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          backgroundColor: ['rgba(239,68,68,0.6)','rgba(251,191,36,0.6)','rgba(52,211,153,0.6)','rgba(107,143,239,0.6)'],
          borderColor: ['#ef4444','#fbbf24','#34d399','#6b8fef'],
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7a7f9a', font: { size: 10 } }, max: 100 },
          y: { grid: { display: false }, ticks: { color: '#ecedf2', font: { size: 11 } } },
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// FILL PLAN — Rendu complet 20 sections (fresh rebuild)
// ═══════════════════════════════════════════════════════════════════

// Helper: bloc section avec header coloré par catégorie
function planBlock(title, content, chatQ) {
  const catMap = {
    '01':'strategy','02':'strategy','03':'strategy',
    '04':'market',  '05':'market',
    '06':'strategy','07':'finance',
    '08':'action',  '09':'action',
    '10':'legal',   '11':'strategy',
    '12':'finance', '13':'finance','14':'finance','15':'finance','16':'finance',
    '17':'legal',
    '18':'action',  '19':'action', '20':'strategy'
  };
  const catLabels = { strategy:'Stratégie', market:'Marché', finance:'Finance', action:'Action', legal:'Légal' };

  const numMatch = title.match(/^(\d{2})/);
  const num = numMatch ? numMatch[1] : null;
  const cat = num ? (catMap[num] || 'strategy')
    : /[Ff]inance|[Ff]inancement|[Tt]résor|[Bb]ilan|[Ii]nvest|[Rr]entab/.test(title) ? 'finance'
    : /[Mm]arch|[Cc]oncu|[Pp]ersona/.test(title) ? 'market'
    : /[Jj]urid|[Ll]égal|[Rr]isque/.test(title) ? 'legal'
    : /[Aa]ction|[Aa]cquis|[Ee]mail|KPI|[Oo]util/.test(title) ? 'action'
    : 'strategy';

  const cleanTitle = title.replace(/^\d{2}\s*[—–-]\s*/, '').replace(/&amp;/g,'&');
  const sectionId = num ? `section-${num}` : `section-${title.replace(/[^a-z0-9]/gi,'').toLowerCase().slice(0,14)}`;

  const btn = chatQ
    ? `<button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,${JSON.stringify(chatQ)})" title="Expert Eadee">💬</button>`
    : '';

  return `<div class="plan-block ${cat}-block" id="${sectionId}" data-cat="${cat}">
  <div class="block-header">
    <div class="block-cat-bar" style="background:var(--cat-${cat})"></div>
    <span class="block-num">${num || '✦'}</span>
    <span class="block-title">${cleanTitle}${btn}</span>
    <span class="block-tag tag-${cat}">${catLabels[cat]}</span>
  </div>
  <div class="block-body">${content}</div>
</div>`;
}

// Helper: card concurrent
function renderConcurrentCard(c) {
  const tc = c.menace==='haute' ? '#ef4444' : c.menace==='moyenne' ? '#fbbf24' : '#34d399';
  const tl = c.menace==='haute' ? 'Menace haute' : c.menace==='moyenne' ? 'Menace moyenne' : 'Menace faible';
  return `<div class="concurrent-card">
    <div class="cc-header">
      <div class="cc-name">${esc(c.nom)}</div>
      <div class="cc-threat" style="color:${tc};background:${tc}18;border:1px solid ${tc}40;display:inline-flex;align-items:center;gap:5px;font-family:'DM Mono',monospace;font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px">
        <span style="background:${tc};width:6px;height:6px;border-radius:50%;display:inline-block;flex-shrink:0"></span>${tl}
      </div>
    </div>
    <div class="cc-desc">${esc(c.description)}</div>
    ${c.prix_moyen ? `<div class="cc-prix">Prix moyen : ${relText(c.prix_moyen)}</div>` : ''}
    ${c.avantage_differentiel ? `<div style="margin-top:8px;padding:8px 12px;background:rgba(52,211,153,0.07);border-left:2px solid rgba(52,211,153,0.35);border-radius:0 6px 6px 0;font-size:12px;color:#34d399;line-height:1.5"><strong>Notre avantage :</strong> ${esc(c.avantage_differentiel)}</div>` : ''}
  </div>`;
}

// Helper: risk card
function renderRiskCard(r) {
  const lc = r.niveau==='élevé' ? '#ef4444' : r.niveau==='moyen' ? '#fbbf24' : '#34d399';
  return `<div class="risk-card">
    <div class="risk-header">
      <div class="risk-title">${esc(r.titre)}</div>
      <div class="risk-level" style="color:${lc};background:${lc}18;border:1px solid ${lc}40">${esc(r.niveau||'')}</div>
    </div>
    ${r.signal_alarme ? `<div style="font-size:12px;color:rgba(255,255,255,0.45);margin-bottom:6px;line-height:1.5"><span style="color:#fbbf24;font-weight:600">⚠ Signal :</span> ${esc(r.signal_alarme)}</div>` : ''}
    ${r.solution_preventive ? `<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:6px;line-height:1.5"><span style="color:#34d399;font-weight:600">✓ Prévention :</span> ${esc(r.solution_preventive)}</div>` : ''}
    <div class="risk-solution"><strong>Mitigation :</strong> ${esc(r.solution)}</div>
  </div>`;
}

// Helper: aide card
function renderAideCard(a) {
  const prioColor = a.priorite==='haute' ? '#34d399' : a.priorite==='moyenne' ? '#fbbf24' : 'rgba(255,255,255,0.3)';
  return `<div class="aide-card${a.applicable===false?' aide-disabled':''}">
    <div class="aide-header">
      <div class="aide-nom">${esc(a.nom)}${a.priorite ? `<span style="display:inline-block;margin-left:8px;font-size:9px;font-family:'DM Mono',monospace;font-weight:600;padding:2px 7px;border-radius:10px;background:${prioColor}18;color:${prioColor};border:1px solid ${prioColor}40">${esc(a.priorite)}</span>` : ''}</div>
      <div class="aide-montant">${relText(a.montant||'')}</div>
    </div>
    <div class="aide-conditions">${esc(a.conditions||'')}</div>
    ${a.lien ? `<a href="https://${esc(a.lien)}" target="_blank" rel="noopener" class="aide-lien">→ ${esc(a.lien)}</a>` : ''}
  </div>`;
}

// Helper: persona mini
function renderPersonaMini(p) {
  if (!p) return '';
  return `<div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)">
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:14px">Client idéal (Persona)</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="stat-mini"><div class="stat-mini-label">Prénom / Âge</div><div style="font-size:15px;font-weight:700;color:#fff;margin-top:4px">${esc(p.nom)}, ${esc(p.age)}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Situation</div><div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;line-height:1.5">${esc(p.situation)}</div></div>
      <div class="stat-mini" style="grid-column:span 2"><div class="stat-mini-label">Douleurs</div><div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;line-height:1.6">${esc(p.douleurs)}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Motivations</div><div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;line-height:1.5">${esc(p.motivations)}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Où le trouver</div><div style="font-size:13px;color:var(--acid);margin-top:4px;line-height:1.5">${esc(p.ou_le_trouver)}</div></div>
    </div>
  </div>`;
}

// Helper: email block
function renderEmailBlock(label, data) {
  return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden">
    <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between">
      <div style="font-weight:700;font-size:14px;color:#fff">${esc(label)}</div>
      <button onclick="copyEmail(this)" data-text="${encodeURIComponent('Objet: '+(data.sujet||'')+'\n\n'+(data.corps||''))}"
        style="font-family:'DM Mono',monospace;font-size:11px;background:rgba(107,143,239,0.1);color:var(--acid);border:1px solid rgba(107,143,239,0.2);border-radius:20px;padding:4px 12px;cursor:pointer">Copier</button>
    </div>
    <div style="padding:14px 16px">
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:6px">OBJET</div>
      <div style="font-size:13px;color:var(--acid);font-weight:600;margin-bottom:12px">${esc(data.sujet||'')}</div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:6px">CORPS</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);line-height:1.75;white-space:pre-wrap">${esc(data.corps||'')}</div>
    </div>
  </div>`;
}

// Helper: démarches admin
function renderDemarchesHtml(demarches) {
  if (!demarches?.length) return '';
  return `<div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)">
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:14px">Démarches administratives</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${demarches.map(d => `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:14px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
            <div style="font-weight:700;font-size:13px;color:#fff">${esc(d.etape)}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <span style="font-family:'DM Mono',monospace;font-size:10px;background:rgba(107,143,239,0.1);color:var(--acid);padding:2px 8px;border-radius:20px">${esc(d.delai)}</span>
              <span style="font-family:'DM Mono',monospace;font-size:10px;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);padding:2px 8px;border-radius:20px">${esc(d.cout)}</span>
            </div>
          </div>
          <div style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.65;margin-bottom:6px">${esc(d.detail)}</div>
          <a href="https://${esc(d.lien)}" target="_blank" rel="noopener noreferrer" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--acid);text-decoration:none;opacity:0.7">→ ${esc(d.lien)}</a>
        </div>`).join('')}
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────
// HELPERS v2.0 — Score bancabilité, Plan financement, Scénarios, Trésorerie mensuelle
// ─────────────────────────────────────────────────────────

function renderScoreBancabilite(sb) {
  if (!sb) return '';
  const color = sb.note >= 75 ? '#34d399' : sb.note >= 55 ? '#fbbf24' : '#ef4444';
  const label = sb.note >= 75 ? 'Dossier bancable' : sb.note >= 55 ? 'Dossier à renforcer' : 'Dossier insuffisant';
  const detail = sb.detail || {};
  const rows = [
    { k: 'apport_suffisant',       l: 'Apport personnel',     max: 25 },
    { k: 'point_mort_rapide',      l: 'Point mort rapide',    max: 20 },
    { k: 'tresorerie_positive_m6', l: 'Trésorerie positive',  max: 20 },
    { k: 'garanties_disponibles',  l: 'Garanties disponibles',max: 15 },
    { k: 'secteur_risque_faible',  l: 'Secteur peu risqué',   max: 10 },
    { k: 'experience_porteur',     l: 'Expérience porteur',   max: 10 },
  ].map(r => {
    const d = detail[r.k] || {};
    const pts = d.points ?? 0;
    const pct = Math.round((pts / r.max) * 100);
    const c2 = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#ef4444';
    return `<div style="display:flex;flex-direction:column;gap:4px;padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.07)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:12px;color:rgba(255,255,255,0.6)">${r.l}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:${c2}">${pts}/${r.max}</div>
      </div>
      <div style="height:4px;background:rgba(255,255,255,0.07);border-radius:2px">
        <div style="height:4px;width:${pct}%;background:${c2};border-radius:2px;transition:width 0.6s"></div>
      </div>
      ${d.commentaire ? `<div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;line-height:1.4">${esc(d.commentaire)}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="plan-block" style="border-color:${color}30;background:linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))">
    <div class="plan-block-title" style="color:${color}">🏦 Score Bancabilité</div>
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:64px;height:64px;border-radius:50%;border:3px solid ${color};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <div style="text-align:center">
            <div style="font-size:22px;font-weight:800;color:${color};line-height:1">${sb.note}</div>
            <div style="font-family:'DM Mono',monospace;font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:0.1em">/100</div>
          </div>
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:${color}">${label}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:3px;max-width:280px;line-height:1.5">${esc(sb.interpretation||'')}</div>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">${detail ? rows : ''}</div>
    ${sb.message_banquier ? `<div style="padding:14px 16px;background:rgba(107,143,239,0.07);border:1px solid rgba(107,143,239,0.2);border-radius:10px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:8px">Ce que dira le banquier</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.7;font-style:italic">"${esc(sb.message_banquier)}"</div>
    </div>` : ''}
  </div>`;
}

function renderPlanFinancement(pf) {
  if (!pf) return '';
  const besoins = pf.besoins || {};
  const ressources = pf.ressources || {};

  const row = (label, val) => val ? `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
    <div style="font-size:13px;color:rgba(255,255,255,0.6)">${esc(label)}</div>
    <div style="font-size:13px;font-weight:600;color:#fff">${relText(String(val))}</div>
  </div>` : '';

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:10px">Besoins</div>
        ${row('Investissements matériels', besoins.investissements_materiels)}
        ${row('Investissements immatériels', besoins.investissements_immateriels)}
        ${row('BFR démarrage', besoins.bfr_demarrage)}
        ${row('Trésorerie de sécurité', besoins.tresorerie_securite)}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin-top:4px;border-top:1px solid rgba(255,255,255,0.12)">
          <div style="font-size:13px;font-weight:700;color:#fff">TOTAL BESOINS</div>
          <div style="font-size:15px;font-weight:800;color:var(--acid)">${relText(String(besoins.total_besoins||'—'))}</div>
        </div>
      </div>
      <div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:10px">Ressources</div>
        ${row('Apport personnel', ressources.apport_personnel)}
        ${row('Prêt bancaire', ressources.pret_bancaire)}
        ${ressources.pret_bpi && ressources.pret_bpi !== 'null' ? row('Prêt BPI', ressources.pret_bpi) : ''}
        ${ressources.pret_honneur && ressources.pret_honneur !== 'null' ? row('Prêt d\'honneur', ressources.pret_honneur) : ''}
        ${ressources.subventions && ressources.subventions !== 'null' ? row('Subventions', ressources.subventions) : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin-top:4px;border-top:1px solid rgba(255,255,255,0.12)">
          <div style="font-size:13px;font-weight:700;color:#fff">TOTAL RESSOURCES</div>
          <div style="font-size:15px;font-weight:800;color:#34d399">${relText(String(ressources.total_ressources||'—'))}</div>
        </div>
      </div>
    </div>
    ${pf.message_banquier ? `<div style="padding:12px 16px;background:rgba(107,143,239,0.07);border:1px solid rgba(107,143,239,0.2);border-radius:10px;font-size:13px;color:rgba(255,255,255,0.65);line-height:1.7">
      <span style="color:#9db8f8;font-weight:600">💬 Vision banquier : </span>${esc(pf.message_banquier)}
    </div>` : ''}`;
}

function renderScenariosBlock(sc) {
  if (!sc) return '';
  const configs = [
    { key: 'pessimiste', label: 'Pessimiste', color: '#ef4444', icon: '↓' },
    { key: 'realiste',   label: 'Réaliste',   color: '#fbbf24', icon: '→' },
    { key: 'optimiste',  label: 'Optimiste',  color: '#34d399', icon: '↑' },
  ];
  const cards = configs.map(({ key, label, color, icon }) => {
    const s = sc[key];
    if (!s) return '';
    return `<div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid ${color}30;border-radius:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:24px;height:24px;border-radius:50%;background:${color}20;color:${color};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0">${icon}</div>
        <div style="font-weight:700;font-size:13px;color:${color}">${label}</div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:10px;line-height:1.5;font-style:italic">${esc(s.hypothese||'')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div style="text-align:center;padding:6px;background:rgba(255,255,255,0.04);border-radius:6px">
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:2px">CA An 1</div>
          <div style="font-size:13px;font-weight:700;color:${color}">${relText(String(s.ca_an1||'—'))}</div>
        </div>
        <div style="text-align:center;padding:6px;background:rgba(255,255,255,0.04);border-radius:6px">
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:2px">CA An 3</div>
          <div style="font-size:13px;font-weight:700;color:${color}">${relText(String(s.ca_an3||'—'))}</div>
        </div>
      </div>
      ${s.point_mort_mois ? `<div style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.45);text-align:center">Break-even : ${relText(String(s.point_mort_mois))}</div>` : ''}
    </div>`;
  }).join('');

  return `<div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)">
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:12px">Scénarios financiers</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">${cards}</div>
  </div>`;
}

function renderTresorerieMensuelle(tm) {
  if (!tm?.length) return '';
  const rows = tm.map(m => {
    const hasAlert = m.alerte && m.alerte !== 'null';
    return `<tr style="${hasAlert ? 'background:rgba(239,68,68,0.08)' : ''}">
      <td style="padding:7px 10px;font-size:12px;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.04);white-space:nowrap">${esc(m.mois||'')}</td>
      <td style="padding:7px 10px;font-size:12px;color:#34d399;font-family:'DM Mono',monospace;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">${relText(String(m.encaissements||'—'))}</td>
      <td style="padding:7px 10px;font-size:12px;color:#ef4444;font-family:'DM Mono',monospace;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">${relText(String(m.decaissements||'—'))}</td>
      <td style="padding:7px 10px;font-size:12px;font-weight:600;font-family:'DM Mono',monospace;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">${relText(String(m.solde_mois||'—'))}</td>
      <td style="padding:7px 10px;font-size:12px;font-weight:700;color:var(--acid);font-family:'DM Mono',monospace;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">${relText(String(m.solde_cumule||'—'))}</td>
      ${hasAlert ? `<td style="padding:7px 10px;font-size:11px;color:#fbbf24;border-bottom:1px solid rgba(255,255,255,0.04)">⚠ ${esc(m.alerte)}</td>` : '<td></td>'}
    </tr>`;
  }).join('');

  return `<div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);overflow-x:auto">
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:10px">Trésorerie mensuelle détaillée</div>
    <table style="width:100%;border-collapse:collapse;min-width:520px">
      <thead>
        <tr style="background:rgba(255,255,255,0.04)">
          <th style="padding:8px 10px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.3);text-align:left">Mois</th>
          <th style="padding:8px 10px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.3);text-align:right">Encaissements</th>
          <th style="padding:8px 10px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.3);text-align:right">Décaissements</th>
          <th style="padding:8px 10px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.3);text-align:right">Solde mois</th>
          <th style="padding:8px 10px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--acid);text-align:right">Cumulé</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// ── Construit tout le HTML des 20 sections dans l'ordre ──────────────
// ── RENDER DISCLAIMER ────────────────────────────────────────────────────────
function renderDisclaimer(d) {
  if (!d) return '';
  const msg = d.message_entrepreneur || {};
  const res = (d.ressources_gratuites_recommandees || []);
  const fait = (d.ce_que_ce_plan_fait || []);
  const nfait = (d.ce_que_ce_plan_ne_fait_pas || []);
  return `<div class="disclaimer-band" style="background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.2);border-radius:12px;padding:20px 24px;margin:20px 0 8px;display:flex;gap:16px;align-items:flex-start">
    <div style="font-size:22px;line-height:1;flex-shrink:0">⚠️</div>
    <div style="flex:1">
      <div style="font-size:13px;font-weight:600;color:var(--gold);margin-bottom:6px">${esc(msg.titre||'')}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;margin-bottom:10px">${esc(msg.corps||'')}</div>
      ${msg.recommandation_concrete ? `<div style="font-size:12px;color:rgba(251,191,36,0.8);background:rgba(251,191,36,0.08);border-radius:6px;padding:8px 12px;margin-bottom:12px">${esc(msg.recommandation_concrete)}</div>` : ''}
      ${res.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${res.map(r=>`<a href="https://${esc(r.url)}" target="_blank" rel="noopener" style="font-size:11px;padding:4px 10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;color:rgba(255,255,255,0.6);text-decoration:none;white-space:nowrap" title="${esc(r.service)}">${esc(r.organisme)} — ${esc(r.cout)}</a>`).join('')}</div>` : ''}
      <details style="margin-top:10px">
        <summary style="font-size:11px;color:rgba(255,255,255,0.35);cursor:pointer;list-style:none">Ce plan fait / ne fait pas ▾</summary>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
          <div><div style="font-size:11px;font-weight:600;color:var(--green);margin-bottom:6px">✓ Ce plan fait</div>${fait.map(f=>`<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:3px">• ${esc(f)}</div>`).join('')}</div>
          <div><div style="font-size:11px;font-weight:600;color:rgba(248,113,113,0.9);margin-bottom:6px">✗ Ne remplace pas</div>${nfait.map(f=>`<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:3px">• ${esc(f)}</div>`).join('')}</div>
        </div>
      </details>
    </div>
  </div>`;
}

// ── RENDER TABLEAU AMORTISSEMENT ────────────────────────────────────────────
function renderTableauAmortissement(ta) {
  if (!ta || ta === 'null') return '';
  const p = ta.parametres || {};
  const ech = ta.echeancier_annuel || [];
  const acr = ta.analyse_capacite_remboursement || {};
  const conseilsList = ta.conseils_negociation_banque || [];
  const diff = acr.option_differe || {};

  const pctVal = parseFloat((acr.mensualite_vs_marge_nette_an1||'').replace('%',''));
  const pctColor = !isNaN(pctVal) ? (pctVal < 15 ? 'var(--green)' : pctVal < 25 ? 'var(--gold)' : '#f87171') : 'var(--muted)';

  const echeancierHtml = ech.length ? `
    <div style="overflow-x:auto;margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse;font-size:12px;font-family:'DM Mono',monospace">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
            <th style="text-align:left;padding:6px 8px;color:rgba(255,255,255,0.4);font-weight:500">Année</th>
            <th style="text-align:right;padding:6px 8px;color:rgba(255,255,255,0.4);font-weight:500">Mensualité</th>
            <th style="text-align:right;padding:6px 8px;color:rgba(255,255,255,0.4);font-weight:500">Capital remboursé</th>
            <th style="text-align:right;padding:6px 8px;color:rgba(255,255,255,0.4);font-weight:500">Intérêts payés</th>
            <th style="text-align:right;padding:6px 8px;color:rgba(255,255,255,0.4);font-weight:500">Capital restant</th>
          </tr>
        </thead>
        <tbody>
          ${ech.map((row,i)=>`
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);${i%2===0?'background:rgba(255,255,255,0.02)':''}">
              <td style="padding:6px 8px;color:rgba(255,255,255,0.6)">An ${row.annee||i+1}</td>
              <td style="padding:6px 8px;text-align:right;color:var(--text)">${relText(row.mensualite||'—')}</td>
              <td style="padding:6px 8px;text-align:right;color:var(--green)">${relText(row.capital_rembourse_annee||'—')}</td>
              <td style="padding:6px 8px;text-align:right;color:rgba(248,113,113,0.8)">${relText(row.interets_payes_annee||'—')}</td>
              <td style="padding:6px 8px;text-align:right;color:rgba(255,255,255,0.5)">${relText(row.capital_restant_du_fin_annee||'—')}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>` : '';

  return planBlock('16b — Tableau d\'Amortissement du Prêt', `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      <div class="stat-mini"><div class="stat-mini-label">Capital emprunté</div><div class="stat-mini-val">${relText(p.capital_emprunte||'—')}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Taux annuel estimé</div><div class="stat-mini-val">${relText(p.taux_annuel_estime||'—')}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Durée</div><div class="stat-mini-val">${relText(p.duree_annees||'—')}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Mensualité estimée</div><div class="stat-mini-val" style="color:var(--gold)">${relText(p.mensualite_estimee||'—')}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Total intérêts</div><div class="stat-mini-val" style="color:#f87171">${relText(p.total_interets||'—')}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Coût total crédit</div><div class="stat-mini-val">${relText(p.cout_total_credit||'—')}</div></div>
    </div>
    ${echeancierHtml}
    ${acr.verdict ? `<div style="background:rgba(255,255,255,0.04);border-left:3px solid ${pctColor};border-radius:6px;padding:12px 16px;margin-bottom:14px">
      <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px">Capacité de remboursement</div>
      <div style="font-size:13px;color:var(--text);line-height:1.5">${esc(acr.verdict)}</div>
      <div style="font-size:20px;font-weight:700;color:${pctColor};margin-top:6px">${relText(acr.mensualite_vs_marge_nette_an1||'')}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px">${esc(acr.appreciation||'')}</div>
    </div>` : ''}
    ${diff.recommande ? `<div style="background:rgba(107,143,239,0.06);border:1px solid rgba(107,143,239,0.2);border-radius:8px;padding:12px 16px;margin-bottom:14px">
      <div style="font-size:12px;font-weight:600;color:var(--acid);margin-bottom:6px">💡 Différé recommandé — ${esc(diff.type||'')} (${esc(diff.duree_conseillee||'')})</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5">${esc(diff.explication||'')}</div>
    </div>` : ''}
    ${conseilsList.length ? `<div style="margin-top:4px"><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);letter-spacing:0.05em;margin-bottom:8px">CONSEILS NÉGOCIATION BANQUE</div>
      ${conseilsList.map(c=>`<div style="font-size:12px;color:rgba(255,255,255,0.6);padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);line-height:1.5">• ${esc(c)}</div>`).join('')}
    </div>` : ''}
    ${ta.note_importante ? `<div style="margin-top:14px;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.5;font-style:italic">${esc(ta.note_importante)}</div>` : ''}
  `);
}

function buildAllSections(plan) {
  const crescendo7 = `
    <div class="crescendo-grid" style="margin-bottom:20px">
      ${[
        {k:'rev_m1',l:'M1'},{k:'rev_m3',l:'M3'},{k:'rev_m6',l:'M6'},
        {k:'rev_m12',l:'An 1'},{k:'rev_m18',l:'1.5 an'},{k:'rev_m24',l:'An 2'},{k:'rev_m36',l:'An 3'}
      ].map((j,i) => `
        <div class="crescendo-cell${i>=4?' crescendo-cell-proj':''}${i===6?' crescendo-cell-last':''}">
          <div class="crescendo-period">${j.l}</div>
          <div class="crescendo-amount">${relText(plan[j.k]||'—')}</div>
        </div>`).join('')}
    </div>`;

  let h = `<div style="max-width:960px;margin:0 auto;padding:0 40px 60px">`;

  // ── Meta top ──
  h += `<div style="padding-top:28px">${renderCompletenessCounter(plan)}${renderReliabilityScoreCard(plan)}</div>`;

  // ── Disclaimer ──
  if (plan.disclaimer) h += renderDisclaimer(plan.disclaimer);

  // ── Score Bancabilité v2.0 ──
  if (plan.scores?.score_bancabilite) h += renderScoreBancabilite(plan.scores.score_bancabilite);

  // ── Plan de Financement v2.0 ──
  if (plan.plan_financement) h += planBlock('✦ Plan de Financement', renderPlanFinancement(plan.plan_financement));

  // ── 01 Résumé Exécutif ──
  h += planBlock('01 — Résumé Exécutif',
    `<div class="plan-block-content">${relText(plan.resume_executif||'')}</div>
    ${plan.pitch_30s ? `<div style="margin-top:20px;font-size:15px;line-height:1.85;color:#ecedf2;background:rgba(107,143,239,0.06);border:1px solid rgba(107,143,239,0.2);border-radius:10px;padding:20px;font-style:italic">${esc(plan.pitch_30s)}</div>` : ''}`,
    'Peux-tu améliorer mon résumé exécutif pour le rendre plus percutant ?');

  // ── 02 Porteur de Projet ──
  if (plan.porteur_projet) h += planBlock('02 — Porteur de Projet',
    `<div class="plan-block-content">${relText(plan.porteur_projet)}</div>`,
    'Comment renforcer ma crédibilité en tant que porteur de projet ?');

  // ── 03 Présentation du Projet ──
  if (plan.presentation_projet) h += planBlock('03 — Présentation du Projet',
    `<div class="plan-block-content">${relText(plan.presentation_projet)}</div>`,
    'Comment renforcer la vision de mon projet ?');

  // ── 04 Étude de Marché ──
  h += planBlock('04 — Étude de Marché', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div class="stat-mini"><div class="stat-mini-label">Taille du marché</div><div class="stat-mini-val">${relText(plan.marche_taille||'—')}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Croissance annuelle</div><div class="stat-mini-val">${relText(plan.marche_croissance||'—')}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Part cible (an 1)</div><div class="stat-mini-val">${relText(plan.marche_part_cible||'—')}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Clients potentiels</div><div class="stat-mini-val">${relText(plan.marche_clients_potentiels||'—')}</div></div>
    </div>
    <div class="plan-block-content">${relText(plan.marche_analyse||'')}</div>
    ${renderPersonaMini(plan.persona)}`,
    'Comment mieux analyser mon marché cible ?');

  // ── 05 Analyse Concurrentielle ──
  h += planBlock('05 — Analyse Concurrentielle', `
    <div class="plan-block-content" style="margin-bottom:16px">${relText(plan.concurrence_intro||'')}</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${(plan.concurrents||[]).map(c => renderConcurrentCard(c)).join('')}
    </div>
    ${plan.concurrents?.length ? `<div style="margin-top:20px;height:130px"><canvas id="concChart"></canvas></div>` : ''}`,
    'Comment me différencier de mes concurrents ?');

  // ── 06 Proposition de Valeur ──
  if (plan.proposition_valeur) h += planBlock('06 — Proposition de Valeur Unique',
    `<div class="plan-block-content plan-usp">${relText(plan.proposition_valeur)}</div>`,
    'Mon USP est-elle assez différenciante ?');

  // ── 07 Modèle Économique ──
  h += planBlock('07 — Modèle Économique', `
    <div class="plan-block-content" style="margin-bottom:16px">${relText(plan.modele_economique||'')}</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${(plan.offres||[]).map(o => `
        <div class="offre-card">
          <div><div class="offre-name">${esc(o.nom)}</div><div class="offre-desc">${esc(o.description)}</div></div>
          <div class="offre-price">${relText(o.prix||'')}</div>
        </div>`).join('')}
    </div>`,
    'Mon modèle économique est-il solide ?');

  // ── 08 Stratégie Commerciale ──
  if (plan.strategie_commerciale) h += planBlock('08 — Stratégie Commerciale',
    `<div class="plan-block-content">${relText(plan.strategie_commerciale)}</div>`,
    'Quelle stratégie commerciale prioriser en premier ?');

  // ── 09 Plan d'Acquisition ──
  h += planBlock('09 — Plan d\'Acquisition Client', `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${(plan.acquisition||[]).map(a => `
        <div class="acq-card">
          <div class="acq-canal">${esc(a.canal)}</div>
          <div class="acq-desc">${esc(a.description)}</div>
          <div class="acq-cac">${relText(a.cac||'')}</div>
        </div>`).join('')}
    </div>`,
    'Quels canaux d\'acquisition prioriser ?');

  // ── 10 Aspects Juridiques ──
  if (plan.aspects_juridiques) h += planBlock('10 — Aspects Juridiques', `
    <div class="plan-block-content">${relText(plan.aspects_juridiques)}</div>
    ${renderDemarchesHtml(plan.demarches_admin)}`,
    'Quel statut juridique me conseilles-tu pour ce projet ?');

  // ── 11 Aspects Organisationnels ──
  if (plan.aspects_organisationnels) h += planBlock('11 — Aspects Organisationnels',
    `<div class="plan-block-content">${relText(plan.aspects_organisationnels)}</div>`);

  // ── 12 Projections Financières ──
  h += planBlock('12 — Projections Financières', `
    ${crescendo7}
    <div style="height:140px;margin-bottom:24px"><canvas id="crescendoChart"></canvas></div>
    <div style="height:170px;margin-bottom:24px"><canvas id="revenueChart"></canvas></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${(plan.finances_detail||[]).map(f => `
        <div class="stat-mini">
          <div class="stat-mini-label">${esc(f.label)}</div>
          <div class="stat-mini-val" style="font-size:18px">${relText(f.valeur||'')}</div>
        </div>`).join('')}
    </div>
    ${plan.scenarios ? renderScenariosBlock(plan.scenarios) : ''}`,
    'Mes projections financières sont-elles réalistes ?');

  // ── 13 Plan de Trésorerie ──
  if (plan.tresorerie_detail) h += planBlock('13 — Plan de Trésorerie', `
    <div class="plan-block-content">${relText(plan.tresorerie_detail)}</div>
    ${plan.tresorerie_soldes?.length ? `<div style="height:120px;margin-top:20px"><canvas id="tresoChart"></canvas></div>` : ''}
    ${plan.tresorerie_mensuelle?.length ? renderTresorerieMensuelle(plan.tresorerie_mensuelle) : ''}`,
    'Comment optimiser ma trésorerie les 6 premiers mois ?');

  // ── 14 Plan d'Investissement ──
  h += planBlock('14 — Plan d\'Investissement', `
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
      ${(plan.investissements||[]).map(i => `
        <div class="invest-row${i.total?' total':''}">
          <span class="invest-label">${esc(i.label)}</span>
          <span class="invest-amount">${relText(i.montant||'')}</span>
        </div>`).join('')}
    </div>
    ${(plan.investissements||[]).filter(i=>!i.total).length ? `<div style="height:160px"><canvas id="investDonut"></canvas></div>` : ''}`);

  // ── 15 Bilan Prévisionnel ──
  if (plan.bilan_previsionnel) h += planBlock('15 — Bilan Prévisionnel 3 Ans',
    `<div class="plan-block-content">${relText(plan.bilan_previsionnel)}</div>`);

  // ── 16 Seuil de Rentabilité ──
  if (plan.seuil_rentabilite) {
    const sr = plan.seuil_rentabilite;
    h += planBlock('16 — Seuil de Rentabilité', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="stat-mini"><div class="stat-mini-label">Charges fixes/mois</div><div class="stat-mini-val">${relText(sr.charges_fixes_mensuelles||'—')}</div></div>
        <div class="stat-mini"><div class="stat-mini-label">Taux marge/CV</div><div class="stat-mini-val">${relText(sr.taux_marge_sur_cv||'—')}</div></div>
        <div class="stat-mini"><div class="stat-mini-label">Point mort CA/mois</div><div class="stat-mini-val" style="color:#34d399">${relText(sr.point_mort_ca||'—')}</div></div>
        <div class="stat-mini"><div class="stat-mini-label">Break-even atteint</div><div class="stat-mini-val" style="color:#a78bfa">${relText(sr.break_even_mois||'—')}</div></div>
      </div>
      ${sr.detail ? `<div class="plan-block-content">${relText(sr.detail)}</div>` : ''}`,
      'Comment atteindre plus vite mon seuil de rentabilité ?');
  }

  // ── 16b Tableau d'Amortissement ──
  if (plan.tableau_amortissement && plan.tableau_amortissement !== null) {
    h += renderTableauAmortissement(plan.tableau_amortissement);
  }

  // ── 17 Risques & Mitigation ──
  h += planBlock('17 — Risques &amp; Mitigation', `
    <div style="display:flex;flex-direction:column;gap:12px">
      ${(plan.risques||[]).map(r => renderRiskCard(r)).join('')}
    </div>`,
    'Quels sont mes 3 plus gros risques et comment les mitiger ?');

  // ── 18 Plan d'Action 90 Jours ──
  h += planBlock('18 — Plan d\'Action 90 Jours',
    `<div id="dActions90j"></div>`,
    'Comment prioriser mon plan d\'action sur les 30 premiers jours ?');

  // ── 19 Aides & Subventions ──
  if (plan.aides_subventions?.length) h += planBlock('19 — Aides &amp; Subventions', `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${plan.aides_subventions.map(a => renderAideCard(a)).join('')}
    </div>`,
    'Quelles aides puis-je obtenir pour mon projet ?');

  // ── 20 Annexes & Checklist ──
  if (plan.annexes_checklist?.length) h += planBlock('20 — Annexes à Préparer', `
    <div style="display:flex;flex-direction:column;gap:8px">
      ${plan.annexes_checklist.map((item,i) => `
        <div class="annexe-item">
          <div class="annexe-num">${String(i+1).padStart(2,'0')}</div>
          <div class="annexe-text">${esc(item)}</div>
        </div>`).join('')}
    </div>`);

  // ── Bonus : KPIs ──
  if (plan.kpis?.length) h += planBlock('✦ KPIs à Suivre', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${plan.kpis.map(k => `
        <div class="stat-mini">
          <div class="stat-mini-label">${esc(k.nom)}</div>
          <div class="stat-mini-val" style="font-size:18px">${relText(k.cible||'')}</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);margin-top:6px">${esc(k.frequence||'')}</div>
        </div>`).join('')}
    </div>`);

  // ── Bonus : Outils ──
  if (plan.outils?.length) h += planBlock('✦ Ressources & Outils', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${plan.outils.map(o => `
        <div class="outil-card">
          <div class="outil-name">${esc(o.nom)}</div>
          <div class="outil-usage">${esc(o.usage)}</div>
          <div class="outil-prix">${relText(o.prix||'')}</div>
        </div>`).join('')}
    </div>`);

  // ── Bonus : Emails ──
  if (plan.email_fournisseur || plan.email_prospection) {
    const emails = [
      plan.email_fournisseur  && ['Email Fournisseur',   plan.email_fournisseur],
      plan.email_prospection  && ['Email Prospection',   plan.email_prospection],
      plan.email_relance      && ['Email Relance J+7',   plan.email_relance],
    ].filter(Boolean);
    h += planBlock('✦ Emails Prêts à Envoyer', `
      <div style="display:flex;flex-direction:column;gap:16px">
        ${emails.map(([l,d]) => renderEmailBlock(l,d)).join('')}
      </div>`);
  }

  // Placeholder IDs pour fillDocumentsAnnexes + fillBancabilite
  h += planBlock('✦ Documents Annexes',
    `<p style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:14px;line-height:1.5">Génère les pièces justificatives prêtes à soumettre à ta banque ou à BPI France.</p>
    <div class="docs-grid" id="dDocsGrid"></div>`);
  h += planBlock('✦ Checklist Bancabilité', `
    <div class="banc-score-bar" style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="flex:1">
        <div class="banc-track"><div class="banc-fill" id="dBancFill" style="width:0%"></div></div>
        <div class="banc-label" id="dBancLabel">À compléter</div>
      </div>
      <div class="banc-pct" id="dBancPct">0%</div>
    </div>
    <div class="banc-items" id="dBancItems"></div>`);

  h += `</div>`; // close max-width wrapper
  return h;
}

// ── HERO KPIs ─────────────────────────────────────────────────────
function fillHeroKpis(plan) {
  // CA An 3 (rev_m36 × 12)
  const ca3 = parseAmount(plan.rev_m36) || 0;
  const caAn3 = ca3 * 12;
  const kpiCa = document.getElementById('kpiCaAn3');
  if (kpiCa) {
    kpiCa.textContent = caAn3 >= 1e6 ? (caAn3/1e6).toFixed(1)+'M€'
      : caAn3 >= 1000 ? Math.round(caAn3/1000)+'k€'
      : caAn3 ? caAn3+'€' : '—';
    document.getElementById('kpiCaAn3Sub').textContent = 'revenus mois 36 × 12';
  }

  // Investissement total
  const investItems = (plan.investissements || []);
  const totalItem = investItems.find(i => i.total);
  let investTotal = totalItem ? parseAmount(totalItem.montant) : investItems.reduce((s,i) => s + (parseAmount(i.montant)||0), 0);
  const kpiInv = document.getElementById('kpiInvest');
  if (kpiInv) {
    kpiInv.textContent = investTotal >= 1000 ? Math.round(investTotal/1000)+'k€' : investTotal ? investTotal+'€' : '—';
    document.getElementById('kpiInvestSub').textContent = 'budget total requis';
  }

  // Part de marché cible
  const kpiMkt = document.getElementById('kpiMarket');
  if (kpiMkt) {
    kpiMkt.textContent = stripReliability(plan.marche_part_cible || '—');
    document.getElementById('kpiMarketSub').textContent = 'part marché an 1';
  }

  // Point mort / seuil rentabilité
  let pm = '—';
  if (plan.seuil_rentabilite) pm = stripReliability(plan.seuil_rentabilite);
  else {
    const fd = (plan.finances_detail || []).find(f => /seuil|rentab|point.mort/i.test(f.label||''));
    if (fd) pm = stripReliability(fd.valeur);
  }
  const kpiPm = document.getElementById('kpiPointMort');
  if (kpiPm) {
    kpiPm.textContent = pm;
    document.getElementById('kpiPointMortSub').textContent = 'seuil de rentabilité';
  }

  // Show
  const heroEl = document.getElementById('planHeroKpis');
  if (heroEl) heroEl.style.display = '';
}

// ── SIDEBAR NAVIGATION ────────────────────────────────────────────
function buildSidebar() {
  const sidebar = document.getElementById('planSidebar');
  if (!sidebar) return;

  const catOrder = ['strategy','market','finance','action','legal'];
  const catMeta = {
    strategy: { label:'Stratégie', color:'var(--cat-strategy)' },
    market:   { label:'Marché',    color:'var(--cat-market)' },
    finance:  { label:'Finance',   color:'var(--cat-finance)' },
    action:   { label:'Action',    color:'var(--cat-action)' },
    legal:    { label:'Légal',     color:'var(--cat-legal)' },
  };

  const groups = {};
  catOrder.forEach(c => { groups[c] = []; });

  document.querySelectorAll('.plan-block[id][data-cat]').forEach(block => {
    const cat = block.dataset.cat;
    if (!groups[cat]) return;
    const numEl = block.querySelector('.block-num');
    const titleEl = block.querySelector('.block-title');
    const num = numEl ? numEl.textContent : '✦';
    const titleText = titleEl ? titleEl.childNodes[0]?.textContent?.trim() || titleEl.textContent.replace('💬','').trim() : block.id;
    groups[cat].push({ id: block.id, num, title: titleText });
  });

  let html = '';
  catOrder.forEach(cat => {
    if (!groups[cat].length) return;
    const m = catMeta[cat];
    html += `<div class="sidebar-cat"><span class="cat-dot" style="background:${m.color}"></span>${m.label}</div>`;
    groups[cat].forEach(s => {
      html += `<div class="sidebar-link" data-target="${s.id}" onclick="scrollToSection('${s.id}')"><span class="snum">${s.num}</span>${s.title}</div>`;
    });
  });
  sidebar.innerHTML = html;
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  const planContent = document.querySelector('.plan-content');
  if (el && planContent) {
    planContent.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
  }
}

function initPlanNav() {
  const planContent = document.querySelector('.plan-content');
  if (!planContent) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = document.querySelector(`.sidebar-link[data-target="${entry.target.id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        // Auto-scroll sidebar to show active link
        const sb = document.getElementById('planSidebar');
        if (sb) { const top = link.offsetTop - sb.clientHeight/2 + link.clientHeight/2; sb.scrollTo({ top, behavior: 'smooth' }); }
      }
    });
  }, { root: planContent, threshold: 0.2 });
  document.querySelectorAll('.plan-block[id]').forEach(b => observer.observe(b));
}

// ─────────────────────────────────────────────────────────────────
function fillPlan(plan) {
  // ── Header (hors scrollBody) ──────────────────────────────────────
  document.getElementById('dBizName').textContent = plan.nom_business || '—';
  document.getElementById('dBizTagline').textContent = plan.tagline || '';

  const badge = document.getElementById('dPlanBadge');
  if (badge) {
    const labels = { empire: 'Empire ✦', pro: 'Pro', solo: 'Solo' };
    badge.textContent = labels[currentPlan] || 'Découverte';
    if (currentPlan === 'empire') { badge.style.background='rgba(167,139,250,0.15)'; badge.style.borderColor='rgba(167,139,250,0.3)'; badge.style.color='#a78bfa'; }
    else if (currentPlan === 'pro') { badge.style.background='rgba(107,143,239,0.12)'; badge.style.borderColor='rgba(107,143,239,0.25)'; badge.style.color='#9db8f8'; }
    else { badge.style.background='rgba(255,255,255,0.05)'; badge.style.borderColor='rgba(255,255,255,0.1)'; badge.style.color='#7a7f9a'; }
  }

  const score = plan.score_viabilite || plan.scores?.score_viabilite?.note || 72;
  document.getElementById('dScore').textContent = score + '/100';
  setTimeout(() => {
    const bar = document.getElementById('dScoreBar');
    if (bar) { bar.style.width = score + '%'; bar.style.background = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#ef4444'; }
  }, 300);

  // ── Plan full-width ───────────────────────────────────────────────
  const genLayout = document.querySelector('.gen-layout');
  if (genLayout) genLayout.classList.add('plan-visible');

  // ── Rebuild complet planScrollBody dans l'ordre 01→20 ───────────
  const scrollBody = document.getElementById('planScrollBody');
  if (scrollBody) {
    // Garder uniquement les disclaimers, supprimer le reste
    Array.from(scrollBody.children).forEach(child => {
      if (!child.classList.contains('ai-disclaimer') && !child.classList.contains('rel-disclaimer')) {
        child.remove();
      }
    });
    const planSections = document.createElement('div');
    planSections.id = 'plan-all-sections';
    planSections.innerHTML = buildAllSections(plan);
    scrollBody.appendChild(planSections);

    // ── Hero KPIs + Sidebar nav ───────────────────────────────────
    fillHeroKpis(plan);
    buildSidebar();
    setTimeout(() => initPlanNav(), 100);

    // Charts (après injection DOM)
    const crescLabels = ['M1','M3','M6','An 1','1.5 an','An 2','An 3'];
    const crescVals = ['rev_m1','rev_m3','rev_m6','rev_m12','rev_m18','rev_m24','rev_m36'].map(k => parseAmount(plan[k]));
    setTimeout(() => {
      drawCrescendoChart('crescendoChart', crescLabels, crescVals);
      drawRevenueChart(plan.rev_mensuel || []);
      if (plan.concurrents?.length) {
        drawBarChart('concChart', plan.concurrents.map(c => c.nom.split(' ')[0]), plan.concurrents.map(c => c.menace==='haute'?85:c.menace==='moyenne'?55:25), 'Menace');
      }
      const nonTotal = (plan.investissements||[]).filter(i=>!i.total);
      if (nonTotal.length) drawDonutChart('investDonut', nonTotal.map(i=>i.label.replace(/^\d+\.\s*/,'').substring(0,20)), nonTotal.map(i=>parseAmount(i.montant)||1), ['#6b8fef','#a78bfa','#34d399','#fbbf24','#ef4444','#9db8f8']);
      if (plan.tresorerie_soldes?.length) drawCrescendoChart('tresoChart', ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'].slice(0,plan.tresorerie_soldes.length), plan.tresorerie_soldes);
    }, 250);

    renderTimeline90j(plan.actions || [], 'dActions90j');
    fillDocumentsAnnexes(plan);
    fillBancabilite(plan);
    applyReliabilityIndicators(scrollBody);
  }
}

  if (false) { const setInner = () => {}; const setText = () => {};

  setText('dMktSize',    stripReliability(plan.marche_taille || '—'));
  setText('dMktGrowth',  stripReliability(plan.marche_croissance || '—'));
  setText('dMktShare',   stripReliability(plan.marche_part_cible || '—'));
  setText('dMktClients', stripReliability(plan.marche_clients_potentiels || '—'));
  setInner('dMarche', relText(plan.marche_analyse || ''));

  // ── 03/07. Modèle économique ─────────────────────────────────────
  setInner('dModele', relText(plan.modele_economique || ''));
  setInner('dOffresBlock', (plan.offres || []).map(o => `
    <div class="offre-card">
      <div><div class="offre-name">${esc(o.nom)}</div><div class="offre-desc">${esc(o.description)}</div></div>
      <div class="offre-price">${relText(o.prix || '')}</div>
    </div>`).join(''));

  // ── 04/05. Concurrents ───────────────────────────────────────────
  setInner('dConcurrenceIntro', relText(plan.concurrence_intro || ''));
  setInner('dConcurrents', (plan.concurrents || []).map((c, i) => {
    const threatClass = c.menace === 'haute' ? 'threat-high' : c.menace === 'moyenne' ? 'threat-med' : 'threat-low';
    const threatLabel = c.menace === 'haute' ? 'Menace haute' : c.menace === 'moyenne' ? 'Menace moyenne' : 'Menace faible';
    const threatColor = c.menace === 'haute' ? '#ef4444' : c.menace === 'moyenne' ? '#fbbf24' : '#34d399';
    return `
    <div class="concurrent-card">
      <div class="cc-header">
        <div class="cc-name">${esc(c.nom)}</div>
        <div class="cc-threat ${threatClass}" style="color:${threatColor};background:${threatColor}18;border-color:${threatColor}40">
          <span style="background:${threatColor};width:6px;height:6px;border-radius:50%;display:inline-block;flex-shrink:0"></span>
          ${threatLabel}
        </div>
      </div>
      <div class="cc-desc">${esc(c.description)}</div>
      ${c.prix_moyen ? `<div class="cc-prix">Prix moyen : ${relText(c.prix_moyen)}</div>` : ''}
    </div>`;
  }).join(''));

  // Bar chart concurrents (menace en %)
  const hasConc = (plan.concurrents || []).length > 0;
  if (hasConc) {
    const concEl = document.getElementById('dConcurrents');
    if (concEl) {
      const chartWrap = document.createElement('div');
      chartWrap.style.cssText = 'margin-top:16px;height:120px;';
      chartWrap.innerHTML = '<canvas id="concChart"></canvas>';
      concEl.appendChild(chartWrap);
      const labels = plan.concurrents.map(c => c.nom.split(' ')[0]);
      const vals = plan.concurrents.map(c => c.menace === 'haute' ? 85 : c.menace === 'moyenne' ? 55 : 25);
      setTimeout(() => drawBarChart('concChart', labels, vals, 'Niveau de menace'), 200);
    }
  }

  // ── 05/12. Projections financières — 7 jalons crescendo ──────────
  // Grille crescendo
  const crescendoEl = document.getElementById('dCrescendoGrid');
  if (crescendoEl) {
    const jalons = [
      { key: 'rev_m1',  label: 'M1' },
      { key: 'rev_m3',  label: 'M3' },
      { key: 'rev_m6',  label: 'M6' },
      { key: 'rev_m12', label: 'An 1' },
      { key: 'rev_m18', label: '1.5 an' },
      { key: 'rev_m24', label: 'An 2' },
      { key: 'rev_m36', label: 'An 3' },
    ];
    crescendoEl.innerHTML = jalons.map((j, i) => `
      <div class="crescendo-cell${i === 6 ? ' crescendo-cell-last' : ''}">
        <div class="crescendo-period">${j.label}</div>
        <div class="crescendo-amount">${relText(plan[j.key] || '—')}</div>
      </div>`).join('');
  }

  // Graphique crescendo
  const crescLabels = ['M1','M3','M6','An 1','1.5 an','An 2','An 3'];
  const crescVals = [
    parseAmount(plan.rev_m1),
    parseAmount(plan.rev_m3),
    parseAmount(plan.rev_m6),
    parseAmount(plan.rev_m12),
    parseAmount(plan.rev_m18),
    parseAmount(plan.rev_m24),
    parseAmount(plan.rev_m36),
  ];
  setTimeout(() => drawCrescendoChart('crescendoChart', crescLabels, crescVals), 300);

  // Ancien rendu 5 cellules (backward compat pour les IDs existants)
  setText('dRev1',  stripReliability(plan.rev_m1  || '—'));
  setText('dRev3',  stripReliability(plan.rev_m3  || '—'));
  setText('dRev6',  stripReliability(plan.rev_m6  || '—'));
  setText('dRev12', stripReliability(plan.rev_m12 || '—'));
  setText('dRevAn3',stripReliability(plan.rev_an3 || plan.rev_m36 || '—'));

  // Graphique revenu mensuel (12 mois)
  drawRevenueChart(plan.rev_mensuel || []);

  setInner('dFinancesDetail', (plan.finances_detail || []).map(f => `
    <div class="stat-mini">
      <div class="stat-mini-label">${esc(f.label)}</div>
      <div class="stat-mini-val">${relText(f.valeur || '')}</div>
    </div>`).join(''));

  // ── 06/09. Acquisition ───────────────────────────────────────────
  setInner('dAcquisition', (plan.acquisition || []).map(a => `
    <div class="acq-card">
      <div class="acq-canal">${esc(a.canal)}</div>
      <div class="acq-desc">${esc(a.description)}</div>
      <div class="acq-cac">${relText(a.cac || '')}</div>
    </div>`).join(''));

  // ── 07/18. Plan d'action 90 jours — Timeline visuelle ───────────
  renderTimeline90j(plan.actions || []);

  // ── 08/14. Investissements + Donut ──────────────────────────────
  setInner('dInvestissement', (plan.investissements || []).map(i => `
    <div class="invest-row${i.total ? ' total' : ''}">
      <span class="invest-label">${esc(i.label)}</span>
      <span class="invest-amount">${relText(i.montant || '')}</span>
    </div>`).join(''));

  // Donut chart investissements
  const nonTotalInvest = (plan.investissements || []).filter(i => !i.total);
  if (nonTotalInvest.length > 0) {
    const investEl = document.getElementById('dInvestissement');
    if (investEl) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'margin-top:16px;height:140px;';
      wrap.innerHTML = '<canvas id="investDonut"></canvas>';
      investEl.appendChild(wrap);
      const donutLabels = nonTotalInvest.map(i => i.label.replace(/^\d+\.\s+/, '').substring(0, 20));
      const donutVals = nonTotalInvest.map(i => parseAmount(i.montant) || 1);
      const donutColors = ['#6b8fef','#a78bfa','#34d399','#fbbf24','#ef4444','#9db8f8'];
      setTimeout(() => drawDonutChart('investDonut', donutLabels, donutVals, donutColors), 400);
    }
  }

  // ── 09/17. Risques ───────────────────────────────────────────────
  setInner('dRisques', (plan.risques || []).map(r => {
    const lvlColor = r.niveau === 'élevé' ? '#ef4444' : r.niveau === 'moyen' ? '#fbbf24' : '#34d399';
    return `<div class="risk-card">
      <div class="risk-header">
        <div class="risk-title">${esc(r.titre)}</div>
        <div class="risk-level" style="color:${lvlColor};background:${lvlColor}18;border:1px solid ${lvlColor}40">${esc(r.niveau || '')}</div>
      </div>
      <div class="risk-solution"><strong>Mitigation :</strong> ${esc(r.solution)}</div>
    </div>`;
  }).join(''));

  // ── 10. Outils ──────────────────────────────────────────────────
  setInner('dOutils', (plan.outils || []).map(o => `
    <div class="outil-card">
      <div class="outil-name">${esc(o.nom)}</div>
      <div class="outil-usage">${esc(o.usage)}</div>
      <div class="outil-prix">${relText(o.prix || '')}</div>
    </div>`).join(''));

  // ── 11. KPIs ────────────────────────────────────────────────────
  setInner('dKpis', (plan.kpis || []).map(k => `
    <div class="stat-mini">
      <div class="stat-mini-label">${esc(k.nom)}</div>
      <div class="stat-mini-val" style="font-size:16px">${relText(k.cible || '')}</div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);margin-top:4px">${esc(k.frequence || '')}</div>
    </div>`).join(''));

  // ── 12. Pitch 30s ────────────────────────────────────────────────
  setText('dPitch', plan.pitch_30s || '');

  // ── 13. Persona ─────────────────────────────────────────────────
  const p = plan.persona;
  setInner('dPersona', p ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="stat-mini"><div class="stat-mini-label">Prénom / Âge</div><div style="font-size:15px;font-weight:700;color:#fff;margin-top:4px">${esc(p.nom)}, ${esc(p.age)}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Situation</div><div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;line-height:1.5">${esc(p.situation)}</div></div>
      <div class="stat-mini" style="grid-column:span 2"><div class="stat-mini-label">Douleurs principales</div><div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;line-height:1.6">${esc(p.douleurs)}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Motivations</div><div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;line-height:1.5">${esc(p.motivations)}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Où le trouver</div><div style="font-size:13px;color:var(--acid);margin-top:4px;line-height:1.5">${esc(p.ou_le_trouver)}</div></div>
    </div>` : '');

  // ── 14. Démarches admin ─────────────────────────────────────────
  if (plan.demarches_admin) {
    const el = document.getElementById('dDemarchesBlock');
    if (el) el.style.display = 'block';
    setInner('dDemarches', (plan.demarches_admin || []).map(d => `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:14px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
          <div style="font-weight:700;font-size:13px;color:#fff">${esc(d.etape)}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span style="font-family:'DM Mono',monospace;font-size:10px;background:rgba(107,143,239,0.1);color:var(--acid);padding:2px 8px;border-radius:20px">${esc(d.delai)}</span>
            <span style="font-family:'DM Mono',monospace;font-size:10px;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);padding:2px 8px;border-radius:20px">${esc(d.cout)}</span>
          </div>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.65;margin-bottom:6px">${esc(d.detail)}</div>
        <a href="https://${esc(d.lien)}" target="_blank" rel="noopener noreferrer" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--acid);text-decoration:none;opacity:0.7">→ ${esc(d.lien)}</a>
      </div>`).join(''));
  }

  // ── 15. Emails ──────────────────────────────────────────────────
  if (plan.email_fournisseur || plan.email_prospection) {
    const el = document.getElementById('dEmailsBlock');
    if (el) el.style.display = 'block';
    const emails = [];
    if (plan.email_fournisseur)  emails.push({ label: 'Email Fournisseur',     data: plan.email_fournisseur });
    if (plan.email_prospection)  emails.push({ label: 'Email Prospection',     data: plan.email_prospection });
    if (plan.email_relance)      emails.push({ label: 'Email Relance (J+7)',   data: plan.email_relance });
    setInner('dEmails', emails.map(e => `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden">
        <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between">
          <div style="font-weight:700;font-size:14px;color:#fff">${esc(e.label)}</div>
          <button onclick="copyEmail(this)" data-text="${encodeURIComponent('Objet: ' + (e.data.sujet||'') + '\n\n' + (e.data.corps||''))}"
            style="font-family:'DM Mono',monospace;font-size:11px;background:rgba(107,143,239,0.1);color:var(--acid);border:1px solid rgba(107,143,239,0.2);border-radius:20px;padding:4px 12px;cursor:pointer">Copier</button>
        </div>
        <div style="padding:14px 16px">
          <div style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:6px">OBJET</div>
          <div style="font-size:13px;color:var(--acid);font-weight:600;margin-bottom:12px">${esc(e.data.sujet || '')}</div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:6px">CORPS</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.75);line-height:1.75;white-space:pre-wrap">${esc(e.data.corps || '')}</div>
        </div>
      </div>`).join(''));
  }

  // ── 16. Documents annexes ────────────────────────────────────────
  fillDocumentsAnnexes(plan);

  // ── 17. Checklist bancabilité ────────────────────────────────────
  fillBancabilite(plan);

  } // end if(false)

// ═══════════════════════════════════════════════════════════════════
// ANCIENNES FONCTIONS (conservées vides pour compat)
// ═══════════════════════════════════════════════════════════════════

function injectExtraSections(plan) { /* remplacée par buildAllSections */ }
function _oldInjectExtraSections_DEAD(plan) {
  const scrollBody = document.getElementById('planScrollBody');
  if (!scrollBody) return;

  // Supprimer l'ancien bloc si re-génération
  const oldExtra = document.getElementById('plan-extra-sections');
  if (oldExtra) oldExtra.remove();

  const wrap = document.createElement('div');
  wrap.id = 'plan-extra-sections';

  // Injecter après le résumé exécutif (premier .plan-block)
  const firstBlock = scrollBody.querySelector('.plan-block');

  let html = '';

  // ─ 02. Porteur de projet ─
  if (plan.porteur_projet) {
    html += `<div class="plan-block">
      <div class="plan-block-title">02 — Porteur de Projet
        <button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,'Peux-tu améliorer ma présentation de porteur de projet ?')" title="Expert Eadee">💬</button>
      </div>
      <div class="plan-block-content">${relText(plan.porteur_projet)}</div>
    </div>`;
  }

  // ─ 03. Présentation du projet ─
  if (plan.presentation_projet) {
    html += `<div class="plan-block">
      <div class="plan-block-title">03 — Présentation du Projet
        <button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,'Comment renforcer la vision de mon projet ?')" title="Expert Eadee">💬</button>
      </div>
      <div class="plan-block-content">${relText(plan.presentation_projet)}</div>
    </div>`;
  }

  // ─ 06. Proposition de valeur ─
  if (plan.proposition_valeur) {
    html += `<div class="plan-block">
      <div class="plan-block-title">06 — Proposition de Valeur Unique
        <button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,'Mon USP est-elle assez différenciante ?')" title="Expert Eadee">💬</button>
      </div>
      <div class="plan-block-content">${relText(plan.proposition_valeur)}</div>
    </div>`;
  }

  // ─ 08. Stratégie commerciale ─
  if (plan.strategie_commerciale) {
    html += `<div class="plan-block">
      <div class="plan-block-title">08 — Stratégie Commerciale
        <button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,'Quelle stratégie commerciale prioriser en premier ?')" title="Expert Eadee">💬</button>
      </div>
      <div class="plan-block-content">${relText(plan.strategie_commerciale)}</div>
    </div>`;
  }

  // ─ 10. Aspects juridiques ─
  if (plan.aspects_juridiques) {
    html += `<div class="plan-block">
      <div class="plan-block-title">10 — Aspects Juridiques
        <button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,'Quel statut juridique me conseilles-tu pour ce projet ?')" title="Expert Eadee">💬</button>
      </div>
      <div class="plan-block-content">${relText(plan.aspects_juridiques)}</div>
    </div>`;
  }

  // ─ 11. Aspects organisationnels ─
  if (plan.aspects_organisationnels) {
    html += `<div class="plan-block">
      <div class="plan-block-title">11 — Aspects Organisationnels</div>
      <div class="plan-block-content">${relText(plan.aspects_organisationnels)}</div>
    </div>`;
  }

  // ─ 13. Trésorerie ─
  if (plan.tresorerie_detail) {
    const tresoSoldes = plan.tresorerie_soldes || [];
    const tresoChart = tresoSoldes.length > 0
      ? `<div style="margin-top:12px;height:100px"><canvas id="tresoChart"></canvas></div>`
      : '';
    html += `<div class="plan-block">
      <div class="plan-block-title">13 — Plan de Trésorerie
        <button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,'Comment optimiser ma trésorerie les 6 premiers mois ?')" title="Expert Eadee">💬</button>
      </div>
      <div class="plan-block-content">${relText(plan.tresorerie_detail)}</div>
      ${tresoChart}
    </div>`;
  }

  // ─ 15. Bilan prévisionnel ─
  if (plan.bilan_previsionnel) {
    html += `<div class="plan-block">
      <div class="plan-block-title">15 — Bilan Prévisionnel 3 Ans</div>
      <div class="plan-block-content">${relText(plan.bilan_previsionnel)}</div>
    </div>`;
  }

  // ─ 16. Seuil de rentabilité ─
  if (plan.seuil_rentabilite) {
    const sr = plan.seuil_rentabilite;
    html += `<div class="plan-block">
      <div class="plan-block-title">16 — Seuil de Rentabilité
        <button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,'Comment atteindre plus vite mon seuil de rentabilité ?')" title="Expert Eadee">💬</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="stat-mini"><div class="stat-mini-label">Charges fixes/mois</div><div class="stat-mini-val">${relText(sr.charges_fixes_mensuelles || '—')}</div></div>
        <div class="stat-mini"><div class="stat-mini-label">Taux marge/CV</div><div class="stat-mini-val">${relText(sr.taux_marge_sur_cv || '—')}</div></div>
        <div class="stat-mini"><div class="stat-mini-label">Point mort (CA/mois)</div><div class="stat-mini-val" style="color:#34d399">${relText(sr.point_mort_ca || '—')}</div></div>
        <div class="stat-mini"><div class="stat-mini-label">Break-even atteint</div><div class="stat-mini-val" style="color:#a78bfa">${relText(sr.break_even_mois || '—')}</div></div>
      </div>
      ${sr.detail ? `<div class="plan-block-content">${relText(sr.detail)}</div>` : ''}
    </div>`;
  }

  // ─ 19. Aides & Subventions ─
  if (plan.aides_subventions && plan.aides_subventions.length > 0) {
    html += `<div class="plan-block">
      <div class="plan-block-title">19 — Aides &amp; Subventions
        <button class="section-coach-btn" onclick="openChatDrawer(chatState.activePlanId,'Quelles aides puis-je obtenir pour mon projet ?')" title="Expert Eadee">💬</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${plan.aides_subventions.map(a => `
          <div class="aide-card${a.applicable === false ? ' aide-disabled' : ''}">
            <div class="aide-header">
              <div class="aide-nom">${esc(a.nom)}</div>
              <div class="aide-montant">${relText(a.montant || '')}</div>
            </div>
            <div class="aide-conditions">${esc(a.conditions || '')}</div>
            ${a.lien ? `<a href="https://${esc(a.lien)}" target="_blank" rel="noopener" class="aide-lien">→ ${esc(a.lien)}</a>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ─ 20. Annexes checklist ─
  if (plan.annexes_checklist && plan.annexes_checklist.length > 0) {
    html += `<div class="plan-block">
      <div class="plan-block-title">20 — Annexes à Préparer</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${plan.annexes_checklist.map((item, i) => `
          <div class="annexe-item">
            <div class="annexe-num">${String(i+1).padStart(2,'0')}</div>
            <div class="annexe-text">${esc(item)}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  wrap.innerHTML = html;

  // Insérer après le premier plan-block (résumé exécutif)
  if (firstBlock && firstBlock.nextSibling) {
    scrollBody.insertBefore(wrap, firstBlock.nextSibling);
  } else if (firstBlock) {
    scrollBody.appendChild(wrap);
  } else {
    scrollBody.prepend(wrap);
  }

  // Graphique trésorerie (après injection DOM)
  if (plan.tresorerie_soldes && plan.tresorerie_soldes.length > 0) {
    const mois = ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'].slice(0, plan.tresorerie_soldes.length);
    setTimeout(() => drawCrescendoChart('tresoChart', mois, plan.tresorerie_soldes), 500);
  }

  // Graphique crescendo (injecté dans la section financière existante)
  injectCrescendoSection(plan);
}

// Injecte la grille 7 jalons dans la section financière existante
function injectCrescendoSection(plan) {
  // La section financière est identifiée par dRev1 (ancien 5 colonnes)
  const rev1 = document.getElementById('dRev1');
  if (!rev1) return;
  const oldGrid = rev1.closest('.crescendo-wrap');
  if (oldGrid) oldGrid.remove();

  // Trouver le parent de la grille 5-cells
  const financesSection = rev1.closest('[style*="grid-template-columns:repeat(4"]') ||
                          rev1.parentElement;
  if (!financesSection) return;

  const jalons = [
    { key: 'rev_m1',  label: 'M1' },
    { key: 'rev_m3',  label: 'M3' },
    { key: 'rev_m6',  label: 'M6' },
    { key: 'rev_m12', label: 'An 1' },
    { key: 'rev_m18', label: '1.5 an' },
    { key: 'rev_m24', label: 'An 2' },
    { key: 'rev_m36', label: 'An 3' },
  ];

  const crescWrap = document.createElement('div');
  crescWrap.className = 'crescendo-wrap';
  crescWrap.innerHTML = `
    <div class="crescendo-grid">
      ${jalons.map((j, i) => `
        <div class="crescendo-cell${i >= 4 ? ' crescendo-cell-proj' : ''}">
          <div class="crescendo-period">${j.label}</div>
          <div class="crescendo-amount">${relText(plan[j.key] || '—')}</div>
        </div>`).join('')}
    </div>
    <div style="height:110px;margin-top:12px">
      <canvas id="crescendoChart"></canvas>
    </div>
  `;

  // Insérer avant la grille 5-cells
  financesSection.parentElement.insertBefore(crescWrap, financesSection);

  // Rendre le chart après injection DOM
  const crescLabels = ['M1','M3','M6','An 1','1.5 an','An 2','An 3'];
  const crescVals = jalons.map(j => parseAmount(plan[j.key]));
  setTimeout(() => drawCrescendoChart('crescendoChart', crescLabels, crescVals), 200);
}

// ═══════════════════════════════════════════════════════════════════
// TIMELINE 90 JOURS
// ═══════════════════════════════════════════════════════════════════

function renderTimeline90j(actions, elId) {
  const el = document.getElementById(elId || 'dActions');
  if (!el) return;

  // Grouper par période (J1-30, J31-60, J61-90)
  const p1 = actions.filter(a => /^(J[1-9]$|J[12][0-9]$|J30|Sem [12]|J1-|Semaine 1|Semaine 2)/i.test(a.phase) || (!a.phase.match(/\d{2,}/) && actions.indexOf(a) < Math.ceil(actions.length/3)));
  const p2 = actions.filter(a => /^(J[34]\d|Mois 2|J31-|Semaine [34])/i.test(a.phase));
  const p3 = actions.filter(a => /^(J[67]\d|J8\d|J9\d|Mois 3|J61-|J76-)/i.test(a.phase));

  // Fallback : diviser en 3 tiers si groupement échoue
  const third = Math.ceil(actions.length / 3);
  const gr1 = p1.length ? p1 : actions.slice(0, third);
  const gr2 = p2.length ? p2 : actions.slice(third, third*2);
  const gr3 = p3.length ? p3 : actions.slice(third*2);

  const renderGroup = (items, label, color) => `
    <div class="timeline-col">
      <div class="timeline-col-header" style="border-top-color:${color}">
        <span class="timeline-col-label" style="color:${color}">${label}</span>
      </div>
      ${items.map(a => `
        <div class="timeline-item">
          <div class="timeline-item-title">${esc(a.titre)}</div>
          <div class="timeline-item-detail">${esc(a.detail)}</div>
          ${a.phase ? `<div class="timeline-item-phase">${esc(a.phase)}</div>` : ''}
        </div>`).join('')}
    </div>`;

  el.innerHTML = `<div class="timeline-90j">
    ${renderGroup(gr1, 'Jours 1–30', '#34d399')}
    ${renderGroup(gr2, 'Jours 31–60', '#fbbf24')}
    ${renderGroup(gr3, 'Jours 61–90', '#a78bfa')}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

// Parse un montant string → nombre (ex: "1 500€" → 1500, "{{H:1 500€|...}}" → 1500)
function parseAmount(str) {
  if (!str) return 0;
  const clean = String(str).replace(/\{\{[VEH]:/g,'').replace(/\|[^}]*\}\}/g,'').replace(/[^0-9.,]/g,'').replace(',','.').replace(/\s/g,'');
  return parseFloat(clean) || 0;
}

// Retire les marqueurs pour affichage dans les champs texte
function stripReliability(str) {
  if (!str) return str;
  return String(str).replace(/\{\{[VEH]:([^|{}]+)\|[^{}]+\}\}/g, '$1').replace(/\[VERIFIE\]|\[ESTIMATION\]|\[HYPOTHESE\]/g, '');
}

function copyEmail(btn) {
  const text = decodeURIComponent(btn.dataset.text);
  navigator.clipboard.writeText(text).then(() => toast('Email copié ✓', 'success'));
}

// ═══════════════════════════════════════════════════════════════════
// GRAPHIQUE REVENU MENSUEL (Canvas natif — 12 mois)
// ═══════════════════════════════════════════════════════════════════

function drawRevenueChart(monthlyData) {
  const canvas = document.getElementById('revenueChart');
  if (!canvas || !monthlyData.length) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.offsetWidth || 500;
  const H = 160;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const max = Math.max(...monthlyData, 1);
  const pad = { l: 52, r: 16, t: 16, b: 32 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const step = cw / (monthlyData.length - 1);

  const gridSteps = 4;
  ctx.textAlign = 'right';
  ctx.font = '10px DM Mono, monospace';
  for (let i = 0; i <= gridSteps; i++) {
    const y = pad.t + ch - (i / gridSteps) * ch;
    const val = Math.round((i / gridSteps) * max);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    const label = val >= 1000 ? (val/1000).toFixed(0)+'k€' : val+'€';
    ctx.fillText(label, pad.l - 6, y + 4);
  }

  const pts = monthlyData.map((v, i) => ({
    x: pad.l + i * step,
    y: pad.t + ch - (v / max) * ch
  }));

  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, 'rgba(107,143,239,0.2)');
  grad.addColorStop(1, 'rgba(107,143,239,0)');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i-1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cpx, pts[i-1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.lineTo(pts[pts.length-1].x, H - pad.b);
  ctx.lineTo(pts[0].x, H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i-1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cpx, pts[i-1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = '#9db8f8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  [0, 2, 5, 8, 11].forEach(i => {
    if (!pts[i]) return;
    const {x, y} = pts[i];
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI*2);
    ctx.fillStyle = '#9db8f8';
    ctx.fill();
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 2;
    ctx.stroke();
    const val = monthlyData[i];
    const label = val >= 1000 ? (val/1000).toFixed(1)+'k€' : val+'€';
    ctx.fillStyle = '#9db8f8';
    ctx.font = 'bold 10px DM Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 9);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px DM Mono, monospace';
    ctx.fillText('M'+(i+1), x, H - pad.b + 18);
  });
}

// ═══════════════════════════════════════════════════════════════════
// UPDATE USAGE
// ═══════════════════════════════════════════════════════════════════

function updateUsage() {
  const maxCredits = currentPlan === 'empire' ? 8 : currentPlan === 'pro' ? 3 : 1;
  const pct = Math.min((userCredits / maxCredits) * 100, 100);
  document.getElementById('usageFill').style.width = pct + '%';
  document.getElementById('usageCount').textContent = userCredits <= 0 ? '0' : String(userCredits);

  const btn = document.getElementById('dashGenBtn');
  const banner = document.getElementById('noCredit-banner');
  if (btn) {
    if (userCredits <= 0) {
      btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed';
      if (banner) banner.style.display = 'flex';
    } else {
      btn.disabled = false; btn.style.opacity = ''; btn.style.cursor = '';
      if (banner) banner.style.display = 'none';
    }
  }
  const scBuy = document.getElementById('sc-buy-btn');
  const scRecharge = document.getElementById('sc-recharge-btn');
  if (scBuy && scRecharge) {
    if (userCredits <= 0) { scBuy.style.display = 'block'; scRecharge.style.display = 'none'; }
    else { scBuy.style.display = 'none'; scRecharge.style.display = 'block'; }
  }
}
