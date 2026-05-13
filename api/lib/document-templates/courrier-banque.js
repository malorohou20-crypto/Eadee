/**
 * courrier-banque.js
 * Courrier de demande de financement bancaire — format RTF professionnel.
 */

import { u, par, hrule, sectionHeader, kvRow, wrapRtf } from './rtf-core.js';
import { fmtEur } from '../enrich-plan.js';

export function buildCourrierBanque(plan) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const nom         = plan.porteur_nom || '[Votre Nom Prenom]';
  const bizName     = plan.nom_business;
  const investTotal = fmtEur(plan.totalInvest);
  const apport      = fmtEur(plan.apport);
  const pret        = fmtEur(plan.pret);
  const ca1         = fmtEur(plan.ca1);
  const breakEven   = plan.breakEvenMois ? `mois ${plan.breakEvenMois}` : 'an 1';
  const pct         = plan.totalInvest > 0
    ? Math.round((plan.apport / plan.totalInvest) * 100) + ' %'
    : '[X] %';

  const body = [
    par(u(nom), { bold: true, size: 13 }),
    par('[Votre adresse]'),
    par('[Code postal - Ville]'),
    par('[Telephone] - [email@exemple.fr]'),
    par(''),
    par(today, { right: true }),
    par(''),
    par('Madame, Monsieur le Directeur d\\u8217?agence', { bold: true }),
    par('[Nom de votre banque]'),
    par('[Adresse de l\\u8217?agence]'),
    par(''),
    hrule(),
    par(u(`Objet : Demande de financement - Creation de ${bizName}`), { bold: true, cf: 2, size: 12 }),
    hrule(),
    par(''),
    par('Madame, Monsieur,'),
    par(''),
    par(
      u(`J'ai l'honneur de vous soumettre ma demande de financement pour la creation de ${bizName}. ` +
        `${(plan.pitch || plan.presentation_projet || '').slice(0, 200)}`),
      { spaceAfter: 120 }
    ),

    sectionHeader('1. Presentation du projet'),
    par(u((plan.presentation_projet || plan.resume_executif || '').slice(0, 600)), { spaceAfter: 80 }),

    sectionHeader('2. Etude de marche'),
    par(u((plan.marche_analyse || '').slice(0, 400)), { spaceAfter: 80 }),

    sectionHeader('3. Plan de financement'),
    kvRow('Investissement total', investTotal, true),
    kvRow('dont apport personnel', apport),
    kvRow('dont pret bancaire sollicite', pret, true),
    kvRow('dont aides & subventions', fmtEur(plan.bpi)),
    par(''),
    par(
      u(`Mon apport personnel represente ${pct} du financement total, temoignant de mon engagement.`),
      { spaceAfter: 80 }
    ),

    sectionHeader('4. Previsions financieres'),
    kvRow(`Chiffre d'affaires an 1`, ca1),
    kvRow('Point mort prevu', breakEven),
    kvRow('Marge brute estimee', Math.round((plan.tauxMargeCV || 0) * 100) + ' %'),
    par(''),
    par(
      u('Ces projections reposent sur des hypotheses conservatrices detaillees dans le business plan joint.'),
      { spaceAfter: 80 }
    ),

    sectionHeader('5. Documents joints'),
    par('- Business plan complet'),
    par('- Compte de resultat previsionnel 3 ans'),
    par('- Plan de tresorerie 12 mois'),
    par('- CV du porteur de projet'),
    par('- Justificatifs d\\u8217?apport personnel'),
    par(''),
    hrule(),

    par(
      u('Dans l\'attente de votre reponse, je reste a votre disposition pour tout renseignement complementaire ' +
        'et vous prie d\'agreer, Madame, Monsieur, l\'expression de mes salutations distinguees.'),
      { spaceAfter: 240 }
    ),
    par(u(nom), { bold: true }),
    par('[Signature manuscrite]', { cf: 3, italic: true }),
    par(''),
    par(u('Document genere par Eadee - a personnaliser avant envoi'), { cf: 3, size: 9, italic: true }),
  ].join('\n');

  return wrapRtf(body);
}

export function buildCourrierBanqueContent(plan) { return buildCourrierBanque(plan); }
