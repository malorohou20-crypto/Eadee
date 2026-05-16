// ========== PAYMENT ==========
function selectPlan(planId) {
  const plans = { solo: { name: 'Solo', price: 12.99, credits: 1 }, pro: { name: 'Pro', price: 29.99, credits: 3 }, empire: { name: 'Empire', price: 59.99, credits: 8 } };
  if (!user) { if (typeof showAuth === 'function') showAuth('signup'); return; }
  selectedPayPlan = plans[planId];
  // Navigation compatible v1 et v2
  if (typeof window.go === 'function') { window.go('credits'); }
  else if (typeof showPage === 'function') { showPage('dashboard'); }
  if (typeof showView === 'function') { showView('billing'); }
  const option = document.querySelector(`[data-plan="${planId}"]`);
  if (option) selectPayPlan(option);
}

function selectPayPlan(el) {
  if (!el) return;
  // Compatible .pack (v2) et .pay-plan-option (v1)
  document.querySelectorAll('.pay-plan-option, .pack').forEach(o => o.classList.remove('selected', 'on'));
  el.classList.add('selected');
  el.classList.add('on');
  const plan = el.dataset.plan;
  const price = el.dataset.price;
  const credits = parseInt(el.dataset.credits) || (plan === 'solo' ? 1 : plan === 'pro' ? 3 : 8);
  selectedPayPlan = { name: plan === 'solo' ? 'Solo' : plan === 'pro' ? 'Pro' : 'Empire', price: parseFloat(price) || 29.99, credits };

  // osPlan/osTotal/osCredits sont mappés vers sum-pack/sum-total/sum-cred via compat layer
  const osPlanEl = document.getElementById('osPlan');
  if (osPlanEl) osPlanEl.textContent = selectedPayPlan.name;
  const osTotalEl = document.getElementById('osTotal');
  if (osTotalEl) osTotalEl.textContent = selectedPayPlan.price.toFixed(2) + '€';
  const osCreditsEl = document.getElementById('osCredits');
  if (osCreditsEl) osCreditsEl.textContent = credits + ' générations';

  // Mettre à jour le bouton payer
  const payBtn = document.getElementById('payBtn');
  if (payBtn) payBtn.textContent = 'Acheter mes crédits — ' + selectedPayPlan.price.toFixed(2) + '€';

  const feats = ['Business plan complet — 23 sections','Généré en 60 secondes','Compatible dossier banque & BPI','Démarches administratives pré-remplies','Emails prêts à envoyer','Sans abonnement · Sans expiration','Conseiller Eadee 24h/24'];
  const osFeaturesEl = document.getElementById('osFeatures');
  if (osFeaturesEl) osFeaturesEl.innerHTML = feats.map(f => `<div class="os-feat">${f}</div>`).join('');
}

// Initialisation de la vue billing (appelée par go('credits'))
function initBillingView() {
  // Sélectionner le pack actif par défaut (pro)
  const defaultPack = document.querySelector('.pack.on') || document.querySelector('.pack');
  if (defaultPack && defaultPack.dataset.plan) {
    selectPayPlan(defaultPack);
  }
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


