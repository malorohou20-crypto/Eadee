/* ══════════════════════════════════════════════════════════════════
   82-ux-enhancements.js — UX animations v2
   Détecte automatiquement dashboard vs landing.
   Ne touche à AUCUNE logique métier.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IS_DASH = !!document.getElementById('topDrop');
  var IS_LAND = !IS_DASH;

  /* ── Utilitaires ───────────────────────────────────────────────── */
  function on(el, ev, fn, opts) {
    if (el) el.addEventListener(ev, fn, opts || false);
  }
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /* ── RIPPLE sur .btn (shared) ──────────────────────────────────── */
  ready(function () {
    on(document, 'click', function (e) {
      if (reduced) return;
      var btn = e.target.closest
        ? e.target.closest('.btn:not(.btn-ghost):not([disabled])')
        : null;
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.8;
      var x    = e.clientX - rect.left - size / 2;
      var y    = e.clientY - rect.top  - size / 2;
      var rip  = document.createElement('span');
      rip.className = 'ux-ripple';
      rip.style.cssText =
        'width:' + size + 'px;height:' + size + 'px;' +
        'left:' + x + 'px;top:' + y + 'px;';
      btn.appendChild(rip);
      on(rip, 'animationend', function () { rip.remove(); });
    }, true);
  });

  /* ══ MODULE DASHBOARD ══════════════════════════════════════════════ */
  if (IS_DASH) {

    /* 1. Credits bar — fill animée depuis 0 au chargement */
    ready(function () {
      if (reduced) return;
      var fill = qs('.credits-bar i');
      if (!fill) return;
      var realW = fill.style.width || '0%';
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;
      setTimeout(function () {
        fill.style.transition = '';
        fill.style.width = realW;
      }, 900);
    });

    /* 2. Topbar scroll shadow */
    ready(function () {
      var topbar = qs('.topbar');
      if (!topbar) return;
      var main = qs('.main') || qs('main');
      function tick() {
        var y = main ? main.scrollTop : window.scrollY;
        topbar.classList.toggle('ux-scrolled', y > 6);
      }
      on(main || window, 'scroll', tick, { passive: true });
      tick();
    });

    /* 3. History cards — stagger reveal */
    (function () {
      function stagger() {
        if (reduced) return;
        var cards = qsa('.conv:not(.ux-stagger)');
        cards.forEach(function (c, i) {
          c.classList.add('ux-stagger');
          setTimeout(function () { c.classList.add('ux-in'); }, 40 + i * 60);
        });
      }
      ready(function () {
        // Patch renderHistory si disponible
        function patch() {
          var orig = window.renderHistory;
          if (typeof orig !== 'function') return false;
          window.renderHistory = function () {
            orig.apply(this, arguments);
            setTimeout(stagger, 20);
          };
          return true;
        }
        if (!patch()) {
          // renderHistory pas encore défini — on attend
          var t = setInterval(function () {
            if (patch()) clearInterval(t);
          }, 100);
          setTimeout(function () { clearInterval(t); }, 4000);
        }
      });
    })();

    /* 4. Pack — spring au clic */
    ready(function () {
      on(document, 'click', function (e) {
        if (reduced) return;
        var pack = e.target.closest('.pack');
        if (!pack) return;
        pack.classList.remove('ux-clicked');
        void pack.offsetWidth;
        pack.classList.add('ux-clicked');
        on(pack, 'animationend', function h() {
          pack.classList.remove('ux-clicked');
          pack.removeEventListener('animationend', h);
        });
      });
    });

    /* 5. Gen button — classe gen-loading au clic, retrait auto */
    ready(function () {
      var btn = document.getElementById('dashGenBtn');
      if (!btn) return;
      on(btn, 'click', function () {
        if (btn.disabled) return;
        btn.classList.add('gen-loading');
        // Le plan existant retire disabled → on surveille
        var obs = new MutationObserver(function () {
          if (!btn.disabled && !btn.classList.contains('generating')) {
            btn.classList.remove('gen-loading');
            obs.disconnect();
          }
        });
        obs.observe(btn, { attributes: true, attributeFilter: ['disabled', 'class'] });
        // Sécurité: retire après 45s max
        setTimeout(function () {
          btn.classList.remove('gen-loading');
          obs.disconnect();
        }, 45000);
      });
    });

    /* 6. Form-group focus class (pour effets CSS sur le groupe parent) */
    ready(function () {
      qsa('.form-group input, .form-group textarea, .form-group select').forEach(function (el) {
        on(el, 'focus', function () {
          el.closest('.form-group').classList.add('ux-focused');
        });
        on(el, 'blur', function () {
          el.closest('.form-group').classList.remove('ux-focused');
        });
      });
    });

  } /* END IS_DASH */


  /* ══ MODULE LANDING ════════════════════════════════════════════════ */
  if (IS_LAND) {

    /* 7. Topbar scroll shadow */
    (function () {
      var topbar = qs('.topbar');
      if (!topbar) return;
      function tick() {
        topbar.classList.toggle('ux-scrolled', window.scrollY > 24);
      }
      on(window, 'scroll', tick, { passive: true });
      tick();
    })();

    /* 8. Scroll-reveals — ajoute .reveal sur les éléments clés */
    ready(function () {
      if (reduced) return;

      /* Groupes à révéler avec leurs paramètres */
      var groups = [
        { sel: '.section-head .eyebrow',   delay: 0,    cls: '' },
        { sel: '.section-head h2',          delay: 0.07, cls: '' },
        { sel: '.section-lead',             delay: 0.14, cls: '' },
        { sel: '.step',                     stagger: 0.08, cls: '' },
        { sel: '.feature-text .eyebrow',    delay: 0,    cls: 'reveal-left' },
        { sel: '.feature-text h2',          delay: 0.07, cls: 'reveal-left' },
        { sel: '.feature-visual',           delay: 0.10, cls: 'reveal-right' },
        { sel: '.feature.reverse .feature-text .eyebrow', delay: 0,    cls: 'reveal-right' },
        { sel: '.feature.reverse .feature-text h2',       delay: 0.07, cls: 'reveal-right' },
        { sel: '.feature.reverse .feature-visual',        delay: 0.10, cls: 'reveal-left' },
        { sel: '.testim',                   stagger: 0.06, cls: '' },
        { sel: '.price',                    stagger: 0.06, cls: 'reveal-scale' },
        { sel: '.toc-item',                 stagger: 0.03, cls: '' },
        { sel: '.price-foot',               delay: 0.08, cls: '' },
        { sel: '.trans-col',                stagger: 0.08, cls: '' },
      ];

      var all = [];
      groups.forEach(function (g) {
        qsa(g.sel).forEach(function (el, i) {
          if (el.classList.contains('reveal') || el.classList.contains('reveal-scale')) return;
          var clsToAdd = g.cls === 'reveal-scale' ? 'reveal-scale' : 'reveal';
          el.classList.add(clsToAdd);
          if (g.cls && g.cls !== 'reveal-scale') el.classList.add(g.cls);
          var d = g.stagger !== undefined
            ? g.stagger * i
            : (g.delay || 0);
          el.style.transitionDelay = d + 's';
          all.push(el);
        });
      });

      if (!all.length) return;

      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      all.forEach(function (el) { obs.observe(el); });
    });

    /* 9. Stats counter — count-up au scroll */
    ready(function () {
      if (reduced) return;
      var nums = qsa('[data-count], .stat-big, .score-big');
      if (!nums.length) return;

      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          obs.unobserve(el);
          if (el._uxCounted) return;
          el._uxCounted = true;

          var raw     = el.getAttribute('data-count') || el.textContent;
          var numRaw  = parseFloat(raw.replace(/[^\d.]/g, '')) || 0;
          var isInt   = numRaw === Math.floor(numRaw);
          var suffix  = raw.replace(/[\d.,]/g, '').replace(/^\s+|\s+$/g, '');
          var dur     = 1100;
          var start   = performance.now();

          (function tick(now) {
            var p = Math.min((now - start) / dur, 1);
            var e = 1 - Math.pow(1 - p, 3); // ease-out cubic
            var v = numRaw * e;
            el.textContent = (isInt ? Math.round(v) : v.toFixed(1)) + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = (isInt ? numRaw : numRaw.toFixed(1)) + suffix;
          }(start));
        });
      }, { threshold: 0.6 });

      nums.forEach(function (el) { obs.observe(el); });
    });

    /* 10. Smooth scroll pour liens internes #hash */
    ready(function () {
      on(document, 'click', function (e) {
        var link = e.target.closest('a[href^="#"]');
        if (!link) return;
        var id = link.getAttribute('href').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

  } /* END IS_LAND */

})();
