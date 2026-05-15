// ========== PAGE NAVIGATION ==========
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  document.documentElement.style.scrollBehavior = '';
  updateNav(); initChat();
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // S'assurer qu'on est sur la landing
  if (!document.getElementById('page-landing').classList.contains('active')) showPage('landing');
  setTimeout(function() {
    document.documentElement.style.scrollBehavior = 'smooth';
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() { document.documentElement.style.scrollBehavior = ''; }, 600);
  }, 50);
}

function updateNav() {
  const nr = document.getElementById('navRight');
  const nl = document.getElementById('navLinks');
  // Afficher les liens de nav seulement sur landing
  const onLanding = document.getElementById('page-landing') && document.getElementById('page-landing').classList.contains('active');
  if (nl) nl.classList.toggle('hidden', !onLanding);
  if (user) {
    const planBadge = currentPlan === 'pro' ? 'plan-builder' : currentPlan === 'empire' ? 'plan-empire' : 'plan-free';
    const planLabel = currentPlan === 'pro' ? 'Pro' : currentPlan === 'empire' ? 'Empire' : currentPlan === 'solo' ? 'Solo' : 'Découverte';
    nr.innerHTML = `
      <span class="nav-plan ${planBadge}" onclick="showPage('dashboard');showView('billing')" style="cursor:pointer" title="Changer de plan">${planLabel}</span>
      <button class="nav-btn btn-ghost" onclick="showPage('dashboard');showView('settings')">${user.name.split(' ')[0]}</button>
      <button class="nav-btn" style="background:transparent;border:none;color:#9db8f8;font-size:18px;padding:4px 8px;position:relative" onclick="toggleNotifDropdown()" title="Notifications" id="notif-btn">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 00-6 6c0 4-2 5-2 5h16s-2-1-2-5a6 6 0 00-6-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.73 17a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span id="notif-badge" style="position:absolute;top:0;right:0;width:8px;height:8px;border-radius:50%;background:#f87171;display:none"></span>
      </button>
      <div style="position:relative">
        <button class="nav-btn btn-dark" onclick="toggleNavDropdown()">Mon espace ▾</button>
        <div id="nav-dropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:#1a1d26;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:8px;min-width:200px;z-index:500;box-shadow:0 12px 40px rgba(0,0,0,0.5)">
          <div class="nav-dd-item" onclick="showPage('dashboard');showView('settings');closeNavDropdown()">Mon profil</div>
          <div class="nav-dd-item" onclick="showPage('dashboard');showView('history');closeNavDropdown()">Mes plans</div>
          <div class="nav-dd-item" onclick="showPage('dashboard');showView('billing');closeNavDropdown()">Crédits &amp; abonnement</div>
          <div class="nav-dd-item" onclick="showPage('dashboard');showView('settings');closeNavDropdown()">Paramètres</div>
          <div class="nav-dd-item" onclick="showPage('dashboard');showView('help');closeNavDropdown()">Aide</div>
          <div style="height:1px;background:rgba(255,255,255,0.07);margin:6px 0"></div>
          <div class="nav-dd-item" onclick="logout();closeNavDropdown()" style="color:#f87171">Se déconnecter</div>
        </div>
      </div>
    `;
  } else {
    nr.innerHTML = `
      <button class="nav-btn btn-ghost" onclick="showAuth('login')">Connexion</button>
      <button class="nav-btn btn-dark" onclick="showAuth('signup')">Commencer</button>
    `;
  }
}


// ========== DASHBOARD VIEWS ==========
function showView(name) {
  document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sidebar-link[data-view]').forEach(l => l.classList.remove('active'));
  const viewEl = document.getElementById('view-' + name);
  if (viewEl) viewEl.classList.add('active');
  const link = document.querySelector(`[data-view="${name}"]`);
  if (link) link.classList.add('active');
  if (name === 'history') renderHistory();
  if (name === 'generator') {
    checkOnboarding();
    updateDashHeader();
    checkDraft();
    if (typeof initGenAnimations === 'function') initGenAnimations();
    // Start live feed if state A is visible
    const stateA = document.getElementById('preview-state-A');
    if (stateA && stateA.style.display !== 'none') setTimeout(startLiveFeed, 150);
  } else {
    stopLiveFeed();
  }
}

