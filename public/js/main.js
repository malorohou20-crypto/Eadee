// ========== INIT ==========
// Mode démo admin — ?preview=eadee2024 → 3 crédits Pro
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === 'eadee2024') {
    user = { name: 'Admin', email: 'admin@eadee.fr', plan: 'pro' };
    currentPlan = 'pro';
    // Restaurer les crédits demo depuis localStorage (persiste après rechargement)
    const savedDemoCredits = localStorage.getItem('eadee_demo_credits');
    userCredits = savedDemoCredits !== null ? parseInt(savedDemoCredits, 10) : 3;
    // v2 : showPage/showView sont des stubs — on utilise go() si disponible
    if (window.__EADEE_V2) {
      if (typeof window.go === 'function') window.go('gen');
    } else {
      try { showPage('dashboard'); } catch(e) {}
      try { showView('generator'); } catch(e) {}
    }
    if (typeof updateUsage === 'function') updateUsage();
    if (typeof updateDashHeader === 'function') updateDashHeader();
  }
})();

if (typeof updateNav === 'function') updateNav();
if (typeof initChat === 'function') initChat();
