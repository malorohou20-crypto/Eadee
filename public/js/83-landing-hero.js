  // ===== Hero live demo =====
  (function(){
    const kinetic   = document.getElementById('kineticNum');
    const timer     = document.getElementById('liveTimer');
    const progress  = document.getElementById('liveProgress');
    const sections  = document.querySelectorAll('#liveSections li');
    const moreEl    = document.getElementById('liveMore');
    const result    = document.getElementById('liveResult');
    const ornCount  = document.getElementById('ornCount');
    const ornBars   = document.querySelectorAll('#ornBars i');
    const chips     = [document.getElementById('chip1'),document.getElementById('chip2'),document.getElementById('chip3')];

    const SHOWN_SECTIONS = sections.length; // 9
    const TOTAL_SECTIONS = 23;
    const RUN_MS  = 18000;   // 18s to fill
    const HOLD_MS = 5000;    // 5s hold the result

    function reset(){
      kinetic.textContent = '00';
      kinetic.classList.remove('done');
      timer.textContent = '00 / 60s';
      progress.style.width = '0%';
      sections.forEach(li=>{ li.classList.remove('done','active'); li.querySelector('.lst').textContent='⋯'; });
      moreEl.textContent = '+ '+(TOTAL_SECTIONS-SHOWN_SECTIONS)+' autres sections en cours';
      result.classList.remove('shown');
      ornCount.textContent = '00 / 23 sections';
      ornBars.forEach(b=>b.classList.remove('on'));
      chips.forEach(c=>c && c.classList.remove('shown'));
    }

    function run(){
      reset();
      const start = performance.now();
      const chipAt = [0.18, 0.48, 0.74];

      function frame(now){
        const t = Math.min(1, (now - start) / RUN_MS);
        const secs = Math.floor(t * 60);
        const sectionsDone = Math.min(TOTAL_SECTIONS, Math.floor(t * TOTAL_SECTIONS));
        const shownDone   = Math.min(SHOWN_SECTIONS, Math.round((sectionsDone / TOTAL_SECTIONS) * SHOWN_SECTIONS));

        kinetic.textContent = String(secs).padStart(2,'0');
        timer.textContent = String(secs).padStart(2,'0') + ' / 60s';
        progress.style.width = (t*100).toFixed(1) + '%';
        ornCount.textContent = String(sectionsDone).padStart(2,'0') + ' / 23 sections';

        sections.forEach((li,i)=>{
          if(i < shownDone){
            li.classList.add('done'); li.classList.remove('active');
            li.querySelector('.lst').textContent='✓';
          } else if(i === shownDone && t < 1){
            li.classList.add('active'); li.classList.remove('done');
            li.querySelector('.lst').textContent='···';
          } else {
            li.classList.remove('done','active');
            li.querySelector('.lst').textContent='⋯';
          }
        });

        const remaining = TOTAL_SECTIONS - sectionsDone;
        moreEl.textContent = remaining > 0 ? '+ '+remaining+' autres sections en cours' : 'Toutes les sections sont prêtes';

        ornBars.forEach((b,i)=>{ if(i < sectionsDone) b.classList.add('on'); else b.classList.remove('on'); });

        chips.forEach((c,i)=>{ if(c && t >= chipAt[i]) c.classList.add('shown'); });

        if(t < 1){
          requestAnimationFrame(frame);
        } else {
          kinetic.textContent = '60';
          kinetic.classList.add('done');
          timer.textContent = '60 / 60s ✓';
          sections.forEach(li=>{ li.classList.remove('active'); });
          result.classList.add('shown');
          setTimeout(run, HOLD_MS);
        }
      }
      requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  })();

  // TOC — état collapse + filtres
  const tabs        = document.querySelectorAll('.toc-tab');
  const items       = document.querySelectorAll('.toc-item');
  const tocBonusEls = document.querySelectorAll('.toc-sep, .toc-bonus-filler');
  const tocExpandBar = document.getElementById('tocExpandBar');
  const tocExpandBtn = document.getElementById('tocExpandBtn');
  let tocExpanded   = false;
  let currentFilter = 'all';
  const VISIBLE_COLLAPSED = 6; // 2 rangées × 3 cols

  function renderToc() {
    if (currentFilter !== 'all') {
      // Filtre catégorie : tout montrer selon cat, masquer bonus + barre
      tocBonusEls.forEach(el => { el.style.display = 'none'; });
      tocExpandBar.style.display = 'none';
      items.forEach(i => {
        i.style.display = (i.dataset.cat === currentFilter) ? '' : 'none';
      });
    } else {
      // Vue "Toutes"
      tocExpandBar.style.display = '';
      if (tocExpanded) {
        tocBonusEls.forEach(el => { el.style.display = ''; });
        items.forEach(i => { i.style.display = ''; });
        tocExpandBar.classList.add('expanded');
        tocExpandBtn.textContent = 'Voir moins ↑';
      } else {
        tocBonusEls.forEach(el => { el.style.display = 'none'; });
        items.forEach((i, idx) => { i.style.display = idx < VISIBLE_COLLAPSED ? '' : 'none'; });
        tocExpandBar.classList.remove('expanded');
        tocExpandBtn.textContent = 'Voir les 23 sections + 4 bonus ↓';
      }
    }
  }

  tocExpandBtn.addEventListener('click', () => {
    tocExpanded = !tocExpanded;
    if (!tocExpanded) {
      // Replie et revient en haut de la section
      renderToc();
      document.querySelector('.toc-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      renderToc();
    }
  });

  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      currentFilter = t.dataset.filter;
      renderToc();
    });
  });

  renderToc(); // état initial : collapsed

  // FAQ: only one open at a time (optional, nicer feel)
  document.querySelectorAll('details.q').forEach(d=>{
    d.addEventListener('toggle',()=>{
      if(d.open){
        document.querySelectorAll('details.q').forEach(o=>{ if(o!==d) o.open=false; });
      }
    });
  });
