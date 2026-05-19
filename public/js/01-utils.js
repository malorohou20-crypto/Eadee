
// ========== TOAST ==========
function toast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) {
    // v2 : pas d'élément #toast — créer un toast dynamique
    const ex = document.getElementById('v2-toast');
    if (ex) ex.remove();
    const el = document.createElement('div');
    el.id = 'v2-toast';
    const bg = type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : 'var(--ink)';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + bg + ';color:#fff;padding:12px 20px;border-radius:10px;font-family:var(--mono,monospace);font-size:12.5px;letter-spacing:0.06em;box-shadow:0 8px 24px rgba(0,0,0,0.18);max-width:360px;line-height:1.4';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.style.opacity='0'; el.style.transition='.2s'; setTimeout(function(){ if(el.parentNode) el.remove(); }, 220); }, 3200);
    return;
  }
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ========== UTILS ==========
function scrollToPricing() {
  document.getElementById('pricingSection').scrollIntoView({ behavior: 'smooth' });
}

