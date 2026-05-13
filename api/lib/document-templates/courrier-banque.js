/**
 * courrier-banque.js
 * Génère un courrier de demande de financement bancaire au format RTF professionnel.
 * Reçoit un plan enrichi (depuis enrich-plan.js) et retourne un string RTF complet.
 */

import { u, par, hrule, sectionHeader, kvRow, wrapRtf } from './rtf-core.js';
import { fmtEur } from '../enrich-plan.js';

export function buildCourrierBanque(plan) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const nom         = plan.porteur_nom || '[Votre Nom Pr\u233nom]';
  const bizName     = plan.nom_business;
  const investTotal = fmtEur(plan.totalInvest);
  const apport      = fmtEur(plan.apport);
  const pret        = fmtEur(plan.pret);
  const ca1         = fmtEur(plan.ca1);
  const breakEven   = plan.breakEvenMois ? `mois ${plan.breakEvenMois}` : 'an 1';
  const pct         = plan.totalInvest > 0
    ? Math.round((plan.apport / plan.totalInvest) * 100) + ' %'
    : '[X] %';

  const body = [
    // ── En-tête expéditeur ───────────────────────────────────────────
    par(nom, { bold: true, size: 13 }),
    par('[Votre adresse — à compléter]'),
    par('[Code postal — Ville]'),
    par('[Téléphone] · [email@exemple.fr]'),
    par(''),
    par(today, { right: true }),
    par(''),
    par('Madame, Monsieur le Directeur d’agence', { bold: true }),
    par('[Nom de votre banque]'),
    par('[Adresse de l’agence]'),
    par(''),
    hrule(),
    par(`Objet : Demande de financement — Création de ${u(bizName)}`, { bold: true, cf: 2, size: 12 }),
    hrule(),
    par(''),

    // ── Corps ────────────────────────────────────────────────────────
    par(`Madame, Monsieur,`),
    par(''),
    par(
      `J’ai l’honneur de vous soumettre ma demande de financement dans le cadre de ` +
      `la création de ${u(bizName)}. ` +
      `${u(plan.pitch || plan.presentation_projet?.slice?.(0, 200) || '')}`,
      { spaceAfter: 120 }
    ),

    sectionHeader('1. Présentation du projet'),
    par(u(plan.presentation_projet?.slice?.(0, 600) || plan.resume_executif?.slice?.(0, 600) || ''), { spaceAfter: 80 }),

    sectionHeader('2. Étude de marché'),
    par(u(plan.marche_analyse?.slice?.(0, 400) || ''), { spaceAfter: 80 }),

    sectionHeader('3. Plan de financement'),
    kvRow('Investissement total', investTotal, true),
    kvRow('dont apport personnel', apport),
    kvRow('dont prêt bancaire sollicité', pret, true),
    kvRow('dont aides & subventions', fmtEur(plan.bpi)),
    par(''),
    par(
      `Mon apport personnel représente ${pct} du financement total, témoignant de mon engagement.`,
      { spaceAfter: 80 }
    ),

    sectionHeader('4. Prévisions financières'),
    kvRow('Chiffre d’affaires an 1', ca1),
    kvRow('Point mort prévu', breakEven),
    kvRow('Marge brute estimée', Math.round(plan.tauxMargeCV * 100) + ' %'),
    par(''),
    par(
      `Ces projections reposent sur des hypothèses conservatrices ` +
      `détaillées dans le business plan joint en annexe.`,
      { spaceAfter: 80 }
    ),

    sectionHeader('5. Documents joints'),
    par('• Business plan complet'),
    par('• Compte de résultat prévisionnel 3 ans'),
    par('• Plan de trésorerie 12 mois'),
    par('• CV du porteur de projet'),
    par('• Justificatifs d’apport personnel'),
    par(''),
    hrule(),

    // ── Formule de politesse ─────────────────────────────────────────
    par(
      `Dans l’attente de votre réponse, je reste à votre disposition pour ` +
      `tout renseignement complémentaire et vous prie d’agréer, Madame, Monsieur, ` +
      `l’expression de mes salutations distinguées.`,
      { spaceAfter: 240 }
    ),
    par(u(nom), { bold: true }),
    par('[Signature manuscrite]', { cf: 3, italic: true }),
    par(''),
    par('Document généré par Eadee — à personnaliser avant envoi', { cf: 3, size: 9, italic: true }),
  ].join('\n');

  return wrapRtf(body);
}

// Compat ancienne API
export function buildCourrierBanqueContent(plan) { return buildCourrierBanque(plan); }
