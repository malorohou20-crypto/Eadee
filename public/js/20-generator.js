// ========== GENERATE PLAN — V3 — 20 sections, crescendo 7 jalons, fiabilité ==========
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
    // ── Appel au pipeline 3 étapes (INSEE + web + génération) ──────
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, sector, budget, profile, time, credits: userCredits })
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
      supabaseClient.from('profiles').update({ credits: userCredits }).eq('id', (await supabaseClient.auth.getUser()).data.user?.id).then(() => {});
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
    document.getElementById('dashEmptyState').style.display = 'none';
    const errStateEl = document.getElementById('dashEmptyState');
    errStateEl.innerHTML = `
      <div style="font-size:11px;font-family:'DM Mono',monospace;letter-spacing:0.15em;color:rgba(255,255,255,0.25);margin-bottom:12px">ERREUR</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.5);max-width:260px;line-height:1.6;text-align:center">
        <strong style="color:rgba(255,255,255,0.7)">Erreur :</strong><br><span id="dashErrMsg"></span>
      </div>
      <button onclick="resetGenerator()" style="margin-top:16px;padding:8px 20px;background:var(--acid);color:var(--ink);border:none;border-radius:4px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:0.1em;cursor:pointer;">Réessayer</button>
    `;
    document.getElementById('dashErrMsg').textContent = err.message || 'Problème de connexion. Réessaie.';
    toast('Erreur — voir le détail dans le panneau', 'error');
  }

  document.getElementById('dashGenBtn').disabled = false;
}

function resetGenerator() {
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
// FILL PLAN — Rendu complet 20 sections
// ═══════════════════════════════════════════════════════════════════

function fillPlan(plan) {
  // ── Header ────────────────────────────────────────────────────────
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

  const score = plan.score_viabilite || 72;
  document.getElementById('dScore').textContent = score + '/100';
  setTimeout(() => {
    const bar = document.getElementById('dScoreBar');
    if (bar) { bar.style.width = score + '%'; bar.style.background = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#ef4444'; }
  }, 300);

  // ── Compteur + Score fiabilité (top du plan) ────────────────────
  const scrollBody = document.getElementById('planScrollBody');
  if (scrollBody) {
    // Injecter avant le premier plan-block
    const firstBlock = scrollBody.querySelector('.plan-block');
    const metaHtml = `
      ${renderCompletenessCounter(plan)}
      ${renderReliabilityScoreCard(plan)}
    `;
    const metaDiv = document.createElement('div');
    metaDiv.id = 'plan-meta-top';
    metaDiv.innerHTML = metaHtml;
    const existing = document.getElementById('plan-meta-top');
    if (existing) existing.remove();
    if (firstBlock) scrollBody.insertBefore(metaDiv, firstBlock);
    else scrollBody.prepend(metaDiv);
  }

  // ── 01. Résumé exécutif ──────────────────────────────────────────
  const dResume = document.getElementById('dResume');
  if (dResume) dResume.innerHTML = relText(plan.resume_executif || '');

  // ── Sections nouvelles (02-03 + extras) injectées dynamiquement ─
  injectExtraSections(plan);

  // ── 02/04. Marché ────────────────────────────────────────────────
  const setInner = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

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

  // ── Indicateurs fiabilité (anciens marqueurs) sur tout le scrollBody ─
  if (scrollBody) applyReliabilityIndicators(scrollBody);
}

// ═══════════════════════════════════════════════════════════════════
// INJECTION SECTIONS SUPPLÉMENTAIRES (02, 03, 06, 08, 10, 11, 13, 15, 16, 19, 20)
// ═══════════════════════════════════════════════════════════════════

function injectExtraSections(plan) {
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

function renderTimeline90j(actions) {
  const el = document.getElementById('dActions');
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
