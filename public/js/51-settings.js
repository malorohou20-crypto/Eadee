// ========== SETTINGS ==========
function saveSettings() {
  if (!user) return;
  const name = document.getElementById('settingsName').value.trim();
  const email = document.getElementById('settingsEmail').value.trim();
  if (name) user.name = name;
  if (email) user.email = email;
  updateNav(); initChat();
  toast('Profil mis à jour ✓', 'success');
}

// ========== RGPD — EXPORT DONNÉES ==========
async function exportMyData() {
  if (!user || !supabaseClient) { toast('Connecte-toi d\'abord', 'error'); return; }
  toast('Préparation de tes données…', 'success');

  try {
    const [profile, plans, chats, purchases] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).single(),
      supabaseClient.from('plans').select('*').eq('user_id', user.id),
      supabaseClient.from('chat_conversations').select('*').eq('user_id', user.id),
      supabaseClient.from('purchases').select('*').eq('user_id', user.id),
    ]);

    const data = {
      export_date: new Date().toISOString(),
      note: 'Conformément au RGPD article 20 (droit à la portabilité). Eadee.',
      user: { id: user.id, email: user.email, profile: profile.data },
      plans: plans.data || [],
      chat_conversations: chats.data || [],
      purchases: purchases.data || [],
    };

    // Logger la demande
    await supabaseClient.from('rgpd_requests').insert({ user_id: user.id, type: 'export', status: 'completed', completed_at: new Date().toISOString() });

    // Téléchargement JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `eadee-export-${user.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
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
document.addEventListener('DOMContentLoaded', initCookieBanner);
document.addEventListener('DOMContentLoaded', () => { setPreviewState('A'); });

