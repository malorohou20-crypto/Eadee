// ========== PREVIEW STATES ==========

// 20 sections avec catégorie pour le color-coding
const GEN_SECTIONS = [
  { num: '01', label: 'Résumé Exécutif',          cat: 'strategie' },
  { num: '02', label: 'Porteur de Projet',         cat: 'juridique' },
  { num: '03', label: 'Présentation du Projet',    cat: 'strategie' },
  { num: '04', label: 'Étude de Marché',           cat: 'marche'    },
  { num: '05', label: 'Analyse Concurrentielle',   cat: 'marche'    },
  { num: '06', label: 'Proposition de Valeur',     cat: 'strategie' },
  { num: '07', label: 'Modèle Économique',         cat: 'strategie' },
  { num: '08', label: 'Stratégie Commerciale',     cat: 'strategie' },
  { num: '09', label: 'Plan d\'Acquisition',       cat: 'action'    },
  { num: '10', label: 'Aspects Juridiques',        cat: 'juridique' },
  { num: '11', label: 'Aspects Organisationnels',  cat: 'juridique' },
  { num: '12', label: 'Projections Financières',   cat: 'finance'   },
  { num: '13', label: 'Plan de Trésorerie',        cat: 'finance'   },
  { num: '14', label: 'Plan d\'Investissement',    cat: 'finance'   },
  { num: '15', label: 'Bilan Prévisionnel',        cat: 'finance'   },
  { num: '16', label: 'Seuil de Rentabilité',      cat: 'finance'   },
  { num: '17', label: 'Risques & Mitigation',      cat: 'action'    },
  { num: '18', label: 'Plan d\'Action 90 Jours',   cat: 'action'    },
  { num: '19', label: 'Aides & Subventions',       cat: 'juridique' },
  { num: '20', label: 'Annexes & Checklist',       cat: 'action'    },
];

// Messages IA qui changent pendant la génération
const AI_THOUGHTS = [
  'Analyse de ton idée en profondeur…',
  'Recherche du marché et des concurrents…',
  'Identification des données INSEE…',
  'Modélisation financière mois par mois…',
  'Calcul du score de viabilité…',
  'Rédaction des sections stratégiques…',
  'Construction du plan d\'action 90 jours…',
  'Vérification des aides disponibles…',
  'Finalisation du business plan complet…',
  'Dernières vérifications en cours…',
];

let _genSectionTimer = null;
let _genThoughtTimer = null;

function setPreviewState(state) {
  ['A','B','C'].forEach(s => {
    const el = document.getElementById('preview-state-' + s);
    if (el) el.style.display = 'none';
  });
  if (state === 'A' || state === 'B' || state === 'C') {
    const el = document.getElementById('preview-state-' + state);
    if (el) el.style.display = 'flex';
  }
  if (state === 'C') startGenSectionsAnim();
  if (state === 'A') { setTimeout(startLiveFeed, 100); }
  else { stopLiveFeed(); }
}

function startGenSectionsAnim() {
  const list    = document.getElementById('gen-sections-list');
  const bar     = document.getElementById('gen-progress-bar');
  const statusEl = document.getElementById('genStatusText');
  if (!list) return;

  // Override overflow pour afficher les 20 sections
  list.style.overflow  = 'visible';
  list.style.display   = 'grid';
  list.style.gridTemplateColumns = '1fr 1fr';
  list.style.gap       = '4px 12px';
  list.style.alignContent = 'start';

  // Render toutes les 20 sections immédiatement (état pending)
  list.innerHTML = GEN_SECTIONS.map((s, i) => `
    <div class="gen-section-row" id="gsrow-${i}" data-cat="${s.cat}">
      <span class="gsrow-icon" id="gsicon-${i}">·</span>
      <span class="gsrow-num">${s.num}</span>
      <span class="gsrow-label">${s.label}</span>
    </div>`).join('');

  let idx     = 0;
  let elapsed = 0;
  if (_genSectionTimer)  clearInterval(_genSectionTimer);
  if (_genThoughtTimer)  clearInterval(_genThoughtTimer);

  // Timer sections : 2.5s par section → 50s pour 20 sections
  _genSectionTimer = setInterval(() => {
    elapsed += 2.5;
    if (statusEl) statusEl.textContent = `Génération en cours… ${Math.round(elapsed)}s`;

    // Marquer la précédente comme done
    if (idx > 0) {
      const prev     = document.getElementById('gsrow-'  + (idx - 1));
      const prevIcon = document.getElementById('gsicon-' + (idx - 1));
      if (prev)     { prev.classList.remove('active'); prev.classList.add('done'); }
      if (prevIcon) prevIcon.textContent = '✓';
    }

    // Activer la courante
    if (idx < GEN_SECTIONS.length) {
      const row  = document.getElementById('gsrow-'  + idx);
      const icon = document.getElementById('gsicon-' + idx);
      if (row)  row.classList.add('active');
      if (icon) icon.textContent = '⟳';
      if (bar)  bar.style.width = Math.min(((idx + 1) / GEN_SECTIONS.length * 100), 95) + '%';

      // Scroll la section active dans le champ de vision
      if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    idx++;
    if (idx > GEN_SECTIONS.length) clearInterval(_genSectionTimer);
  }, 2500);

  // Afficher la première pensée IA
  if (statusEl) statusEl.textContent = AI_THOUGHTS[0];
}

function stopGenSectionsAnim() {
  if (_genSectionTimer) clearInterval(_genSectionTimer);
  if (_genThoughtTimer) clearInterval(_genThoughtTimer);

  // Tout cocher en vert
  GEN_SECTIONS.forEach((_, i) => {
    const row  = document.getElementById('gsrow-'  + i);
    const icon = document.getElementById('gsicon-' + i);
    if (row)  { row.classList.remove('active'); row.classList.add('done'); }
    if (icon) icon.textContent = '✓';
  });

  const bar = document.getElementById('gen-progress-bar');
  if (bar) bar.style.width = '100%';
}
