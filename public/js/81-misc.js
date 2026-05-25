// ========== NAV DROPDOWN ==========
function toggleNavDropdown() {
  const dd = document.getElementById('nav-dropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}
function closeNavDropdown() {
  const dd = document.getElementById('nav-dropdown');
  if (dd) dd.style.display = 'none';
}
function toggleNotifDropdown() {
  toast('Aucune nouvelle notification', '');
}
document.addEventListener('click', (e) => {
  const dd = document.getElementById('nav-dropdown');
  if (dd && dd.style.display !== 'none') {
    if (!e.target.closest('#nav-dropdown') && !e.target.closest('.nav-btn')) {
      dd.style.display = 'none';
    }
  }
});

function copyPlan() {
  if (!currentResult) return;
  const r = currentResult;
  const text = [
    `BUSINESS PLAN — ${r.nom_business}`,
    `${r.tagline}`,
    `Score de viabilité: ${r.score_viabilite}/100`,
    ``,
    `RÉSUMÉ EXÉCUTIF`,
    r.resume_executif,
    ``,
    `MARCHÉ`,
    `Taille: ${r.marche_taille} | Croissance: ${r.marche_croissance}`,
    r.marche_analyse,
    ``,
    `PROJECTIONS FINANCIÈRES`,
    `M1: ${r.rev_m1} | M3: ${r.rev_m3} | M6: ${r.rev_m6} | An1: ${r.rev_m12}`,
    ``,
    `CONCURRENTS`,
    (r.concurrents||[]).map(c => `- ${c.nom}: ${c.description}`).join('\n'),
    ``,
    `PLAN D'ACTION 90 JOURS`,
    (r.actions||[]).map(a => `[${a.phase}] ${a.titre} — ${a.detail}`).join('\n'),
    ``,
    `RISQUES & SOLUTIONS`,
    (r.risques||[]).map(ri => `${ri.titre}\n→ Solution : ${ri.solution}`).join('\n\n'),
  ].join('\n');
  navigator.clipboard.writeText(text)
    .then(() => toast('Copié dans le presse-papiers ✓', 'success'))
    .catch(() => toast('Copie impossible — autorise le presse-papiers', 'error'));
}

function savePlan() {
  if (!currentResult) return;
  // Le plan est déjà ajouté à plansHistory et persisté dans generateDashPlan.
  // On s'assure juste que la version courante est bien sauvegardée.
  if (!plansHistory.includes(currentResult)) {
    plansHistory.unshift(currentResult);
  }
  localStorage.setItem('eadee_history', JSON.stringify(plansHistory));
  toast('Plan sauvegardé ✓', 'success');
}

// ========== FAQ ACCORDÉON ==========
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ========== LANDING REVENUE CHART ==========
(function() {
  function initLandingRevChart() {
    const canvas = document.getElementById('landingRevChart');
    if (!canvas) return;
    const container = canvas.parentElement;
    const W = container.offsetWidth || 340;
    const H = container.offsetHeight || 180;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const padL = 44, padR = 16, padT = 14, padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    // Data: [label, value]
    const pts = [
      ['M1', 1200], ['M3', 4800], ['M6', 9500], ['M12', 68000], ['An 2', 120000], ['An 3', 185000]
    ];
    const maxVal = 200000;
    const breakEven = 6000;

    function xPos(i) { return padL + (i / (pts.length - 1)) * chartW; }
    function yPos(v) { return padT + chartH - (v / maxVal) * chartH; }

    // Grid lines + Y labels
    const ySteps = [0, 50000, 100000, 150000, 200000];
    ctx.font = '9px DM Mono, monospace';
    ctx.textAlign = 'right';
    ySteps.forEach(v => {
      const y = yPos(v);
      ctx.strokeStyle = 'rgba(228,221,214,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#7a7060';
      const label = v === 0 ? '0€' : (v / 1000) + 'k€';
      ctx.fillText(label, padL - 5, y + 3.5);
    });

    // Break-even dashed line
    const beY = yPos(breakEven);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(122,112,96,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, beY);
    ctx.lineTo(padL + chartW, beY);
    ctx.stroke();
    ctx.restore();

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, 'rgba(212,132,90,0.28)');
    grad.addColorStop(1, 'rgba(212,132,90,0.00)');

    // Smooth bezier path
    function smoothPath(fillMode) {
      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(pts[0][1]));
      for (let i = 0; i < pts.length - 1; i++) {
        const x0 = xPos(i), y0 = yPos(pts[i][1]);
        const x1 = xPos(i + 1), y1 = yPos(pts[i + 1][1]);
        const cpx = x0 + (x1 - x0) * 0.45;
        ctx.bezierCurveTo(cpx, y0, x1 - (x1 - x0) * 0.45, y1, x1, y1);
      }
      if (fillMode) {
        ctx.lineTo(xPos(pts.length - 1), padT + chartH);
        ctx.lineTo(xPos(0), padT + chartH);
        ctx.closePath();
      }
    }

    // Fill
    smoothPath(true);
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke
    smoothPath(false);
    ctx.strokeStyle = '#d4845a';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots
    pts.forEach((p, i) => {
      const x = xPos(i), y = yPos(p[1]);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#d4845a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#1c1915';
      ctx.fill();
    });

    // X labels
    ctx.font = '9px DM Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a7060';
    pts.forEach((p, i) => {
      ctx.fillText(p[0], xPos(i), padT + chartH + 17);
    });
  }

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initLandingRevChart, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLandingRevChart);
  } else {
    initLandingRevChart();
  }
  window.addEventListener('resize', onResize);
})();

// ========== FADE-UP OBSERVER ==========
(function() {
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }});
  }, { threshold: 0.1 });
  function initFadeUp() {
    document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFadeUp);
  } else {
    initFadeUp();
  }
})();

