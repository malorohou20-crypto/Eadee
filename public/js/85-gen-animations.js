// ========== GENERATOR PAGE ANIMATIONS ==========

// ── Entrée publique : appelée depuis showView('generator') ──────────────────
function initGenAnimations() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Staggered reveal ────────────────────────────────────────────────────
  if (!reduced) {
    const targets = [
      document.querySelector('#page-dashboard .sidebar'),
      document.querySelector('#view-generator .view-header'),
      document.getElementById('draft-resume-banner'),
      document.querySelector('.gen-panel'),
      document.getElementById('resultPanel'),
    ].filter(el => {
      if (!el) return false;
      if (el.id === 'draft-resume-banner' && el.style.display === 'none') return false;
      return true;
    });

    // Reset état précédent puis échelonnement
    targets.forEach(el => {
      el.classList.remove('gen-visible');
      el.classList.add('gen-reveal');
    });
    targets.forEach((el, i) => {
      setTimeout(() => el.classList.add('gen-visible'), 80 + i * 70);
    });
  }

  // 2. Skeleton loading ────────────────────────────────────────────────────
  if (!reduced) {
    _genAddSkeleton(document.querySelector('.gen-panel'),     '#1a1d26', 1100);
    _genAddSkeleton(document.getElementById('resultPanel'),   '#0a0a0a', 1300);
  }

  // 3. Barre de crédits ────────────────────────────────────────────────────
  const fill = document.getElementById('usageFill');
  if (fill) {
    const realW = fill.style.width || '0%';
    fill.style.transition = 'none';
    fill.style.width = '0%';
    // Force reflow
    void fill.offsetWidth;
    setTimeout(() => {
      fill.style.transition = 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      fill.style.width = realW;
    }, 400);
  }

  // 4. Bannière brouillon — point pulsé ─────────────────────────────────────
  const banner = document.getElementById('draft-resume-banner');
  if (banner && banner.style.display !== 'none') {
    if (!banner.querySelector('.draft-dot')) {
      const dot = document.createElement('span');
      dot.className = 'draft-dot';
      banner.insertBefore(dot, banner.firstChild);
    }
  }

  // 5. Bouton générer — spinner ──────────────────────────────────────────────
  _genSetupBtn();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function _genAddSkeleton(card, bgColor, revealDelay) {
  if (!card) return;
  // Retire un éventuel skeleton précédent immédiatement
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

function _genSetupBtn() {
  const btn = document.getElementById('dashGenBtn');
  if (!btn || btn._genAnimInited) return;
  btn._genAnimInited = true;

  btn.addEventListener('click', function genBtnClick() {
    if (btn.disabled || btn.classList.contains('gen-loading')) return;
    btn.classList.add('gen-loading');
    setTimeout(() => btn.classList.remove('gen-loading'), 2000);
  });
}

// ── Init automatique si le générateur est déjà actif au chargement ──────────
(function() {
  function _tryAutoInit() {
    const view = document.getElementById('view-generator');
    if (view && view.classList.contains('active')) {
      initGenAnimations();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tryAutoInit);
  } else {
    _tryAutoInit();
  }
})();
