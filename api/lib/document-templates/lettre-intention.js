/**
 * lettre-intention.js
 * Génère une lettre d'intention client au format RTF professionnel.
 */

import { u, par, hrule, sectionHeader, kvRow, wrapRtf } from './rtf-core.js';
import { fmtEur } from '../enrich-plan.js';

export function buildLettreIntention(plan) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const biz    = plan.nom_business;
  const nom    = plan.porteur_nom || '[Nom du fournisseur / prestataire]';
  const offre1 = plan.offres?.[0];

  const body = [
    // En-tête client
    par('[Nom du client — à compléter]', { bold: true, size: 13 }),
    par('[Entreprise du client]'),
    par('[Adresse]'),
    par('[Code postal — Ville]'),
    par(''),
    par(today, { right: true }),
    par(''),
    par(u(biz), { bold: true }),
    par(u(nom)),
    par(''),
    hrule(),
    par(`Objet : Lettre d'intention d'achat — ${u(biz)}`, { bold: true, cf: 2, size: 12 }),
    hrule(),
    par(''),
    par('Madame, Monsieur,'),
    par(''),
    par(
      `Par la présente, nous, soussignés [Nom du client], représentant [Entreprise], ` +
      `exprimons notre intérêt pour les services / produits proposés par ${u(biz)}.`,
      { spaceAfter: 120 }
    ),

    sectionHeader('1. Contexte et besoin'),
    par(u(plan.marche_analyse?.slice?.(0, 300) || '[Décrivez le besoin identifié par le client]'), { spaceAfter: 80 }),

    sectionHeader('2. Solution retenue'),
    par(u(plan.proposition_valeur?.slice?.(0, 400) || ''), { spaceAfter: 60 }),
    ...(offre1 ? [
      kvRow('Offre / Prestation', u(offre1.nom || '')),
      kvRow('Description', u(offre1.description || '')),
      kvRow('Prix indicatif', u(offre1.prix || '—')),
      par(''),
    ] : []),

    sectionHeader('3. Engagement'),
    par(
      `Sous réserve de la finalisation des conditions contractuelles, nous nous engageons à ` +
      `étudier sérieusement une collaboration commerciale avec ${u(biz)} sur la période à venir.`,
      { spaceAfter: 60 }
    ),
    kvRow('Montant estimé', fmtEur(plan.ca1 ? plan.ca1 * 0.1 : 0) + ' (indicatif)'),
    kvRow('Durée de validité', '3 mois à compter de la date'),
    par(''),

    sectionHeader('4. Prochaines étapes'),
    par('1. Réunion de présentation détaillée du projet'),
    par('2. Remise d'une proposition commerciale formelle'),
    par('3. Négociation et signature du contrat définitif'),
    par(''),
    hrule(),
    par(
      `Cette lettre n'est pas contractuelle et ne vaut pas commande ferme. ` +
      `Elle témoigne de notre intérêt sincère pour le projet ${u(biz)}.`,
      { cf: 3, italic: true, spaceAfter: 180 }
    ),
    par('Pour le client :', { bold: true }),
    par(''),
    par('Nom : ________________________________'),
    par('Fonction : ________________________________'),
    par('Signature : ________________________________'),
    par('Date : ' + today),
    par(''),
    par('Document généré par Eadee — à personnaliser avant signature', { cf: 3, size: 9, italic: true }),
  ].join('\n');

  return wrapRtf(body);
}

export function buildLettreIntentionContent(plan) { return buildLettreIntention(plan); }
