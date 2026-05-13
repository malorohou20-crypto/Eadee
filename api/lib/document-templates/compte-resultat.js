/**
 * compte-resultat.js
 * Génère le compte de résultat prévisionnel 3 ans au format HTML-for-Excel (.xls).
 */

import { fmtEur } from '../enrich-plan.js';

const CSS = `
  body { font-family: Calibri, Arial, sans-serif; font-size: 11px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #c8d0e0; padding: 5px 10px; }
  .title { font-size: 16px; font-weight: bold; color: #2B5797; padding: 12px 0 4px; }
  .subtitle { font-size: 11px; color: #7a7f9a; margin-bottom: 12px; }
  .label { text-align: left; }
  .num { text-align: right; mso-number-format:"# ##0\\ €"; }
  .pct { text-align: right; font-style: italic; color: #7a7f9a; font-size: 10px; mso-number-format:"0%"; }
  .section > td { background: #2B5797; color: #fff; font-weight: bold; }
  .total > td { background: #dce4f5; font-weight: bold; border-top: 2px solid #2B5797; border-bottom: 2px solid #2B5797; }
  .highlight > td { background: #e8f4e8; color: #1E7E34; font-weight: bold; }
  .negative { color: #C82333; }
  .alt > td { background: #f2f5fb; }
  .header-row th { background: #2B5797; color: #fff; font-size: 12px; font-weight: bold; text-align: center; }
  .header-row th:first-child { text-align: left; min-width: 220px; }
`;

function numCell(val, ca = 0, showPct = false) {
  const n = Number(val) || 0;
  const color = n < 0 ? ' negative' : '';
  const cell = `<td class="num${color}">${fmtEur(n)}</td>`;
  const pctCell = showPct && ca > 0
    ? `<td class="pct">${Math.round((n / ca) * 100)} %</td>`
    : (showPct ? '<td class="pct">—</td>' : '');
  return cell + pctCell;
}

function dataRow(label, vals, cas, showPct = false, cls = '') {
  const altCls = cls || '';
  return `<tr class="${altCls}"><td class="label">${label}</td>${vals.map((v, i) => numCell(v, cas[i], showPct)).join('')}</tr>`;
}

function totalRow(label, vals, cas, showPct = false, cls = 'total') {
  return `<tr class="${cls}"><td class="label">${label}</td>${vals.map((v, i) => numCell(v, cas[i], showPct)).join('')}</tr>`;
}

export function buildCompteResultat(plan) {
  const ca   = [plan.ca1, plan.ca2, plan.ca3];
  const taux = plan.tauxMargeCV || 0.45;
  const cf   = (plan.chargesFixesMois || 0) * 12;

  // Charges variables (coûts directs)
  const cv = ca.map(c => Math.round(c * (1 - taux)));

  // Marge brute
  const mb = ca.map((c, i) => c - cv[i]);

  // Charges fixes réparties
  const loyer     = Array(3).fill(Math.round(cf * 0.25));
  const salaires  = Array(3).fill(Math.round(cf * 0.45));
  const marketing = Array(3).fill(Math.round(cf * 0.15));
  const autresCF  = Array(3).fill(Math.round(cf * 0.15));
  const amort     = [Math.round(plan.totalInvest / 5), Math.round(plan.totalInvest / 5), Math.round(plan.totalInvest / 5)];

  const totalCharges = ca.map((_, i) =>
    cv[i] + loyer[i] + salaires[i] + marketing[i] + autresCF[i] + amort[i]
  );

  // EBITDA
  const ebitda = ca.map((c, i) => c - cv[i] - loyer[i] - salaires[i] - marketing[i] - autresCF[i]);

  // EBIT (après amortissement)
  const ebit = ebitda.map((e, i) => e - amort[i]);

  // Intérêts (estimés)
  const interets = [Math.round(plan.pret * 0.04), Math.round(plan.pret * 0.03), Math.round(plan.pret * 0.02)];

  // Résultat avant impôt
  const rai = ebit.map((e, i) => e - interets[i]);

  // IS (0% an1 si déficit, 15% an2, 25% an3)
  const is = rai.map((r, i) => r <= 0 ? 0 : Math.round(r * (i === 0 ? 0.15 : i === 1 ? 0.15 : 0.25)));

  // Résultat net
  const rn = rai.map((r, i) => r - is[i]);

  const colHeader = (showPct) =>
    `<th>An 1</th>${showPct ? '<th>% CA</th>' : ''}<th>An 2</th>${showPct ? '<th>% CA</th>' : ''}<th>An 3</th>${showPct ? '<th>% CA</th>' : ''}`;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta name="ProgId" content="Excel.Sheet">
<meta name="Generator" content="Microsoft Excel 15">
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Compte de résultat</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>${CSS}</style>
</head>
<body>
<div class="title">Compte de résultat prévisionnel — ${plan.nom_business}</div>
<div class="subtitle">Généré le ${new Date().toLocaleDateString('fr-FR')} — Eadee · À valider par un expert-comptable</div>
<table>
  <tr class="header-row">
    <th>Postes</th>
    ${colHeader(true)}
  </tr>

  <tr class="section"><td colspan="7" class="label">▶ CHIFFRE D'AFFAIRES</td></tr>
  ${totalRow('Chiffre d\'affaires HT', ca, ca, true, 'total')}

  <tr class="section"><td colspan="7" class="label">▶ MARGE BRUTE</td></tr>
  ${dataRow('Coûts variables / Achats', cv, ca, true, 'alt')}
  ${totalRow('MARGE BRUTE', mb, ca, true, 'highlight')}

  <tr class="section"><td colspan="7" class="label">▶ CHARGES D'EXPLOITATION</td></tr>
  ${dataRow('Loyer & charges locatives', loyer, ca, true)}
  ${dataRow('Salaires & charges sociales', salaires, ca, true, 'alt')}
  ${dataRow('Marketing & communication', marketing, ca, true)}
  ${dataRow('Autres charges fixes', autresCF, ca, true, 'alt')}
  ${dataRow('Dotations aux amortissements', amort, ca, true)}
  ${totalRow('TOTAL CHARGES FIXES', loyer.map((_, i) => loyer[i] + salaires[i] + marketing[i] + autresCF[i] + amort[i]), ca, true)}

  <tr class="section"><td colspan="7" class="label">▶ RÉSULTATS</td></tr>
  ${totalRow('EBITDA', ebitda, ca, true, 'highlight')}
  ${totalRow('EBIT (résultat d\'exploitation)', ebit, ca, true)}
  ${dataRow('Charges financières (intérêts)', interets, ca, true, 'alt')}
  ${totalRow('Résultat avant impôt', rai, ca, true)}
  ${dataRow('Impôt sur les sociétés', is, ca, true, 'alt')}
  ${totalRow('RÉSULTAT NET', rn, ca, true, 'highlight')}
</table>

<p style="font-size:9px;color:#7a7f9a;margin-top:12px">
  ⚠ Projections indicatives basées sur vos données Eadee. Taux IS : 15 % an1-2 / 25 % an3 (taux normal).
  Toutes les valeurs sont à affiner avec votre expert-comptable.
</p>
</body>
</html>`;

  return html;
}

export function buildCompteResultatData(plan) { return buildCompteResultat(plan); }
