// ========== GENERATOR PAGE ANIMATIONS v2 ==========
// Guard : ce script est conçu pour l'ancien SPA (page-dashboard / view-generator)
// Sur le nouveau HTML (eadee-app-v2.html), on désactive les parties qui cherchent
// les anciens sélecteurs pour éviter les crashs silencieux.
const __IS_V2 = !!window.__EADEE_V2;

// ── Entry point — appelée depuis showView('generator') ───────────────────────
function initGenAnimations() {
  // Sur le nouveau HTML, les sélecteurs #view-generator / #page-dashboard n'existent pas
  if (__IS_V2) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Injecter les éléments UI en premier (breadcrumb, séparateurs, flèche)
  _genInjectUI();

  // 1. Staggered reveal ─────────────────────────────────────────────────────
  if (!reduced) {
    const targets = [
      document.querySelector('#page-dashboard .sidebar'),
document.querySelector('#view-generator .view-header'),
      document.getElementById('draft-resume-banner'),
      document.querySelector('#view-generator .gen-panel'),
      document.getElementById('resultPanel'),
    ].filter(el => {
      if (!el) return false;
      if (el.id === 'draft-resume-banner' && el.style.display === 'none') return false;
      return true;
    });

    targets.forEach(el => {
      el.classList.remove('gen-visible');
      el.classList.add('gen-reveal');
    });
    targets.forEach((el, i) => {
      setTimeout(() => el.classList.add('gen-visible'), 80 + i * 70);
    });
  }

  // 2. Skeleton loading ──────────────────────────────────────────────────────
  if (!reduced) {
    _genAddSkeleton(document.querySelector('#view-generator .gen-panel'), '#1a1a22', 1100);
    _genAddSkeleton(document.getElementById('resultPanel'), '#1a1a22', 1300);
  }

  // 3. Barre de crédits ─────────────────────────────────────────────────────
  const fill = document.getElementById('usageFill');
  if (fill) {
    const realW = fill.style.width || '0%';
    fill.style.transition = 'none';
    fill.style.width = '0%';
    void fill.offsetWidth; // force reflow
    setTimeout(() => {
      fill.style.transition = 'width 1.2s cubic-bezier(0.22,1,0.36,1)';
      fill.style.width = realW;
    }, 400);
  }

  // 4. Point pulsé bannière brouillon ───────────────────────────────────────
  const banner = document.getElementById('draft-resume-banner');
  if (banner && banner.style.display !== 'none') {
    if (!banner.querySelector('.draft-dot')) {
      const dot = document.createElement('span');
      dot.className = 'draft-dot';
      banner.insertBefore(dot, banner.firstChild);
    }
  }

  // 5. Spinner bouton ───────────────────────────────────────────────────────
  _genSetupBtn();
}

// ── Injection UI : breadcrumb + séparateurs + flèche bouton ──────────────────
function _genInjectUI() {
  // Séparateur après .gen-panel-title
  const panelTitle = document.querySelector('#view-generator .gen-panel .gen-panel-title');
  if (panelTitle && !panelTitle.nextElementSibling?.classList.contains('gen-sep')) {
    const sep = document.createElement('div');
    sep.className = 'gen-sep';
    panelTitle.after(sep);
  }

  // Séparateur footer avant #dashGenBtn
  const btn = document.getElementById('dashGenBtn');
  if (btn && !btn.previousElementSibling?.classList.contains('gen-sep-top')) {
    const sep = document.createElement('div');
    sep.className = 'gen-sep-top';
    btn.before(sep);
  }

  // Flèche dans le bouton
  if (btn && !btn.querySelector('.gen-btn-arrow')) {
    const text = btn.textContent.trim();
    btn.innerHTML = '<span class="gen-btn-text">' + text + '</span>'
      + '<span class="gen-btn-arrow">'
      + '<svg width="13" height="13" viewBox="0 0 13 13" fill="none">'
      + '<path d="M1 6.5h11M7.5 1.5l5 5-5 5"'
      + ' stroke="currentColor" stroke-width="1.8"'
      + ' stroke-linecap="round" stroke-linejoin="round"/>'
      + '</svg></span>';
  }

  // Forcer overflow visible pour les tooltips + séparateurs à débordement
  const panel = document.querySelector('#view-generator .gen-panel');
  if (panel) panel.style.overflow = 'visible';
}

// ── Skeleton overlay ──────────────────────────────────────────────────────────
function _genAddSkeleton(card, bgColor, revealDelay) {
  if (!card) return;
  const old = card.querySelector('.gen-skel-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.className = 'gen-skel-overlay';
  overlay.style.background = bgColor;
  overlay.innerHTML = '<div class="gen-skel-inner"></div>';
  card.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add('skel-out');
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 520);
  }, revealDelay);
}

// ── Spinner bouton Générer ────────────────────────────────────────────────────
function _genSetupBtn() {
  const btn = document.getElementById('dashGenBtn');
  if (!btn || btn._genAnimInited) return;
  btn._genAnimInited = true;

  btn.addEventListener('click', function() {
    if (btn.disabled || btn.classList.contains('gen-loading')) return;
    btn.classList.add('gen-loading');
    setTimeout(() => btn.classList.remove('gen-loading'), 2200);
  });
}

// ── Auto-init si la vue générateur est active au chargement ──────────────────
(function() {
  // Sur le nouveau HTML, pas d'auto-init (la nav est gérée par go())
  if (__IS_V2) return;
  function _tryAutoInit() {
    const view = document.getElementById('view-generator');
    if (view && view.classList.contains('active')) initGenAnimations();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tryAutoInit);
  } else {
    _tryAutoInit();
  }
})();
