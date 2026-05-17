// ========== PLAN RENDERER V2.1 — Chart.js + 12 blocs ==========
(function() {

// ── Chart colors (oklch → hex) ────────────────────────────
var CC = {
  accent:  '#c84b2f',
  green:   '#3a7d44',
  gray:    '#b8b0a0',
  red:     '#d94f3a',
  orange:  '#e8a87c',
  mint:    '#8fbc8f',
  tan:     '#d4a574',
  grid:    '#ddd5c8',
  text:    '#856a52'
};

var _pending = [];
var _cid = 0;

function uid() { return 'ec' + (++_cid) + '_' + Math.random().toString(36).slice(2,6); }
function queue(id, cfg) { _pending.push({id:id, cfg:cfg}); }

function initCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = "'JetBrains Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = CC.text;
  _pending.forEach(function(c) {
    var el = document.getElementById(c.id);
    if (!el) return;
    var ex = Chart.getChart(el);
    if (ex) ex.destroy();
    try { new Chart(el, c.cfg); } catch(e) { console.warn('chart err', c.id, e); }
  });
  _pending = [];
}

// ── Helpers ───────────────────────────────────────────────
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function clean(s) {
  return String(s||'').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g,'$1').trim();
}
function numVal(s) {
  var c = clean(String(s||''));
  var m = c.replace(/\s/g,'').match(/-?[\d]+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(',','.')) : 0;
}
function para(s) {
  if (!s) return '';
  var t = String(s).replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g,'$1');
  return '<p style="font-size:14px;color:var(--ink-2);margin:0;line-height:1.65">' + t + '</p>';
}
function lbl(t) {
  return '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:8px">' + esc(t) + '</div>';
}
function card(title, body) {
  return '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">' +
    (title ? '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">' + esc(title) + '</div>' : '') +
    body + '</div>';
}
function badge(txt, type) {
  var s = type === 'green'  ? 'background:var(--green-bg);color:var(--green)'
        : type === 'accent' ? 'background:var(--accent-bg);color:var(--accent-ink)'
        : type === 'red'    ? 'background:var(--red-bg);color:var(--red)'
        :                     'background:var(--bg-2,var(--bg));color:var(--ink-3)';
  return '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-family:var(--mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600;' + s + '">' + esc(txt) + '</span>';
}
function statCell(lbl2, val, extra) {
  return '<div style="padding:14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
    '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(lbl2) + '</div>' +
    '<div style="font-family:var(--mono);font-size:15px;font-weight:600;color:var(--ink)">' + esc(clean(String(val||'—'))) + '</div>' +
    (extra||'') + '</div>';
}
function kvRow(label, val) {
  if (!val || clean(val) === 'null') return '';
  return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--rule);font-size:13.5px">' +
    '<span style="color:var(--ink-2)">' + esc(label) + '</span>' +
    '<span style="font-family:var(--mono);color:var(--ink)">' + esc(clean(val)) + '</span></div>';
}
function cvs(id, h) {
  return '<div style="position:relative;height:' + h + 'px;margin:16px 0"><canvas id="' + id + '"></canvas></div>';
}
function legend(items) {
  return '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:6px">' +
    items.map(function(it) {
      return '<div style="display:flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px;color:var(--ink-3)">' +
        '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + it.c + ';flex-shrink:0"></span>' + esc(it.l) + '</div>';
    }).join('') + '</div>';
}

// ── BLOC 1 — Double score ─────────────────────────────────
function bloc1(plan) {
  var sc = plan.scores || {};
  var sv = sc.score_viabilite || {};
  var sb = sc.score_bancabilite || {};
  var svN = sv.note || plan.score_viabilite || 0;
  var sbN = sb.note || 0;
  if (!svN && !sbN) return '';

  function scoreCol(n) { return n >= 75 ? CC.green : n >= 50 ? CC.accent : CC.red; }

  function miniBar(pts, max) {
    var p = Math.round((pts/max)*100);
    return '<div style="flex:1;height:3px;background:var(--rule);border-radius:2px">' +
      '<div style="height:3px;background:var(--accent);border-radius:2px;width:' + p + '%"></div></div>';
  }

  function scoreCard(title, note, criteria, det, interp, msgBanq) {
    var col = scoreCol(note);
    var pct = Math.round((note/100)*100);
    var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:20px">';
    h += lbl(title);
    h += '<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:10px">' +
      '<span style="font-family:var(--serif);font-size:40px;color:' + col + '">' + note + '</span>' +
      '<span style="font-family:var(--mono);font-size:12px;color:var(--ink-3)">/100</span></div>';
    h += '<div style="height:3px;background:var(--rule);border-radius:2px;margin-bottom:14px">' +
      '<div style="height:3px;background:' + col + ';width:' + pct + '%;border-radius:2px"></div></div>';
    if (det && criteria.length) {
      h += '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px">';
      criteria.forEach(function(cr) {
        var item = det[cr[0]]; if (!item) return;
        var pts = item.points || 0;
        h += '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-family:var(--mono);font-size:9.5px;color:var(--ink-3);width:90px;flex-shrink:0">' + esc(cr[1]) + '</span>' +
          miniBar(pts, cr[2]) +
          '<span style="font-family:var(--mono);font-size:9.5px;color:var(--ink-3);width:28px;text-align:right">' + pts + '/' + cr[2] + '</span></div>';
      });
      h += '</div>';
    }
    if (interp) h += '<p style="font-size:13px;color:var(--ink-3);font-style:italic;margin:0 0 10px;line-height:1.5">' + esc(interp) + '</p>';
    if (msgBanq) h += '<div style="border-left:2px solid var(--accent);background:var(--accent-bg);padding:10px 14px;border-radius:0 4px 4px 0">' +
      '<p style="font-family:var(--serif);font-style:italic;color:var(--accent-ink);font-size:13px;margin:0;line-height:1.5">' + esc(msgBanq) + '</p></div>';
    h += '</div>';
    return h;
  }

  var svC = [['taille_marche','Taille marché',15],['differentiation','Différenciation',20],
             ['proposition_valeur','Prop. valeur',15],['preuves_marche','Preuves marché',15],
             ['experience_porteur','Expérience',20],['clarte_modele_eco','Modèle éco',15]];
  var sbC = [['apport_suffisant','Apport',25],['point_mort_rapide','Point mort',20],
             ['tresorerie_positive_m6','Tréso M6',20],['garanties_disponibles','Garanties',15],
             ['secteur_risque_faible','Risque sect.',10],['experience_porteur','Expérience',10]];

  var out = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';
  if (svN) out += scoreCard('Score de viabilité', svN, svC, sv.detail, sv.interpretation, null);
  if (sbN) out += scoreCard('Score de bancabilité', sbN, sbC, sb.detail, sb.interpretation, sb.message_banquier);
  return out + '</div>';
}

// ── BLOC 2 — Profil financier porteur ────────────────────
function bloc2(plan, pid) {
  var ppf = plan.porteur_profil_financier;
  if (!ppf) return '';
  var ratio = numVal(ppf.ratio_apport_projet);
  var rType = ratio >= 30 ? 'green' : ratio >= 20 ? 'accent' : 'red';
  var rLbl  = ratio >= 30 ? 'Excellent' : ratio >= 20 ? 'Correct' : 'Insuffisant';
  var lsBase = 'eadee_docs_' + pid + '_';

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Profil financier du porteur</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">';
  h += statCell('Apport personnel', ppf.apport_personnel, null);
  h += statCell('Ratio apport/projet', ppf.ratio_apport_projet, '<div style="margin-top:6px">' + badge(rLbl, rType) + '</div>');
  h += statCell('Capacité remboursement', ppf.capacite_remboursement_estimee || '—', null);
  h += '</div>';
  if (ppf.appreciation_ratio) {
    h += '<p style="font-size:13px;color:var(--ink-2);margin:0 0 14px;line-height:1.5">' + esc(ppf.appreciation_ratio) + '</p>';
  }
  if (ppf.documents_a_fournir && ppf.documents_a_fournir.length) {
    h += '<div style="border-top:1px solid var(--rule);padding-top:14px">' + lbl('Documents à fournir');
    ppf.documents_a_fournir.forEach(function(doc, i) {
      var isStr = typeof doc === 'string';
      var txt = isStr ? doc : (doc.document || String(doc));
      var st  = isStr ? '' : (doc.statut || '');
      var bT  = st === 'bloquant' ? 'red' : st === 'important' ? 'accent' : st === 'ok' ? 'green' : '';
      var cbId = lsBase + i;
      var chk  = localStorage.getItem(cbId) === '1' ? 'checked' : '';
      h += '<label style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--rule);cursor:pointer">' +
        '<input type="checkbox" ' + chk + ' onchange="localStorage.setItem(\'' + cbId + '\',this.checked?\'1\':\'0\')" style="margin-top:2px;accent-color:var(--accent);flex-shrink:0">' +
        '<span style="flex:1;font-size:13px;color:var(--ink-2)">' + esc(txt) + '</span>' +
        (bT ? badge(st, bT) : '') + '</label>';
    });
    h += '</div>';
  }
  return h + '</div>';
}

// ── BLOC 3 — Vision banquier ──────────────────────────────
function bloc3(plan) {
  var vb = plan.resume_vision_banquier;
  if (!vb) return '';
  var cells = [
    ['Montant demandé', vb.montant_demande],
    ['Durée souhaitée', vb.duree_souhaitee],
    ['Mensualité estimée', vb.mensualite_estimee],
    ['Capacité remboursement', vb.capacite_remboursement],
    ['Garanties', vb.garanties_proposees ? (Array.isArray(vb.garanties_proposees) ? vb.garanties_proposees.join(', ') : vb.garanties_proposees) : null],
    ['Argument principal', vb.argument_principal]
  ].filter(function(r) { return r[1]; });
  if (!cells.length) return '';

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-left:2px solid var(--accent);border-radius:0 6px 6px 0;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Vision banquier</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--rule);border-radius:4px;overflow:hidden;margin-bottom:14px">';
  cells.forEach(function(r, i) {
    h += '<div style="padding:12px;border-bottom:1px solid var(--rule);' + (i%3!==2?'border-right:1px solid var(--rule);':'') + '">' +
      '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(r[0]) + '</div>' +
      '<div style="font-family:var(--mono);font-size:14px;color:var(--ink)">' + esc(clean(r[1])) + '</div></div>';
  });
  h += '</div>';
  var arg = vb.argument_principal_bancaire || vb.argument_principal;
  if (arg) h += '<div style="background:var(--accent-bg);border-left:2px solid var(--accent);padding:10px 14px;border-radius:0 4px 4px 0">' +
    '<p style="font-family:var(--serif);font-style:italic;color:var(--accent-ink);font-size:13px;margin:0;line-height:1.5">' + esc(arg) + '</p></div>';
  return h + '</div>';
}

// ── BLOC 4 — Plan financement + donut ─────────────────────
function bloc4(plan) {
  var pf = plan.plan_financement;
  if (!pf) return '';
  var res = pf.ressources || {};
  var donutColors = [CC.accent, CC.green, CC.gray, CC.orange, CC.mint, CC.tan];
  var donutItems = [];
  [['Apport personnel', res.apport_personnel], ['Prêt bancaire', res.pret_bancaire],
   ['Prêt BPI', res.pret_bpi], ['Prêt d\'honneur', res.pret_honneur],
   ['Subventions', res.subventions], ['Love money', res.love_money]
  ].forEach(function(it, i) {
    var v = numVal(it[1]);
    if (v > 0) donutItems.push({ l: it[0], v: v, c: donutColors[i] });
  });

  var cid = uid();
  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Plan de financement</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr ' + (donutItems.length ? '180px' : '') + ';gap:24px">';

  // Besoins
  if (pf.besoins) {
    h += '<div>' + lbl('Besoins');
    var bMap = {investissements_materiels:'Investissements matériels',investissements_immateriels:'Investissements immatériels',bfr_demarrage:'BFR démarrage',tresorerie_securite:'Trésorerie sécurité'};
    Object.keys(bMap).forEach(function(k) { if (pf.besoins[k]) h += kvRow(bMap[k], pf.besoins[k]); });
    if (pf.besoins.total_besoins) h += '<div style="display:flex;justify-content:space-between;padding:9px 0;font-size:14px;font-weight:600;border-top:2px solid var(--rule-2)">' +
      '<span>Total</span><span style="font-family:var(--mono);color:var(--accent)">' + esc(clean(pf.besoins.total_besoins)) + '</span></div>';
    h += '</div>';
  }

  // Ressources
  if (pf.ressources) {
    h += '<div>' + lbl('Ressources');
    var rMap = {apport_personnel:'Apport personnel',pret_bancaire:'Prêt bancaire',pret_bpi:'Prêt BPI',pret_honneur:'Prêt d\'honneur',subventions:'Subventions',love_money:'Love money'};
    Object.keys(rMap).forEach(function(k) { if (res[k] && clean(res[k]) !== 'null') h += kvRow(rMap[k], res[k]); });
    if (res.total_ressources) h += '<div style="display:flex;justify-content:space-between;padding:9px 0;font-size:14px;font-weight:600;border-top:2px solid var(--rule-2)">' +
      '<span>Total</span><span style="font-family:var(--mono);color:var(--green)">' + esc(clean(res.total_ressources)) + '</span></div>';
    h += '</div>';
  }

  // Donut
  if (donutItems.length) {
    var totalRes = donutItems.reduce(function(s,d){ return s+d.v; }, 0);
    h += '<div>';
    h += '<div style="position:relative;height:140px">' +
      '<canvas id="' + cid + '"></canvas>' +
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none">' +
      '<div style="font-family:var(--mono);font-size:10px;font-weight:600;color:var(--ink)">' + (totalRes/1000).toFixed(0) + 'k€</div>' +
      '<div style="font-family:var(--mono);font-size:9px;color:var(--ink-3)">Total</div></div></div>';
    h += legend(donutItems.map(function(d){ return {c:d.c, l:d.l}; }));
    h += '</div>';
    queue(cid, { type:'doughnut', data:{ datasets:[{ data:donutItems.map(function(d){return d.v;}), backgroundColor:donutItems.map(function(d){return d.c;}), borderWidth:0 }] },
      options:{ animation:false, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{display:false},tooltip:{enabled:false}} } });
  }

  h += '</div>';
  if (pf.equilibre === true) h += '<div style="margin-top:14px;padding:9px 14px;background:var(--green-bg);border-radius:4px;font-family:var(--mono);font-size:12px;color:var(--green)">✓ Plan équilibré</div>';
  if (pf.equilibre === false) h += '<div style="margin-top:14px;padding:9px 14px;background:var(--red-bg);border-radius:4px;font-family:var(--mono);font-size:12px;color:var(--red)">⚠ Plan non équilibré</div>';
  if (pf.message_banquier) h += '<p style="font-size:13px;color:var(--ink-3);font-style:italic;margin:12px 0 0;line-height:1.5">' + esc(pf.message_banquier) + '</p>';
  return h + '</div>';
}

// ── BLOC 5 — Tableau amortissement ───────────────────────
function bloc5(plan) {
  var ta = plan.tableau_amortissement;
  if (!ta || !ta.parametres) return '';
  var p = ta.parametres;
  var cid = uid();
  var labels=[], capData=[], intData=[], cumInt=0;
  if (ta.echeancier_annuel) ta.echeancier_annuel.forEach(function(r) {
    labels.push('An'+r.annee);
    capData.push(numVal(r.capital_restant_du_fin_annee));
    cumInt += numVal(r.interets_payes_annee);
    intData.push(cumInt);
  });

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Tableau d\'amortissement</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">';
  [['Capital emprunté',p.capital_emprunte],['Taux annuel',p.taux_annuel_estime],['Mensualité',p.mensualite_estimee],
   ['Durée',p.duree_annees?p.duree_annees+' ans':null],['Total intérêts',p.total_interets],['Coût total',p.cout_total_credit]
  ].forEach(function(it) {
    if (!it[1]) return;
    h += '<div style="padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
      '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(it[0]) + '</div>' +
      '<div style="font-family:var(--mono);font-size:14px;color:var(--ink)">' + esc(clean(it[1])) + '</div></div>';
  });
  h += '</div>';

  if (labels.length) {
    h += cvs(cid, 180);
    h += legend([{c:CC.accent,l:'Capital restant dû'},{c:CC.green,l:'Intérêts cumulés'}]);
    queue(cid, { type:'line', data:{ labels:labels, datasets:[
      {label:'Capital',data:capData,borderColor:CC.accent,borderWidth:2,fill:true,backgroundColor:'rgba(200,75,47,0.08)',tension:0.3,pointRadius:3},
      {label:'Intérêts cumulés',data:intData,borderColor:CC.green,borderWidth:1.5,borderDash:[4,3],fill:false,tension:0.3,pointRadius:2}
    ]}, options:{animation:false,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{grid:{color:CC.grid},ticks:{color:CC.text}},y:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr')+'€';}}}}} });
  }

  if (ta.echeancier_annuel && ta.echeancier_annuel.length) {
    h += '<div style="overflow-x:auto;margin-top:16px"><table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr style="background:var(--bg)">';
    ['Année','Mensualité','Capital remb.','Intérêts','Capital restant'].forEach(function(hd) {
      h += '<th style="padding:8px 10px;font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid var(--rule);text-align:right;white-space:nowrap">' + hd + '</th>';
    });
    h += '</tr></thead><tbody>';
    ta.echeancier_annuel.forEach(function(r, i) {
      h += '<tr style="background:' + (i%2===0?'var(--paper)':'var(--bg)') + '">' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono)">An'+r.annee+'</td>' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono)">' + esc(clean(r.mensualite||'—')) + '</td>' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);color:var(--accent)">' + esc(clean(r.capital_rembourse_annee||'—')) + '</td>' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);color:var(--red)">' + esc(clean(r.interets_payes_annee||'—')) + '</td>' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);font-weight:600">' + esc(clean(r.capital_restant_du_fin_annee||'—')) + '</td></tr>';
    });
    h += '</tbody></table></div>';
  }

  var acr = ta.analyse_capacite_remboursement;
  if (acr) {
    var pM = numVal(acr.mensualite_vs_marge_nette_an1);
    var cT = pM < 15 ? 'green' : pM <= 25 ? 'accent' : 'red';
    var cL = pM < 15 ? 'Confortable' : pM <= 25 ? 'Correct' : 'Tendu';
    h += '<div style="margin-top:14px;padding:10px 14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule);display:flex;align-items:center;gap:12px">' +
      '<div style="font-family:var(--mono);font-size:22px;color:var(--accent)">' + esc(clean(acr.mensualite_vs_marge_nette_an1||'')) + '</div>' +
      '<div>' + lbl('Mensualité vs marge nette An1') + badge(cL,cT) + '</div></div>';
    if (acr.option_differe && acr.option_differe.recommande)
      h += '<div style="margin-top:10px;padding:10px 14px;background:var(--accent-bg);border-left:2px solid var(--accent);border-radius:0 4px 4px 0;font-size:13px;color:var(--accent-ink)">💡 ' + esc(acr.option_differe.explication||'Différé conseillé') + '</div>';
  }

  if (ta.conseils_negociation_banque && ta.conseils_negociation_banque.length) {
    h += '<div style="margin-top:14px">' + lbl('Conseils négociation') +
      ta.conseils_negociation_banque.map(function(c) {
        return '<div style="display:flex;gap:8px;font-size:13px;color:var(--ink-2);padding:5px 0;border-bottom:1px solid var(--rule)"><span style="color:var(--accent);flex-shrink:0">—</span>' + esc(c) + '</div>';
      }).join('') + '</div>';
  }
  return h + '</div>';
}

// ── BLOC 6 — Checklist bancabilité ───────────────────────
function bloc6(plan, pid) {
  var cl = plan.annexes_checklist;
  if (!cl || !cl.length) return '';
  var isNewFmt = typeof cl[0] === 'object' && cl[0] !== null && (cl[0].titre || cl[0].items);
  var ringId = uid();
  var lsBase = 'eadee_banc_' + pid + '_';
  var totalItems = isNewFmt ? cl.reduce(function(acc,c){ return acc+(c.items||[]).length; }, 0) : cl.length;

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Checklist bancabilité</div>';

  // Progress ring
  h += '<div style="display:flex;align-items:center;gap:20px;margin-bottom:18px">';
  h += '<div style="position:relative;width:90px;height:90px;flex-shrink:0"><canvas id="' + ringId + '"></canvas>' +
    '<div id="bancPct_' + ringId + '" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--mono);font-size:16px;font-weight:600;color:var(--ink);text-align:center">0%</div></div>';
  h += '<div style="font-family:var(--mono);font-size:12px;color:var(--ink-2)">' + totalItems + ' documents à préparer</div>';
  h += '</div>';

  if (!isNewFmt) {
    h += '<div style="display:flex;flex-direction:column;gap:5px">';
    cl.forEach(function(item, i) {
      var cbId = lsBase + i;
      var chk = localStorage.getItem(cbId) === '1' ? 'checked' : '';
      h += '<label style="display:flex;align-items:flex-start;gap:10px;padding:9px 12px;background:var(--bg);border:1px solid var(--rule);border-radius:5px;cursor:pointer">' +
        '<input type="checkbox" ' + chk + ' onchange="localStorage.setItem(\'' + cbId + '\',this.checked?\'1\':\'0\')" style="margin-top:2px;accent-color:var(--accent);flex-shrink:0">' +
        '<span style="font-size:13px;color:var(--ink-2)">' + esc(item) + '</span></label>';
    });
    h += '</div>';
  } else {
    cl.forEach(function(cat, ci) {
      var items = cat.items || [];
      h += '<div style="margin-bottom:6px;border:1px solid var(--rule);border-radius:6px;overflow:hidden">';
      h += '<button onclick="var n=this.nextElementSibling;n.style.display=n.style.display===\'none\'?\'block\':\'none\'" ' +
        'style="width:100%;display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--bg);border:none;cursor:pointer;text-align:left">' +
        '<span style="font-family:var(--mono);font-size:10px;color:var(--ink-4)">' + esc(String(cat.ordre_preparation||ci+1).padStart(2,'0')) + '</span>' +
        '<span style="flex:1;font-size:13px;color:var(--ink);font-weight:500">' + esc(cat.titre||'') + '</span>' +
        '<span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">' + items.length + ' docs</span></button>';
      h += '<div style="display:none;padding:10px 14px">';
      items.forEach(function(item, ii) {
        var cbId = lsBase + ci + '_' + ii;
        var chk = localStorage.getItem(cbId) === '1' ? 'checked' : '';
        var st = typeof item === 'string' ? '' : (item.statut||'');
        var bT = st==='bloquant'?'red':st==='très_important'?'accent':'muted';
        var txt = typeof item === 'string' ? item : (item.document||String(item));
        h += '<label style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid var(--rule);cursor:pointer">' +
          '<input type="checkbox" ' + chk + ' onchange="localStorage.setItem(\'' + cbId + '\',this.checked?\'1\':\'0\')" style="margin-top:2px;accent-color:var(--accent)">' +
          '<span style="flex:1;font-size:13px;color:var(--ink-2)">' + esc(txt) + '</span>' +
          (st ? badge(st,bT) : '') + '</label>';
      });
      h += '</div></div>';
    });
  }
  h += '</div>';

  queue(ringId, { type:'doughnut', data:{ datasets:[{ data:[0,100], backgroundColor:[CC.accent,CC.grid], borderWidth:0 }] },
    options:{ animation:false, maintainAspectRatio:false, cutout:'72%', plugins:{legend:{display:false},tooltip:{enabled:false}} } });
  return h;
}

// ── BLOC 7 — Trésorerie 12 mois ──────────────────────────
function bloc7(plan) {
  var tm = plan.tresorerie_mensuelle || (plan.tresorerie && plan.tresorerie.tableau_12_mois);
  if (!tm || !tm.length) return '';
  var cid = uid();
  var mlbls = tm.map(function(r){ return (r.mois||'').substring(0,3); });
  var cumul  = tm.map(function(r){ return numVal(r.solde_cumule); });
  var mois   = tm.map(function(r){ return numVal(r.solde_mois); });
  var soldeMin = Math.min.apply(null, cumul);
  var soldeFin = cumul[cumul.length-1];
  var moisCrit = null;
  tm.forEach(function(r,i){ if (cumul[i]<0 && !moisCrit) moisCrit = r.mois; });
  var alertes = tm.filter(function(r){ return r.alerte; });

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Trésorerie mensuelle</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">';
  h += statCell('Solde minimum', soldeMin.toLocaleString('fr')+'€', soldeMin<0?'<div style="margin-top:4px">'+badge('Négatif','red')+'</div>':'');
  h += statCell('Mois critique', moisCrit||'Aucun', moisCrit?'<div style="margin-top:4px">'+badge('Attention','red')+'</div>':'');
  h += statCell('Solde final M12', soldeFin.toLocaleString('fr')+'€', '');
  h += '</div>';
  h += cvs(cid, 260);
  h += legend([{c:CC.accent,l:'Solde cumulé'},{c:'rgba(184,176,160,0.5)',l:'Solde mensuel'}]);

  queue(cid, { type:'bar', data:{ labels:mlbls, datasets:[
    { type:'line', data:cumul, borderColor:CC.accent, borderWidth:2.5,
      fill:{ target:{value:0}, above:'rgba(200,75,47,0.08)', below:'rgba(217,79,58,0.10)' },
      tension:0.4, pointRadius:tm.map(function(r){return r.alerte?5:2;}),
      pointBackgroundColor:tm.map(function(r){return r.alerte?CC.red:CC.accent;}), yAxisID:'y' },
    { type:'bar', data:mois, backgroundColor:'rgba(184,176,160,0.3)', borderRadius:2, yAxisID:'y' }
  ]}, options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false}},
    scales:{ x:{grid:{color:CC.grid},ticks:{color:CC.text}},
      y:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr')+'€';}}} } } });

  if (alertes.length) {
    h += '<div style="margin-top:12px;display:flex;flex-direction:column;gap:5px">';
    alertes.forEach(function(r) {
      h += '<div style="padding:7px 12px;background:var(--red-bg);border-radius:4px;font-family:var(--mono);font-size:11px;color:var(--red)">⚠ ' + esc(r.mois) + ' — ' + esc(r.alerte) + '</div>';
    });
    h += '</div>';
  }
  return h + '</div>';
}

// ── BLOC 8 — Projections revenus ─────────────────────────
function bloc8(plan) {
  var rm = plan.rev_mensuel;
  if (!rm || !rm.length) return '';
  var cid = uid();
  var mnoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  var lbls = mnoms.slice(0, rm.length);
  var jalons = [
    {l:'M+1',v:numVal(plan.rev_m1)},{l:'M+3',v:numVal(plan.rev_m3)},{l:'M+6',v:numVal(plan.rev_m6)},
    {l:'An1',v:numVal(plan.rev_m12)},{l:'An2',v:numVal(plan.rev_m24)},{l:'An3',v:numVal(plan.rev_m36)}
  ].filter(function(j){ return j.v > 0; });

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Projections de revenus</div>';
  h += cvs(cid, 240);
  h += legend([{c:CC.accent,l:'CA mensuel An1'}]);

  queue(cid, { type:'line', data:{ labels:lbls, datasets:[{
    data:rm, borderColor:CC.accent, borderWidth:2, fill:true, backgroundColor:'rgba(200,75,47,0.08)', tension:0.4, pointRadius:3
  }]}, options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false}},
    scales:{ x:{grid:{color:CC.grid},ticks:{color:CC.text}},
      y:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr')+'€';}},min:0} } } });

  if (jalons.length) {
    h += '<div style="display:grid;grid-template-columns:repeat(' + Math.min(jalons.length,6) + ',1fr);border:1px solid var(--rule);border-radius:4px;overflow:hidden;margin-top:14px">';
    jalons.forEach(function(j, i) {
      h += '<div style="padding:10px 12px;' + (i<jalons.length-1?'border-right:1px solid var(--rule)':'') + '">' +
        '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);margin-bottom:4px">' + esc(j.l) + '</div>' +
        '<div style="font-family:var(--mono);font-size:13px;font-weight:600;color:var(--ink)">' + j.v.toLocaleString('fr') + '€</div></div>';
    });
    h += '</div>';
  }
  return h + '</div>';
}

// ── BLOC 9 — Scénarios ────────────────────────────────────
function bloc9(plan) {
  var sc = plan.scenarios;
  if (!sc) return '';
  var defs = [
    {k:'pessimiste',l:'Pessimiste',c:CC.red},
    {k:'realiste',  l:'Réaliste',  c:CC.accent},
    {k:'optimiste', l:'Optimiste', c:CC.green}
  ];
  var valid = defs.filter(function(d){ return sc[d.k]; });
  if (!valid.length) return '';
  var cid = uid();
  var an1 = valid.map(function(d){ return numVal((sc[d.k]||{}).ca_an1); });
  var an3 = valid.map(function(d){ return numVal((sc[d.k]||{}).ca_an3); });

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Scénarios financiers</div>';
  h += cvs(cid, 220);
  h += legend(valid.map(function(d){ return {c:d.c,l:d.l}; }));

  queue(cid, { type:'bar', data:{ labels:['Année 1','Année 3'],
    datasets:valid.map(function(d,i){ return { label:d.l, data:[an1[i],an3[i]], backgroundColor:d.c, borderRadius:3, borderSkipped:false }; })
  }, options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false}},
    scales:{ x:{grid:{color:CC.grid},ticks:{color:CC.text}},
      y:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr')+'€';}},min:0} } } });

  h += '<div style="display:grid;grid-template-columns:repeat(' + valid.length + ',1fr);gap:12px;margin-top:14px">';
  valid.forEach(function(d) {
    var s = sc[d.k];
    var vT = s.viabilite==='viable'?'green':s.viabilite==='fragile'?'accent':'red';
    h += '<div style="padding:14px;border:1px solid var(--rule);border-radius:6px;border-top:2px solid ' + d.c + '">' +
      lbl(d.l) +
      (s.ca_an1?'<div style="font-family:var(--mono);font-size:12px;color:var(--ink);font-weight:600;margin-bottom:2px">An1 : '+esc(clean(s.ca_an1))+'</div>':'') +
      (s.ca_an3?'<div style="font-family:var(--mono);font-size:12px;color:var(--ink);margin-bottom:6px">An3 : '+esc(clean(s.ca_an3))+'</div>':'') +
      (s.point_mort_mois?'<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);margin-bottom:8px">Break-even : '+esc(clean(s.point_mort_mois))+'</div>':'') +
      (s.hypothese?'<p style="font-size:12px;color:var(--ink-3);font-style:italic;margin:0 0 8px;line-height:1.4">'+esc(s.hypothese)+'</p>':'') +
      (s.viabilite?badge(s.viabilite,vT):'') + '</div>';
  });
  return h + '</div></div>';
}

// ── BLOC 10 — Seuil rentabilité ───────────────────────────
function bloc10(plan) {
  var sr = plan.seuil_rentabilite;
  if (!sr) return '';
  var cid = uid();
  var rm = plan.rev_mensuel || [];
  var seuil = numVal(sr.ca_seuil_mensuel || sr.point_mort_ca);
  var mnoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  var lbls = mnoms.slice(0, rm.length);
  var mar = numVal(sr.marge_securite_an1);
  var marT = mar > 20 ? 'green' : mar < 10 ? 'red' : 'accent';

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Seuil de rentabilité</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">';
  h += statCell('CA seuil mensuel', sr.ca_seuil_mensuel||sr.point_mort_ca, '');
  h += statCell('Ventes nécessaires', sr.nb_ventes_necessaires||'—', '');
  h += statCell('Mois d\'atteinte', sr.mois_atteinte_prevu||sr.break_even_mois, '<div style="margin-top:4px">'+badge('Objectif','accent')+'</div>');
  h += statCell('Marge sécurité An1', sr.marge_securite_an1||'—', '<div style="margin-top:4px">'+badge(mar>20?'Confortable':mar<10?'Faible':'Correct',marT)+'</div>');
  h += '</div>';

  if (rm.length && seuil > 0) {
    h += cvs(cid, 220);
    h += legend([{c:CC.accent,l:'CA réel'},{c:CC.red,l:'Seuil de rentabilité'}]);
    queue(cid, { type:'line', data:{ labels:lbls, datasets:[
      {data:rm, borderColor:CC.accent, borderWidth:2, fill:false, tension:0.4, pointRadius:3},
      {data:lbls.map(function(){return seuil;}), borderColor:CC.red, borderDash:[5,4], borderWidth:1.5, fill:false, pointRadius:0}
    ]}, options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ x:{grid:{color:CC.grid},ticks:{color:CC.text}},
        y:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr')+'€';}},min:0} } } });
  }
  if (sr.interpretation_bancaire||sr.detail) {
    h += '<div style="margin-top:12px;border-left:2px solid var(--rule);padding-left:12px">' +
      '<p style="font-size:13px;color:var(--ink-3);font-style:italic;margin:0;line-height:1.5">' + esc(sr.interpretation_bancaire||sr.detail) + '</p></div>';
  }
  return h + '</div>';
}

// ── BLOC 11 — Bilan prévisionnel ──────────────────────────
function bloc11(plan) {
  var bp = plan.bilan_previsionnel;
  if (!bp) return '';
  if (typeof bp === 'string') return card('Bilan prévisionnel', para(bp));
  var annees = bp.annees || [];
  if (!annees.length) return '';
  var cid = uid();
  var lbls = annees.map(function(a){ return 'An'+a.annee; });

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Bilan prévisionnel</div>';
  h += cvs(cid, 220);

  var actifDS = [
    {lbl:'Immobilisations',key:'immobilisations',c:CC.accent,s:'actif'},
    {lbl:'Stocks',key:'stocks',c:CC.orange,s:'actif'},
    {lbl:'Créances',key:'creances_clients',c:CC.gray,s:'actif'},
    {lbl:'Disponibilités',key:'disponibilites',c:CC.green,s:'actif'}
  ];
  var passifDS = [
    {lbl:'Capitaux propres',key:'capitaux_propres',c:CC.accent,s:'passif'},
    {lbl:'Dettes fin.',key:'dettes_financieres',c:CC.gray,s:'passif'},
    {lbl:'Dettes four.',key:'dettes_fournisseurs',c:CC.orange,s:'passif'},
    {lbl:'Dettes fisc.',key:'dettes_fiscales_sociales',c:CC.tan,s:'passif'}
  ];

  var datasets = actifDS.concat(passifDS).map(function(ds) {
    return { label:ds.lbl, data:annees.map(function(a){ return numVal(a[ds.s]&&a[ds.s][ds.key]); }),
      backgroundColor:ds.c, stack:ds.s, borderRadius:2 };
  });

  queue(cid, { type:'bar', data:{labels:lbls,datasets:datasets},
    options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{x:{stacked:true,grid:{color:CC.grid},ticks:{color:CC.text}},
        y:{stacked:true,grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr')+'€';}}}} } });

  h += legend(actifDS.concat(passifDS).map(function(ds){ return {c:ds.c,l:ds.lbl}; }));
  return h + '</div>';
}

// ── BLOC 12 — Acquisition / CAC ───────────────────────────
function bloc12(plan) {
  var raw = plan.acquisition;
  if (!raw || !raw.length) return '';
  var canaux = (raw[0] && raw[0].canal !== undefined) ? raw : (raw.canaux || []);
  if (!canaux.length) return '';
  var cid = uid();
  var names = canaux.map(function(c){ return c.canal||c.nom||''; });
  var cacs  = canaux.map(function(c){ return numVal(c.cac); });
  var barColors = canaux.map(function(c){ return (c.priorite||c.type)==='principale'?CC.accent:CC.gray; });

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Canaux d\'acquisition</div>';

  if (cacs.some(function(v){ return v>0; })) {
    h += cvs(cid, 140);
    queue(cid, { type:'bar', data:{ labels:names, datasets:[{ data:cacs, backgroundColor:barColors, borderRadius:3, borderSkipped:false }] },
      options:{ animation:false, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}},
        scales:{ x:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v+'€';}}},
          y:{grid:{display:false},ticks:{color:CC.text}} } } });
  }

  var cols = Math.min(canaux.length, 3);
  h += '<div style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:12px;margin-top:14px">';
  canaux.forEach(function(c) {
    var prio = c.priorite||c.type||'';
    h += '<div style="padding:14px;border:1px solid var(--rule);border-radius:6px;background:var(--bg)">' +
      '<div style="font-size:13px;font-weight:500;color:var(--ink);margin-bottom:6px">' + esc(c.canal||c.nom||'') + '</div>' +
      (prio?'<div style="margin-bottom:6px">'+badge(prio,prio==='principale'?'accent':'muted')+'</div>':'') +
      '<p style="font-size:12px;color:var(--ink-3);margin:0 0 8px;line-height:1.4">' + esc(c.description||'') + '</p>' +
      (c.cac?'<div style="font-family:var(--mono);font-size:12px;color:var(--ink)">CAC : '+esc(clean(c.cac))+'</div>':'') +
      (c.delai_premier_client?'<div style="font-size:11px;color:var(--ink-4);margin-top:4px">'+esc(c.delai_premier_client)+'</div>':'') +
      '</div>';
  });
  h += '</div>';
  return h + '</div>';
}

// ── RENDERER PRINCIPAL ────────────────────────────────────
window._renderV2PlanResult = function(plan, container) {
  if (!plan || !container) return;
  _pending = []; _cid = 0;

  var sc      = plan.scores || {};
  var sv      = sc.score_viabilite || {};
  var sb      = sc.score_bancabilite || {};
  var svN     = sv.note || plan.score_viabilite || 0;
  var sbN     = sb.note || 0;
  var sCol    = svN >= 75 ? '#3a7d44' : svN >= 50 ? '#c84b2f' : '#d94f3a';
  var pName   = plan.nom_business || plan.nom_entreprise || plan.name || 'Business Plan';
  var pid     = plan.id || plan._id || btoa(encodeURIComponent(pName)).replace(/[^a-zA-Z0-9]/g,'').substring(0,8);
  var d       = plan.disclaimer;

  var html = '<div style="max-width:960px;margin:0 auto;padding:0 32px 100px">';

  // EN-TÊTE
  html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:32px;flex-wrap:wrap">';
  html += '<div style="flex:1;min-width:200px">';
  html += '<span style="font-family:var(--mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--green);display:block;margin-bottom:8px">Plan généré ✓</span>';
  html += '<h2 style="font-family:var(--serif);font-size:40px;line-height:1.05;letter-spacing:-0.02em;margin:0 0 6px;font-weight:400">' + esc(pName) + '</h2>';
  if (plan.tagline) html += '<p style="font-family:var(--serif);font-style:italic;color:var(--ink-2);font-size:16px;margin:0">' + esc(plan.tagline) + '</p>';
  html += '</div><div style="display:flex;gap:10px;flex-shrink:0">';
  if (svN) html += '<div style="text-align:center;padding:14px 20px;background:var(--paper);border:1px solid var(--rule);border-radius:6px;min-width:84px">' +
    lbl('Viabilité') + '<div style="font-family:var(--serif);font-size:44px;line-height:0.9;color:' + sCol + '">' + svN + '</div>' +
    '<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">/100</div></div>';
  if (sbN) html += '<div style="text-align:center;padding:14px 20px;background:var(--paper);border:1px solid var(--rule);border-radius:6px;min-width:84px">' +
    lbl('Bancabilité') + '<div style="font-family:var(--serif);font-size:44px;line-height:0.9;color:var(--accent)">' + sbN + '</div>' +
    '<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">/100</div></div>';
  html += '</div></div>';

  // DISCLAIMER
  if (d && d.message_entrepreneur) {
    var me = d.message_entrepreneur;
    html += '<div style="padding:14px 18px;background:var(--bg-2,var(--bg));border:1px solid var(--rule);border-radius:6px;margin-bottom:20px">';
    html += '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:6px">⚠ ' + esc(me.titre||'Note importante') + '</div>';
    html += '<p style="font-size:13px;color:var(--ink-2);margin:0;line-height:1.55">' + esc(me.corps||'') + '</p>';
    if (me.recommandation_concrete) html += '<p style="font-size:13px;color:var(--accent-ink,var(--accent));margin:6px 0 0;font-weight:500">' + esc(me.recommandation_concrete) + '</p>';
    html += '</div>';
  }

  // PITCH
  if (plan.pitch_30s) {
    html += '<div style="padding:18px 22px;background:var(--accent-bg);border:1px solid var(--rule);border-radius:6px;margin-bottom:20px">';
    html += lbl('Pitch 30 secondes');
    html += para(plan.pitch_30s);
    html += '</div>';
  }

  html += bloc1(plan);
  if (plan.presentation_projet) html += card('Présentation du projet', para(plan.presentation_projet));
  if (plan.resume_executif) html += card('Résumé exécutif', para(plan.resume_executif));
  html += bloc3(plan);
  html += bloc2(plan, pid);

  // PERSONA
  var persona = plan.persona;
  if (persona && persona.nom) {
    var perBody = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      [['Profil',persona.nom+(persona.age?' · '+persona.age:'')],['Situation',persona.situation],
       ['Douleurs',persona.douleurs],['Motivations',persona.motivations],['Où le trouver',persona.ou_le_trouver]
      ].filter(function(r){return r[1];}).map(function(r){
        return '<div style="padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
          '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(r[0]) + '</div>' +
          '<div style="font-size:13px;color:var(--ink-2);line-height:1.4">' + esc(r[1]) + '</div></div>';
      }).join('') + '</div>';
    html += card('Persona client cible', perBody);
  }

  // MARCHÉ
  var mBody = '';
  if (plan.marche_analyse) mBody += para(plan.marche_analyse) + '<div style="height:12px"></div>';
  var mStats = [{label:'Taille du marché',value:plan.marche_taille},{label:'Croissance',value:plan.marche_croissance},
    {label:'Part cible',value:plan.marche_part_cible},{label:'Clients potentiels',value:plan.marche_clients_potentiels}].filter(function(r){return r.value;});
  if (mStats.length) mBody += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">' +
    mStats.map(function(r){ return '<div style="padding:14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
      '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">'+esc(r.label)+'</div>' +
      '<div style="font-family:var(--serif);font-size:18px;color:var(--ink)">'+esc(clean(r.value))+'</div></div>'; }).join('') + '</div>';
  if (plan.marche_tendances && plan.marche_tendances.length) mBody += '<div style="margin-top:14px">' + lbl('Tendances 2025-2026') +
    plan.marche_tendances.map(function(t){ return '<div style="font-size:13.5px;color:var(--ink-2);padding:5px 0;border-bottom:1px solid var(--rule)">→ '+esc(t)+'</div>'; }).join('') + '</div>';
  if (mBody.trim()) html += card('Analyse de marché', mBody);

  // PROPOSITION DE VALEUR
  var pvBody = '';
  if (plan.proposition_valeur) pvBody += para(plan.proposition_valeur);
  if (plan.proposition_valeur_benefices && plan.proposition_valeur_benefices.length)
    pvBody += '<div style="display:flex;flex-direction:column;gap:6px;margin-top:12px">' +
      plan.proposition_valeur_benefices.map(function(b){ return '<div style="display:flex;gap:10px;font-size:13.5px;color:var(--ink-2)"><span style="color:var(--green);font-weight:600;flex-shrink:0">✓</span>'+esc(b)+'</div>'; }).join('') + '</div>';
  if (pvBody.trim()) html += card('Proposition de valeur', pvBody);

  // CONCURRENCE
  if (plan.concurrence_intro) html += card('Environnement concurrentiel', para(plan.concurrence_intro));
  if (plan.concurrents && plan.concurrents.length) {
    var bm = function(m){ return m==='haute'||m==='élevé'?badge(m,'red'):m==='moyenne'||m==='moyen'?badge(m,'accent'):badge(m,'muted'); };
    html += card('Analyse concurrentielle', plan.concurrents.map(function(c){
      return '<div style="padding:14px 0;border-bottom:1px solid var(--rule)">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px"><b style="font-size:14.5px">'+esc(c.nom)+'</b>'+bm(c.menace)+'</div>' +
        (c.description?'<p style="color:var(--ink-2);font-size:13.5px;margin:0 0 4px;line-height:1.5">'+esc(c.description)+'</p>':'') +
        (c.avantage_differentiel?'<p style="color:var(--green);font-size:12.5px;margin:4px 0 0">Notre avantage : '+esc(c.avantage_differentiel)+'</p>':'') +
        '</div>';
    }).join(''));
  }

  // MODÈLE ÉCO
  var meBody = '';
  if (plan.modele_economique) meBody += para(plan.modele_economique);
  if (plan.offres && plan.offres.length) meBody += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:14px">' +
    plan.offres.map(function(o){ return '<div style="padding:16px;border:1px solid var(--rule);border-radius:6px;background:var(--bg)">' +
      '<div style="font-size:14px;font-weight:600;color:var(--ink);margin-bottom:6px">'+esc(o.nom)+'</div>' +
      '<p style="font-size:13px;color:var(--ink-2);margin:0 0 8px;line-height:1.45">'+esc(o.description||'')+'</p>' +
      (o.prix?'<div style="font-family:var(--serif);font-size:20px;color:var(--accent)">'+esc(clean(o.prix))+'</div>':'') +
      '</div>'; }).join('') + '</div>';
  if (meBody.trim()) html += card('Modèle économique & offres', meBody);

  if (plan.strategie_commerciale) html += card('Stratégie commerciale', para(plan.strategie_commerciale));
  html += bloc12(plan);
  if (plan.aspects_juridiques) html += card('Aspects juridiques', para(plan.aspects_juridiques));
  if (plan.aspects_organisationnels) html += card('Organisation', para(plan.aspects_organisationnels));
  html += bloc8(plan);
  html += bloc9(plan);

  // FINANCES DÉTAIL
  if (plan.finances_detail && plan.finances_detail.length) html += card('Finances — tableau de bord',
    '<div style="display:flex;flex-direction:column">' +
    plan.finances_detail.map(function(f){ return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--rule)">' +
      '<span style="font-size:13.5px;color:var(--ink-2)">'+esc(f.label)+'</span>' +
      '<span style="font-family:var(--mono);font-size:13px;color:var(--ink);font-weight:600">'+esc(clean(f.valeur))+'</span></div>'; }).join('') + '</div>');

  html += bloc4(plan);
  html += bloc7(plan);
  html += bloc5(plan);

  // INVESTISSEMENTS
  if (plan.investissements && plan.investissements.length) html += card('Investissements',
    '<div style="display:flex;flex-direction:column">' +
    plan.investissements.map(function(inv){ return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--rule)">' +
      '<span style="font-size:13.5px;color:'+(inv.total?'var(--ink)':'var(--ink-2)')+';font-weight:'+(inv.total?'600':'400')+'">'+esc(inv.label)+'</span>' +
      '<span style="font-family:var(--mono);font-size:13px;color:'+(inv.total?'var(--accent)':'var(--ink)')+'">'+esc(clean(inv.montant))+'</span></div>'; }).join('') + '</div>');

  html += bloc11(plan);
  html += bloc10(plan);

  // RISQUES
  if (plan.risques && plan.risques.length) html += card('Risques & mitigation', plan.risques.map(function(r){
    var niv = r.niveau||'';
    var bT = niv==='élevé'||niv==='haute'?'red':niv==='moyen'||niv==='moyenne'?'accent':'muted';
    return '<div style="padding:14px 0;border-bottom:1px solid var(--rule)">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:6px"><b style="font-size:14px">'+esc(r.titre)+'</b>'+badge(niv,bT)+'</div>' +
      (r.solution?'<p style="color:var(--ink-2);font-size:13px;margin:0 0 4px;line-height:1.45">'+esc(r.solution)+'</p>':'') +
      (r.signal_alarme?'<p style="color:var(--accent);font-size:12px;margin:4px 0 0">🔔 '+esc(r.signal_alarme)+'</p>':'') +
      (r.solution_preventive?'<p style="color:var(--green);font-size:12px;margin:4px 0 0">🛡 '+esc(r.solution_preventive)+'</p>':'') +
      '</div>';
  }).join(''));

  // ACTIONS 90J
  if (plan.actions && plan.actions.length) html += card('Plan d\'action 90 jours', plan.actions.map(function(a){
    return '<div style="display:grid;grid-template-columns:80px 1fr;gap:14px;padding:12px 0;border-bottom:1px solid var(--rule);align-items:start">' +
      '<span style="font-family:var(--mono);font-size:10.5px;color:var(--ink-3);letter-spacing:0.08em;padding-top:2px">'+esc(a.phase)+'</span>' +
      '<div><b style="font-size:14px;display:block;margin-bottom:4px">'+esc(a.titre)+'</b><p style="color:var(--ink-2);font-size:13px;margin:0;line-height:1.45">'+esc(a.detail||'')+'</p></div></div>';
  }).join(''));

  // AIDES
  if (plan.aides_subventions && plan.aides_subventions.length) html += card('Aides & subventions', plan.aides_subventions.map(function(a){
    return '<div style="display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px 0;border-bottom:1px solid var(--rule);align-items:start">' +
      '<div><b style="font-size:13.5px;color:'+(a.applicable?'var(--green)':'var(--ink-3)')+'">'+esc(a.nom)+'</b>' +
      (a.priorite?' <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">· '+esc(a.priorite)+'</span>':'') +
      '<p style="color:var(--ink-2);font-size:13px;margin:4px 0 0">'+esc(a.conditions||'')+'</p></div>' +
      '<div style="text-align:right"><div style="font-family:var(--mono);font-size:12px;color:var(--ink)">'+esc(clean(a.montant||''))+'</div>' +
      (a.lien?'<div style="font-family:var(--mono);font-size:10px;color:var(--accent)">'+esc(a.lien)+'</div>':'') +
      '</div></div>';
  }).join(''));

  // KPIs
  if (plan.kpis && plan.kpis.length) html += card('KPIs à suivre',
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
    plan.kpis.map(function(k){ return '<div style="padding:14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
      '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">'+esc(k.nom)+'</div>' +
      '<div style="font-family:var(--serif);font-size:16px;color:var(--accent);margin-bottom:4px">'+esc(clean(k.cible||''))+'</div>' +
      '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">'+esc(k.frequence||'')+'</div></div>'; }).join('') + '</div>');

  // OUTILS
  if (plan.outils && plan.outils.length) html += card('Outils recommandés',
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">' +
    plan.outils.map(function(o){ return '<div style="padding:14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
      '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">'+esc(o.nom)+'</div>' +
      '<div style="font-size:12.5px;color:var(--ink-2);margin-bottom:6px;line-height:1.4">'+esc(o.usage||'')+'</div>' +
      (o.prix?'<div style="font-family:var(--mono);font-size:11px;color:var(--green)">'+esc(clean(o.prix))+'</div>':'') +
      '</div>'; }).join('') + '</div>');

  // DÉMARCHES
  if (plan.demarches_admin && plan.demarches_admin.length) html += card('Démarches administratives', plan.demarches_admin.map(function(s){
    return '<div style="display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--rule);align-items:start">' +
      '<div><b style="font-size:13.5px;color:var(--ink)">'+esc(s.etape)+'</b>' +
      (s.detail?'<p style="color:var(--ink-2);font-size:12.5px;margin:4px 0 0;line-height:1.4">'+esc(s.detail)+'</p>':'')+'</div>' +
      '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-3);white-space:nowrap">'+esc(s.delai||'')+'</span>' +
      '<span style="font-family:var(--mono);font-size:11px;color:var(--accent);white-space:nowrap">'+esc(s.cout||'')+'</span></div>';
  }).join(''));

  // EMAILS
  [['email_prospection','Email de prospection'],['email_fournisseur','Email fournisseur'],['email_relance','Email de relance']].forEach(function(e) {
    var em = plan[e[0]];
    if (em && (em.sujet||em.corps)) html += card(e[1],
      '<div style="background:var(--bg);border-radius:6px;padding:14px;border:1px solid var(--rule)">' +
      (em.sujet?'<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3);margin-bottom:4px">Objet : <span style="color:var(--ink)">'+esc(em.sujet)+'</span></div>':'') +
      (em.corps?'<pre style="font-size:13px;color:var(--ink-2);white-space:pre-wrap;margin:8px 0 0;line-height:1.5;font-family:inherit">'+esc(em.corps)+'</pre>':'') +
      '</div>');
  });

  // RESSOURCES GRATUITES
  if (d && d.ressources_gratuites_recommandees && d.ressources_gratuites_recommandees.length) html += card('Ressources gratuites',
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
    d.ressources_gratuites_recommandees.map(function(r){ return '<div style="padding:14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
      '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">'+esc(r.organisme)+'</div>' +
      '<div style="font-size:12.5px;color:var(--ink-2);margin-bottom:6px;line-height:1.4">'+esc(r.service||'')+'</div>' +
      '<div style="font-family:var(--mono);font-size:11px;color:var(--green)">'+esc(r.cout||'')+'</div>' +
      (r.url?'<div style="font-family:var(--mono);font-size:10px;color:var(--accent);margin-top:4px">'+esc(r.url)+'</div>':'') +
      '</div>'; }).join('') + '</div>');

  html += bloc6(plan, pid);

  // DOCS TÉLÉCHARGEABLES
  html += '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  html += lbl('Documents annexes — téléchargeables');
  html += '<div class="docs-grid" id="dDocsGrid"></div></div>';

  // DOSSIER CRÉATION
  html += '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  html += lbl('Dossier de création — documents juridiques');
  html += '<p style="font-size:13px;color:var(--ink-3);margin:0 0 14px;line-height:1.5">Statuts, checklist URSSAF, ouverture compte pro — pré-remplis pour ton projet.</p>';
  html += '<button onclick="generateDossier()" class="btn btn-ghost">Générer mon dossier complet →</button></div>';

  // BOUTONS
  html += '<div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap">' +
    '<button onclick="(function(){var r=document.getElementById(\'dashPlanResult\');if(r)r.style.display=\'none\';var f=document.querySelector(\'.gen-grid\');if(f)f.style.display=\'\';var b=document.querySelector(\'.gen-banner\');if(b)b.style.display=\'\';var h=document.querySelector(\'.page-head\');if(h)h.style.display=\'\';})()" class="btn btn-ghost">← Nouveau plan</button>' +
    '<button onclick="window.go&&window.go(\'expert\')" class="btn btn-accent">Affiner avec l\'Expert →</button></div>';

  html += '</div>';
  container.innerHTML = html;

  setTimeout(initCharts, 60);
  if (typeof fillDocumentsAnnexes === 'function') fillDocumentsAnnexes(plan);
  if (typeof fillBancabilite === 'function') fillBancabilite(plan);
  if (typeof applyReliabilityIndicators === 'function') applyReliabilityIndicators(container);
  if (typeof window.updateUsage === 'function') window.updateUsage();
};

})();
