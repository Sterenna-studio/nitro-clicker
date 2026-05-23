import { requireAuth } from '/shared/guards.js';
import { getProfile, getDisplayNameFromUser } from '/shared/profile.js';
import {
  UPGRADES,
  applyOfflineProgress,
  buyUpgrade,
  clickCore,
  doPrestige,
  prestigeRequirement,
  tickPassive,
  upgradeCost,
} from './clicker-state.js';
import { deleteLocalSave, loadSave, saveAll } from './clicker-save.js';

const app = document.getElementById('app');

let auth;
let profile;
let state;
let userId;
let saveTimer;
let lastTick = performance.now();
let lastUpgradeSignature = '';

function fmt(value) {
  return Math.floor(Number(value ?? 0)).toLocaleString('fr-FR');
}

function toast(message) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2600);
}

function renderShell() {
  const name = getDisplayNameFromUser(auth.user, profile);
  app.innerHTML = `
    <header class="topbar">
      <div>
        <h1 class="brand-title">NITRO <span>CLICKER</span></h1>
        <div class="brand-sub">// AGENT ${name.toUpperCase()} · LOCAL CORE ENERGY LOOP</div>
      </div>
      <nav class="top-actions">
        <a href="/star/" class="nav-btn">⬡ STAR</a>
        <a href="/" class="nav-btn">← HUB</a>
      </nav>
    </header>

    <section class="stats-grid">
      <article class="stat-card"><div class="stat-label">ÉNERGIE</div><div class="stat-value primary" id="stat-energy">0</div></article>
      <article class="stat-card"><div class="stat-label">PAR CLIC</div><div class="stat-value" id="stat-click">1</div></article>
      <article class="stat-card"><div class="stat-label">AUTO / SEC</div><div class="stat-value" id="stat-passive">0</div></article>
      <article class="stat-card"><div class="stat-label">PRESTIGE</div><div class="stat-value accent" id="stat-prestige">0</div></article>
    </section>

    <section class="game-grid">
      <article class="panel core-panel" id="core-panel">
        <button class="click-core" id="click-core" aria-label="Cliquer le noyau Nitro">
          ⬡
          <small>CLICK CORE</small>
        </button>
      </article>

      <aside class="panel">
        <h2 class="panel-title">UPGRADES</h2>
        <div class="upgrade-list" id="upgrade-list"></div>

        <h2 class="panel-title" style="margin-top:22px">PRESTIGE</h2>
        <button class="upgrade-btn" id="prestige-btn">
          <div class="upgrade-head"><span class="upgrade-name">✦ Réinitialiser le noyau</span><span class="upgrade-cost" id="prestige-cost"></span></div>
          <div class="upgrade-desc">Repart à zéro avec +1 puissance de base et un petit bonus passif permanent.</div>
        </button>

        <div class="save-row">
          <button class="action-btn" id="save-btn">💾 SAUVER LOCAL</button>
          <button class="action-btn danger" id="reset-btn">⚠ RESET LOCAL</button>
        </div>
      </aside>
    </section>
  `;

  document.getElementById('click-core').addEventListener('click', event => {
    const gain = clickCore(state);
    spawnPop(event.clientX, event.clientY, `+${fmt(gain)}`);
    renderStats();
    refreshUpgradesIfNeeded();
    scheduleSave();
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    const ok = saveAll(userId, state);
    toast(ok ? 'Sauvegarde locale OK.' : 'Sauvegarde locale impossible.');
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Reset la sauvegarde locale de Nitro Clicker ?')) return;
    deleteLocalSave(userId);
    location.reload();
  });

  document.getElementById('prestige-btn').addEventListener('click', () => {
    const result = doPrestige(state);
    if (!result.ok) return toast('Prestige pas encore prêt. Continue à charger le noyau.');
    state = result.state;
    saveAll(userId, state);
    renderAll();
    toast('Prestige activé. Noyau réinitialisé.');
  });

  renderAll();
}

function spawnPop(x, y, text) {
  const pop = document.createElement('div');
  pop.className = 'float-pop';
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  pop.textContent = text;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
}

function renderAll() {
  renderStats();
  renderUpgrades();
}

function renderStats() {
  document.getElementById('stat-energy').textContent = fmt(state.energy);
  document.getElementById('stat-click').textContent = fmt(state.clickPower);
  document.getElementById('stat-passive').textContent = `${Number(state.passiveRate ?? 0).toFixed(2)}`;
  document.getElementById('stat-prestige').textContent = fmt(state.prestige);
  const req = prestigeRequirement(state);
  const btn = document.getElementById('prestige-btn');
  document.getElementById('prestige-cost').textContent = `${fmt(state.totalEnergy)} / ${fmt(req)}`;
  btn.disabled = state.totalEnergy < req;
}

function getUpgradeSignature() {
  return UPGRADES.map(upgrade => {
    const level = state.upgrades[upgrade.id] ?? 0;
    const cost = upgradeCost(upgrade, level);
    return `${upgrade.id}:${level}:${state.energy >= cost ? 1 : 0}`;
  }).join('|');
}

function refreshUpgradesIfNeeded() {
  const signature = getUpgradeSignature();
  if (signature === lastUpgradeSignature) return;
  renderUpgrades();
}

function renderUpgrades() {
  const root = document.getElementById('upgrade-list');
  lastUpgradeSignature = getUpgradeSignature();
  root.innerHTML = UPGRADES.map(upgrade => {
    const level = state.upgrades[upgrade.id] ?? 0;
    const cost = upgradeCost(upgrade, level);
    const canBuy = state.energy >= cost;
    return `
      <button class="upgrade-btn ${canBuy ? 'can-buy' : ''}" data-upgrade="${upgrade.id}" ${canBuy ? '' : 'disabled'}>
        <div class="upgrade-head">
          <span class="upgrade-name">${upgrade.icon} ${upgrade.name} <small>Lv.${level}</small></span>
          <span class="upgrade-cost">${fmt(cost)} E</span>
        </div>
        <div class="upgrade-desc">${upgrade.desc}</div>
      </button>`;
  }).join('');

  root.querySelectorAll('[data-upgrade]').forEach(btn => {
    btn.addEventListener('click', () => {
      const result = buyUpgrade(state, btn.dataset.upgrade);
      if (!result.ok) return toast('Énergie insuffisante.');
      renderAll();
      scheduleSave();
      toast(`Upgrade acheté · niveau ${result.level}`);
    });
  });
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveAll(userId, state), 900);
}

function startLoop() {
  lastTick = performance.now();
  setInterval(() => {
    const now = performance.now();
    const delta = Math.min(2, (now - lastTick) / 1000);
    lastTick = now;
    if (state.passiveRate > 0) {
      tickPassive(state, delta);
      renderStats();
      refreshUpgradesIfNeeded();
    }
  }, 1000);

  setInterval(() => saveAll(userId, state), 15000);
}

async function init() {
  auth = await requireAuth({ redirectTo: '/login.html' });
  if (!auth) return;

  userId = auth.user.id;
  profile = await getProfile(userId);
  state = loadSave(userId);
  const offlineGain = applyOfflineProgress(state);

  renderShell();
  startLoop();
  if (offlineGain > 0) toast(`Progression hors-ligne : +${fmt(offlineGain)} énergie.`);
}

init().catch(error => {
  console.error('[Nitro Clicker] init failed:', error);
  app.innerHTML = `<section class="auth-error-panel"><div><h1>Erreur Nitro Clicker</h1><p>${error?.message ?? error}</p><a class="nav-btn" href="/star/">Retour Star</a></div></section>`;
});
