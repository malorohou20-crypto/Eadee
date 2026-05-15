// ========== SECONDARY PAGES ANIMATIONS v1 ==========
(function () {
  'use strict';

  var _navTimer  = null;
  var _observers = {}; // MutationObservers per view

  // ── Wrap showView ────────────────────────────────────────────────────────────
  var _origShowView = window.showView;

  window.showView = function (name) {
    var reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current  = document.querySelector('.dash-view.active');
    var next     = document.getElementById('view-' + name);

    if (!reduced && current && next && current !== next) {
      // Cancel any in-flight transition immediately
      if (_navTimer) {
        clearTimeout(_navTimer);
        _navTimer = null;
        if (current) current.classList.remove('page-exiting');
        _origShowView(name);
        _onViewShown(name, reduced);
        return;
      }
      current.classList.add('page-exiting');
      _navTimer = setTimeout(function () {
        _navTimer = null;
        if (current) current.classList.remove('page-exiting');
        _origShowView(name);
        _onViewShown(name, reduced);
      }, 180);
    } else {
      _origShowView(name);
      _onViewShown(name, reduced);
    }
  };

  // ── Dispatch per view ────────────────────────────────────────────────────────
  function _onViewShown(name, reduced) {
    // Slight delay so DOM is settled after _origShowView
    requestAnimationFrame(function () {
      switch (name) {
        case 'history':     _initHistory(reduced);     break;
        case 'billing':     _initBilling(reduced);     break;
        case 'settings':    _initSettings(reduced);    break;
        case 'chat':        _initChat(reduced);        break;
        case 'inspiration': _initInspiration(reduced); break;
        case 'help':        _initHelp(reduced);        break;
        case 'referral':    _initReferral(reduced);    break;
      }
    });
  }

  // ── Generic stagger helper ───────────────────────────────────────────────────
  function _stagger(els, baseDelay, step, useScale) {
    els.forEach(function (el, i) {
      el.classList.remove('sv-visible');
      el.classList.add(useScale ? 'sv-scale' : 'sv');
      setTimeout(function () {
        el.classList.add('sv-visible');
      }, baseDelay + i * step);
    });
  }

  // ── Animate count (rAF ease-out-cubic) ──────────────────────────────────────
  function _animateCount(el, target, duration) {
    if (!el) return;
    var start = performance.now();
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      // ease-out-cubic
      var ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * ease);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  HISTORY — Mes plans
  // ══════════════════════════════════════════════════════════════════════════════
  function _initHistory(reduced) {
    var view = document.getElementById('view-history');
    if (!view) return;

    var header = view.querySelector('.view-header');
    var grid   = document.getElementById('historyGrid');
    var cards  = grid ? Array.from(grid.querySelectorAll('.history-card')) : [];
    var empty  = grid ? grid.querySelector('.history-empty-float') : null;

    if (reduced) return;

    // Stagger header
    if (header) _stagger([header], 40, 0, false);

    if (cards.length) {
      // Stagger each card
      _stagger(cards, 100, 60, false);
    }

    // Empty state float is handled by CSS keyframe — just ensure class is present
    if (empty) empty.classList.add('history-empty-float');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  BILLING — Crédits
  // ══════════════════════════════════════════════════════════════════════════════
  function _initBilling(reduced) {
    var view = document.getElementById('view-billing');
    if (!view) return;

    var header  = view.querySelector('.view-header');
    var options = Array.from(view.querySelectorAll('.pay-plan-option'));
    var form    = view.querySelector('.stripe-form');
    var summary = view.querySelector('.order-summary');

    if (reduced) return;

    var items = [];
    if (header)  items.push(header);
    options.forEach(function (o) { items.push(o); });
    if (form)    items.push(form);
    if (summary) items.push(summary);

    _stagger(items, 60, 70, false);

    // Animate sidebar credits bar (shared widget)
    var fill = document.getElementById('usageFill');
    if (fill) {
      var realW = fill.style.width || '0%';
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;
      setTimeout(function () {
        fill.style.transition = 'width 1.2s cubic-bezier(0.22,1,0.36,1)';
        fill.style.width = realW;
      }, 500);
    }

    // Animate credit count number in sidebar
    var usageCount = document.getElementById('usageCount');
    if (usageCount) {
      var target = parseInt(usageCount.textContent, 10) || 0;
      if (target > 0) {
        usageCount.textContent = '0';
        setTimeout(function () { _animateCount(usageCount, target, 900); }, 400);
      }
    }

    // Pay button loading state (wired here so hover CSS works from 87-pages-anim.css)
    _setupPayBtn(view);
  }

  function _setupPayBtn(view) {
    var btn = view ? view.querySelector('.pay-submit') : null;
    if (!btn || btn._pagesAnimInited) return;
    btn._pagesAnimInited = true;
    btn.addEventListener('click', function () {
      if (btn.disabled || btn.classList.contains('pay-loading')) return;
      btn.classList.add('pay-loading');
      // processPayment() handles real result; we just show spinner for 3s max
      setTimeout(function () { btn.classList.remove('pay-loading'); }, 3000);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  SETTINGS — Paramètres
  // ══════════════════════════════════════════════════════════════════════════════
  function _initSettings(reduced) {
    var view = document.getElementById('view-settings');
    if (!view) return;

    var header = view.querySelector('.view-header');
    var panels = Array.from(view.querySelectorAll('.gen-panel'));

    // Style danger zone
    panels.forEach(function (p) {
      var style = p.getAttribute('style') || '';
      if (style.indexOf('239,68,68') !== -1) {
        p.classList.add('settings-danger-zone');
      }
    });

    if (reduced) return;

    var items = [];
    if (header) items.push(header);
    panels.forEach(function (p) { items.push(p); });
    _stagger(items, 60, 80, false);

    // Wire save buttons
    var saveBtns = Array.from(view.querySelectorAll('.gen-btn'));
    saveBtns.forEach(function (btn) {
      if (btn._settingsAnimInited) return;
      btn._settingsAnimInited = true;
      btn.addEventListener('click', function () {
        if (btn.classList.contains('btn-saving') || btn.classList.contains('btn-saved')) return;
        btn.classList.add('btn-saving');
        // saveSettings() is the real handler — we watch for it to finish
        // Fallback: show success after 1.5s if still saving
        setTimeout(function () {
          if (btn.classList.contains('btn-saving')) {
            btn.classList.remove('btn-saving');
            btn.classList.add('btn-saved');
            setTimeout(function () { btn.classList.remove('btn-saved'); }, 2500);
          }
        }, 1500);
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  CHAT — Expert Eadee
  // ══════════════════════════════════════════════════════════════════════════════
  function _initChat(reduced) {
    var view = document.getElementById('view-chat');
    if (!view) return;

    var convCol  = view.querySelector('.chat-convs-col');
    var mainCol  = view.querySelector('.chat-main-col');

    if (!reduced) {
      var cols = [];
      if (convCol) cols.push(convCol);
      if (mainCol) cols.push(mainCol);
      _stagger(cols, 60, 80, false);
    }

    // MutationObserver — animate new chat messages
    var msgContainer = document.getElementById('chatViewMessages');
    if (msgContainer && !_observers['chat']) {
      _observers['chat'] = new MutationObserver(function (mutations) {
        if (reduced) return;
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            // Bot messages: .chat-msg without .user; user messages: .chat-msg.user
            if (node.classList && node.classList.contains('chat-msg')) {
              var isUser = node.classList.contains('user');
              node.classList.add(isUser ? 'chat-msg-anim-right' : 'chat-msg-anim-left');
            }
          });
        });
      });
      _observers['chat'].observe(msgContainer, { childList: true });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  INSPIRATION
  // ══════════════════════════════════════════════════════════════════════════════
  function _initInspiration(reduced) {
    var view = document.getElementById('view-inspiration');
    if (!view) return;

    var header = view.querySelector('.view-header');
    var cards  = Array.from(view.querySelectorAll('.inspi-card'));

    // Inject slide-up "Utiliser" button into each card
    cards.forEach(function (card) {
      if (!card.querySelector('.inspi-use-btn')) {
        var btn = document.createElement('div');
        btn.className = 'inspi-use-btn';
        btn.textContent = 'Utiliser cette idée →';
        card.appendChild(btn);
      }
    });

    if (reduced) return;

    var items = [];
    if (header) items.push(header);
    cards.forEach(function (c) { items.push(c); });
    _stagger(items, 60, 55, true); // use sv-scale for cards
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  HELP — Aide & Support
  // ══════════════════════════════════════════════════════════════════════════════
  function _initHelp(reduced) {
    var view = document.getElementById('view-help');
    if (!view) return;

    // Build FAQ accordion from static items (only once)
    _initFaqAccordion(view);

    var header = view.querySelector('.view-header');
    var panels = Array.from(view.querySelectorAll('.gen-panel'));

    if (reduced) return;

    var items = [];
    if (header) items.push(header);
    panels.forEach(function (p) { items.push(p); });
    _stagger(items, 60, 80, false);
  }

  function _initFaqAccordion(view) {
    var faqPanel = view.querySelector('.gen-panel');
    if (!faqPanel || faqPanel.dataset.accInited) return;

    // Find the container that holds the static FAQ items
    var faqWrap = faqPanel.querySelector('[style*="flex-direction:column"][style*="gap:8px"]');
    if (!faqWrap) return;

    var staticItems = Array.from(faqWrap.children);
    if (!staticItems.length) return;

    faqPanel.dataset.accInited = 'true';
    faqWrap.innerHTML = '';

    staticItems.forEach(function (item, idx) {
      var strong = item.querySelector('strong');
      var span   = item.querySelector('span');
      if (!strong) return;

      var question = strong.textContent.trim();
      var answer   = span ? span.textContent.trim() : '';

      var accItem = document.createElement('div');
      accItem.className = 'faq-acc-item';

      var chevronSVG = '<svg class="faq-acc-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">'
        + '<path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        + '</svg>';

      var accBtn = document.createElement('button');
      accBtn.className = 'faq-acc-btn';
      accBtn.setAttribute('aria-expanded', idx === 0 ? 'true' : 'false');
      accBtn.innerHTML = '<span>' + question + '</span>' + chevronSVG;

      var accBody = document.createElement('div');
      accBody.className = 'faq-acc-body';
      if (idx === 0) accBody.style.maxHeight = '200px'; // open first

      var accContent = document.createElement('div');
      accContent.className = 'faq-acc-content';
      accContent.textContent = answer;
      accBody.appendChild(accContent);

      accBtn.addEventListener('click', function () {
        var expanded = accBtn.getAttribute('aria-expanded') === 'true';
        accBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        accBody.style.maxHeight = expanded ? '0' : (accContent.scrollHeight + 32) + 'px';
      });

      accItem.appendChild(accBtn);
      accItem.appendChild(accBody);
      faqWrap.appendChild(accItem);
    });

    // Open first item's content opacity too
    var firstContent = faqWrap.querySelector('.faq-acc-content');
    if (firstContent) {
      // Delay so CSS transition has kicked in
      setTimeout(function () { firstContent.style.opacity = '1'; }, 50);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  REFERRAL — Inviter un ami
  // ══════════════════════════════════════════════════════════════════════════════
  function _initReferral(reduced) {
    var view = document.getElementById('view-referral');
    if (!view) return;

    var header = view.querySelector('.view-header');
    var panel  = view.querySelector('.gen-panel');

    if (reduced) return;

    var items = [];
    if (header) items.push(header);
    if (panel)  items.push(panel);
    _stagger(items, 60, 90, true);
  }

  // ── Auto-init current active view on DOMContentLoaded ───────────────────────
  function _tryAutoInitSecondary() {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var active  = document.querySelector('.dash-view.active');
    if (active) {
      var name = active.id.replace('view-', '');
      if (name !== 'generator') _onViewShown(name, reduced);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tryAutoInitSecondary);
  } else {
    _tryAutoInitSecondary();
  }

})();
