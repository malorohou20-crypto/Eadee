/**
 * courrier-bpi.js
 * Génère une demande de financement BPI France au format RTF professionnel.
 */

import { u, par, hrule, sectionHeader, kvRow, wrapRtf } from './rtf-core.js';
import { fmtEur } from '../enrich-plan.js';

export function buildCourrierBpi(plan) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const nom     = plan.porteur_nom || '[Votre Nom Pr\u233nom]';
  const biz     = plan.nom_business;
  const montant = fmtEur(plan.bpi || plan.totalInvest * 0.2);
  const ca1     = fmtEur(plan.ca1);
  const invest  = fmtEur(plan.totalInvest);
  const aideBpi = (plan.aides || []).find(a =>
    a.nom?.toLowerCase().includes('bpi') || a.nom?.toLowerCase().includes('prêt')
  );

  const body = [
    par(u(nom), { bold: true, size: 13 }),
    par('[Adresse — à compléter]'),
    par('[Code postal — Ville]'),
    par('[Téléphone] · [email@exemple.fr]'),
    par(''),
    par(today, { right: true }),
    par(''),
    par('BPI France — Direction Régionale', { bold: true }),
    par('[Adresse de la direction régionale]'),
    par(''),
    hrule(),
    par(`Objet : Demande de financement BPI France — ${u(biz)}`, { bold: true, cf: 2, size: 12 }),
    par(
      aideBpi ? `Dispositif visé : ${u(aideBpi.nom)}` : 'Dispositif visé : Prêt Création / Prêt d’Honneur',
      { cf: 3, italic: true }
    ),
    hrule(),
    par(''),
    par('Madame, Monsieur,'),
    par(''),
    par(
      `Je me permets de vous adresser ma candidature dans le cadre du dispositif de ` +
      `soutien à la création d’entreprise de BPI France, pour le financement de mon projet ${u(biz)}.`,
      { spaceAfter: 120 }
    ),

    sectionHeader('1. Présentation du porteur'),
    par(u((plan.porteur_texte || '').slice(0, 500) || '[Décrivez votre parcours et votre expérience]'), { spaceAfter: 80 }),

    sectionHeader('2. Le projet'),
    par(u((plan.presentation_projet || '').slice(0, 600)), { spaceAfter: 60 }),
    par(u((plan.proposition_valeur || '').slice(0, 300)), { italic: true, cf: 2, spaceAfter: 80 }),

    sectionHeader('3. Le marché'),
    par(u((plan.marche_analyse || '').slice(0, 400)), { spaceAfter: 80 }),
    kvRow('Taille du marché', u(plan.marche_taille || '—')),
    kvRow('Croissance', u(plan.marche_croissance || '—')),
    kvRow('Part cible an 1', u(plan.marche_part || '—')),
    par(''),

    sectionHeader('4. Plan financier'),
    kvRow('Investissement total', invest, true),
    kvRow('Apport personnel', fmtEur(plan.apport)),
    kvRow('Prêt bancaire', fmtEur(plan.pret)),
    kvRow('Financement BPI sollicité', montant, true),
    par(''),
    kvRow('CA prévisionnel an 1', ca1),
    kvRow('CA prévisionnel an 2', fmtEur(plan.ca2)),
    kvRow('CA prévisionnel an 3', fmtEur(plan.ca3)),
    par(''),

    sectionHeader('5. Documents joints'),
    par('• Business plan complet avec étude de marché'),
    par('• Compte de résultat prévisionnel 3 ans'),
    par('• Plan de trésorerie 12 mois'),
    par('• CV détaillé du porteur'),
    par('• Justificatifs d’apport personnel'),
    par(''),
    hrule(),
    par(
      `Je reste disponible pour tout échange complémentaire ou présentation orale de mon projet. ` +
      `Veuillez agréer, Madame, Monsieur, l’expression de mes salutations distinguées.`,
      { spaceAfter: 240 }
    ),
    par(u(nom), { bold: true }),
    par(''),
    par('Document généré par Eadee — à personnaliser avant envoi', { cf: 3, size: 9, italic: true }),
  ].join('\n');

  return wrapRtf(body);
}

export function buildCourrierBpiContent(plan) { return buildCourrierBpi(plan); }
