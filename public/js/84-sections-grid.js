// ========== GRILLE 20 SECTIONS — FILTRES + SCROLL REVEAL ==========

function initSectionsGrid() {
  const filters = document.querySelectorAll('.grid-filter');
  const cards   = document.querySelectorAll('.grid-card');
  if (!filters.length || !cards.length) return;

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const cat = filter.dataset.cat;
      filters.forEach(f => f.classList.remove('active'));
      filter.classList.add('active');
      cards.forEach(card => {
        if (cat === 'all' || card.dataset.cat === cat) {
          card.classList.remove('dimmed');
        } else {
          card.classList.add('dimmed');
        }
      });
    });
  });
}

function initGridScrollReveal() {
  const grid = document.querySelector('.sections-grid');
  if (!grid) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.grid-card');
        cards.forEach((card, idx) => {
          setTimeout(() => card.classList.add('revealed'), idx * 35);
        });
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  obs.observe(grid);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSectionsGrid();
    initGridScrollReveal();
  });
} else {
  initSectionsGrid();
  initGridScrollReveal();
}
