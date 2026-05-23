import { requireAuth } from '/shared/guards.js';
import { getProfile, getDisplayNameFromUser } from '/shared/profile.js';
import {
  UPGRADES,
  applyOfflineProgress,
  buyUpgradeAmount,
  checkAndClaimMilestones,
  clickCore,
  doPrestige,
  getCurrency,
  getScalingLayer,
  getVisibleMilestones,
  isUpgradeUnlocked,
  prestigeRequirement,
  tickPassive,
  upgradeBulkCost,
  upgradeCost,
} from './clicker-state.js';
import { deleteLocalSave, loadSave, saveAll } from './clicker-save.js';

const app = document.getElementById('app');
const FX_KEY = 'nitro-clicker.fx.enabled';
const BUY_MULT_KEY = 'nitro-clicker.buy.multiplier';
const BUY_MULTIPLIERS = [1, 5, 10];

let auth;
let profile;
let state;
let userId;
let saveTimer;
let lastTick = performance.now();
let lastUpgradeSignature = '';
let lastLayerId = '';
let fxEnabled = localStorage.getItem(FX_KEY) !== 'false';
let buyMultiplier = Number(localStorage.getItem(BUY_MULT_KEY) || 1);
if (!BUY_MULTIPLIERS.includes(buyMultiplier)) buyMultiplier = 1;
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
  zap() { [880, 1240, 660].forEach((f, i) => setTimeout(() => this.tone(f + Math.random() * 80, 'sawtooth', 0.035, 0.045), i * 28)); },
  ready() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.055, 0.09), i * 55)); },
  buy() { [392, 523, 659, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 'triangle', 0.065, 0.11), i * 58)); },
  milestone() { [784, 988, 1175].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.055, 0.12), i * 70)); },
  overdrive() { [110, 220, 440, 880, 1760].forEach((f, i) => setTimeout(() => this.tone(f, i < 2 ? 'sawtooth' : 'square', 0.045, 0.09), i * 42)); },
  prestige() { [262, 392, 523, 784, 1047, 1568].forEach((f, i) => setTimeout(() => this.tone(f, i % 2 ? 'triangle' : 'square', 0.055, 0.13), i * 70)); },
};

function fmt(value) {
  const n = Math.floor(Number(value ?? 0));
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 100_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

function currencyLabel(currency) {
  return currency === 'fragments' ? 'F' : 'E';
}

function toast(message) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2800);
}

function renderShell() {
  const name = getDisplayNameFromUser(auth.user, profile);
  app.classList.toggle('fx-disabled', !fxEnabled);
  app.innerHTML = `
    <svg class="lightning-layer" id="lightning-layer" aria-hidden="true"></svg>
    <header class="topbar">
      <div>
        <h1 class="brand-title">NITRO <span>CLICKER</span></h1>
        <div class="brand-sub">// AGENT ${name.toUpperCase()} · PROGRESSION PAR ÉCHELLES</div>
      </div>
      <nav class="top-actions">
        <button class="nav-btn" id="fx-toggle" type="button">${fxEnabled ? '✨ FX ON' : 'FX OFF'}</button>
        <a href="/star/" class="nav-btn">⬡ STAR</a>
        <a href="/" class="nav-btn">← HUB</a>
      </nav>
    </header>

    <section class="stats-grid stats-grid-extended">
      <article class="stat-card energy-stat"><div class="stat-label">ÉNERGIE</div><div class="stat-value primary" id="stat-energy">0</div><div class="stat-meter"><span id="meter-energy"></span></div></article>
      <article class="stat-card"><div class="stat-label">FRAGMENTS</div><div class="stat-value fragment" id="stat-fragments">0</div><div class="stat-meter fragment"><span id="meter-fragments"></span></div></article>
      <article class="stat-card"><div class="stat-label">PAR CLIC</div><div class="stat-value" id="stat-click">1</div><div class="stat-meter small"><span id="meter-click"></span></div></article>
      <article class="stat-card"><div class="stat-label">AUTO / SEC</div><div class="stat-value" id="stat-passive">0</div><div class="stat-meter small"><span id="meter-passive"></span></div></article>
      <article class="stat-card"><div class="stat-label">SURCHARGE</div><div class="stat-value danger" id="stat-surcharge">0%</div><div class="stat-meter danger"><span id="meter-surcharge"></span></div></article>
      <article class="stat-card"><div class="stat-label">ÉCHELLE</div><div class="stat-value layer" id="stat-layer">CORE</div><div class="stat-meter layer"><span id="meter-layer"></span></div></article>
      <article class="stat-card"><div class="stat-label">PRESTIGE</div><div class="stat-value accent" id="stat-prestige">0</div><div class="stat-meter accent"><span id="meter-prestige"></span></div></article>
      <article class="stat-card"><div class="stat-label">USINES</div><div class="stat-value factory" id="stat-factory">0</div><div class="stat-meter factory"><span id="meter-factory"></span></div></article>
    </section>

    <section class="game-grid game-grid-wide">
      <article class="panel core-panel" id="core-panel">
        <div class="scale-radar" id="scale-radar" aria-hidden="true"></div>
        <div class="factory-field" id="factory-field" aria-hidden="true"></div>
        <div class="tendril-layer" id="tendril-layer" aria-hidden="true"></div>
        <div class="energy-field" id="energy-field" aria-hidden="true"></div>
        <div class="module-orbit" id="module-orbit" aria-hidden="true"></div>
        <button class="click-core" id="click-core" aria-label="Cliquer le noyau Nitro">
          <span class="core-rings"></span>
          <span class="core-glyph">⬡</span>
          <small id="core-label">CLICK CORE</small>
        </button>
        <div class="layer-caption" id="layer-caption"></div>
        <div class="reactor-gauges" aria-hidden="true">
          <div class="reactor-gauge"><span id="reactor-a"></span></div>
          <div class="reactor-gauge"><span id="reactor-b"></span></div>
          <div class="reactor-gauge"><span id="reactor-c"></span></div>
        </div>
      </article>

      <aside class="panel progression-panel">
        <div class="upgrade-title-row">
          <h2 class="panel-title">UPGRADES</h2>
          <div class="buy-mult-row" role="group" aria-label="Multiplicateur d'achat">
            ${BUY_MULTIPLIERS.map(mult => `<button class="buy-mult-btn ${buyMultiplier === mult ? 'active' : ''}" data-buy-mult="${mult}" type="button">×${mult}</button>`).join('')}
          </div>
        </div>
        <div class="upgrade-sync-hint" id="upgrade-sync-hint">SYNC LIVE · ACHAT ×${buyMultiplier}</div>
        <div class="upgrade-list" id="upgrade-list"></div>
      </aside>

      <aside class="panel meta-panel">
        <h2 class="panel-title">ÉCHELLE & MILESTONES</h2>
        <div class="scale-card" id="scale-card"></div>
        <div class="milestone-list" id="milestone-list"></div>

        <h2 class="panel-title" style="margin-top:22px">PRESTIGE</h2>
        <button class="upgrade-btn prestige-card" id="prestige-btn">
          <span class="upgrade-fill" id="prestige-fill"></span>
          <div class="upgrade-head"><span class="upgrade-name">✦ Surcharge contrôlée</span><span class="upgrade-cost" id="prestige-cost"></span></div>
          <div class="upgrade-desc">Reset le run, conserve tes fragments, augmente l’échelle et débloque des systèmes.</div>
        </button>

        <div class="save-row">
          <button class="action-btn" id="save-btn">💾 SAUVER LOCAL</button>
          <button class="action-btn danger" id="reset-btn">⚠ RESET LOCAL</button>
        </div>
      </aside>
    </section>
  `;

  bindStaticEvents();
  renderAll();
}

function bindStaticEvents() {
  document.getElementById('fx-toggle').addEventListener('click', () => {
    fxEnabled = !fxEnabled;
    localStorage.setItem(FX_KEY, String(fxEnabled));
    app.classList.toggle('fx-disabled', !fxEnabled);
    document.getElementById('fx-toggle').textContent = fxEnabled ? '✨ FX ON' : 'FX OFF';
    if (fxEnabled) FX.ready();
  });

  document.querySelectorAll('[data-buy-mult]').forEach(btn => {
    btn.addEventListener('click', () => {
      buyMultiplier = Number(btn.dataset.buyMult);
      localStorage.setItem(BUY_MULT_KEY, String(buyMultiplier));
      document.querySelectorAll('[data-buy-mult]').forEach(node => node.classList.toggle('active', Number(node.dataset.buyMult) === buyMultiplier));
      document.getElementById('upgrade-sync-hint').textContent = `SYNC LIVE · ACHAT ×${buyMultiplier}`;
      renderUpgrades();
      FX.ready();
    });
  });

  document.getElementById('click-core').addEventListener('click', event => {
    const result = clickCore(state);
    const gain = typeof result === 'number' ? result : result.gain;
    FX.click();
    spawnPop(event.clientX, event.clientY, `+${fmt(gain)}`);
    spawnEnergyBurst(event.clientX, event.clientY, Math.min(14, 4 + Math.floor(gain / Math.max(1, state.clickPower / 3))));
    pulseReactor();
    sparkTendrils();

    if (result?.overdrive) {
      FX.overdrive();
      spawnSystemWave(`OVERDRIVE +${fmt(result.overdriveGain)}`);
      lightningStorm(5);
    }
    if (result?.fragments) toast(`Fragment Nitro obtenu +${result.fragments}`);
    if (Math.random() > 0.45) zapToRandomModule();

    claimMilestonesAndRender();
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
    const beforeLayer = getScalingLayer(state).id;
    const result = doPrestige(state);
    if (!result.ok) return toast('Prestige pas encore prêt. Continue à charger le noyau.');
    state = result.state;
    FX.prestige();
    saveAll(userId, state);
    renderAll();
    spawnSystemWave('PRESTIGE +1');
    lightningStorm(9);
    if (getScalingLayer(state).id !== beforeLayer) spawnScaleShift();
    claimMilestonesAndRender();
    toast('Prestige activé. Échelle du système recalculée.');
  });
}

function claimMilestonesAndRender() {
  const claimed = checkAndClaimMilestones(state);
  if (claimed.length) {
    FX.milestone();
    for (const m of claimed) {
      const bits = [];
      if (m.reward?.energy) bits.push(`+${fmt(m.reward.energy)} E`);
      if (m.reward?.fragments) bits.push(`+${fmt(m.reward.fragments)} F`);
      toast(`Milestone : ${m.label} · ${bits.join(' · ')}`);
      spawnSystemWave(m.label.toUpperCase());
    }
  }
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
    p.style.setProperty('--dx', `${(Math.random() * 2 - 1) * 190}px`);
    p.style.setProperty('--dy', `${-80 - Math.random() * 170}px`);
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

function sparkTendrils() {
  if (!fxEnabled) return;
  const panel = document.getElementById('core-panel');
  panel?.classList.remove('tendril-hit');
  requestAnimationFrame(() => panel?.classList.add('tendril-hit'));
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
  node.style.setProperty('--radius', `${118 + Math.random() * 90}px`);
  orbit.appendChild(node);
  while (orbit.children.length > 26) orbit.firstElementChild.remove();
}

function spawnSystemWave(text) {
  if (!fxEnabled) return;
  const panel = document.getElementById('core-panel');
  if (!panel) return;
  const node = document.createElement('div');
  node.className = 'system-wave';
  node.textContent = text;
  panel.appendChild(node);
  setTimeout(() => node.remove(), 1700);
}

function spawnScaleShift() {
  if (!fxEnabled) return;
  app.classList.remove('scale-shift');
  requestAnimationFrame(() => app.classList.add('scale-shift'));
  setTimeout(() => app.classList.remove('scale-shift'), 1800);
}

function getCoreCenter() {
  const core = document.getElementById('click-core');
  const rect = core?.getBoundingClientRect();
  if (!rect) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function makeLightningPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = 7;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jitter = i === 0 || i === steps ? 0 : (Math.random() * 2 - 1) * 22;
    const nx = -dy;
    const ny = dx;
    const len = Math.max(1, Math.hypot(nx, ny));
    points.push({ x: x1 + dx * t + (nx / len) * jitter, y: y1 + dy * t + (ny / len) * jitter });
  }
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

function spawnLightningToElement(element, label = '') {
  if (!fxEnabled || !element) return;
  const layer = document.getElementById('lightning-layer');
  const core = getCoreCenter();
  const rect = element.getBoundingClientRect();
  if (!layer || !core || !rect) return;
  const target = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'lightning-bolt');
  path.setAttribute('d', makeLightningPath(core.x, core.y, target.x, target.y));
  layer.appendChild(path);
  setTimeout(() => path.remove(), 520);
  FX.zap();

  if (label) {
    const tag = document.createElement('div');
    tag.className = 'zap-label';
    tag.textContent = label;
    tag.style.left = `${target.x}px`;
    tag.style.top = `${target.y}px`;
    document.body.appendChild(tag);
    setTimeout(() => tag.remove(), 850);
  }
}

function zapToRandomModule() {
  const modules = [...document.querySelectorAll('.spawned-module')];
  if (!modules.length) return;
  spawnLightningToElement(modules[Math.floor(Math.random() * modules.length)]);
}

function lightningStorm(count = 5) {
  const targets = [...document.querySelectorAll('.upgrade-btn:not(.locked), .spawned-module, .factory-node')].sort(() => Math.random() - 0.5).slice(0, count);
  targets.forEach((target, i) => setTimeout(() => spawnLightningToElement(target), i * 70));
}

function renderAll() {
  renderStats();
  renderScaleCard();
  renderUpgrades();
  renderMilestones();
  renderModules();
  renderTendrils();
  renderFactories();
}

function renderLive() {
  renderStats();
  renderUpgradesLive();
}

function getNextAffordableCost() {
  const costs = UPGRADES
    .filter(upgrade => isUpgradeUnlocked(state, upgrade))
    .map(upgrade => upgradeBulkCost(upgrade, state.upgrades[upgrade.id] ?? 0, buyMultiplier));
  return Math.min(...costs, prestigeRequirement(state));
}

function renderStats() {
  const layer = getScalingLayer(state);
  app.dataset.layer = layer.id;
  const corePanel = document.getElementById('core-panel');
  if (corePanel) corePanel.dataset.layer = layer.id;

  if (lastLayerId && lastLayerId !== layer.id) spawnScaleShift();
  lastLayerId = layer.id;

  document.getElementById('stat-energy').textContent = fmt(state.energy);
  document.getElementById('stat-fragments').textContent = fmt(state.fragments);
  document.getElementById('stat-click').textContent = fmt(state.clickPower);
  document.getElementById('stat-passive').textContent = `${Number(state.passiveRate ?? 0).toFixed(2)}`;
  document.getElementById('stat-prestige').textContent = fmt(state.prestige);
  document.getElementById('stat-surcharge').textContent = `${Math.floor((state.surcharge / state.maxSurcharge) * 100)}%`;
  document.getElementById('stat-layer').textContent = layer.short;
  document.getElementById('stat-factory').textContent = fmt(state.factoryRate);

  const nextCost = getNextAffordableCost();
  setMeter('meter-energy', Math.min(1, state.energy / Math.max(1, nextCost)));
  setMeter('meter-fragments', Math.min(1, state.fragments / 25));
  setMeter('meter-click', Math.min(1, state.clickPower / 1000));
  setMeter('meter-passive', Math.min(1, state.passiveRate / 2500));
  setMeter('meter-surcharge', Math.min(1, state.surcharge / Math.max(1, state.maxSurcharge)));
  setMeter('meter-layer', Math.min(1, (state.prestige + 1) / 10));
  setMeter('meter-factory', Math.min(1, state.factoryRate / 50));

  const req = prestigeRequirement(state);
  const prestigeRatio = Math.min(1, state.totalEnergy / Math.max(1, req));
  setMeter('meter-prestige', prestigeRatio);
  setMeter('prestige-fill', prestigeRatio);
  setMeter('reactor-a', Math.min(1, state.surcharge / Math.max(1, state.maxSurcharge)));
  setMeter('reactor-b', Math.min(1, (state.clickPower + state.passiveRate) / 5000));
  setMeter('reactor-c', prestigeRatio);

  const btn = document.getElementById('prestige-btn');
  document.getElementById('prestige-cost').textContent = `${fmt(state.totalEnergy)} / ${fmt(req)}`;
  btn.disabled = state.totalEnergy < req;
  btn.classList.toggle('can-buy', state.totalEnergy >= req);

  const caption = document.getElementById('layer-caption');
  if (caption) caption.innerHTML = `<strong>${layer.name}</strong><span>${layer.desc}</span>`;
  const coreLabel = document.getElementById('core-label');
  if (coreLabel) coreLabel.textContent = layer.id === 'factory' || layer.id === 'district' || layer.id === 'orbital' ? 'RUN FACTORIES' : 'CLICK CORE';
}

function setMeter(id, ratio) {
  const node = document.getElementById(id);
  if (node) node.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
}

function getUpgradeSignature() {
  return UPGRADES.map(upgrade => {
    const unlocked = isUpgradeUnlocked(state, upgrade) ? 1 : 0;
    const level = state.upgrades[upgrade.id] ?? 0;
    const single = upgradeCost(upgrade, level);
    const bulk = upgradeBulkCost(upgrade, level, buyMultiplier);
    const currency = upgrade.currency ?? 'energy';
    const held = getCurrency(state, currency);
    return `${upgrade.id}:${unlocked}:${level}:${held >= single ? 1 : 0}:${held >= bulk ? 1 : 0}:${buyMultiplier}:${currency}`;
  }).join('|');
}

function renderUpgrades() {
  const root = document.getElementById('upgrade-list');
  lastUpgradeSignature = getUpgradeSignature();
  root.innerHTML = UPGRADES.map(upgrade => renderUpgradeButton(upgrade)).join('');
  bindUpgradeButtons();
}

function renderUpgradeButton(upgrade) {
  const level = state.upgrades[upgrade.id] ?? 0;
  const unlocked = isUpgradeUnlocked(state, upgrade);
  const currency = upgrade.currency ?? 'energy';
  const held = getCurrency(state, currency);
  const singleCost = upgradeCost(upgrade, level);
  const bulkCost = upgradeBulkCost(upgrade, level, buyMultiplier);
  const canBuySingle = unlocked && held >= singleCost;
  const canBuyBulk = unlocked && held >= bulkCost;
  const progress = unlocked ? Math.min(1, held / Math.max(1, bulkCost)) : 0;
  const lockText = upgrade.lockedText ?? 'Upgrade verrouillé.';

  if (!unlocked) {
    return `
      <button class="upgrade-btn locked" data-upgrade="${upgrade.id}" disabled>
        <span class="upgrade-fill" data-upgrade-fill="${upgrade.id}" style="transform:scaleX(0)"></span>
        <div class="upgrade-head">
          <span class="upgrade-name">??? <small data-upgrade-level="${upgrade.id}">Tier ${upgrade.tier}</small></span>
          <span class="upgrade-cost" data-upgrade-cost="${upgrade.id}">LOCKED</span>
        </div>
        <div class="upgrade-desc">${lockText}</div>
        <div class="upgrade-buy-meta" data-upgrade-meta="${upgrade.id}">Déblocage progressif</div>
      </button>`;
  }

  return `
    <button class="upgrade-btn ${canBuySingle ? 'can-buy' : ''} ${canBuyBulk ? 'can-buy-bulk' : ''}" data-upgrade="${upgrade.id}" ${canBuyBulk ? '' : 'disabled'}>
      <span class="upgrade-fill" data-upgrade-fill="${upgrade.id}" style="transform:scaleX(${progress})"></span>
      <div class="upgrade-head">
        <span class="upgrade-name">${upgrade.icon} ${upgrade.name} <small data-upgrade-level="${upgrade.id}">Lv.${level}</small></span>
        <span class="upgrade-cost" data-upgrade-cost="${upgrade.id}">${fmt(bulkCost)} ${currencyLabel(currency)}</span>
      </div>
      <div class="upgrade-desc">${upgrade.desc}</div>
      <div class="upgrade-buy-meta" data-upgrade-meta="${upgrade.id}">Achat ×${buyMultiplier} · unité ${fmt(singleCost)} ${currencyLabel(currency)}</div>
    </button>`;
}

function bindUpgradeButtons() {
  document.querySelectorAll('[data-upgrade]:not(.locked)').forEach(btn => {
    btn.addEventListener('click', event => {
      const result = buyUpgradeAmount(state, btn.dataset.upgrade, buyMultiplier);
      if (!result.ok) return toast(result.reason === 'locked' ? 'Upgrade verrouillé.' : `Ressource insuffisante pour ×${buyMultiplier}.`);
      FX.buy();
      spawnModule(btn.dataset.upgrade, result.level);
      spawnLightningToElement(event.currentTarget, `×${result.amount}`);
      spawnEnergyBurst(event.clientX, event.clientY, Math.min(26, 8 + result.amount * 2));
      claimMilestonesAndRender();
      scheduleSave();
      toast(`Upgrade ×${result.amount} acheté · niveau ${result.level}`);
    });
  });
}

function refreshUpgradesIfNeeded(playReadySound = false) {
  const previous = lastUpgradeSignature;
  const signature = getUpgradeSignature();
  if (signature === previous) {
    renderUpgradesLive();
    return;
  }
  const becameReady = playReadySound && previous && signature.split('|').some((part, idx) => {
    const prev = previous.split('|')[idx] ?? '';
    const p = prev.split(':');
    const n = part.split(':');
    return (p[1] === '0' && n[1] === '1') || (p[3] === '0' && n[3] === '1');
  });
  renderUpgrades();
  if (becameReady) {
    FX.ready();
    const ready = [...document.querySelectorAll('.upgrade-btn.can-buy')].at(-1);
    if (ready) spawnLightningToElement(ready, 'READY');
  }
}

function renderUpgradesLive() {
  const signature = getUpgradeSignature();
  if (signature !== lastUpgradeSignature) {
    refreshUpgradesIfNeeded(true);
    return;
  }
  for (const upgrade of UPGRADES) {
    if (!isUpgradeUnlocked(state, upgrade)) continue;
    const level = state.upgrades[upgrade.id] ?? 0;
    const currency = upgrade.currency ?? 'energy';
    const held = getCurrency(state, currency);
    const singleCost = upgradeCost(upgrade, level);
    const bulkCost = upgradeBulkCost(upgrade, level, buyMultiplier);
    const btn = document.querySelector(`[data-upgrade="${upgrade.id}"]`);
    if (!btn) continue;
    btn.classList.toggle('can-buy', held >= singleCost);
    btn.classList.toggle('can-buy-bulk', held >= bulkCost);
    btn.disabled = held < bulkCost;
    const fill = btn.querySelector(`[data-upgrade-fill="${upgrade.id}"]`);
    if (fill) fill.style.transform = `scaleX(${Math.min(1, held / Math.max(1, bulkCost))})`;
  }
}

function renderScaleCard() {
  const node = document.getElementById('scale-card');
  if (!node) return;
  const layer = getScalingLayer(state);
  node.innerHTML = `
    <div class="scale-card-main">
      <span class="scale-chip">${layer.short}</span>
      <div><strong>${layer.name}</strong><p>${layer.desc}</p></div>
    </div>
    <div class="scale-card-sub">Multiplicateur d’échelle ×${layer.mult} · prochain dézoom aux prestiges 3 / 10 / 25 / 50</div>
  `;
}

function renderMilestones() {
  const root = document.getElementById('milestone-list');
  if (!root) return;
  const items = getVisibleMilestones(state);
  root.innerHTML = items.map(m => {
    const done = !!state.milestones[m.id];
    const reward = [];
    if (m.reward?.energy) reward.push(`+${fmt(m.reward.energy)} E`);
    if (m.reward?.fragments) reward.push(`+${fmt(m.reward.fragments)} F`);
    return `<div class="milestone ${done ? 'done' : ''}"><span>${done ? '✓' : '◇'}</span><div><strong>${m.label}</strong><small>${m.desc}</small></div><em>${reward.join(' · ')}</em></div>`;
  }).join('') || '<div class="milestone"><span>◇</span><div><strong>Aucun signal</strong><small>Continue à charger le noyau.</small></div></div>';
}

function renderModules() {
  const orbit = document.getElementById('module-orbit');
  if (!orbit) return;
  orbit.innerHTML = '';
  for (const upgrade of UPGRADES) {
    const level = state.upgrades[upgrade.id] ?? 0;
    const count = Math.min(upgrade.id.includes('Factory') || upgrade.id.includes('Plant') ? 8 : 5, level);
    for (let i = 0; i < count; i++) {
      const node = document.createElement('div');
      node.className = 'spawned-module persistent';
      node.textContent = upgrade.icon;
      node.title = `${upgrade.name} Lv.${level}`;
      node.style.setProperty('--angle', `${((i + 1) / (count + 1)) * 360 + UPGRADES.indexOf(upgrade) * 35}deg`);
      node.style.setProperty('--radius', `${112 + UPGRADES.indexOf(upgrade) * 18}px`);
      orbit.appendChild(node);
    }
  }
}

function renderFactories() {
  const field = document.getElementById('factory-field');
  if (!field) return;
  const layer = getScalingLayer(state);
  const count = Math.min(28, Math.floor((state.factoryRate ?? 0) + (layer.prestige >= 10 ? 8 : 0)));
  field.innerHTML = Array.from({ length: count }, (_, i) => `<span class="factory-node" style="--x:${6 + (i * 17) % 88}%;--y:${12 + (i * 29) % 74}%;--d:${(i * -0.17).toFixed(2)}s">${i % 3 === 0 ? '🏭' : i % 3 === 1 ? '⚙' : '⬡'}</span>`).join('');
}

function renderTendrils() {
  const layer = document.getElementById('tendril-layer');
  if (!layer) return;
  const totalLevels = UPGRADES.reduce((sum, upgrade) => sum + (state.upgrades[upgrade.id] ?? 0), 0);
  const count = Math.min(26, 8 + totalLevels + Math.floor(state.prestige / 2));
  layer.innerHTML = Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (i % 2 ? 8 : -8);
    const length = 112 + (i % 5) * 20 + Math.min(100, totalLevels * 3 + state.prestige * 2);
    const width = 8 + (i % 3) * 2;
    const delay = -(i * 0.23).toFixed(2);
    return `<span class="bio-tendril" style="--angle:${angle}deg;--len:${length}px;--w:${width}px;--delay:${delay}s"><i></i></span>`;
  }).join('');
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
    if (state.passiveRate > 0) tickPassive(state, delta);
    renderLive();
    refreshUpgradesIfNeeded(true);
    if (fxEnabled && now - lastEnergyPulse > 1800) {
      lastEnergyPulse = now;
      const panel = document.getElementById('core-panel')?.getBoundingClientRect();
      if (panel && state.passiveRate > 0) spawnEnergyBurst(panel.left + panel.width * 0.5, panel.top + panel.height * 0.5, Math.min(8, Math.ceil(state.passiveRate / 4)));
      if (Math.random() > 0.35) zapToRandomModule();
    }
  }, 250);

  setInterval(() => {
    const claimed = checkAndClaimMilestones(state);
    if (claimed.length) claimMilestonesAndRender();
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
  claimMilestonesAndRender();
  if (offlineGain > 0) toast(`Progression hors-ligne : +${fmt(offlineGain)} énergie.`);
}

init().catch(error => {
  console.error('[Nitro Clicker] init failed:', error);
  app.innerHTML = `<section class="auth-error-panel"><div><h1>Erreur Nitro Clicker</h1><p>${error?.message ?? error}</p><a class="nav-btn" href="/star/">Retour Star</a></div></section>`;
});
