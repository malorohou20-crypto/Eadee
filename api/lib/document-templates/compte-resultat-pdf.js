/**
 * compte-resultat-pdf.js
 * Compte de résultat 3 ans — version HTML print-optimisée (→ PDF via navigateur).
 * Rendu A4 portrait professionnel avec @media print / @page.
 */

import { fmtEur } from '../enrich-plan.js';

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function pct(n, ca) {
  if (!ca) return '—';
  const p = Math.round((n / ca) * 100);
  return `<span style="font-size:8px;color:#9da5c0;font-style:italic">${p} %</span>`;
}

function fmtStyled(n, bold = false) {
  const color = n < 0 ? '#C82333' : n > 0 ? '#1E7E34' : '#9da5c0';
  const w = bold ? 'font-weight:700' : 'font-weight:400';
  return `<span style="color:${n === 0 ? '#9da5c0' : color};${w}">${n === 0 ? '—' : fmtEur(n)}</span>`;
}

export function buildCompteResultatPdf(plan) {
  const ca   = [plan.ca1 || 0, plan.ca2 || 0, plan.ca3 || 0];
  const taux = plan.tauxMargeCV || 0.45;
  const cf   = (plan.chargesFixesMois || 0) * 12;

  const cv     = ca.map(c => Math.round(c * (1 - taux)));
  const mb     = ca.map((c, i) => c - cv[i]);
  const loyer  = Array(3).fill(Math.round(cf * 0.25));
  const sal    = Array(3).fill(Math.round(cf * 0.45));
  const mkt    = Array(3).fill(Math.round(cf * 0.15));
  const autres = Array(3).fill(Math.round(cf * 0.15));
  const amort  = [0,1,2].map(() => Math.round((plan.totalInvest || 0) / 5));
  const ebitda = ca.map((c, i) => c - cv[i] - loyer[i] - sal[i] - mkt[i] - autres[i]);
  const ebit   = ebitda.map((e, i) => e - amort[i]);
  const inter  = [0,1,2].map(i => Math.round((plan.pret || 0) * [0.04, 0.03, 0.02][i]));
  const rai    = ebit.map((e, i) => e - inter[i]);
  const is     = rai.map((r, i) => r <= 0 ? 0 : Math.round(r * [0.15, 0.15, 0.25][i]));
  const rn     = rai.map((r, i) => r - is[i]);
  const totalCF = [0,1,2].map(i => loyer[i] + sal[i] + mkt[i] + autres[i] + amort[i]);

  const today = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

  function row(label, vals, style = 'data', isTotal = false, showPct = true) {
    const bg = {
      data:      '',
      alt:       'background:#f6f8fd',
      total:     'background:#dce4f5;font-weight:700;border-top:2px solid #2B5797;border-bottom:2px solid #2B5797',
      highlight: 'background:#e8f4e8;font-weight:700;border-top:2px solid #1E7E34;border-bottom:2px solid #1E7E34',
      negative:  'background:#fde8e8;font-weight:700;border-top:2px solid #C82333;border-bottom:2px solid #C82333',
      section:   'background:#4a7acf;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.05em',
    }[style] || '';

    if (style === 'section') {
      return `<tr style="${bg}">
        <td colspan="7" style="padding:5px 10px;font-size:9px">${esc(label)}</td>
      </tr>`;
    }

    const isHighlight = style === 'highlight';
    const colorClass  = style === 'total' || isHighlight ? '#2B5797' : '';

    return `<tr style="${bg}">
      <td style="padding:5px 10px;font-size:9.5px">${esc(label)}</td>
      ${vals.map((v, i) => `
        <td style="text-align:right;padding:5px 8px;font-size:9.5px">${fmtStyled(v, isTotal || isHighlight)}</td>
        <td style="text-align:right;padding:5px 6px;font-size:8px;color:#9da5c0;font-style:italic">${showPct && ca[i] ? Math.round((v/ca[i])*100)+' %' : ''}</td>
      `).join('')}
    </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Compte de résultat — ${esc(plan.nom_business)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @page { size: A4 portrait; margin: 8mm 10mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr { page-break-inside: avoid; }
    .section-break { page-break-before: always; }
  }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10px;
    background: #eef1f8;
    color: #2d2f3e;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 190mm;
    min-height: 267mm;
    margin: 8mm auto;
    background: #fff;
    box-shadow: 0 4px 32px rgba(0,0,0,.12);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .doc-header {
    background: linear-gradient(135deg, #1a3a6b 0%, #2B5797 55%, #6b8fef 100%);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    padding: 16px 20px 14px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .doc-header h1 { font-size: 16px; font-weight: 700; color: #fff; }
  .doc-header .sub { font-size: 9px; color: rgba(255,255,255,.75); margin-top: 3px; }
  .doc-header .meta { text-align: right; font-size: 8px; color: rgba(255,255,255,.65); }
  .badge {
    background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.3);
    border-radius: 20px; padding: 2px 10px; font-size: 9px; font-weight: 700;
    color: #fff; margin-bottom: 4px; display: inline-block;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  /* KPI strip (4 colonnes) */
  .kpi-strip {
    display: grid; grid-template-columns: repeat(4, 1fr);
    background: #f0f4fb; border-bottom: 1px solid #dce4f5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .kpi { padding: 8px 12px; border-right: 1px solid #dce4f5; }
  .kpi:last-child { border-right: none; }
  .kpi-label { font-size: 7px; text-transform: uppercase; letter-spacing: .08em; color: #7a7f9a; }
  .kpi-value { font-size: 13px; font-weight: 700; color: #2B5797; margin-top: 2px; }

  /* Chart bars synthétique */
  .bars {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 10px; padding: 10px 16px; background: #fafbfe;
    border-bottom: 1px solid #e8edf8;
  }
  .bar-col { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .bar-wrap { width: 100%; height: 40px; display: flex; align-items: flex-end; gap: 4px; background: #f0f4fb; border-radius: 4px; padding: 4px; }
  .bar { flex: 1; border-radius: 3px 3px 0 0; min-height: 2px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bar-label { font-size: 8px; font-weight: 700; color: #2B5797; }
  .bar-sub { font-size: 7px; color: #9da5c0; }

  /* Table */
  .table-wrap { flex: 1; padding: 12px 16px 8px; }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: #2B5797; color: #fff; font-weight: 700;
    font-size: 9px; padding: 6px 8px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  th:first-child { text-align: left; }
  th:not(:first-child) { text-align: right; }
  td { border: 1px solid #e2e8f4; }
  td:first-child { min-width: 170px; }

  /* Footer */
  .doc-footer {
    background: #f0f4fb; border-top: 2px solid #2B5797;
    padding: 6px 16px; display: flex; justify-content: space-between;
    font-size: 7px; color: #7a7f9a;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .brand { font-weight: 700; color: #2B5797; }

  /* Print button */
  .no-print {
    position: fixed; top: 16px; right: 16px;
    padding: 10px 20px; background: #2B5797; color: #fff;
    border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
    cursor: pointer; z-index: 999; box-shadow: 0 2px 12px rgba(43,87,151,.3);
  }
</style>
</head>
<body>
<button class="no-print" onclick="window.print()">🖨️ Exporter en PDF</button>

<div class="page">

  <!-- Header -->
  <div class="doc-header">
    <div>
      <h1>Compte de résultat prévisionnel</h1>
      <div class="sub">${esc(plan.nom_business)} · Projection 3 ans</div>
    </div>
    <div class="meta">
      ${plan.score ? `<div class="badge">Score ${plan.score}/100</div>` : ''}
      <div>Généré le ${today}</div>
      <div>Eadee — Business Plan IA</div>
    </div>
  </div>

  <!-- KPI strip -->
  <div class="kpi-strip">
    <div class="kpi"><div class="kpi-label">CA An 1</div><div class="kpi-value">${fmtEur(ca[0])}</div></div>
    <div class="kpi"><div class="kpi-label">CA An 3</div><div class="kpi-value">${fmtEur(ca[2])}</div></div>
    <div class="kpi"><div class="kpi-label">Marge brute</div><div class="kpi-value">${Math.round(taux*100)} %</div></div>
    <div class="kpi"><div class="kpi-label">Résultat net An 3</div><div class="kpi-value" style="color:${rn[2]>=0?'#1E7E34':'#C82333'}">${fmtEur(rn[2])}</div></div>
  </div>

  <!-- Barres visuelles CA -->
  <div class="bars">
    ${[0,1,2].map(i => {
      const maxCa = Math.max(...ca);
      const h = maxCa > 0 ? Math.max(4, Math.round((ca[i] / maxCa) * 32)) : 4;
      const hRn = rn[i] >= 0 && maxCa > 0 ? Math.max(2, Math.round((rn[i] / maxCa) * 32)) : 2;
      return `<div class="bar-col">
        <div class="bar-wrap">
          <div class="bar" style="height:${h}px;background:#6b8fef"></div>
          <div class="bar" style="height:${hRn}px;background:#34d399"></div>
        </div>
        <div class="bar-label">An ${i+1}</div>
        <div class="bar-sub">${fmtEur(ca[i])}</div>
      </div>`;
    }).join('')}
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Postes</th>
          <th>An 1</th><th style="font-style:italic;font-size:8px;background:#1a3a6b">% CA</th>
          <th>An 2</th><th style="font-style:italic;font-size:8px;background:#1a3a6b">% CA</th>
          <th>An 3</th><th style="font-style:italic;font-size:8px;background:#1a3a6b">% CA</th>
        </tr>
      </thead>
      <tbody>
        ${row("CHIFFRE D'AFFAIRES", [], 'section')}
        ${row("Chiffre d'affaires HT", ca, 'total', true)}

        ${row('MARGE BRUTE', [], 'section')}
        ${row('Coûts variables / Achats', cv, 'alt', false)}
        ${row('MARGE BRUTE', mb, 'highlight', true)}

        ${row("CHARGES D'EXPLOITATION", [], 'section')}
        ${row('Loyer & charges locatives', loyer, 'data', false)}
        ${row('Salaires & charges sociales', sal, 'alt', false)}
        ${row('Marketing & communication', mkt, 'data', false)}
        ${row('Autres charges fixes', autres, 'alt', false)}
        ${row('Amortissements', amort, 'data', false)}
        ${row('TOTAL CHARGES FIXES', totalCF, 'total', true)}

        ${row('RÉSULTATS', [], 'section')}
        ${row('EBITDA', ebitda, 'highlight', true)}
        ${row("EBIT (résultat d'exploitation)", ebit, 'total', true)}
        ${row('Charges financières', inter, 'alt', false)}
        ${row('Résultat avant impôt', rai, 'total', true)}
        ${row('Impôt sur les sociétés', is, 'alt', false)}
        ${row('RÉSULTAT NET', rn, rn[0] >= 0 ? 'highlight' : 'negative', true)}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="doc-footer">
    <span><span class="brand">Eadee</span> — Business Plan IA</span>
    <span>IS : 15% an1-2 / 25% an3 · Projections indicatives à valider avec votre expert-comptable</span>
    <span>${esc(plan.nom_business)} — Confidentiel</span>
  </div>

</div>
</body>
</html>`;
}
