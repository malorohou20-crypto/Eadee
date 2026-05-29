(function(){
  const SB_URL='https://gyzyvcvphizbbdhaiwne.supabase.co';
  const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5enl2Y3ZwaGl6YmJkaGFpd25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDc2MzQsImV4cCI6MjA5Mjk4MzYzNH0.onkLrBBW1BV4Rk2Rj2Er2boqvT3_RI4gbUwaJEtHsvc';
  const sb = supabase.createClient(SB_URL, SB_KEY);
  let authMode = 'signup';

  function showAuthErr(msg, color) {
    var el = document.getElementById('authError');
    el.textContent = msg;
    el.style.color = color || '#c0392b';
    el.style.display = 'block';
  }
  function translateErr(msg) {
    if (!msg) return 'Erreur de connexion.';
    if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if (msg.includes('User already registered'))   return 'Email déjà utilisé. Connecte-toi plutôt.';
    if (msg.includes('Email not confirmed'))        return 'Confirme ton email avant de te connecter.';
    if (msg.includes('Password should be'))         return 'Mot de passe trop court (8 caractères min).';
    return msg;
  }

  window.openAuth = function(mode) {
    authMode = mode || 'signup';
    var isLogin = authMode === 'login';
    document.getElementById('authTitle').textContent    = isLogin ? 'Connexion'             : 'Créer un compte';
    document.getElementById('authSub').textContent      = isLogin ? 'Bon retour !'           : 'Commencez gratuitement';
    document.getElementById('authSubmit').textContent   = isLogin ? 'Se connecter →'         : 'Créer mon compte →';
    document.getElementById('authToggleTxt').textContent= isLogin ? 'Pas encore de compte ? ': 'Déjà un compte ? ';
    document.getElementById('authToggleLink').textContent = isLogin ? 'Créer un compte'      : 'Se connecter';
    document.getElementById('authForgotWrap').style.display = isLogin ? 'block' : 'none';
    document.getElementById('authError').style.display  = 'none';
    document.getElementById('authOverlay').style.display = 'block';
  };
  window.closeAuth      = function() { document.getElementById('authOverlay').style.display = 'none'; };
  window.toggleAuthMode = function() { window.openAuth(authMode === 'signup' ? 'login' : 'signup'); };

  window.submitAuth = async function() {
    var email    = document.getElementById('authEmail').value.trim();
    var password = document.getElementById('authPassword').value;
    var btn      = document.getElementById('authSubmit');
    document.getElementById('authError').style.display = 'none';
    // Validation front
    var emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !password)        { showAuthErr('Email et mot de passe requis.');          return; }
    if (!emailRx.test(email))       { showAuthErr('Adresse email invalide.');                return; }
    if (password.length < 8)        { showAuthErr('Minimum 8 caractères pour le mot de passe.'); return; }
    btn.textContent = '…'; btn.disabled = true;
    try {
      var res = authMode === 'signup'
        ? await sb.auth.signUp({ email, password })
        : await sb.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      if (authMode === 'signup' && !res.data.session) {
        showAuthErr('✉ Vérifie ton email pour activer ton compte.', '#16a34a');
        btn.textContent = 'Créer mon compte →'; btn.disabled = false;
        return;
      }
      window.location.href = '/eadee-app-v2.html';
    } catch(e) {
      showAuthErr(translateErr(e.message));
      btn.textContent = authMode === 'login' ? 'Se connecter →' : 'Créer mon compte →';
      btn.disabled = false;
    }
  };

  window.forgotPwd = async function() {
    var email = document.getElementById('authEmail').value.trim();
    var emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email)               { showAuthErr('Saisis ton email d\'abord.');  return; }
    if (!emailRx.test(email)) { showAuthErr('Adresse email invalide.');      return; }
    try {
      var { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/?reset=true',
      });
      if (error) throw error;
      showAuthErr('✉ Email de réinitialisation envoyé — vérifie ta boîte.', '#16a34a');
    } catch(e) {
      showAuthErr(e.message || 'Erreur — réessaie.');
    }
  };

  window.submitReset = async function() {
    var pwd    = document.getElementById('resetPwd').value;
    var errEl  = document.getElementById('resetError');
    var btn    = document.getElementById('resetSubmit');
    errEl.style.display = 'none';
    if (pwd.length < 8) { errEl.textContent = 'Minimum 8 caractères.'; errEl.style.display = 'block'; return; }
    btn.textContent = '…'; btn.disabled = true;
    try {
      var { error } = await sb.auth.updateUser({ password: pwd });
      if (error) throw error;
      document.getElementById('resetOverlay').style.display = 'none';
      window.location.href = '/eadee-app-v2.html';
    } catch(e) {
      errEl.textContent = e.message || 'Erreur — réessaie.';
      errEl.style.display = 'block';
      btn.textContent = 'Enregistrer →'; btn.disabled = false;
    }
  };

  // Détection du lien de réinitialisation dans l'URL (hash #type=recovery injecté par Supabase)
  sb.auth.onAuthStateChange(function(event) {
    if (event === 'PASSWORD_RECOVERY') {
      document.getElementById('authOverlay').style.display = 'none';
      document.getElementById('resetOverlay').style.display = 'block';
    }
  });

  window.googleAuth = async function() {
    try {
      await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/eadee-app-v2.html' }
      });
    } catch(e) {
      showAuthErr(e.message || 'Erreur Google — réessaie.');
    }
  };

  // Ouvrir la modal auth si ?login=true (redirect depuis eadee-app-v2.html)
  (function() {
    var p = new URLSearchParams(window.location.search);
    if (p.get('login') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      window.openAuth(p.get('mode') || 'signup');
    }
  })();
})();

// ——— SCROLL REVEAL ———
(function(){
  var groups = [
    { sel: '.section-head',   delay: 0 },
    { sel: '#process .step',  stagger: 0.1 },
    { sel: '.feature-text',   delay: 0 },
    { sel: '.feature-visual', delay: 0.14 },
    { sel: '.trans-col',      stagger: 0.1 },
    { sel: '.section-lead',   delay: 0.12 },
    { sel: '.toc-tabs',       delay: 0.12 },
    { sel: '.toc-grid',       delay: 0.2 },
    { sel: '.price',          stagger: 0.1 },
    { sel: '.price-foot',     delay: 0.3 },
    { sel: '.price-bullets',  delay: 0.35 },
    { sel: '.faq',            delay: 0.1 },
    { sel: '.testimonial',    stagger: 0.08 },
  ];
  groups.forEach(function(g){
    document.querySelectorAll(g.sel).forEach(function(el, i){
      el.classList.add('reveal');
      el.style.transitionDelay = (g.stagger ? i * g.stagger : g.delay) + 's';
    });
  });
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
})();
