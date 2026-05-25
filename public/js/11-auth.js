// ========== AUTH ==========
function showAuth(mode) {
  showPage('auth');
  switchAuthTab(mode);
}

let authMode = 'signup';
function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('signupFields').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('authSubtext').textContent = mode === 'signup' ? 'Crée ton compte' : 'Content de te revoir';
  document.getElementById('authSubmitBtn').textContent = mode === 'signup' ? 'CRÉER MON COMPTE' : 'SE CONNECTER';
  document.getElementById('authNote').style.display = mode === 'signup' ? 'block' : 'none';
}

async function handleAuth() {
  const isSignup = document.getElementById('tab-signup')?.classList.contains('active');
  const email = document.getElementById('authEmail')?.value.trim();
  const password = document.getElementById('authPassword')?.value;
  const nameInput = document.getElementById('authName');
  const name = nameInput?.value.trim();

  // Clear previous error
  const errEl = document.getElementById('authError');
  if (errEl) errEl.style.display = 'none';

  if (!email || !password) return showAuthError('Email et mot de passe requis.');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return showAuthError('Adresse email invalide.');
  if (isSignup && nameInput && !name) return showAuthError('Ton prénom est requis.');
  if (password.length < 8) return showAuthError('Minimum 8 caractères pour le mot de passe.');

  const btn = document.getElementById('authSubmitBtn');
  const originalText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = isSignup ? 'CRÉATION...' : 'CONNEXION...'; }

  try {
    if (isSignup) {
      const { data, error } = await supabaseClient.auth.signUp({
        email, password,
        options: { data: { first_name: name ? name.split(' ')[0] : email.split('@')[0] } }
      });
      if (error) throw error;
      if (data.session) {
        await loadCurrentUser();
        showPage('dashboard');
        toast('Compte créé, bienvenue !', 'success');
      } else {
        showAuthError('✉ Vérifie ton email pour activer ton compte.');
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await loadCurrentUser();
      showPage('dashboard');
      toast('Connecté !', 'success');
    }
  } catch(e) {
    showAuthError(traduireErreurAuth(e.message));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
  }
}

function showAuthError(msg) {
  let el = document.getElementById('authError');
  if (!el) {
    el = document.createElement('div');
    el.id = 'authError';
    el.className = 'auth-error';
    const submitBtn = document.getElementById('authSubmitBtn');
    if (submitBtn) submitBtn.parentNode.insertBefore(el, submitBtn);
  }
  el.textContent = msg;
  el.style.display = 'block';
}

function traduireErreurAuth(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (msg.includes('User already registered')) return 'Email déjà utilisé. Connecte-toi plutôt.';
  if (msg.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.';
  if (msg.includes('Password should be')) return 'Mot de passe trop court (8 caractères min).';
  return msg;
}

async function handleGoogleAuth() {
  try {
    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/eadee-app-v2.html' }
    });
  } catch(e) {
    toast('Erreur Google — réessaie.', 'error');
  }
}

async function forgotPassword() {
  const email = document.getElementById('authEmail')?.value.trim();
  if (!email) return showAuthError('Saisis ton email d\'abord.');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return showAuthError('Adresse email invalide.');
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/?reset=true'
    });
    if (error) throw error;
    showAuthError('✉ Email de réinitialisation envoyé — vérifie ta boîte.');
  } catch(e) {
    showAuthError(e.message || 'Erreur — réessaie.');
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  user = null; userCredits = 0; currentPlan = 'free'; plansHistory = [];
  showPage('landing');
  toast('À bientôt !', 'success');
}

