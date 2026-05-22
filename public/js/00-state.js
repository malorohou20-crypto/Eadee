// ========== SUPABASE ==========
let supabaseClient = null;

const IS_DEMO = false;

async function initSupabase() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
      // Réutiliser le client existant si déjà créé (évite le double GoTrueClient)
      supabaseClient = window._eadeeSb || window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      supabaseClient.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') loadCurrentUser();
        if (event === 'SIGNED_OUT') { user = null; userCredits = 0; currentPlan = 'free'; updateNav(); }
      });
      await loadCurrentUser();
    }
  } catch(e) {
    console.warn('Supabase init failed:', e);
  }
}

window.addEventListener('DOMContentLoaded', initSupabase);

// ========== STATE ==========
let user = null;
let currentPlan = 'free';
let plansHistory = (function() {
  try {
    return JSON.parse(localStorage.getItem('eadee_history') || '[]').map(p => ({ ...p, date: new Date(p.date) }));
  } catch(e) {
    console.warn('eadee_history corrompue, réinitialisation.', e);
    localStorage.removeItem('eadee_history');
    return [];
  }
})();
// Source unique de vérité pour les prix — doit rester synchronisé avec api/lib/pricing.js
const PLANS_CONFIG = {
  solo:   { name: 'Solo',   price: 12.99, credits: 1, label: 'Solo — 12,99€ / 1 génér.' },
  pro:    { name: 'Pro',    price: 29.99, credits: 3, label: 'Pro — 29,99€ / 3 génér.' },
  empire: { name: 'Empire', price: 59.99, credits: 8, label: 'Empire — 59,99€ / 8 génér.' },
};
let selectedPayPlan = { ...PLANS_CONFIG.pro };
let userCredits = 0;
let currentResult = null;

