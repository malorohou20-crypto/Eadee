/**
 * tresorerie-pdf.js
 * Plan de trésorerie 12 mois — version HTML print-optimisée (→ PDF via navigateur).
 * Rendu A4 paysage professionnel avec @media print / @page.
 */

import { fmtEur } from '../enrich-plan.js';

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fmtN(n) {
  if (n === 0) return '<span style="color:#c0c5d8">—</span>';
  const color = n < 0 ? '#C82333' : '#1E7E34';
  return `<span style="color:${color};font-weight:${Math.abs(n) > 0 ? '600' : '400'}">${fmtEur(n)}</span>`;
}

export function buildTresoreriePdf(plan) {
  const rev  = plan.revMensuel || Array(12).fill(0);
  const taux = plan.tauxMargeCV || 0.45;
  const cf   = plan.chargesFixesMois || 0;

  const apportRow    = [plan.totalInvest || 0, ...Array(11).fill(0)];
  const autresEntrees = Array(12).fill(0);
  const couts        = rev.map(r => Math.round(r * (1 - taux)));
  const charges      = Array(12).fill(Math.round(cf * 0.6));
  const salaires     = Array(12).fill(Math.round(cf * 0.3));
  const autres       = Array(12).fill(Math.round(cf * 0.1));

  const totalEntrees = rev.map((r, i) => r + apportRow[i] + autresEntrees[i]);
  const totalSorties = rev.map((_, i) => couts[i] + charges[i] + salaires[i] + autres[i]);
  const solde        = rev.map((_, i) => totalEntrees[i] - totalSorties[i]);
  const cumul        = solde.reduce((acc, v, i) => { acc.push(i === 0 ? v : acc[i-1] + v); return acc; }, []);

  const totalCol = arr => arr.reduce((a, b) => a + b, 0);

  const today = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

  function row(label, values, style = 'data', showTotal = true) {
    const total = totalCol(values);
    const styles = {
      data:    'color:#2d2f3e',
      alt:     'color:#2d2f3e;background:#f6f8fd',
      total:   'font-weight:700;color:#2B5797;background:#dce4f5;border-top:2px solid #2B5797;border-bottom:2px solid #2B5797',
      solde:   'font-weight:700;color:#fff;background:#2B5797',
      cumul:   'font-weight:700;color:#fff;background:#1a3a6b',
      section: 'font-weight:700;color:#fff;background:#4a7acf;text-transform:uppercase;letter-spacing:.05em',
    };
    const isSection = style === 'section';
    if (isSection) {
      return `<tr style="${styles[style]}">
        <td colspan="${14}" style="padding:5px 8px;font-size:9px">${esc(label)}</td>
      </tr>`;
    }
    return `<tr style="${styles[style] || ''}">
      <td style="padding:4px 8px;font-size:9px;min-width:130px">${esc(label)}</td>
      ${values.map(v => `<td style="text-align:right;padding:4px 5px;font-size:9px">${fmtN(v)}</td>`).join('')}
      ${showTotal ? `<td style="text-align:right;padding:4px 5px;font-size:9px;font-weight:700;border-left:1px solid #c0c5d8">${fmtN(total)}</td>` : '<td></td>'}
    </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Trésorerie — ${esc(plan.nom_business)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @page { size: A4 landscape; margin: 8mm 10mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr { page-break-inside: avoid; }
  }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 9px;
    background: #eef1f8;
    color: #2d2f3e;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 277mm;
    min-height: 190mm;
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
    background: linear-gradient(135deg, #1a3a6b 0%, #2B5797 50%, #6b8fef 100%);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 14px 20px 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .doc-header h1 { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -.02em; }
  .doc-header .sub { font-size: 10px; color: rgba(255,255,255,.75); margin-top: 2px; }
  .doc-header .meta { text-align: right; font-size: 9px; color: rgba(255,255,255,.65); }
  .doc-header .score {
    background: rgba(255,255,255,.2);
    border: 1px solid rgba(255,255,255,.3);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
    display: inline-block;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* KPI strip */
  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    background: #f0f4fb;
    border-bottom: 1px solid #dce4f5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .kpi {
    padding: 8px 12px;
    border-right: 1px solid #dce4f5;
  }
  .kpi:last-child { border-right: none; }
  .kpi-label { font-size: 7px; text-transform: uppercase; letter-spacing: .08em; color: #7a7f9a; }
  .kpi-value { font-size: 13px; font-weight: 700; color: #2B5797; margin-top: 2px; }

  /* Table */
  .table-wrap { flex: 1; padding: 12px 16px 8px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  td, th {
    border: 1px solid #e2e8f4;
    padding: 4px 5px;
    font-size: 9px;
    white-space: nowrap;
  }
  th {
    background: #2B5797;
    color: #fff;
    font-weight: 700;
    text-align: center;
    font-size: 8px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  th:first-child { text-align: left; min-width: 130px; }
  th.total-col { background: #1a3a6b; }
  tr:hover { background: #f8f9fd; }

  /* Footer */
  .doc-footer {
    background: #f0f4fb;
    border-top: 2px solid #2B5797;
    padding: 6px 16px;
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: #7a7f9a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .brand { font-weight: 700; color: #2B5797; }

  /* Print button */
  .no-print {
    position: fixed; top: 16px; right: 16px;
    padding: 10px 20px;
    background: #2B5797; color: #fff;
    border: none; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    cursor: pointer; z-index: 999;
    box-shadow: 0 2px 12px rgba(43,87,151,.3);
  }
  .no-print:hover { background: #1a3a6b; }

  /* Legend */
  .legend {
    display: flex; gap: 16px; align-items: center;
    padding: 6px 16px 4px;
    font-size: 8px; color: #7a7f9a;
  }
  .legend span { display: flex; align-items: center; gap: 4px; }
  .dot { width:8px; height:8px; border-radius: 50%; display:inline-block; }
</style>
</head>
<body>
<button class="no-print" onclick="window.print()">🖨️ Exporter en PDF</button>

<div class="page">

  <!-- Header -->
  <div class="doc-header">
    <div>
      <h1>Plan de trésorerie — ${esc(plan.nom_business)}</h1>
      <div class="sub">Prévisionnel 12 mois · ${esc(plan.tagline || '')}</div>
    </div>
    <div class="meta">
      ${plan.score ? `<div class="score">Score ${plan.score}/100</div>` : ''}
      <div>Généré le ${today}</div>
      <div>Eadee — Business Plan IA</div>
    </div>
  </div>

  <!-- KPI strip -->
  <div class="kpi-strip">
    <div class="kpi"><div class="kpi-label">CA An 1 total</div><div class="kpi-value">${fmtEur(totalCol(rev))}</div></div>
    <div class="kpi"><div class="kpi-label">Tréso finale M12</div><div class="kpi-value" style="color:${cumul[11]>=0?'#1E7E34':'#C82333'}">${fmtEur(cumul[11])}</div></div>
    <div class="kpi"><div class="kpi-label">Marge brute</div><div class="kpi-value">${Math.round(taux * 100)} %</div></div>
    <div class="kpi"><div class="kpi-label">Charges fixes / mois</div><div class="kpi-value">${fmtEur(cf)}</div></div>
    <div class="kpi"><div class="kpi-label">Point mort</div><div class="kpi-value">${plan.breakEvenMois ? 'Mois ' + plan.breakEvenMois : '—'}</div></div>
  </div>

  <!-- Legend -->
  <div class="legend">
    <span><span class="dot" style="background:#1E7E34"></span> Positif</span>
    <span><span class="dot" style="background:#C82333"></span> Négatif</span>
    <span><span class="dot" style="background:#2B5797"></span> Total / Solde</span>
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Postes</th>
          ${MONTHS.map(m => `<th>${m}</th>`).join('')}
          <th class="total-col">Total an</th>
        </tr>
      </thead>
      <tbody>
        ${row('▶ ENCAISSEMENTS', Array(12).fill(0), 'section')}
        ${row("Chiffre d'affaires (HT)", rev, 'data')}
        ${row('Apport initial / Capital', apportRow, 'alt')}
        ${row('Autres encaissements', autresEntrees, 'data')}
        ${row('TOTAL ENCAISSEMENTS', totalEntrees, 'total')}

        ${row('▶ DÉCAISSEMENTS', Array(12).fill(0), 'section')}
        ${row('Coûts variables (achats, matières)', couts, 'data')}
        ${row('Charges fixes (loyer, abonnements)', charges, 'alt')}
        ${row('Salaires & rémunération porteur', salaires, 'data')}
        ${row('Autres décaissements', autres, 'alt')}
        ${row('TOTAL DÉCAISSEMENTS', totalSorties, 'total')}

        ${row('▶ POSITION TRÉSORERIE', Array(12).fill(0), 'section')}
        ${row('SOLDE MENSUEL', solde, 'solde')}
        ${row('TRÉSORERIE CUMULÉE', cumul, 'cumul')}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="doc-footer">
    <span><span class="brand">Eadee</span> — Business Plan IA</span>
    <span>⚠ Projections indicatives — à valider avec votre expert-comptable</span>
    <span>Document confidentiel — ${esc(plan.nom_business)}</span>
  </div>

</div>
</body>
</html>`;
}
