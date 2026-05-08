// ========== BRIEF GUIDE SCROLL REVEAL ==========

function initBriefGuideReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.brief-card');
        cards.forEach((card, idx) => {
          setTimeout(() => card.classList.add('revealed'), idx * 80);
        });
        const example = entry.target.querySelector('.brief-guide-example');
        if (example) {
          setTimeout(() => example.classList.add('revealed'), cards.length * 80 + 100);
        }
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.brief-guide').forEach(g => obs.observe(g));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBriefGuideReveal);
} else {
  initBriefGuideReveal();
}
