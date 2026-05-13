/**
 * lettre-intention.js
 * Lettre d'intention client — format RTF professionnel.
 */

import { u, par, hrule, sectionHeader, kvRow, wrapRtf } from './rtf-core.js';
import { fmtEur } from '../enrich-plan.js';

export function buildLettreIntention(plan) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const biz    = plan.nom_business;
  const nom    = plan.porteur_nom || '[Nom du prestataire]';
  const offre1 = (plan.offres || [])[0];

  const body = [
    par('[Nom du client - a completer]', { bold: true, size: 13 }),
    par('[Entreprise du client]'),
    par('[Adresse]'),
    par('[Code postal - Ville]'),
    par(''),
    par(today, { right: true }),
    par(''),
    par(u(biz), { bold: true }),
    par(u(nom)),
    par(''),
    hrule(),
    par(u(`Objet : Lettre d'intention d'achat - ${biz}`), { bold: true, cf: 2, size: 12 }),
    hrule(),
    par(''),
    par('Madame, Monsieur,'),
    par(''),
    par(
      u(`Par la presente, nous, soussignes [Nom du client], representant [Entreprise], ` +
        `exprimons notre interet pour les services / produits proposes par ${biz}.`),
      { spaceAfter: 120 }
    ),

    sectionHeader('1. Contexte et besoin'),
    par(u((plan.marche_analyse || '[Decrivez le besoin identifie]').slice(0, 300)), { spaceAfter: 80 }),

    sectionHeader('2. Solution retenue'),
    par(u((plan.proposition_valeur || '').slice(0, 400)), { spaceAfter: 60 }),
    ...(offre1 ? [
      kvRow('Offre / Prestation', u(offre1.nom || '')),
      kvRow('Description', u(offre1.description || '')),
      kvRow('Prix indicatif', u(String(offre1.prix || '---'))),
      par(''),
    ] : []),

    sectionHeader('3. Engagement'),
    par(
      u(`Sous reserve de la finalisation des conditions contractuelles, nous nous engageons a ` +
        `etudier serieusement une collaboration commerciale avec ${biz} sur la periode a venir.`),
      { spaceAfter: 60 }
    ),
    kvRow('Montant estime', fmtEur(plan.ca1 ? Math.round(plan.ca1 * 0.1) : 0) + ' (indicatif)'),
    kvRow('Duree de validite', '3 mois a compter de la date'),
    par(''),

    sectionHeader('4. Prochaines etapes'),
    par('1. Reunion de presentation detaillee du projet'),
    par('2. Remise d\\u8217?une proposition commerciale formelle'),
    par('3. Negociation et signature du contrat definitif'),
    par(''),
    hrule(),
    par(
      u(`Cette lettre n'est pas contractuelle et ne vaut pas commande ferme. ` +
        `Elle temoigne de notre interet sincere pour le projet ${biz}.`),
      { cf: 3, italic: true, spaceAfter: 180 }
    ),
    par('Pour le client :', { bold: true }),
    par(''),
    par('Nom : ________________________________'),
    par('Fonction : ________________________________'),
    par('Signature : ________________________________'),
    par(u(`Date : ${today}`)),
    par(''),
    par(u('Document genere par Eadee - a personnaliser avant signature'), { cf: 3, size: 9, italic: true }),
  ].join('\n');

  return wrapRtf(body);
}

export function buildLettreIntentionContent(plan) { return buildLettreIntention(plan); }
