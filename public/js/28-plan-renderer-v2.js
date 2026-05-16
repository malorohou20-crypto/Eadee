// ========== PLAN RENDERER V2 — toutes les sections ==========
(function() {

  var SB_URL = 'https://gyzyvcvphizbbdhaiwne.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5enl2Y3ZwaGl6YmJkaGFpd25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDc2MzQsImV4cCI6MjA5Mjk4MzYzNH0.onkLrBBW1BV4Rk2Rj2Er2boqvT3_RI4gbUwaJEtHsvc';

  // Helpers
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function clean(s) {
    return String(s || '').replace(/\{\{[VEH]:(.*?)\|.*?\}\}/g, '$1').trim();
  }
  function card(title, body) {
    if (!body || !body.trim()) return '';
    return '<div style="background:var(--paper);border:1px solid var(--rule);border-radius:12px;padding:24px;margin-bottom:20px">' +
      '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:14px">' + title + '</div>' +
      body +
      '</div>';
  }
  function tag(label, color) {
    color = color || 'var(--accent)';
    return '<span style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:' + color + ';border:1px solid currentColor;padding:2px 8px;border-radius:20px;white-space:nowrap">' + esc(label) + '</span>';
  }
  function badge(niveau) {
    var c = niveau === 'élevé' ? 'var(--red)' : niveau === 'moyen' ? 'var(--accent)' : 'var(--green)';
    return tag(niveau, c);
  }
  function para(text) {
    if (!text) return '';
    return '<p style="font-size:14px;color:var(--ink-2);margin:0;line-height:1.65">' + esc(clean(text)) + '</p>';
  }
  function list(arr, fn) {
    if (!arr || !arr.length) return '';
    return '<div style="display:flex;flex-direction:column;gap:10px">' +
      arr.map(fn).join('') +
      '</div>';
  }

  window._renderV2PlanResult = function(plan, container) {
    if (!plan || !container) return;

    var score = (plan.scores && plan.scores.score_viabilite && plan.scores.score_viabilite.note) || plan.score_viabilite || '—';
    var scoreBanc = (plan.scores && plan.scores.score_bancabilite && plan.scores.score_bancabilite.note) || '—';
    var scoreColor = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--accent)' : 'var(--red)';
    var planName = plan.nom_business || plan.nom_entreprise || plan.name || 'Business Plan';

    var html = '<div style="max-width:940px;margin:0 auto;padding:0 40px 100px">';

    // ── EN-TÊTE ──────────────────────────────────────────────
    html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:32px;flex-wrap:wrap">';
    html += '<div style="flex:1;min-width:200px">';
    html += '<span style="font-family:var(--mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--green);display:block;margin-bottom:8px">Plan généré ✓</span>';
    html += '<h2 style="font-family:var(--serif);font-size:42px;line-height:1.05;letter-spacing:-0.02em;margin:0 0 6px;font-weight:400">' + esc(planName) + '</h2>';
    if (plan.tagline) html += '<p style="font-family:var(--serif);font-style:italic;color:var(--ink-2);font-size:17px;margin:0">' + esc(plan.tagline) + '</p>';
    html += '</div>';
    html += '<div style="display:flex;gap:12px;flex-shrink:0">';
    html += '<div style="text-align:center;padding:18px 20px;background:var(--paper);border:1px solid var(--rule);border-radius:12px">';
    html += '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px">Viabilité</div>';
    html += '<div style="font-family:var(--serif);font-size:52px;line-height:0.95;color:' + scoreColor + '">' + score + '</div>';
    html += '<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">/100</div>';
    html += '</div>';
    if (scoreBanc !== '—') {
      html += '<div style="text-align:center;padding:18px 20px;background:var(--paper);border:1px solid var(--rule);border-radius:12px">';
      html += '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px">Bancabilité</div>';
      html += '<div style="font-family:var(--serif);font-size:52px;line-height:0.95;color:var(--accent)">' + scoreBanc + '</div>';
      html += '<div style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">/100</div>';
      html += '</div>';
    }
    html += '</div></div>';

    // ── DISCLAIMER ───────────────────────────────────────────
    var d = plan.disclaimer;
    if (d && d.message_entrepreneur) {
      var me = d.message_entrepreneur;
      html += '<div style="padding:16px 20px;background:oklch(0.96 0.03 85);border:1px solid var(--rule-2);border-radius:10px;margin-bottom:24px">';
      html += '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:6px">⚠ ' + esc(me.titre || 'Note importante') + '</div>';
      html += '<p style="font-size:13px;color:var(--ink-2);margin:0;line-height:1.55">' + esc(me.corps || '') + '</p>';
      if (me.recommandation_concrete) html += '<p style="font-size:13px;color:var(--accent-ink);margin:8px 0 0;font-weight:500">' + esc(me.recommandation_concrete) + '</p>';
      html += '</div>';
    }

    // ── PITCH ────────────────────────────────────────────────
    if (plan.pitch_30s) {
      html += '<div style="padding:20px 24px;background:var(--accent-bg);border:1px solid oklch(0.82 0.05 35);border-radius:10px;margin-bottom:20px">';
      html += '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent-ink);margin-bottom:8px">Pitch 30s</div>';
      html += para(plan.pitch_30s);
      html += '</div>';
    }

    // ── PRÉSENTATION PROJET ──────────────────────────────────
    if (plan.presentation_projet) html += card('Présentation du projet', para(plan.presentation_projet));

    // ── RÉSUMÉ EXÉCUTIF ──────────────────────────────────────
    html += card('Résumé exécutif', para(plan.resume_executif));

    // ── VISION BANQUIER ──────────────────────────────────────
    var vb = plan.resume_vision_banquier;
    if (vb) {
      var vbRows = [
        ['Montant demandé', vb.montant_demande], ['Durée souhaitée', vb.duree_souhaitee],
        ['Mensualité estimée', vb.mensualite_estimee], ['Capacité remboursement', vb.capacite_remboursement],
        ['Argument principal', vb.argument_principal]
      ].filter(function(r){ return r[1]; });
      if (vbRows.length) {
        html += card('Vision banquier',
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          vbRows.map(function(r){
            return '<div style="padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
              '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(r[0]) + '</div>' +
              '<div style="font-size:13.5px;color:var(--ink)">' + esc(clean(r[1])) + '</div>' +
              '</div>';
          }).join('') +
          (vb.garanties_proposees && vb.garanties_proposees.length ? '<div style="grid-column:1/-1;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)"><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Garanties proposées</div><div style="font-size:13px;color:var(--ink-2)">' + vb.garanties_proposees.map(function(g){ return esc(g); }).join(' · ') + '</div></div>' : '') +
          '</div>'
        );
      }
    }

    // ── PORTEUR ──────────────────────────────────────────────
    if (plan.porteur_projet) html += card('Porteur du projet', para(plan.porteur_projet));

    // ── PERSONA ───────────────────────────────────────────────
    var persona = plan.persona;
    if (persona && persona.nom) {
      html += card('Persona client cible',
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        [['Profil', persona.nom + (persona.age ? ' · ' + persona.age : '')],
         ['Situation', persona.situation],
         ['Douleurs', persona.douleurs],
         ['Motivations', persona.motivations],
         ['Où le trouver', persona.ou_le_trouver]
        ].filter(function(r){ return r[1]; }).map(function(r){
          return '<div style="padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(r[0]) + '</div>' +
            '<div style="font-size:13px;color:var(--ink-2);line-height:1.4">' + esc(r[1]) + '</div>' +
            '</div>';
        }).join('') +
        '</div>'
      );
    }

    // ── MARCHÉ ───────────────────────────────────────────────
    var marcheBody = '';
    if (plan.marche_analyse) marcheBody += para(plan.marche_analyse) + '<br>';
    var marcheStats = [
      ['Taille du marché', plan.marche_taille], ['Croissance', plan.marche_croissance],
      ['Part cible', plan.marche_part_cible], ['Clients potentiels', plan.marche_clients_potentiels]
    ].filter(function(r){ return r[1]; });
    if (marcheStats.length) {
      marcheBody += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:12px">' +
        marcheStats.map(function(r){
          return '<div style="padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">' + esc(r[0]) + '</div>' +
            '<div style="font-family:var(--serif);font-size:18px;color:var(--ink)">' + esc(clean(r[1])) + '</div>' +
            '</div>';
        }).join('') +
        '</div>';
    }
    if (plan.marche_tendances && plan.marche_tendances.length) {
      marcheBody += '<div style="margin-top:14px"><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Tendances</div>' +
        plan.marche_tendances.map(function(t){ return '<div style="font-size:13.5px;color:var(--ink-2);padding:6px 0;border-bottom:1px solid var(--rule)">→ ' + esc(t) + '</div>'; }).join('') +
        '</div>';
    }
    if (marcheBody.trim()) html += card('Analyse de marché', marcheBody);

    // ── PROPOSITION DE VALEUR ────────────────────────────────
    var pvBody = '';
    if (plan.proposition_valeur) pvBody += para(plan.proposition_valeur);
    if (plan.proposition_valeur_benefices && plan.proposition_valeur_benefices.length) {
      pvBody += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' +
        plan.proposition_valeur_benefices.map(function(b){ return '<div style="display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:var(--ink-2)"><span style="color:var(--green);font-weight:600;flex-shrink:0">✓</span>' + esc(b) + '</div>'; }).join('') +
        '</div>';
    }
    if (pvBody.trim()) html += card('Proposition de valeur', pvBody);

    // ── CONCURRENCE INTRO ─────────────────────────────────────
    if (plan.concurrence_intro) html += card('Environnement concurrentiel', para(plan.concurrence_intro));

    // ── CONCURRENTS ──────────────────────────────────────────
    if (plan.concurrents && plan.concurrents.length) {
      html += card('Analyse concurrentielle',
        plan.concurrents.map(function(c){
          return '<div style="padding:14px 0;border-bottom:1px solid var(--rule)">' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px">' +
            '<b style="font-size:14.5px">' + esc(c.nom) + '</b>' +
            badge(c.menace) +
            '</div>' +
            (c.description ? '<p style="color:var(--ink-2);font-size:13.5px;margin:0 0 4px;line-height:1.5">' + esc(c.description) + '</p>' : '') +
            (c.avantage_differentiel ? '<p style="color:var(--green);font-size:12.5px;margin:4px 0 0">Notre avantage : ' + esc(c.avantage_differentiel) + '</p>' : '') +
            (c.prix_moyen ? '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">Prix : ' + esc(clean(c.prix_moyen)) + '</span>' : '') +
            '</div>';
        }).join('')
      );
    }

    // ── MODÈLE ÉCONOMIQUE ─────────────────────────────────────
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
        }).join('') +
        '</div>';
    }
    if (mecoBody.trim()) html += card('Modèle économique & offres', mecoBody);

    // ── STRATÉGIE COMMERCIALE ─────────────────────────────────
    if (plan.strategie_commerciale) html += card('Stratégie commerciale', para(plan.strategie_commerciale));

    // ── ACQUISITION ───────────────────────────────────────────
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

    // ── PROJECTIONS REVENUS ──────────────────────────────────
    var revEntries = [
      ['M+1', plan.rev_m1], ['M+3', plan.rev_m3], ['M+6', plan.rev_m6],
      ['An 1', plan.rev_m12], ['18 mois', plan.rev_m18], ['An 2', plan.rev_m24], ['An 3', plan.rev_m36]
    ].filter(function(r){ return r[1]; });
    if (revEntries.length) {
      html += card('Projections de revenus',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px">' +
        revEntries.map(function(r){
          return '<div style="text-align:center;padding:14px 10px;border:1px solid var(--rule);border-radius:8px;background:var(--bg)">' +
            '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;color:var(--ink-3);text-transform:uppercase;margin-bottom:4px">' + r[0] + '</div>' +
            '<div style="font-family:var(--serif);font-size:20px;color:var(--ink)">' + esc(clean(r[1])) + '</div>' +
            '</div>';
        }).join('') +
        '</div>'
      );
    }

    // ── FINANCES DÉTAIL ──────────────────────────────────────
    if (plan.finances_detail && plan.finances_detail.length) {
      html += card('Finances — détail',
        '<div style="display:flex;flex-direction:column;gap:0">' +
        plan.finances_detail.map(function(f, i){
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--rule)">' +
            '<span style="font-size:13.5px;color:var(--ink-2)">' + esc(f.label) + '</span>' +
            '<span style="font-family:var(--mono);font-size:13px;color:var(--ink);font-weight:600">' + esc(clean(f.valeur)) + '</span>' +
            '</div>';
        }).join('') +
        '</div>'
      );
    }

    // ── TRÉSORERIE ────────────────────────────────────────────
    if (plan.tresorerie_detail) html += card('Trésorerie', para(plan.tresorerie_detail));

    // ── BILAN PRÉVISIONNEL ────────────────────────────────────
    if (plan.bilan_previsionnel) html += card('Bilan prévisionnel', para(plan.bilan_previsionnel));

    // ── PLAN FINANCEMENT ─────────────────────────────────────
    var pf = plan.plan_financement;
    if (pf) {
      var pfBody = '';
      if (pf.besoins) {
        pfBody += '<div style="margin-bottom:16px"><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Besoins</div>';
        ['investissements_materiels','investissements_immateriels','bfr_demarrage','tresorerie_securite'].forEach(function(k){
          if (pf.besoins[k]) pfBody += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--rule);font-size:13.5px"><span style="color:var(--ink-2)">' + esc(k.replace(/_/g,' ')) + '</span><span style="font-family:var(--mono);color:var(--ink)">' + esc(clean(pf.besoins[k])) + '</span></div>';
        });
        if (pf.besoins.total_besoins) pfBody += '<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:600"><span>Total besoins</span><span style="font-family:var(--mono);color:var(--accent)">' + esc(clean(pf.besoins.total_besoins)) + '</span></div>';
        pfBody += '</div>';
      }
      if (pf.ressources) {
        pfBody += '<div><div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Ressources</div>';
        ['apport_personnel','pret_bancaire','pret_bpi','pret_honneur','subventions'].forEach(function(k){
          var v = pf.ressources[k];
          if (v && v !== 'null' && v !== null) pfBody += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--rule);font-size:13.5px"><span style="color:var(--ink-2)">' + esc(k.replace(/_/g,' ')) + '</span><span style="font-family:var(--mono);color:var(--ink)">' + esc(clean(v)) + '</span></div>';
        });
        if (pf.ressources.total_ressources) pfBody += '<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:600"><span>Total ressources</span><span style="font-family:var(--mono);color:var(--green)">' + esc(clean(pf.ressources.total_ressources)) + '</span></div>';
        pfBody += '</div>';
      }
      if (pf.message_banquier) pfBody += '<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;border-left:3px solid var(--accent);font-size:13px;color:var(--ink-2);line-height:1.5">' + esc(pf.message_banquier) + '</div>';
      if (pfBody.trim()) html += card('Plan de financement', pfBody);
    }

    // ── SEUIL DE RENTABILITÉ ─────────────────────────────────
    var sr = plan.seuil_rentabilite;
    if (sr) {
      var srRows = [
        ['Charges fixes/mois', sr.charges_fixes_mensuelles],
        ['Taux marge sur CV', sr.taux_marge_sur_cv],
        ['Point mort CA', sr.point_mort_ca],
        ['Break-even mois', sr.break_even_mois]
      ].filter(function(r){ return r[1]; });
      var srBody = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:14px">' +
        srRows.map(function(r){
          return '<div style="padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">' + esc(r[0]) + '</div>' +
            '<div style="font-family:var(--serif);font-size:18px;color:var(--ink)">' + esc(clean(r[1])) + '</div>' +
            '</div>';
        }).join('') +
        '</div>';
      if (sr.detail) srBody += para(sr.detail);
      if (sr.interpretation_bancaire) srBody += '<div style="margin-top:10px;padding:10px;background:var(--bg);border-left:3px solid var(--green);border-radius:4px;font-size:13px;color:var(--ink-2)">' + esc(sr.interpretation_bancaire) + '</div>';
      html += card('Seuil de rentabilité', srBody);
    }

    // ── INVESTISSEMENTS ───────────────────────────────────────
    if (plan.investissements && plan.investissements.length) {
      html += card('Investissements',
        '<div style="display:flex;flex-direction:column;gap:0">' +
        plan.investissements.map(function(inv){
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--rule)">' +
            '<span style="font-size:13.5px;color:' + (inv.total ? 'var(--ink);font-weight:600' : 'var(--ink-2)') + '">' + esc(inv.label) + '</span>' +
            '<span style="font-family:var(--mono);font-size:13px;color:' + (inv.total ? 'var(--accent)' : 'var(--ink)') + '">' + esc(clean(inv.montant)) + '</span>' +
            '</div>';
        }).join('') +
        '</div>'
      );
    }

    // ── ASPECTS JURIDIQUES ────────────────────────────────────
    if (plan.aspects_juridiques) html += card('Aspects juridiques', para(plan.aspects_juridiques));
    if (plan.aspects_organisationnels) html += card('Organisation', para(plan.aspects_organisationnels));

    // ── RISQUES ───────────────────────────────────────────────
    if (plan.risques && plan.risques.length) {
      html += card('Risques & mitigation',
        plan.risques.map(function(r){
          return '<div style="display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px 0;border-bottom:1px solid var(--rule)">' +
            '<div>' +
            '<b style="font-size:14px;display:block;margin-bottom:4px">' + esc(r.titre) + '</b>' +
            '<p style="color:var(--ink-2);font-size:13px;margin:0 0 4px;line-height:1.45">' + esc(r.solution || '') + '</p>' +
            (r.solution_preventive ? '<p style="color:var(--green);font-size:12px;margin:4px 0 0">Préventif : ' + esc(r.solution_preventive) + '</p>' : '') +
            '</div>' +
            '<div style="align-self:flex-start">' + badge(r.niveau) + '</div>' +
            '</div>';
        }).join('')
      );
    }

    // ── PLAN 90 JOURS ─────────────────────────────────────────
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

    // ── AIDES & SUBVENTIONS ───────────────────────────────────
    if (plan.aides_subventions && plan.aides_subventions.length) {
      html += card('Aides & subventions',
        plan.aides_subventions.map(function(a){
          var col = a.applicable ? 'var(--green)' : 'var(--ink-3)';
          return '<div style="display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px 0;border-bottom:1px solid var(--rule);align-items:start">' +
            '<div>' +
            '<b style="font-size:13.5px;color:' + col + '">' + esc(a.nom) + '</b>' +
            '<p style="color:var(--ink-2);font-size:13px;margin:4px 0 0">' + esc(a.conditions || '') + '</p>' +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0">' +
            '<div style="font-family:var(--mono);font-size:12px;color:var(--ink)">' + esc(clean(a.montant || '')) + '</div>' +
            (a.lien ? '<div style="font-family:var(--mono);font-size:10px;color:var(--accent)">' + esc(a.lien) + '</div>' : '') +
            '</div>' +
            '</div>';
        }).join('')
      );
    }

    // ── KPIs ─────────────────────────────────────────────────
    if (plan.kpis && plan.kpis.length) {
      html += card('KPIs à suivre',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">' +
        plan.kpis.map(function(k){
          return '<div style="padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">' + esc(k.nom) + '</div>' +
            '<div style="font-family:var(--serif);font-size:16px;color:var(--accent);margin-bottom:4px">' + esc(clean(k.cible || '')) + '</div>' +
            '<div style="font-family:var(--mono);font-size:10px;color:var(--ink-3)">' + esc(k.frequence || '') + '</div>' +
            '</div>';
        }).join('') +
        '</div>'
      );
    }

    // ── OUTILS ───────────────────────────────────────────────
    if (plan.outils && plan.outils.length) {
      html += card('Outils recommandés',
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">' +
        plan.outils.map(function(o){
          return '<div style="padding:14px;background:var(--bg);border-radius:8px;border:1px solid var(--rule)">' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:4px">' + esc(o.nom) + '</div>' +
            '<div style="font-size:12.5px;color:var(--ink-2);margin-bottom:6px;line-height:1.4">' + esc(o.usage || '') + '</div>' +
            (o.prix ? '<div style="font-family:var(--mono);font-size:11px;color:var(--green)">' + esc(clean(o.prix)) + '</div>' : '') +
            '</div>';
        }).join('') +
        '</div>'
      );
    }

    // ── DÉMARCHES ADMIN ───────────────────────────────────────
    if (plan.demarches_admin && plan.demarches_admin.length) {
      html += card('Démarches administratives',
        plan.demarches_admin.map(function(d, i){
          return '<div style="display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--rule);align-items:center">' +
            '<div>' +
            '<b style="font-size:13.5px;color:var(--ink)">' + esc(d.etape) + '</b>' +
            '<p style="color:var(--ink-2);font-size:12.5px;margin:4px 0 0;line-height:1.4">' + esc(d.detail || '') + '</p>' +
            '</div>' +
            '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-3);white-space:nowrap">' + esc(d.delai || '') + '</span>' +
            '<span style="font-family:var(--mono);font-size:11px;color:var(--accent);white-space:nowrap">' + esc(d.cout || '') + '</span>' +
            '</div>';
        }).join('')
      );
    }

    // ── ANNEXES / CHECKLIST ───────────────────────────────────
    if (plan.annexes_checklist && plan.annexes_checklist.length) {
      html += card('Checklist dossier bancaire',
        '<div style="display:flex;flex-direction:column;gap:8px">' +
        plan.annexes_checklist.map(function(item){
          return '<label style="display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:var(--ink-2);cursor:pointer">' +
            '<input type="checkbox" style="margin-top:2px;accent-color:var(--accent)">' +
            '<span>' + esc(item) + '</span>' +
            '</label>';
        }).join('') +
        '</div>'
      );
    }

    // ── EMAILS ───────────────────────────────────────────────
    var emailSections = [
      ['email_prospection', 'Email de prospection'],
      ['email_fournisseur', 'Email fournisseur'],
      ['email_relance', 'Email de relance']
    ];
    emailSections.forEach(function(e) {
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

    // ── BOUTONS ───────────────────────────────────────────────
    html += '<div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap">' +
      '<button onclick="(function(){var r=document.getElementById(\'dashPlanResult\');if(r)r.style.display=\'none\';var f=document.querySelector(\'.gen-grid\');if(f)f.style.display=\'\';var b=document.querySelector(\'.gen-banner\');if(b)b.style.display=\'\';var h=document.querySelector(\'.page-head\');if(h)h.style.display=\'\';})()" class="btn btn-ghost">← Nouveau plan</button>' +
      '<button onclick="window.copyPlan&&window.copyPlan()" class="btn btn-ghost">Copier le texte</button>' +
      '<button onclick="window.go&&window.go(\'expert\')" class="btn btn-accent">Affiner avec l\'Expert →</button>' +
      '</div>';

    html += '</div>';
    container.innerHTML = html;

    if (typeof window.updateUsage === 'function') window.updateUsage();
  };

})();
