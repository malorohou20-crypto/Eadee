// ========== PLAN PREVIEW ==========
function showPlanPreview(plan) {
  const modal = document.getElementById('planPreviewModal');
  const body = document.getElementById('previewModalBody');
  const title = document.getElementById('previewModalTitle');

  const demos = {
    solo: {
      title: 'Business Plan — Studio de Yoga',
      score: 71,
      resume: 'Création d\'un studio de yoga à Lyon ciblant les actifs 25-45 ans. Le marché français du bien-être représente 4,8 Mds€ en 2024. Modèle basé sur abonnements mensuels + cours à l\'unité. Différenciation par un format hybride présentiel / replay vidéo.',
      marche: { taille:'4,8 Mds€', croissance:'+9%/an', part:'0,03%', clients:'12 000' },
      revenus: ['800€','1 500€','2 800€','24 000€'],
      locked: true
    },
    pro: {
      title: 'Business Plan — Restaurant Le Phare',
      score: 82,
      resume: 'Restaurant de fruits de mer à Penmarc\'h, Bretagne. Ciblant touristes et locaux aisés. Le marché de la restauration bretonne pèse 1,2 Mds€. Capacité 40 couverts, ticket moyen 38€. Différenciation par la traçabilité pêche locale directe depuis la criée de Guilvinec.',
      marche: { taille:'1,2 Mds€', croissance:'+6%/an', part:'0,05%', clients:'8 500' },
      revenus: ['3 200€','8 500€','15 000€','98 000€'],
      offres: [
        { nom:'Menu déjeuner', desc:'Entrée + plat + dessert, poisson du jour garanti', prix:'22€' },
        { nom:'Dîner à la carte', desc:'Sélection fruits de mer, plateau mixte en option', prix:'38€ moy.' },
        { nom:'Plateau événementiel', desc:'Privatisation, 15 pers. min., mise en scène comprises', prix:'55€/pers.' },
      ],
      persona: { nom:'Sophie, 38 ans', job:'Cadre en vacances en Bretagne', budget:'50–80€ / repas', attentes:'Produits locaux traçables, vue mer, service attentionné' },
      concurrents: [
        { nom:'L\'Armorique', menace:'haute', desc:'Restaurant similaire, 45 couverts, 42€ ticket moyen' },
        { nom:'La Criée', menace:'moyenne', desc:'Poissonnerie-resto, format différent, prix plus bas' },
        { nom:'Le Homard Bleu', menace:'faible', desc:'Haut de gamme, clientèle différente, +65€/pers' },
      ],
      acquisition: [
        { canal:'Google My Business', cac:'0€', desc:'Photos qualité + réponses avis. Objectif Top 3 local.' },
        { canal:'Instagram', cac:'150€/mois', desc:'Stories arrivage pêche quotidien. 1 reel/semaine.' },
        { canal:'Partenariats hôtels', cac:'0€', desc:'Dépôt cartes dans 12 hôtels de Penmarc\'h et Guilvinec.' },
      ],
      investissements: [
        { label:'Aménagement salle', montant:'8 000€' },
        { label:'Matériel cuisine', montant:'12 000€' },
        { label:'Stock initial', montant:'3 500€' },
        { label:'Marketing lancement', montant:'2 000€' },
        { label:'Fonds de roulement', montant:'5 000€', total:true },
      ],
      outils: [
        { nom:'Lightspeed POS', usage:'Caisse & gestion tables', prix:'69€/mois' },
        { nom:'TheFork', usage:'Réservations en ligne', prix:'Commission + abo.' },
        { nom:'Canva Pro', usage:'Visuels réseaux sociaux', prix:'13€/mois' },
      ],
      actions: [
        { phase:'Sem 1-2', titre:'Valider les fournisseurs locaux', detail:'Contacter 8 pêcheurs de la criée de Guilvinec, négocier tarifs grossiste.' },
        { phase:'Sem 3-4', titre:'Lancer les réseaux sociaux', detail:'Instagram + Google My Business. Objectif : 500 abonnés avant ouverture.' },
        { phase:'Mois 2', titre:'Ouverture test (weekends)', detail:'Service uniquement vendredi-dimanche. Collecter 50 avis Google.' },
      ],
      locked: false
    },
    empire: {
      title: 'Business Plan — DevAgence Pro',
      score: 88,
      resume: 'Agence de développement web spécialisée PME en Île-de-France. Le marché des services digitaux aux PME représente 8,3 Mds€. Modèle MRR : forfaits maintenance 490–1 490€/mois + projets one-shot. Objectif 15 clients récurrents en 6 mois pour atteindre 12 000€ MRR.',
      marche: { taille:'8,3 Mds€', croissance:'+14%/an', part:'0,01%', clients:'45 000' },
      revenus: ['2 900€','9 500€','18 500€','142 000€'],
      offres: [
        { nom:'Forfait Essentiel', desc:'Site vitrine 5 pages + maintenance 12 mois incluse', prix:'490€/mois' },
        { nom:'Forfait Croissance', desc:'Site + SEO mensuel + reporting analytiques', prix:'890€/mois' },
        { nom:'Forfait Pilote', desc:'Refonte complète + tunnel de vente + formation équipe', prix:'1 490€/mois' },
      ],
      persona: { nom:'Marc, 47 ans', job:'Dirigeant PME 20 salariés', budget:'500–1 500€ / mois', attentes:'Résultats mesurables, interlocuteur unique, réactivité sous 4h' },
      concurrents: [
        { nom:'Agence Digitale Paris', menace:'haute', desc:'50 salariés, clients CAC40, tarifs 2-3x plus élevés' },
        { nom:'Freelances Malt', menace:'moyenne', desc:'Plateforme, pas de relation long terme, pas de maintenance' },
        { nom:'Web Agence Lyon', menace:'faible', desc:'Hors zone géographique cible' },
      ],
      acquisition: [
        { canal:'LinkedIn Outreach', cac:'120€', desc:'50 messages/jour vers dirigeants PME. Script A/B testé, 8% de réponse.' },
        { canal:'SEO Blog technique', cac:'0€ (long terme)', desc:'Articles cibles "agence web PME [ville]". Résultats 6-9 mois.' },
        { canal:'Parrainage clients', cac:'0€', desc:'Programme : 1 mois offert par client amené. Déclencheur de bouche-à-oreille.' },
      ],
      investissements: [
        { label:'Outils & logiciels (an 1)', montant:'1 800€' },
        { label:'Site portfolio', montant:'500€' },
        { label:'LinkedIn Ads (3 mois)', montant:'1 200€' },
        { label:'Formation / certifications', montant:'800€' },
        { label:'Fonds de roulement', montant:'3 000€', total:true },
      ],
      outils: [
        { nom:'Notion', usage:'Gestion projets clients', prix:'16€/mois' },
        { nom:'Figma Pro', usage:'Maquettes UI/UX', prix:'15€/mois' },
        { nom:'Stripe', usage:'Paiements récurrents MRR', prix:'1.4% + 0.25€/tr.' },
        { nom:'Ahrefs', usage:'SEO & veille concurrence', prix:'99€/mois' },
      ],
      actions: [
        { phase:'Sem 1-2', titre:'Créer 3 études de cas détaillées', detail:'Showcase projets passés avec résultats mesurables (trafic, conversions, CA).' },
        { phase:'Sem 3-4', titre:'Campagne LinkedIn ciblée', detail:'50 messages/jour vers dirigeants PME. Script A/B. Objectif : 5 RDV.' },
        { phase:'Mois 2', titre:'Signer 3 premiers contrats maintenance', detail:'Objectif MRR 1 500€ min. Offre lancement -30% sur 3 mois.' },
      ],
      emails: [
        { type:'Prospection LinkedIn', sujet:'Votre site web vous coûte des clients', extrait:'Bonjour Marc, j\'ai analysé votre site et identifié 3 points qui bloquent vos conversions. Je peux corriger ça en 2 semaines. RDV de 15 min ?' },
        { type:'Relance J+7', sujet:'Suite à notre échange du 12', extrait:'Bonjour Marc, je reviens vers vous. Voici une estimation personnalisée basée sur votre secteur — sans engagement, juste pour que vous ayez les chiffres.' },
      ],
      admin: [
        { etape:'Immatriculation SIREN', delai:'J+1', desc:'Sur guichet-entreprises.fr. Gratuit, traitement 24h.' },
        { etape:'Ouverture compte pro', delai:'Sem 1', desc:'Shine ou Qonto recommandés. 9–29€/mois.' },
        { etape:'Assurance RC Pro', delai:'Sem 2', desc:'Obligatoire agence web. Hiscox. ~800€/an.' },
        { etape:'Contrats clients CGV', delai:'Avant 1er client', desc:'Modèles Juristennis ou avocat 1h (~200€).' },
      ],
      risques: [
        { titre:'Dépendance à 2-3 gros clients', solution:'Dès le mois 3, ne pas dépasser 30% du CA sur un seul client. Diversifier activement.' },
        { titre:'Délais de paiement PME', solution:'Facturation 30% acompte, 70% livraison. Pénalités de retard dans CGV.' },
      ],
      chat: true,
      locked: false
    }
  };

  const d = demos[plan];
  title.textContent = d.title;

  const scoreColor = d.score >= 80 ? '#9db8f8' : d.score >= 65 ? '#fbbf24' : '#f87171';

  const sectionTitle = (n, label) => `<div style="font-family:'Geist',sans-serif;font-size:13px;font-weight:600;color:#ecedf2;margin-bottom:16px;display:flex;align-items:center;gap:10px;"><span style="display:block;width:3px;height:16px;flex-shrink:0;background:linear-gradient(180deg,#6b8fef,#a78bfa);border-radius:2px;"></span>${n} — ${label}</div>`;

  let html = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding:16px 18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap">Score de viabilité</div>
      <div style="flex:1;height:6px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${d.score}%;background:${scoreColor};border-radius:4px"></div>
      </div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:30px;color:${scoreColor};line-height:1">${d.score}<span style="font-size:14px;opacity:.5">/100</span></div>
    </div>

    <div class="mh-sep">
      ${sectionTitle('01','Résumé Exécutif')}
      <div style="font-family:'Geist',sans-serif;font-size:14px;line-height:1.85;color:rgba(255,255,255,0.72)">${d.resume}</div>
    </div>

    <div class="mh-sep">
      ${sectionTitle('02','Données de Marché')}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Marché</div><div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#9db8f8">${d.marche.taille}</div></div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Croissance</div><div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#9db8f8">${d.marche.croissance}</div></div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Part cible</div><div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#9db8f8">${d.marche.part}</div></div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;text-align:center"><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Clients potentiels</div><div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#9db8f8">${d.marche.clients}</div></div>
      </div>
    </div>

    <div class="mh-sep">
      ${sectionTitle('03','Projections de Revenus')}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${['Mois 1','Mois 3','Mois 6','An 1'].map((p,i) => `<div style="background:linear-gradient(135deg,rgba(107,143,239,0.1),rgba(107,143,239,0.04));border:1px solid rgba(107,143,239,0.25);border-radius:10px;padding:14px;text-align:center;position:relative;overflow:hidden"><div style="position:absolute;top:0;left:0;right:0;height:2px;background:#6b8fef"></div><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">${p}</div><div style="font-family:'Bebas Neue',sans-serif;font-size:24px;color:#9db8f8">${d.revenus[i]}</div></div>`).join('')}
      </div>
    </div>`;

  if (d.locked) {
    html += `
    <div style="background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.1);border-radius:10px;padding:24px;text-align:center;margin-bottom:20px">
      <div style="font-family:'Geist',sans-serif;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.8;margin-bottom:12px">
        Modèle économique · Persona client · Analyse concurrentielle<br>
        Stratégie d'acquisition · Plan d'action 90j · Budget & investissements<br>
        Outils recommandés · Emails de prospection · Démarches administratives
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(107,143,239,0.6);letter-spacing:.08em">INCLUS DANS BUILDER & EMPIRE</div>
    </div>`;
  } else {
    if (d.offres) html += `
    <div class="mh-sep">
      ${sectionTitle('04','Modèle Économique')}
      ${d.offres.map(o => `<div style="background:rgba(107,143,239,0.07);border:1px solid rgba(107,143,239,0.18);border-radius:8px;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px"><div><div style="font-weight:700;font-size:13px;color:#fff">${o.nom}</div><div style="font-size:12px;color:rgba(255,255,255,0.45);margin-top:2px">${o.desc}</div></div><div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#9db8f8;white-space:nowrap">${o.prix}</div></div>`).join('')}
    </div>`;

    if (d.persona) html += `
    <div class="mh-sep">
      ${sectionTitle('05','Persona Client Cible')}
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Profil</div><div style="font-size:13px;font-weight:700;color:#fff">${d.persona.nom}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px">${d.persona.job}</div></div>
        <div><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Budget</div><div style="font-size:13px;font-weight:700;color:#9db8f8">${d.persona.budget}</div></div>
        <div style="grid-column:1/-1"><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Attentes</div><div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.6">${d.persona.attentes}</div></div>
      </div>
    </div>`;

    html += `
    <div class="mh-sep">
      ${sectionTitle('06','Analyse Concurrentielle')}
      ${d.concurrents.map(c => `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:14px"><div style="font-weight:700;font-size:13px;color:#fff;min-width:130px">${c.nom}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);flex:1">${c.desc}</div><div style="font-size:11px;padding:2px 10px;border-radius:20px;white-space:nowrap;background:${c.menace==='haute'?'rgba(248,65,65,0.15)':c.menace==='moyenne'?'rgba(251,191,36,0.15)':'rgba(52,211,153,0.15)'};color:${c.menace==='haute'?'#f87171':c.menace==='moyenne'?'#fbbf24':'#34d399'}">${c.menace}</div></div>`).join('')}
    </div>`;

    if (d.acquisition) html += `
    <div class="mh-sep">
      ${sectionTitle('07','Stratégie d\'Acquisition')}
      ${d.acquisition.map(a => `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 16px;margin-bottom:8px;display:grid;grid-template-columns:140px 1fr auto;align-items:center;gap:12px"><div style="font-weight:700;font-size:13px;color:#fff">${a.canal}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5">${a.desc}</div><div style="font-family:'DM Mono',monospace;font-size:11px;color:#9db8f8;white-space:nowrap">CAC ${a.cac}</div></div>`).join('')}
    </div>`;

    html += `
    <div class="mh-sep">
      ${sectionTitle('08','Plan d\'Action 90 Jours')}
      ${d.actions.map(a => `<div style="display:grid;grid-template-columns:90px 1fr;border-bottom:1px solid rgba(255,255,255,0.05);padding:12px 0"><div style="font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;color:#9db8f8;letter-spacing:.1em;display:flex;align-items:center">${a.phase}</div><div style="padding-left:14px"><div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:4px">${a.titre}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6">${a.detail}</div></div></div>`).join('')}
    </div>`;

    if (d.investissements) html += `
    <div class="mh-sep">
      ${sectionTitle('09','Budget & Investissements')}
      ${d.investissements.map(i => `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:6px;background:${i.total?'rgba(107,143,239,0.1)':'rgba(255,255,255,0.03)'};border:${i.total?'1px solid rgba(107,143,239,0.25)':'none'};margin-bottom:4px"><div style="font-size:13px;color:${i.total?'#9db8f8':'rgba(255,255,255,0.75)'};font-weight:${i.total?700:400}">${i.label}</div><div style="font-family:'DM Mono',monospace;font-size:13px;color:${i.total?'#9db8f8':'#fff'};font-weight:600">${i.montant}</div></div>`).join('')}
    </div>`;

    if (d.outils) html += `
    <div class="mh-sep">
      ${sectionTitle('10','Outils Recommandés')}
      <div style="display:grid;grid-template-columns:repeat(${d.outils.length > 3 ? 2 : d.outils.length},1fr);gap:8px">
        ${d.outils.map(o => `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:13px"><div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:3px">${o.nom}</div><div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.4;margin-bottom:8px">${o.usage}</div><span style="font-family:'DM Mono',monospace;font-size:10px;color:#9db8f8;background:rgba(107,143,239,0.1);padding:2px 8px;border-radius:20px">${o.prix}</span></div>`).join('')}
      </div>
    </div>`;

    if (d.risques) html += `
    <div class="mh-sep">
      ${sectionTitle('11','Risques & Mitigation')}
      ${d.risques.map(r => `<div style="background:rgba(167,139,250,0.05);border:1px solid rgba(167,139,250,0.18);border-left:3px solid #a78bfa;border-radius:0 8px 8px 0;padding:13px 16px;margin-bottom:8px"><div style="font-weight:700;font-size:13px;color:#c4b5fd;margin-bottom:5px">${r.titre}</div><div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6"><strong>Solution :</strong> ${r.solution}</div></div>`).join('')}
    </div>`;

    if (d.emails) html += `
    <div class="mh-sep">
      ${sectionTitle('12','Emails de Prospection')}
      ${d.emails.map(e => `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:14px 16px;margin-bottom:10px"><div style="font-family:'DM Mono',monospace;font-size:9px;color:rgba(107,143,239,0.7);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">${e.type}</div><div style="font-size:12px;font-weight:600;color:#ecedf2;margin-bottom:6px">Objet : ${e.sujet}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.65;font-style:italic">"${e.extrait}"</div></div>`).join('')}
    </div>`;

    if (d.admin) html += `
    <div class="mh-sep">
      ${sectionTitle('13','Démarches Administratives')}
      ${d.admin.map(a => `<div style="display:grid;grid-template-columns:180px 60px 1fr;gap:12px;padding:11px 14px;border-radius:7px;background:rgba(255,255,255,0.03);margin-bottom:4px;align-items:center"><div style="font-weight:600;font-size:13px;color:#fff">${a.etape}</div><div style="font-family:'DM Mono',monospace;font-size:10px;color:#9db8f8">${a.delai}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5">${a.desc}</div></div>`).join('')}
    </div>`;

    if (d.chat) html += `
    <div style="background:linear-gradient(135deg,rgba(107,143,239,0.1),rgba(167,139,250,0.06));border:1px solid rgba(107,143,239,0.25);border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:300;color:#ecedf2;margin-bottom:8px">Conseiller Eadee — Inclus dans ton plan</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.75;margin-bottom:16px">Après génération, ton Expert EADEE connaît <strong style="color:rgba(255,255,255,0.8)">toutes les données de ton plan</strong>. Il peut modifier, affiner, conseiller en temps réel.</div>
      <div style="background:rgba(0,0,0,0.25);border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:10px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,rgba(167,139,250,0.3),rgba(107,143,239,0.2));border:1px solid rgba(167,139,250,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M18 9c0 4-3.6 7-8 7a8.8 8.8 0 01-3.5-.7L2 17l1.7-4A6.5 6.5 0 012 9c0-4 3.6-7 8-7s8 3 8 7z" stroke="#a78bfa" stroke-width="1.8" stroke-linejoin="round"/></svg></div><div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px 12px 12px 4px;padding:10px 14px;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.65">J'ai analysé DevAgence Pro. Ta marge estimée de 72% est solide. Je recommande de prioriser LinkedIn avant le SEO — le ROI est 3x plus rapide en phase de démarrage.</div></div>
        <div style="display:flex;justify-content:flex-end"><div style="background:rgba(107,143,239,0.12);border:1px solid rgba(107,143,239,0.22);border-radius:12px 12px 4px 12px;padding:10px 14px;font-size:13px;color:#9db8f8">Comment je signe mes 5 premiers clients ?</div></div>
      </div>
    </div>`;
  }

  const _planCfg = (typeof PLANS_CONFIG !== 'undefined' && PLANS_CONFIG[plan]) || { label: plan };
  html += `<button class="preview-cta" onclick="closePlanPreview();selectPlan('${plan}')">
    Acheter ${_planCfg.label}
  </button>`;

  body.innerHTML = html;
  modal.style.display = 'flex';
}

function closePlanPreview() {
  document.getElementById('planPreviewModal').style.display = 'none';
}


function initChat() {
  const link = document.getElementById('chat-sidebar-link');
  if (link) link.style.display = 'flex';
  const mobChat = document.getElementById('mob-chat');
  if (mobChat) mobChat.style.display = 'flex';
}

function setMobActive(view) {
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('mob-' + view);
  if (btn) btn.classList.add('active');
}

