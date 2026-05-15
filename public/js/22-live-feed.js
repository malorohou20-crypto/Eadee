// ========== LIVE FEED ==========
let liveFeedInterval = null;
let _lfTimestampInterval = null;
let _lfPoolIdx = 0;

const liveFeedPool = [
  { name:'Camille B.', city:'Lyon', sector:'Conciergerie', action:'Plan généré', detail:'Business plan <span class="lf-purple">Empire</span> · score viabilité <span class="lf-score">87/100</span>' },
  { name:'Théo M.', city:'Paris 11e', sector:'SaaS', action:'Pack débloqué', detail:'Pack <span class="lf-purple">Pro</span> activé · business plan en cours' },
  { name:'Inès K.', city:'Bordeaux', sector:'Restauration', action:'Plan généré', detail:'Dark kitchen halal · score <span class="lf-score">79/100</span> · 3 statuts comparés' },
  { name:'Lucas D.', city:'Toulouse', sector:'E-commerce', action:'Premier client', detail:'Première vente en ligne · <span class="lf-purple">Empire</span> ouvert il y a 42 jours' },
  { name:'Sofia R.', city:'Nantes', sector:'Coaching', action:'BPI validé', detail:'Dossier BPI accepté · <span class="lf-score">18 000€</span> accordés' },
  { name:'Mehdi A.', city:'Marseille', sector:'Artisanat', action:'Plan généré', detail:'Ébénisterie sur-mesure · score <span class="lf-score">82/100</span> · export inclus' },
  { name:'Julie C.', city:'Strasbourg', sector:'Beauté', action:'Prêt accordé', detail:'Prêt pro <span class="lf-score">25 000€</span> · salon de coiffure afro ouvert' },
  { name:'Axel P.', city:'Lille', sector:'Sport', action:'Plan généré', detail:'Studio cross-training · score <span class="lf-score">75/100</span> · statut SAS recommandé' },
  { name:'Yasmine O.', city:'Montpellier', sector:'Formation', action:'Pack débloqué', detail:'Pack <span class="lf-purple">Pro</span> · formation en ligne B2B' },
  { name:'Romain F.', city:'Rennes', sector:'App mobile', action:'Plan généré', detail:'App de covoiturage local · score <span class="lf-score">91/100</span>' },
  { name:'Léa S.', city:'Grenoble', sector:'Bien-être', action:'Premier client', detail:'Premier abonné yoga en ligne · <span class="lf-purple">Empire</span> lancé' },
  { name:'Omar T.', city:'Nice', sector:'Restauration', action:'Plan généré', detail:'Food truck méditerranéen · score <span class="lf-score">80/100</span>' },
  { name:'Anaïs V.', city:'Nantes', sector:'SaaS', action:'BPI validé', detail:'Aide BPI <span class="lf-score">12 000€</span> · SaaS RH TPE validé' },
  { name:'Hugo B.', city:'Paris 9e', sector:'Conciergerie', action:'Pack débloqué', detail:'Pack <span class="lf-purple">Empire</span> · 3 biens gérés dès lancement' },
  { name:'Chloé R.', city:'Bordeaux', sector:'E-commerce', action:'Prêt accordé', detail:'Prêt <span class="lf-score">15 000€</span> · boutique mode éthique' },
  { name:'Kévin N.', city:'Lyon', sector:'Artisanat', action:'Plan généré', detail:'Lutherie contemporaine · score <span class="lf-score">73/100</span> · EI recommandée' },
  { name:'Sarah M.', city:'Toulouse', sector:'Coaching', action:'Premier client', detail:'Premier client B2B signé · <span class="lf-purple">Empire</span> ouvert il y a 18 jours' },
  { name:'Julien D.', city:'Marseille', sector:'Sport', action:'Plan généré', detail:'Application running communautaire · score <span class="lf-score">84/100</span>' },
  { name:'Fatima L.', city:'Strasbourg', sector:'Beauté', action:'BPI validé', detail:'Dossier BPI accepté · <span class="lf-score">9 000€</span> · institut de beauté' },
  { name:'Baptiste C.', city:'Paris 15e', sector:'Formation', action:'Plan généré', detail:'Formation devs juniors en ligne · score <span class="lf-score">88/100</span> · EURL conseillée' },
];

const _lfGradients = [
  'linear-gradient(135deg,#6b8fef,#a78bfa)',
  'linear-gradient(135deg,#a78bfa,#ec4899)',
  'linear-gradient(135deg,#fbbf24,#f59e0b)',
  'linear-gradient(135deg,#34d399,#6b8fef)',
];

function _lfFormatTime(secsAgo) {
  if (secsAgo < 60) return `il y a ${secsAgo}s`;
  const m = Math.floor(secsAgo / 60);
  if (m < 60) return `il y a ${m}min`;
  return `il y a ${Math.floor(m/60)}h`;
}

function _lfBuildEvent(data, secsAgo) {
  const initiale = data.name[0];
  const grad = _lfGradients[_lfPoolIdx % _lfGradients.length];
  const ts = _lfFormatTime(secsAgo);
  const div = document.createElement('div');
  div.className = 'lf-event';
  div.dataset.born = Date.now() - secsAgo * 1000;
  div.innerHTML = `
    <div class="lf-avatar" style="background:${grad}">${initiale}</div>
    <div class="lf-body">
      <div class="lf-name">${data.name} <span style="font-weight:400;color:#7a7f9a">· ${data.city}</span></div>
      <div class="lf-desc">${data.detail}</div>
      <div class="lf-time">${ts}</div>
    </div>
  `;
  return div;
}

function _lfUpdateTimestamps() {
  const stream = document.getElementById('lf-stream');
  if (!stream) return;
  const now = Date.now();
  stream.querySelectorAll('.lf-event').forEach(ev => {
    const born = parseInt(ev.dataset.born || now);
    const secs = Math.round((now - born) / 1000);
    const timeEl = ev.querySelector('.lf-time');
    if (timeEl) timeEl.textContent = _lfFormatTime(secs);
  });
}

function _lfTick() {
  const stream = document.getElementById('lf-stream');
  if (!stream) return;

  // Remove oldest if 5 events already shown
  const events = stream.querySelectorAll('.lf-event');
  if (events.length >= 5) {
    const last = events[events.length - 1];
    last.classList.add('exiting');
    setTimeout(() => { if (last.parentNode) last.parentNode.removeChild(last); }, 380);
  }

  // Add new event at top
  const data = liveFeedPool[_lfPoolIdx % liveFeedPool.length];
  _lfPoolIdx++;
  const newEv = _lfBuildEvent(data, Math.floor(Math.random() * 30 + 5));
  newEv.classList.add('entering');
  stream.insertBefore(newEv, stream.firstChild);
}

function startLiveFeed() {
  const stream = document.getElementById('lf-stream');
  if (!stream) return;
  if (liveFeedInterval) return; // already running

  // Pre-populate with 5 events
  stream.innerHTML = '';
  _lfPoolIdx = 0;
  for (let i = 0; i < 5; i++) {
    const data = liveFeedPool[_lfPoolIdx % liveFeedPool.length];
    _lfPoolIdx++;
    const ev = _lfBuildEvent(data, (5 - i) * 45 + Math.floor(Math.random() * 30));
    stream.appendChild(ev);
  }

  liveFeedInterval = setInterval(_lfTick, 4500);
  _lfTimestampInterval = setInterval(_lfUpdateTimestamps, 10000);
}

function stopLiveFeed() {
  if (liveFeedInterval) { clearInterval(liveFeedInterval); liveFeedInterval = null; }
  if (_lfTimestampInterval) { clearInterval(_lfTimestampInterval); _lfTimestampInterval = null; }
}


const IDEA_PROMPTS = {
  airbnb: "Je veux créer une conciergerie de location courte durée pour gérer des biens locatifs T2/T3. Je cible les propriétaires qui veulent déléguer complètement la gestion. Mon modèle : commission 20-25% sur le CA généré, sans abonnement fixe. Budget : 2 000€. Disponibilité : temps plein.",
  kitchen: "Je veux lancer une dark kitchen spécialisée en repas équilibrés et sains. Livraison via Uber Eats et Deliveroo. Cible : actifs 25-40 ans soucieux de leur alimentation. Différenciateur : menus rotatifs hebdomadaires, ingrédients sourcés localement. Budget : 8 000€.",
  coaching: "Je veux proposer du coaching business pour freelances et consultants B2B indépendants. Format : sessions 1h en visio + programme d'accompagnement 3 mois. Cible : consultants avec 2+ ans d'expérience voulant scaler leur CA. Tarif : 2 500€ le programme. Budget : 500€.",
  saas: "Je veux créer un SaaS de gestion tout-en-un pour auto-entrepreneurs français : facturation, devis, suivi clients. Abonnement 15€/mois. Différenciateur : connexion directe avec les déclarations URSSAF. Cible : 2 millions d'auto-entrepreneurs en France. Budget : 5 000€.",
  yoga: "Je veux ouvrir un studio de bien-être proposant du yoga, de la méditation et des séances de sophrologie. Cours collectifs + séances privées. Cible : actifs 30-50 ans stressés. Tarif : 80€/mois abonnement. Budget : 15 000€. Temps plein.",
  ecommerce: "Je veux lancer une marque e-commerce spécialisée dans les accessoires pour sportifs outdoor. Vente 100% en ligne. Cible : randonneurs et grimpeurs 25-45 ans. Prix moyen panier : 65€. Différenciateur : produits éco-conçus avec matières recyclées. Budget : 3 000€.",
  formation: "Je veux créer une formation en ligne sur la gestion des réseaux sociaux pour indépendants et petits commerces. Format : vidéos + modules pratiques + groupe de suivi. Tarif : 297€ le programme. Cible : indépendants sans compétences digitales. Budget : 800€.",
  agence: "Je veux créer une agence de gestion des réseaux sociaux pour PME locales. Service clé en main : création de contenu + publication + reporting mensuel. Tarif : 500€/mois par client. Cible : commerces et restaurants. Budget : 500€. Mi-temps.",
  artisanat: "Je veux lancer une marque d'artisanat premium en travail du cuir fait main : sacs, portefeuilles, accessoires. Vente en ligne et marchés créateurs. Prix moyen : 120€. Cible : 30-50 ans cherchant des produits durables et uniques. Budget : 1 500€."
};

function prefillIdea(key) {
  const ta = document.getElementById('dashIdea');
  if (ta && IDEA_PROMPTS[key]) {
    ta.value = IDEA_PROMPTS[key];
    ta.dispatchEvent(new Event('input'));
    ta.focus();
  }
}

