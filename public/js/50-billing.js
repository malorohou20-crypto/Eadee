// ========== PAYMENT ==========
function selectPlan(planId) {
  const plans = { solo: { name: 'Solo', price: 12.99, credits: 1 }, pro: { name: 'Pro', price: 29.99, credits: 3 }, empire: { name: 'Empire', price: 59.99, credits: 8 } };
  if (!user) { showAuth('signup'); return; }
  selectedPayPlan = plans[planId];
  showPage('dashboard');
  showView('billing');
  const option = document.querySelector(`[data-plan="${planId}"]`);
  if (option) selectPayPlan(option);
}

function selectPayPlan(el) {
  document.querySelectorAll('.pay-plan-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  const plan = el.dataset.plan;
  const price = el.dataset.price;
  const credits = parseInt(el.dataset.credits) || (plan === 'solo' ? 1 : plan === 'pro' ? 3 : 8);
  selectedPayPlan = { name: plan === 'solo' ? 'Solo' : plan === 'pro' ? 'Pro' : 'Empire', price: parseFloat(price), credits };
  document.getElementById('osPlan').textContent = selectedPayPlan.name;
  document.getElementById('osTotal').textContent = selectedPayPlan.price.toFixed(2) + '€';
  document.getElementById('osCredits').textContent = credits + ' générations';

  const feats = ['Business plan complet — 23 sections','Généré en 60 secondes','Compatible dossier banque & BPI','Démarches administratives pré-remplies','Emails prêts à envoyer','Sans abonnement · Sans expiration','Conseiller Eadee 24h/24'];

  document.getElementById('osFeatures').innerHTML = feats.map(f => `<div class="os-feat">${f}</div>`).join('');
}

function formatCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.match(/.{1,4}/g)?.join(' ') || v;
}

function formatExp(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
  input.value = v;
}

async function processPayment() {
  if (!user) { toast('Connecte-toi d\'abord', 'error'); return; }

  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  btn.textContent = '⏳ REDIRECTION STRIPE...';

  try {
    const plan = (selectedPayPlan.name || 'solo').toLowerCase();
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, userId: user.id, userEmail: user.email }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error || 'Erreur Stripe');
    window.location.href = data.url;
  } catch(e) {
    toast('Erreur paiement : ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = 'ACHETER MES CRÉDITS';
  }
}

// Gestion retour depuis Stripe
(function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    // Nettoyer l'URL
    window.history.replaceState({}, '', '/');
    // Attendre que l'app soit prête puis recharger le profil
    window.addEventListener('DOMContentLoaded', async () => {
      await new Promise(r => setTimeout(r, 1500));
      if (supabaseClient) await loadCurrentUser();
      showPage('dashboard');
      showView('generator');
      toast('Paiement confirmé — tes crédits ont été ajoutés !', 'success');
    });
  } else if (params.get('payment') === 'cancel') {
    window.history.replaceState({}, '', '/');
    window.addEventListener('DOMContentLoaded', () => {
      toast('Paiement annulé', 'error');
    });
  }
})();


