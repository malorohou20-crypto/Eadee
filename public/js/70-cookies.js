// ========== BANDEAU COOKIES (CNIL) ==========
function initCookieBanner() {
  if (!localStorage.getItem('eadee_cookie_consent')) {
    setTimeout(() => {
      const b = document.getElementById('cookieBanner');
      if (b) b.style.display = 'block';
    }, 1200);
  }
}
// Init automatique — DOM déjà chargé (scripts en bas de page)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieBanner);
} else {
  initCookieBanner();
}

async function setCookieConsent(choice) {
  localStorage.setItem('eadee_cookie_consent', choice);
  const b = document.getElementById('cookieBanner');
  if (b) { b.style.opacity = '0'; b.style.transition = 'opacity .3s'; setTimeout(() => b.style.display = 'none', 300); }

  // Logger en DB pour preuve juridique CNIL
  try {
    let sessionId = sessionStorage.getItem('eadee_session_id');
    if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem('eadee_session_id', sessionId); }
    if (supabaseClient) {
      await supabaseClient.from('cookie_consents').insert({
        user_id: user?.id || null,
        session_id: sessionId,
        consent: choice === 'accept' ? 'accept' : 'refuse',
        user_agent: navigator.userAgent.substring(0, 200),
      });
    }
  } catch(_) {}
}

