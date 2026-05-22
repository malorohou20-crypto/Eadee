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
  Chart.defaults.animation = false;
  if (!window.eadeeCharts) window.eadeeCharts = {};
  _pending.forEach(function(c) {
    var el = document.getElementById(c.id);
    if (!el) return;
    var ex = Chart.getChart(el);
    if (ex) ex.destroy();
    try { window.eadeeCharts[c.id] = new Chart(el, c.cfg); } catch(e) { console.warn('chart err', c.id, e); }
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

// ── NORMALISEUR v3 → renderer ────────────────────────────
// Traduit le schéma EADEE v3 (objets imbriqués) en clés plates
// attendues par tous les blocs existants du renderer.
function normalizePlanForRenderer(plan) {
  // deep copy pour ne pas muter l'objet original
  var p;
  try { p = JSON.parse(JSON.stringify(plan)); } catch(e) { p = plan; }

  // ── meta → clés racines ──────────────────────────────────
  if (plan.meta && typeof plan.meta === 'object') {
    p.nom_business  = p.nom_business  || plan.meta.nom_business;
    p.nom_entreprise= p.nom_entreprise|| plan.meta.nom_business;
    p.tagline       = p.tagline       || plan.meta.tagline;
    p.pitch_30s     = p.pitch_30s     || plan.meta.pitch_30s;
  }

  // ── scores → note racine ─────────────────────────────────
  if (plan.scores && plan.scores.score_viabilite && plan.scores.score_viabilite.note !== undefined) {
    p.score_viabilite = plan.scores.score_viabilite.note;
  }

  // ── porteur_profil_financier ─────────────────────────────
  if (plan.porteur_projet && plan.porteur_projet.profil_financier_personnel) {
    p.porteur_profil_financier = plan.porteur_projet.profil_financier_personnel;
  }

  // ── resume_executif → vision_banquier + texte ────────────
  if (plan.resume_executif && typeof plan.resume_executif === 'object') {
    var re = plan.resume_executif;
    if (re.vision_banquier) {
      p.resume_vision_banquier = Object.assign({}, re.vision_banquier, {
        argument_principal_bancaire: re.vision_banquier.argument_principal_bancaire || re.vision_banquier.argument_principal,
        garanties: Array.isArray(re.vision_banquier.garanties_proposees) ? re.vision_banquier.garanties_proposees.join(', ') : re.vision_banquier.garanties_proposees,
      });
    }
    p.resume_executif = re.synthese_projet || '';
  }

  // ── presentation_projet → string ─────────────────────────
  if (plan.presentation_projet && typeof plan.presentation_projet === 'object') {
    var pp = plan.presentation_projet;
    var ppParts = [pp.origine_idee, pp.probleme_resolu, pp.vision_3_ans, pp.stade_actuel];
    if (pp.preuves_concept) ppParts.push('Preuves : ' + pp.preuves_concept);
    p.presentation_projet = ppParts.filter(Boolean).join(' — ');
  }

  // ── tresorerie → tresorerie_mensuelle ────────────────────
  if (plan.tresorerie && plan.tresorerie.tableau_12_mois) {
    p.tresorerie_mensuelle = plan.tresorerie.tableau_12_mois;
  }

  // ── projections_revenus → rev_mensuel + jalons + scenarios ─
  if (plan.projections_revenus && typeof plan.projections_revenus === 'object') {
    var pr = plan.projections_revenus;
    if (pr.tableau_mensuel_an1 && pr.tableau_mensuel_an1.length) {
      p.rev_mensuel = pr.tableau_mensuel_an1.map(function(m) {
        var v = String(m.ca_ht || '0').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').replace(/[^0-9.]/g, '');
        return parseFloat(v) || 0;
      });
    }
    if (pr.jalons && pr.jalons.length) {
      pr.jalons.forEach(function(j) {
        if (j.mois === 1)  p.rev_m1  = j.ca;
        if (j.mois === 3)  p.rev_m3  = j.ca;
        if (j.mois === 6)  p.rev_m6  = j.ca;
        if (j.mois === 12) p.rev_m12 = j.ca;
        if (j.mois === 24) p.rev_m24 = j.ca;
        if (j.mois === 36) p.rev_m36 = j.ca;
      });
    }
    if (pr.scenarios) p.scenarios = pr.scenarios;
  }

  // ── marche → clés plates ─────────────────────────────────
  if (plan.marche && typeof plan.marche === 'object') {
    var mk = plan.marche;
    p.marche_taille           = mk.taille_france         || mk.taille_marche_france;
    p.marche_croissance       = mk.taux_croissance        || mk.taux_croissance_annuel;
    p.marche_part_cible       = mk.part_marche_visee_an1;
    p.marche_clients_potentiels = null;
    p.marche_analyse          = mk.analyse_sectorielle;
    p.marche_tendances        = Array.isArray(mk.tendances_cles) ? mk.tendances_cles : null;
  }

  // ── proposition_valeur → string + bénéfices ──────────────
  if (plan.proposition_valeur && typeof plan.proposition_valeur === 'object') {
    var pv = plan.proposition_valeur;
    p.proposition_valeur = [pv.usp, pv.preuves_valeur].filter(Boolean).join(' — ');
    p.proposition_valeur_benefices = Array.isArray(pv.benefices_clients) ? pv.benefices_clients : null;
  }

  // ── modele_economique → string + offres ──────────────────
  if (plan.modele_economique && typeof plan.modele_economique === 'object') {
    var me = plan.modele_economique;
    p.modele_economique = [
      me.type ? 'Type : ' + me.type : null,
      me.description,
      me.panier_moyen ? 'Panier moyen : ' + me.panier_moyen : null,
      me.frequence_achat ? 'Fréquence : ' + me.frequence_achat : null,
    ].filter(Boolean).join(' — ');
    p.offres = (me.offres || []).map(function(o) {
      return Object.assign({}, o, { prix: o.prix || o.prix_ht });
    });
  }

  // ── strategie_commerciale → string ──────────────────────
  if (plan.strategie_commerciale && typeof plan.strategie_commerciale === 'object') {
    var sc2 = plan.strategie_commerciale;
    p.strategie_commerciale = [
      sc2.tunnel_vente,
      sc2.strategie_prix,
      Array.isArray(sc2.canaux_distribution) ? 'Canaux : ' + sc2.canaux_distribution.join(', ') : null,
      sc2.objectif_clients_m3  ? 'Obj. M3 : '  + sc2.objectif_clients_m3  + ' clients' : null,
      sc2.objectif_clients_m12 ? 'Obj. M12 : ' + sc2.objectif_clients_m12 + ' clients' : null,
    ].filter(Boolean).join(' — ');
  }

  // ── aspects_juridiques → string ──────────────────────────
  if (plan.aspects_juridiques && typeof plan.aspects_juridiques === 'object') {
    var aj = plan.aspects_juridiques;
    p.aspects_juridiques = [
      aj.statut_recommande ? 'Statut : ' + aj.statut_recommande : null,
      aj.justification,
      aj.regime_fiscal ? 'Fiscal : ' + aj.regime_fiscal : null,
      aj.regime_social ? 'Social : ' + aj.regime_social : null,
    ].filter(Boolean).join(' — ');
  }

  // ── aspects_organisationnels → string + outils ───────────
  if (plan.aspects_organisationnels && typeof plan.aspects_organisationnels === 'object') {
    var ao = plan.aspects_organisationnels;
    var locTxt = ao.locaux && ao.locaux.necessaire
      ? 'Local : ' + (ao.locaux.type || 'requis') + (ao.locaux.loyer_mensuel ? ' — ' + ao.locaux.loyer_mensuel : '')
      : null;
    p.aspects_organisationnels = [
      ao.structure_equipe ? 'Équipe : ' + ao.structure_equipe : null,
      locTxt,
      ao.outils && ao.outils.length ? ao.outils.length + ' outil(s) recommandé(s)' : null,
    ].filter(Boolean).join(' — ');
    if (ao.outils && ao.outils.length) {
      p.outils = ao.outils.map(function(o) {
        return { nom: o.outil, usage: o.usage, prix: o.cout_mensuel };
      });
    }
  }

  // ── finances_detail → array [{label, valeur}] ────────────
  if (plan.finances_detail && typeof plan.finances_detail === 'object' && !Array.isArray(plan.finances_detail)) {
    var fd = plan.finances_detail;
    var fdArr = [];
    if (fd.taux_marge_brute)     fdArr.push({ label: 'Marge brute',        valeur: fd.taux_marge_brute });
    if (fd.taux_marge_nette_an1) fdArr.push({ label: 'Marge nette An1',    valeur: fd.taux_marge_nette_an1 });
    if (fd.taux_marge_nette_an3) fdArr.push({ label: 'Marge nette An3',    valeur: fd.taux_marge_nette_an3 });
    if (fd.total_charges_fixes)  fdArr.push({ label: 'Charges fixes/mois', valeur: fd.total_charges_fixes });
    if (fd.bfr && fd.bfr.calcul) fdArr.push({ label: 'BFR',               valeur: fd.bfr.calcul });
    p.finances_detail = fdArr;
  }

  // ── investissements → array [{label, montant, total}] ────
  if (plan.investissements && typeof plan.investissements === 'object' && !Array.isArray(plan.investissements)) {
    var inv = plan.investissements;
    var invArr = (inv.postes || []).map(function(item) {
      return { label: item.poste, montant: item.montant };
    });
    if (inv.total) invArr.push({ label: 'TOTAL', montant: inv.total, total: true });
    p.investissements = invArr;
  }

  // ── concurrents → champs compatibles renderer ────────────
  if (Array.isArray(plan.concurrents)) {
    p.concurrents = plan.concurrents.map(function(c) {
      return Object.assign({}, c, {
        menace: c.niveau_menace || c.menace,
        description: [
          c.points_forts  ? '✓ ' + c.points_forts  : null,
          c.points_faibles ? '✗ ' + c.points_faibles : null,
        ].filter(Boolean).join('  '),
        avantage_differentiel: c.notre_avantage || c.avantage_differentiel,
      });
    });
  }

  // ── risques → champs compatibles renderer ────────────────
  if (Array.isArray(plan.risques)) {
    p.risques = plan.risques.map(function(r) {
      var niv = r.impact === 'élevé' || r.probabilite === 'élevée' ? 'élevé'
              : r.impact === 'moyen'  || r.probabilite === 'moyenne' ? 'moyen'
              : 'faible';
      return Object.assign({}, r, {
        titre: r.risque || r.titre,
        niveau: niv,
        solution: r.solution_curative || r.solution,
      });
    });
  }

  // ── plan_actions_90j.phases → actions [{phase,titre,detail}]
  if (plan.plan_actions_90j && plan.plan_actions_90j.phases && !plan.actions) {
    p.actions = plan.plan_actions_90j.phases.map(function(ph) {
      return {
        phase: ph.semaine,
        titre: ph.titre,
        detail: (ph.actions || []).join(' • ') + (ph.livrable ? ' → ' + ph.livrable : ''),
      };
    });
  }

  // ── aides_subventions → array [{nom,montant,...}] ────────
  if (plan.aides_subventions && typeof plan.aides_subventions === 'object' && !Array.isArray(plan.aides_subventions)) {
    p.aides_subventions = (plan.aides_subventions.eligibles || []).map(function(a) {
      return {
        nom: a.aide,
        organisme: a.organisme,
        montant: a.montant,
        conditions: Array.isArray(a.conditions) ? a.conditions.join('. ') : (a.conditions || ''),
        priorite: a.priorite,
        applicable: a.priorite === 'haute' || a.priorite === 'moyenne',
        lien: null,
      };
    });
  }

  // ── kpis → array [{nom, cible, frequence}] ───────────────
  if (plan.kpis && typeof plan.kpis === 'object' && !Array.isArray(plan.kpis)) {
    p.kpis = (plan.kpis.operationnels || []).map(function(k) {
      return { nom: k.kpi, cible: k.cible_m12 || k.cible_m3, frequence: k.comment_mesurer };
    });
  }

  // ── acquisition → canaux normalisés (array) ─────────────
  if (plan.acquisition && typeof plan.acquisition === 'object' && !Array.isArray(plan.acquisition)) {
    p.acquisition = (plan.acquisition.canaux || []).map(function(c) {
      return Object.assign({}, c, { cac: c.cac || c.cac_estime });
    });
  } else if (Array.isArray(plan.acquisition)) {
    p.acquisition = plan.acquisition.map(function(c) {
      return Object.assign({}, c, { cac: c.cac || c.cac_estime });
    });
  }

  // ── tableau_amortissement → aliases renderer ─────────────
  if (plan.tableau_amortissement && typeof plan.tableau_amortissement === 'object') {
    var ta = plan.tableau_amortissement;
    // analyse_remboursement → analyse_capacite_remboursement (nom renderer)
    if (ta.analyse_remboursement && !ta.analyse_capacite_remboursement) {
      p.tableau_amortissement = Object.assign({}, ta, {
        analyse_capacite_remboursement: ta.analyse_remboursement,
        conseils_negociation_banque: ta.conseils_negociation || ta.conseils_negociation_banque,
      });
    } else if (!ta.analyse_capacite_remboursement) {
      p.tableau_amortissement = Object.assign({}, ta, {
        conseils_negociation_banque: ta.conseils_negociation || ta.conseils_negociation_banque,
      });
    }
  }

  // ── demarches_administratives → demarches_admin ──────────
  if (Array.isArray(plan.demarches_administratives) && !plan.demarches_admin) {
    p.demarches_admin = plan.demarches_administratives.map(function(d) {
      return { etape: d.etape, detail: d.organisme, delai: d.delai_reel, cout: d.cout };
    });
  }

  // ── templates_communication → flat email keys ────────────
  if (plan.templates_communication && typeof plan.templates_communication === 'object') {
    var tc = plan.templates_communication;
    var toEmail = function(e) { return e ? { sujet: e.objet, corps: e.corps } : null; };
    if (tc.email_prospection_client)  p.email_prospection        = toEmail(tc.email_prospection_client);
    if (tc.email_fournisseur)         p.email_fournisseur         = toEmail(tc.email_fournisseur);
    if (tc.email_relance)             p.email_relance             = toEmail(tc.email_relance);
    if (tc.email_presentation_banque) p.email_presentation_banque = toEmail(tc.email_presentation_banque);
  }

  // ── persona → champs compatibles renderer ────────────────
  if (plan.persona && typeof plan.persona === 'object') {
    p.persona = Object.assign({}, plan.persona, {
      nom: plan.persona.nom_fictif || plan.persona.nom,
      douleurs: plan.persona.probleme_principal || plan.persona.douleurs,
      ou_le_trouver: plan.persona.canal_prefere || plan.persona.ou_le_trouver,
      motivations: Array.isArray(plan.persona.motivations) ? plan.persona.motivations.join(', ') : plan.persona.motivations,
    });
  }

  // ── annexes_checklist (objet catégories → array isNewFmt) ─
  if (plan.annexes_checklist && typeof plan.annexes_checklist === 'object' && !Array.isArray(plan.annexes_checklist)) {
    var clObj = plan.annexes_checklist;
    var clArr = Object.keys(clObj)
      .filter(function(k) { return k.indexOf('categorie_') === 0 && clObj[k] && Array.isArray(clObj[k].items) && clObj[k].items.length > 0 && clObj[k].applicable !== false; })
      .sort(function(a, b) { return ((clObj[a] && clObj[a].ordre) || 0) - ((clObj[b] && clObj[b].ordre) || 0); })
      .map(function(k) {
        return {
          titre: clObj[k].titre,
          ordre: clObj[k].ordre,
          items: (clObj[k].items || []).map(function(item) {
            // tres_important → très_important pour le badge renderer
            return Object.assign({}, item, {
              statut: item.statut === 'tres_important' ? 'très_important' : (item.statut || ''),
              document: item.document || String(item),
            });
          }),
        };
      });
    p.annexes_checklist = clArr.length ? clArr : null;
  }

  return p;
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

  function scoreCard(title, note, criteria, det, interp, msgBanq, amelioration) {
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
          '<span style="font-family:var(--mono);font-size:10px;color:var(--ink-3);width:90px;flex-shrink:0">' + esc(cr[1]) + '</span>' +
          miniBar(pts, cr[2]) +
          '<span style="font-family:var(--mono);font-size:10px;color:var(--ink-3);width:28px;text-align:right">' + pts + '/' + cr[2] + '</span></div>';
      });
      h += '</div>';
    }
    if (interp) h += '<p style="font-size:13px;color:var(--ink-3);font-style:italic;margin:0 0 10px;line-height:1.5">' + esc(interp) + '</p>';
    if (msgBanq) h += '<div style="border-left:2px solid var(--accent);background:var(--accent-bg);padding:10px 14px;border-radius:0 4px 4px 0">' +
      '<p style="font-family:var(--serif);font-style:italic;color:var(--accent-ink);font-size:13px;margin:0;line-height:1.5">' + esc(msgBanq) + '</p></div>';
    // Plan d'amélioration conditionnel (note < 70)
    if (amelioration && amelioration.applicable && note < 70 && amelioration.actions && amelioration.actions.length) {
      h += '<div style="margin-top:14px;padding:12px 14px;background:var(--bg);border:1px solid var(--rule);border-radius:6px">';
      h += '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:8px">Plan d\'amélioration</div>';
      amelioration.actions.forEach(function(a) {
        h += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:12.5px;line-height:1.4">' +
          '<span style="font-family:var(--mono);font-size:10px;color:var(--ink-3);flex-shrink:0;padding-top:1px">' + (a.priorite||'·') + '.</span>' +
          '<div><span style="color:var(--ink)">' + esc(a.action||'') + '</span>' +
          (a.delai ? '<span style="color:var(--ink-3);font-family:var(--mono);font-size:10px;margin-left:6px">' + esc(a.delai) + '</span>' : '') +
          '</div></div>';
      });
      if (amelioration.message) h += '<p style="font-size:12px;color:var(--ink-3);font-style:italic;margin:6px 0 0;line-height:1.4">' + esc(amelioration.message) + '</p>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  var svC = [['taille_marche','Taille marché',15],['differenciation','Différenciation',20],
             ['proposition_valeur','Prop. valeur',15],['preuves_marche','Preuves marché',15],
             ['experience_secteur','Expérience',20],['clarte_modele_eco','Modèle éco',15]];
  var sbC = [['apport_suffisant','Apport',25],['point_mort_rapide','Point mort',20],
             ['tresorerie_positive_m6','Tréso M6',20],['garanties_disponibles','Garanties',15],
             ['secteur_risque_faible','Risque sect.',10],['experience_porteur','Expérience',10]];

  var out = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';
  if (svN) out += scoreCard('Score de viabilité', svN, svC, sv.detail, sv.interpretation, null, null);
  if (sbN) out += scoreCard('Score de bancabilité', sbN, sbC, sb.detail, sb.interpretation, sb.message_banquier, sb.plan_amelioration);
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
  h += '<div style="display:grid;grid-template-columns:1fr 1fr ' + (donutItems.length ? 'auto' : '') + ';gap:24px">';

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
    var totalFmt = totalRes >= 1000 ? (totalRes/1000).toFixed(0)+'k€' : totalRes.toLocaleString('fr-FR')+'€';
    h += '<div style="display:flex;align-items:center;gap:16px">';
    // Donut 200x200 with center label
    h += '<div style="position:relative;width:200px;height:200px;flex-shrink:0">' +
      '<canvas id="' + cid + '"></canvas>' +
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none">' +
      '<div style="font-family:var(--mono);font-size:14px;font-weight:700;color:var(--ink)">' + totalFmt + '</div>' +
      '<div style="font-family:var(--mono);font-size:9px;color:var(--ink-3)">ressources</div></div></div>';
    // Legend RIGHT with label + amount
    h += '<div style="display:flex;flex-direction:column;gap:8px">';
    donutItems.forEach(function(d) {
      var amtFmt = d.v >= 1000 ? (d.v/1000).toFixed(0)+'k€' : d.v.toLocaleString('fr-FR')+'€';
      h += '<div style="display:flex;align-items:center;gap:7px">' +
        '<div style="width:10px;height:10px;border-radius:2px;background:' + d.c + ';flex-shrink:0"></div>' +
        '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-2);white-space:nowrap">' + esc(d.l) + '</span>' +
        '<span style="font-family:var(--mono);font-size:11px;color:var(--ink);font-variant-numeric:tabular-nums;margin-left:4px">' + amtFmt + '</span></div>';
    });
    h += '</div>';
    h += '</div>';
    queue(cid, { type:'doughnut', data:{ datasets:[{ data:donutItems.map(function(d){return d.v;}), backgroundColor:donutItems.map(function(d){return d.c;}), borderWidth:0 }] },
      options:{ animation:false, maintainAspectRatio:false, cutout:'65%', plugins:{legend:{display:false},tooltip:{enabled:false}} } });
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
      {label:'Capital restant dû',data:capData,borderColor:CC.accent,borderWidth:2,fill:true,backgroundColor:'rgba(200,75,47,0.08)',tension:0.3,pointRadius:3},
      {label:'Intérêts cumulés',data:intData,borderColor:CC.green,borderWidth:1.5,borderDash:[4,4],fill:false,tension:0.3,pointRadius:2}
    ]}, options:{animation:false,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{
      title:function(items){ return items[0].label; },
      label:function(item){
        var ds = item.dataset.label;
        return ds + ' : ' + Math.round(item.parsed.y).toLocaleString('fr-FR') + '€';
      }
    }}},
      scales:{x:{grid:{color:CC.grid},ticks:{color:CC.text}},y:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr-FR')+'€';}}}}} });
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

  // Collect bloquant IDs for dynamic ring (new format only)
  var bloquantIds = [];
  if (isNewFmt) {
    cl.forEach(function(cat, ci) {
      (cat.items || []).forEach(function(item, ii) {
        var st = typeof item === 'string' ? '' : (item.statut||'');
        if (st === 'bloquant') bloquantIds.push(lsBase + ci + '_' + ii);
      });
    });
  }
  var initChecked = bloquantIds.filter(function(id){ return localStorage.getItem(id) === '1'; }).length;
  var bloquantTotal = bloquantIds.length;
  var initPct = bloquantTotal ? Math.round(initChecked/bloquantTotal*100) : 0;

  // Inline JS for onchange ring update (escaped for HTML attribute)
  var ringUpdateFn = '(function(rId){' +
    'var w=document.getElementById("bancRing_"+rId);if(!w)return;' +
    'var ids=JSON.parse(w.getAttribute("data-ids")||"[]");' +
    'var n=ids.filter(function(i){return localStorage.getItem(i)==="1";}).length;' +
    'var ch=window.eadeeCharts&&window.eadeeCharts[rId];' +
    'if(ch){ch.data.datasets[0].data=[n,Math.max(0,ids.length-n)];ch.update("none");}' +
    'var p=document.getElementById("bancPct_"+rId);' +
    'if(p)p.textContent=Math.round(ids.length?n/ids.length*100:0)+"%";' +
    '})("' + ringId + '")';

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Checklist bancabilité</div>';

  // Progress ring
  h += '<div style="display:flex;align-items:center;gap:20px;margin-bottom:18px">';
  h += '<div id="bancRing_' + ringId + '" data-ids=\'' + JSON.stringify(bloquantIds) + '\' style="position:relative;width:100px;height:100px;flex-shrink:0"><canvas id="' + ringId + '"></canvas>' +
    '<div id="bancPct_' + ringId + '" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--mono);font-size:16px;font-weight:600;color:var(--ink);text-align:center">' + initPct + '%</div></div>';
  h += '<div><div style="font-family:var(--mono);font-size:12px;color:var(--ink-2)">' + totalItems + ' documents à préparer</div>' +
    (bloquantTotal ? '<div style="font-family:var(--mono);font-size:11px;color:var(--red);margin-top:4px">' + bloquantTotal + ' bloquants</div>' : '') + '</div>';
  h += '</div>';

  if (!isNewFmt) {
    h += '<div style="display:flex;flex-direction:column;gap:5px">';
    cl.forEach(function(item, i) {
      var cbId = lsBase + i;
      var chk = localStorage.getItem(cbId) === '1' ? 'checked' : '';
      h += '<label style="display:flex;align-items:flex-start;gap:10px;padding:9px 12px;background:var(--bg);border:1px solid var(--rule);border-radius:5px;cursor:pointer">' +
        '<input type="checkbox" ' + chk + ' onchange="localStorage.setItem(\'' + cbId + '\',this.checked?\'1\':\'0\');" style="margin-top:2px;accent-color:var(--accent);flex-shrink:0">' +
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
          '<input type="checkbox" ' + chk + ' onchange="localStorage.setItem(\'' + cbId + '\',this.checked?\'1\':\'0\');' + ringUpdateFn + '" style="margin-top:2px;accent-color:var(--accent)">' +
          '<span style="flex:1;font-size:13px;color:var(--ink-2)">' + esc(txt) + '</span>' +
          (st ? badge(st,bT) : '') + '</label>';
      });
      h += '</div></div>';
    });
  }
  h += '</div>';

  queue(ringId, { type:'doughnut', data:{ datasets:[{ data:[initChecked, Math.max(0, bloquantTotal - initChecked)], backgroundColor:[CC.accent, CC.grid], borderWidth:0 }] },
    options:{ animation:false, maintainAspectRatio:false, cutout:'70%', plugins:{legend:{display:false},tooltip:{enabled:false}} } });
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
    { type:'bar', data:mois, backgroundColor:'rgba(184,176,160,0.3)', borderRadius:2, yAxisID:'y' },
    { type:'line', data:mlbls.map(function(){return 0;}), borderColor:CC.grid, borderWidth:1, borderDash:[4,4], pointRadius:0, fill:false, yAxisID:'y' }
  ]}, options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false},
    tooltip:{
      callbacks:{
        title:function(items){
          var i=items[0]&&items[0].dataIndex;
          return (i!==undefined&&tm[i])?(tm[i].mois||''):'';
        },
        label:function(){return '';},
        afterBody:function(items){
          var i=items[0]&&items[0].dataIndex;
          if(i===undefined||!tm[i])return[];
          var r=tm[i];
          function cv(s){return String(s||'').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g,'$1').trim();}
          var lines=[];
          if(r.encaissements)lines.push('Enc : '+cv(r.encaissements));
          if(r.decaissements)lines.push('Déc : '+cv(r.decaissements));
          if(r.solde_mois)lines.push('Mois : '+cv(r.solde_mois));
          if(r.solde_cumule)lines.push('Cumulé : '+cv(r.solde_cumule));
          return lines;
        }
      }
    }
  },
    scales:{ x:{grid:{color:CC.grid},ticks:{color:CC.text}},
      y:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr-FR')+'€';}}} } } });

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
  var prRev = plan.projections_revenus || {};

  // ── Construire 36 mois : An1 réel (12 mois) + An2/An3 interpolés (12 mois chacun) ──
  var mnoms12 = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  var an1Data = rm.slice(0, 12); // CA mensuel An1 réel

  // Récupérer CA An2 et An3 depuis jalons M24/M36 ou scenarios.realiste
  var sc = plan.scenarios || {};
  var caAn1Total = an1Data.reduce(function(s,v){ return s + (typeof v === 'number' ? v : numVal(v)); }, 0);
  // An3 : depuis scenarios.realiste.ca_an3 (annuel) — priorité 1
  var caAn3Total = numVal((sc.realiste || {}).ca_an3) || 0;
  if (!caAn3Total && plan.rev_m36) caAn3Total = numVal(plan.rev_m36) * 12; // fallback jalon M36 x12
  if (!caAn3Total) caAn3Total = caAn1Total * 1.55; // fallback estimation +55%
  // An2 : interpolation linéaire An1→An3 (pas de valeur directe dans le schéma)
  var caAn2Total = (caAn1Total + caAn3Total) / 2;
  if (plan.rev_m24) { var m24 = numVal(plan.rev_m24) * 12; if (m24 > 0) caAn2Total = m24; }
  var caAn2Mensuel = caAn2Total / 12;
  var caAn3Mensuel = caAn3Total / 12;

  var lbls36 = [];
  var data36 = [];
  mnoms12.forEach(function(m, i) {
    lbls36.push(m + ' An1');
    data36.push(typeof an1Data[i] === 'number' ? an1Data[i] : numVal(an1Data[i]));
  });
  mnoms12.forEach(function(m) {
    lbls36.push(m + ' An2');
    data36.push(Math.round(caAn2Mensuel));
  });
  mnoms12.forEach(function(m) {
    lbls36.push(m + ' An3');
    data36.push(Math.round(caAn3Mensuel));
  });

  var resData12 = (prRev && prRev.tableau_mensuel_an1)
    ? prRev.tableau_mensuel_an1.map(function(m){ return numVal(m.resultat_net); })
    : [];
  // Étendre résultat net sur 36 mois (An2/An3 estimés)
  var resData36 = resData12.slice(0, 12);
  var resAn1Last = resData36.length ? resData36[resData36.length-1] : 0;
  var growthFactor = caAn1Total > 0 ? (caAn2Total / caAn1Total) : 1.25;
  for (var i2 = 0; i2 < 12; i2++) resData36.push(Math.round(resAn1Last * growthFactor * (1 + i2 * 0.02)));
  var growthFactor3 = caAn1Total > 0 ? (caAn3Total / caAn1Total) : 1.55;
  for (var i3 = 0; i3 < 12; i3++) resData36.push(Math.round(resAn1Last * growthFactor3 * (1 + i3 * 0.01)));

  var jalons = [
    {l:'M+1',v:numVal(plan.rev_m1)},{l:'M+3',v:numVal(plan.rev_m3)},{l:'M+6',v:numVal(plan.rev_m6)},
    {l:'An1',v:numVal(plan.rev_m12)},{l:'An2',v:numVal(plan.rev_m24)},{l:'An3',v:numVal(plan.rev_m36)}
  ].filter(function(j){ return j.v > 0; });

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Projections de revenus — 36 mois</div>';
  h += cvs(cid, 280);
  h += legend([{c:CC.accent,l:'CA mensuel An1'},{c:CC.orange,l:'CA interpolé An2'},{c:CC.green,l:'CA interpolé An3'},{c:CC.mint,l:'Résultat net (estimé)'}]);

  queue(cid, { type:'line', data:{ labels:lbls36, datasets:[
    {
      label:'CA An1',
      data:data36.slice(0,12).concat(new Array(24).fill(null)),
      borderColor:CC.accent, borderWidth:2, fill:true, backgroundColor:'rgba(200,75,47,0.06)', tension:0.4,
      pointRadius:2, spanGaps:false
    },
    {
      label:'CA An2 (interpolé)',
      data:new Array(12).fill(null).concat(data36.slice(12,24)).concat(new Array(12).fill(null)),
      borderColor:CC.orange, borderWidth:2, fill:true, backgroundColor:'rgba(232,168,124,0.06)', tension:0.3,
      pointRadius:1, borderDash:[5,3], spanGaps:false
    },
    {
      label:'CA An3 (interpolé)',
      data:new Array(24).fill(null).concat(data36.slice(24,36)),
      borderColor:CC.green, borderWidth:2, fill:true, backgroundColor:'rgba(58,125,68,0.06)', tension:0.3,
      pointRadius:1, borderDash:[5,3], spanGaps:false
    },
    {
      label:'Résultat net',
      data:resData36,
      borderColor:CC.mint, borderWidth:1.5, borderDash:[4,4], fill:false, tension:0.3, pointRadius:0
    },
    {
      data:lbls36.map(function(){return 0;}),
      borderColor:CC.grid, borderWidth:1, borderDash:[4,4], pointRadius:0, fill:false
    }
  ]}, options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false}},
    scales:{
      x:{ grid:{color:CC.grid}, ticks:{ color:CC.text, maxTicksLimit:18,
        callback:function(val, idx){ return [0,11,12,23,24,35].indexOf(idx) !== -1 ? this.getLabelForValue(val) : ''; }
      }},
      y:{ grid:{color:CC.grid}, ticks:{color:CC.text, callback:function(v){return v.toLocaleString('fr')+'€';}}, min:0 }
    }
  }});

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
    var pmIdx = (parseInt(clean(sr.mois_atteinte_prevu||'0'))||0) - 1;
    h += cvs(cid, 220);
    h += legend([{c:CC.accent,l:'CA réel'},{c:CC.red,l:'Seuil de rentabilité'}]);
    queue(cid, { type:'line', data:{ labels:lbls, datasets:[
      {data:rm, borderColor:CC.accent, borderWidth:2, fill:false, tension:0.4, pointRadius:3},
      {data:lbls.map(function(){return seuil;}), borderColor:CC.red, borderDash:[5,4], borderWidth:1.5, fill:false, pointRadius:0}
    ]}, options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ x:{grid:{color:CC.grid},ticks:{color:CC.text}},
        y:{grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr')+'€';}},min:0} } },
    plugins:[{
      id:'pmLabel_'+cid,
      afterDatasetsDraw:function(chart){
        if(pmIdx<0||pmIdx>=rm.length)return;
        var ctx2=chart.ctx;
        var xAxis=chart.scales.x;
        var yAxis=chart.scales.y;
        var x=xAxis.getPixelForValue(pmIdx);
        var y=yAxis.getPixelForValue(rm[pmIdx]||seuil);
        ctx2.save();
        ctx2.fillStyle='#c84b2f';
        ctx2.beginPath();
        ctx2.arc(x,y,6,0,Math.PI*2);
        ctx2.fill();
        ctx2.font="600 11px 'JetBrains Mono', monospace";
        ctx2.fillStyle='#c84b2f';
        ctx2.textAlign='center';
        ctx2.fillText('Point mort',x,y-12);
        ctx2.restore();
      }
    }]});
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

  // ── Ancien format (bp.annees[]) ─────────────────────────
  if (bp.annees && bp.annees.length) {
    var annees = bp.annees;
    var cid0 = uid();
    var lbls0 = annees.map(function(a){ return 'An'+a.annee; });
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
    var datasets0 = actifDS.concat(passifDS).map(function(ds) {
      return { label:ds.lbl, data:annees.map(function(a){ return numVal(a[ds.s]&&a[ds.s][ds.key]); }),
        backgroundColor:ds.c, stack:ds.s, borderRadius:2 };
    });
    var h0 = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
    h0 += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:16px">Bilan prévisionnel</div>';
    h0 += cvs(cid0, 220);
    queue(cid0, { type:'bar', data:{labels:lbls0,datasets:datasets0},
      options:{ animation:false, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{x:{stacked:true,grid:{color:CC.grid},ticks:{color:CC.text}},
          y:{stacked:true,grid:{color:CC.grid},ticks:{color:CC.text,callback:function(v){return v.toLocaleString('fr')+'€';}}}} } });
    h0 += legend(actifDS.concat(passifDS).map(function(ds){ return {c:ds.c,l:ds.lbl}; }));
    return h0 + '</div>';
  }

  // ── Nouveau format (bp.annee_1 / annee_2 / annee_3) ─────
  function hasContent(yr) {
    if (!yr || !yr.actif) return false;
    return Object.keys(yr.actif).some(function(k) {
      var v = yr.actif[k];
      return v && v !== '{}' && clean(v) !== '{}';
    });
  }
  var years = [];
  if (hasContent(bp.annee_1)) years.push({label:'An 1', data: bp.annee_1});
  if (hasContent(bp.annee_2)) years.push({label:'An 2', data: bp.annee_2});
  if (hasContent(bp.annee_3)) years.push({label:'An 3', data: bp.annee_3});
  if (!years.length) return '';

  var tabBase = uid();

  // onclick : border-bottom sur le btn actif, pas de bg coloré
  function btnCode(i) {
    var code = '';
    years.forEach(function(_, j) {
      code += 'document.getElementById(\'' + tabBase + '_p' + j + '\').style.display=\'' + (j===i?'block':'none') + '\';';
    });
    code += 'var bs=this.parentNode.children;for(var k=0;k<bs.length;k++){bs[k].style.borderBottom=\'2px solid transparent\';bs[k].style.color=\'var(--ink-3)\';}';
    code += 'this.style.borderBottom=\'2px solid var(--accent)\';this.style.color=\'var(--ink)\';';
    return code;
  }

  var actifMap  = {immobilisations_nettes:'Immobilisations nettes',stocks:'Stocks',creances_clients:'Créances clients',disponibilites:'Disponibilités',total_actif:'TOTAL ACTIF'};
  var passifMap = {capital_social:'Capital social',reserves:'Réserves',resultat:'Résultat net',dettes_financieres:'Dettes financières',dettes_fournisseurs:'Dettes fournisseurs',dettes_fiscales_sociales:'Dettes fiscales & sociales',total_passif:'TOTAL PASSIF'};

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:0">Bilan prévisionnel</div>';

  // ── Graphique barres empilées An1/An2/An3 ──
  var bilCid = uid();
  var bilLabels = years.map(function(yr){ return yr.label; });
  var bilActifKeys = ['immobilisations_nettes','stocks','creances_clients','disponibilites'];
  var bilActifColors = ['#c84b2f','#e8a87c','#b8b0a0','#3a7d44'];
  var bilActifLabels = ['Immobilisations','Stocks','Créances','Disponibilités'];
  var bilPassifKeys = ['capital_social','dettes_financieres','dettes_fournisseurs'];
  var bilPassifColors = ['#c84b2f','#b8b0a0','#e8a87c'];
  var bilPassifLabels = ['Capitaux propres','Dettes fin.','Autres dettes'];

  var bilDatasets = [];
  bilActifKeys.forEach(function(k,ki){
    bilDatasets.push({
      label:bilActifLabels[ki],
      data:years.map(function(yr){ return numVal((yr.data.actif||{})[k]); }),
      backgroundColor:bilActifColors[ki],
      stack:'actif',
      borderRadius:2
    });
  });
  bilPassifKeys.forEach(function(k,ki){
    bilDatasets.push({
      label:bilPassifLabels[ki],
      data:years.map(function(yr){ return numVal((yr.data.passif||{})[k]); }),
      backgroundColor:bilPassifColors[ki],
      stack:'passif',
      borderRadius:2
    });
  });

  var hasBilData = bilDatasets.some(function(ds){ return ds.data.some(function(v){return v>0;}); });
  if (hasBilData) {
    h += cvs(bilCid, 220);
    var bilLegItems = bilActifLabels.map(function(l,i){ return {c:bilActifColors[i],l:l}; })
      .concat(bilPassifLabels.map(function(l,i){ return {c:bilPassifColors[i],l:l}; }));
    h += legend(bilLegItems);
    queue(bilCid, {
      type:'bar',
      data:{ labels:bilLabels, datasets:bilDatasets },
      options:{
        animation:false,
        maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{
          x:{ stacked:true, grid:{ color:CC.grid }, ticks:{ color:CC.text } },
          y:{ stacked:true, grid:{ color:CC.grid }, ticks:{ color:CC.text, callback:function(v){ return v.toLocaleString('fr-FR')+'€'; } } }
        }
      }
    });
  }

  // ── Onglets An 1 | An 2 | An 3 ──
  h += '<div style="display:flex;gap:24px;border-bottom:1px solid var(--rule);margin-bottom:20px">';
  years.forEach(function(yr, i) {
    h += '<button onclick="' + btnCode(i) + '" style="background:none;border:none;border-bottom:2px solid ' + (i===0?'var(--accent)':'transparent') + ';color:' + (i===0?'var(--ink)':'var(--ink-3)') + ';padding:12px 0 10px;font-family:var(--mono);font-size:11.5px;font-weight:600;letter-spacing:0.1em;cursor:pointer;text-transform:uppercase">' + esc(yr.label) + '</button>';
  });
  h += '</div>';

  // ── Panneau de chaque année ──
  years.forEach(function(yr, i) {
    var d      = yr.data;
    var actif  = d.actif  || {};
    var passif = d.passif || {};
    var ratios = d.ratios || {};
    var cr     = d.compte_resultat || null;

    h += '<div id="' + tabBase + '_p' + i + '" style="display:' + (i===0?'block':'none') + '">';

    // Actif / Passif côte à côte
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:18px">';

    h += '<div>';
    h += lbl('Actif');
    Object.keys(actifMap).forEach(function(k) {
      if (!actif[k] || clean(actif[k]) === 'null') return;
      var isT = k === 'total_actif';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--rule);font-size:13.5px' + (isT?';font-weight:700;border-top:2px solid var(--rule);border-bottom:none;margin-top:6px;padding-top:10px':'') + '">' +
        '<span style="color:var(--ink-2)">' + actifMap[k] + '</span>' +
        '<span style="font-family:var(--mono);font-variant-numeric:tabular-nums;color:' + (isT?'var(--accent)':'var(--ink)') + '">' + esc(clean(actif[k])) + '</span></div>';
    });
    h += '</div>';

    h += '<div>';
    h += lbl('Passif');
    Object.keys(passifMap).forEach(function(k) {
      if (!passif[k] || clean(passif[k]) === 'null') return;
      var isT = k === 'total_passif';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--rule);font-size:13.5px' + (isT?';font-weight:700;border-top:2px solid var(--rule);border-bottom:none;margin-top:6px;padding-top:10px':'') + '">' +
        '<span style="color:var(--ink-2)">' + passifMap[k] + '</span>' +
        '<span style="font-family:var(--mono);font-variant-numeric:tabular-nums;color:' + (isT?'var(--green)':'var(--ink)') + '">' + esc(clean(passif[k])) + '</span></div>';
    });
    h += '</div>';

    h += '</div>'; // fin grid actif/passif

    // ── Ratios avec badges colorés ──
    if (ratios.autonomie_financiere || ratios.ratio_endettement) {
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">';

      function ratioBadge(valStr, isAutonomie) {
        var n = numVal(valStr);
        var color, label;
        if (isAutonomie) {
          color = n > 40 ? 'var(--green)' : n >= 20 ? 'var(--accent)' : 'var(--red)';
          label = n > 40 ? 'Solide' : n >= 20 ? 'Correct' : 'Faible';
        } else {
          color = n < 100 ? 'var(--green)' : n < 200 ? 'var(--accent)' : 'var(--red)';
          label = n < 100 ? 'Maîtrisé' : n < 200 ? 'Élevé' : 'Critique';
        }
        return '<span style="display:inline-block;margin-top:5px;padding:2px 7px;border-radius:3px;font-family:var(--mono);font-size:9.5px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600;background:transparent;border:1px solid ' + color + ';color:' + color + '">' + label + '</span>';
      }

      if (ratios.autonomie_financiere) {
        h += '<div style="padding:14px;border:1px solid var(--rule);border-radius:6px">' +
          '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px">Autonomie financière</div>' +
          '<div style="font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:15px;color:var(--ink)">' + esc(clean(ratios.autonomie_financiere)) + '</div>' +
          ratioBadge(ratios.autonomie_financiere, true) + '</div>';
      }
      if (ratios.ratio_endettement) {
        h += '<div style="padding:14px;border:1px solid var(--rule);border-radius:6px">' +
          '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px">Ratio endettement</div>' +
          '<div style="font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:15px;color:var(--ink)">' + esc(clean(ratios.ratio_endettement)) + '</div>' +
          ratioBadge(ratios.ratio_endettement, false) + '</div>';
      }
      h += '</div>';

      if (ratios.interpretation) {
        h += '<p style="font-size:13px;color:var(--ink-3);font-style:italic;margin:0 0 16px;line-height:1.5;border-left:2px solid var(--rule);padding-left:12px">' + esc(ratios.interpretation) + '</p>';
      }
    }

    // ── Compte de résultat ──
    if (cr) {
      h += '<div style="border-top:1px solid var(--rule);padding-top:16px">';
      h += lbl('Compte de résultat');
      h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
      var crItems = [
        ['CA HT',               cr.ca_ht,                 false],
        ['Charges fixes',       cr.charges_fixes,          false],
        ['Charges variables',   cr.charges_variables,      false],
        ['Marge brute',         cr.marge_brute,            false],
        ['Résultat exploitation', cr.resultat_exploitation, false],
        ['Résultat net',        cr.resultat_net,           true]
      ];
      crItems.forEach(function(it) {
        if (!it[1] || clean(it[1]) === 'null') return;
        var isRes  = it[2];
        var rNum   = isRes ? numVal(it[1]) : 0;
        var col    = isRes ? (rNum >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--ink)';
        h += '<div style="padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
          '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px">' + esc(it[0]) + '</div>' +
          '<div style="font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:14px;color:' + col + ';font-weight:' + (isRes?'600':'400') + '">' + esc(clean(it[1])) + '</div></div>';
      });
      h += '</div>';
      if (cr.taux_marge_nette && clean(cr.taux_marge_nette) !== 'null') {
        h += '<div style="margin-top:10px;font-family:var(--mono);font-size:11.5px;color:var(--ink-3)">Taux marge nette : <span style="color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums">' + esc(clean(cr.taux_marge_nette)) + '</span></div>';
      }
      h += '</div>';
    }

    h += '</div>'; // fin panneau
  });

  return h + '</div>';
}

// ── BLOC 13 — Projections An 2 — An 3 ────────────────────
function bloc13(plan) {
  var pa = plan.projections_an2_an3;
  if (!pa) return '';

  var an2 = pa.annee_2 || {};
  var an3 = pa.annee_3 || {};
  var tbl2 = (an2.tableau_trimestriel || []);
  var tbl3 = (an3.tableau_trimestriel || []);
  var syn  = pa.synthese_3_ans || null;
  if (!tbl2.length && !tbl3.length && !syn) return '';

  var cid = uid();

  // ── Données chart : An1 mensuel + An2 trimestriel + An3 trimestriel ──
  var prRev = plan.projections_revenus || {};
  var an1m  = prRev.tableau_mensuel_an1
    ? prRev.tableau_mensuel_an1.map(function(m){ return numVal(m.ca_ht); })
    : (plan.rev_mensuel || []);
  var an2q  = tbl2.map(function(t){ return numVal(t.ca_ht); });
  var an3q  = tbl3.map(function(t){ return numVal(t.ca_ht); });
  var mnoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  var allData   = an1m.concat(an2q).concat(an3q);
  var allLabels = mnoms.slice(0, an1m.length)
    .concat(an2q.map(function(_, i){ return 'T'+(i+1); }))
    .concat(an3q.map(function(_, i){ return 'T'+(i+1); }));
  var sep1 = an1m.length;        // index 1er point An2
  var sep2 = an1m.length + an2q.length; // index 1er point An3

  var h = '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  h += '<div style="font-family:var(--serif);font-size:17px;color:var(--ink);border-bottom:1px solid var(--rule);padding-bottom:10px;margin-bottom:20px">Projections An 2 — An 3</div>';

  // ── Graphique combiné (An1 mensuel + An2/An3 trimestriel) ──
  if (allData.some(function(v){ return v > 0; })) {
    h += cvs(cid, 200);
    queue(cid, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [{
          data: allData,
          borderColor: '#c84b2f',
          borderWidth: 2,
          fill: true,
          backgroundColor: 'rgba(200,75,47,0.08)',
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#c84b2f',
          pointBorderWidth: 0
        }]
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'var(--paper,#fff)',
            titleColor: CC.text,
            bodyColor: CC.text,
            borderColor: CC.grid,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function(ctx) {
                return 'CA : ' + ctx.parsed.y.toLocaleString('fr-FR') + ' €';
              }
            }
          }
        },
        scales: {
          x: { grid: { color: CC.grid }, ticks: { color: CC.text, maxRotation: 0, font: { size: 10 } } },
          y: { grid: { color: CC.grid }, ticks: { color: CC.text, callback: function(v){ return v.toLocaleString('fr-FR') + ' €'; } }, min: 0 }
        }
      },
      plugins: [{
        id: 'vlines_' + cid,
        beforeDraw: function(chart) {
          var ctx2  = chart.ctx;
          var xAxis = chart.scales.x;
          var yAxis = chart.scales.y;
          [sep1, sep2].forEach(function(sIdx) {
            if (sIdx <= 0 || sIdx >= allLabels.length) return;
            var px1 = xAxis.getPixelForValue(sIdx - 1);
            var px2 = xAxis.getPixelForValue(sIdx);
            if (!px1 || !px2) return;
            var x = (px1 + px2) / 2;
            ctx2.save();
            ctx2.beginPath();
            ctx2.setLineDash([4, 4]);
            ctx2.moveTo(x, yAxis.top);
            ctx2.lineTo(x, yAxis.bottom);
            ctx2.strokeStyle = '#c4b8a8';
            ctx2.lineWidth = 1;
            ctx2.stroke();
            ctx2.restore();
          });
        }
      }]
    });
  }

  // ── Helper tableau trimestriel ──
  function trimestrielTable(tbl) {
    if (!tbl.length) return '';
    var out = '<div style="overflow-x:auto;margin-top:14px"><table style="width:100%;border-collapse:collapse">';
    out += '<thead><tr>';
    ['Trimestre','CA','Charges','Résultat'].forEach(function(hd, hi) {
      out += '<th style="padding:7px 10px;font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;border-bottom:1px solid var(--rule);text-align:' + (hi===0?'left':'right') + ';white-space:nowrap">' + hd + '</th>';
    });
    out += '</tr></thead><tbody>';
    tbl.forEach(function(row, ri) {
      var res = numVal(row.resultat_net);
      var charges = numVal(row.charges_fixes) + numVal(row.charges_variables);
      out += '<tr style="background:' + (ri%2===0?'var(--paper)':'var(--bg-2,var(--bg))') + '">' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);font-family:var(--mono);font-size:10.5px;color:var(--ink-3)">' + esc(row.trimestre||'') + '</td>' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--accent)">' + esc(clean(row.ca_ht||'—')) + '</td>' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--ink-2)">' + (charges > 0 ? charges.toLocaleString('fr-FR') + ' €' : esc(clean(row.charges_fixes||'—'))) + '</td>' +
        '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:600;color:' + (res>=0?'var(--green)':'var(--red)') + '">' + esc(clean(row.resultat_net||'—')) + '</td></tr>';
    });
    out += '</tbody></table></div>';
    return out;
  }

  // ── Grid 2 colonnes : An 2 | An 3 ──
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">';

  [[an2, tbl2, 'An 2', 'taux_croissance_vs_an1', '↑ vs An 1'],
   [an3, tbl3, 'An 3', 'taux_croissance_vs_an2', '↑ vs An 2']
  ].forEach(function(col) {
    var data = col[0], tbl = col[1], label = col[2], crKey = col[3], crLabel = col[4];
    h += '<div style="border:1px solid var(--rule);border-radius:6px;padding:16px 18px">';
    h += '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:12px">' + esc(label) + '</div>';

    // CA annuel
    if (data.ca_annuel) {
      h += '<div style="font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:24px;color:var(--ink);margin-bottom:8px;line-height:1">' + esc(clean(data.ca_annuel)) + '</div>';
    }

    // Résultat avec badge coloré
    if (data.resultat_annuel) {
      var rn  = numVal(data.resultat_annuel);
      var col2 = rn >= 0 ? 'var(--green)' : 'var(--red)';
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
        '<span style="font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:13px;color:var(--ink-2)">Résultat :</span>' +
        '<span style="font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:13px;font-weight:600;color:' + col2 + '">' + esc(clean(data.resultat_annuel)) + '</span>' +
        '<span style="display:inline-block;padding:1px 7px;border:1px solid ' + col2 + ';border-radius:3px;font-family:var(--mono);font-size:9.5px;font-weight:600;color:' + col2 + ';text-transform:uppercase;letter-spacing:0.06em">' + (rn>=0?'Positif':'Négatif') + '</span></div>';
    }

    // Taux de croissance avec flèche
    if (data[crKey]) {
      var taux = clean(data[crKey]);
      var tnVal = numVal(data[crKey]);
      var arrow = tnVal >= 0 ? '↑' : '↓';
      var arrowCol = tnVal >= 0 ? 'var(--green)' : 'var(--red)';
      h += '<div style="font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:12px;color:var(--ink-3);margin-bottom:2px">' +
        '<span style="color:' + arrowCol + ';font-size:14px">' + arrow + '</span> ' + esc(taux) + ' ' + esc(crLabel) + '</div>';
    }

    h += trimestrielTable(tbl);
    h += '</div>';
  });

  h += '</div>'; // fin grid

  // ── Synthèse 3 ans ──
  if (syn && (syn.evolution_ca || syn.evolution_rentabilite || syn.message_banquier)) {
    h += '<div style="margin-top:20px;border-left:2px solid var(--accent);background:var(--accent-bg);padding:14px 16px;border-radius:0 6px 6px 0">';
    h += '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent-ink);opacity:0.7;margin-bottom:10px">Synthèse 3 ans</div>';
    if (syn.evolution_ca) {
      h += '<p style="font-size:13px;color:var(--accent-ink);margin:0 0 6px;line-height:1.55"><strong>CA :</strong> ' + esc(syn.evolution_ca) + '</p>';
    }
    if (syn.evolution_rentabilite) {
      h += '<p style="font-size:13px;color:var(--accent-ink);margin:0 0 10px;line-height:1.55"><strong>Rentabilité :</strong> ' + esc(syn.evolution_rentabilite) + '</p>';
    }
    if (syn.message_banquier) {
      h += '<p style="font-family:var(--serif);font-style:italic;color:var(--accent-ink);font-size:13.5px;margin:0;line-height:1.6">' + esc(syn.message_banquier) + '</p>';
    }
    h += '</div>';
  }

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
      options:{ animation:false, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false},
        tooltip:{
          callbacks:{
            afterLabel:function(item){
              var c=canaux[item.dataIndex];
              return c&&c.delai_premier_client?('Délai : '+c.delai_premier_client):'';
            }
          }
        }
      },
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
  plan = normalizePlanForRenderer(plan);
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

  // BOUTON RETOUR
  html += '<div style="margin-bottom:20px">' +
    '<button onclick="window.go&&window.go(\'plans\')" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid var(--rule);border-radius:6px;background:var(--paper);color:var(--ink-2);font-family:var(--mono);font-size:12px;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'var(--bg-2,var(--bg))\'" onmouseout="this.style.background=\'var(--paper)\'">' +
    '← Mes plans' +
    '</button></div>';

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
    var meReco = me.recommandation_concrete || me.recommandation;
    if (meReco) html += '<p style="font-size:13px;color:var(--accent-ink,var(--accent));margin:6px 0 0;font-weight:500">' + esc(meReco) + '</p>';
    html += '</div>';
  }

  // PITCH
  if (plan.pitch_30s) {
    html += '<div style="padding:18px 22px;background:var(--accent-bg);border:1px solid var(--rule);border-radius:6px;margin-bottom:20px">';
    html += lbl('Pitch 30 secondes');
    html += para(plan.pitch_30s);
    html += '</div>';
  }

  // ── SECTION DISPATCH ────────────────────────────────────────────
  var _renderSec = function(key) {
    var h = '';
    switch (key) {
      case 'resume_executif':
        if (plan.resume_executif) h += card('Résumé exécutif', para(plan.resume_executif));
        h += bloc3(plan);
        break;
      case 'porteur_projet':
        h += bloc2(plan, pid);
        break;
      case 'presentation_projet':
        if (plan.presentation_projet) h += card('Présentation du projet', para(plan.presentation_projet));
        break;
      case 'proposition_valeur':
        var pvBody = '';
        if (plan.proposition_valeur) pvBody += para(plan.proposition_valeur);
        if (plan.proposition_valeur_benefices && plan.proposition_valeur_benefices.length)
          pvBody += '<div style="display:flex;flex-direction:column;gap:6px;margin-top:12px">' +
            plan.proposition_valeur_benefices.map(function(b){ return '<div style="display:flex;gap:10px;font-size:13.5px;color:var(--ink-2)"><span style="color:var(--green);font-weight:600;flex-shrink:0">✓</span>'+esc(b)+'</div>'; }).join('') + '</div>';
        if (pvBody.trim()) h += card('Proposition de valeur', pvBody);
        break;
      case 'modele_economique':
        var meBody = '';
        if (plan.modele_economique) meBody += para(plan.modele_economique);
        if (plan.offres && plan.offres.length) meBody += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:14px">' +
          plan.offres.map(function(o){ return '<div style="padding:16px;border:1px solid var(--rule);border-radius:6px;background:var(--bg)">' +
            '<div style="font-size:14px;font-weight:600;color:var(--ink);margin-bottom:6px">'+esc(o.nom)+'</div>' +
            '<p style="font-size:13px;color:var(--ink-2);margin:0 0 8px;line-height:1.45">'+esc(o.description||'')+'</p>' +
            (o.prix?'<div style="font-family:var(--serif);font-size:20px;color:var(--accent)">'+esc(clean(o.prix))+'</div>':'') +
            '</div>'; }).join('') + '</div>';
        if (meBody.trim()) h += card('Modèle économique & offres', meBody);
        break;
      case 'strategie_commerciale':
        if (plan.strategie_commerciale) h += card('Stratégie commerciale', para(plan.strategie_commerciale));
        h += bloc12(plan);
        break;
      case 'marche':
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
        if (mBody.trim()) h += card('Analyse de marché', mBody);
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
          h += card('Persona client cible', perBody);
        }
        break;
      case 'concurrents':
        if (plan.concurrence_intro) h += card('Environnement concurrentiel', para(plan.concurrence_intro));
        if (plan.concurrents && plan.concurrents.length) {
          var bm = function(m){ return m==='haute'||m==='élevé'?badge(m,'red'):m==='moyenne'||m==='moyen'?badge(m,'accent'):badge(m,'muted'); };
          h += card('Analyse concurrentielle', plan.concurrents.map(function(c){
            return '<div style="padding:14px 0;border-bottom:1px solid var(--rule)">' +
              '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px"><b style="font-size:14.5px">'+esc(c.nom)+'</b>'+bm(c.menace)+'</div>' +
              (c.description?'<p style="color:var(--ink-2);font-size:13.5px;margin:0 0 4px;line-height:1.5">'+esc(c.description)+'</p>':'') +
              (c.avantage_differentiel?'<p style="color:var(--green);font-size:12.5px;margin:4px 0 0">Notre avantage : '+esc(c.avantage_differentiel)+'</p>':'') +
              '</div>';
          }).join(''));
        }
        break;
      case 'plan_financement':
        h += bloc4(plan);
        break;
      case 'investissements':
        if (plan.investissements && plan.investissements.length) h += card('Investissements',
          '<div style="display:flex;flex-direction:column">' +
          plan.investissements.map(function(inv){ return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--rule)">' +
            '<span style="font-size:13.5px;color:'+(inv.total?'var(--ink)':'var(--ink-2)')+';font-weight:'+(inv.total?'600':'400')+'">'+esc(inv.label)+'</span>' +
            '<span style="font-family:var(--mono);font-size:13px;color:'+(inv.total?'var(--accent)':'var(--ink)')+'">'+esc(clean(inv.montant))+'</span></div>'; }).join('') + '</div>');
        break;
      case 'finances_detail':
        if (plan.finances_detail && plan.finances_detail.length) h += card('Finances — tableau de bord',
          '<div style="display:flex;flex-direction:column">' +
          plan.finances_detail.map(function(f){ return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--rule)">' +
            '<span style="font-size:13.5px;color:var(--ink-2)">'+esc(f.label)+'</span>' +
            '<span style="font-family:var(--mono);font-size:13px;color:var(--ink);font-weight:600">'+esc(clean(f.valeur))+'</span></div>'; }).join('') + '</div>');
        h += bloc8(plan);
        h += bloc9(plan);
        h += bloc13(plan);
        break;
      case 'tresorerie':
        h += bloc7(plan);
        break;
      case 'bilan_previsionnel':
        h += bloc11(plan);
        break;
      case 'seuil_rentabilite':
        h += bloc10(plan);
        break;
      case 'tableau_amortissement':
        h += bloc5(plan);
        break;
      case 'aspects_juridiques':
        if (plan.aspects_juridiques) h += card('Aspects juridiques', para(plan.aspects_juridiques));
        break;
      case 'aspects_organisationnels':
        if (plan.aspects_organisationnels) h += card('Organisation', para(plan.aspects_organisationnels));
        break;
      case 'aides_subventions':
        if (plan.aides_subventions && plan.aides_subventions.length) h += card('Aides & subventions', plan.aides_subventions.map(function(a){
          return '<div style="display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px 0;border-bottom:1px solid var(--rule);align-items:start">' +
            '<div><b style="font-size:13.5px;color:'+(a.applicable?'var(--green)':'var(--ink-3)')+'">'+esc(a.nom)+'</b>' +
            (a.priorite?' <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">· '+esc(a.priorite)+'</span>':'') +
            '<p style="color:var(--ink-2);font-size:13px;margin:4px 0 0">'+esc(a.conditions||'')+'</p></div>' +
            '<div style="text-align:right"><div style="font-family:var(--mono);font-size:12px;color:var(--ink)">'+esc(clean(a.montant||''))+'</div>' +
            (a.lien?'<div style="font-family:var(--mono);font-size:10px;color:var(--accent)">'+esc(a.lien)+'</div>':'') +
            '</div></div>';
        }).join(''));
        break;
      case 'demarches_administratives':
        if (plan.demarches_admin && plan.demarches_admin.length) h += card('Démarches administratives', plan.demarches_admin.map(function(s){
          return '<div style="display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--rule);align-items:start">' +
            '<div><b style="font-size:13.5px;color:var(--ink)">'+esc(s.etape)+'</b>' +
            (s.detail?'<p style="color:var(--ink-2);font-size:12.5px;margin:4px 0 0;line-height:1.4">'+esc(s.detail)+'</p>':'')+'</div>' +
            '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-3);white-space:nowrap">'+esc(s.delai||'')+'</span>' +
            '<span style="font-family:var(--mono);font-size:11px;color:var(--accent);white-space:nowrap">'+esc(s.cout||'')+'</span></div>';
        }).join(''));
        break;
      case 'risques':
        if (plan.risques && plan.risques.length) h += card('Risques & mitigation', plan.risques.map(function(r){
          var niv = r.niveau||'';
          var bT = niv==='élevé'||niv==='haute'?'red':niv==='moyen'||niv==='moyenne'?'accent':'muted';
          return '<div style="padding:14px 0;border-bottom:1px solid var(--rule)">' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:6px"><b style="font-size:14px">'+esc(r.titre)+'</b>'+badge(niv,bT)+'</div>' +
            (r.solution?'<p style="color:var(--ink-2);font-size:13px;margin:0 0 4px;line-height:1.45">'+esc(r.solution)+'</p>':'') +
            (r.signal_alarme?'<p style="color:var(--accent);font-size:12px;margin:4px 0 0">🔔 '+esc(r.signal_alarme)+'</p>':'') +
            (r.solution_preventive?'<p style="color:var(--green);font-size:12px;margin:4px 0 0">🛡 '+esc(r.solution_preventive)+'</p>':'') +
            '</div>';
        }).join(''));
        break;
      case 'plan_actions_90j':
        if (plan.actions && plan.actions.length) h += card('Plan d\'action 90 jours', plan.actions.map(function(a){
          return '<div style="display:grid;grid-template-columns:80px 1fr;gap:14px;padding:12px 0;border-bottom:1px solid var(--rule);align-items:start">' +
            '<span style="font-family:var(--mono);font-size:10.5px;color:var(--ink-3);letter-spacing:0.08em;padding-top:2px">'+esc(a.phase)+'</span>' +
            '<div><b style="font-size:14px;display:block;margin-bottom:4px">'+esc(a.titre)+'</b><p style="color:var(--ink-2);font-size:13px;margin:0;line-height:1.45">'+esc(a.detail||'')+'</p></div></div>';
        }).join(''));
        break;
      case 'scores':
        h += bloc1(plan);
        break;
      case 'annexes_checklist':
        h += bloc6(plan, pid);
        break;
    }
    return h;
  };

  var _renderExtra = function(key) {
    var h = '';
    switch (key) {
      case 'templates_communication':
        [['email_presentation_banque','Email de présentation banque'],['email_prospection','Email de prospection'],['email_fournisseur','Email fournisseur'],['email_relance','Email de relance']].forEach(function(e) {
          var em = plan[e[0]];
          if (em && (em.sujet||em.corps)) h += card(e[1],
            '<div style="background:var(--bg);border-radius:6px;padding:14px;border:1px solid var(--rule)">' +
            (em.sujet?'<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3);margin-bottom:4px">Objet : <span style="color:var(--ink)">'+esc(em.sujet)+'</span></div>':'') +
            (em.corps?'<pre style="font-size:13px;color:var(--ink-2);white-space:pre-wrap;margin:8px 0 0;line-height:1.5;font-family:inherit">'+esc(em.corps)+'</pre>':'') +
            '</div>');
        });
        break;
      case 'kpis':
        if (plan.kpis && plan.kpis.length) h += card('KPIs à suivre',
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
          plan.kpis.map(function(k){ return '<div style="padding:14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">'+esc(k.nom)+'</div>' +
            '<div style="font-family:var(--serif);font-size:16px;color:var(--accent);margin-bottom:4px">'+esc(clean(k.cible||''))+'</div>' +
            '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">'+esc(k.frequence||'')+'</div></div>'; }).join('') + '</div>');
        break;
      case 'outils':
        if (plan.outils && plan.outils.length) h += card('Outils recommandés',
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">' +
          plan.outils.map(function(o){ return '<div style="padding:14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">'+esc(o.nom)+'</div>' +
            '<div style="font-size:12.5px;color:var(--ink-2);margin-bottom:6px;line-height:1.4">'+esc(o.usage||'')+'</div>' +
            (o.prix?'<div style="font-family:var(--mono);font-size:11px;color:var(--green)">'+esc(clean(o.prix))+'</div>':'') +
            '</div>'; }).join('') + '</div>');
        break;
      case 'ressources_gratuites':
        var dRes = d && (d.ressources_gratuites_recommandees || d.ressources_gratuites);
        if (dRes && dRes.length) h += card('Ressources gratuites',
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
          dRes.map(function(r){ return '<div style="padding:14px;background:var(--bg);border-radius:6px;border:1px solid var(--rule)">' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">'+esc(r.organisme)+'</div>' +
            '<div style="font-size:12.5px;color:var(--ink-2);margin-bottom:6px;line-height:1.4">'+esc(r.service||'')+'</div>' +
            '<div style="font-family:var(--mono);font-size:11px;color:var(--green)">'+esc(r.cout||'')+'</div>' +
            (r.url?'<div style="font-family:var(--mono);font-size:10px;color:var(--accent);margin-top:4px">'+esc(r.url)+'</div>':'') +
            '</div>'; }).join('') + '</div>');
        break;
    }
    return h;
  };

  // ── RENDER SECTIONS IN ORDER ─────────────────────────────────────
  var SECTIONS_ORDER = [
    'resume_executif',        // 01
    'porteur_projet',         // 02
    'presentation_projet',    // 03
    'proposition_valeur',     // 04
    'modele_economique',      // 05
    'strategie_commerciale',  // 06
    'marche',                 // 07
    'concurrents',            // 08
    'plan_financement',       // 09
    'investissements',        // 10
    'finances_detail',        // 11
    'tresorerie',             // 12
    'bilan_previsionnel',     // 13
    'seuil_rentabilite',      // 14
    'tableau_amortissement',  // 15
    'aspects_juridiques',     // 16
    'aspects_organisationnels', // 17
    'aides_subventions',      // 18
    'demarches_administratives', // 19
    'risques',                // 20
    'plan_actions_90j',       // 21
    'scores',                 // 22
    'annexes_checklist'       // 23
  ];
  for (var _si = 0; _si < SECTIONS_ORDER.length; _si++) {
    html += _renderSec(SECTIONS_ORDER[_si]);
  }

  // SÉPARATEUR BONUS
  html += '<div style="margin:32px 0 24px;padding:16px 20px;background:linear-gradient(135deg,var(--accent-bg),var(--bg));border:1px solid var(--rule);border-radius:8px;text-align:center">' +
    '<div style="font-family:var(--serif);font-size:15px;color:var(--accent-ink);margin-bottom:4px">✦ Bonus inclus dans ton plan</div>' +
    '<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">Templates e-mail · Démarches administratives · KPIs · Ressources gratuites</div></div>';

  // ── RENDER EXTRAS IN ORDER ───────────────────────────────────────
  var EXTRAS_ORDER = [
    'templates_communication',
    'kpis',
    'outils',
    'ressources_gratuites'
  ];
  for (var _ei = 0; _ei < EXTRAS_ORDER.length; _ei++) {
    html += _renderExtra(EXTRAS_ORDER[_ei]);
  }

  // DOCS TÉLÉCHARGEABLES (masqué — section bonus)
  html += '<div style="display:none;background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  html += lbl('Documents annexes — téléchargeables');
  html += '<div class="docs-grid" id="dDocsGrid"></div></div>';

  // DOSSIER CRÉATION (masqué — section bonus)
  html += '<div style="display:none;background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:24px 28px;margin-bottom:20px">';
  html += lbl('Dossier de création — documents juridiques');
  html += '<p style="font-size:13px;color:var(--ink-3);margin:0 0 14px;line-height:1.5">Statuts, checklist URSSAF, ouverture compte pro — pré-remplis pour ton projet.</p>';
  html += '<button onclick="generateDossier()" class="btn btn-ghost">Générer mon dossier complet →</button></div>';

  // BOUTONS
  html += '<div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap">' +
    '<button onclick="(function(){var r=document.getElementById(\'dashPlanResult\');if(r)r.style.display=\'none\';var f=document.querySelector(\'.gen-grid\');if(f)f.style.display=\'\';var b=document.querySelector(\'.gen-banner\');if(b)b.style.display=\'\';var h=document.querySelector(\'.page-head\');if(h)h.style.display=\'\';})()" class="btn btn-ghost">← Nouveau plan</button>' +
    '<button onclick="window.go&&window.go(\'expert\')" class="btn btn-accent">Affiner avec l\'Expert →</button></div>';

  html += '</div>';
  container.innerHTML = html;

  // Lazy-load Chart.js uniquement quand un plan est affiché
  if (typeof Chart !== 'undefined') {
    setTimeout(initCharts, 60);
  } else {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
    s.onload = function() { setTimeout(initCharts, 30); };
    document.head.appendChild(s);
  }
  if (typeof fillDocumentsAnnexes === 'function') fillDocumentsAnnexes(plan);
  if (typeof fillBancabilite === 'function') fillBancabilite(plan);
  if (typeof applyReliabilityIndicators === 'function') applyReliabilityIndicators(container);
  if (typeof window.updateUsage === 'function') window.updateUsage();
};

})();
