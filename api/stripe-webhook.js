export const config = { runtime: 'edge' };

// Vérification signature Stripe via Web Crypto API (compatible Edge)
async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  // Anti-replay : rejeter les événements de plus de 5 minutes
  const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (timestampAge > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const payload = await req.text();

    // Vérifier la signature
    const valid = await verifyStripeSignature(payload, sig || '', webhookSecret || '');
    if (!valid) {
      console.error('Signature Stripe invalide');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(payload);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || '0', 10);
      const plan = session.metadata?.plan || 'starter';

      if (userId && credits > 0) {
        // Ajouter les crédits dans Supabase via REST API
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        // Lire les crédits actuels
        const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits,plan`, {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        });
        const profiles = await profileRes.json();
        const current = profiles[0] || { credits: 0, plan: 'free' };
        const newCredits = (current.credits || 0) + credits;
        const newPlan = plan;

        // Mettre à jour le profil
        await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ credits: newCredits, plan: newPlan }),
        });

        // Enregistrer l'achat
        await fetch(`${supabaseUrl}/rest/v1/purchases`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            pack: plan,
            amount_cents: session.amount_total,
            credits_added: credits,
            status: 'completed',
            stripe_session_id: session.id,
          }),
        });

        console.log(`✅ ${credits} crédits ajoutés pour ${userId}`);
      }
    }

    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error('stripe-webhook error:', e);
    return new Response('Error', { status: 500 });
  }
}
