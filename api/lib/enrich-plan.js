/**
 * enrich-plan.js
 * Normalise le JSON brut généré par Claude AI (marqueurs {{V/E/H:...}})
 * en valeurs numériques exploitables par les builders de documents.
 */

/** Parse "{{V:7 500 €|source}}" ou "7 500 €" ou 7500 → number */
export function parseAmount(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const marker = String(str).match(/\{\{[VEH]:([^|]+)\|/);
  const raw = marker ? marker[1] : String(str);
  return parseFloat(raw.replace(/[^\d.-]/g, '')) || 0;
}

/** Formate un nombre en devise française : 7 500 € */
export function fmtEur(n) {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n);
}

/** Enrichit le plan brut Claude → objet normalisé pour les builders */
export function enrichPlan(raw) {
  const p = raw || {};

  // ── Revenus annuels ───────────────────────────────────────────────
  const revM12 = parseAmount(p.rev_m12);
  const revM24 = parseAmount(p.rev_m24);
  const revM36 = parseAmount(p.rev_m36);

  // rev_mensuel[12] : utiliser si présent, sinon dériver depuis rev_m12
  let revMensuel = Array.isArray(p.rev_mensuel) && p.rev_mensuel.length === 12
    ? p.rev_mensuel.map(Number)
    : null;
  if (!revMensuel && revM12 > 0) {
    const base = revM12 / 12;
    revMensuel = [
      base * 0.4, base * 0.5, base * 0.65,   // M1-3
      base * 0.75, base * 0.85, base * 0.95,  // M4-6
      base * 1.0,  base * 1.05, base * 1.1,   // M7-9
      base * 1.15, base * 1.2,  base * 1.3,   // M10-12
    ].map(Math.round);
  }
  revMensuel = revMensuel || Array(12).fill(0);

  const ca1 = revMensuel.reduce((a, b) => a + b, 0) || revM12;
  const ca2 = revM24 || Math.round(ca1 * 1.35);
  const ca3 = revM36 || Math.round(ca1 * 1.85);

  // ── Investissements ───────────────────────────────────────────────
  const investissements = Array.isArray(p.investissements) ? p.investissements : [];
  const totalInvest = investissements
    .filter(i => i.total)
    .map(i => parseAmount(i.montant))[0]
    || investissements.filter(i => !i.total).reduce((s, i) => s + parseAmount(i.montant), 0);

  // ── Financement ───────────────────────────────────────────────────
  const apport = totalInvest * 0.30;
  const pret   = totalInvest * 0.50;
  const bpi    = totalInvest * 0.20;

  // ── Charges depuis finances_detail ───────────────────────────────
  const fd = Array.isArray(p.finances_detail) ? p.finances_detail : [];
  const getFinDetail = (kw) => {
    const row = fd.find(r => r.label?.toLowerCase().includes(kw));
    return row ? parseAmount(row.valeur) : 0;
  };
  const chargesFixes = getFinDetail('charge') || getFinDetail('fixe') || Math.round(ca1 * 0.45 / 12);
  const tauxMarge    = getFinDetail('marge') / 100 || 0.45;
  const pointMort    = tauxMarge > 0 ? Math.round(chargesFixes / tauxMarge) : 0;

  // ── Seuil rentabilité ─────────────────────────────────────────────
  const seuil = p.seuil_rentabilite || {};
  const chargesFixesMois = parseAmount(seuil.charges_fixes_mensuelles) || chargesFixes;
  const tauxMargeCV      = parseAmount(String(seuil.taux_marge_sur_cv).replace('%','')) / 100 || tauxMarge;
  const pointMortCA      = parseAmount(seuil.point_mort_ca) || pointMort;
  const breakEvenMois    = parseAmount(seuil.break_even_mois) || Math.ceil(chargesFixesMois / (revMensuel[5] || 1));

  // ── Trésorerie mensuelle ──────────────────────────────────────────
  const tresoSoldes = Array.isArray(p.tresorerie_soldes) && p.tresorerie_soldes.length === 12
    ? p.tresorerie_soldes.map(Number)
    : revMensuel.reduce((acc, rev, i) => {
        const charges = Math.round(rev * (1 - tauxMargeCV));
        const prev = i === 0 ? 0 : acc[i - 1];
        acc.push(prev + rev - charges - chargesFixesMois);
        return acc;
      }, []);

  // ── Résultat annuel ───────────────────────────────────────────────
  const chargesAn1 = Math.round(ca1 * (1 - tauxMargeCV));
  const rex1 = ca1 - chargesAn1 - chargesFixesMois * 12;
  const rex2 = ca2 - Math.round(ca2 * (1 - tauxMargeCV)) - chargesFixesMois * 12;
  const rex3 = ca3 - Math.round(ca3 * (1 - tauxMargeCV)) - chargesFixesMois * 12;

  // ── Porteur ───────────────────────────────────────────────────────
  const porteurRaw = p.porteur_projet || '';
  const porteurNom  = typeof porteurRaw === 'object' ? porteurRaw.nom : '';
  const porteurText = typeof porteurRaw === 'string' ? porteurRaw : JSON.stringify(porteurRaw);

  return {
    // Identité
    nom_business: p.nom_business || 'Mon projet',
    tagline: p.tagline || '',
    score: p.score_viabilite || 0,
    pitch: p.pitch_30s || '',

    // Textes narratifs
    resume_executif: p.resume_executif || '',
    porteur_nom: porteurNom,
    porteur_texte: porteurText,
    presentation_projet: p.presentation_projet || '',
    marche_analyse: p.marche_analyse || '',
    proposition_valeur: p.proposition_valeur || '',
    modele_economique: p.modele_economique || '',
    strategie_commerciale: p.strategie_commerciale || '',
    aspects_juridiques: p.aspects_juridiques || '',
    aspects_organisationnels: p.aspects_organisationnels || '',
    bilan_previsionnel: p.bilan_previsionnel || '',
    tresorerie_detail: p.tresorerie_detail || '',

    // Marché
    marche_taille: p.marche_taille || '',
    marche_croissance: p.marche_croissance || '',
    marche_part: p.marche_part_cible || '',
    marche_clients: p.marche_clients_potentiels || '',

    // Revenus
    revMensuel,
    ca1, ca2, ca3,
    rex1, rex2, rex3,

    // Investissement & financement
    investissements,
    totalInvest,
    apport, pret, bpi,

    // Trésorerie
    tresoSoldes,
    chargesFixesMois,
    tauxMargeCV,
    pointMortCA,
    breakEvenMois,

    // Tableaux
    concurrents: Array.isArray(p.concurrents) ? p.concurrents : [],
    risques:     Array.isArray(p.risques)     ? p.risques     : [],
    actions:     Array.isArray(p.actions)     ? p.actions     : [],
    aides:       Array.isArray(p.aides_subventions) ? p.aides_subventions : [],
    annexes:     Array.isArray(p.annexes_checklist) ? p.annexes_checklist : [],
    offres:      Array.isArray(p.offres)      ? p.offres      : [],
    acquisition: Array.isArray(p.acquisition) ? p.acquisition : [],
    kpis:        Array.isArray(p.kpis)        ? p.kpis        : [],
    outils:      Array.isArray(p.outils)      ? p.outils      : [],
    demarches:   Array.isArray(p.demarches_admin) ? p.demarches_admin : [],
    finances_detail: fd,

    // Emails
    email_fournisseur: p.email_fournisseur || null,
    email_prospection: p.email_prospection || null,
    email_relance:     p.email_relance     || null,

    // Seuil
    seuil_detail: seuil.detail || '',
  };
}
