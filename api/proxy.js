export const config = { runtime: 'nodejs' };

import { jsonrepair } from 'jsonrepair';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Vérification JWT Supabase — seuls les utilisateurs authentifiés peuvent utiliser le proxy
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: { message: 'Non authentifié' } });
  }
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: { message: 'Token invalide' } });
    }
  } catch (_) {
    return res.status(401).json({ error: { message: 'Vérification auth échouée' } });
  }

  try {
    // Validation minimale : éviter l'abus de max_tokens et forcer le modèle autorisé
    const body = req.body;
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return res.status(400).json({ error: { message: 'messages requis' } });
    }
    // Plafonner max_tokens à 8000 et forcer le modèle
    const safeBody = {
      ...body,
      model: 'claude-sonnet-4-6',
      max_tokens: Math.min(body.max_tokens || 4000, 8000),
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(safeBody),
      signal: AbortSignal.timeout(60000), // 60s timeout
    });

    // Gestion rate limit
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || '30';
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: { message: `Rate limit atteint. Réessaie dans ${retryAfter}s.` } });
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const text = (data.content || []).map(i => i.text || '').join('');

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return res.status(500).json({ error: { message: 'Pas de JSON dans la réponse' } });
    }

    const raw = text.slice(start, end + 1);

    let plan;
    try {
      // Try direct parse first
      plan = JSON.parse(raw);
    } catch (e1) {
      try {
        // Use jsonrepair to fix all common issues (unescaped quotes, trailing commas, etc.)
        const repaired = jsonrepair(raw);
        plan = JSON.parse(repaired);
      } catch (e2) {
        return res.status(500).json({ error: { message: 'JSON invalide même après réparation: ' + e2.message } });
      }
    }

    return res.status(200).json({
      ...data,
      content: [{ type: 'text', text: JSON.stringify(plan) }]
    });

  } catch (err) {
    return res.status(500).json({ error: { message: 'Erreur serveur: ' + err.message } });
  }
}
