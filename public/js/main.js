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
    showPage('dashboard');
    showView('generator');
    updateUsage();
    updateDashHeader();
  }
})();

updateNav(); initChat();
