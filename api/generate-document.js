export const config = { runtime: 'nodejs' };

/**
 * generate-document.js
 * Route API de génération de documents annexes.
 * Chaque builder reçoit le plan enrichi et retourne directement son string (RTF / HTML / HTML-Excel).
 */

import { enrichPlan } from './lib/enrich-plan.js';
import { buildCourrierBanque }      from './lib/document-templates/courrier-banque.js';
import { buildCourrierBpi }         from './lib/document-templates/courrier-bpi.js';
import { buildLettreIntention }     from './lib/document-templates/lettre-intention.js';
import { buildTresorerie }          from './lib/document-templates/plan-tresorerie.js';
import { buildCompteResultat }      from './lib/document-templates/compte-resultat.js';
import { buildFicheSynthese }       from './lib/document-templates/fiche-synthese.js';
import { buildTresoreriePdf }       from './lib/document-templates/tresorerie-pdf.js';
import { buildCompteResultatPdf }   from './lib/document-templates/compte-resultat-pdf.js';

const DOCUMENTS = {
  courrier_banque:        { builder: buildCourrierBanque,    ext: 'doc',  mime: 'application/msword',       title: 'Courrier banque' },
  courrier_bpi:           { builder: buildCourrierBpi,       ext: 'doc',  mime: 'application/msword',       title: 'Demande BPI France' },
  lettre_intention:       { builder: buildLettreIntention,   ext: 'doc',  mime: 'application/msword',       title: "Lettre d'intention" },
  plan_tresorerie:        { builder: buildTresorerie,        ext: 'xls',  mime: 'application/vnd.ms-excel', title: 'Plan tresorerie 12 mois' },
  compte_resultat_3ans:   { builder: buildCompteResultat,    ext: 'xls',  mime: 'application/vnd.ms-excel', title: 'Compte de resultat 3 ans' },
  fiche_synthese:         { builder: buildFicheSynthese,     ext: 'html', mime: 'text/html',                title: 'Fiche synthese' },
  tresorerie_pdf:         { builder: buildTresoreriePdf,     ext: 'html', mime: 'text/html',                title: 'Tresorerie PDF' },
  compte_resultat_pdf:    { builder: buildCompteResultatPdf, ext: 'html', mime: 'text/html',                title: 'Compte de resultat PDF' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth guard — Bearer JWT Supabase ──────────────────────────────────
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Token invalide' });
  } catch (_) {
    return res.status(401).json({ error: 'Vérification auth échouée' });
  }

  try {
    const { type, plan: rawPlan } = req.body;
    if (!type || !rawPlan) {
      return res.status(400).json({ error: 'type et plan requis' });
    }

    const doc = DOCUMENTS[type];
    if (!doc) {
      return res.status(400).json({ error: `Type inconnu : ${type}` });
    }

    // Enrichissement : parse les marqueurs {{V/E/H:...}} → nombres
    const plan = enrichPlan(rawPlan);

    // Construction du document (string direct RTF / HTML / XLS)
    const body = doc.builder(plan);

    // Nom de fichier sécurisé
    const slug = (plan.nom_business || 'eadee')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/gi, '-').toLowerCase()
      .slice(0, 40);
    const filename = `eadee-${slug}-${type}.${doc.ext}`;

    res.setHeader('Content-Type',        `${doc.mime}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control',       'no-store');

    return res.status(200).send(body);

  } catch (err) {
    console.error('generate-document error:', err);
    return res.status(500).json({ error: err.message });
  }
}
