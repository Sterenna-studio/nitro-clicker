import { UPGRADES, MILESTONES, SCALING_LAYERS } from './clicker-state.js';

const SNAPSHOT_PREFIX = 'nitro-clicker.save.';
let mounted = false;
let activePanel = 'pause';

function fmt(value) {
  const n = Math.floor(Number(value ?? 0));
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 100_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

function readSnapshot() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(SNAPSHOT_PREFIX));
  let best = null;
  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (!best || (data?.updatedAt ?? 0) > (best?.updatedAt ?? 0)) best = data;
    } catch {}
  }
  return best ?? {};
}

function liveText(id, fallback = '0') {
  return document.getElementById(id)?.textContent?.trim() || fallback;
}

function mountAuxPanels() {
  if (mounted) return;
  const top = document.querySelector('.top-actions');
  const shell = document.querySelector('.clicker-shell');
  if (!top || !shell) return;
  mounted = true;

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'nav-btn';
  pauseBtn.type = 'button';
  pauseBtn.id = 'open-pause-panel';
  pauseBtn.textContent = '⏸ PAUSE';

  const statsBtn = document.createElement('button');
  statsBtn.className = 'nav-btn';
  statsBtn.type = 'button';
  statsBtn.id = 'open-stats-panel';
  statsBtn.textContent = '📊 STATS';

  top.prepend(statsBtn);
  top.prepend(pauseBtn);

  document.body.insertAdjacentHTML('beforeend', renderOverlay());
  bindOverlay();

  pauseBtn.addEventListener('click', () => openPanel('pause'));
  statsBtn.addEventListener('click', () => openPanel('stats'));
  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'p') openPanel('pause');
    if (event.key === 'Escape') closePanel();
  });

  injectPeripheralVisuals();
}

function renderOverlay() {
  return `
    <div class="nc-overlay" id="nc-overlay" aria-hidden="true">
      <div class="nc-overlay-backdrop" data-close-panel></div>
      <section class="nc-panel" role="dialog" aria-modal="true" aria-label="Nitro Clicker pause et statistiques">
        <header class="nc-panel-head">
          <div>
            <div class="nc-panel-kicker">// NITRO CLICKER · CONTROL ROOM</div>
            <h2 id="nc-panel-title">Pause</h2>
          </div>
          <button class="nc-panel-close" type="button" data-close-panel>×</button>
        </header>
        <nav class="nc-tabs" aria-label="Panneau Nitro Clicker">
          <button class="nc-tab active" data-panel-tab="pause" type="button">Pause</button>
          <button class="nc-tab" data-panel-tab="stats" type="button">Stats</button>
          <button class="nc-tab" data-panel-tab="guide" type="button">Guide</button>
          <button class="nc-tab" data-panel-tab="unlocks" type="button">Unlocks</button>
        </nav>
        <div class="nc-panel-body" id="nc-panel-body"></div>
      </section>
    </div>
  `;
}

function bindOverlay() {
  document.querySelectorAll('[data-close-panel]').forEach(node => node.addEventListener('click', closePanel));
  document.querySelectorAll('[data-panel-tab]').forEach(btn => {
    btn.addEventListener('click', () => openPanel(btn.dataset.panelTab));
  });
}

function openPanel(panel = 'pause') {
  activePanel = panel;
  const overlay = document.getElementById('nc-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('nc-paused');
  renderPanelBody();
}

function closePanel() {
  const overlay = document.getElementById('nc-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('nc-paused');
}

function renderPanelBody() {
  document.querySelectorAll('[data-panel-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.panelTab === activePanel));
  const title = document.getElementById('nc-panel-title');
  const body = document.getElementById('nc-panel-body');
  if (!body || !title) return;

  const titles = { pause: 'Pause', stats: 'Statistiques', guide: 'Guide du jeu', unlocks: 'Déblocages' };
  title.textContent = titles[activePanel] ?? 'Pause';

  if (activePanel === 'stats') body.innerHTML = renderStatsPanel();
  else if (activePanel === 'guide') body.innerHTML = renderGuidePanel();
  else if (activePanel === 'unlocks') body.innerHTML = renderUnlockPanel();
  else body.innerHTML = renderPausePanel();
}

function renderPausePanel() {
  const s = readSnapshot();
  return `
    <div class="nc-pause-hero">
      <div class="nc-pause-core">⬡</div>
      <div>
        <h3>Noyau en veille contrôlée</h3>
        <p>Le jeu continue à tourner localement. Tu peux reprendre, sauvegarder, consulter les règles ou vérifier ton scaling.</p>
      </div>
    </div>
    <div class="nc-action-grid">
      <button class="nc-action primary" type="button" onclick="document.getElementById('nc-overlay').classList.remove('open');document.body.classList.remove('nc-paused')">▶ Reprendre</button>
      <button class="nc-action" type="button" onclick="document.getElementById('save-btn')?.click()">💾 Sauver local</button>
      <button class="nc-action" type="button" onclick="document.querySelector('[data-panel-tab=guide]')?.click()">📘 Comprendre le jeu</button>
      <button class="nc-action danger" type="button" onclick="document.getElementById('reset-btn')?.click()">⚠ Reset local</button>
    </div>
    <div class="nc-mini-grid">
      ${metric('Énergie', liveText('stat-energy', fmt(s.energy)))}
      ${metric('Fragments', liveText('stat-fragments', fmt(s.fragments)))}
      ${metric('Prestige', liveText('stat-prestige', fmt(s.prestige)))}
      ${metric('Échelle', liveText('stat-layer', 'CORE'))}
    </div>
  `;
}

function renderStatsPanel() {
  const s = readSnapshot();
  const upgradesTotal = Object.values(s.upgrades ?? {}).reduce((a, b) => a + Number(b ?? 0), 0);
  const milestonesDone = Object.keys(s.milestones ?? {}).length;
  const layer = getLayerFromPrestige(s.prestige ?? 0);
  return `
    <div class="nc-mini-grid wide">
      ${metric('Énergie actuelle', liveText('stat-energy', fmt(s.energy)))}
      ${metric('Énergie totale', fmt(s.totalEnergy))}
      ${metric('Fragments Nitro', liveText('stat-fragments', fmt(s.fragments)))}
      ${metric('Fragments gagnés', fmt(s.totalFragments))}
      ${metric('Puissance clic', liveText('stat-click', fmt(s.clickPower)))}
      ${metric('Auto / sec', liveText('stat-passive', Number(s.passiveRate ?? 0).toFixed(2)))}
      ${metric('Clics totaux', fmt(s.totalClicks))}
      ${metric('Upgrades achetés', fmt(upgradesTotal))}
      ${metric('Milestones', `${milestonesDone}/${MILESTONES.length}`)}
      ${metric('Prestige', liveText('stat-prestige', fmt(s.prestige)))}
      ${metric('Échelle', layer.name)}
      ${metric('Usines', liveText('stat-factory', fmt(s.factoryRate)))}
    </div>
    <h3 class="nc-subtitle">Niveaux d’upgrades</h3>
    <div class="nc-upgrade-stats">
      ${UPGRADES.map(up => `<div><span>${up.icon} ${up.name}</span><strong>Lv.${s.upgrades?.[up.id] ?? 0}</strong></div>`).join('')}
    </div>
  `;
}

function renderGuidePanel() {
  return `
    <div class="nc-guide-grid">
      ${guideCard('⬡', 'Cliquer le noyau', 'Chaque clic produit de l’énergie. Plus tu achètes d’amplificateurs, plus chaque clic devient puissant.')}
      ${guideCard('🧬', 'Surcharge', 'La jauge de surcharge se remplit avec les clics. À 100%, elle déclenche un Overdrive avec un gros gain et une chance de fragment.')}
      ${guideCard('💠', 'Fragments Nitro', 'Ressource permanente. Elle survit au prestige et sert aux upgrades plus rares comme le Catalyseur de fragments.')}
      ${guideCard('✦', 'Prestige', 'Quand ton énergie totale atteint le seuil, tu peux reset ton run pour gagner des fragments et augmenter ton scaling.')}
      ${guideCard('🏭', 'Dézoom', 'À certains prestiges, le jeu change d’échelle : noyau unique, baie moteur, usine, district puis anneau orbital.')}
      ${guideCard('◇', 'Milestones', 'Objectifs courts qui donnent énergie ou fragments. Ils servent de fil rouge pour comprendre la progression.')}
    </div>
  `;
}

function renderUnlockPanel() {
  return `
    <h3 class="nc-subtitle">Échelles de prestige</h3>
    <div class="nc-unlock-list">
      ${SCALING_LAYERS.map(layer => `<div><span>${layer.short}</span><strong>${layer.name}</strong><em>Prestige ${layer.prestige}</em><small>${layer.desc}</small></div>`).join('')}
    </div>
    <h3 class="nc-subtitle">Upgrades & conditions</h3>
    <div class="nc-unlock-list">
      ${UPGRADES.map(up => `<div><span>${up.icon}</span><strong>${up.name}</strong><em>${up.currency === 'fragments' ? 'Fragments' : 'Énergie'} · Tier ${up.tier}</em><small>${up.lockedText ?? 'Disponible dès le départ.'}</small></div>`).join('')}
    </div>
  `;
}

function metric(label, value) {
  return `<div class="nc-metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function guideCard(icon, title, text) {
  return `<article class="nc-guide-card"><div>${icon}</div><h3>${title}</h3><p>${text}</p></article>`;
}

function getLayerFromPrestige(prestige) {
  return [...SCALING_LAYERS].reverse().find(layer => Number(prestige ?? 0) >= layer.prestige) ?? SCALING_LAYERS[0];
}

function injectPeripheralVisuals() {
  const core = document.getElementById('core-panel');
  if (!core || document.getElementById('peripheral-ring')) return;
  core.insertAdjacentHTML('afterbegin', `
    <div class="peripheral-ring" id="peripheral-ring" aria-hidden="true">
      ${Array.from({ length: 16 }, (_, i) => `<span style="--i:${i};--a:${i * 22.5}deg"></span>`).join('')}
    </div>
    <div class="bio-cable-grid" aria-hidden="true">
      ${Array.from({ length: 12 }, (_, i) => `<i style="--i:${i};--x:${8 + (i * 11) % 84}%;--d:${(-i * .13).toFixed(2)}s"></i>`).join('')}
    </div>
  `);
}

const boot = setInterval(() => {
  mountAuxPanels();
  if (mounted) clearInterval(boot);
}, 250);
