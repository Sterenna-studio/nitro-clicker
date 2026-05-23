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
const FX_KEY = 'nitro-clicker.fx.enabled';

let auth;
let profile;
let state;
let userId;
let saveTimer;
let lastTick = performance.now();
let lastUpgradeSignature = '';
let fxEnabled = localStorage.getItem(FX_KEY) !== 'false';
let audioCtx = null;
let lastEnergyPulse = 0;

const FX = {
  ctx() {
    if (!fxEnabled) return null;
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  },
  tone(freq = 440, type = 'sine', vol = 0.05, dur = 0.08) {
    const ctx = this.ctx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  },
  click() { this.tone(660 + Math.random() * 120, 'triangle', 0.035, 0.055); },
  ready() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.055, 0.09), i * 55)); },
  buy() { [392, 523, 659, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 'triangle', 0.065, 0.11), i * 58)); },
  prestige() { [262, 392, 523, 784, 1047, 1568].forEach((f, i) => setTimeout(() => this.tone(f, i % 2 ? 'triangle' : 'square', 0.055, 0.13), i * 70)); },
};

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
  app.classList.toggle('fx-disabled', !fxEnabled);
  app.innerHTML = `
    <header class="topbar">
      <div>
        <h1 class="brand-title">NITRO <span>CLICKER</span></h1>
        <div class="brand-sub">// AGENT ${name.toUpperCase()} · LOCAL CORE ENERGY LOOP</div>
      </div>
      <nav class="top-actions">
        <button class="nav-btn" id="fx-toggle" type="button">${fxEnabled ? '✨ FX ON' : 'FX OFF'}</button>
        <a href="/star/" class="nav-btn">⬡ STAR</a>
        <a href="/" class="nav-btn">← HUB</a>
      </nav>
    </header>

    <section class="stats-grid">
      <article class="stat-card energy-stat"><div class="stat-label">ÉNERGIE</div><div class="stat-value primary" id="stat-energy">0</div><div class="stat-meter"><span id="meter-energy"></span></div></article>
      <article class="stat-card"><div class="stat-label">PAR CLIC</div><div class="stat-value" id="stat-click">1</div><div class="stat-meter small"><span id="meter-click"></span></div></article>
      <article class="stat-card"><div class="stat-label">AUTO / SEC</div><div class="stat-value" id="stat-passive">0</div><div class="stat-meter small"><span id="meter-passive"></span></div></article>
      <article class="stat-card"><div class="stat-label">PRESTIGE</div><div class="stat-value accent" id="stat-prestige">0</div><div class="stat-meter accent"><span id="meter-prestige"></span></div></article>
    </section>

    <section class="game-grid">
      <article class="panel core-panel" id="core-panel">
        <div class="energy-field" id="energy-field" aria-hidden="true"></div>
        <div class="module-orbit" id="module-orbit" aria-hidden="true"></div>
        <button class="click-core" id="click-core" aria-label="Cliquer le noyau Nitro">
          <span class="core-rings"></span>
          <span class="core-glyph">⬡</span>
          <small>CLICK CORE</small>
        </button>
        <div class="reactor-gauges" aria-hidden="true">
          <div class="reactor-gauge"><span id="reactor-a"></span></div>
          <div class="reactor-gauge"><span id="reactor-b"></span></div>
          <div class="reactor-gauge"><span id="reactor-c"></span></div>
        </div>
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

  document.getElementById('fx-toggle').addEventListener('click', () => {
    fxEnabled = !fxEnabled;
    localStorage.setItem(FX_KEY, String(fxEnabled));
    app.classList.toggle('fx-disabled', !fxEnabled);
    document.getElementById('fx-toggle').textContent = fxEnabled ? '✨ FX ON' : 'FX OFF';
    if (fxEnabled) FX.ready();
  });

  document.getElementById('click-core').addEventListener('click', event => {
    const gain = clickCore(state);
    FX.click();
    spawnPop(event.clientX, event.clientY, `+${fmt(gain)}`);
    spawnEnergyBurst(event.clientX, event.clientY, Math.min(9, 3 + Math.floor(gain / 3)));
    pulseReactor();
    renderStats();
    refreshUpgradesIfNeeded(true);
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
    FX.prestige();
    saveAll(userId, state);
    renderAll();
    spawnSystemWave('PRESTIGE +1');
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

function spawnEnergyBurst(x, y, count = 5) {
  if (!fxEnabled) return;
  const field = document.getElementById('energy-field');
  const panel = document.getElementById('core-panel');
  if (!field || !panel) return;
  const rect = panel.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'energy-particle';
    p.style.left = `${x - rect.left}px`;
    p.style.top = `${y - rect.top}px`;
    p.style.setProperty('--dx', `${(Math.random() * 2 - 1) * 160}px`);
    p.style.setProperty('--dy', `${-80 - Math.random() * 150}px`);
    p.style.setProperty('--delay', `${Math.random() * 90}ms`);
    field.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
}

function pulseReactor() {
  if (!fxEnabled) return;
  const core = document.getElementById('click-core');
  core?.classList.remove('pulse-hit');
  requestAnimationFrame(() => core?.classList.add('pulse-hit'));
}

function spawnModule(upgradeId, level) {
  if (!fxEnabled) return;
  const orbit = document.getElementById('module-orbit');
  if (!orbit) return;
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  const node = document.createElement('div');
  node.className = 'spawned-module';
  node.textContent = upgrade?.icon ?? '◆';
  node.title = `${upgrade?.name ?? upgradeId} Lv.${level}`;
  node.style.setProperty('--angle', `${Math.random() * 360}deg`);
  node.style.setProperty('--radius', `${118 + Math.random() * 82}px`);
  orbit.appendChild(node);
  while (orbit.children.length > 18) orbit.firstElementChild.remove();
}

function spawnSystemWave(text) {
  if (!fxEnabled) return;
  const panel = document.getElementById('core-panel');
  if (!panel) return;
  const node = document.createElement('div');
  node.className = 'system-wave';
  node.textContent = text;
  panel.appendChild(node);
  setTimeout(() => node.remove(), 1600);
}

function renderAll() {
  renderStats();
  renderUpgrades();
  renderModules();
}

function getNextAffordableCost() {
  return Math.min(...UPGRADES.map(upgrade => upgradeCost(upgrade, state.upgrades[upgrade.id] ?? 0)));
}

function renderStats() {
  document.getElementById('stat-energy').textContent = fmt(state.energy);
  document.getElementById('stat-click').textContent = fmt(state.clickPower);
  document.getElementById('stat-passive').textContent = `${Number(state.passiveRate ?? 0).toFixed(2)}`;
  document.getElementById('stat-prestige').textContent = fmt(state.prestige);

  const nextCost = getNextAffordableCost();
  const energyRatio = Math.min(1, state.energy / Math.max(1, nextCost));
  setMeter('meter-energy', energyRatio);
  setMeter('meter-click', Math.min(1, state.clickPower / 50));
  setMeter('meter-passive', Math.min(1, state.passiveRate / 25));

  const req = prestigeRequirement(state);
  const prestigeRatio = Math.min(1, state.totalEnergy / Math.max(1, req));
  setMeter('meter-prestige', prestigeRatio);
  setMeter('reactor-a', energyRatio);
  setMeter('reactor-b', Math.min(1, (state.clickPower + state.passiveRate) / 75));
  setMeter('reactor-c', prestigeRatio);

  const btn = document.getElementById('prestige-btn');
  document.getElementById('prestige-cost').textContent = `${fmt(state.totalEnergy)} / ${fmt(req)}`;
  btn.disabled = state.totalEnergy < req;
}

function setMeter(id, ratio) {
  const node = document.getElementById(id);
  if (node) node.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
}

function getUpgradeSignature() {
  return UPGRADES.map(upgrade => {
    const level = state.upgrades[upgrade.id] ?? 0;
    const cost = upgradeCost(upgrade, level);
    return `${upgrade.id}:${level}:${state.energy >= cost ? 1 : 0}`;
  }).join('|');
}

function refreshUpgradesIfNeeded(playReadySound = false) {
  const previous = lastUpgradeSignature;
  const signature = getUpgradeSignature();
  if (signature === previous) return;
  const becameReady = playReadySound && previous && signature.split('|').some((part, idx) => {
    const prev = previous.split('|')[idx] ?? '';
    return prev.endsWith(':0') && part.endsWith(':1');
  });
  renderUpgrades();
  if (becameReady) FX.ready();
}

function renderUpgrades() {
  const root = document.getElementById('upgrade-list');
  lastUpgradeSignature = getUpgradeSignature();
  root.innerHTML = UPGRADES.map(upgrade => {
    const level = state.upgrades[upgrade.id] ?? 0;
    const cost = upgradeCost(upgrade, level);
    const canBuy = state.energy >= cost;
    const progress = Math.min(1, state.energy / Math.max(1, cost));
    return `
      <button class="upgrade-btn ${canBuy ? 'can-buy' : ''}" data-upgrade="${upgrade.id}" ${canBuy ? '' : 'disabled'}>
        <span class="upgrade-fill" style="transform:scaleX(${progress})"></span>
        <div class="upgrade-head">
          <span class="upgrade-name">${upgrade.icon} ${upgrade.name} <small>Lv.${level}</small></span>
          <span class="upgrade-cost">${fmt(cost)} E</span>
        </div>
        <div class="upgrade-desc">${upgrade.desc}</div>
      </button>`;
  }).join('');

  root.querySelectorAll('[data-upgrade]').forEach(btn => {
    btn.addEventListener('click', event => {
      const result = buyUpgrade(state, btn.dataset.upgrade);
      if (!result.ok) return toast('Énergie insuffisante.');
      FX.buy();
      spawnModule(btn.dataset.upgrade, result.level);
      spawnEnergyBurst(event.clientX, event.clientY, 12);
      renderAll();
      scheduleSave();
      toast(`Upgrade acheté · niveau ${result.level}`);
    });
  });
}

function renderModules() {
  const orbit = document.getElementById('module-orbit');
  if (!orbit) return;
  orbit.innerHTML = '';
  for (const upgrade of UPGRADES) {
    const level = state.upgrades[upgrade.id] ?? 0;
    const count = Math.min(5, level);
    for (let i = 0; i < count; i++) {
      const node = document.createElement('div');
      node.className = 'spawned-module persistent';
      node.textContent = upgrade.icon;
      node.title = `${upgrade.name} Lv.${level}`;
      node.style.setProperty('--angle', `${((i + 1) / (count + 1)) * 360 + UPGRADES.indexOf(upgrade) * 35}deg`);
      node.style.setProperty('--radius', `${116 + UPGRADES.indexOf(upgrade) * 22}px`);
      orbit.appendChild(node);
    }
  }
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
      refreshUpgradesIfNeeded(true);
      if (fxEnabled && now - lastEnergyPulse > 1800) {
        lastEnergyPulse = now;
        const panel = document.getElementById('core-panel')?.getBoundingClientRect();
        if (panel) spawnEnergyBurst(panel.left + panel.width * 0.5, panel.top + panel.height * 0.5, Math.min(5, Math.ceil(state.passiveRate)));
      }
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
