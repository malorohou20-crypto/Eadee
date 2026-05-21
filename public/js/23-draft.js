// ========== ONBOARDING ==========
function checkOnboarding() {
  const banner = document.getElementById('onboarding-banner');
  if (!banner) return;
  if (!localStorage.getItem('eadee_onboarded')) {
    banner.style.display = 'block';
    const title = document.getElementById('onboarding-title');
    if (title && user) title.textContent = '👋 Bienvenue ' + user.name.split(' ')[0] + ' !';
  } else {
    banner.style.display = 'none';
  }
}
function dismissOnboarding() {
  localStorage.setItem('eadee_onboarded', '1');
  const banner = document.getElementById('onboarding-banner');
  if (banner) { banner.style.opacity = '0'; banner.style.transition = 'opacity .3s'; setTimeout(() => banner.style.display = 'none', 300); }
}

// ========== PERSONALIZED HEADER ==========
function updateDashHeader() {
  const titleEl = document.getElementById('dash-gen-title');
  const subEl = document.getElementById('dash-gen-sub');
  if (!titleEl || !subEl) return;
  const firstName = user ? user.name.split(' ')[0] : '';
  if (firstName) {
    titleEl.textContent = 'Bonjour ' + firstName + ', prêt à valider ta prochaine idée ?';
  } else {
    titleEl.textContent = 'Génère ton plan';
  }
  if (plansHistory.length === 0) {
    subEl.textContent = 'Décris ton idée et reçois ton premier plan en 60 secondes';
  } else {
    subEl.textContent = 'Tu as déjà généré ' + plansHistory.length + ' plan' + (plansHistory.length > 1 ? 's' : '') + ' · Continue ou explore une nouvelle idée';
  }
}

// ========== IDEA INPUT + DRAFT ==========
let _draftTimer = null;
let _draftIndicatorTimer = null;

function onIdeaInput(ta) {
  const len = ta.value.length;
  const counter = document.getElementById('idea-char-count');
  if (counter) {
    counter.textContent = len + ' / 500';
    counter.style.color = len > 420 ? '#f59e0b' : len >= 150 ? '#34d399' : len >= 50 ? '#6b8fef' : '#7a7f9a';
  }
  const msg = document.getElementById('idea-quality-msg');
  if (msg) {
    if (len === 0) msg.textContent = 'Plus tu détailles, meilleur sera ton plan.';
    else if (len < 50) msg.textContent = '🟡 Continue, l\'IA a besoin de plus de contexte.';
    else if (len < 150) msg.textContent = '🟢 Bien — ajoute ta ville et ton public si possible.';
    else msg.textContent = '✨ Excellent brief, ton plan sera précis.';
  }
  setPreviewState(len >= 30 ? 'B' : 'A');
  updateTips(ta.value.toLowerCase());
  clearTimeout(_draftTimer);
  _draftTimer = setTimeout(() => saveDraft(), 500);
}

function updateTips(text) {
  document.querySelectorAll('.tip-item').forEach(item => {
    const keywords = item.dataset.keywords.split(',');
    const found = keywords.some(kw => text.includes(kw.trim()));
    item.classList.toggle('done', found);
    const checkEl = item.querySelector('.tip-check');
    if (checkEl) checkEl.textContent = found ? '✓' : '○';
  });
}

function saveDraft() {
  const ta = document.getElementById('dashIdea');
  if (!ta) return;
  const draft = {
    idea: ta.value,
    budget: document.getElementById('dashBudget')?.value,
    profile: document.getElementById('dashProfile')?.value,
    sector: document.getElementById('dashSector')?.value,
    time: document.getElementById('dashTime')?.value,
    planName: document.getElementById('dashPlanName')?.value,
    ts: Date.now()
  };
  try { localStorage.setItem('eadee_draft', JSON.stringify(draft)); } catch(e) {}
  showDraftIndicator();
}

function showDraftIndicator() {
  const el = document.getElementById('draft-indicator');
  if (!el) return;
  el.style.opacity = '1';
  clearTimeout(_draftIndicatorTimer);
  _draftIndicatorTimer = setTimeout(() => { if (el) el.style.opacity = '0'; }, 3000);
  el.textContent = 'Brouillon sauvegardé · à l\'instant';
}

function checkDraft() {
  try {
    // Si un plan est déjà affiché, ne pas montrer la bannière
    if (currentResult) return;

    // Résoudre la bannière : v2 = genBanner, v1 = draft-resume-banner
    const banner = document.getElementById('genBanner') || document.getElementById('draft-resume-banner');
    if (!banner) return;

    // Résoudre l'élément de prévisualisation du texte
    const isV2 = banner.id === 'genBanner';
    const preview = isV2
      ? document.getElementById('genBannerDraft')
      : document.getElementById('draft-preview-text');

    // Priorité 1 : dernier plan réellement généré (eadee_history)
    const histRaw = localStorage.getItem('eadee_history');
    if (histRaw) {
      const hist = JSON.parse(histRaw);
      if (Array.isArray(hist) && hist.length > 0 && hist[0].idea && hist[0].idea.trim().length >= 10) {
        const last = hist[0];
        if (preview) preview.textContent = '« ' + last.idea.substring(0, 60) + (last.idea.length > 60 ? '…' : '') + ' »';
        banner.style.display = 'flex';
        banner._fromHistory = true;
        banner._draft = { idea: last.idea };
        return;
      }
    }
    // Priorité 2 : brouillon en cours (eadee_draft)
    const raw = localStorage.getItem('eadee_draft');
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft.idea || draft.idea.trim().length < 10) return;
    if (preview) preview.textContent = '« ' + draft.idea.substring(0, 60) + (draft.idea.length > 60 ? '…' : '') + ' »';
    banner.style.display = 'flex';
    banner._draft = draft;
  } catch(e) {}
}

function resumeDraft() {
  // v2 : genBanner, v1 : draft-resume-banner
  const banner = document.getElementById('draft-resume-banner') || document.getElementById('genBanner');
  if (!banner) return;
  // Lire le brouillon depuis _draft (v1) OU localStorage (v2)
  let d = banner._draft;
  if (!d) {
    try { d = JSON.parse(localStorage.getItem('eadee_draft') || 'null'); } catch(e) {}
  }
  if (!d || !d.idea) return;
  banner.style.display = 'none';
  // Si ça vient de l'historique → ouvre directement le dernier plan généré
  if (banner._fromHistory) { if (typeof openFromHistory === 'function') openFromHistory(0); return; }
  // Sinon → remplit le formulaire
  const ta = document.getElementById('dashIdea');
  if (ta) { ta.value = d.idea; ta.dispatchEvent(new Event('input')); }
  const b = document.getElementById('dashBudget');  if (d.budget && b)  b.value = d.budget;
  const p = document.getElementById('dashProfile'); if (d.profile && p) p.value = d.profile;
  const s = document.getElementById('dashSector');  if (d.sector && s)  s.value = d.sector;
  const t = document.getElementById('dashTime');    if (d.time && t)    t.value = d.time;
  const n = document.getElementById('dashPlanName'); if (d.planName && n) n.value = d.planName;
}

function discardDraft() {
  localStorage.removeItem('eadee_draft');
  // v2 : genBanner, v1 : draft-resume-banner
  const banner = document.getElementById('draft-resume-banner') || document.getElementById('genBanner');
  if (banner) banner.style.display = 'none';
}

// ========== INSPIRE MODAL ==========
function openInspireModal() {
  // v2 : écran inspiration dédié (data-screen="insp")
  if (window.__EADEE_V2 && typeof window.go === 'function') { window.go('insp'); return; }
  const modal = document.getElementById('inspire-modal');
  if (modal) modal.style.display = 'flex';
}
function closeInspireModal() {
  if (window.__EADEE_V2 && typeof window.go === 'function') { window.go('gen'); return; }
  const modal = document.getElementById('inspire-modal');
  if (modal) modal.style.display = 'none';
}
function pickInspire(text) {
  const ta = document.getElementById('dashIdea');
  if (ta) { ta.value = text; ta.dispatchEvent(new Event('input')); }
  closeInspireModal();
}

