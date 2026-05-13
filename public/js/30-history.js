// ========== HISTORY ==========
function renderHistory() {
  const grid = document.getElementById('historyGrid');
  if (plansHistory.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px">
        <div style="font-size:48px;margin-bottom:16px;opacity:0.3">📋</div>
        <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:300;color:#ecedf2;margin-bottom:8px">Tu n'as pas encore généré de plan.</div>
        <div style="font-size:13px;color:#7a7f9a;margin-bottom:28px">Voici 3 idées populaires pour démarrer en 60 secondes :</div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:28px">
          <button onclick="prefillIdea('airbnb');showView('generator')" class="idea-card-btn" style="max-width:200px">Conciergerie locative</button>
          <button onclick="prefillIdea('kitchen');showView('generator')" class="idea-card-btn" style="max-width:200px">Dark kitchen healthy</button>
          <button onclick="prefillIdea('coaching');showView('generator')" class="idea-card-btn" style="max-width:200px">Coaching freelance B2B</button>
        </div>
        <button onclick="showView('generator')" style="padding:12px 28px;background:linear-gradient(135deg,#6b8fef,#a78bfa);color:#fff;border:none;border-radius:8px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:0.06em;cursor:pointer">COMMENCER MON PREMIER PLAN</button>
      </div>
    `;
    return;
  }
  grid.innerHTML = plansHistory.map((p, i) => {
    const score = p.score_viabilite || p.score || null;
    const revRaw = p.revenu_an1 || p.rev_m12 || p.revenu_a1 || null;
    const rev = revRaw ? revRaw.replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').trim() : null;
    const sector = (p.secteur || p.idea?.slice(0, 40) || '').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').trim();
    const dateStr = (p.date instanceof Date ? p.date : new Date(p.date)).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
    return `
    <div class="history-card" onclick="openFromHistory(${i})" style="cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px 22px;background:#1a1d26;border:1px solid rgba(255,255,255,0.07);border-radius:12px;transition:border-color .2s,background .2s;" onmouseover="this.style.borderColor='rgba(107,143,239,0.35)';this.style.background='#1e2235'" onmouseout="this.style.borderColor='rgba(255,255,255,0.07)';this.style.background='#1a1d26'">
      <div style="width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,rgba(107,143,239,0.2),rgba(167,139,250,0.2));border:1px solid rgba(107,143,239,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#9db8f8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14,2 14,8 20,8" stroke="#9db8f8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Fraunces',serif;font-size:16px;color:#ecedf2;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.nom_business || 'Plan sans nom'}</div>
        <div style="font-size:12px;color:#7a7f9a;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sector}</div>
      </div>
      ${score ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:#9db8f8;background:rgba(107,143,239,0.1);border:1px solid rgba(107,143,239,0.2);padding:4px 10px;border-radius:20px;flex-shrink:0;">Score ${score}/100</div>` : ''}
      ${rev ? `<div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:#34d399;flex-shrink:0;">${rev}</div>` : ''}
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:#7a7f9a;flex-shrink:0;">${dateStr}</div>
      <button onclick="event.stopPropagation();openFromHistory(${i})" style="padding:7px 16px;background:rgba(107,143,239,0.12);border:1px solid rgba(107,143,239,0.25);border-radius:7px;color:#9db8f8;font-family:'Geist',sans-serif;font-size:12px;font-weight:500;cursor:pointer;flex-shrink:0;transition:background .2s;" onmouseover="this.style.background='rgba(107,143,239,0.22)'" onmouseout="this.style.background='rgba(107,143,239,0.12)'">Voir le plan</button>
    </div>`;
  }).join('');
}

function openFromHistory(index) {
  const p = plansHistory[index];
  if (!p) return;
  currentResult = p;
  fillPlan(p);
  showView('generator');
  document.getElementById('dashGenerating').style.display = 'none';
  document.getElementById('dashEmptyState').style.display = 'none';
  document.getElementById('dashResult').style.display = 'flex';
  toast('Plan "' + (p.nom_business || 'Plan') + '" rechargé ✓', 'success');
}

