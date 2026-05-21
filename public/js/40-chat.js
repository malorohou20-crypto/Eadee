// ========== EXPERT EADEE — CHAT ==========

function stripEmojis(s) {
  if (!s) return s;
  try {
    return s.replace(/\p{Extended_Pictographic}/gu, '').replace(/️/g, '');
  } catch(e) {
    // Fallback for older browsers
    return s.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]/gu, '');
  }
}

const CHAT_QUICK_ACTIONS = [
  'Améliore mon score de viabilité',
  'Aide-moi avec le statut juridique',
  'Comment financer mon projet ?',
  'Mes 3 plus gros risques',
  'Réécris mon résumé exécutif',
  "Plan d'action 30 jours",
];

const SECTION_QUESTIONS = {
  'résumé exécutif': 'Peux-tu améliorer mon résumé exécutif pour le rendre plus percutant ?',
  'analyse de marché': 'Comment estimer mieux la taille de mon marché ?',
  'concurrents': 'Comment me différencier de mes concurrents ?',
  'projections financières': 'Mes projections financières sont-elles réalistes ?',
  'démarches administratives': 'Quel statut juridique me conseilles-tu pour mon projet ?',
  'stratégie': 'Comment affiner ma stratégie de lancement ?',
  'persona': 'Comment mieux cibler mon client idéal ?',
  'pricing': 'Mon pricing est-il cohérent avec le marché ?',
  'canaux': "Quels canaux d'acquisition prioriser en premier ?",
};

let chatState = {
  conversations: {},
  activePlanId: null,
  activeMode: null, // 'view' | 'drawer'
  sending: false,
};

function getChatPlansList() {
  return (plansHistory || []).map(function(p) {
    return {
      id: p.id || p.timestamp,
      name: p.nom_entreprise || p.nom_business || p.name || 'Plan sans nom',
      score: p.score_viabilite || p.score || null,
      data: p,
    };
  });
}

function openChatFullscreen(planId) {
  showView('chat');
  chatState.activeMode = 'view';
  var upsell = document.getElementById('chatUpsell');
  var wrap = document.getElementById('chatViewWrap');
  if (upsell) upsell.style.display = 'none';
  if (wrap) wrap.style.display = 'flex';
  populateChatPlanSelect();
  renderChatConvsList();
  var plans = getChatPlansList();
  var target = planId || (plans.length ? plans[0].id : null);
  if (target) selectChatPlan(target, 'view');
  renderChatQuickActions('view');
}

function openChatDrawer(planId, prefilledQuestion) {
  chatState.activeMode = 'drawer';
  var drawer = document.getElementById('chatDrawer');
  var backdrop = document.getElementById('chatBackdrop');
  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('visible');
  if (planId) selectChatPlan(planId, 'drawer');
  if (prefilledQuestion) {
    var input = document.getElementById('chatDrawerInput');
    if (input) { input.value = prefilledQuestion; autoGrow(input); input.focus(); }
  }
  renderChatQuickActions('drawer');
}

function closeChatDrawer() {
  var d = document.getElementById('chatDrawer');
  var b = document.getElementById('chatBackdrop');
  if (d) d.classList.remove('open');
  if (b) b.classList.remove('visible');
}

function selectChatPlan(planId, mode) {
  if (!planId) return;
  chatState.activePlanId = planId;
  var plans = getChatPlansList();
  var plan = plans.find(function(p) { return String(p.id) === String(planId); });
  if (!plan) return;

  var subView = document.getElementById('chatViewSub');
  var subDrawer = document.getElementById('chatDrawerSub');
  var label = 'Sur ton plan : ' + plan.name;
  if (subView && mode === 'view') subView.textContent = label;
  if (subDrawer && mode === 'drawer') subDrawer.textContent = label;

  // Sync dropdown
  var sel = document.getElementById('chatPlanSelect');
  if (sel) sel.value = String(planId);

  var saved = localStorage.getItem('eadee_chat_' + planId);
  chatState.conversations[planId] = saved ? JSON.parse(saved) : [];

  if (chatState.conversations[planId].length === 0) {
    var firstName = user ? user.name.split(' ')[0] : 'toi';
    chatState.conversations[planId].push({
      role: 'assistant',
      content: 'Salut **' + firstName + '** ! Je connais ton plan **' + plan.name + '** par cœur.' + (plan.score ? ' Score actuel : **' + plan.score + '/100**.' : '') + '\n\nComment puis-je t\'aider aujourd\'hui ?',
    });
  }

  renderChatMessages(mode);
  renderChatConvsList();
}

function renderChatMessages(mode) {
  mode = mode || chatState.activeMode || 'drawer';
  var planId = chatState.activePlanId;
  var msgs = planId ? (chatState.conversations[planId] || []) : [];
  var el = document.getElementById(mode === 'view' ? 'chatViewMessages' : 'chatDrawerMessages');
  if (!el) return;
  el.innerHTML = msgs.map(renderChatMsg).join('');
  el.scrollTop = el.scrollHeight;
}

function renderChatMsg(m) {
  var isUser = m.role === 'user';
  var initials = user ? user.name.split(' ').map(function(n) { return n[0]; }).join('').substring(0,2).toUpperCase() : 'U';
  var avatarContent = isUser ? initials : '✦';
  var bubbleContent = isUser ? escHtml(m.content) : renderMarkdown(stripEmojis(m.content));
  return '<div class="msg' + (isUser ? ' you' : '') + '">' +
    '<span class="av">' + avatarContent + '</span>' +
    '<div class="bb">' + bubbleContent + '</div>' +
    '</div>';
}

function renderMarkdown(text) {
  if (!text) return '';
  var html = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    // Headings
    .replace(/^## (.+)$/gm,'<div class="md-h2">$1</div>')
    .replace(/^### (.+)$/gm,'<div class="md-h3">$1</div>')
    // Inline formatting
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code class="md-code">$1</code>')
    // Horizontal rule
    .replace(/^---$/gm,'<hr class="md-hr">')
    // Lists — numbered and bullet
    .replace(/^\d+\. (.+)$/gm,'<li data-ol>$1</li>')
    .replace(/^[-•] (.+)$/gm,'<li>$1</li>');

  // Wrap consecutive <li> groups
  html = html.replace(/(<li(?:[^>]*)>[\s\S]*?<\/li>\n?)+/g, function(block) {
    var isOl = block.indexOf('data-ol') !== -1;
    var tag = isOl ? 'ol' : 'ul';
    var inner = block.replace(/ data-ol/g, '');
    return '<' + tag + ' class="md-list">' + inner + '</' + tag + '>';
  });

  // Paragraphs — double newline
  html = html.replace(/\n\n+/g,'</p><p class="md-p">');
  html = '<p class="md-p">' + html + '</p>';
  // Single newline
  html = html.replace(/\n/g,'<br>');
  // Clean empty paragraphs
  html = html.replace(/<p class="md-p"><\/p>/g,'');
  html = html.replace(/<p class="md-p">(<div class="md-h|<[ou]l class="md-list|<hr)/g,'$1');
  html = html.replace(/(<\/div>|<\/[ou]l>|<hr class="md-hr">)<\/p>/g,'$1');

  return html;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showTypingIndicator(mode) {
  mode = mode || chatState.activeMode || 'drawer';
  var el = document.getElementById(mode === 'view' ? 'chatViewMessages' : 'chatDrawerMessages');
  if (!el) return;
  var div = document.createElement('div');
  div.className = 'msg'; div.id = 'chatTyping' + mode;
  div.innerHTML = '<span class="av">✦</span><div class="bb chat-typing"><span></span><span></span><span></span></div>';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function hideTypingIndicator(mode) {
  mode = mode || chatState.activeMode || 'drawer';
  var el = document.getElementById('chatTyping' + mode);
  if (el) el.remove();
}

function renderChatQuickActions(mode) {
  var el = document.getElementById(mode === 'view' ? 'chatViewQuick' : 'chatDrawerQuick');
  if (!el) return;
  el.innerHTML = CHAT_QUICK_ACTIONS.map(function(a) {
    return '<button class="chat-chip" onclick="sendQuickAction(\'' + a.replace(/'/g,"\\'") + '\',\'' + mode + '\')">' + escHtml(a) + '</button>';
  }).join('');
}

function sendQuickAction(text, mode) {
  var inputId = mode === 'view' ? 'chatViewInput' : 'chatDrawerInput';
  var input = document.getElementById(inputId);
  if (input) input.value = text;
  sendChatMessage(mode);
}

async function sendChatMessage(mode) {
  mode = mode || chatState.activeMode || 'drawer';
  if (chatState.sending) return;
  var inputId = mode === 'view' ? 'chatViewInput' : 'chatDrawerInput';
  var sendBtnId = mode === 'view' ? 'chatViewSend' : 'chatDrawerSend';
  var input = document.getElementById(inputId);
  var btn = document.getElementById(sendBtnId);
  if (!input) return;
  var text = input.value.trim();
  if (!text || !chatState.activePlanId) return;

  input.value = ''; autoGrow(input);
  chatState.sending = true;
  if (btn) btn.disabled = true;

  var planId = chatState.activePlanId;
  var plans = getChatPlansList();
  var plan = plans.find(function(p) { return String(p.id) === String(planId); });

  chatState.conversations[planId] = chatState.conversations[planId] || [];
  chatState.conversations[planId].push({ role: 'user', content: text });
  renderChatMessages(mode);
  showTypingIndicator(mode);

  try {
    var res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatState.conversations[planId],
        plan: plan ? plan.data : null,
        userId: user ? user.email : 'anon',
      }),
    });

    hideTypingIndicator(mode);

    if (!res.ok) throw new Error('HTTP ' + res.status);

    chatState.conversations[planId].push({ role: 'assistant', content: '' });
    var lastIdx = chatState.conversations[planId].length - 1;
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var fullText = '';

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      fullText += decoder.decode(chunk.value, { stream: true });
      chatState.conversations[planId][lastIdx].content = fullText;
      renderChatMessages(mode);
    }

    localStorage.setItem('eadee_chat_' + planId, JSON.stringify(chatState.conversations[planId]));
    renderChatConvsList();

  } catch (e) {
    hideTypingIndicator(mode);
    chatState.conversations[planId].push({
      role: 'assistant',
      content: "Désolé, je n'ai pas pu répondre. Réessaie dans un instant.",
    });
    renderChatMessages(mode);
  }

  chatState.sending = false;
  if (btn) btn.disabled = false;
  input.focus();
}

function chatKeyDown(e, mode) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage(mode);
  }
}

function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

function populateChatPlanSelect() {
  var sel = document.getElementById('chatPlanSelect');
  if (!sel) return;
  var plans = getChatPlansList();
  sel.innerHTML = '<option value="">-- Choisir un plan --</option>' +
    plans.map(function(p) { return '<option value="' + p.id + '">' + escHtml(p.name) + (p.score ? ' (' + p.score + '/100)' : '') + '</option>'; }).join('');
}

function renderChatConvsList() {
  var el = document.getElementById('chatConvsList');
  if (!el) return;
  var plans = getChatPlansList();
  var withConvs = plans.filter(function(p) {
    var saved = localStorage.getItem('eadee_chat_' + p.id);
    if (!saved) return false;
    var msgs = JSON.parse(saved);
    return msgs.length > 1;
  });
  if (!withConvs.length) {
    el.innerHTML = '<div style="font-size:12px;color:#7a7f9a;padding:12px 0">Aucune conversation. Choisis un plan pour commencer.</div>';
    return;
  }
  el.innerHTML = withConvs.map(function(p) {
    var saved = localStorage.getItem('eadee_chat_' + p.id);
    var msgs = saved ? JSON.parse(saved) : [];
    var isActive = String(chatState.activePlanId) === String(p.id);
    return '<div class="conv ' + (isActive ? 'active' : '') + '" onclick="selectChatPlan(\'' + p.id + '\',\'view\')">' +
      '<b>' + escHtml(p.name) + '</b>' +
      '<div class="meta">' + msgs.length + ' messages</div>' +
      '</div>';
  }).join('');
}

function startNewChatConv() {
  // Réinitialiser la conversation du plan actif
  var planId = chatState.activePlanId;
  if (!planId) return;
  localStorage.removeItem('eadee_chat_' + planId);
  chatState.conversations[planId] = [];
  selectChatPlan(planId, 'view');
}

function openChatDrawerFromPlan() {
  var planId = chatState.activePlanId || (plansHistory && plansHistory.length ? plansHistory[0].id || plansHistory[0].timestamp : null);
  openChatDrawer(planId);
}

// ESC = fermer drawer
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeChatDrawer();
});

// ========== SIDEBAR MOBILE ==========
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  sidebar?.classList.toggle('open');
  backdrop?.classList.toggle('visible');
}
