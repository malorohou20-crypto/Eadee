// ========== HERO MOCK 3D TILT (mousemove) ==========
(function() {
  function initMockTilt() {
    const wrap = document.querySelector('.hero-mock-wrap');
    const mock = document.querySelector('.hero-mock-app');
    if (!wrap || !mock) return;

    let rafId = null;

    wrap.addEventListener('mousemove', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = wrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);   // -1 à +1
        const dy = (e.clientY - cy) / (rect.height / 2);  // -1 à +1
        const rotY = dx * 12;
        const rotX = -dy * 7;
        mock.style.animation = 'none';
        mock.style.transform = `perspective(1600px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(1.02)`;
        mock.style.boxShadow = `${-rotY * 3}px 40px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)`;
        mock.style.transition = 'transform 0.08s ease, box-shadow 0.08s ease';
      });
    });

    wrap.addEventListener('mouseleave', () => {
      mock.style.transition = 'transform 0.6s ease, box-shadow 0.6s ease';
      mock.style.transform = '';
      mock.style.boxShadow = '';
      setTimeout(() => {
        mock.style.animation = '';
        mock.style.transition = '';
      }, 600);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMockTilt);
  } else {
    initMockTilt();
  }
})();

