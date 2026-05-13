/**
 * plan-tresorerie.js
 * Plan de trésorerie 12 mois — SpreadsheetML XML (.xls).
 * Design identique à la version PDF : header gradient, KPI, couleurs +/-, sections.
 */

import { fmtEur } from '../enrich-plan.js';

const MONTHS = ['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Aou','Sep','Oct','Nov','Dec'];

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Cellule texte */
function strCell(text, styleId) {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${esc(String(text))}</Data></Cell>`;
}

/** Cellule nombre — couleur calculée côté serveur selon valeur */
function numCell(val, baseStyle) {
  const n = Number(val) || 0;
  let style = baseStyle;
  if (n > 0 && baseStyle === 'sData')    style = 'sDataPos';
  if (n < 0 && baseStyle === 'sData')    style = 'sDataNeg';
  if (n > 0 && baseStyle === 'sDataAlt') style = 'sDataAltPos';
  if (n < 0 && baseStyle === 'sDataAlt') style = 'sDataAltNeg';
  return `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${n}</Data></Cell>`;
}

/** Cellule nombre total (toujours coloré +/-) */
function totalNumCell(val, baseStyle) {
  const n = Number(val) || 0;
  const style = n < 0 ? baseStyle + 'Neg' : n > 0 ? baseStyle + 'Pos' : baseStyle;
  return `<Cell ss:StyleID="${style === baseStyle ? baseStyle : style}"><Data ss:Type="Number">${n}</Data></Cell>`;
}

function emptyRow(h = 5) { return `<Row ss:Height="${h}"></Row>`; }

function sectionRow(label) {
  return `<Row ss:Height="18">
    <Cell ss:StyleID="sSection" ss:MergeAcross="13"><Data ss:Type="String">${esc(label)}</Data></Cell>
  </Row>`;
}

function dataRow(label, values, rowStyle = 'sData', lblStyle = 'sLabel') {
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
  return `<Row ss:Height="16">
    ${strCell(label, lblStyle)}
    ${values.map(v => numCell(v, rowStyle)).join('')}
    ${totalNumCell(total, 'sTotalNum')}
  </Row>`;
}

function totalRow(label, values, style = 'sTotal', lblStyle = 'sTotalLbl') {
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
  const numSt = style === 'sSolde' ? 'sSoldeNum' : style === 'sCumul' ? 'sCumulNum' : 'sTotalNum';
  return `<Row ss:Height="18">
    ${strCell(label, lblStyle)}
    ${values.map(v => {
      const n = Number(v) || 0;
      let st = numSt;
      if (numSt === 'sTotalNum') st = n < 0 ? 'sTotalNumNeg' : n > 0 ? 'sTotalNumPos' : 'sTotalNum';
      if (numSt === 'sSoldeNum') st = n < 0 ? 'sSoldeNumNeg' : 'sSoldeNum';
      if (numSt === 'sCumulNum') st = n < 0 ? 'sCumulNumNeg' : 'sCumulNum';
      return `<Cell ss:StyleID="${st}"><Data ss:Type="Number">${n}</Data></Cell>`;
    }).join('')}
    ${(() => {
      const n = Number(total) || 0;
      let st = numSt;
      if (numSt === 'sTotalNum') st = n < 0 ? 'sTotalNumNeg' : 'sTotalNumPos';
      if (numSt === 'sSoldeNum') st = n < 0 ? 'sSoldeNumNeg' : 'sSoldeNum';
      if (numSt === 'sCumulNum') st = n < 0 ? 'sCumulNumNeg' : 'sCumulNum';
      return `<Cell ss:StyleID="${st}"><Data ss:Type="Number">${n}</Data></Cell>`;
    })()}
  </Row>`;
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

  const totalEntrees = rev.map((r, i) => r + apportRow[i] + autresEntrees[i]);
  const totalSorties = rev.map((_, i) => couts[i] + charges[i] + salaires[i] + autres[i]);
  const solde        = rev.map((_, i) => totalEntrees[i] - totalSorties[i]);
  const cumul        = solde.reduce((acc, v, i) => { acc.push(i === 0 ? v : acc[i-1] + v); return acc; }, []);

  const totalCA    = rev.reduce((a,b) => a+b, 0);
  const tresoFin   = cumul[11] || 0;
  const today      = new Date().toLocaleDateString('fr-FR');

  const FMT_EUR = '#,##0\\ &quot;€&quot;';
  const FMT_EUR_NEG = '#,##0\\ &quot;€&quot;;[Red]-#,##0\\ &quot;€&quot;';

  const STYLES = `
  <!-- ── Base ── -->
  <Style ss:ID="sTitle">
    <Font ss:Bold="1" ss:Size="15" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center" ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="sTitleSub">
    <Font ss:Size="9" ss:Color="#B8C8E8" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center" ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="sTitleRight">
    <Font ss:Size="9" ss:Color="#B8C8E8" ss:Name="Segoe UI"/>
    <Interior ss:Color="#1a3a6b" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
  </Style>
  <!-- ── KPI ── -->
  <Style ss:ID="sKpiLbl">
    <Font ss:Size="7" ss:Color="#7a7f9a" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE4F5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE4F5"/></Borders>
  </Style>
  <Style ss:ID="sKpiVal">
    <Font ss:Bold="1" ss:Size="13" ss:Color="#2B5797" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="${FMT_EUR}"/>
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
    <Font ss:Bold="1" ss:Size="13" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#DCE4F5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCE4F5"/></Borders>
  </Style>
  <!-- ── En-têtes colonnes ── -->
  <Style ss:ID="sColHdr">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1a3a6b"/></Borders>
  </Style>
  <Style ss:ID="sColHdrFirst">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1a3a6b"/></Borders>
  </Style>
  <Style ss:ID="sColHdrTotal">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#1a3a6b" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0d2040"/></Borders>
  </Style>
  <!-- ── Section ── -->
  <Style ss:ID="sSection">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#4a7acf" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <!-- ── Labels ── -->
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
  <!-- ── Données normales ── -->
  <Style ss:ID="sData">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Size="9" ss:Color="#9da5c0" ss:Name="Segoe UI"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataPos">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Size="9" ss:Color="#1E7E34" ss:Name="Segoe UI"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataNeg">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Size="9" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataAlt">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Size="9" ss:Color="#9da5c0" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F6F8FD" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataAltPos">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Size="9" ss:Color="#1E7E34" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F6F8FD" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <Style ss:ID="sDataAltNeg">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Size="9" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F6F8FD" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F4"/></Borders>
  </Style>
  <!-- ── Totaux ── -->
  <Style ss:ID="sTotalLbl">
    <Font ss:Bold="1" ss:Size="9" ss:Color="#2B5797" ss:Name="Segoe UI"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>
  <Style ss:ID="sTotalNum">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#9da5c0" ss:Name="Segoe UI"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>
  <Style ss:ID="sTotalNumPos">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#1E7E34" ss:Name="Segoe UI"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>
  <Style ss:ID="sTotalNumNeg">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Bold="1" ss:Size="9" ss:Color="#C82333" ss:Name="Segoe UI"/>
    <Interior ss:Color="#DCE4F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>
  <!-- ── Solde / Cumul ── -->
  <Style ss:ID="sSoldeLbl">
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="sSoldeNum">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="sSoldeNumNeg">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFAAAA" ss:Name="Segoe UI"/>
    <Interior ss:Color="#2B5797" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="sCumulLbl">
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#1a3a6b" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left"/>
  </Style>
  <Style ss:ID="sCumulNum">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF" ss:Name="Segoe UI"/>
    <Interior ss:Color="#1a3a6b" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="sCumulNumNeg">
    <NumberFormat ss:Format="${FMT_EUR}"/>
    <Font ss:Bold="1" ss:Size="10" ss:Color="#FFAAAA" ss:Name="Segoe UI"/>
    <Interior ss:Color="#1a3a6b" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Right"/>
  </Style>
  <!-- ── Footer ── -->
  <Style ss:ID="sFooter">
    <Font ss:Italic="1" ss:Size="8" ss:Color="#7a7f9a" ss:Name="Segoe UI"/>
    <Interior ss:Color="#F0F4FB" ss:Pattern="Solid"/>
    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2B5797"/></Borders>
  </Style>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Plan de tresorerie - ${esc(plan.nom_business)}</Title>
  <Author>Eadee</Author><Created>${new Date().toISOString()}</Created>
</DocumentProperties>
<Styles>${STYLES}</Styles>
<Worksheet ss:Name="Tresorerie 12 mois">
<Table ss:DefaultColumnWidth="70" ss:DefaultRowHeight="15">
  <Column ss:Width="175"/>
  ${MONTHS.map(() => '<Column ss:Width="68"/>').join('\n  ')}
  <Column ss:Width="85"/>

  <!-- ── HEADER ── -->
  <Row ss:Height="28">
    <Cell ss:StyleID="sTitle" ss:MergeAcross="9"><Data ss:Type="String">Plan de tresorerie 12 mois — ${esc(plan.nom_business)}</Data></Cell>
    <Cell ss:StyleID="sTitleRight" ss:MergeAcross="3"><Data ss:Type="String">Genere le ${today} par Eadee</Data></Cell>
  </Row>
  <Row ss:Height="16">
    <Cell ss:StyleID="sTitleSub" ss:MergeAcross="13"><Data ss:Type="String">${esc(plan.tagline || 'Previsionnel annee 1 · A valider avec votre expert-comptable')}</Data></Cell>
  </Row>

  ${emptyRow(4)}

  <!-- ── KPI STRIP ── -->
  <Row ss:Height="16">
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="2"><Data ss:Type="String">CA AN 1 TOTAL</Data></Cell>
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="2"><Data ss:Type="String">TRESORERIE FINALE M12</Data></Cell>
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="2"><Data ss:Type="String">MARGE BRUTE</Data></Cell>
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="2"><Data ss:Type="String">CHARGES FIXES / MOIS</Data></Cell>
    <Cell ss:StyleID="sKpiLbl" ss:MergeAcross="4"><Data ss:Type="String">POINT MORT</Data></Cell>
  </Row>
  <Row ss:Height="22">
    <Cell ss:StyleID="sKpiVal" ss:MergeAcross="2"><Data ss:Type="Number">${totalCA}</Data></Cell>
    <Cell ss:StyleID="${tresoFin >= 0 ? 'sKpiVal' : 'sKpiValNeg'}" ss:MergeAcross="2"><Data ss:Type="Number">${tresoFin}</Data></Cell>
    <Cell ss:StyleID="sKpiValStr" ss:MergeAcross="2"><Data ss:Type="String">${Math.round(taux * 100)} %</Data></Cell>
    <Cell ss:StyleID="sKpiVal" ss:MergeAcross="2"><Data ss:Type="Number">${cf}</Data></Cell>
    <Cell ss:StyleID="sKpiValStr" ss:MergeAcross="4"><Data ss:Type="String">${plan.breakEvenMois ? 'Mois ' + plan.breakEvenMois : '—'}</Data></Cell>
  </Row>

  ${emptyRow(6)}

  <!-- ── EN-TÊTES COLONNES ── -->
  <Row ss:Height="20">
    ${strCell('Postes', 'sColHdrFirst')}
    ${MONTHS.map(m => strCell(m, 'sColHdr')).join('')}
    ${strCell('Total an', 'sColHdrTotal')}
  </Row>

  <!-- ── ENCAISSEMENTS ── -->
  ${sectionRow('▶  ENCAISSEMENTS')}
  ${dataRow("Chiffre d'affaires (HT)", rev, 'sData', 'sLabel')}
  ${dataRow('Apport initial / Capital', apportRow, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Autres encaissements', autresEntrees, 'sData', 'sLabel')}
  ${totalRow('TOTAL ENCAISSEMENTS', totalEntrees, 'sTotal', 'sTotalLbl')}

  ${emptyRow()}

  <!-- ── DECAISSEMENTS ── -->
  ${sectionRow('▶  DÉCAISSEMENTS')}
  ${dataRow('Couts variables (achats, matieres)', couts, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Charges fixes (loyer, abonnements)', charges, 'sData', 'sLabel')}
  ${dataRow('Salaires & remuneration porteur', salaires, 'sDataAlt', 'sLabelAlt')}
  ${dataRow('Autres decaissements', autres, 'sData', 'sLabel')}
  ${totalRow('TOTAL DÉCAISSEMENTS', totalSorties, 'sTotal', 'sTotalLbl')}

  ${emptyRow()}

  <!-- ── POSITION ── -->
  ${sectionRow('▶  POSITION TRÉSORERIE')}
  ${totalRow('SOLDE MENSUEL', solde, 'sSolde', 'sSoldeLbl')}
  ${totalRow('TRÉSORERIE CUMULÉE', cumul, 'sCumul', 'sCumulLbl')}

  ${emptyRow(8)}

  <!-- ── FOOTER ── -->
  <Row ss:Height="16">
    <Cell ss:StyleID="sFooter" ss:MergeAcross="13">
      <Data ss:Type="String">Eadee — Business Plan IA · Projections indicatives · A valider avec votre expert-comptable avant tout envoi bancaire</Data>
    </Cell>
  </Row>
</Table>
<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
  <PageSetup>
    <Layout x:Orientation="Landscape"/>
    <Header x:Data="&amp;L&amp;B${esc(plan.nom_business)}&amp;R&amp;9Plan de tresorerie 12 mois"/>
    <Footer x:Data="&amp;LEadee — Business Plan IA&amp;C&amp;9Confidentiel&amp;R&amp;9Page &amp;P / &amp;N"/>
    <PageMargins x:Bottom="0.6" x:Left="0.5" x:Right="0.5" x:Top="0.8" x:Header="0.3" x:Footer="0.3"/>
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
  <SplitHorizontal>7</SplitHorizontal>
  <TopRowBottomPane>7</TopRowBottomPane>
  <ActivePane>2</ActivePane>
</WorksheetOptions>
</Worksheet>
</Workbook>`;
}

export function buildTresorerieData(plan) { return buildTresorerie(plan); }
