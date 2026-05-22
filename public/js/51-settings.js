// ========== SETTINGS ==========

// Pré-remplir les champs avec les données de l'utilisateur connecté
function populateSettings() {
  if (!user) return;
  const nameEl = document.getElementById('settingsName');
  const emailEl = document.getElementById('settingsEmail');
  if (nameEl && user.name) nameEl.value = user.name;
  if (emailEl && user.email) emailEl.value = user.email;
}

async function saveSettings() {
  if (!user) return;
  const nameEl  = document.getElementById('settingsName');
  const emailEl = document.getElementById('settingsEmail');
  const name  = nameEl  ? nameEl.value.trim()  : '';
  const email = emailEl ? emailEl.value.trim() : '';

  // Mise à jour du nom dans Supabase
  if (supabaseClient && user.id && name) {
    try {
      const parts = name.split(' ');
      await supabaseClient.from('profiles')
        .update({ first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' })
        .eq('id', user.id);
      user.name = name;
    } catch(e) { console.warn('saveSettings Supabase:', e); }
  }

  // Mise à jour de l'email (envoie un email de confirmation)
  if (supabaseClient && email && email !== user.email) {
    try {
      const { error } = await supabaseClient.auth.updateUser({ email });
      if (error) throw error;
      if (typeof toast === 'function') toast('Email mis à jour — vérifie ta boîte mail pour confirmer', 'success');
    } catch(e) {
      if (typeof toast === 'function') toast('Erreur email : ' + (e.message || 'Réessaie'), 'error');
      return;
    }
  } else {
    if (typeof toast === 'function') toast('Profil mis à jour ✓', 'success');
  }

  if (typeof updateNav === 'function') updateNav();
  if (typeof window._updateV2UserUI === 'function') window._updateV2UserUI();
  if (typeof initChat === 'function') initChat();
}

// Changer le mot de passe via Supabase
async function updatePassword() {
  if (!user || !supabaseClient) { if (typeof toast === 'function') toast('Connecte-toi d\'abord', 'error'); return; }
  const newPwdEl = document.getElementById('settingsNewPwd');
  const confirmEl = document.getElementById('settingsConfirmPwd');
  const newPwd = newPwdEl ? newPwdEl.value.trim() : '';
  const confirmPwd = confirmEl ? confirmEl.value.trim() : '';
  if (!newPwd) { if (typeof toast === 'function') toast('Saisis un nouveau mot de passe', 'error'); return; }
  if (newPwd.length < 12) { if (typeof toast === 'function') toast('Mot de passe trop court (min. 12 caractères)', 'error'); return; }
  if (newPwd !== confirmPwd) { if (typeof toast === 'function') toast('Les mots de passe ne correspondent pas', 'error'); return; }
  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPwd });
    if (error) throw error;
    if (newPwdEl) newPwdEl.value = '';
    if (confirmEl) confirmEl.value = '';
    if (typeof toast === 'function') toast('Mot de passe mis à jour ✓', 'success');
  } catch(e) {
    if (typeof toast === 'function') toast('Erreur : ' + (e.message || 'Réessaie'), 'error');
  }
}

// ========== RGPD — EXPORT DONNÉES ==========
async function exportMyData() {
  if (!user || !supabaseClient) { toast('Connecte-toi d\'abord', 'error'); return; }
  const confirmed = confirm('Télécharger toutes tes données (plans, conversations, achats) au format JSON ?');
  if (!confirmed) return;
  toast('Préparation de tes données…', 'success');

  try {
    const profile = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
    const plans   = await supabaseClient.from('plans').select('*').eq('user_id', user.id);

    // Tables optionnelles — ne pas planter si elles n'existent pas encore
    let chats     = { data: [] };
    let purchases = { data: [] };
    try { chats     = await supabaseClient.from('chat_conversations').select('*').eq('user_id', user.id); } catch(_) {}
    try { purchases = await supabaseClient.from('purchases').select('*').eq('user_id', user.id); } catch(_) {}

    const data = {
      export_date: new Date().toISOString(),
      note: 'Conformément au RGPD article 20 (droit à la portabilité). Eadee.',
      user: { id: user.id, email: user.email, profile: profile.data },
      plans: plans.data || [],
      chat_conversations: chats.data || [],
      purchases: purchases.data || [],
    };

    // Téléchargement JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `eadee-export-${(user.name || user.email || 'data').replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('Export téléchargé', 'success');
  } catch(e) { toast('Erreur lors de l\'export', 'error'); }
}

function requestRectification() {
  if (!user) return;
  window.location.href = `mailto:contact@eadee.fr?subject=Demande de rectification RGPD&body=Bonjour,%0D%0A%0D%0AJe souhaite faire rectifier les données suivantes :%0D%0A%0D%0A[Décris la donnée à corriger]%0D%0A%0D%0AMon ID utilisateur : ${user.id}`;
}

// ========== RGPD — SUPPRESSION COMPTE ==========
async function confirmDeleteAccount() {
  if (!user || !supabaseClient) return;

  const confirm1 = confirm('Es-tu sûr ? Cette action est DÉFINITIVE.\n\nTes plans, conversations et données seront supprimés sous 30 jours.');
  if (!confirm1) return;

  const typed = prompt(`Pour confirmer, tape exactement :\nSUPPRIMER ${user.email}`);
  if (typed !== `SUPPRIMER ${user.email}`) { toast('Confirmation incorrecte — suppression annulée', 'error'); return; }

  try {
    // Logger la demande RGPD
    await supabaseClient.from('rgpd_requests').insert({ user_id: user.id, type: 'deletion', status: 'pending' });

    // Appeler l'Edge Function de suppression
    const { data: { session } } = await supabaseClient.auth.getSession();
    const res = await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, accessToken: session?.access_token }),
    });

    if (res.ok) {
      await supabaseClient.auth.signOut();
      user = null; userCredits = 0; currentPlan = 'free'; plansHistory = [];
      toast('Compte supprimé. À bientôt.', 'success');
      setTimeout(() => showPage('landing'), 1500);
    } else {
      // Fallback : signout + email admin
      await supabaseClient.auth.signOut();
      toast('Demande enregistrée — suppression traitée sous 30 jours', 'success');
      setTimeout(() => showPage('landing'), 2000);
    }
  } catch(e) { toast('Erreur — contacte contact@eadee.fr', 'error'); }
}
// initCookieBanner est défini dans 70-cookies.js qui s'occupe de son propre init

