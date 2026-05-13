/**
 * fiche-synthese.js
 * Génère une fiche synthèse A4 professionnelle (HTML → impression PDF).
 * Rendu print-ready avec @media print, @page, color-adjust exact.
 */

import { fmtEur } from '../enrich-plan.js';

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function buildFicheSynthese(plan) {
  const date = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

  // KPIs principaux
  const kpis = [
    { label: 'CA An 1',         val: fmtEur(plan.ca1),           icon: '📈' },
    { label: 'CA An 3',         val: fmtEur(plan.ca3),           icon: '🚀' },
    { label: 'Marge brute',     val: Math.round(plan.tauxMargeCV * 100) + ' %', icon: '💹' },
    { label: 'Investissement',  val: fmtEur(plan.totalInvest),   icon: '💰' },
    { label: 'Apport perso',    val: fmtEur(plan.apport),        icon: '🏦' },
    { label: 'Prêt bancaire',   val: fmtEur(plan.pret),          icon: '🏛️' },
    { label: 'Point mort',      val: plan.breakEvenMois ? `Mois ${plan.breakEvenMois}` : '—', icon: '⚖️' },
    { label: 'Score viabilité', val: plan.score ? plan.score + ' / 100' : '—', icon: '⭐' },
  ];

  // Forces / Risques / Opportunités depuis les données plan
  const forces = [
    plan.proposition_valeur ? plan.proposition_valeur.slice(0, 120) : null,
    plan.offres?.[0] ? `Offre phare : ${plan.offres[0].nom}` : null,
    plan.marche_taille ? `Marché : ${plan.marche_taille}` : null,
  ].filter(Boolean).slice(0, 3);

  const risques = (plan.risques || []).slice(0, 3).map(r => `${r.titre || r} (${r.niveau || ''})`);

  const opps = [
    plan.marche_croissance ? `Croissance marché : ${plan.marche_croissance}` : null,
    (plan.aides || []).filter(a => a.applicable).slice(0, 2).map(a => a.nom).join(', ') || null,
    plan.acquisition?.[0]?.canal ? `Canal clé : ${plan.acquisition[0].canal}` : null,
  ].filter(Boolean).slice(0, 3);

  // Tableau financier 3 ans
  const taux = plan.tauxMargeCV || 0.45;
  const cf   = (plan.chargesFixesMois || 0) * 12;
  const ca   = [plan.ca1, plan.ca2, plan.ca3];
  const cv   = ca.map(c => Math.round(c * (1 - taux)));
  const mb   = ca.map((c, i) => c - cv[i]);
  const rex  = ca.map((c, i) => c - cv[i] - cf);

  const fin3row = (label, vals, bold = false, color = '') => `
    <tr style="${bold ? 'font-weight:700;' : ''}${color ? `color:${color};` : ''}">
      <td style="padding:5px 8px;border:1px solid #dde3f0;">${esc(label)}</td>
      ${vals.map(v => `<td style="text-align:right;padding:5px 8px;border:1px solid #dde3f0;font-family:monospace;">${fmtEur(v)}</td>`).join('')}
    </tr>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Fiche synthèse — ${esc(plan.nom_business)}</title>
<style>
  /* ── Reset ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Print page A4 ── */
  @page {
    size: A4 portrait;
    margin: 0;
  }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr { page-break-inside: avoid; }
    .page { margin: 0; box-shadow: none; }
  }

  /* ── Base ── */
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10px;
    color: #1a1d26;
    background: #f0f2f8;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 10mm auto;
    background: #fff;
    box-shadow: 0 4px 32px rgba(0,0,0,0.12);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── Header gradient ── */
  .doc-header {
    background: linear-gradient(135deg, #2B5797 0%, #6b8fef 60%, #a78bfa 100%);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 20px 24px 18px;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .doc-header h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .doc-header .tagline { font-size: 11px; opacity: 0.85; }
  .doc-header .badges { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .badge {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 10px;
    font-weight: 600;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .date-badge { font-size: 9px; opacity: 0.7; }

  /* ── Body ── */
  .doc-body { padding: 16px 20px; flex: 1; }

  /* ── KPI grid ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .kpi-card {
    border: 1px solid #dde3f0;
    border-radius: 6px;
    padding: 8px 10px;
    background: #f8f9fd;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .kpi-icon { font-size: 14px; margin-bottom: 2px; }
  .kpi-val  { font-size: 13px; font-weight: 700; color: #2B5797; }
  .kpi-lbl  { font-size: 8px; color: #7a7f9a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 1px; }

  /* ── Two-col ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }

  /* ── Block ── */
  .block {
    border: 1px solid #dde3f0;
    border-radius: 6px;
    padding: 10px 12px;
    page-break-inside: avoid;
  }
  .block-title {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #2B5797;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #dde3f0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .block p { font-size: 9px; line-height: 1.6; color: #2d2f3e; }

  /* ── Table financière ── */
  .fin-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 14px; }
  .fin-table th {
    background: #2B5797;
    color: #fff;
    padding: 6px 8px;
    text-align: left;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .fin-table th:not(:first-child) { text-align: right; }

  /* ── SWOT three-col ── */
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .swot-forces { border-top: 3px solid #1E7E34; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .swot-risques { border-top: 3px solid #C82333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .swot-opps    { border-top: 3px solid #2B5797; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .swot-forces .block-title  { color: #1E7E34; }
  .swot-risques .block-title { color: #C82333; }
  .swot-opps .block-title    { color: #2B5797; }
  .swot-item { display: flex; gap: 6px; align-items: flex-start; font-size: 9px; margin-bottom: 4px; line-height: 1.4; }
  .swot-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .dot-green  { background: #1E7E34; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .dot-red    { background: #C82333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .dot-blue   { background: #2B5797; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* ── Footer ── */
  .doc-footer {
    background: #f2f5fb;
    border-top: 2px solid #2B5797;
    padding: 8px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    color: #7a7f9a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-footer .brand { font-weight: 700; color: #2B5797; }

  /* ── Print button ── */
  .no-print {
    position: fixed; top: 16px; right: 16px;
    padding: 10px 20px;
    background: #2B5797; color: #fff;
    border: none; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    cursor: pointer; z-index: 999;
    box-shadow: 0 2px 12px rgba(43,87,151,0.3);
  }
</style>
</head>
<body>
<button class="no-print" onclick="window.print()">🖨️ Imprimer / Enregistrer PDF</button>

<div class="page">

  <!-- Header -->
  <div class="doc-header">
    <div>
      <h1>${esc(plan.nom_business)}</h1>
      <div class="tagline">${esc(plan.tagline)}</div>
    </div>
    <div class="badges">
      ${plan.score ? `<div class="badge">Score ${plan.score}/100</div>` : ''}
      <div class="badge">${esc(plan.aspects_juridiques?.slice?.(0,30) || 'Création')}</div>
      <div class="date-badge">Généré le ${date}</div>
    </div>
  </div>

  <!-- Body -->
  <div class="doc-body">

    <!-- KPI grid -->
    <div class="kpi-grid">
      ${kpis.map(k => `
        <div class="kpi-card">
          <div class="kpi-icon">${k.icon}</div>
          <div class="kpi-val">${esc(k.val)}</div>
          <div class="kpi-lbl">${esc(k.label)}</div>
        </div>`).join('')}
    </div>

    <!-- Projet + Financement -->
    <div class="two-col">
      <div class="block">
        <div class="block-title">Présentation du projet</div>
        <p>${esc((plan.presentation_projet || plan.resume_executif || '').slice(0, 500))}</p>
      </div>
      <div class="block">
        <div class="block-title">Financement</div>
        <p style="margin-bottom:6px"><strong>Investissement :</strong> ${fmtEur(plan.totalInvest)}</p>
        <p style="margin-bottom:6px"><strong>Apport perso :</strong> ${fmtEur(plan.apport)}</p>
        <p style="margin-bottom:6px"><strong>Prêt banque :</strong> ${fmtEur(plan.pret)}</p>
        <p style="margin-bottom:6px"><strong>Aide BPI :</strong> ${fmtEur(plan.bpi)}</p>
        ${plan.aides?.filter(a => a.applicable).slice(0,2).map(a =>
          `<p style="color:#1E7E34;margin-bottom:3px">✓ ${esc(a.nom)}</p>`
        ).join('') || ''}
      </div>
    </div>

    <!-- Tableau financier -->
    <table class="fin-table">
      <thead>
        <tr>
          <th>Postes</th>
          <th style="text-align:right">An 1</th>
          <th style="text-align:right">An 2</th>
          <th style="text-align:right">An 3</th>
        </tr>
      </thead>
      <tbody>
        ${fin3row("Chiffre d'affaires HT", ca, true, '#2B5797')}
        ${fin3row("Coûts variables", cv)}
        ${fin3row("Marge brute", mb, true)}
        ${fin3row("Charges fixes", Array(3).fill(cf))}
        ${fin3row("Résultat d'exploitation", rex, true, rex[0] >= 0 ? '#1E7E34' : '#C82333')}
      </tbody>
    </table>

    <!-- SWOT -->
    <div class="three-col">
      <div class="block swot-forces">
        <div class="block-title">Forces</div>
        ${forces.map(f => `<div class="swot-item"><span class="swot-dot dot-green"></span><span>${esc(f)}</span></div>`).join('')}
      </div>
      <div class="block swot-risques">
        <div class="block-title">Risques</div>
        ${risques.map(r => `<div class="swot-item"><span class="swot-dot dot-red"></span><span>${esc(r)}</span></div>`).join('')}
      </div>
      <div class="block swot-opps">
        <div class="block-title">Opportunités</div>
        ${opps.map(o => `<div class="swot-item"><span class="swot-dot dot-blue"></span><span>${esc(o)}</span></div>`).join('')}
      </div>
    </div>

  </div><!-- /doc-body -->

  <!-- Footer -->
  <div class="doc-footer">
    <span><span class="brand">Eadee</span> — Business Plan IA</span>
    <span>Document confidentiel — ${esc(plan.nom_business)} — ${date}</span>
    <span>⚠ À valider par un expert-comptable avant tout envoi</span>
  </div>

</div><!-- /page -->
</body>
</html>`;
}

export function buildFicheSyntheseContent(plan) { return buildFicheSynthese(plan); }
