// ── Plan actions : Documents annexes, Bancabilité, Indicateurs fiabilité ──

// ─────────────────────────────────────────────────────────
// Livrable 5 : Documents annexes — téléchargement
// ─────────────────────────────────────────────────────────

const DOCS_CONFIG = [
  {
    id: 'courrier_banque',
    label: 'Courrier banque',
    format: 'DOCX',
    icon: `<svg class="doc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>`,
  },
  {
    id: 'courrier_bpi',
    label: 'Demande BPI France',
    format: 'DOCX',
    icon: `<svg class="doc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>`,
  },
  {
    id: 'lettre_intention',
    label: 'Lettre d\'intention',
    format: 'DOCX',
    icon: `<svg class="doc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`,
  },
  {
    id: 'plan_tresorerie',
    label: 'Trésorerie',
    format: 'XLS',
    icon: `<svg class="doc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
    </svg>`,
  },
  {
    id: 'tresorerie_pdf',
    label: 'Trésorerie',
    format: 'PDF',
    icon: `<svg class="doc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>`,
  },
  {
    id: 'compte_resultat_3ans',
    label: 'Compte de résultat',
    format: 'XLS',
    icon: `<svg class="doc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
    </svg>`,
  },
  {
    id: 'compte_resultat_pdf',
    label: 'Compte de résultat',
    format: 'PDF',
    icon: `<svg class="doc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>`,
  },
  {
    id: 'fiche_synthese',
    label: 'Fiche synthèse',
    format: 'PDF',
    icon: `<svg class="doc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <path d="M9 13h6M9 17h6M9 9h1"/>
    </svg>`,
  },
];

function fillDocumentsAnnexes(plan) {
  const container = document.getElementById('dDocsGrid');
  if (!container) return;
  container.innerHTML = DOCS_CONFIG.map(doc => `
    <button class="doc-btn" id="docBtn-${doc.id}" onclick="downloadDoc('${doc.id}', this)">
      ${doc.icon}
      <div class="doc-label">${doc.label}</div>
      <div class="doc-format">${doc.format}</div>
    </button>
  `).join('');
}

async function downloadDoc(type, btn) {
  if (!currentResult) { toast('Génère d\'abord un plan', 'error'); return; }
  if (btn) btn.classList.add('loading');
  try {
    let _docAuthHdr = {};
    try {
      const _sb = window._eadeeSb || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      if (_sb) {
        const { data: { session } } = await _sb.auth.getSession();
        if (session?.access_token) _docAuthHdr = { 'Authorization': 'Bearer ' + session.access_token };
      }
    } catch(_) {}
    const res = await fetch('/api/generate-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ..._docAuthHdr },
      body: JSON.stringify({ type, plan: currentResult }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `eadee-${type}.pdf`;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    // PDF HTML → ouvrir dans un nouvel onglet pour impression navigateur
    if (type.endsWith('_pdf') || type === 'fiche_synthese') {
      window.open(url, '_blank');
      // Libérer le blob après que le navigateur a eu le temps de charger la page
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast('Document ouvert — utilisez Ctrl+P pour exporter en PDF', 'success');
    } else {
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Document téléchargé', 'success');
    }
  } catch (e) {
    console.error('downloadDoc error', e);
    toast('Erreur téléchargement : ' + e.message, 'error');
  } finally {
    if (btn) btn.classList.remove('loading');
  }
}

// ─────────────────────────────────────────────────────────
// Livrable 6 : Checklist bancabilité
// ─────────────────────────────────────────────────────────

const BANC_ITEMS = [
  { id: 'bp_complet',      label: 'Business plan complet rédigé' },
  { id: 'cr_previsionnel', label: 'Compte de résultat prévisionnel 3 ans' },
  { id: 'tresorerie',      label: 'Plan de trésorerie 12 mois' },
  { id: 'cv_porteur',      label: 'CV du porteur de projet' },
  { id: 'apport_justif',   label: 'Justificatifs d\'apport personnel' },
  { id: 'statut_choisi',   label: 'Statut juridique choisi' },
  { id: 'devis_invest',    label: 'Devis des investissements principaux' },
  { id: 'lettre_client',   label: 'Au moins 1 lettre d\'intention client' },
  { id: 'acre_dossier',    label: 'Dossier ACRE/ARCE constitué' },
  { id: 'courrier_banque', label: 'Courrier de présentation banque rédigé' },
  { id: 'bpi_contact',     label: 'Contact BPI France pris' },
];

function getBancKey(planId) {
  return `eadee_banc_${planId || 'current'}`;
}

function loadBancState(planId) {
  try {
    return JSON.parse(localStorage.getItem(getBancKey(planId)) || '{}');
  } catch { return {}; }
}

function saveBancState(planId, state) {
  try {
    localStorage.setItem(getBancKey(planId), JSON.stringify(state));
  } catch {}
}

function fillBancabilite(plan) {
  const container = document.getElementById('dBancItems');
  const fillEl = document.getElementById('dBancFill');
  const pctEl = document.getElementById('dBancPct');
  const labelEl = document.getElementById('dBancLabel');
  if (!container) return;

  const planId = plan?.id || plan?.nom_business || 'current';
  const state = loadBancState(planId);

  function render() {
    const checked = BANC_ITEMS.filter(i => state[i.id]).length;
    const pct = Math.round((checked / BANC_ITEMS.length) * 100);
    if (fillEl) fillEl.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (fillEl) {
      fillEl.style.background = pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : 'var(--acid)';
    }
    if (labelEl) {
      labelEl.textContent = pct >= 80
        ? 'Dossier solide'
        : pct >= 50
        ? 'En bonne voie'
        : 'À compléter';
    }

    container.innerHTML = BANC_ITEMS.map(item => {
      const isChecked = !!state[item.id];
      return `
        <div class="banc-item${isChecked ? ' checked' : ''}" data-id="${item.id}" onclick="toggleBanc(this, '${planId}')">
          <div class="banc-checkbox">
            ${isChecked ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1c1915" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </div>
          <div class="banc-item-text">${item.label}</div>
        </div>`;
    }).join('');
  }

  render();
  // Expose render for toggleBanc
  window._bancRender = render;
  window._bancPlanId = planId;
}

function toggleBanc(el, planId) {
  const id = el.dataset.id;
  const state = loadBancState(planId);
  state[id] = !state[id];
  saveBancState(planId, state);
  if (window._bancRender) window._bancRender();
}

// ─────────────────────────────────────────────────────────
// Livrable 7 : Indicateurs de fiabilité IA
// Replace [VERIFIE], [ESTIMATION], [HYPOTHESE] with SVG dots
// ─────────────────────────────────────────────────────────

const REL_MARKERS = {
  '[VERIFIE]':    { cls: 'verifie',    tip: 'Donnée vérifiée (source officielle)' },
  '[ESTIMATION]': { cls: 'estimation', tip: 'Estimation (ordre de grandeur probable)' },
  '[HYPOTHESE]':  { cls: 'hypothese',  tip: 'Hypothèse (à valider)' },
};

function applyReliabilityIndicators(rootEl) {
  if (!rootEl) return;
  // Walk all text nodes and replace markers
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  const pattern = /\[(VERIFIE|ESTIMATION|HYPOTHESE)\]/g;

  nodes.forEach(node => {
    if (!pattern.test(node.textContent)) return;
    pattern.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = pattern.exec(node.textContent)) !== null) {
      if (m.index > last) {
        frag.appendChild(document.createTextNode(node.textContent.slice(last, m.index)));
      }
      const key = `[${m[1]}]`;
      const cfg = REL_MARKERS[key];
      const dot = document.createElement('span');
      dot.className = `rel-dot ${cfg.cls}`;
      dot.setAttribute('data-tooltip', cfg.tip);
      dot.setAttribute('aria-label', cfg.tip);
      frag.appendChild(dot);
      last = m.index + m[0].length;
    }
    if (last < node.textContent.length) {
      frag.appendChild(document.createTextNode(node.textContent.slice(last)));
    }
    node.parentNode.replaceChild(frag, node);
  });
}
