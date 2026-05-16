// ========== PLAN RENDERER V2 — structure complète generate-plan v2.0 ==========
(function() {

  // ── Helpers ──────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function clean(s) {
    return String(s || '').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').trim();
  }
  function card(title, body, accent) {
    if (!body || (typeof body === 'string' && !body.trim())) return '';
    var border = accent ? 'border-left:3px solid ' + accent + ';' : '';
    return '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:12px;padding:24px;margin-bottom:20px;' + border + '">' +
      '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:14px">' + title + '</div>' +
      body +
      '</div>';
  }
  function badge(niveau) {
    var c = (niveau === 'élevé' || niveau === 'haute' || niveau === 'haute') ? 'var(--red,#e05)' : (niveau === 'moyen' || niveau === 'moyenne') ? 'var(--accent)' : 'var(--green,#0a5)';
    return '<span style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:' + c + ';border:1px solid currentColor;padding:2px 8px;border-radius:20px;white-space:nowrap">' + esc(niveau) + '</span>';
  }
  function para(text) {
    if (!text) return '';
    return '<p style="font-size:14px;color:var(--ink-2);margin:0;line-height:1.65">' + esc(clean(text)) + '</p>';
  }
  function statGrid(items) {
    // items = [{label, value}]
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">' +
      items.filter(function(r){ return r.value; }).map(function(r){
        return '<div style="padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
          '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(r.label) + '</div>' +
          '<div style="font-family:var(--serif);font-size:18px;color:var(--ink)">' + esc(clean(r.value)) + '</div>' +
          '</div>';
      }).join('') +
      '</div>';
  }
  function kvRow(label, value) {
    if (!value) return '';
    return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--rule);font-size:13.5px">' +
      '<span style="color:var(--ink-2)">' + esc(label) + '</span>' +
      '<span style="font-family:var(--mono);color:var(--ink);font-weight:600">' + esc(clean(value)) + '</span>' +
      '</div>';
  }

  // ── Renderer principal ────────────────────────────────────────────────
  window._renderV2PlanResult = function(plan, container) {
    if (!plan || !container) return;

    var scores   = plan.scores || {};
    var sv       = scores.score_viabilite || {};
    var sb       = scores.score_bancabilite || {};
    var score    = sv.note || plan.score_viabilite || '—';
    var scoreBanc = sb.note || '—';
    var scoreColor = (score >= 75) ? 'var(--green,#0a5)' : (score >= 50) ? 'var(--accent)' : 'var(--red,#e05)';
    var planName = plan.nom_business || plan.nom_entreprise || plan.name || 'Business Plan';

    var html = '<div style="max-width:960px;margin:0 auto;padding:0 32px 100px">';

    // ── EN-TÊTE ──────────────────────────────────────────────────────────
    html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:32px;flex-wrap:wrap">';
    html += '<div style="flex:1;min-width:200px">';
    html += '<span style="font-family:var(--mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--green,#0a5);display:block;margin-bottom:8px">Plan généré ✓</span>';
    html += '<h2 style="font-family:var(--serif);font-size:40px;line-height:1.05;letter-spacing:-0.02em;margin:0 0 6px;font-weight:400">' + esc(planName) + '</h2>';
    if (plan.tagline) html += '<p style="font-family:var(--serif);font-style:italic;color:var(--ink-2);font-size:16px;margin:0">' + esc(plan.tagline) + '</p>';
    html += '</div>';
    html += '<div style="display:flex;gap:12px;flex-shrink:0;flex-wrap:wrap">';
    html += '<div style="text-align:center;padding:16px 20px;background:var(--paper);border:1px solid var(--rule);border-radius:12px;min-width:90px">';
    html += '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px">Viabilité</div>';
    html += '<div style="font-family:var(--serif);font-size:48px;line-height:0.95;color:' + scoreColor + '">' + score + '</div>';
    html += '<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">/100</div>';
    html += '</div>';
    if (scoreBanc !== '—') {
      html += '<div style="text-align:center;padding:16px 20px;background:var(--paper);border:1px solid var(--rule);border-radius:12px;min-width:90px">';
      html += '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px">Bancabilité</div>';
      html += '<div style="font-family:var(--serif);font-size:48px;line-height:0.95;color:var(--accent)">' + scoreBanc + '</div>';
      html += '<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">/100</div>';
      html += '</div>';
    }
    html += '</div></div>';

    // ── DISCLAIMER ───────────────────────────────────────────────────────
    var d = plan.disclaimer;
    if (d && d.message_entrepreneur) {
      var me = d.message_entrepreneur;
      html += '<div style="padding:16px 20px;background:oklch(0.97 0.02 85 / 1);border:1px solid var(--rule-2,#e5e0d8);border-radius:10px;margin-bottom:24px">';
      html += '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:6px">⚠ ' + esc(me.titre || 'Note importante') + '</div>';
      html += '<p style="font-size:13px;color:var(--ink-2);margin:0 0 6px;line-height:1.55">' + esc(me.corps || '') + '</p>';
      if (me.recommandation_concrete) html += '<p style="font-size:13px;color:var(--accent-ink,var(--accent));margin:0;font-weight:500">' + esc(me.recommandation_concrete) + '</p>';
      html += '</div>';

      // Ce que ce plan fait / ne fait pas
      if (d.ce_que_ce_plan_fait && d.ce_que_ce_plan_fait.length) {
        var discBody = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
        discBody += '<div><div style="font-family:var(--mono);font-size:10px;color:var(--green,#0a5);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Ce plan fait ✓</div>' +
          d.ce_que_ce_plan_fait.map(function(x){ return '<div style="font-size:12.5px;color:var(--ink-2);padding:4px 0;display:flex;gap:8px"><span style="color:var(--green,#0a5)">✓</span>' + esc(x) + '</div>'; }).join('') + '</div>';
        if (d.ce_que_ce_plan_ne_fait_pas && d.ce_que_ce_plan_ne_fait_pas.length) {
          discBody += '<div><div style="font-family:var(--mono);font-size:10px;color:var(--red,#e05);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Ce plan ne fait pas ✗</div>' +
            d.ce_que_ce_plan_ne_fait_pas.map(function(x){ return '<div style="font-size:12.5px;color:var(--ink-2);padding:4px 0;display:flex;gap:8px"><span style="color:var(--red,#e05)">✗</span>' + esc(x) + '</div>'; }).join('') + '</div>';
        }
        discBody += '</div>';
        html += card('À lire avant votre rendez-vous banque', discBody);
      }
    }

    // ── PITCH 30s ────────────────────────────────────────────────────────
    if (plan.pitch_30s) {
      html += '<div style="padding:20px 24px;background:var(--accent-bg,#f5f3ff);border:1px solid var(--rule-2,#e5e0d8);border-radius:10px;margin-bottom:20px">';
      html += '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent-ink,var(--accent));margin-bottom:8px">Pitch 30 secondes</div>';
      html += para(plan.pitch_30s);
      html += '</div>';
    }

    // ── SCORES DÉTAILLÉS ─────────────────────────────────────────────────
    if (sv.interpretation || sv.points_forts || sv.points_vigilance) {
      var svBody = '';
      if (sv.interpretation) svBody += para(sv.interpretation) + '<br>';
      if (sv.points_forts && sv.points_forts.length) {
        svBody += '<div style="margin-bottom:12px"><div style="font-family:var(--mono);font-size:10px;color:var(--green,#0a5);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">Atouts majeurs</div>' +
          sv.points_forts.map(function(p){ return '<div style="display:flex;gap:8px;font-size:13px;color:var(--ink-2);padding:3px 0"><span style="color:var(--green,#0a5)">✓</span>' + esc(p) + '</div>'; }).join('') + '</div>';
      }
      if (sv.points_vigilance && sv.points_vigilance.length) {
        svBody += '<div><div style="font-family:var(--mono);font-size:10px;color:var(--accent);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">Points à renforcer</div>' +
          sv.points_vigilance.map(function(p){ return '<div style="display:flex;gap:8px;font-size:13px;color:var(--ink-2);padding:3px 0"><span style="color:var(--accent)">⚠</span>' + esc(p) + '</div>'; }).join('') + '</div>';
      }
      html += card('Score de viabilité — ' + score + '/100', svBody);
    }

    if (sb.interpretation || sb.detail) {
      var sbBody = '';
      if (sb.interpretation) sbBody += para(sb.interpretation) + '<br>';
      var det = sb.detail || {};
      var detKeys = [
        ['apport_suffisant', 'Apport', 25],
        ['point_mort_rapide', 'Point mort', 20],
        ['tresorerie_positive_m6', 'Trésorerie M6', 20],
        ['garanties_disponibles', 'Garanties', 15],
        ['secteur_risque_faible', 'Risque secteur', 10],
        ['experience_porteur', 'Expérience porteur', 10]
      ];
      var hasDetail = detKeys.some(function(k){ return det[k[0]]; });
      if (hasDetail) {
        sbBody += '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">';
        detKeys.forEach(function(k) {
          var item = det[k[0]];
          if (!item) return;
          var pts = item.points || 0;
          var max = k[2];
          var pct = Math.round((pts / max) * 100);
          sbBody += '<div style="padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
            '<span style="font-size:13px;font-weight:500">' + esc(k[1]) + '</span>' +
            '<span style="font-family:var(--mono);font-size:12px;color:var(--accent)">' + pts + '/' + max + '</span>' +
            '</div>' +
            '<div style="height:4px;background:var(--rule);border-radius:2px;margin-bottom:6px">' +
            '<div style="height:4px;background:var(--accent);border-radius:2px;width:' + pct + '%"></div></div>' +
            (item.commentaire ? '<div style="font-size:12px;color:var(--ink-3)">' + esc(item.commentaire) + '</div>' : '') +
            '</div>';
        });
        sbBody += '</div>';
      }
      if (sb.message_banquier) {
        sbBody += '<div style="padding:12px;background:var(--bg);border-left:3px solid var(--accent);border-radius:4px;font-size:13px;color:var(--ink-2);line-height:1.5">' + esc(sb.message_banquier) + '</div>';
      }
      html += card('Score bancabilité — ' + scoreBanc + '/100', sbBody);
    }

    // ── PRÉSENTATION PROJET ──────────────────────────────────────────────
    if (plan.presentation_projet) html += card('Présentation du projet', para(plan.presentation_projet));

    // ── RÉSUMÉ EXÉCUTIF ──────────────────────────────────────────────────
    if (plan.resume_executif) html += card('Résumé exécutif', para(plan.resume_executif));

    // ── VISION BANQUIER ──────────────────────────────────────────────────
    var vb = plan.resume_vision_banquier;
    if (vb) {
      var vbRows = [
        ['Montant demandé', vb.montant_demande], ['Durée souhaitée', vb.duree_souhaitee],
        ['Mensualité estimée', vb.mensualite_estimee], ['Capacité remboursement', vb.capacite_remboursement],
        ['Argument principal', vb.argument_principal]
      ].filter(function(r){ return r[1]; });
      if (vbRows.length || (vb.garanties_proposees && vb.garanties_proposees.length)) {
        var vbBody = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
          vbRows.map(function(r){
            return '<div style="padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
              '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(r[0]) + '</div>' +
              '<div style="font-size:13.5px;color:var(--ink)">' + esc(clean(r[1])) + '</div></div>';
          }).join('');
        if (vb.garanties_proposees && vb.garanties_proposees.length) {
          vbBody += '<div style="grid-column:1/-1;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Garanties proposées</div>' +
            '<div style="font-size:13px;color:var(--ink-2)">' + vb.garanties_proposees.map(function(g){ return esc(g); }).join(' · ') + '</div></div>';
        }
        vbBody += '</div>';
        html += card('Vision banquier', vbBody, 'var(--accent)');
      }
    }

    // ── PORTEUR DU PROJET ────────────────────────────────────────────────
    if (plan.porteur_projet) html += card('Porteur du projet', para(plan.porteur_projet));

    // ── PROFIL FINANCIER DU PORTEUR ──────────────────────────────────────
    var ppf = plan.porteur_profil_financier;
    if (ppf) {
      var ppfBody = statGrid([
        {label: 'Apport personnel', value: ppf.apport_personnel},
        {label: 'Ratio apport/projet', value: ppf.ratio_apport_projet},
        {label: 'Appréciation', value: ppf.appreciation_ratio}
      ]);
      if (ppf.documents_a_fournir && ppf.documents_a_fournir.length) {
        ppfBody += '<div style="margin-top:14px"><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Documents à fournir</div>' +
          ppf.documents_a_fournir.map(function(doc){ return '<div style="display:flex;gap:8px;font-size:13px;color:var(--ink-2);padding:4px 0;border-bottom:1px solid var(--rule)"><span style="color:var(--accent)">→</span>' + esc(doc) + '</div>'; }).join('') + '</div>';
      }
      html += card('Profil financier du porteur', ppfBody);
    }

    // ── PERSONA CLIENT ────────────────────────────────────────────────────
    var persona = plan.persona;
    if (persona && persona.nom) {
      var perBody = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        [['Profil', persona.nom + (persona.age ? ' · ' + persona.age : '')],
         ['Situation', persona.situation],
         ['Douleurs', persona.douleurs],
         ['Motivations', persona.motivations],
         ['Où le trouver', persona.ou_le_trouver]
        ].filter(function(r){ return r[1]; }).map(function(r){
          return '<div style="padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(r[0]) + '</div>' +
            '<div style="font-size:13px;color:var(--ink-2);line-height:1.4">' + esc(r[1]) + '</div></div>';
        }).join('') + '</div>';
      html += card('Persona client cible', perBody);
    }

    // ── ANALYSE DE MARCHÉ ─────────────────────────────────────────────────
    var marcheBody = '';
    if (plan.marche_analyse) marcheBody += para(plan.marche_analyse) + '<br>';
    var marcheStats = [
      {label: 'Taille du marché', value: plan.marche_taille},
      {label: 'Croissance', value: plan.marche_croissance},
      {label: 'Part cible', value: plan.marche_part_cible},
      {label: 'Clients potentiels', value: plan.marche_clients_potentiels}
    ].filter(function(r){ return r.value; });
    if (marcheStats.length) marcheBody += statGrid(marcheStats);
    if (plan.marche_tendances && plan.marche_tendances.length) {
      marcheBody += '<div style="margin-top:14px"><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Tendances 2025-2026</div>' +
        plan.marche_tendances.map(function(t){ return '<div style="font-size:13.5px;color:var(--ink-2);padding:6px 0;border-bottom:1px solid var(--rule)">→ ' + esc(t) + '</div>'; }).join('') + '</div>';
    }
    if (marcheBody.trim()) html += card('Analyse de marché', marcheBody);

    // ── PROPOSITION DE VALEUR ─────────────────────────────────────────────
    var pvBody = '';
    if (plan.proposition_valeur) pvBody += para(plan.proposition_valeur);
    if (plan.proposition_valeur_benefices && plan.proposition_valeur_benefices.length) {
      pvBody += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' +
        plan.proposition_valeur_benefices.map(function(b){ return '<div style="display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:var(--ink-2)"><span style="color:var(--green,#0a5);font-weight:600;flex-shrink:0">✓</span>' + esc(b) + '</div>'; }).join('') + '</div>';
    }
    if (pvBody.trim()) html += card('Proposition de valeur', pvBody);

    // ── ENVIRONNEMENT CONCURRENTIEL ───────────────────────────────────────
    if (plan.concurrence_intro) html += card('Environnement concurrentiel', para(plan.concurrence_intro));

    if (plan.concurrents && plan.concurrents.length) {
      html += card('Analyse concurrentielle',
        plan.concurrents.map(function(c){
          return '<div style="padding:14px 0;border-bottom:1px solid var(--rule)">' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px">' +
            '<b style="font-size:14.5px">' + esc(c.nom) + '</b>' +
            badge(c.menace) +
            '</div>' +
            (c.description ? '<p style="color:var(--ink-2);font-size:13.5px;margin:0 0 4px;line-height:1.5">' + esc(c.description) + '</p>' : '') +
            (c.avantage_differentiel ? '<p style="color:var(--green,#0a5);font-size:12.5px;margin:4px 0 0">Notre avantage : ' + esc(c.avantage_differentiel) + '</p>' : '') +
            (c.prix_moyen ? '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">Prix : ' + esc(clean(c.prix_moyen)) + '</span>' : '') +
            '</div>';
        }).join('')
      );
    }

    // ── MODÈLE ÉCONOMIQUE & OFFRES ────────────────────────────────────────
    var mecoBody = '';
    if (plan.modele_economique) mecoBody += para(plan.modele_economique);
    if (plan.offres && plan.offres.length) {
      mecoBody += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:14px">' +
        plan.offres.map(function(o){
          return '<div style="padding:16px;border:1px solid var(--rule);border-radius:8px;background:var(--bg)">' +
            '<div style="font-size:14px;font-weight:600;color:var(--ink);margin-bottom:6px">' + esc(o.nom) + '</div>' +
            '<p style="font-size:13px;color:var(--ink-2);margin:0 0 8px;line-height:1.45">' + esc(o.description || '') + '</p>' +
            (o.prix ? '<div style="font-family:var(--serif);font-size:20px;color:var(--accent)">' + esc(clean(o.prix)) + '</div>' : '') +
            '</div>';
        }).join('') + '</div>';
    }
    if (mecoBody.trim()) html += card('Modèle économique & offres', mecoBody);

    // ── STRATÉGIE COMMERCIALE ─────────────────────────────────────────────
    if (plan.strategie_commerciale) html += card('Stratégie commerciale', para(plan.strategie_commerciale));

    // ── ACQUISITION ───────────────────────────────────────────────────────
    if (plan.acquisition && plan.acquisition.length) {
      html += card('Stratégie d\'acquisition',
        plan.acquisition.map(function(a){
          return '<div style="padding:12px 0;border-bottom:1px solid var(--rule)">' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px">' +
            '<b style="font-size:14px;color:var(--ink)">' + esc(a.canal) + '</b>' +
            (a.cac ? '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">CAC ' + esc(clean(a.cac)) + '</span>' : '') +
            '</div>' +
            '<p style="color:var(--ink-2);font-size:13.5px;margin:0;line-height:1.5">' + esc(a.description || '') + '</p>' +
            '</div>';
        }).join('')
      );
    }

    // ── ASPECTS JURIDIQUES & ORGANISATIONNELS ────────────────────────────
    if (plan.aspects_juridiques) html += card('Aspects juridiques', para(plan.aspects_juridiques));
    if (plan.aspects_organisationnels) html += card('Organisation', para(plan.aspects_organisationnels));

    // ── PROJECTIONS REVENUS ──────────────────────────────────────────────
    var revEntries = [
      {label:'M+1', value:plan.rev_m1}, {label:'M+3', value:plan.rev_m3},
      {label:'M+6', value:plan.rev_m6}, {label:'An 1', value:plan.rev_m12},
      {label:'18 mois', value:plan.rev_m18}, {label:'An 2', value:plan.rev_m24},
      {label:'An 3', value:plan.rev_m36}
    ].filter(function(r){ return r.value; });
    if (revEntries.length) {
      html += card('Projections de revenus',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">' +
        revEntries.map(function(r){
          return '<div style="text-align:center;padding:14px 10px;border:1px solid var(--rule);border-radius:8px;background:var(--bg)">' +
            '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;color:var(--ink-3);text-transform:uppercase;margin-bottom:4px">' + esc(r.label) + '</div>' +
            '<div style="font-family:var(--serif);font-size:18px;color:var(--ink)">' + esc(clean(r.value)) + '</div></div>';
        }).join('') + '</div>'
      );
    }

    // ── SCÉNARIOS ─────────────────────────────────────────────────────────
    var scenarios = plan.scenarios;
    if (scenarios) {
      var scenItems = [
        {key: 'pessimiste', label: 'Scénario pessimiste', color: 'var(--red,#e05)'},
        {key: 'realiste',   label: 'Scénario réaliste',   color: 'var(--accent)'},
        {key: 'optimiste',  label: 'Scénario optimiste',  color: 'var(--green,#0a5)'}
      ];
      var scenBody = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">';
      scenItems.forEach(function(s) {
        var sc = scenarios[s.key];
        if (!sc) return;
        scenBody += '<div style="padding:16px;border:1px solid var(--rule);border-radius:10px;background:var(--bg)">' +
          '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:' + s.color + ';margin-bottom:10px">' + esc(s.label) + '</div>' +
          (sc.hypothese ? '<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px;line-height:1.4">' + esc(sc.hypothese) + '</p>' : '') +
          (sc.ca_an1 ? '<div style="margin-bottom:4px"><span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">CA AN 1 </span><span style="font-family:var(--mono);font-size:13px;color:var(--ink);font-weight:600">' + esc(clean(sc.ca_an1)) + '</span></div>' : '') +
          (sc.ca_an3 ? '<div style="margin-bottom:4px"><span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">CA AN 3 </span><span style="font-family:var(--mono);font-size:13px;color:var(--ink);font-weight:600">' + esc(clean(sc.ca_an3)) + '</span></div>' : '') +
          (sc.point_mort_mois ? '<div style="margin-bottom:8px"><span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">BREAK-EVEN </span><span style="font-family:var(--mono);font-size:13px;color:var(--ink);font-weight:600">' + esc(clean(sc.point_mort_mois)) + '</span></div>' : '') +
          (sc.viabilite ? '<div style="font-size:12px;color:' + s.color + ';font-weight:500">' + esc(sc.viabilite) + '</div>' : '') +
          '</div>';
      });
      scenBody += '</div>';
      if (scenBody.indexOf('<div style="padding:16px') !== -1) html += card('Scénarios financiers', scenBody);
    }

    // ── FINANCES DÉTAIL ───────────────────────────────────────────────────
    if (plan.finances_detail && plan.finances_detail.length) {
      html += card('Finances — tableau de bord',
        '<div style="display:flex;flex-direction:column;gap:0">' +
        plan.finances_detail.map(function(f){
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--rule)">' +
            '<span style="font-size:13.5px;color:var(--ink-2)">' + esc(f.label) + '</span>' +
            '<span style="font-family:var(--mono);font-size:13px;color:var(--ink);font-weight:600">' + esc(clean(f.valeur)) + '</span></div>';
        }).join('') + '</div>'
      );
    }

    // ── PLAN DE FINANCEMENT ───────────────────────────────────────────────
    var pf = plan.plan_financement;
    if (pf) {
      var pfBody = '';
      if (pf.besoins) {
        pfBody += '<div style="margin-bottom:16px"><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Besoins</div>';
        ['investissements_materiels','investissements_immateriels','bfr_demarrage','tresorerie_securite'].forEach(function(k){
          if (pf.besoins[k]) pfBody += kvRow(k.replace(/_/g,' '), pf.besoins[k]);
        });
        if (pf.besoins.total_besoins) pfBody += '<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:600"><span>Total besoins</span><span style="font-family:var(--mono);color:var(--accent)">' + esc(clean(pf.besoins.total_besoins)) + '</span></div>';
        pfBody += '</div>';
      }
      if (pf.ressources) {
        pfBody += '<div><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Ressources</div>';
        ['apport_personnel','pret_bancaire','pret_bpi','pret_honneur','subventions'].forEach(function(k){
          var v = pf.ressources[k];
          if (v && v !== 'null' && v !== null) pfBody += kvRow(k.replace(/_/g,' '), v);
        });
        if (pf.ressources.total_ressources) pfBody += '<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:600"><span>Total ressources</span><span style="font-family:var(--mono);color:var(--green,#0a5)">' + esc(clean(pf.ressources.total_ressources)) + '</span></div>';
        pfBody += '</div>';
      }
      if (pf.message_banquier) pfBody += '<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;border-left:3px solid var(--accent);font-size:13px;color:var(--ink-2);line-height:1.5">' + esc(pf.message_banquier) + '</div>';
      if (pfBody.trim()) html += card('Plan de financement', pfBody);
    }

    // ── TRÉSORERIE MENSUELLE ──────────────────────────────────────────────
    var tm = plan.tresorerie_mensuelle;
    if (tm && tm.length) {
      var tmBody = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px">';
      tmBody += '<thead><tr style="background:var(--bg)">' +
        ['Mois','Encaissements','Décaissements','Solde mois','Solde cumulé'].map(function(h){
          return '<th style="padding:8px 10px;text-align:right;font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid var(--rule);white-space:nowrap">' + h + '</th>';
        }).join('') + '</tr></thead><tbody>';
      tm.forEach(function(row, i) {
        var bg = i % 2 === 0 ? 'background:var(--paper)' : 'background:var(--bg)';
        var alertHtml = row.alerte ? '<div style="font-size:10.5px;color:var(--red,#e05);margin-top:2px">⚠ ' + esc(row.alerte) + '</div>' : '';
        tmBody += '<tr style="' + bg + '">' +
          '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);font-size:13px;color:var(--ink)">' + esc(row.mois || '') + alertHtml + '</td>' +
          '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);color:var(--green,#0a5)">' + esc(clean(row.encaissements || '—')) + '</td>' +
          '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);color:var(--red,#e05)">' + esc(clean(row.decaissements || '—')) + '</td>' +
          '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);color:var(--ink)">' + esc(clean(row.solde_mois || '—')) + '</td>' +
          '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);font-weight:600;color:var(--accent)">' + esc(clean(row.solde_cumule || '—')) + '</td>' +
          '</tr>';
      });
      tmBody += '</tbody></table></div>';
      html += card('Trésorerie mensuelle sur 12 mois', tmBody);
    } else if (plan.tresorerie_detail) {
      html += card('Trésorerie', para(plan.tresorerie_detail));
    }

    // ── TABLEAU D'AMORTISSEMENT ───────────────────────────────────────────
    var ta = plan.tableau_amortissement;
    if (ta && ta.parametres) {
      var p = ta.parametres;
      var taBody = statGrid([
        {label: 'Capital emprunté', value: p.capital_emprunte},
        {label: 'Taux annuel', value: p.taux_annuel_estime},
        {label: 'Durée', value: p.duree_annees ? p.duree_annees + ' ans' : null},
        {label: 'Mensualité', value: p.mensualite_estimee},
        {label: 'Total intérêts', value: p.total_interets},
        {label: 'Coût total crédit', value: p.cout_total_credit}
      ]);
      if (ta.echeancier_annuel && ta.echeancier_annuel.length) {
        taBody += '<div style="margin-top:16px;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px">';
        taBody += '<thead><tr style="background:var(--bg)"><th style="padding:8px 10px;font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid var(--rule);text-align:left">Année</th>' +
          ['Mensualité','Capital remboursé','Intérêts payés','Capital restant dû'].map(function(h){
            return '<th style="padding:8px 10px;font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid var(--rule);text-align:right;white-space:nowrap">' + h + '</th>';
          }).join('') + '</tr></thead><tbody>';
        ta.echeancier_annuel.forEach(function(row, i) {
          var bg = i % 2 === 0 ? 'var(--paper)' : 'var(--bg)';
          taBody += '<tr style="background:' + bg + '">' +
            '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);color:var(--ink)">' + esc('An ' + row.annee) + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono)">' + esc(clean(row.mensualite || '—')) + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);color:var(--accent)">' + esc(clean(row.capital_rembourse_annee || '—')) + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);color:var(--red,#e05)">' + esc(clean(row.interets_payes_annee || '—')) + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid var(--rule);text-align:right;font-family:var(--mono);font-weight:600">' + esc(clean(row.capital_restant_du_fin_annee || '—')) + '</td>' +
            '</tr>';
        });
        taBody += '</tbody></table></div>';
      }
      if (ta.analyse_capacite_remboursement) {
        var acr = ta.analyse_capacite_remboursement;
        if (acr.verdict) taBody += '<div style="margin-top:12px;padding:12px;background:var(--bg);border-left:3px solid var(--accent);border-radius:4px;font-size:13px;color:var(--ink-2);">' + esc(acr.verdict) + '</div>';
        if (acr.appreciation) taBody += '<div style="margin-top:8px;font-size:12.5px;font-weight:600;color:var(--accent)">' + esc(acr.appreciation) + '</div>';
      }
      if (ta.conseils_negociation_banque && ta.conseils_negociation_banque.length) {
        taBody += '<div style="margin-top:14px"><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Conseils de négociation</div>' +
          ta.conseils_negociation_banque.map(function(c){ return '<div style="display:flex;gap:8px;font-size:13px;color:var(--ink-2);padding:4px 0;border-bottom:1px solid var(--rule)"><span style="color:var(--accent)">→</span>' + esc(c) + '</div>'; }).join('') + '</div>';
      }
      html += card('Tableau d\'amortissement du prêt', taBody);
    }

    // ── INVESTISSEMENTS ───────────────────────────────────────────────────
    if (plan.investissements && plan.investissements.length) {
      html += card('Investissements',
        '<div style="display:flex;flex-direction:column;gap:0">' +
        plan.investissements.map(function(inv){
          var isTotal = inv.total;
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--rule)">' +
            '<span style="font-size:13.5px;color:' + (isTotal ? 'var(--ink)' : 'var(--ink-2)') + ';font-weight:' + (isTotal ? '600' : '400') + '">' + esc(inv.label) + '</span>' +
            '<span style="font-family:var(--mono);font-size:13px;color:' + (isTotal ? 'var(--accent)' : 'var(--ink)') + '">' + esc(clean(inv.montant)) + '</span></div>';
        }).join('') + '</div>'
      );
    }

    // ── BILAN PRÉVISIONNEL ────────────────────────────────────────────────
    if (plan.bilan_previsionnel) html += card('Bilan prévisionnel', para(plan.bilan_previsionnel));

    // ── SEUIL DE RENTABILITÉ ──────────────────────────────────────────────
    var sr = plan.seuil_rentabilite;
    if (sr) {
      var srBody = statGrid([
        {label: 'Charges fixes/mois', value: sr.charges_fixes_mensuelles},
        {label: 'Taux marge sur CV', value: sr.taux_marge_sur_cv},
        {label: 'Point mort CA/mois', value: sr.point_mort_ca},
        {label: 'Break-even', value: sr.break_even_mois}
      ]);
      if (sr.detail) srBody += '<br>' + para(sr.detail);
      if (sr.interpretation_bancaire) srBody += '<div style="margin-top:10px;padding:10px;background:var(--bg);border-left:3px solid var(--green,#0a5);border-radius:4px;font-size:13px;color:var(--ink-2)">' + esc(sr.interpretation_bancaire) + '</div>';
      html += card('Seuil de rentabilité', srBody);
    }

    // ── RISQUES ───────────────────────────────────────────────────────────
    if (plan.risques && plan.risques.length) {
      html += card('Risques & mitigation',
        plan.risques.map(function(r){
          return '<div style="padding:14px 0;border-bottom:1px solid var(--rule)">' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:6px">' +
            '<b style="font-size:14px">' + esc(r.titre) + '</b>' +
            badge(r.niveau) +
            '</div>' +
            (r.solution ? '<p style="color:var(--ink-2);font-size:13px;margin:0 0 4px;line-height:1.45">' + esc(r.solution) + '</p>' : '') +
            (r.signal_alarme ? '<p style="color:var(--accent);font-size:12px;margin:4px 0 0">🔔 Signal d\'alarme : ' + esc(r.signal_alarme) + '</p>' : '') +
            (r.solution_preventive ? '<p style="color:var(--green,#0a5);font-size:12px;margin:4px 0 0">🛡 Prévention : ' + esc(r.solution_preventive) + '</p>' : '') +
            '</div>';
        }).join('')
      );
    }

    // ── PLAN D'ACTION 90 JOURS ────────────────────────────────────────────
    if (plan.actions && plan.actions.length) {
      html += card('Plan d\'action 90 jours',
        plan.actions.map(function(a){
          return '<div style="display:grid;grid-template-columns:80px 1fr;gap:14px;padding:12px 0;border-bottom:1px solid var(--rule);align-items:start">' +
            '<span style="font-family:var(--mono);font-size:10.5px;color:var(--ink-3);letter-spacing:0.08em;padding-top:2px">' + esc(a.phase) + '</span>' +
            '<div><b style="font-size:14px;display:block;margin-bottom:4px">' + esc(a.titre) + '</b><p style="color:var(--ink-2);font-size:13px;margin:0;line-height:1.45">' + esc(a.detail || '') + '</p></div>' +
            '</div>';
        }).join('')
      );
    }

    // ── AIDES & SUBVENTIONS ───────────────────────────────────────────────
    if (plan.aides_subventions && plan.aides_subventions.length) {
      html += card('Aides & subventions',
        plan.aides_subventions.map(function(a){
          var col = a.applicable ? 'var(--green,#0a5)' : 'var(--ink-3)';
          return '<div style="display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px 0;border-bottom:1px solid var(--rule);align-items:start">' +
            '<div>' +
            '<b style="font-size:13.5px;color:' + col + '">' + esc(a.nom) + '</b>' +
            (a.priorite ? ' <span style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">· ' + esc(a.priorite) + '</span>' : '') +
            '<p style="color:var(--ink-2);font-size:13px;margin:4px 0 0">' + esc(a.conditions || '') + '</p>' +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0">' +
            '<div style="font-family:var(--mono);font-size:12px;color:var(--ink)">' + esc(clean(a.montant || '')) + '</div>' +
            (a.lien ? '<div style="font-family:var(--mono);font-size:10px;color:var(--accent)">' + esc(a.lien) + '</div>' : '') +
            '</div></div>';
        }).join('')
      );
    }

    // ── KPIs ──────────────────────────────────────────────────────────────
    if (plan.kpis && plan.kpis.length) {
      html += card('KPIs à suivre',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
        plan.kpis.map(function(k){
          return '<div style="padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">' + esc(k.nom) + '</div>' +
            '<div style="font-family:var(--serif);font-size:16px;color:var(--accent);margin-bottom:4px">' + esc(clean(k.cible || '')) + '</div>' +
            '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">' + esc(k.frequence || '') + '</div>' +
            '</div>';
        }).join('') + '</div>'
      );
    }

    // ── OUTILS ───────────────────────────────────────────────────────────
    if (plan.outils && plan.outils.length) {
      html += card('Outils recommandés',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">' +
        plan.outils.map(function(o){
          return '<div style="padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">' + esc(o.nom) + '</div>' +
            '<div style="font-size:12.5px;color:var(--ink-2);margin-bottom:6px;line-height:1.4">' + esc(o.usage || '') + '</div>' +
            (o.prix ? '<div style="font-family:var(--mono);font-size:11px;color:var(--green,#0a5)">' + esc(clean(o.prix)) + '</div>' : '') +
            '</div>';
        }).join('') + '</div>'
      );
    }

    // ── DÉMARCHES ADMINISTRATIVES ─────────────────────────────────────────
    if (plan.demarches_admin && plan.demarches_admin.length) {
      html += card('Démarches administratives',
        plan.demarches_admin.map(function(step){
          return '<div style="display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--rule);align-items:center">' +
            '<div><b style="font-size:13.5px;color:var(--ink)">' + esc(step.etape) + '</b>' +
            (step.detail ? '<p style="color:var(--ink-2);font-size:12.5px;margin:4px 0 0;line-height:1.4">' + esc(step.detail) + '</p>' : '') +
            '</div>' +
            '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-3);white-space:nowrap">' + esc(step.delai || '') + '</span>' +
            '<span style="font-family:var(--mono);font-size:11px;color:var(--accent);white-space:nowrap">' + esc(step.cout || '') + '</span>' +
            '</div>';
        }).join('')
      );
    }

    // ── CHECKLIST DOSSIER BANCAIRE ────────────────────────────────────────
    if (plan.annexes_checklist && plan.annexes_checklist.length) {
      html += card('Checklist dossier bancaire',
        '<div style="display:flex;flex-direction:column;gap:8px">' +
        plan.annexes_checklist.map(function(item){
          return '<label style="display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:var(--ink-2);cursor:pointer">' +
            '<input type="checkbox" style="margin-top:2px;accent-color:var(--accent)">' +
            '<span>' + esc(item) + '</span></label>';
        }).join('') + '</div>'
      );
    }

    // ── RESSOURCES GRATUITES ──────────────────────────────────────────────
    if (d && d.ressources_gratuites_recommandees && d.ressources_gratuites_recommandees.length) {
      html += card('Ressources gratuites recommandées',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
        d.ressources_gratuites_recommandees.map(function(r){
          return '<div style="padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">' + esc(r.organisme) + '</div>' +
            '<div style="font-size:12.5px;color:var(--ink-2);margin-bottom:6px;line-height:1.4">' + esc(r.service || '') + '</div>' +
            '<div style="font-family:var(--mono);font-size:11px;color:var(--green,#0a5)">' + esc(r.cout || '') + '</div>' +
            (r.url ? '<div style="font-family:var(--mono);font-size:10px;color:var(--accent);margin-top:4px">' + esc(r.url) + '</div>' : '') +
            '</div>';
        }).join('') + '</div>'
      );
    }

    // ── EMAILS ────────────────────────────────────────────────────────────
    [['email_prospection','Email de prospection'],['email_fournisseur','Email fournisseur'],['email_relance','Email de relance']].forEach(function(e) {
      var em = plan[e[0]];
      if (em && (em.sujet || em.corps)) {
        html += card(e[1],
          '<div style="background:var(--bg);border-radius:8px;padding:14px;border:1px solid var(--rule)">' +
          (em.sujet ? '<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3);margin-bottom:4px">Objet : <span style="color:var(--ink)">' + esc(em.sujet) + '</span></div>' : '') +
          (em.corps ? '<pre style="font-size:13px;color:var(--ink-2);white-space:pre-wrap;margin:8px 0 0;line-height:1.5;font-family:inherit">' + esc(em.corps) + '</pre>' : '') +
          '</div>'
        );
      }
    });

    // ── DOCUMENTS TÉLÉCHARGEABLES ─────────────────────────────────────────
    html += '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:12px;padding:24px;margin-bottom:20px">';
    html += '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:14px">Documents annexes — téléchargeables</div>';
    html += '<div class="docs-grid" id="dDocsGrid"></div>';
    html += '</div>';

    // ── CHECKLIST BANCABILITÉ ─────────────────────────────────────────────
    html += '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:12px;padding:24px;margin-bottom:20px">';
    html += '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:14px">Préparation bancaire — checklist</div>';
    html += '<div class="banc-score-bar">';
    html += '<div class="banc-track"><div class="banc-fill" id="dBancFill" style="width:0%"></div></div>';
    html += '<div class="banc-pct" id="dBancPct">0%</div>';
    html += '<div class="banc-label" id="dBancLabel">À compléter</div>';
    html += '</div>';
    html += '<div class="banc-items" id="dBancItems"></div>';
    html += '</div>';

    // ── DOSSIER DE CRÉATION ───────────────────────────────────────────────
    html += '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:12px;padding:24px;margin-bottom:20px">';
    html += '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px">Dossier de création — documents juridiques</div>';
    html += '<p style="font-size:13px;color:var(--ink-3);margin:0 0 14px;line-height:1.5">Statuts, checklist URSSAF, ouverture compte pro, coûts administratifs — tous pré-remplis pour ton projet.</p>';
    html += '<button onclick="generateDossier()" class="btn btn-ghost">Générer mon dossier complet →</button>';
    html += '</div>';

    // ── BOUTONS ───────────────────────────────────────────────────────────
    html += '<div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap">' +
      '<button onclick="(function(){var r=document.getElementById(\'dashPlanResult\');if(r)r.style.display=\'none\';var f=document.querySelector(\'.gen-grid\');if(f)f.style.display=\'\';var b=document.querySelector(\'.gen-banner\');if(b)b.style.display=\'\';var h=document.querySelector(\'.page-head\');if(h)h.style.display=\'\';})()" class="btn btn-ghost">← Nouveau plan</button>' +
      '<button onclick="window.go&&window.go(\'expert\')" class="btn btn-accent">Affiner avec l\'Expert →</button>' +
      '</div>';

    html += '</div>';
    container.innerHTML = html;

    // Remplir les sections dynamiques
    if (typeof fillDocumentsAnnexes === 'function') fillDocumentsAnnexes(plan);
    if (typeof fillBancabilite === 'function') fillBancabilite(plan);
    if (typeof applyReliabilityIndicators === 'function') applyReliabilityIndicators(container);

    if (typeof window.updateUsage === 'function') window.updateUsage();
  };

})();
