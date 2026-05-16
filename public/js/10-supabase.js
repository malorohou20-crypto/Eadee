// ========== SUPABASE AUTH ==========
async function loadCurrentUser() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      user = null;
      userCredits = 0;
      currentPlan = 'free';
      updateNav();
      return;
    }
    const { data: profile } = await supabaseClient
      .from('profiles').select('*').eq('id', session.user.id).single();
    const { data: userPlans } = await supabaseClient
      .from('plans').select('*').eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    user = {
      id: session.user.id,
      email: session.user.email,
      name: ((profile?.first_name || '') + ' ' + (profile?.last_name || '')).trim() || session.user.email.split('@')[0],
    };
    currentPlan = profile?.plan || 'free';
    userCredits = profile?.credits || 0;
    const supabasePlans = (userPlans || []).map(p => ({
      ...p.sections,
      id: p.id,
      _supabaseId: p.id,
      timestamp: new Date(p.created_at).getTime(),
      nom_entreprise: p.name,
      score_viabilite: p.sections?.score_viabilite || p.score,
    }));
    // Fusionner avec les plans localStorage (pour ne pas perdre les anciens plans)
    const localRaw = (function() {
      try { return JSON.parse(localStorage.getItem('eadee_history') || '[]'); } catch(e) { return []; }
    })();
    const supabaseIds = new Set(supabasePlans.map(p => String(p._supabaseId)));
    const localOnly = localRaw.filter(function(p) {
      return !supabaseIds.has(String(p.id));
    }).map(function(p) {
      return Object.assign({}, p, { date: p.date ? new Date(p.date) : new Date() });
    });
    plansHistory = supabasePlans.concat(localOnly);

    updateNav();
    updateUsage();
    updateDashHeader();
  } catch(e) {
    console.error('loadCurrentUser error:', e);
  }
}

