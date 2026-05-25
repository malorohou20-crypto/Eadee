// ========== DOSSIER DE CRÉATION ==========
function closeDossier() {
  document.getElementById('dossierModal').style.display = 'none';
}

function switchDossierTab(idx) {
  document.querySelectorAll('.dossier-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('.dossier-section').forEach((s, i) => s.classList.toggle('active', i === idx));
}

async function generateDossier() {
  if (!currentResult) { toast('Génère un plan d\'abord', 'error'); return; }
  const modal = document.getElementById('dossierModal');
  const loading = document.getElementById('dossierLoading');
  const body = document.getElementById('dossierBody');
  const tabs = document.getElementById('dossierTabs');
  const titleEl = document.getElementById('dossierTitle');
  const subEl = document.getElementById('dossierSub');

  modal.style.display = 'flex';
  loading.style.display = 'flex';
  tabs.innerHTML = '';
  body.innerHTML = '';
  body.appendChild(loading);
  loading.style.display = 'flex';

  const r = currentResult;
  titleEl.textContent = `DOSSIER — ${r.nom_business || 'MON ENTREPRISE'}`;
  subEl.textContent = 'Documents pré-remplis pour créer ton entreprise';

  // Charger depuis le plan si déjà généré (dossier sauvegardé dans l'objet plan)
  if (r.dossier) {
    loading.style.display = 'none';
    renderDossier(r.dossier, r);
    return;
  }

  const loadingTexts = [
    'Analyse du projet en cours...',
    'Détermination de la forme juridique...',
    'Rédaction des statuts...',
    'Préparation des démarches URSSAF...',
    'Constitution du dossier bancaire...',
    'Finalisation du dossier complet...'
  ];
  let ltIdx = 0;
  const ltInterval = setInterval(() => {
    if (ltIdx < loadingTexts.length - 1)
      document.getElementById('dossierLoadingText').textContent = loadingTexts[++ltIdx];
  }, 1800);

  const prompt = `Tu es un expert juridique et administratif français spécialisé dans la création d'entreprises. Génère un dossier de création d'entreprise complet et personnalisé pour ce projet.

PROJET:
- Nom: ${r.nom_business}
- Idée: ${r.idea || r.tagline}
- Secteur: ${document.getElementById('dashSector')?.value || r.secteur || 'Non défini'}
- Budget: ${document.getElementById('dashBudget')?.value || r.budget || 'Non défini'}
- Modèle économique: ${r.modele_economique || ''}
- Offres: ${(r.offres || []).map(o => o.nom + ' — ' + o.prix).join(', ')}
- Chiffre d'affaires estimé M12: ${r.rev_m12 || ''}
- Investissements: ${(r.investissements || []).filter(i => !i.total).map(i => i.label + ': ' + i.montant).join(', ')}
- Résumé: ${r.resume_executif || ''}

INSTRUCTIONS:
1. Détermine si l'activité est physique (local, boutique, restaurant...), numérique (SaaS, e-commerce, service en ligne...) ou hybride
2. Recommande la forme juridique la plus adaptée (auto-entrepreneur, SASU, EURL, SAS, SARL, SNC, EI...)
3. Adapte TOUS les documents au projet spécifique
4. Les statuts doivent être pré-remplis avec le nom de l'entreprise, l'objet social précis, etc.
5. Sois précis sur les coûts, délais et organismes à contacter

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de backticks):

{
  "type_activite": "physique|numerique|hybride",
  "forme_juridique": {
    "recommandation": "SASU",
    "pourquoi": "Explication de 3-4 phrases adaptée au projet",
    "avantages": ["avantage 1", "avantage 2", "avantage 3"],
    "alternatives": [{"forme": "EURL", "cas": "Si budget limité et entrepreneur seul"}]
  },
  "checklist_creation": [
    {
      "etape": "1",
      "titre": "Titre de l'étape",
      "detail": "Description détaillée de ce qu'il faut faire",
      "duree": "1-3 jours",
      "cout": "Gratuit / X€",
      "organisme": "INSEE / INPI / CCI..."
    }
  ],
  "statuts": {
    "preambule": "Texte d'introduction des statuts",
    "articles": [
      {
        "numero": "1",
        "titre": "Forme sociale",
        "contenu": "Texte juridique pré-rempli de l'article"
      }
    ]
  },
  "urssaf": {
    "intro": "Contexte URSSAF pour ce type d'activité",
    "regime": "Micro-entreprise / Régime général / TNS...",
    "documents_requis": ["Document 1", "Document 2"],
    "etapes": ["Étape 1 avec détail", "Étape 2 avec détail"],
    "cotisations_estimees": "Explication des taux et montants estimés pour ce projet",
    "premiere_declaration": "Quand et comment faire la première déclaration"
  },
  "banque": {
    "intro": "Contexte ouverture compte pro pour ce projet",
    "documents_requis": ["Document 1", "Document 2"],
    "conseils": "Conseils spécifiques pour ce type de projet",
    "banques_recommandees": [
      {"nom": "Qonto", "offre": "Compte pro en ligne", "prix": "9€/mois", "pourquoi": "Idéal pour..."},
      {"nom": "Shine", "offre": "Compte pro + comptabilité", "prix": "8€/mois", "pourquoi": "Idéal pour..."},
      {"nom": "BNP Paribas", "offre": "Compte pro classique", "prix": "30€/mois", "pourquoi": "Idéal pour..."}
    ]
  },
  "local": {
    "applicable": true,
    "type_recommande": "Type de local recommandé",
    "alternatives": ["Alternative 1", "Alternative 2"],
    "points_attention": ["Point 1", "Point 2", "Point 3"],
    "documents_bail": ["Document 1", "Document 2"],
    "aides_disponibles": ["Aide 1 avec organisme"]
  },
  "investissements_admin": [
    {"poste": "Immatriculation INPI", "montant": "21,41€", "obligatoire": true},
    {"poste": "Rédaction statuts notaire", "montant": "0-500€", "obligatoire": false}
  ]
}`;

  try {
    // Récupérer le token Supabase pour l'auth du proxy
    let authHeader = {};
    const sb = window._eadeeSb || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb) {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.access_token) authHeader = { 'Authorization': 'Bearer ' + session.access_token };
      } catch(_) {}
    }

    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    clearInterval(ltInterval);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Erreur API');

    let raw = data.content[0].text.trim();
    if (raw.startsWith('```')) raw = raw.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
    const d = JSON.parse(raw);

    // Sauvegarder le dossier dans le plan (currentResult + plansHistory + localStorage)
    currentResult.dossier = d;
    const histIdx = plansHistory.findIndex(p => p === r || (p.id && p.id === r.id));
    if (histIdx !== -1) plansHistory[histIdx].dossier = d;
    try { localStorage.setItem('eadee_history', JSON.stringify(plansHistory)); } catch(_) {}

    renderDossier(d, r);

  } catch(e) {
    clearInterval(ltInterval);
    loading.style.display = 'none';
    body.innerHTML = `<div style="color:#ff6b6b;padding:40px;text-align:center;">
      <div style="font-size:11px;font-family:'DM Mono',monospace;letter-spacing:0.15em;color:rgba(255,255,255,0.3);margin-bottom:16px;">ERREUR</div>
      <div style="font-size:16px;font-weight:600;margin-bottom:8px;">Erreur lors de la génération</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);">${e.message}</div>
    </div>`;
  }
}

function renderDossier(d, r) {
  const loading = document.getElementById('dossierLoading');
  const body = document.getElementById('dossierBody');
  const tabs = document.getElementById('dossierTabs');

  loading.style.display = 'none';

  const tabDefs = [
    { label: 'Checklist', id: 'tab-checklist' },
    { label: 'Forme juridique', id: 'tab-juridique' },
    { label: 'Statuts', id: 'tab-statuts' },
    { label: 'URSSAF', id: 'tab-urssaf' },
    { label: 'Banque', id: 'tab-banque' },
    ...(d.local?.applicable ? [{ label: 'Local', id: 'tab-local' }] : []),
    { label: 'Coûts admin', id: 'tab-couts' }
  ];

  tabs.innerHTML = tabDefs.map((t, i) =>
    `<button class="dossier-tab${i === 0 ? ' active' : ''}" onclick="switchDossierTab(${i})">${t.label}</button>`
  ).join('');

  const badgeClass = d.type_activite === 'physique' ? 'physique' : d.type_activite === 'hybride' ? 'hybride' : 'numerique';
  const badgeLabel = d.type_activite === 'physique' ? '🏪 Activité physique' : d.type_activite === 'hybride' ? '🔀 Activité hybride' : '💻 Activité numérique';

  const sections = [];

  // CHECKLIST
  const checkItems = (d.checklist_creation || []).map((s, i) => `
    <li>
      <div class="step-num">${s.etape || i+1}</div>
      <div class="step-body">
        <div class="step-title">${s.titre}</div>
        <div>${s.detail}</div>
        <div class="step-meta">
          ${s.duree ? `<span>⏱ ${s.duree}</span>` : ''}
          ${s.cout ? `<span>💶 ${s.cout}</span>` : ''}
          ${s.organisme ? `<span>${s.organisme}</span>` : ''}
        </div>
      </div>
    </li>`).join('');
  sections.push(`
    <div class="dossier-section active">
      <div class="dossier-card">
        <span class="dossier-badge ${badgeClass}">${badgeLabel}</span>
        <div class="dossier-card-title">Checklist complète de création — ${r.nom_business}</div>
        <ul class="dossier-checklist">${checkItems}</ul>
      </div>
    </div>`);

  // FORME JURIDIQUE
  const fj = d.forme_juridique || {};
  const alts = (fj.alternatives || []).map(a => `
    <li><strong>${a.forme}</strong> — ${a.cas}</li>`).join('');
  const avs = (fj.avantages || []).map(a => `<li>${a}</li>`).join('');
  sections.push(`
    <div class="dossier-section">
      <div class="dossier-card">
        <div class="dossier-card-title">⚖️ Forme juridique recommandée : ${fj.recommandation}</div>
        <p>${fj.pourquoi}</p>
        ${avs ? `<div style="margin:12px 0 0"><strong style="color:#9db8f8;font-size:13px;">Avantages :</strong><ul class="dossier-doclist" style="margin-top:8px">${avs}</ul></div>` : ''}
        ${alts ? `<div style="margin:18px 0 0"><strong style="color:rgba(255,255,255,0.7);font-size:13px;">Alternatives à considérer :</strong><ul class="dossier-doclist" style="margin-top:8px">${alts}</ul></div>` : ''}
      </div>
    </div>`);

  // STATUTS
  const statuts = d.statuts || {};
  const articles = (statuts.articles || []).map(a => `
    <div class="dossier-article">
      <div class="dossier-article-num">Article ${a.numero}</div>
      <div class="dossier-article-title">${a.titre}</div>
      <div class="dossier-article-body">${a.contenu}</div>
    </div>`).join('');
  sections.push(`
    <div class="dossier-section">
      <div class="dossier-card">
        <div class="dossier-card-title">📄 Statuts — ${r.nom_business}</div>
        ${statuts.preambule ? `<p style="font-style:italic;color:rgba(255,255,255,0.5);margin-bottom:20px;">${statuts.preambule}</p>` : ''}
        ${articles}
        <p style="margin-top:20px;font-size:12px;color:rgba(255,255,255,0.3);">Ces statuts sont un modèle pré-rempli. Fais-les relire par un avocat ou un expert-comptable avant dépôt.</p>
      </div>
    </div>`);

  // URSSAF
  const ursf = d.urssaf || {};
  const ursafDocs = (ursf.documents_requis || []).map(d => `<li>${d}</li>`).join('');
  const ursafEtapes = (ursf.etapes || []).map((e, i) => `
    <li>
      <div class="step-num">${i+1}</div>
      <div class="step-body"><div>${e}</div></div>
    </li>`).join('');
  sections.push(`
    <div class="dossier-section">
      <div class="dossier-card">
        <div class="dossier-card-title">Inscription URSSAF & Sécurité Sociale</div>
        <p>${ursf.intro}</p>
        ${ursf.regime ? `<p><strong style="color:#9db8f8">Régime :</strong> ${ursf.regime}</p>` : ''}
      </div>
      ${ursafDocs ? `<div class="dossier-card">
        <div class="dossier-card-title">Documents requis</div>
        <ul class="dossier-doclist">${ursafDocs}</ul>
      </div>` : ''}
      ${ursafEtapes ? `<div class="dossier-card">
        <div class="dossier-card-title">Étapes d'inscription</div>
        <ul class="dossier-checklist">${ursafEtapes}</ul>
      </div>` : ''}
      ${ursf.cotisations_estimees ? `<div class="dossier-card">
        <div class="dossier-card-title">Cotisations estimées</div>
        <p>${ursf.cotisations_estimees}</p>
      </div>` : ''}
      ${ursf.premiere_declaration ? `<div class="dossier-card">
        <div class="dossier-card-title">Première déclaration</div>
        <p>${ursf.premiere_declaration}</p>
      </div>` : ''}
    </div>`);

  // BANQUE
  const bk = d.banque || {};
  const bkDocs = (bk.documents_requis || []).map(d => `<li>${d}</li>`).join('');
  const bkCards = (bk.banques_recommandees || []).map(b => `
    <div class="dossier-bank-card">
      <div class="dossier-bank-name">${b.nom}</div>
      <div class="dossier-bank-offer">${b.offre}</div>
      <div class="dossier-bank-price">${b.prix}</div>
      ${b.pourquoi ? `<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">${b.pourquoi}</div>` : ''}
    </div>`).join('');
  sections.push(`
    <div class="dossier-section">
      <div class="dossier-card">
        <div class="dossier-card-title">🏦 Ouverture compte professionnel</div>
        <p>${bk.intro}</p>
        ${bk.conseils ? `<p>${bk.conseils}</p>` : ''}
      </div>
      ${bkDocs ? `<div class="dossier-card">
        <div class="dossier-card-title">Documents requis pour la banque</div>
        <ul class="dossier-doclist">${bkDocs}</ul>
      </div>` : ''}
      ${bkCards ? `<div class="dossier-card">
        <div class="dossier-card-title">Banques recommandées</div>
        <div class="dossier-grid2">${bkCards}</div>
      </div>` : ''}
    </div>`);

  // LOCAL (conditionnel)
  if (d.local?.applicable) {
    const loc = d.local;
    const pts = (loc.points_attention || []).map(p => `<li>${p}</li>`).join('');
    const docsBail = (loc.documents_bail || []).map(d => `<li>${d}</li>`).join('');
    const altsLoc = (loc.alternatives || []).map(a => `<li>${a}</li>`).join('');
    const aides = (loc.aides_disponibles || []).map(a => `<li>${a}</li>`).join('');
    sections.push(`
      <div class="dossier-section">
        <div class="dossier-card">
          <div class="dossier-card-title">📍 Recherche & prise de local</div>
          ${loc.type_recommande ? `<p><strong style="color:#9db8f8">Type recommandé :</strong> ${loc.type_recommande}</p>` : ''}
          ${altsLoc ? `<div style="margin-top:12px"><strong style="color:rgba(255,255,255,0.7);font-size:13px;">Alternatives :</strong><ul class="dossier-doclist" style="margin-top:8px">${altsLoc}</ul></div>` : ''}
        </div>
        ${pts ? `<div class="dossier-card">
          <div class="dossier-card-title">Points d'attention</div>
          <ul class="dossier-doclist">${pts}</ul>
        </div>` : ''}
        ${docsBail ? `<div class="dossier-card">
          <div class="dossier-card-title">Documents pour le bail</div>
          <ul class="dossier-doclist">${docsBail}</ul>
        </div>` : ''}
        ${aides ? `<div class="dossier-card">
          <div class="dossier-card-title">Aides disponibles</div>
          <ul class="dossier-doclist">${aides}</ul>
        </div>` : ''}
      </div>`);
  }

  // COÛTS ADMIN
  const invAdmin = (d.investissements_admin || []);
  const totalOblig = invAdmin.filter(i => i.obligatoire).map(i => i.montant).join(' + ');
  const invRows = invAdmin.map(i => `
    <li style="${i.obligatoire ? '' : 'opacity:0.6'}">
      <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${i.obligatoire ? '#9db8f8' : 'rgba(255,255,255,0.15)'};margin-right:8px;vertical-align:middle"></span>${i.poste}</span>
      <span style="font-weight:600;color:${i.obligatoire ? '#9db8f8' : 'rgba(255,255,255,0.5)'}">${i.montant}</span>
    </li>`).join('');
  sections.push(`
    <div class="dossier-section">
      <div class="dossier-card">
        <div class="dossier-card-title">Coûts administratifs de création</div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
          ${invRows}
        </ul>
        ${totalOblig ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:rgba(255,255,255,0.35);font-family:'DM Mono',monospace;display:flex;gap:16px;align-items:center"><span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#9db8f8;margin-right:6px;vertical-align:middle"></span>obligatoire</span><span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.15);margin-right:6px;vertical-align:middle"></span>optionnel</span></div>` : ''}
      </div>
    </div>`);

  body.innerHTML = sections.join('');
}

