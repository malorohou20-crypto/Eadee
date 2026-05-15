// ========== EADEE — Landing Page Animations v1 ==========
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Compteur générique ────────────────────────────────────────────────────────
  function animateCount(el, target, duration, formatter) {
    if (!el) return;
    duration = duration || 800;
    formatter = formatter || function (v) { return Math.round(v).toLocaleString('fr-FR'); };
    var start = performance.now();
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      el.textContent = formatter(ease * target);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── IntersectionObserver générique (once) ─────────────────────────────────────
  var _scrollObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        _scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function observe(selector, callback, threshold) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          callback(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: threshold || 0.15 });
    document.querySelectorAll(selector).forEach(function (el) {
      obs.observe(el);
    });
    return obs;
  }

  function addDelay(el, ms) {
    el.style.transitionDelay = ms + 'ms';
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  1. NAVBAR — scroll effect
  // ════════════════════════════════════════════════════════════════════════════════
  function initNavScroll() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    function onScroll() {
      if (window.scrollY > 40) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Wrap arrow in .btn-dark for translateX hover
    var btnDark = nav.querySelector('.btn-dark');
    if (btnDark && !btnDark.querySelector('.la-arrow')) {
      var text = btnDark.textContent;
      var arrowIdx = text.lastIndexOf('→');
      if (arrowIdx !== -1) {
        var before = text.slice(0, arrowIdx);
        var btnHTML = before + '<span class="la-arrow">→</span>';
        btnDark.innerHTML = btnHTML;
      }
    }

    // Wrap arrow in hero-link
    var heroLinks = document.querySelectorAll('.hero-link');
    heroLinks.forEach(function (link) {
      if (!link.querySelector('.la-arrow')) {
        var t = link.textContent;
        var ai = t.lastIndexOf('→');
        if (ai !== -1) {
          link.innerHTML = t.slice(0, ai) + '<span class="la-arrow">→</span>';
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  2. HERO — entrées séquentielles
  // ════════════════════════════════════════════════════════════════════════════════
  function initHeroAnimations() {
    if (reduced) return;

    // Badge
    var badge = document.querySelector('.hero-pill-badge');
    if (badge) {
      badge.classList.add('la-badge-enter');
      setTimeout(function () { badge.classList.add('la-visible'); }, 100);
    }

    // H1 — split par mots
    var h1 = document.querySelector('.hero-h1');
    if (h1) _splitAndAnimateH1(h1);

    // Sous-titre
    var sub = document.querySelector('.hero-sub');
    if (sub) {
      sub.classList.add('la-sub-enter');
      // Délai : 200ms base + nbMots*40 + 600ms
      var wordCount = h1 ? h1.querySelectorAll('.hero-word').length : 5;
      var subDelay = 200 + wordCount * 40 + 600;
      setTimeout(function () { sub.classList.add('la-visible'); }, subDelay);
    }

    // CTAs
    var actions = document.querySelector('.hero-actions');
    if (actions) {
      var ctaDelay = (h1 ? 200 + h1.querySelectorAll('.hero-word').length * 40 + 600 : 800) + 300;
      actions.classList.add('la-cta-enter');
      setTimeout(function () { actions.classList.add('la-visible'); }, ctaDelay);
    }

    // Bloc avatars + texte (el suivant après hero-actions)
    var avatarRow = document.querySelector('.hero-photo-content > div[style*="display:flex"]');
    if (avatarRow) {
      avatarRow.classList.add('la-avatars-enter');
      var avDelay = (h1 ? 200 + h1.querySelectorAll('.hero-word').length * 40 + 600 : 800) + 500;
      setTimeout(function () {
        avatarRow.classList.add('la-visible');
        // Stagger des avatars individuels
        avatarRow.querySelectorAll('.h-av').forEach(function (av, i) {
          setTimeout(function () { av.classList.add('av-visible'); }, i * 60);
        });
      }, avDelay);
    }

    // Trust items
    var trust = document.querySelector('.hero-trust');
    if (trust) {
      trust.classList.add('la-trust-enter');
      var trustDelay = (h1 ? 200 + h1.querySelectorAll('.hero-word').length * 40 + 600 : 800) + 700;
      setTimeout(function () { trust.classList.add('la-visible'); }, trustDelay);
    }
  }

  function _splitAndAnimateH1(h1) {
    if (h1.dataset.wSplit) return;
    h1.dataset.wSplit = '1';

    var nodes = Array.from(h1.childNodes);
    h1.innerHTML = '';

    nodes.forEach(function (node) {
      if (node.nodeType === 3) { // texte brut
        var words = node.textContent.split(' ');
        words.forEach(function (w, i) {
          if (!w.trim()) {
            if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
            return;
          }
          var span = document.createElement('span');
          span.className = 'hero-word';
          span.textContent = w;
          h1.appendChild(span);
          if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
        });
      } else if (node.nodeName === 'BR') {
        h1.appendChild(document.createElement('br'));
      } else {
        // .hero-grad ou autre span — une seule unité
        node.classList && node.classList.add('hero-word');
        h1.appendChild(node);
      }
    });

    // Animer chaque mot
    var wordEls = h1.querySelectorAll('.hero-word');
    wordEls.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('hw-visible'); }, 200 + i * 40);
    });
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  3. SECTION PROCESS (how)
  // ════════════════════════════════════════════════════════════════════════════════
  function initHowSection() {
    var howSection = document.getElementById('howSection');
    if (!howSection) return;

    // H2
    var h2 = howSection.querySelector('.how-h2');
    if (h2) {
      h2.classList.add('animate-on-scroll');
      _scrollObserver.observe(h2);
    }

    // Cards stagger
    var cards = Array.from(howSection.querySelectorAll('.how-card'));
    cards.forEach(function (card, i) {
      card.classList.add('la-how-card');
      addDelay(card, i * 150);
    });

    var howObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Reveal cards
        cards.forEach(function (card) { card.classList.add('hc-visible'); });
        // Animate numbers 01→03
        if (!reduced) {
          cards.forEach(function (card, i) {
            var numEl = card.querySelector('.how-num');
            if (!numEl) return;
            var target = i + 1;
            setTimeout(function () {
              var s = performance.now();
              ;(function tick(now) {
                var t = Math.min((now - s) / 400, 1);
                var v = Math.round(t * target);
                numEl.textContent = (v < 10 ? '0' : '') + v;
                if (t < 1) requestAnimationFrame(tick);
              })(performance.now());
            }, i * 150);
          });
        }
        howObs.disconnect();
      });
    }, { threshold: 0.2 });
    howObs.observe(howSection);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  4. TR-SECTIONS — score, projections, chat
  // ════════════════════════════════════════════════════════════════════════════════
  function initTrSections() {
    // Section 1 — Score viabilité 87/100
    var sec1 = document.querySelector('.tr-section:first-child');
    _initScoreSection(sec1, 87, 87);

    // Section 2 — Projections (big 185 000, stats)
    var sec2 = document.querySelector('.tr-section-rev');
    _initProjectionsSection(sec2);

    // Section 3 — Chat
    var sec3 = document.getElementById('tr-section-3');
    _initChatSection(sec3);

    // Section 4 — Bancabilité 78/100
    var secs = document.querySelectorAll('.tr-section');
    if (secs.length >= 4) _initScoreSection(secs[3], 78, 78);

    // H2 de chaque section tr-text
    document.querySelectorAll('.tr-h2').forEach(function (h2) {
      h2.classList.add('animate-on-scroll');
      _scrollObserver.observe(h2);
    });
  }

  function _initScoreSection(section, scoreTarget, barPercent) {
    if (!section) return;

    // Score bar : démarrer à 0 dans le DOM
    var barFill = section.querySelector('.tr-score-bar-fill');
    if (barFill && !reduced) {
      barFill.style.width = '0%';
    }

    // Score big number
    var scoreBig = section.querySelector('.tr-score-big');
    var sub = scoreBig ? scoreBig.querySelector('sub') : null;
    var scoreTextNode = null;
    if (scoreBig) {
      // Trouver le text node avec le chiffre
      Array.from(scoreBig.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.textContent.trim()) scoreTextNode = n;
      });
    }

    // Stats stagger
    var stats = section.querySelectorAll('.tr-score-stat');
    stats.forEach(function (s) { s.classList.add('la-score-stat'); });

    // Texte et bullets en animate-on-scroll
    section.querySelectorAll('.tr-bullet-title, .tr-p').forEach(function (el, i) {
      el.classList.add('animate-on-scroll');
      addDelay(el, i * 80);
      _scrollObserver.observe(el);
    });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Animate bar
        if (barFill && !reduced) {
          setTimeout(function () {
            barFill.style.width = barPercent + '%';
          }, 200);
        }
        // Animate score number
        if (scoreTextNode && !reduced) {
          setTimeout(function () {
            var s2 = performance.now();
            ;(function tick(now) {
              var t = Math.min((now - s2) / 800, 1);
              var ease = 1 - Math.pow(1 - t, 3);
              scoreTextNode.textContent = Math.round(ease * scoreTarget);
              if (t < 1) requestAnimationFrame(tick);
            })(performance.now());
          }, 150);
        }
        // Stats stagger
        stats.forEach(function (s, i) {
          setTimeout(function () { s.classList.add('ss-visible'); }, 300 + i * 100);
        });
        obs.disconnect();
      });
    }, { threshold: 0.2 });
    obs.observe(section);
  }

  function _initProjectionsSection(section) {
    if (!section) return;

    // Big total "185 000€"
    var bigEl = section.querySelector('[style*="Bebas Neue"][style*="30px"]');

    // Stats 3 badges
    var badges = section.querySelectorAll('[style*="border-radius:10px"]');
    badges.forEach(function (b) { b.classList.add('la-score-stat'); });

    section.querySelectorAll('.tr-bullet-title, .tr-p').forEach(function (el, i) {
      el.classList.add('animate-on-scroll');
      addDelay(el, i * 80);
      _scrollObserver.observe(el);
    });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Animate big total
        if (bigEl && !reduced) {
          var textNode = null;
          Array.from(bigEl.childNodes).forEach(function (n) {
            if (n.nodeType === 3 && n.textContent.trim()) textNode = n;
          });
          if (textNode) {
            setTimeout(function () {
              animateCount(
                { set textContent(v) { textNode.textContent = v + '€ '; } },
                185000, 900,
                function (v) { return Math.round(v).toLocaleString('fr-FR'); }
              );
            }, 100);
          }
        }
        // Badges stagger
        badges.forEach(function (b, i) {
          setTimeout(function () { b.classList.add('ss-visible'); }, 200 + i * 100);
        });
        obs.disconnect();
      });
    }, { threshold: 0.2 });
    obs.observe(section);
  }

  function _initChatSection(section) {
    if (!section) return;

    var msgs = Array.from(section.querySelectorAll('.tr-chat-bot, .tr-chat-user-msg'));
    msgs.forEach(function (m) { m.classList.add('la-msg'); });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (!reduced) {
          msgs.forEach(function (m, i) {
            setTimeout(function () { m.classList.add('msg-visible'); }, i * 150);
          });
        }
        obs.disconnect();
      });
    }, { threshold: 0.25 });
    obs.observe(section);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  5. TÉMOIGNAGES
  // ════════════════════════════════════════════════════════════════════════════════
  function initTestimonials() {
    var section = document.querySelector('.testi-section');
    if (!section) return;

    var h2 = section.querySelector('.testi-h2');
    if (h2) {
      h2.classList.add('animate-on-scroll');
      _scrollObserver.observe(h2);
    }

    var cards = Array.from(section.querySelectorAll('.testi-card'));
    cards.forEach(function (card) { card.classList.add('la-testi-card'); });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cards.forEach(function (card, i) {
          addDelay(card, i * 120);
          setTimeout(function () { card.classList.add('tc-visible'); }, i * 120);
        });
        // Animate scores in testi-meta (ex: "Score 91/100")
        if (!reduced) {
          cards.forEach(function (card, ci) {
            var metaEl = card.querySelector('.testi-meta');
            if (!metaEl) return;
            var match = metaEl.textContent.match(/Score (\d+)\/100/);
            if (!match) return;
            var target = parseInt(match[1], 10);
            setTimeout(function () {
              var orig = metaEl.textContent;
              var s = performance.now();
              ;(function tick(now) {
                var t = Math.min((now - s) / 700, 1);
                var ease = 1 - Math.pow(1 - t, 3);
                var val = Math.round(ease * target);
                metaEl.textContent = orig.replace(/Score \d+\/100/, 'Score ' + val + '/100');
                if (t < 1) requestAnimationFrame(tick);
              })(performance.now());
            }, ci * 120 + 200);
          });
        }
        obs.disconnect();
      });
    }, { threshold: 0.15 });
    obs.observe(section);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  6. PRICING
  // ════════════════════════════════════════════════════════════════════════════════
  function initPricing() {
    var section = document.querySelector('.pricing-wrap');
    if (!section) return;

    var h2 = section.querySelector('.section-h2');
    if (h2) {
      h2.classList.add('animate-on-scroll');
      _scrollObserver.observe(h2);
    }

    var cards = Array.from(section.querySelectorAll('.price-card'));
    cards.forEach(function (card) { card.classList.add('la-price-card'); });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cards.forEach(function (card, i) {
          setTimeout(function () { card.classList.add('pc-visible'); }, i * 150);
        });
        obs.disconnect();
      });
    }, { threshold: 0.1 });
    obs.observe(section);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  7. FAQ
  // ════════════════════════════════════════════════════════════════════════════════
  function initFaq() {
    var section = document.querySelector('.faq-section');
    if (!section) return;

    var h2 = section.querySelector('.faq-h2');
    if (h2) {
      h2.classList.add('animate-on-scroll');
      _scrollObserver.observe(h2);
    }

    var items = Array.from(section.querySelectorAll('.faq-item'));
    items.forEach(function (item) { item.classList.add('la-faq-item'); });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        items.forEach(function (item, i) {
          setTimeout(function () { item.classList.add('fi-visible'); }, i * 60);
        });
        obs.disconnect();
      });
    }, { threshold: 0.08 });
    obs.observe(section);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  8. SECTIONS GRID — h2 + sous-titre
  // ════════════════════════════════════════════════════════════════════════════════
  function initSectionsGridAnim() {
    var section = document.querySelector('.sections-grid-section');
    if (!section) return;

    var h2  = section.querySelector('.section-h2');
    var sub = section.querySelector('.sections-grid-sub');
    if (h2)  { h2.classList.add('animate-on-scroll');  _scrollObserver.observe(h2); }
    if (sub) { sub.classList.add('animate-on-scroll'); addDelay(sub, 100); _scrollObserver.observe(sub); }
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  9. SECTIONS DIVERSES — animate-on-scroll sur H2 génériques
  // ════════════════════════════════════════════════════════════════════════════════
  function initMiscSections() {
    // Transparence, etc
    document.querySelectorAll('.fade-up').forEach(function (el) {
      el.classList.add('animate-on-scroll');
      _scrollObserver.observe(el);
    });
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  BOOT — attend le landing page actif
  // ════════════════════════════════════════════════════════════════════════════════
  function boot() {
    // Vérifier qu'on est sur la landing
    var landing = document.getElementById('page-landing');
    if (!landing) return;

    initNavScroll();
    initHeroAnimations();
    initHowSection();
    initTrSections();
    initTestimonials();
    initPricing();
    initFaq();
    initSectionsGridAnim();
    initMiscSections();

    // Observer générique pour tous les .animate-on-scroll
    document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
      _scrollObserver.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
