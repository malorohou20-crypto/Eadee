/* ══════════════════════════════════════════════════════════════════
   82-ux-enhancements.js — Comprehensive UX Enhancements v1
   Animations, interactions, micro-effects — ne touche pas à la logique
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Landing Nav Dropdown — smooth via MutationObserver ─────── */
  // La landing utilise style.display toggle → on ajoute classe .open pour animation CSS
  (function patchLandingDropdown() {
    document.addEventListener('DOMContentLoaded', function () {
      var drop = document.getElementById('nav-dropdown');
      if (!drop) return;
      var obs = new MutationObserver(function () {
        var isVisible = drop.style.display !== 'none' && drop.style.display !== '';
        drop.classList.toggle('open', isVisible);
      });
      obs.observe(drop, { attributes: true, attributeFilter: ['style'] });
    });
  })();

  /* ── 3. Pack Selection Spring ────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.pack').forEach(function (pack) {
      pack.addEventListener('click', function () {
        if (reduced) return;
        pack.classList.remove('pack-clicked');
        void pack.offsetWidth; // reflow
        pack.classList.add('pack-clicked');
        pack.addEventListener('animationend', function handler() {
          pack.classList.remove('pack-clicked');
          pack.removeEventListener('animationend', handler);
        });
      });
    });
  });

  /* ── 4. Button Ripple Effect ─────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
      if (reduced) return;
      var btn = e.target.closest('.btn:not(.btn-ghost), #dashGenBtn, #payBtn');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.4;
      var x = e.clientX - rect.left - size / 2;
      var y = e.clientY - rect.top  - size / 2;
      var ripple = document.createElement('span');
      ripple.className = 'ux-ripple';
      ripple.style.cssText = [
        'width:'  + size + 'px',
        'height:' + size + 'px',
        'left:'   + x + 'px',
        'top:'    + y + 'px',
      ].join(';');
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); });
    }, true);
  });

  /* ── 5. Credits Bar Animated Fill ───────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.credits-bar i');
    if (!bar) return;
    if (reduced) return;
    var realW = bar.style.width || '0%';
    bar.closest('.credits-bar').classList.add('credits-bar--init');
    bar.style.width = '0%';
    setTimeout(function () {
      bar.closest('.credits-bar').classList.remove('credits-bar--init');
      bar.style.width = realW;
    }, 700); // after splash
  });

  /* ── 6. Topbar Scroll Shadow (dashboard) ────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var topbar = document.querySelector('.dash-topbar');
    if (!topbar) return;
    var main = document.querySelector('.dash-main, main');
    var target = main || window;

    function onScroll() {
      var scrollY = (main ? main.scrollTop : window.scrollY) || 0;
      topbar.classList.toggle('scrolled', scrollY > 8);
    }
    (main || window).addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });

  /* ── 7. Staggered History Cards ──────────────────────────────────── */
  // Hook on renderHistory completion
  (function patchHistory() {
    document.addEventListener('DOMContentLoaded', function () {
      var origRender = window.renderHistory;
      if (typeof origRender !== 'function') {
        // renderHistory may be loaded later (deferred), watch for it
        Object.defineProperty(window, 'renderHistory', {
          configurable: true,
          set: function (fn) {
            this._renderHistory = fn;
          },
          get: function () {
            return this._renderHistory ? function () {
              this._renderHistory.apply(this, arguments);
              staggerCards();
            }.bind(this) : undefined;
          }
        });
        return;
      }
      window.renderHistory = function () {
        origRender.apply(this, arguments);
        staggerCards();
      };
    });

    function staggerCards() {
      if (reduced) return;
      var cards = document.querySelectorAll('.conv:not(.ux-stagger)');
      cards.forEach(function (card, i) {
        card.classList.add('ux-stagger');
        setTimeout(function () {
          card.classList.add('ux-visible');
        }, 40 + i * 55);
      });
    }
  })();

  /* ── 8. Landing Topbar Scroll Shadow ────────────────────────────── */
  (function landingNav() {
    var topbar = document.querySelector('.topbar, header.topbar, nav.topbar');
    if (!topbar) return;
    function onScroll() {
      topbar.classList.toggle('scrolled', window.scrollY > 24);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ── 9. Landing Stats Counter Animation ──────────────────────────── */
  (function statsCounter() {
    if (reduced) return;
    document.addEventListener('DOMContentLoaded', function () {
      var statNums = document.querySelectorAll('.stat-num, .stats-num, [data-count]');
      if (!statNums.length) return;

      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          obs.unobserve(el);
          var raw = el.getAttribute('data-count') || el.textContent.replace(/[^\d.]/g, '');
          var target = parseFloat(raw) || 0;
          var isInt = target === Math.floor(target);
          var suffix = el.getAttribute('data-suffix') || el.textContent.replace(/[\d.]/g, '').trim();
          var prefix = el.getAttribute('data-prefix') || '';
          var duration = 1200;
          var start = performance.now();
          var from = 0;

          function tick(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            var eased = 1 - Math.pow(1 - progress, 3);
            var value = from + (target - from) * eased;
            el.textContent = prefix + (isInt ? Math.round(value) : value.toFixed(1)) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
            else {
              el.textContent = prefix + (isInt ? target : target.toFixed(1)) + suffix;
              el.classList.add('ux-counted');
            }
          }
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.5 });

      statNums.forEach(function (el) { obs.observe(el); });
    });
  })();

  /* ── 10. Screen Transition Hook ─────────────────────────────────── */
  // Inject screenIn keyframe override if needed
  (function ensureScreenKeyframes() {
    if (document.getElementById('ux-screen-kf')) return;
    var style = document.createElement('style');
    style.id = 'ux-screen-kf';
    style.textContent = [
      '@keyframes screenIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes screenOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-6px)}}',
    ].join('');
    document.head.appendChild(style);
  })();

  /* ── 11. View Switch — trigger credits bar refill ────────────────── */
  (function watchViewSwitch() {
    var origGo = window.go;
    document.addEventListener('DOMContentLoaded', function () {
      // Override go() to animate credits bar on each switch to gen view
      var patchFn = function (name) {
        if (name === 'gen' || name === 'generator') {
          setTimeout(function () {
            var bar = document.querySelector('.credits-bar i');
            if (!bar || reduced) return;
            var w = bar.style.width;
            bar.style.transition = 'none';
            bar.style.width = '0%';
            void bar.offsetWidth;
            bar.style.transition = '';
            bar.style.width = w;
          }, 120);
        }
      };
      if (typeof window.go === 'function') {
        var orig = window.go;
        window.go = function (name) {
          patchFn(name);
          return orig.apply(this, arguments);
        };
      }
    });
  })();

  /* ── 12. Input placeholder shimmer on focus ──────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(function (el) {
      el.addEventListener('focus', function () {
        el.closest('.form-group') && el.closest('.form-group').classList.add('focused');
      });
      el.addEventListener('blur', function () {
        el.closest('.form-group') && el.closest('.form-group').classList.remove('focused');
      });
    });
  });

  /* ── 13. Landing: Smooth scroll for anchor CTAs ──────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });

  /* ── 14. Landing: Price card selection feedback ───────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.price-card, .pack').forEach(function (card) {
      card.addEventListener('click', function () {
        if (reduced) return;
        card.style.transition = 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)';
        card.style.transform = 'scale(0.98)';
        setTimeout(function () {
          card.style.transform = '';
          setTimeout(function () { card.style.transition = ''; }, 300);
        }, 120);
      });
    });
  });

  /* ── 15. Copy / Save button success flash ────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.plan-actions .btn, [onclick*="copyPlan"], [onclick*="savePlan"]');
      if (!btn) return;
      setTimeout(function () {
        btn.classList.add('ux-success');
        btn.addEventListener('animationend', function handler() {
          btn.classList.remove('ux-success');
          btn.removeEventListener('animationend', handler);
        });
      }, 50);
    });
  });

  /* ── 16. Sidebar link keyboard shortcut hints on hover ───────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.side-link').forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        var kbd = link.querySelector('.kbd');
        if (kbd) kbd.style.opacity = '1';
      });
      link.addEventListener('mouseleave', function () {
        var kbd = link.querySelector('.kbd');
        if (kbd && !link.classList.contains('active')) kbd.style.opacity = '0';
      });
    });
  });

})();
