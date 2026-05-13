/**
 * courrier-bpi.js
 * Demande de financement BPI France — format RTF professionnel.
 */

import { u, par, hrule, sectionHeader, kvRow, wrapRtf } from './rtf-core.js';
import { fmtEur } from '../enrich-plan.js';

export function buildCourrierBpi(plan) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const nom     = plan.porteur_nom || '[Votre Nom Prenom]';
  const biz     = plan.nom_business;
  const montant = fmtEur(plan.bpi || Math.round((plan.totalInvest || 0) * 0.2));
  const ca1     = fmtEur(plan.ca1);
  const invest  = fmtEur(plan.totalInvest);
  const aideBpi = (plan.aides || []).find(a =>
    (a.nom || '').toLowerCase().includes('bpi') || (a.nom || '').toLowerCase().includes('pret')
  );

  const body = [
    par(u(nom), { bold: true, size: 13 }),
    par('[Adresse]'),
    par('[Code postal - Ville]'),
    par('[Telephone] - [email@exemple.fr]'),
    par(''),
    par(today, { right: true }),
    par(''),
    par('BPI France - Direction Regionale', { bold: true }),
    par('[Adresse de la direction regionale]'),
    par(''),
    hrule(),
    par(u(`Objet : Demande de financement BPI France - ${biz}`), { bold: true, cf: 2, size: 12 }),
    par(
      aideBpi ? u(`Dispositif vise : ${aideBpi.nom}`) : 'Dispositif vise : Pret Creation / Pret d\\u8217?Honneur',
      { cf: 3, italic: true }
    ),
    hrule(),
    par(''),
    par('Madame, Monsieur,'),
    par(''),
    par(
      u(`Je me permets de vous adresser ma candidature dans le cadre du dispositif de ` +
        `soutien a la creation d'entreprise de BPI France, pour le financement de mon projet ${biz}.`),
      { spaceAfter: 120 }
    ),

    sectionHeader('1. Presentation du porteur'),
    par(u((plan.porteur_texte || '[Decrivez votre parcours et votre experience]').slice(0, 500)), { spaceAfter: 80 }),

    sectionHeader('2. Le projet'),
    par(u((plan.presentation_projet || '').slice(0, 600)), { spaceAfter: 60 }),
    par(u((plan.proposition_valeur || '').slice(0, 300)), { italic: true, cf: 2, spaceAfter: 80 }),

    sectionHeader('3. Le marche'),
    par(u((plan.marche_analyse || '').slice(0, 400)), { spaceAfter: 80 }),
    kvRow('Taille du marche', u(plan.marche_taille || '---')),
    kvRow('Croissance', u(plan.marche_croissance || '---')),
    kvRow('Part cible an 1', u(plan.marche_part || '---')),
    par(''),

    sectionHeader('4. Plan financier'),
    kvRow('Investissement total', invest, true),
    kvRow('Apport personnel', fmtEur(plan.apport)),
    kvRow('Pret bancaire', fmtEur(plan.pret)),
    kvRow('Financement BPI sollicite', montant, true),
    par(''),
    kvRow('CA previsionnel an 1', ca1),
    kvRow('CA previsionnel an 2', fmtEur(plan.ca2)),
    kvRow('CA previsionnel an 3', fmtEur(plan.ca3)),
    par(''),

    sectionHeader('5. Documents joints'),
    par('- Business plan complet avec etude de marche'),
    par('- Compte de resultat previsionnel 3 ans'),
    par('- Plan de tresorerie 12 mois'),
    par('- CV detaille du porteur'),
    par('- Justificatifs d\\u8217?apport personnel'),
    par(''),
    hrule(),
    par(
      u('Je reste disponible pour tout echange complementaire ou presentation orale de mon projet. ' +
        'Veuillez agreer, Madame, Monsieur, l\'expression de mes salutations distinguees.'),
      { spaceAfter: 240 }
    ),
    par(u(nom), { bold: true }),
    par(''),
    par(u('Document genere par Eadee - a personnaliser avant envoi'), { cf: 3, size: 9, italic: true }),
  ].join('\n');

  return wrapRtf(body);
}

export function buildCourrierBpiContent(plan) { return buildCourrierBpi(plan); }
