// ========== HISTORY ==========
function renderHistory() {
  var grid = document.getElementById('historyGrid');
  if (!grid) return;

  // Déterminer si on est en mode v2 (table) ou v1 (grid)
  var isV2 = window.__EADEE_V2 || grid.classList.contains('plans-table');

  if (!plansHistory || plansHistory.length === 0) {
    if (isV2) {
      // Garder l'en-tête de la table
      var thead = grid.querySelector('.plans-thead');
      grid.innerHTML = '';
      if (thead) grid.appendChild(thead);
      var emptyRow = document.createElement('div');
      emptyRow.style.cssText = 'grid-column:1/-1;text-align:center;padding:60px 20px';
      emptyRow.innerHTML = '<div style="font-size:14px;color:var(--ink-2);margin-bottom:20px">Tu n\'as pas encore généré de plan.</div>' +
        '<button onclick="window.go&&window.go(\'gen\')" style="padding:10px 24px;background:var(--accent,#6b8fef);color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">Commencer mon premier plan</button>';
      grid.appendChild(emptyRow);
    } else {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px"><div style="font-size:14px;color:#7a7f9a">Tu n\'as pas encore généré de plan.</div></div>';
    }
    return;
  }

  if (isV2) {
    // Rendu v2 : lignes plan-row compatibles avec la table v2
    var thead = grid.querySelector('.plans-thead');
    grid.innerHTML = '';
    if (thead) grid.appendChild(thead);
    plansHistory.forEach(function(p, i) {
      var score = p.score_viabilite || p.score || null;
      var name = p.nom_business || p.nom_entreprise || 'Plan sans nom';
      var idea = (p.idea || p.resume_executif || '').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').slice(0, 50);
      var dateStr = p.date ? (p.date instanceof Date ? p.date : new Date(p.date)).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}).toUpperCase() : '—';
      var scoreClass = score >= 75 ? 'num s-green' : 'num';
      var initial = name.charAt(0).toUpperCase();
      var row = document.createElement('div');
      row.className = 'plan-row';
      row.style.cursor = 'pointer';
      row.onclick = function() { openFromHistory(i); };
      row.innerHTML =
        '<div class="plan-icon italic">' + initial + '</div>' +
        '<div class="plan-name">' + name + (idea ? '<span>« ' + idea + ' »</span>' : '') + '</div>' +
        (score ? '<div class="plan-score ' + scoreClass + '">' + score + '<sup>/100</sup></div>' : '<div class="plan-score">—</div>') +
        '<div class="plan-budget">—</div>' +
        '<div class="plan-date">' + dateStr + '</div>' +
        '<div class="plan-cta"><button class="btn btn-ghost" onclick="event.stopPropagation();openFromHistory(' + i + ')">Voir le plan →</button></div>';
      grid.appendChild(row);
    });
  } else {
    // Rendu v1 legacy
    grid.innerHTML = plansHistory.map(function(p, i) {
      var score = p.score_viabilite || p.score || null;
      var revRaw = p.revenu_an1 || p.rev_m12 || p.revenu_a1 || null;
      var rev = revRaw ? revRaw.replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').trim() : null;
      var sector = (p.secteur || (p.idea ? p.idea.slice(0, 40) : '') || '').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').trim();
      var dateStr = (p.date instanceof Date ? p.date : new Date(p.date)).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
      return '<div class="history-card" onclick="openFromHistory(' + i + ')" style="cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px 22px;background:#1a1d26;border:1px solid rgba(255,255,255,0.07);border-radius:12px">' +
        '<div style="flex:1"><div style="font-size:16px;color:#ecedf2">' + (p.nom_business || 'Plan sans nom') + '</div><div style="font-size:12px;color:#7a7f9a">' + sector + '</div></div>' +
        (score ? '<div style="font-size:11px;color:#9db8f8;background:rgba(107,143,239,0.1);border:1px solid rgba(107,143,239,0.2);padding:4px 10px;border-radius:20px">Score ' + score + '/100</div>' : '') +
        '<div style="font-size:10px;color:#7a7f9a">' + dateStr + '</div>' +
        '<button onclick="event.stopPropagation();openFromHistory(' + i + ')" style="padding:7px 16px;background:rgba(107,143,239,0.12);border:1px solid rgba(107,143,239,0.25);border-radius:7px;color:#9db8f8;font-size:12px;cursor:pointer">Voir le plan</button>' +
        '</div>';
    }).join('');
  }
}

function openFromHistory(index) {
  var p = plansHistory[index];
  if (!p) return;
  currentResult = p;

  // Naviguer vers le générateur (compatible v1 et v2)
  if (typeof window.go === 'function') { window.go('gen'); }
  else if (typeof showView === 'function') { showView('generator'); }

  // Masquer les états intermédiaires
  var genEl = document.getElementById('dashGenerating');
  if (genEl) genEl.style.display = 'none';
  var emptyEl = document.getElementById('dashEmptyState');
  if (emptyEl) emptyEl.style.display = 'none';

  // Afficher le résultat
  var resultEl = document.getElementById('dashResult'); // patché → dashPlanResult en v2
  if (resultEl) resultEl.style.display = 'block';

  // Remplir le contenu plan
  var content = document.getElementById('planResultContent');
  if (content && typeof window._renderV2PlanResult === 'function') {
    content.innerHTML = ''; // reset pour que MutationObserver ne réagisse pas
    window._renderV2PlanResult(p, content);
  } else if (typeof fillPlan === 'function') {
    try { fillPlan(p); } catch(e) { console.warn('fillPlan:', e); }
  }

  if (typeof toast === 'function') {
    toast('Plan "' + (p.nom_business || 'Plan') + '" rechargé ✓', 'success');
  }
}

