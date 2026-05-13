/**
 * compte-resultat.js
 * Compte de résultat prévisionnel 3 ans — format SpreadsheetML XML (.xls).
 * S'ouvre nativement dans Excel ET LibreOffice Calc sans avertissement.
 */

import { fmtEur } from '../enrich-plan.js';

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cell(value, styleId = 'sData') {
  const n = Number(value) || 0;
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${n}</Data></Cell>`;
}

function labelCell(text, styleId = 'sLabel') {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${esc(text)}</Data></Cell>`;
}

function pctCell(num, denom, styleId = 'sPct') {
  const pct = denom > 0 ? (num / denom) : 0;
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${pct.toFixed(4)}</Data></Cell>`;
}

function sectionRow(label) {
  return `<Row ss:Height="18">
    <Cell ss:StyleID="sSection" ss:MergeAcross="6"><Data ss:Type="String">${esc(label)}</Data></Cell>
  </Row>`;
}

function dataRow(label, v1, v2, v3, ca, styleId = 'sData', lblStyle = 'sLabel', showPct = true) {
  return `<Row>
    ${labelCell(label, lblStyle)}
    ${cell(v1, styleId)} ${showPct ? pctCell(v1, ca[0]) : '<Cell/>'}
    ${cell(v2, styleId)} ${showPct ? pctCell(v2, ca[1]) : '<Cell/>'}
    ${cell(v3, styleId)} ${showPct ? pctCell(v3, ca[2]) : '<Cell/>'}
  </Row>`;
}

function totalRow(label, v1, v2, v3, ca, styleId = 'sTotal', showPct = true) {
  return `<Row>
    ${labelCell(label, styleId)}
    ${cell(v1, styleId)} ${showPct ? pctCell(v1, ca[0], 'sPctTotal') : '<Cell/>'}
    ${cell(v2, styleId)} ${showPct ? pctCell(v2, ca[1], 'sPctTotal') : '<Cell/>'}
    ${cell(v3, styleId)} ${showPct ? pctCell(v3, ca[2], 'sPctTotal') : '<Cell/>'}
  </Row>`;
}

function emptyRow() { return `<Row ss:Height="6"></Row>`; }

export function buildCompteResultat(plan) {
  const ca   = [plan.ca1 || 0, plan.ca2 || 0, plan.ca3 || 0];
  const taux = plan.tauxMargeCV || 0.45;
  const cf   = (plan.chargesFixesMois || 0) * 12;

  const cv      = ca.map(c => Math.round(c * (1 - taux)));
  const mb      = ca.map((c, i) => c - cv[i]);
  const loyer   = Array(3).fill(Math.round(cf * 0.25));
  const sal     = Array(3).fill(Math.round(cf * 0.45));
  const mkt     = Array(3).fill(Math.round(cf * 0.15));
  const autres  = Array(3).fill(Math.round(cf * 0.15));
  const amort   = [1,2,3].map(() => Math.round((plan.totalInvest || 0) / 5));
  const ebitda  = ca.map((c, i) => c - cv[i] - loyer[i] - sal[i] - mkt[i] - autres[i]);
  const ebit    = ebitda.map((e, i) => e - amort[i]);
  const inter   = [1,2,3].map((_, i) => Math.round((plan.pret || 0) * [0.04, 0.03, 0.02][i]));
  const rai     = ebit.map((e, i) => e - inter[i]);
  const is      = rai.map((r, i) => r <= 0 ? 0 : Math.round(r * [0.15, 0.15, 0.25][i]));
  const rn      = rai.map((r, i) => r - is[i]);
  const totalCF = [0,1,2].map(i => loyer[i] + sal[i] + mkt[i] + autres[i] + amort[i]);

  const today = new Date().toLocaleDateString('fr-FR');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Compte de resultat - ${esc(plan.nom_business)}</Title>
  <Author>Eadee</Author>
</DocumentProperties>
<Styles>
  <Style ss:ID="sTitle">
    <Font ss:Bold="1" ss:Size="14" ss:Color="#2B5797"/>
  </Style>
  <Style ss:ID="sColHeader">
    <Font ss:Bold="1" ss:Size="11" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="sPctHeader">
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF" ss:Italic="1"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="sSection">
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#4a7acf" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sLabel">
    <Font ss:Size="10"/>
    <Alignment ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="sLabelAlt">
    <Font ss:Size="10"/>
    <Interior ss:Color="#F2F5FB" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="sData">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;"/>
    <Alignment ss:Horizontal="Right"/>
    <Font ss:Size="10"/>
  </Style>
  <Style ss:ID="sDataAlt">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;"/>
    <Interior ss:Color="#F2F5FB" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Font ss:Size="10"/>
  </Style>
  <Style ss:ID="sPct">
    <NumberFormat ss:Format="0%"/>
    <Alignment ss:Horizontal="Right"/>
    <Font ss:Size="9" ss:Italic="1" ss:Color="#7a7f9a"/>
  </Style>
  <Style ss:ID="sPctTotal">
    <NumberFormat ss:Format="0%"/>
    <Alignment ss:Horizontal="Right"/>
    <Font ss:Size="9" ss:Bold="1" ss:Color="#2B5797"/>
  </Style>
  <Style ss:ID="sTotal">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#2B5797"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/>
    </Borders>
  </Style>
  <Style ss:ID="sHighlight">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#1E7E34"/>
    <Interior ss:Color="#E8F4E8" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E7E34"/>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E7E34"/>
    </Borders>
  </Style>
  <Style ss:ID="sNegative">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;;[Red]-#,##0\ &quot;€&quot;"/>
    <Font ss:Bold="1" ss:Size="10"/>
    <Interior ss:Color="#FDE8E8" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="sFooter">
    <Font ss:Italic="1" ss:Size="8" ss:Color="#7a7f9a"/>
  </Style>
</Styles>
<Worksheet ss:Name="Compte de resultat">
<Table ss:DefaultColumnWidth="75">
  <Column ss:Width="200"/>
  <Column ss:Width="85"/> <Column ss:Width="52"/>
  <Column ss:Width="85"/> <Column ss:Width="52"/>
  <Column ss:Width="85"/> <Column ss:Width="52"/>

  <!-- Titre -->
  <Row ss:Height="26">
    <Cell ss:StyleID="sTitle" ss:MergeAcross="6">
      <Data ss:Type="String">Compte de resultat previsionnel — ${esc(plan.nom_business)}</Data>
    </Cell>
  </Row>
  <Row ss:Height="14">
    <Cell ss:StyleID="sFooter" ss:MergeAcross="6">
      <Data ss:Type="String">Genere le ${today} par Eadee · A valider par un expert-comptable</Data>
    </Cell>
  </Row>
  ${emptyRow()}

  <!-- En-tetes -->
  <Row ss:Height="22">
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">Postes</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">An 1</Data></Cell>
    <Cell ss:StyleID="sPctHeader"><Data ss:Type="String">% CA</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">An 2</Data></Cell>
    <Cell ss:StyleID="sPctHeader"><Data ss:Type="String">% CA</Data></Cell>
    <Cell ss:StyleID="sColHeader"><Data ss:Type="String">An 3</Data></Cell>
    <Cell ss:StyleID="sPctHeader"><Data ss:Type="String">% CA</Data></Cell>
  </Row>

  ${sectionRow("CHIFFRE D'AFFAIRES")}
  ${totalRow("Chiffre d'affaires HT", ca[0], ca[1], ca[2], ca, 'sTotal')}
  ${emptyRow()}

  ${sectionRow('MARGE BRUTE')}
  ${dataRow('Couts variables / Achats', cv[0], cv[1], cv[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${totalRow('MARGE BRUTE', mb[0], mb[1], mb[2], ca, 'sHighlight')}
  ${emptyRow()}

  ${sectionRow("CHARGES D'EXPLOITATION")}
  ${dataRow('Loyer & charges locatives', loyer[0], loyer[1], loyer[2], ca)}
  ${dataRow('Salaires & charges sociales', sal[0], sal[1], sal[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Marketing & communication', mkt[0], mkt[1], mkt[2], ca)}
  ${dataRow('Autres charges fixes', autres[0], autres[1], autres[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Amortissements', amort[0], amort[1], amort[2], ca)}
  ${totalRow('TOTAL CHARGES FIXES', totalCF[0], totalCF[1], totalCF[2], ca)}
  ${emptyRow()}

  ${sectionRow('RESULTATS')}
  ${totalRow('EBITDA', ebitda[0], ebitda[1], ebitda[2], ca, 'sHighlight')}
  ${totalRow("EBIT (resultat d'exploitation)", ebit[0], ebit[1], ebit[2], ca, 'sTotal')}
  ${dataRow('Charges financieres (interets)', inter[0], inter[1], inter[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${totalRow('Resultat avant impot', rai[0], rai[1], rai[2], ca)}
  ${dataRow('Impot sur les societes (IS)', is[0], is[1], is[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${totalRow('RESULTAT NET', rn[0], rn[1], rn[2], ca, rn[0] >= 0 ? 'sHighlight' : 'sNegative')}
  ${emptyRow()}

  <Row>
    <Cell ss:StyleID="sFooter" ss:MergeAcross="6">
      <Data ss:Type="String">IS : 15% an1-2 / 25% an3 (taux normal). Projections indicatives a affiner avec votre expert-comptable.</Data>
    </Cell>
  </Row>
</Table>
</Worksheet>
</Workbook>`;

  return xml;
}

export function buildCompteResultatData(plan) { return buildCompteResultat(plan); }
