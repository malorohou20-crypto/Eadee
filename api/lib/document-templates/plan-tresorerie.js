/**
 * plan-tresorerie.js
 * Génère le plan de trésorerie 12 mois au format HTML-for-Excel (.xls).
 * Excel ouvre nativement grâce au meta ProgId="Excel.Sheet".
 */

import { fmtEur } from '../enrich-plan.js';

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

const CSS = `
  body { font-family: Calibri, Arial, sans-serif; font-size: 11px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #c8d0e0; padding: 4px 8px; white-space: nowrap; }
  .title { font-size: 16px; font-weight: bold; color: #2B5797; padding: 12px 0 4px; }
  .subtitle { font-size: 11px; color: #7a7f9a; margin-bottom: 12px; }
  .label { text-align: left; font-size: 11px; }
  .num { text-align: right; mso-number-format:"# ##0\\ €"; }
  .positive { color: #1E7E34; font-weight: 600; }
  .negative { color: #C82333; }
  .section > td { background: #2B5797; color: #fff; font-weight: bold; font-size: 11px; }
  .total > td { background: #dce4f5; font-weight: bold; border-top: 2px solid #2B5797; }
  .solde > td { background: #2B5797; color: #fff; font-weight: bold; }
  .cumul > td { background: #1a3a6b; color: #fff; font-weight: bold; }
  .alt > td { background: #f2f5fb; }
  .header-row th { background: #2B5797; color: #fff; font-size: 11px; font-weight: bold; text-align: center; }
  .header-row th:first-child { text-align: left; min-width: 180px; }
`;

function numCell(val, cls = '') {
  const n = Number(val) || 0;
  const color = n < 0 ? ' negative' : n > 0 ? ' positive' : '';
  return `<td class="num${color}${cls ? ' ' + cls : ''}">${fmtEur(n)}</td>`;
}

function totalRow(label, values, cls = 'total') {
  const total = values.reduce((a, b) => a + b, 0);
  return `<tr class="${cls}"><td class="label">${label}</td>${values.map(v => numCell(v)).join('')}${numCell(total)}</tr>`;
}

export function buildTresorerie(plan) {
  const rev   = plan.revMensuel || Array(12).fill(0);
  const solde = plan.tresoSoldes || Array(12).fill(0);
  const cf    = plan.chargesFixesMois || 0;
  const taux  = plan.tauxMargeCV || 0.45;

  // Dériver les lignes de charges depuis le taux de marge
  const couts   = rev.map(r => Math.round(r * (1 - taux)));
  const charges = Array(12).fill(Math.round(cf * 0.6));
  const salaires= Array(12).fill(Math.round(cf * 0.3));
  const autres  = Array(12).fill(Math.round(cf * 0.1));

  // Entrées
  const apportRow   = [plan.totalInvest || 0, ...Array(11).fill(0)];
  const autresEntrees = Array(12).fill(0);

  // Totaux
  const totalEntrees = rev.map((r, i) => r + apportRow[i] + autresEntrees[i]);
  const totalSorties = rev.map((_, i) => couts[i] + charges[i] + salaires[i] + autres[i]);
  const soldeMensuel = rev.map((_, i) => totalEntrees[i] - totalSorties[i]);

  // Tréso cumulée
  const cumul = soldeMensuel.reduce((acc, v, i) => {
    acc.push(i === 0 ? v : acc[i - 1] + v);
    return acc;
  }, []);

  const totalGeneral = (arr) => arr.reduce((a, b) => a + b, 0);

  function dataRow(label, values, alt = false) {
    const total = totalGeneral(values);
    const altCls = alt ? ' alt' : '';
    return `<tr class="${altCls}"><td class="label">${label}</td>${values.map(v => numCell(v)).join('')}${numCell(total)}</tr>`;
  }

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
<x:Name>Trésorerie 12 mois</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>${CSS}</style>
</head>
<body>
<div class="title">Plan de trésorerie — ${plan.nom_business}</div>
<div class="subtitle">Généré le ${new Date().toLocaleDateString('fr-FR')} — Eadee · À valider par un expert-comptable</div>
<table>
  <tr class="header-row">
    <th>Postes</th>
    ${MONTHS.map(m => `<th>${m}</th>`).join('')}
    <th>TOTAL AN</th>
  </tr>

  <tr class="section"><td colspan="${14}" class="label">▶ ENCAISSEMENTS</td></tr>
  ${dataRow('Chiffre d\'affaires (HT)', rev)}
  ${dataRow('Apport initial / Capital', apportRow, true)}
  ${dataRow('Autres encaissements', autresEntrees)}
  ${totalRow('TOTAL ENCAISSEMENTS', totalEntrees)}

  <tr class="section"><td colspan="${14}" class="label">▶ DÉCAISSEMENTS</td></tr>
  ${dataRow('Coûts variables (achats, matières)', couts)}
  ${dataRow('Charges fixes (loyer, abonnements…)', charges, true)}
  ${dataRow('Salaires & rémunération porteur', salaires)}
  ${dataRow('Autres décaissements', autres, true)}
  ${totalRow('TOTAL DÉCAISSEMENTS', totalSorties)}

  <tr class="section"><td colspan="${14}" class="label">▶ POSITION TRÉSORERIE</td></tr>
  ${totalRow('SOLDE MENSUEL', soldeMensuel, 'solde')}
  ${totalRow('TRÉSORERIE CUMULÉE', cumul, 'cumul')}
</table>
<p style="font-size:9px;color:#7a7f9a;margin-top:12px">
  ⚠ Ces projections sont indicatives. Toutes les valeurs sont à compléter avec votre expert-comptable.
</p>
</body>
</html>`;

  return html;
}

export function buildTresorerieData(plan) { return buildTresorerie(plan); }
