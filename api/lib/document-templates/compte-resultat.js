/**
 * compte-resultat.js
 * Compte de résultat 3 ans — SpreadsheetML XML (.xls).
 * Design identique à la version PDF : header, KPI, couleurs +/-, highlights verts.
 */

import { fmtEur } from '../enrich-plan.js';

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function strCell(text, styleId) {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${esc(String(text))}</Data></Cell>`;
}

function numCell(val, styleId) {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${Number(val) || 0}</Data></Cell>`;
}

function pctCell(num, denom) {
  const pct = denom > 0 ? parseFloat((num / denom).toFixed(4)) : 0;
  return `<Cell ss:StyleID="sPct"><Data ss:Type="Number">${pct}</Data></Cell>`;
}

function emptyRow(h = 5) { return `<Row ss:Height="${h}"></Row>`; }

function sectionRow(label) {
  return `<Row ss:Height="18">
    <Cell ss:StyleID="sSection" ss:MergeAcross="6"><Data ss:Type="String">${esc(label)}</Data></Cell>
  </Row>`;
}

/** Choisit le style nombre selon positif/négatif et type de ligne */
function pickStyle(n, base) {
  if (n < 0) return base + 'Neg';
  if (n > 0) return base + 'Pos';
  return base;
}

function dataRow(label, v1, v2, v3, ca, base = 'sData', lblStyle = 'sLabel', showPct = true) {
  return `<Row ss:Height="16">
    ${strCell(label, lblStyle)}
    ${numCell(v1, pickStyle(v1, base))}
    ${showPct ? pctCell(v1, ca[0]) : '<Cell/>'}
    ${numCell(v2, pickStyle(v2, base))}
    ${showPct ? pctCell(v2, ca[1]) : '<Cell/>'}
    ${numCell(v3, pickStyle(v3, base))}
    ${showPct ? pctCell(v3, ca[2]) : '<Cell/>'}
  </Row>`;
}

function totalRow(label, v1, v2, v3, ca, base = 'sTotal', lblStyle = 'sTotalLbl', showPct = true) {
  return `<Row ss:Height="18">
    ${strCell(label, lblStyle)}
    ${numCell(v1, pickStyle(v1, base))}
    ${showPct ? pctCell(v1, ca[0]) : '<Cell/>'}
    ${numCell(v2, pickStyle(v2, base))}
    ${showPct ? pctCell(v2, ca[1]) : '<Cell/>'}
    ${numCell(v3, pickStyle(v3, base))}
    ${showPct ? pctCell(v3, ca[2]) : '<Cell/>'}
  </Row>`;
}

export function buildCompteResultat(plan) {
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

  const today = new Date().toLocaleDateString('fr-FR');
  const FMT = '#,##0\\ &quot;€&quot;';

  const STYLES = `
  <Style ss:ID="sTitle">
    <Font ss:Bold="1" ss:Size="15" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center" ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="sTitleRight">
    <Font ss:Size="9" ss:Color="#B8C8E8" ss:Name="Segoe UI"/>
    <Interior ss:Color="#1a3a6b" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
  </Style>
  <!-- KPI -->
  <Style ss:ID="sKpiLbl">
    <Font ss:Size="7" ss:Color="#7a7f9a" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE4F5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE4F5"/></Borders>
  </Style>
  <Style ss:ID="sKpiVal">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Bold="1" ss:Size="13" ss:Color="#2B5797" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#DCE4F5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE4F5"/></Borders>
  </Style>
  <Style ss:ID="sKpiValStr">
    <Font ss:Bold="1" ss:Size="13" ss:Color="#2B5797" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#DCE4F5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE4F5"/></Borders>
  </Style>
  <Style ss:ID="sKpiValNeg">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Bold="1" ss:Size="13" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#DCE4F5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE4F5"/></Borders>
  </Style>
  <!-- En-têtes -->
  <Style ss:ID="sColHdr">
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1a3a6b"/></Borders>
  </Style>
  <Style ss:ID="sColHdrFirst">
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1a3a6b"/></Borders>
  </Style>
  <Style ss:ID="sColHdrPct">
    <Font ss:Bold="1" ss:Size="8" ss:Color="#B8C8E8" ss:Italic="1" ss:Name="Segoe UI"/>
    <Interior ss:Color="#1a3a6b" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0d2040"/></Borders>
  </Style>
  <!-- Section -->
  <Style ss:ID="sSection">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#4a7acf" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <!-- Labels -->
  <Style ss:ID="sLabel">
    <Font ss:Size="9" ss:Name="Segoe UI"/>
    <Alignment ss:Horizontal="Left"/>
    <Borders><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sLabelAlt">
    <Font ss:Size="9" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F6F8FD" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
    <Borders><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <!-- % -->
  <Style ss:ID="sPct">
    <NumberFormat ss:Format="0%"/>
    <Font ss:Size="8" ss:Color="#9da5c0" ss:Italic="1" ss:Name="Segoe UI"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <!-- Données -->
  <Style ss:ID="sData">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Size="9" ss:Color="#9da5c0" ss:Name="Segoe UI"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataPos">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Size="9" ss:Color="#1E7E34" ss:Name="Segoe UI"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataNeg">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Size="9" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataAlt">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Size="9" ss:Color="#9da5c0" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F6F8FD" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataAltPos">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Size="9" ss:Color="#1E7E34" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F6F8FD" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataAltNeg">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Size="9" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F6F8FD" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <!-- Totaux bleus -->
  <Style ss:ID="sTotalLbl">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#2B5797" ss:Name="Segoe UI"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>
  <Style ss:ID="sTotal">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#9da5c0" ss:Name="Segoe UI"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>
  <Style ss:ID="sTotalPos">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#1E7E34" ss:Name="Segoe UI"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>
  <Style ss:ID="sTotalNeg">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>
  <!-- Highlight vert (Marge brute, EBITDA, Résultat net positif) -->
  <Style ss:ID="sGreenLbl">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#1E7E34" ss:Name="Segoe UI"/>
    <Interior ss:Color="#E8F4E8" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E7E34"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E7E34"/></Borders>
  </Style>
  <Style ss:ID="sGreenPos">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#1E7E34" ss:Name="Segoe UI"/>
    <Interior ss:Color="#E8F4E8" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E7E34"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E7E34"/></Borders>
  </Style>
  <Style ss:ID="sGreenNeg">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Interior ss:Color="#FDE8E8" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#C82333"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#C82333"/></Borders>
  </Style>
  <Style ss:ID="sGreen">
    <NumberFormat ss:Format="${FMT}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#9da5c0" ss:Name="Segoe UI"/>
    <Interior ss:Color="#E8F4E8" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E7E34"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E7E34"/></Borders>
  </Style>
  <Style ss:ID="sFooter">
    <Font ss:Italic="1" ss:Size="8" ss:Color="#7a7f9a" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>`;

  // Helper pour lignes highlight (marge brute, ebitda, RN)
  function greenRow(label, v1, v2, v3, showPct = true) {
    return `<Row ss:Height="18">
      ${strCell(label, 'sGreenLbl')}
      ${numCell(v1, v1 < 0 ? 'sGreenNeg' : v1 > 0 ? 'sGreenPos' : 'sGreen')}
      ${showPct ? pctCell(v1, ca[0]) : '<Cell/>'}
      ${numCell(v2, v2 < 0 ? 'sGreenNeg' : v2 > 0 ? 'sGreenPos' : 'sGreen')}
      ${showPct ? pctCell(v2, ca[1]) : '<Cell/>'}
      ${numCell(v3, v3 < 0 ? 'sGreenNeg' : v3 > 0 ? 'sGreenPos' : 'sGreen')}
      ${showPct ? pctCell(v3, ca[2]) : '<Cell/>'}
    </Row>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Compte de resultat - ${esc(plan.nom_business)}</Title>
  <Author>Eadee</Author><Created>${new Date().toISOString()}</Created>
</DocumentProperties>
<Styles>${STYLES}</Styles>
<Worksheet ss:Name="Compte de resultat">
<Table ss:DefaultColumnWidth="90" ss:DefaultRowHeight="15">
  <Column ss:Width="195"/>
  <Column ss:Width="100"/> <Column ss:Width="55"/>
  <Column ss:Width="100"/> <Column ss:Width="55"/>
  <Column ss:Width="100"/> <Column ss:Width="55"/>

  <!-- ── HEADER ── -->
  <Row ss:Height="28">
    <Cell ss:StyleID="sTitle" ss:MergeAcross="4"><Data ss:Type="String">Compte de resultat previsionnel — ${esc(plan.nom_business)}</Data></Cell>
    <Cell ss:StyleID="sTitleRight" ss:MergeAcross="1"><Data ss:Type="String">Genere le ${today} par Eadee</Data></Cell>
  </Row>

  ${emptyRow(4)}

  <!-- ── KPI STRIP ── -->
  <Row ss:Height="16">
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="1"><Data ss:Type="String">CA AN 1</Data></Cell>
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="1"><Data ss:Type="String">CA AN 3</Data></Cell>
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="1"><Data ss:Type="String">MARGE BRUTE</Data></Cell>
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="0"><Data ss:Type="String">RÉSULTAT NET AN 3</Data></Cell>
  </Row>
  <Row ss:Height="22">
    <Cell ss:StyleID="sKpiVal" ss:MergeAcross="1"><Data ss:Type="Number">${ca[0]}</Data></Cell>
    <Cell ss:StyleID="sKpiVal" ss:MergeAcross="1"><Data ss:Type="Number">${ca[2]}</Data></Cell>
    <Cell ss:StyleID="sKpiValStr" ss:MergeAcross="1"><Data ss:Type="String">${Math.round(taux*100)} %</Data></Cell>
    <Cell ss:StyleID="${rn[2] >= 0 ? 'sKpiVal' : 'sKpiValNeg'}" ss:MergeAcross="0"><Data ss:Type="Number">${rn[2]}</Data></Cell>
  </Row>

  ${emptyRow(6)}

  <!-- ── EN-TÊTES COLONNES ── -->
  <Row ss:Height="22">
    ${strCell('Postes', 'sColHdrFirst')}
    ${strCell('An 1', 'sColHdr')} ${strCell('% CA', 'sColHdrPct')}
    ${strCell('An 2', 'sColHdr')} ${strCell('% CA', 'sColHdrPct')}
    ${strCell('An 3', 'sColHdr')} ${strCell('% CA', 'sColHdrPct')}
  </Row>

  <!-- ── CA ── -->
  ${sectionRow("▶  CHIFFRE D'AFFAIRES")}
  ${totalRow("Chiffre d'affaires HT", ca[0], ca[1], ca[2], ca, 'sTotal', 'sTotalLbl')}

  ${emptyRow()}

  <!-- ── MARGE BRUTE ── -->
  ${sectionRow('▶  MARGE BRUTE')}
  ${dataRow('Couts variables / Achats', cv[0], cv[1], cv[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${greenRow('MARGE BRUTE', mb[0], mb[1], mb[2])}

  ${emptyRow()}

  <!-- ── CHARGES ── -->
  ${sectionRow("▶  CHARGES D'EXPLOITATION")}
  ${dataRow('Loyer & charges locatives', loyer[0], loyer[1], loyer[2], ca, 'sData', 'sLabel')}
  ${dataRow('Salaires & charges sociales', sal[0], sal[1], sal[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Marketing & communication', mkt[0], mkt[1], mkt[2], ca, 'sData', 'sLabel')}
  ${dataRow('Autres charges fixes', autres[0], autres[1], autres[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Amortissements', amort[0], amort[1], amort[2], ca, 'sData', 'sLabel')}
  ${totalRow('TOTAL CHARGES FIXES', totalCF[0], totalCF[1], totalCF[2], ca, 'sTotal', 'sTotalLbl')}

  ${emptyRow()}

  <!-- ── RÉSULTATS ── -->
  ${sectionRow('▶  RÉSULTATS')}
  ${greenRow('EBITDA', ebitda[0], ebitda[1], ebitda[2])}
  ${totalRow("EBIT (resultat d'exploitation)", ebit[0], ebit[1], ebit[2], ca, 'sTotal', 'sTotalLbl')}
  ${dataRow('Charges financieres (interets)', inter[0], inter[1], inter[2], ca, 'sDataAlt', 'sLabelAlt')}
  ${totalRow('Resultat avant impot', rai[0], rai[1], rai[2], ca, 'sTotal', 'sTotalLbl')}
  ${dataRow('Impot sur les societes (IS)', is[0], is[1], is[2], ca, 'sData', 'sLabel')}
  ${greenRow('RÉSULTAT NET', rn[0], rn[1], rn[2])}

  ${emptyRow(8)}

  <!-- ── FOOTER ── -->
  <Row ss:Height="16">
    <Cell ss:StyleID="sFooter" ss:MergeAcross="6">
      <Data ss:Type="String">Eadee — Business Plan IA · IS : 15% an1-2 / 25% an3 · Projections indicatives · A valider avec votre expert-comptable</Data>
    </Cell>
  </Row>
</Table>
<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
  <PageSetup>
    <Layout x:Orientation="Portrait"/>
    <Header x:Data="&amp;L&amp;B${esc(plan.nom_business)}&amp;R&amp;9Compte de resultat previsionnel 3 ans"/>
    <Footer x:Data="&amp;LEadee — Business Plan IA&amp;C&amp;9Confidentiel&amp;R&amp;9Page &amp;P / &amp;N"/>
    <PageMargins x:Bottom="0.6" x:Left="0.6" x:Right="0.6" x:Top="0.8" x:Header="0.3" x:Footer="0.3"/>
  </PageSetup>
  <FitToPage/>
  <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>0</FitHeight>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
  </Print>
  <FreezePanes/>
  <FrozenNoSplit/>
  <SplitHorizontal>8</SplitHorizontal>
  <TopRowBottomPane>8</TopRowBottomPane>
  <ActivePane>2</ActivePane>
</WorksheetOptions>
</Worksheet>
</Workbook>`;
}

export function buildCompteResultatData(plan) { return buildCompteResultat(plan); }
