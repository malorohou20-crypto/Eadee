/**
 * plan-tresorerie.js
 * Plan de trésorerie 12 mois — format SpreadsheetML XML (.xls).
 * S'ouvre nativement dans Excel ET LibreOffice Calc sans avertissement.
 */

import { fmtEur } from '../enrich-plan.js';

const MONTHS = ['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Aou','Sep','Oct','Nov','Dec'];

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cell(value, type = 'Number', style = '') {
  const styleAttr = style ? ` ss:StyleID="${style}"` : '';
  if (type === 'String') {
    return `<Cell${styleAttr}><Data ss:Type="String">${esc(String(value))}</Data></Cell>`;
  }
  const n = Number(value) || 0;
  return `<Cell${styleAttr}><Data ss:Type="Number">${n}</Data></Cell>`;
}

function headerCell(label) {
  return `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${esc(label)}</Data></Cell>`;
}

function sectionCell(label, colSpan) {
  return `<Cell ss:StyleID="sSection" ss:MergeAcross="${colSpan - 1}"><Data ss:Type="String">${esc(label)}</Data></Cell>`;
}

function dataRow(label, values, style = 'sData', labelStyle = 'sLabel') {
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
  return `<Row>
    ${cell(label, 'String', labelStyle)}
    ${values.map(v => cell(v, 'Number', style)).join('')}
    ${cell(total, 'Number', style + 'Total')}
  </Row>`;
}

function totalRow(label, values, style = 'sTotal') {
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
  return `<Row>
    ${cell(label, 'String', style)}
    ${values.map(v => cell(v, 'Number', style)).join('')}
    ${cell(total, 'Number', style)}
  </Row>`;
}

function sectionRow(label) {
  return `<Row ss:Height="18">
    ${sectionCell(label, 15)}
  </Row>`;
}

function emptyRow() {
  return `<Row ss:Height="6"></Row>`;
}

export function buildTresorerie(plan) {
  const rev   = plan.revMensuel || Array(12).fill(0);
  const taux  = plan.tauxMargeCV || 0.45;
  const cf    = plan.chargesFixesMois || 0;

  const apportRow    = [plan.totalInvest || 0, ...Array(11).fill(0)];
  const autresEntrees = Array(12).fill(0);
  const couts        = rev.map(r => Math.round(r * (1 - taux)));
  const charges      = Array(12).fill(Math.round(cf * 0.6));
  const salaires     = Array(12).fill(Math.round(cf * 0.3));
  const autres       = Array(12).fill(Math.round(cf * 0.1));

  const totalEntrees  = rev.map((r, i) => r + apportRow[i] + autresEntrees[i]);
  const totalSorties  = rev.map((_, i) => couts[i] + charges[i] + salaires[i] + autres[i]);
  const soldeMensuel  = rev.map((_, i) => totalEntrees[i] - totalSorties[i]);
  const cumul = soldeMensuel.reduce((acc, v, i) => {
    acc.push(i === 0 ? v : acc[i - 1] + v);
    return acc;
  }, []);

  const today = new Date().toLocaleDateString('fr-FR');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Plan de tresorerie - ${esc(plan.nom_business)}</Title>
  <Author>Eadee</Author>
  <Created>${new Date().toISOString()}</Created>
</DocumentProperties>
<Styles>
  <Style ss:ID="sTitle">
    <Font ss:Bold="1" ss:Size="14" ss:Color="#2B5797"/>
    <Alignment ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="sHeader">
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1a3a6b"/></Borders>
  </Style>
  <Style ss:ID="sSection">
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#4a7acf" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
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
  <Style ss:ID="sDataTotal">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;"/>
    <Alignment ss:Horizontal="Right"/>
    <Font ss:Bold="1" ss:Size="10"/>
    <Interior ss:Color="#E8EDF8" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sDataAltTotal">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;"/>
    <Alignment ss:Horizontal="Right"/>
    <Font ss:Bold="1" ss:Size="10"/>
    <Interior ss:Color="#E8EDF8" ss:Pattern="Solid"/>
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
  <Style ss:ID="sSolde">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="sCumul">
    <NumberFormat ss:Format="#,##0\ &quot;€&quot;"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#1a3a6b" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="sFooter">
    <Font ss:Italic="1" ss:Size="8" ss:Color="#7a7f9a"/>
  </Style>
</Styles>
<Worksheet ss:Name="Tresorerie 12 mois">
<Table ss:DefaultColumnWidth="80">
  <Column ss:Width="180"/>
  ${MONTHS.map(() => '<Column ss:Width="72"/>').join('\n  ')}
  <Column ss:Width="90"/>

  <!-- Titre -->
  <Row ss:Height="26">
    <Cell ss:StyleID="sTitle" ss:MergeAcross="13">
      <Data ss:Type="String">Plan de tresorerie 12 mois — ${esc(plan.nom_business)}</Data>
    </Cell>
  </Row>
  <Row ss:Height="16">
    <Cell ss:StyleID="sFooter" ss:MergeAcross="13">
      <Data ss:Type="String">Genere le ${today} par Eadee · A valider par un expert-comptable</Data>
    </Cell>
  </Row>
  ${emptyRow()}

  <!-- En-tetes colonnes -->
  <Row ss:Height="20">
    ${headerCell('Postes')}
    ${MONTHS.map(m => headerCell(m)).join('')}
    ${headerCell('TOTAL AN')}
  </Row>

  <!-- ENCAISSEMENTS -->
  ${sectionRow('ENCAISSEMENTS')}
  ${dataRow("Chiffre d'affaires (HT)", rev, 'sData', 'sLabel')}
  ${dataRow('Apport initial / Capital', apportRow, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Autres encaissements', autresEntrees, 'sData', 'sLabel')}
  ${totalRow('TOTAL ENCAISSEMENTS', totalEntrees, 'sTotal')}
  ${emptyRow()}

  <!-- DECAISSEMENTS -->
  ${sectionRow('DECAISSEMENTS')}
  ${dataRow('Couts variables (achats, matieres)', couts, 'sData', 'sLabel')}
  ${dataRow('Charges fixes (loyer, abonnements)', charges, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Salaires & remuneration porteur', salaires, 'sData', 'sLabel')}
  ${dataRow('Autres decaissements', autres, 'sDataAlt', 'sLabelAlt')}
  ${totalRow('TOTAL DECAISSEMENTS', totalSorties, 'sTotal')}
  ${emptyRow()}

  <!-- POSITION TRESORERIE -->
  ${sectionRow('POSITION TRESORERIE')}
  ${totalRow('SOLDE MENSUEL', soldeMensuel, 'sSolde')}
  ${totalRow('TRESORERIE CUMULEE', cumul, 'sCumul')}
  ${emptyRow()}

  <Row>
    <Cell ss:StyleID="sFooter" ss:MergeAcross="13">
      <Data ss:Type="String">Projections indicatives — toutes les valeurs sont a affiner avec votre expert-comptable.</Data>
    </Cell>
  </Row>
</Table>
</Worksheet>
</Workbook>`;

  return xml;
}

export function buildTresorerieData(plan) { return buildTresorerie(plan); }
