// ========== HISTORY ==========

// ---- Filter state ----
var _plansFilter = { tab: 'all', query: '' };

function _getFilteredPlans() {
  var all = plansHistory || [];
  var tab   = _plansFilter.tab;
  var query = _plansFilter.query;

  var filtered;
  if (tab === 'draft') {
    filtered = all.filter(function(p) { return !p.score_viabilite && !p.score && !p.archived; });
  } else if (tab === 'final') {
    filtered = all.filter(function(p) { return !!(p.score_viabilite || p.score) && !p.archived; });
  } else if (tab === 'archived') {
    filtered = all.filter(function(p) { return !!p.archived; });
  } else {
    filtered = all.slice();
  }

  if (query) {
    filtered = filtered.filter(function(p) {
      var name   = (p.nom_business || p.nom_entreprise || '').toLowerCase();
      var idea   = (p.idea || p.resume_executif || '').toLowerCase();
      var sector = (p.secteur || '').toLowerCase();
      return name.indexOf(query) !== -1 || idea.indexOf(query) !== -1 || sector.indexOf(query) !== -1;
    });
  }

  return filtered;
}

function _updatePlansCounts() {
  var all       = plansHistory || [];
  var drafts    = all.filter(function(p) { return !p.score_viabilite && !p.score && !p.archived; });
  var finalized = all.filter(function(p) { return !!(p.score_viabilite || p.score) && !p.archived; });
  var archived  = all.filter(function(p) { return !!p.archived; });

  var countMap = {
    filterTabAll:      all.length,
    filterTabDraft:    drafts.length,
    filterTabFinal:    finalized.length,
    filterTabArchived: archived.length,
  };
  Object.keys(countMap).forEach(function(id) {
    var btn = document.getElementById(id);
    if (!btn) return;
    var ct = btn.querySelector('.ct');
    if (ct) ct.textContent = String(countMap[id]).padStart(2, '0');
  });

  var eyebrow = document.getElementById('plansEyebrow');
  if (eyebrow) eyebrow.textContent = 'Dossiers générés · ' + all.length;
}

function filterPlans(tab) {
  _plansFilter.tab = tab;
  var tabIds = { all: 'filterTabAll', draft: 'filterTabDraft', final: 'filterTabFinal', archived: 'filterTabArchived' };
  Object.values(tabIds).forEach(function(id) { var b = document.getElementById(id); if (b) b.classList.remove('on'); });
  var active = document.getElementById(tabIds[tab]);
  if (active) active.classList.add('on');
  renderHistory();
}

function searchPlans(query) {
  _plansFilter.query = (query || '').toLowerCase().trim();
  renderHistory();
}

// ---- Main render ----
function renderHistory() {
  var grid = document.getElementById('historyGrid');
  if (!grid) return;

  _updatePlansCounts();

  var isV2  = window.__EADEE_V2 || grid.classList.contains('plans-table');
  var plans = _getFilteredPlans();

  if (isV2) {
    // --- V2 table layout ---
    var thead = grid.querySelector('.plans-thead');
    grid.innerHTML = '';
    if (thead) grid.appendChild(thead);

    var footCount = document.getElementById('plansFooterCount');
    var footNum   = document.getElementById('plansFooterNum');

    if (plans.length === 0) {
      var emptyRow = document.createElement('div');
      emptyRow.style.cssText = 'grid-column:1/-1;text-align:center;padding:60px 20px';
      if (!plansHistory || plansHistory.length === 0) {
        emptyRow.innerHTML =
          '<div style="font-size:14px;color:var(--ink-2);margin-bottom:20px">Tu n\'as pas encore généré de plan.</div>' +
          '<button onclick="window.go&&window.go(\'gen\')" style="padding:10px 24px;background:var(--accent,#c84b2f);color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">Commencer mon premier plan</button>';
      } else {
        emptyRow.innerHTML = '<div style="font-size:14px;color:var(--ink-2)">Aucun plan ne correspond à ta recherche.</div>';
      }
      grid.appendChild(emptyRow);
      if (footCount) footCount.textContent = '0 plan · Stockage local · Export PDF disponible sur chaque plan';
      if (footNum)   footNum.textContent = '00 / 00';
      return;
    }

    var n = plans.length;
    if (footCount) footCount.textContent = n + ' plan' + (n > 1 ? 's' : '') + ' · Stockage local · Export PDF disponible sur chaque plan';
    if (footNum)   footNum.textContent = String(n).padStart(2,'0') + ' / ' + String(n).padStart(2,'0');

    window.__historySnapshot = (plansHistory || []).slice();

    plans.forEach(function(p) {
      var score      = p.score_viabilite || p.score || null;
      var name       = p.nom_business || p.nom_entreprise || 'Plan sans nom';
      var idea       = (p.idea || p.resume_executif || '').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').slice(0, 50);
      var dateStr    = p.date ? (p.date instanceof Date ? p.date : new Date(p.date)).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}).toUpperCase() : '—';
      var scoreClass = score >= 75 ? 'num s-green' : 'num';
      var initial    = name.charAt(0).toUpperCase();

      var row = document.createElement('div');
      row.className = 'plan-row';
      row.style.cursor = 'pointer';

      row.innerHTML =
        '<div class="plan-icon italic">' + initial + '</div>' +
        '<div class="plan-name">' + name + (idea ? '<span>« ' + idea + ' »</span>' : '') + '</div>' +
        (score ? '<div class="plan-score ' + scoreClass + '">' + score + '<sup>/100</sup></div>' : '<div class="plan-score">—</div>') +
        '<div class="plan-budget">—</div>' +
        '<div class="plan-date">' + dateStr + '</div>' +
        '<div class="plan-cta"><button class="btn btn-ghost">Voir le plan →</button></div>';

      // Bind events via closure to avoid stale references
      (function(planRef) {
        row.addEventListener('click', function() { openFromHistory(planRef); });
        var btn = row.querySelector('.plan-cta button');
        if (btn) btn.addEventListener('click', function(e) {
          e.stopPropagation();
          openFromHistory(planRef);
        });
      })(p);

      grid.appendChild(row);
    });

  } else {
    // --- V1 legacy layout ---
    grid.innerHTML = '';
    if (plans.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px"><div style="font-size:14px;color:#7a7060">Aucun plan trouvé.</div></div>';
      return;
    }
    plans.forEach(function(p) {
      var score  = p.score_viabilite || p.score || null;
      var sector = (p.secteur || (p.idea ? p.idea.slice(0, 40) : '') || '').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').trim();
      var dateStr = (p.date instanceof Date ? p.date : new Date(p.date)).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

      var card = document.createElement('div');
      card.className = 'history-card';
      card.style.cssText = 'cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px 22px;background:#252219;border:1px solid rgba(228,221,214,0.07);border-radius:12px';
      card.innerHTML =
        '<div style="flex:1"><div style="font-size:16px;color:#e4ddd6">' + (p.nom_business || 'Plan sans nom') + '</div><div style="font-size:12px;color:#7a7060">' + sector + '</div></div>' +
        (score ? '<div style="font-size:11px;color:#d4845a;background:rgba(200,75,47,0.1);border:1px solid rgba(200,75,47,0.2);padding:4px 10px;border-radius:20px">Score ' + score + '/100</div>' : '') +
        '<div style="font-size:10px;color:#7a7060">' + dateStr + '</div>' +
        '<button class="hist-v1-btn" style="padding:7px 16px;background:rgba(200,75,47,0.12);border:1px solid rgba(200,75,47,0.25);border-radius:7px;color:#d4845a;font-size:12px;cursor:pointer">Voir le plan</button>';

      // Closure sur l'objet plan — évite les références périmées à plansHistory[i]
      (function(planRef) {
        card.addEventListener('click', function() { openFromHistory(planRef); });
        var btn = card.querySelector('.hist-v1-btn');
        if (btn) btn.addEventListener('click', function(e) {
          e.stopPropagation();
          openFromHistory(planRef);
        });
      })(p);

      grid.appendChild(card);
    });
  }
}

function openFromHistory(indexOrPlan) {
  var p;
  if (indexOrPlan && typeof indexOrPlan === 'object') {
    p = indexOrPlan;
  } else {
    p = plansHistory[indexOrPlan];
    if (!p && window.__historySnapshot) p = window.__historySnapshot[indexOrPlan];
  }
  if (!p) return;
  currentResult = p;

  if (typeof window.go === 'function') { window.go('gen'); }
  else if (typeof showView === 'function') { showView('generator'); }

  setTimeout(function() {
    var formEl   = document.querySelector('.gen-grid');   if (formEl)   formEl.style.display   = 'none';
    var bannerEl = document.querySelector('.gen-banner'); if (bannerEl) bannerEl.style.display = 'none';
    var pageHead = document.querySelector('.page-head');  if (pageHead) pageHead.style.display = 'none';
    var genEl    = document.getElementById('dashGenerating'); if (genEl)   genEl.style.display   = 'none';
    var emptyEl  = document.getElementById('dashEmptyState'); if (emptyEl) emptyEl.style.display  = 'none';

    var resultEl = document.getElementById('dashPlanResult');
    if (!resultEl) resultEl = document.getElementById('dashResult');
    if (resultEl) resultEl.style.display = 'block';

    var content = document.getElementById('planResultContent');
    if (content) {
      content.innerHTML = '';
      if (typeof window._renderV2PlanResult === 'function') {
        window._renderV2PlanResult(p, content);
      } else if (typeof fillPlan === 'function') {
        try { fillPlan(p); } catch(e) { console.warn('fillPlan:', e); }
      }
    }

    if (typeof toast === 'function') {
      toast('Plan "' + (p.nom_business || p.nom_entreprise || 'Plan') + '" chargé', 'success');
    }
  }, 80);
}
