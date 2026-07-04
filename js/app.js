import { requireAuth } from '/shared/guards.js';
import { getProfile, getDisplayNameFromUser } from '/shared/profile.js';
import {
  UPGRADES,
  SCALING_LAYERS,
  applyOfflineProgress,
  attemptCoreShellBreak,
  buyUpgradeAmount,
  checkAndClaimMilestones,
  clickCore,
  doPrestige,
  getCoreGrowthLevel,
  getCoreShellInfo,
  getCurrency,
  getPrestigePreview,
  getScalingLayer,
  getVisibleMilestones,
  canPrestige,
  isUpgradeUnlocked,
  prestigeRequirement,
  tickPassive,
  upgradeBulkCost,
  upgradeCost,
  LEMEGETON_SKILLS,
  isLemegetonOnline,
  isLemegetonSkillUnlocked,
  isLemegetonSkillMaxed,
  lemegetonSkillLevel,
  lemegetonSkillCost,
  buyLemegetonSkill,
  isAutoPurchaseEnabled,
  isLemegetonSkillActive,
  toggleLemegetonSkill,
  canFuseCore,
  doFuseCore,
  BALANCE,
  MAX_FUSION_TIER,
  BOOSTS,
  getBoostLevel,
  getBoostUpgradeCost,
  isBoostUpgradeMaxed,
  getBoostDurationMs,
  getBoostMagnitude,
  buyBoostUpgrade,
  isBoostActive,
  getBoostRemainingMs,
  activateBoost,
  tickBoosts,
} from './engine/clicker-state.js';
import { loadSave, saveAll, readSaveError, getActiveSlot, setActiveSlot, getSlotSummaries } from './engine/clicker-save.js';
import { setClassToggle, setHtml, setText, setTransformScaleX } from './ui/render-cache.js';
import { formatValue as fmt } from './ui/value-format.js';
import { setLiveState } from './ui-panels.js';

const app = document.getElementById('app');
const FX_KEY = 'nitro-clicker.fx.enabled';
const BUY_MULT_KEY = 'nitro-clicker.buy.multiplier';
const BUY_MULTIPLIERS = [1, 5, 10];
const LAYOUT_KEY = 'nitro-clicker.layout';
const LAYOUTS = ['nexus', 'orbital', 'command', 'mono'];
const CORE_ZOOM_KEY = 'nitro-clicker.core.zoom';
const CORE_STATS_KEY = 'nitro-clicker.core.statsMode';
const CORE_ZOOM_LEVELS = [0.80, 0.64, 0.50, 0.38, 0.28];
const CORE_MODULE_GROUPS = [
  { id: 'amplifier', label: 'AMP', color: '#00ffcc', sound: 'module.amplifier', ids: ['clickAmplifier', 'resonance', 'prism', 'fragmentCatalyst'] },
  { id: 'automation', label: 'AUTO', color: '#00ff80', sound: 'module.automation', ids: ['autoCore', 'autoClicker', 'bioConduit'] },
  { id: 'overdrive', label: 'OVR', color: '#ff3df2', sound: 'module.overdrive', ids: ['surchargeCoil', 'fractureTuning', 'orbitalHive'] },
  { id: 'shell', label: 'SHELL', color: '#ffcc00', sound: 'module.shell', ids: ['coreIsolation', 'reflectiveAlloy', 'mirrorGel', 'prismGlass'] },
  { id: 'coreNetwork', label: 'COREx', color: '#8fb7ff', sound: 'module.coreNetwork', ids: ['nitroFactory', 'enginePlant', 'stellarConvergence'] },
];

let auth;
let profile;
let state;
let userId;
let currentSlot = 1;
let saveTimer;
let lastTick = performance.now();
let lastUpgradeSignature = '';
let lastLemegetonSignature = '';
let coreZoomIndex = Math.min(CORE_ZOOM_LEVELS.length - 1, Math.max(0, Math.floor(Number(localStorage.getItem(CORE_ZOOM_KEY) ?? 0)) || 0));
let lastAutoFitZoom = 1;
let lastKnownRMain = 110;
let lastScaleSignature = '';
let lastMilestoneSignature = '';
let lastModuleSignature = '';
let lastFactorySignature = '';
let lastTendrilSignature = '';
let lastLayerId = '';
let lastShellSignature = '';
// ── Modes de diagnostic crash (activables par l'URL, sans rien casser d'autre) ──
// ?safe  : arrêt total avant tout rendu de jeu (écran inerte). Confirmé stable.
// ?noloop : rend le jeu normalement MAIS ne démarre pas la boucle 250ms.
//          → si ?noloop est stable, le coupable est dans la boucle de jeu.
//          → si ?noloop hang, le coupable est dans renderShell / le montage
//            des modules périphériques.
// ?noperiph : coupe TOUS les modules périphériques (intervalles + boucle rAF
//          de core-controls + MutationObserver de svg-replacer).
const DIAG = new URLSearchParams(location.search);
const SAFE_MODE = DIAG.has('safe');
const NOLOOP_MODE = DIAG.has('noloop');
if (DIAG.has('noperiph') || SAFE_MODE) window.NITRO_DISABLE_PERIPHERALS = true;

let fxEnabled = SAFE_MODE ? false : localStorage.getItem(FX_KEY) !== 'false';
let coreStatsMode = localStorage.getItem(CORE_STATS_KEY) === 'true';
let buyMultiplier = Number(localStorage.getItem(BUY_MULT_KEY) || 1);
if (!BUY_MULTIPLIERS.includes(buyMultiplier)) buyMultiplier = 1;
let currentLayout = localStorage.getItem(LAYOUT_KEY) ?? 'nexus';
if (!LAYOUTS.includes(currentLayout)) currentLayout = 'nexus';
let lastSubCoreSignature = '';
let lastOrbitalCount = 0;
let lastDupCount = 0;
let audioCtx = null;
let lastEnergyPulse = 0;
const bounceParticles = [];
let bounceLoop = null;
let bounceCanvas = null;
let bounceCtx = null;

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
  buy() { [392, 523, 659, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 'triangle', 0.065, 0.11), i * 58)); },
  milestone() { [784, 988, 1175].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.055, 0.12), i * 70)); },
  overdrive() { [110, 220, 440, 880, 1760].forEach((f, i) => setTimeout(() => this.tone(f, i < 2 ? 'sawtooth' : 'square', 0.045, 0.09), i * 42)); },
  prestige() { [262, 392, 523, 784, 1047, 1568].forEach((f, i) => setTimeout(() => this.tone(f, i % 2 ? 'triangle' : 'square', 0.055, 0.13), i * 70)); },
  crack() { [180, 320, 640, 420].forEach((f, i) => setTimeout(() => this.tone(f, i % 2 ? 'sawtooth' : 'triangle', 0.04, 0.075), i * 38)); },
  shatter() { [130, 260, 520, 1040, 1560].forEach((f, i) => setTimeout(() => this.tone(f, i < 2 ? 'square' : 'triangle', 0.065, 0.11), i * 45)); },
};

function playGameSound(id, options = {}, fallback = null) {
  if (window.NitroSound?.play) return window.NitroSound.play(id, options);
  if (fallback && fxEnabled) FX[fallback]?.();
  return false;
}

function getSoundFxEnabled() {
  return window.NitroSound?.settings?.().enabled !== false;
}

function syncToggleButton(id, label, enabled) {
  const btn = document.getElementById(id);
  if (!btn) return;
  setText(btn, `${label} ${enabled ? 'ON' : 'OFF'}`);
  btn.setAttribute('aria-pressed', String(!!enabled));
  setClassToggle(btn, 'is-off', !enabled);
}

function syncUiFxToggle() {
  syncToggleButton('fx-toggle', 'FX UI', fxEnabled);
}

function syncSoundFxToggle() {
  const btn = document.getElementById('sound-fx-toggle');
  if (!btn) return;
  const hasEngine = !!window.NitroSound?.settings;
  btn.disabled = !hasEngine;
  syncToggleButton('sound-fx-toggle', 'FX SOUND', hasEngine && getSoundFxEnabled());
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

function flushSaveErrorToast() {
  const err = readSaveError();
  if (!err) return;
  toast(`⚠ Sauvegarde impossible (${err.code}) — progression non persistée localement.`);
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
        <button class="nav-btn" id="fx-toggle" type="button" aria-pressed="${String(fxEnabled)}">FX UI ${fxEnabled ? 'ON' : 'OFF'}</button>
        <button class="nav-btn" id="sound-fx-toggle" type="button" aria-pressed="${String(getSoundFxEnabled())}">FX SOUND ${getSoundFxEnabled() ? 'ON' : 'OFF'}</button>
        <div class="layout-switcher" role="group" aria-label="Disposition des panels">
          ${LAYOUTS.map(l => `<button class="layout-btn${currentLayout === l ? ' active' : ''}" data-layout-btn="${l}" type="button">${l.toUpperCase()}</button>`).join('')}
        </div>
        <a href="./lemegeton-compare.html" class="nav-btn">◇ TESTS</a>
        <a href="./core-fx-editor.html" class="nav-btn">FX EDITOR</a>
        <a href="/star/" class="nav-btn">⬡ STAR</a>
        <a href="/" class="nav-btn">← HUB</a>
        <a href="/clicker/deploy.html" class="nav-btn deploy-badge" id="deploy-badge" title="Deploy status">BUILD</a>
      </nav>
    </header>

    <section class="stats-grid stats-grid-extended">
      <article class="stat-card energy-stat"><div class="stat-label">ÉNERGIE</div><div class="stat-value primary" id="stat-energy">0</div><div class="stat-meter"><span id="meter-energy"></span></div></article>
      <article class="stat-card"><div class="stat-label">ÉNERGIE TOTALE</div><div class="stat-value total" id="stat-total-energy">0</div><div class="stat-meter total"><span id="meter-total-energy"></span></div></article>
      <article class="stat-card"><div class="stat-label">FRAGMENTS</div><div class="stat-value fragment" id="stat-fragments">0</div><div class="stat-meter fragment"><span id="meter-fragments"></span></div></article>
      <article class="stat-card"><div class="stat-label">PAR CLIC</div><div class="stat-value" id="stat-click">1</div><div class="stat-meter small"><span id="meter-click"></span></div></article>
      <article class="stat-card"><div class="stat-label">AUTO / SEC</div><div class="stat-value" id="stat-passive">0</div><div class="stat-meter small"><span id="meter-passive"></span></div></article>
      <article class="stat-card"><div class="stat-label">SURCHARGE</div><div class="stat-value danger" id="stat-surcharge">0%</div><div class="stat-meter danger"><span id="meter-surcharge"></span></div></article>
      <article class="stat-card"><div class="stat-label">COQUE</div><div class="stat-value shell" id="stat-shell">0/0</div><div class="stat-meter shell"><span id="meter-shell"></span></div></article>
      <article class="stat-card"><div class="stat-label">PRESTIGE</div><div class="stat-value accent" id="stat-prestige">0</div><div class="stat-meter accent"><span id="meter-prestige"></span></div></article>
    </section>

    <section class="game-grid game-grid-wide" id="game-grid" data-layout="${currentLayout}">
      <article class="panel core-panel" id="core-panel">
        <div class="microscope-lens" aria-hidden="true"></div>
        <div class="scale-radar" id="scale-radar" aria-hidden="true"></div>
        <div class="tendril-layer" id="tendril-layer" aria-hidden="true"></div>
        <div class="core-state-aura" id="core-state-aura" aria-hidden="true"><span></span><i></i><b></b></div>
        <div class="core-viewport" id="core-viewport">
          <div class="sub-core-field" id="sub-core-field" aria-hidden="true"></div>
          <div class="core-shell-visual" id="core-shell-visual" aria-hidden="true"><span></span><i></i><b></b><div class="shell-crack-fragments" id="shell-crack-fragments"></div></div>
          <button class="core-hit-zone" id="core-hit-zone" type="button" aria-label="Cliquer le noyau Nitro"></button>
          <button class="click-core" id="click-core" aria-label="Cliquer le noyau Nitro" tabindex="-1">
            <span class="core-rings"></span>
          </button>
        </div>
        <div class="core-terminal" id="core-terminal" aria-hidden="true"></div>
        <div class="energy-field" id="energy-field" aria-hidden="true"></div>
        <div class="module-orbit" id="module-orbit" aria-hidden="true"></div>
        <div class="core-scale-indicator" id="core-scale-indicator">
          <span id="core-scale-value">0.001 pm</span>
          <span class="core-scale-unit">ÉCHELLE</span>
        </div>
        <div class="core-zoom-control" id="core-zoom-control" aria-label="Zoom de la vue noyau">
          <button class="core-zoom-btn" data-zoom-step="1" type="button" aria-label="Dézoomer">−</button>
          <span class="core-zoom-readout" id="core-zoom-readout">80%</span>
          <button class="core-zoom-btn" data-zoom-step="-1" type="button" aria-label="Zoomer">+</button>
        </div>
        <button class="core-stats-toggle" id="core-stats-toggle" type="button" aria-pressed="${String(coreStatsMode)}" title="Mode stats : vue tableur, cache les noyaux et allège les effets">⊞ STATS</button>
        <button class="core-fusion-btn" id="core-fusion-btn" type="button" style="display:none" title="Les 5 clones entrent en résonance et fusionnent — Noyau Tier II">⚛ FUSION</button>
      </article>

      <aside class="panel progression-panel">
        <div class="shop-tabs" role="tablist" aria-label="Boutiques">
          <button class="shop-tab active" data-shop-tab="upgrades" role="tab" aria-selected="true" type="button">UPGRADES</button>
          <button class="shop-tab" data-shop-tab="lemegeton" role="tab" aria-selected="false" type="button">⬡ LEMEGETON</button>
          <button class="shop-tab" data-shop-tab="boosts" role="tab" aria-selected="false" type="button">⚡ BOOSTS</button>
        </div>

        <div class="shop-pane" data-shop-pane="upgrades">
          <div class="upgrade-title-row">
            <span class="upgrade-sync-hint" id="upgrade-sync-hint">SYNC LIVE · ACHAT ×${buyMultiplier}</span>
            <div class="buy-mult-row" role="group" aria-label="Multiplicateur d'achat">
              ${BUY_MULTIPLIERS.map(mult => `<button class="buy-mult-btn ${buyMultiplier === mult ? 'active' : ''}" data-buy-mult="${mult}" type="button">×${mult}</button>`).join('')}
            </div>
          </div>
          <div class="upgrade-list" id="upgrade-list"></div>
          <div class="prestige-upgrade-footer">
            <button class="upgrade-btn prestige-card" id="prestige-btn" type="button">
              <span class="upgrade-fill" id="prestige-fill"></span>
              <div class="upgrade-head"><span class="upgrade-name">❆ Surcharge contrôlée</span><span class="upgrade-cost" id="prestige-cost"></span></div>
              <div class="upgrade-desc" id="prestige-desc">Reset le run, conserve tes fragments, augmente l'échelle et débloque des systèmes.</div>
            </button>
          </div>
        </div>

        <div class="shop-pane" data-shop-pane="lemegeton" hidden>
          <p class="lemegeton-skill-hint" id="lemegeton-skill-hint">Compétences permanentes · payées en fragments · survivent au prestige.</p>
          <div class="lemegeton-skill-list" id="lemegeton-skill-list"></div>
        </div>

        <div class="shop-pane" data-shop-pane="boosts" hidden>
          <p class="lemegeton-skill-hint" id="boost-shop-hint">Effets temporaires · payés en fragments · le noyau change d'aspect pendant la durée.</p>
          <div class="lemegeton-skill-list" id="boost-shop-list"></div>
        </div>
      </aside>

      <aside class="panel meta-panel">
        <div class="meta-panel-head">
          <div>
            <div class="meta-panel-kicker">SYS · META</div>
            <h2 class="meta-panel-title">NEXUS</h2>
          </div>
          <button class="action-btn meta-save-btn" id="save-btn" type="button">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 1v7M3 5l3 3 3-3M1 11h10"/></svg>
            SAVE
          </button>
        </div>

        <section class="meta-section meta-section--scale">
          <div class="meta-section-header">
            <span class="meta-section-accent"></span>
            <span class="meta-section-icon">◈</span>
            <h2 class="meta-title">ÉCHELLE &amp; MILESTONES</h2>
            <span class="meta-section-rule"></span>
          </div>
          <div class="scale-card" id="scale-card"></div>
          <div class="milestone-list" id="milestone-list"></div>
        </section>

        <section class="meta-section meta-section--shell">
          <div class="meta-section-header">
            <span class="meta-section-accent"></span>
            <span class="meta-section-icon">◇</span>
            <h2 class="meta-title">COQUE DU NOYAU</h2>
            <span class="meta-section-rule"></span>
          </div>
          <div class="core-shell-card" id="core-shell-card"></div>
          <button class="upgrade-btn shell-break-card" id="shell-break-btn" type="button">
            <span class="upgrade-fill" id="shell-break-fill"></span>
            <div class="upgrade-head"><span class="upgrade-name">◇ Briser la sphère</span><span class="upgrade-cost" id="shell-break-cost"></span></div>
            <div class="upgrade-desc" id="shell-break-desc">Stocke des fragments Nitro dans la sphère, puis dépense un fort pic d'énergie pour tenter de la briser.</div>
          </button>
        </section>

      </aside>
    </section>
  `;

  bindStaticEvents();
  applyCoreStatsMode();
  renderAll();
}

function handleCoreClick(event) {
  const result = clickCore(state);
  const gain = typeof result === 'number' ? result : result.gain;
  playGameSound('core.click', { volume: result?.crit ? 1 : 0.9 }, 'click');
  spawnPop(event.clientX, event.clientY, `+${fmt(gain)}`);
  spawnBouncingBurst(event.clientX, event.clientY, Math.min(14, 4 + Math.floor(gain / Math.max(1, state.clickPower / 3))));
  pulseReactor();
  pulseSubCores();
  sparkTendrils();

  if (result?.overdrive) {
    playGameSound('overdrive.trigger', { volume: result.crit ? 1 : 0.8 }, 'overdrive');
    // LEMEGETON réagit seulement aux CRIT overdrives, et pas à chaque fois
    if (result.crit && Math.random() < 0.5) {
      const reactions = ['surprise', 'excitement', 'joy', 'love'];
      window.eyes?.emotion?.(reactions[Math.floor(Math.random() * reactions.length)]);
    }
    if (result.crit) {
      spawnSystemWave(`💥 CRIT OVERDRIVE +${fmt(result.overdriveGain)}`);
      lightningStorm(10);
      spawnEnergyBurst(event.clientX, event.clientY, 32);
      toast(`SURCHARGE CRITIQUE · +${fmt(result.overdriveGain)} énergie`);
    } else {
      spawnSystemWave(`OVERDRIVE +${fmt(result.overdriveGain)}`);
      lightningStorm(5);
    }
  }
  if (result?.fragmentsStored) {
    playGameSound('shell.store', { volume: Math.min(1, 0.55 + result.fragmentsStored * 0.08) });
    pulseShell('store');
    toast(`Fragment Nitro confiné dans la sphère +${result.fragmentsStored}`);
  }
  if (result?.fragments) {
    toast(`Fragment Nitro obtenu +${result.fragments}`);
    spawnFragmentOrbs(result.fragments);
  }
  if (result?.shellAutoBreak) {
    playGameSound('shell.shatter', { volume: 0.9 }, 'shatter');
    pulseShell('break');
    toast(`LA SPHÈRE CÈDE SOUS LA PRESSION · +${result.shellReleased} fragments`);
    if (result.shellReleased > 0) spawnFragmentOrbs(result.shellReleased);
  }
  if (Math.random() > 0.45) zapToRandomModule();
  if (Math.random() > 0.55) reflectLightningToClones({ max: 1 });

  claimMilestonesAndRender();
  scheduleSave();
}

function bindStaticEvents() {
  syncUiFxToggle();
  syncSoundFxToggle();
  window.addEventListener('nitro:sound-settings-changed', syncSoundFxToggle);
  window.addEventListener('nitro:value-settings-changed', () => renderAll(true));

  document.getElementById('fx-toggle').addEventListener('click', () => {
    fxEnabled = !fxEnabled;
    localStorage.setItem(FX_KEY, String(fxEnabled));
    app.classList.toggle('fx-disabled', !fxEnabled);
    syncUiFxToggle();
  });

  document.getElementById('sound-fx-toggle').addEventListener('click', () => {
    if (!window.NitroSound?.setEnabled) return toast('Moteur son indisponible.');
    window.NitroSound.setEnabled(!getSoundFxEnabled());
    syncSoundFxToggle();
  });

  document.querySelectorAll('[data-shop-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.shopTab;
      document.querySelectorAll('[data-shop-tab]').forEach(t => {
        const on = t.dataset.shopTab === target;
        setClassToggle(t, 'active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('[data-shop-pane]').forEach(pane => {
        pane.hidden = pane.dataset.shopPane !== target;
      });
      if (target === 'lemegeton') renderLemegetonSkills(true);
      else if (target === 'boosts') renderBoostShop(true);
      else renderUpgrades(true);
    });
  });

  document.querySelectorAll('[data-zoom-step]').forEach(btn => {
    btn.addEventListener('click', () => stepCoreZoom(Number(btn.dataset.zoomStep)));
  });

  document.getElementById('core-fusion-btn')?.addEventListener('click', triggerCoreFusion);

  document.getElementById('core-stats-toggle')?.addEventListener('click', () => {
    coreStatsMode = !coreStatsMode;
    localStorage.setItem(CORE_STATS_KEY, String(coreStatsMode));
    applyCoreStatsMode();
  });

  document.querySelectorAll('[data-buy-mult]').forEach(btn => {
    btn.addEventListener('click', () => {
      buyMultiplier = Number(btn.dataset.buyMult);
      localStorage.setItem(BUY_MULT_KEY, String(buyMultiplier));
      document.querySelectorAll('[data-buy-mult]').forEach(node => setClassToggle(node, 'active', Number(node.dataset.buyMult) === buyMultiplier));
      setText('upgrade-sync-hint', `SYNC LIVE · ACHAT ×${buyMultiplier}`);
      renderUpgrades(true);
    });
  });

  document.getElementById('click-core').addEventListener('click', handleCoreClick);
  document.getElementById('core-hit-zone').addEventListener('click', handleCoreClick);

  document.getElementById('shell-break-btn').addEventListener('click', () => {
    const result = attemptCoreShellBreak(state);
    if (!result.ok) {
      if (result.reason === 'locked') return toast('Isolation du noyau requise pour créer une sphère.');
      if (result.reason === 'empty') return toast('Aucun fragment stocké dans la sphère.');
      if (result.reason === 'not_enough_energy') return toast(`Pic d'énergie insuffisant : ${fmt(result.shell.breakCost)} E requis.`);
      if (result.reason === 'failed') {
        playGameSound('shell.crack', {}, 'crack');
        pulseShell('crack');
        spawnSystemWave('FISSURE');
        lightningStorm(3);
        window.NitroLemegeton?.react?.('shellFail');
        renderAll(true);
        scheduleSave();
        return toast(`Rupture ratée · fissure ${result.cracks}/${result.shell.requiredHits} · chance ${Math.round(result.chance * 100)}%`);
      }
      return;
    }
    playGameSound('shell.shatter', {}, 'shatter');
    pulseShell('break');
    spawnSystemWave(`SPHÈRE BRISÉE +${result.released}F`);
    lightningStorm(8);
    window.NitroLemegeton?.react?.('shellBreak');
    renderAll(true);
    claimMilestonesAndRender();
    scheduleSave();
    toast(`Fragments libérés : +${result.released}F${result.forced ? ' · rupture forcée par fissures' : ''}`);
  });

  document.querySelectorAll('[data-layout-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLayout = btn.dataset.layoutBtn;
      localStorage.setItem(LAYOUT_KEY, currentLayout);
      const grid = document.getElementById('game-grid');
      if (grid) grid.dataset.layout = currentLayout;
      document.querySelectorAll('[data-layout-btn]').forEach(b => setClassToggle(b, 'active', b.dataset.layoutBtn === currentLayout));
      // Le panneau noyau change de dimensions selon la disposition — recaper le zoom.
      requestAnimationFrame(() => recalcAutoFitZoom());
    });
  });

  window.addEventListener('resize', scheduleAutoFitRecalc);

  document.getElementById('save-btn').addEventListener('click', () => {
    const ok = persist();
    if (ok) {
      toast('Sauvegarde locale OK.');
    } else {
      flushSaveErrorToast();
    }
  });

  document.getElementById('prestige-btn').addEventListener('click', () => {
    const beforeLayer  = getScalingLayer(state).id;
    const oldFragments = state.fragments ?? 0;
    const result = doPrestige(state);
    if (!result.ok) return toast('Prestige pas encore prêt. Continue à charger le noyau.');
    state = result.state;
    setLiveState(state);
    playGameSound('prestige.activate', {}, 'prestige');
    window.NitroLemegeton?.react?.('prestige');
    persist();
    renderAll(true);
    spawnSystemWave(`PRESTIGE ${state.prestige} · +${fmt(result.prestigeReward)}F`);
    lightningStorm(9);
    if (getScalingLayer(state).id !== beforeLayer) spawnScaleShift();
    claimMilestonesAndRender();
    toast(`Prestige activé · +${fmt(result.prestigeReward)}F · réserve +${fmt(result.starterEnergy ?? 0)}E.`);
    const earned = (state.fragments ?? 0) - oldFragments;
    if (earned > 0) setTimeout(() => spawnFragmentOrbs(earned), 500);
  });
}

function claimMilestonesAndRender() {
  const claimed = checkAndClaimMilestones(state);
  if (claimed.length) {
    playGameSound('milestone.claim', { volume: Math.min(1, 0.8 + claimed.length * 0.05) }, 'milestone');
    for (const m of claimed) {
      const bits = [];
      if (m.reward?.energy) bits.push(`+${fmt(m.reward.energy)} E`);
      if (m.reward?.fragments) bits.push(`+${fmt(m.reward.fragments)} F`);
      toast(`Milestone : ${m.label} · ${bits.join(' · ')}`);
      spawnSystemWave(m.label.toUpperCase());
    }
  }
  renderAll(!!claimed.length);
}

function spawnPop(x, y, text) {
  const core = document.getElementById('click-core');
  if (!core) return;
  const rect = core.getBoundingClientRect();
  if (!rect.width) return;
  const pop = document.createElement('div');
  pop.className = 'float-pop';
  pop.style.left = `${x - rect.left}px`;
  pop.style.top = `${y - rect.top}px`;
  pop.textContent = text;
  core.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
}

function ensureBounceCanvas() {
  if (bounceCanvas?.isConnected) return true;
  if (bounceLoop) { cancelAnimationFrame(bounceLoop); bounceLoop = null; }
  bounceParticles.length = 0;
  bounceCanvas = null;
  bounceCtx = null;
  const core = document.getElementById('click-core');
  if (!core) return false;
  bounceCanvas = document.createElement('canvas');
  bounceCanvas.className = 'bounce-canvas';
  bounceCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;border-radius:50%;';
  core.appendChild(bounceCanvas);
  const rect = core.getBoundingClientRect();
  bounceCanvas.width = Math.round(rect.width) || 240;
  bounceCanvas.height = Math.round(rect.height) || 240;
  bounceCtx = bounceCanvas.getContext('2d');
  return true;
}

function spawnBouncingBurst(clientX, clientY, count = 8) {
  if (!fxEnabled) return;
  if (!ensureBounceCanvas()) return;
  const core = document.getElementById('click-core');
  const rect = core.getBoundingClientRect();
  const w = Math.round(rect.width) || 240;
  const h = Math.round(rect.height) || 240;
  if (bounceCanvas.width !== w || bounceCanvas.height !== h) {
    bounceCanvas.width = w;
    bounceCanvas.height = h;
    bounceCtx = bounceCanvas.getContext('2d');
  }
  const cx = w / 2;
  const cy = h / 2;
  const R = cx - 4;
  const px0 = (clientX - rect.left) - cx;
  const py0 = (clientY - rect.top) - cy;
  const COLORS = [
    { fill: '#00ffcc', glow: 'rgba(0,255,204,.9)' },
    { fill: '#ffcc00', glow: 'rgba(255,204,0,.9)' },
    { fill: '#ff3df2', glow: 'rgba(255,61,242,.9)' },
  ];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 160 + Math.random() * 230;
    const col = COLORS[Math.floor(Math.random() * COLORS.length)];
    bounceParticles.push({
      x: px0, y: py0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 2.5 + Math.random() * 2.5,
      life: 1,
      decay: 0.65 + Math.random() * 0.5,
      fill: col.fill, glow: col.glow,
    });
  }
  if (bounceLoop) return;
  let lastTime = performance.now();
  function tick(now) {
    if (!bounceCanvas?.isConnected) { bounceLoop = null; bounceParticles.length = 0; return; }
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const bw = bounceCanvas.width, bh = bounceCanvas.height;
    const bcx = bw / 2, bcy = bh / 2, bR = bcx - 4;
    bounceCtx.clearRect(0, 0, bw, bh);
    const friction = Math.pow(0.28, dt);
    for (let i = bounceParticles.length - 1; i >= 0; i--) {
      const p = bounceParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= friction;
      p.vy *= friction;
      p.life -= p.decay * dt;
      const d = Math.sqrt(p.x * p.x + p.y * p.y);
      if (d > 0 && d + p.r > bR) {
        const nx = p.x / d, ny = p.y / d;
        const dot = p.vx * nx + p.vy * ny;
        if (dot > 0) { p.vx = (p.vx - 2 * dot * nx) * 0.70; p.vy = (p.vy - 2 * dot * ny) * 0.70; }
        const push = bR - p.r - 1;
        p.x = nx * push; p.y = ny * push;
      }
      if (p.life <= 0) { bounceParticles.splice(i, 1); continue; }
      bounceCtx.save();
      bounceCtx.globalAlpha = Math.max(0, p.life);
      bounceCtx.shadowColor = p.glow;
      bounceCtx.shadowBlur = 9;
      bounceCtx.beginPath();
      bounceCtx.arc(bcx + p.x, bcy + p.y, p.r, 0, Math.PI * 2);
      bounceCtx.fillStyle = p.fill;
      bounceCtx.fill();
      bounceCtx.restore();
    }
    bounceLoop = bounceParticles.length > 0 ? requestAnimationFrame(tick) : null;
    if (!bounceLoop) bounceCtx.clearRect(0, 0, bw, bh);
  }
  bounceLoop = requestAnimationFrame(tick);
}

function spawnEnergyBurst(clientX, clientY, count = 12) {
  if (!fxEnabled) return;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
  const layer = ensureEnergyBurstLayer();
  const n = Math.max(4, Math.min(36, Math.round(count)));
  if (n >= 24) {
    const badge = document.createElement('span');
    badge.className = 'dopamine-badge';
    badge.textContent = 'BURST';
    badge.style.left = `${clientX}px`;
    badge.style.top = `${clientY}px`;
    layer.appendChild(badge);
    setTimeout(() => badge.remove(), 900);
  }
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 36 + Math.random() * 74;
    const spark = document.createElement('span');
    spark.className = 'dopamine-spark';
    spark.style.left = `${clientX}px`;
    spark.style.top = `${clientY}px`;
    spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * distance - 28}px`);
    spark.style.setProperty('--delay', `${Math.random() * 70}ms`);
    layer.appendChild(spark);
    setTimeout(() => spark.remove(), 900);
  }
}

function ensureEnergyBurstLayer() {
  let layer = document.getElementById('dopamine-burst-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'dopamine-burst-layer';
    layer.className = 'dopamine-burst-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}

function spawnFragmentOrbs(count) {
  if (count <= 0) return;
  const core  = document.getElementById('click-core');
  const panel = document.getElementById('core-panel');
  if (!core || !panel) return;
  const cr  = core.getBoundingClientRect();
  const pr  = panel.getBoundingClientRect();
  const cx  = cr.left + cr.width  / 2 - pr.left;
  const cy  = cr.top  + cr.height / 2 - pr.top;
  const orbitR = cr.width / 2 * 1.12;
  const n = Math.min(count, 8);
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + (Math.random() * 0.35 - 0.175);
    const orb = document.createElement('div');
    orb.className = 'fragment-orb';
    orb.textContent = '⬡';
    orb.style.left = `${cx + Math.cos(angle) * orbitR}px`;
    orb.style.top  = `${cy + Math.sin(angle) * orbitR}px`;
    panel.appendChild(orb);
    const t = setTimeout(() => collectOrb(orb), 2000);
    orb.addEventListener('click', e => { e.stopPropagation(); clearTimeout(t); collectOrb(orb); }, { once: true });
  }
}

function collectOrb(orb) {
  if (!orb.isConnected) return;
  const stat = document.getElementById('stat-fragments');
  const or   = orb.getBoundingClientRect();
  orb.remove();
  if (!stat || !fxEnabled) return;
  const sr    = stat.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'fragment-orb-ghost';
  ghost.textContent = '⬡';
  ghost.style.left = `${or.left + or.width  / 2}px`;
  ghost.style.top  = `${or.top  + or.height / 2}px`;
  ghost.style.setProperty('--tx', `${sr.left + sr.width  / 2 - or.left - or.width  / 2}px`);
  ghost.style.setProperty('--ty', `${sr.top  + sr.height / 2 - or.top  - or.height / 2}px`);
  document.body.appendChild(ghost);
  requestAnimationFrame(() => ghost.classList.add('fragment-orb-ghost--fly'));
  setTimeout(() => ghost.remove(), 600);
}

function pulseReactor() {
  if (!fxEnabled) return;
  const core = document.getElementById('click-core');
  core?.classList.remove('pulse-hit');
  requestAnimationFrame(() => core?.classList.add('pulse-hit'));
}

function pulseShell(mode = 'store') {
  if (!fxEnabled) return;
  const panel = document.getElementById('core-panel');
  panel?.classList.remove('shell-store-hit', 'shell-crack-hit', 'shell-break-hit');
  requestAnimationFrame(() => panel?.classList.add(mode === 'break' ? 'shell-break-hit' : mode === 'crack' ? 'shell-crack-hit' : 'shell-store-hit'));
}

function sparkTendrils() {
  if (!fxEnabled) return;
  const panel = document.getElementById('core-panel');
  panel?.classList.remove('tendril-hit');
  requestAnimationFrame(() => panel?.classList.add('tendril-hit'));
}

function spawnModule(upgradeId, level) {
  if (!fxEnabled) return;
  const group = getCoreModuleGroup(upgradeId);
  if (!group) return;
  let node = document.querySelector(`[data-module-group="${group.id}"]`);
  if (!node) {
    renderModules(true);
    node = document.querySelector(`[data-module-group="${group.id}"]`);
  }
  if (!node) return;
  node.classList.remove('module-just-upgraded');
  node.style.setProperty('--module-last-level', String(level ?? 1));
  void node.offsetWidth;
  node.classList.add('module-just-upgraded');
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

function formatCoreScale(coreCount) {
  if (coreCount === 0) return '0.001 pm';
  const pm = 0.001 * Math.pow(1 + coreCount * 0.5, 1.5);
  if (pm >= 1000) return `${(pm / 1000).toPrecision(3)} nm`;
  return `${pm.toPrecision(3)} pm`;
}

function applyCoreZoom() {
  const panel = document.getElementById('core-panel');
  if (!panel) return;
  const target = CORE_ZOOM_LEVELS[coreZoomIndex] ?? CORE_ZOOM_LEVELS[0];
  const effective = Math.min(target, lastAutoFitZoom);
  panel.style.setProperty('--panel-zoom', effective.toFixed(4));
  // Le microscope « se referme » quand on dézoome (système plus large à observer).
  panel.classList.toggle('microscope-active', effective < 0.62);
  const readout = document.getElementById('core-zoom-readout');
  // Affiche le zoom réellement appliqué (capé), pas le niveau visé — sinon le
  // readout ment dès que la structure est trop grande pour le niveau sélectionné.
  if (readout) readout.textContent = `${Math.round(effective * 100)}%`;
  const ctrl = document.getElementById('core-zoom-control');
  if (ctrl) {
    ctrl.querySelector('[data-zoom-step="-1"]')?.toggleAttribute('disabled', coreZoomIndex <= 0);
    ctrl.querySelector('[data-zoom-step="1"]')?.toggleAttribute('disabled', coreZoomIndex >= CORE_ZOOM_LEVELS.length - 1);
  }
}

function stepCoreZoom(delta) {
  coreZoomIndex = Math.min(CORE_ZOOM_LEVELS.length - 1, Math.max(0, coreZoomIndex + delta));
  localStorage.setItem(CORE_ZOOM_KEY, String(coreZoomIndex));
  applyCoreZoom();
}

// Formule de cap de zoom, isolée pour être appelable depuis le rendu complet
// (renderSubCores, mesure DOM fraîche) et le recalcul léger (resize/layout).
function setAutoFitZoom(R_main, panelShort, totalExtent) {
  lastAutoFitZoom = totalExtent > R_main
    ? Math.max(0.30, Math.min(1, (panelShort * 0.80) / (totalExtent * 2)))
    : 1;
}

// Géométrie pure (sans DOM) de l'extension totale du champ de noyaux pour un
// R_main donné — doit rester en phase avec la construction réelle dans
// renderSubCores (mêmes formules mainExtent/hexR/dupExtent).
function computeTotalExtent(R_main) {
  const nitroLvl = state.upgrades?.nitroFactory ?? 0;
  const engineLvl = state.upgrades?.enginePlant ?? 0;
  const reflections = orbitalReflections(nitroLvl);
  const dupCount = Math.min(MAX_CORE_DUPLICATES, Math.floor(engineLvl / 10));
  const mainExtent = orbitGeometry(reflections, R_main).extent;
  let totalExtent = mainExtent;
  if (dupCount > 0) {
    const R_dup = R_main * 0.66;
    const dupExtent = orbitGeometry(reflections, R_dup).extent;
    const gap2 = R_main * 0.5;
    const hexR = Math.max(mainExtent + dupExtent + gap2, 2 * dupExtent + gap2);
    totalExtent = Math.max(totalExtent, hexR + dupExtent);
  }
  return totalExtent;
}

// Recalcule le cap de zoom sans reconstruire le DOM des noyaux — utilisé quand
// la taille du panneau change (resize, changement de layout, sortie du mode
// STATS) sans que le niveau nitroFactory/enginePlant n'ait bougé.
function recalcAutoFitZoom() {
  const panel = document.getElementById('core-panel');
  const coreEl = document.getElementById('click-core');
  if (!panel || !coreEl) return;
  const coreRect = coreEl.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  if (coreRect.width <= 0 || panelRect.width <= 0) return; // caché (mode stats) ou pas encore monté
  const curZoom = parseFloat(getComputedStyle(panel).getPropertyValue('--panel-zoom')) || 1;
  const R_main = (coreRect.width / curZoom) / 2;
  lastKnownRMain = R_main;
  const panelShort = Math.min(panelRect.width, panelRect.height);
  setAutoFitZoom(R_main, panelShort, computeTotalExtent(R_main));
  applyCoreZoom();
}

let resizeRecalcTimer = null;
function scheduleAutoFitRecalc() {
  clearTimeout(resizeRecalcTimer);
  resizeRecalcTimer = setTimeout(recalcAutoFitZoom, 150);
}

let fusionInProgress = false;

async function triggerCoreFusion() {
  if (fusionInProgress || !canFuseCore(state)) return;
  fusionInProgress = true;

  const btn = document.getElementById('core-fusion-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⚛ RÉSONANCE…'; }

  const clones = [...document.querySelectorAll('.dup-core > .sub-core.is-dup')];

  // Phase 1 : les clones entrent en résonance (glow ambre)
  clones.forEach(c => c.classList.add('fusion-resonating'));
  await new Promise(r => setTimeout(r, 950));

  // Phase 2 : absorption séquentielle — chaque clone s'effondre
  for (let i = 0; i < clones.length; i++) {
    clones[i].classList.remove('fusion-resonating');
    clones[i].classList.add('fusion-absorbing');
    if (fxEnabled) playGameSound('ui.zap', { volume: 0.85 }, 'zap');
    await new Promise(r => setTimeout(r, 270));
  }
  await new Promise(r => setTimeout(r, 400));

  // Phase 3 : fusion — mutation de l'état
  const result = doFuseCore(state);
  if (!result.ok) { fusionInProgress = false; return; }
  persist();

  // Phase 4 : émergence du noyau Tier II
  const coreEl = document.getElementById('click-core');
  if (coreEl) {
    coreEl.classList.add('core-tier-2', 'tier2-emerge');
    setTimeout(() => coreEl.classList.remove('tier2-emerge'), 1400);
  }
  spawnSystemWave('⚛ NOYAU TIER II');

  renderAll(true);
  fusionInProgress = false;
}

// Mode stats : bascule vers une vue « tableur/terminal » — cache les noyaux et
// leurs FX continus (anneaux, plasma, spin, scan…), affiche toutes les stats en
// texte façon vieux terminal de code.
function applyCoreStatsMode() {
  const panel = document.getElementById('core-panel');
  if (panel) panel.classList.toggle('core-stats', coreStatsMode);
  const btn = document.getElementById('core-stats-toggle');
  if (btn) {
    btn.classList.toggle('active', coreStatsMode);
    btn.setAttribute('aria-pressed', String(coreStatsMode));
  }
  if (coreStatsMode) {
    renderCoreTerminal();
  } else {
    // Le viewport redevient visible : les mesures DOM (R_main) étaient invalides
    // pendant qu'il était caché (display:none), il faut recaper le zoom.
    requestAnimationFrame(() => recalcAutoFitZoom());
  }
}

// é/s d'un noyau « nu » : prod totale dégrevée des orbitaux (coreMultiplier) ET du
// nombre de noyaux (coreCount), pour que la somme des noyaux affichés = prod réelle.
function getCoreBaseRate() {
  const total = (state?.passiveRate ?? 0) + (state?.factoryRate ?? 0);
  const div = Math.max(1, state?.coreMultiplier ?? 1) * Math.max(1, state?.coreCount ?? 1);
  return total / div;
}

// Vue tableur du noyau : une ligne par noyau (principal + orbitaux + clones) avec
// sa réflexion et sa prod, plus un récapitulatif des stats globales. Remplace
// entièrement l'affichage visuel des sphères en mode STATS.
function renderCoreTerminal() {
  if (!state || !coreStatsMode) return;
  const root = document.getElementById('core-terminal');
  if (!root) return;

  const base = getCoreBaseRate();
  const nitroLvl = state.upgrades?.nitroFactory ?? 0;
  const engineLvl = state.upgrades?.enginePlant ?? 0;
  const reflections = orbitalReflections(nitroLvl);
  const dupCount = Math.min(MAX_CORE_DUPLICATES, Math.floor(engineLvl / 10));

  const rows = [{ id: 'CORE', type: 'principal', reflect: 1, prod: base }];
  reflections.forEach((r, i) => rows.push({ id: `ORB-${i + 1}`, type: 'orbital', reflect: r, prod: r * base }));
  for (let k = 0; k < dupCount; k++) rows.push({ id: `CLN-${k + 1}`, type: 'clone', reflect: 1, prod: base });
  const total = rows.reduce((sum, r) => sum + r.prod, 0);

  const shell = getCoreShellInfo(state);
  const req = prestigeRequirement(state);

  setHtml(root, `
    <div class="terminal-head">// NITRO CORE — STATUS REPORT</div>
    <table class="terminal-table">
      <thead><tr><th>ID</th><th>TYPE</th><th>REFL</th><th>PROD/S</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r.id}</td><td>${r.type}</td><td>${Math.round(r.reflect * 100)}%</td><td>${fmt(r.prod)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="3">TOTAL · ${rows.length} noyau${rows.length > 1 ? 'x' : ''}</td><td>${fmt(total)}</td></tr></tfoot>
    </table>
    <div class="terminal-summary">
      <div><span>ÉNERGIE</span><strong>${fmt(state.energy)}</strong></div>
      <div><span>ÉNERGIE TOTALE</span><strong>${fmt(state.totalEnergy)}</strong></div>
      <div><span>FRAGMENTS</span><strong>${fmt(state.fragments)}</strong></div>
      <div><span>PAR CLIC</span><strong>${fmt(state.clickPower)}</strong></div>
      <div><span>PRESTIGE</span><strong>${fmt(state.prestige)} · ${fmt(state.energy)}/${fmt(req)}</strong></div>
      <div><span>SURCHARGE</span><strong>${Math.floor((state.surcharge / state.maxSurcharge) * 100)}%</strong></div>
      <div><span>COQUE</span><strong>${shell.unlocked ? `${shell.storedFragments}/${shell.capacity}F · ${shell.cracks}/${shell.requiredHits} fissures` : 'VERROUILLÉE'}</strong></div>
      <div><span>MULT. NOYAU</span><strong>×${(state.coreMultiplier ?? 1).toFixed(2)} · ×${state.coreCount ?? 1} noyaux</strong></div>
    </div>
  `);
}

const ORBITAL_MIN_REFLECT = 0.10;
const ORBITAL_MAX_REFLECT = 0.80;
const MAX_CORE_DUPLICATES = 5;

// Plafond défensif du nombre de noyaux orbitaux rendus — bien au-delà de ce
// qu'une partie légitime atteint (~10 vers prestige 45), pour qu'une save
// corrompue/valeur aberrante ne génère pas des milliers de nœuds DOM d'un
// coup et ne bloque le thread principal (crash navigateur type hang).
const MAX_ORBITAL_RINGS = 60;

// Réflexions des noyaux orbitaux (upgrade « Multiplicateur de noyau » / nitroFactory).
// 1 noyau orbital par tranche de 10 niveaux. Le plus récent grandit DANS sa décade :
// sa réflexion passe de 10% (niveau X1) à 80% au déblocage du suivant, puis se fige à 80%.
function orbitalReflections(nitroLvl) {
  const full = Math.min(MAX_ORBITAL_RINGS, Math.floor(nitroLvl / 10));
  const partial = nitroLvl % 10;
  const list = [];
  for (let i = 0; i < full; i++) list.push(ORBITAL_MAX_REFLECT);
  if (partial > 0 && full < MAX_ORBITAL_RINGS) {
    list.push(ORBITAL_MIN_REFLECT + ((partial - 1) / 9) * (ORBITAL_MAX_REFLECT - ORBITAL_MIN_REFLECT));
  }
  return list;
}

// Géométrie pure d'un anneau orbital autour d'un noyau de rayon R_center.
// Sépare le calcul (réutilisé pour pré-mesurer les clones) du rendu DOM.
function orbitGeometry(reflections, R_center) {
  if (!reflections.length) return { sizes: [], orbitR: 0, subR: 0, extent: R_center };
  const sizes = reflections.map(r => Math.max(R_center * 0.34, r * R_center * 1.7));
  const subR = Math.max(...sizes) / 2;
  const n = reflections.length;
  const gap = Math.max(R_center * 0.45, 40);
  const minTangential = R_center + subR + gap;
  const minPacking = n > 1 ? subR / Math.sin(Math.PI / n) + gap * 0.6 : 0;
  const orbitR = Math.max(minTangential, minPacking);
  return { sizes, orbitR, subR, extent: orbitR + subR };
}

// Noyau central simplifié : plus de rendu DOM par orbite/clone (chaque noyau
// orbital + chaque clone hexagonal portait ses propres animations superposées
// — rings, plasma, contre-rotation — dont le cumul pouvait bloquer/crasher le
// navigateur sur une partie avancée). Le noyau principal reste seul visible ;
// les mécaniques (coreMultiplier, coreCount, tierBonus, prod) sont inchangées,
// seul l'affichage est redevenu simple.
function renderSubCores() {
  const field = document.getElementById('sub-core-field');
  if (!field) return;

  const nitroLvl = state.upgrades?.nitroFactory ?? 0;
  const engineLvl = state.upgrades?.enginePlant ?? 0;
  const orbitalCount = orbitalReflections(nitroLvl).length;
  const dupCount = Math.min(MAX_CORE_DUPLICATES, Math.floor(engineLvl / 10));

  const signature = `${nitroLvl}:${dupCount}`;
  if (signature === lastSubCoreSignature) return;
  lastSubCoreSignature = signature;
  lastOrbitalCount = orbitalCount;
  lastDupCount = dupCount;

  field.innerHTML = '';
  lastAutoFitZoom = 1;
  applyCoreZoom();

  const scaleEl = document.getElementById('core-scale-value');
  if (scaleEl) scaleEl.textContent = formatCoreScale(orbitalCount + dupCount);

  document.getElementById('click-core')?.classList.toggle('core-tier-2', (state.coreTier ?? 0) >= 1);
}

function pulseSubCores() {
  if (!fxEnabled || coreStatsMode) return;
  document.querySelectorAll('.sub-core-inner').forEach(inner => {
    inner.classList.remove('pulse-hit');
    void inner.offsetWidth;
    inner.classList.add('pulse-hit');
    setTimeout(() => inner.classList.remove('pulse-hit'), 430);
  });
  window.NitroPlasmaFeedback?.triggerSubCores?.(1);
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

function spawnLightningToElement(element, label = '', { silent = false, from = null } = {}) {
  if (!fxEnabled || !element) return;
  const layer = document.getElementById('lightning-layer');
  const core = from ?? getCoreCenter();
  const rect = element.getBoundingClientRect();
  if (!layer || !core || !rect) return;
  const target = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'lightning-bolt');
  path.setAttribute('d', makeLightningPath(core.x, core.y, target.x, target.y));
  layer.appendChild(path);
  setTimeout(() => path.remove(), 520);
  if (!silent) playGameSound('ui.zap', { volume: 0.65 }, 'zap');

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
  const targets = [...document.querySelectorAll('.upgrade-btn:not(.locked), .shell-break-card, .prestige-card, .spawned-module, .factory-node')].sort(() => Math.random() - 0.5).slice(0, count);
  targets.forEach((target, i) => setTimeout(() => spawnLightningToElement(target), i * 70));
  reflectLightningToClones();
}

function elementCenter(el) {
  const r = el?.getBoundingClientRect();
  if (!r || !r.width) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function pulseClone(cloneBody) {
  const inner = cloneBody?.querySelector('.sub-core-inner');
  if (inner) {
    inner.classList.remove('pulse-hit');
    void inner.offsetWidth;
    inner.classList.add('pulse-hit');
    setTimeout(() => inner.classList.remove('pulse-hit'), 430);
  }
  cloneBody?.classList.remove('clone-pulse');
  void cloneBody?.offsetWidth;
  cloneBody?.classList.add('clone-pulse');
  setTimeout(() => cloneBody?.classList.remove('clone-pulse'), 380);
}

// Réflexion des éclairs : le noyau principal envoie un éclair vers chaque clone,
// que le clone renvoie ensuite à ses propres orbitaux (réflexion en cascade).
function reflectLightningToClones({ max = Infinity } = {}) {
  if (!fxEnabled || coreStatsMode) return;
  let clones = [...document.querySelectorAll('.dup-core > .sub-core.is-dup')];
  if (!clones.length) return;
  if (max < clones.length) clones = clones.sort(() => Math.random() - 0.5).slice(0, max);
  clones.forEach((clone, i) => setTimeout(() => {
    spawnLightningToElement(clone, '', { silent: i > 0 });
    pulseClone(clone);
    const center = elementCenter(clone);
    clone.parentElement?.querySelectorAll('.sub-core:not(.is-dup)').forEach(orb =>
      spawnLightningToElement(orb, '', { silent: true, from: center }));
  }, i * 55));
}

function renderAll(force = false) {
  renderStats();
  renderCoreShell(force);
  renderScaleCard(force);
  renderUpgrades(force);
  renderMilestones(force);
  renderModules(force);
  renderTendrils(force);
  renderSubCores();
  renderLemegetonSkills(force);
  renderBoostShop(force);
  applyBoostCoreTint();
}

function renderLive() {
  renderStats();
  renderCoreShell();
  renderUpgradesLive();
  renderLemegetonSkills();
  renderBoostShop();
  applyBoostCoreTint();
}

function getNextAffordableCost() {
  const costs = UPGRADES
    .filter(upgrade => isUpgradeUnlocked(state, upgrade))
    .map(upgrade => upgradeBulkCost(upgrade, state.upgrades[upgrade.id] ?? 0, buyMultiplier));
  return Math.min(...costs, prestigeRequirement(state));
}

function renderStats() {
  const layer = getScalingLayer(state);
  const shell = getCoreShellInfo(state);
  const growth = getCoreGrowthLevel(state);
  const nextCost = getNextAffordableCost();
  const energyRatio = Math.min(1, state.energy / Math.max(1, nextCost));
  const passiveRatio = Math.min(1, Number(state.passiveRate ?? 0) / 2500);
  const surchargeRatio = Math.min(1, state.surcharge / Math.max(1, state.maxSurcharge));
  const fragmentRatio = Math.min(1, state.fragments / 25);
  const subCoreCount = Math.floor((state.upgrades?.nitroFactory ?? 0) / 10);
  const moduleLevelTotal = CORE_MODULE_GROUPS.reduce((sum, group) => (
    sum + group.ids.reduce((inner, id) => inner + (state.upgrades?.[id] ?? 0), 0)
  ), 0);
  const shellRatio = shell.unlocked ? Math.max(shell.fillRatio, shell.crackRatio) : 0;
  app.dataset.layer = layer.id;
  app.dataset.coreGrowth = String(growth);
  const corePanel = document.getElementById('core-panel');
  if (corePanel) {
    corePanel.dataset.layer = layer.id;
    corePanel.dataset.shellUnlocked = String(shell.unlocked);
    corePanel.style.setProperty('--core-growth', String(growth));
    corePanel.style.setProperty('--core-shell-fill', String(shell.fillRatio));
    corePanel.style.setProperty('--core-shell-crack', String(shell.crackRatio));
    corePanel.style.setProperty('--core-shell-reflect', String(Math.min(1, shell.reflect)));
    corePanel.style.setProperty('--core-energy-ratio', energyRatio.toFixed(4));
    corePanel.style.setProperty('--core-passive-ratio', passiveRatio.toFixed(4));
    corePanel.style.setProperty('--core-surcharge-ratio', surchargeRatio.toFixed(4));
    corePanel.style.setProperty('--core-fragment-ratio', fragmentRatio.toFixed(4));
  }
  if (coreStatsMode) renderCoreTerminal();
  window.NitroSound?.updateCoreAmbience?.({
    energyRatio,
    passiveRatio,
    surchargeRatio,
    fragmentRatio,
    shellRatio,
    subCoreRatio: Math.min(1, subCoreCount / 12),
    moduleRatio: Math.min(1, moduleLevelTotal / 90),
    prestigeRatio: Math.min(1, (state.prestige ?? 0) / 25),
  });

  if (lastLayerId && lastLayerId !== layer.id) spawnScaleShift();
  lastLayerId = layer.id;

  setText('stat-energy', fmt(state.energy));
  setText('stat-total-energy', fmt(state.totalEnergy));
  setText('stat-fragments', fmt(state.fragments));
  setText('stat-click', fmt(state.clickPower));
  setText('stat-passive', `${Number(state.passiveRate ?? 0).toFixed(2)}`);
  setText('stat-prestige', fmt(state.prestige));
  setText('stat-surcharge', `${Math.floor((state.surcharge / state.maxSurcharge) * 100)}%`);
  setText('stat-shell', shell.unlocked ? `${shell.storedFragments}/${shell.capacity}` : 'LOCK');

  setMeter('meter-energy', energyRatio);
  setMeter('meter-total-energy', Math.min(1, state.totalEnergy / Math.max(1, prestigeRequirement(state) * 10)));
  setMeter('meter-fragments', fragmentRatio);
  setMeter('meter-click', Math.min(1, state.clickPower / 1000));
  setMeter('meter-passive', passiveRatio);
  setMeter('meter-surcharge', surchargeRatio);
  setMeter('meter-shell', shell.unlocked ? Math.max(shell.fillRatio, shell.crackRatio * 0.35) : 0);

  const req = prestigeRequirement(state);
  const preview = getPrestigePreview(state);
  const prestigeRatio = Math.min(1, state.energy / Math.max(1, req));
  setMeter('meter-prestige', prestigeRatio);
  setMeter('prestige-fill', prestigeRatio);

  const btn = document.getElementById('prestige-btn');
  setText('prestige-cost', `${fmt(state.energy)} / ${fmt(req)}`);
  setText('prestige-desc', `Reset le run · +${fmt(preview.fragmentReward)}F · réserve +${fmt(preview.starterEnergy)}E · conserve tes systèmes permanents.`);
  if (btn) {
    btn.disabled = state.energy < req;
    setClassToggle(btn, 'can-buy', state.energy >= req);
  }

  if (!fusionInProgress) {
    const fusionBtn = document.getElementById('core-fusion-btn');
    if (fusionBtn) {
      const tier = Number(state.coreTier ?? 0);
      const canFuse = canFuseCore(state);
      const atMax = tier >= MAX_FUSION_TIER;
      fusionBtn.style.display = (canFuse || tier > 0) ? '' : 'none';
      fusionBtn.disabled = !canFuse;
      if (canFuse) {
        fusionBtn.textContent = `⚛ FUSION TIER ${tier + 1} — ${fmt(BALANCE.fusionCost)} é`;
      } else if (atMax) {
        fusionBtn.textContent = `TIER ${tier} ⚛ MAX`;
      } else if (tier > 0) {
        fusionBtn.textContent = `TIER ${tier} ⚛`;
      }
    }
  }
}

function setMeter(id, ratio) {
  setTransformScaleX(id, ratio);
}

function renderCoreShell(force = false) {
  const shell = getCoreShellInfo(state);
  const signature = `${shell.unlocked}:${shell.capacity}:${shell.hardness}:${shell.storedFragments}:${shell.cracks}:${shell.breakCost}:${shell.breakChance}:${shell.reflect}:${state.energy}`;
  if (!force && signature === lastShellSignature) return;
  lastShellSignature = signature;

  const card = document.getElementById('core-shell-card');
  const btn = document.getElementById('shell-break-btn');
  if (!card || !btn) return;

  if (!shell.unlocked) {
    setHtml(card, `<div class="shell-empty"><strong>Sphère non formée</strong><p>Achète <b>Isolation du noyau</b> pour créer une coque qui stocke les fragments Nitro avant extraction.</p></div>`);
    btn.disabled = true;
    setClassToggle(btn, 'can-buy', false);
    setText('shell-break-cost', 'LOCKED');
    setMeter('shell-break-fill', 0);
    renderShellCracks(shell);
    return;
  }

  const canTry = shell.storedFragments > 0 && state.energy >= shell.breakCost;
  setClassToggle(btn, 'can-buy', canTry);
  btn.disabled = !canTry;
  setText('shell-break-cost', `${fmt(shell.breakCost)} E`);
  setText('shell-break-desc', `Chance ${Math.round(shell.breakChance * 100)}% de briser la sphère et libérer les fragments stockés.`);
  setMeter('shell-break-fill', Math.min(1, state.energy / Math.max(1, shell.breakCost)));

  setHtml(card, `
    <div class="shell-grid">
      <div><span>Stockage</span><strong>${shell.storedFragments}/${shell.capacity} F</strong></div>
      <div><span>Dureté</span><strong>${shell.hardness}</strong></div>
      <div><span>Réflexion</span><strong>+${Math.round(shell.reflect * 100)}%</strong></div>
      <div><span>Fissures</span><strong>${shell.cracks}/${shell.requiredHits}</strong></div>
    </div>
    <div class="shell-meter"><i style="transform:scaleX(${shell.fillRatio})"></i><b style="transform:scaleX(${shell.crackRatio})"></b></div>
  `);
  renderShellCracks(shell);
}

const MAX_SHELL_CRACK_FRAGS = 8;

// Fissures visibles : un petit éclat DOM par fissure accumulée (plafonné), positionné
// en cercle autour de la coque. Diffe contre le DOM existant pour n'animer que les nouveaux.
function renderShellCracks(shell) {
  const field = document.getElementById('shell-crack-fragments');
  if (!field) return;
  const count = shell.unlocked ? Math.min(MAX_SHELL_CRACK_FRAGS, Math.floor(shell.cracks)) : 0;
  const current = field.children.length;
  if (count === current) return;

  if (count < current) {
    field.innerHTML = '';
    for (let i = 0; i < count; i++) field.appendChild(makeShellCrackFrag(i));
    return;
  }

  for (let i = current; i < count; i++) {
    const frag = makeShellCrackFrag(i);
    frag.classList.add('just-cracked');
    field.appendChild(frag);
    setTimeout(() => frag.classList.remove('just-cracked'), 520);
  }
}

function makeShellCrackFrag(idx) {
  const frag = document.createElement('span');
  frag.className = 'shell-crack-frag';
  frag.style.setProperty('--frag-angle', `${(idx * (360 / MAX_SHELL_CRACK_FRAGS)).toFixed(1)}deg`);
  return frag;
}

function getUpgradeSignature() {
  return UPGRADES.map(upgrade => {
    const unlocked = isUpgradeUnlocked(state, upgrade) ? 1 : 0;
    const level = state.upgrades[upgrade.id] ?? 0;
    const currency = upgrade.currency ?? 'energy';
    return `${upgrade.id}:${unlocked}:${level}:${buyMultiplier}:${currency}`;
  }).join('|');
}

function renderUpgrades(force = false) {
  const root = document.getElementById('upgrade-list');
  if (!root) return;
  const signature = getUpgradeSignature();
  if (!force && signature === lastUpgradeSignature && root.children.length) {
    renderUpgradesLive();
    return;
  }
  lastUpgradeSignature = signature;
  setHtml(root, UPGRADES.map(upgrade => renderUpgradeButton(upgrade)).join(''));
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
        <div class="upgrade-buy-meta" data-upgrade-meta="${upgrade.id}">Évolution progressive</div>
      </button>`;
  }

  return `
    <button class="upgrade-btn ${canBuySingle ? 'can-buy' : ''} ${canBuyBulk ? 'can-buy-bulk' : ''}" data-upgrade="${upgrade.id}" ${canBuyBulk ? '' : 'disabled'}>
      <span class="upgrade-fill" data-upgrade-fill="${upgrade.id}" style="transform:scaleX(${progress})"></span>
      <div class="upgrade-head">
        <span class="upgrade-name">${upgrade.icon} ${upgrade.name} <small data-upgrade-level="${upgrade.id}">Lv.${level}</small></span>
        <span class="upgrade-cost" data-upgrade-cost="${upgrade.id}">${fmt(bulkCost)} ${currencyLabel(currency)}</span>
      </div>
      <div class="upgrade-desc">${typeof upgrade.desc === 'function' ? upgrade.desc(state) : upgrade.desc}</div>
      <div class="upgrade-buy-meta" data-upgrade-meta="${upgrade.id}">Achat ×${buyMultiplier} · unité ${fmt(singleCost)} ${currencyLabel(currency)}</div>
    </button>`;
}

function bindUpgradeButtons() {
  document.querySelectorAll('[data-upgrade]:not(.locked)').forEach(btn => {
    btn.addEventListener('click', event => {
      const result = buyUpgradeAmount(state, btn.dataset.upgrade, buyMultiplier);
      if (!result.ok) {
        playGameSound('upgrade.locked', { volume: 0.75 });
        return toast(result.reason === 'locked' ? 'Upgrade verrouillé.' : `Ressource insuffisante pour ×${buyMultiplier}.`);
      }
      const isMilestoneBuy = result.level % 10 === 0 || result.amount >= 10;
      playGameSound(isMilestoneBuy ? 'upgrade.levelUp' : 'upgrade.buy', { volume: Math.min(1, 0.72 + result.amount * 0.025) }, 'buy');
      setTimeout(() => playCoreModuleSound(btn.dataset.upgrade, result.level, result.amount), 55);
      spawnModule(btn.dataset.upgrade, result.level);
      spawnLightningToElement(event.currentTarget, `×${result.amount}`);
      spawnEnergyBurst(event.clientX, event.clientY, Math.min(26, 8 + result.amount * 2));
      if (['coreIsolation', 'reflectiveAlloy', 'mirrorGel', 'prismGlass'].includes(btn.dataset.upgrade)) pulseShell('store');
      claimMilestonesAndRender();
      scheduleSave();
      toast(`${result.persistent ? 'Upgrade permanent' : 'Upgrade'} ×${result.amount} acheté · niveau ${result.level}`);
    });
  });
}

function triggerUnlockShimmer(btn) {
  if (!btn) return;
  btn.classList.remove('unlock-shimmer');
  requestAnimationFrame(() => {
    btn.classList.add('unlock-shimmer');
    setTimeout(() => btn.classList.remove('unlock-shimmer'), 750);
  });
}

function getLemegetonSignature() {
  return LEMEGETON_SKILLS.map(skill => {
    const unlocked = isLemegetonSkillUnlocked(state, skill) ? 1 : 0;
    const level = lemegetonSkillLevel(state, skill.id);
    const active = skill.toggleable ? (isLemegetonSkillActive(state, skill.id) ? 1 : 0) : '';
    return `${skill.id}:${unlocked}:${level}:${active}`;
  }).join('|') + `|f${Math.floor(state.fragments ?? 0)}`;
}

function renderLemegetonSkills(force = false) {
  const root = document.getElementById('lemegeton-skill-list');
  if (!root) return;
  const pane = document.querySelector('[data-shop-pane="lemegeton"]');
  const online = isLemegetonOnline(state);
  if (pane) pane.classList.toggle('locked', !online);

  const hint = document.getElementById('lemegeton-skill-hint');
  if (hint) {
    hint.textContent = online
      ? 'Compétences permanentes · payées en fragments · survivent au prestige.'
      : `LEMEGETON hors-ligne · atteins 1 Md d'énergie cumulée ou le Prestige 10 pour booter l'arbre.`;
  }

  const signature = getLemegetonSignature();
  if (!force && signature === lastLemegetonSignature && root.children.length) return;
  lastLemegetonSignature = signature;
  setHtml(root, LEMEGETON_SKILLS.map(renderLemegetonSkillButton).join(''));
  bindLemegetonButtons();
}

function renderLemegetonSkillButton(skill) {
  const unlocked = isLemegetonSkillUnlocked(state, skill);
  const level = lemegetonSkillLevel(state, skill.id);
  const maxed = isLemegetonSkillMaxed(state, skill);
  const cost = lemegetonSkillCost(skill, level);
  const held = Math.floor(state.fragments ?? 0);
  const canBuy = unlocked && !maxed && held >= cost;
  const progress = unlocked && !maxed ? Math.min(1, held / Math.max(1, cost)) : maxed ? 1 : 0;
  const desc = typeof skill.desc === 'function' ? skill.desc(state) : skill.desc;
  const levelLabel = skill.kind === 'unlock'
    ? (level >= 1 ? 'ACTIF' : 'INACTIF')
    : `Lv.${level}${skill.maxLevel ? `/${skill.maxLevel}` : ''}`;

  if (!unlocked) {
    return `
      <button class="lemegeton-skill locked" data-skill="${skill.id}" disabled>
        <span class="lemegeton-skill-fill" style="transform:scaleX(0)"></span>
        <div class="lemegeton-skill-head">
          <span class="lemegeton-skill-name">${skill.icon} ${skill.name}</span>
          <span class="lemegeton-skill-cost">LOCK</span>
        </div>
        <div class="lemegeton-skill-desc">${skill.lockedText ?? 'Verrouillé.'}</div>
      </button>`;
  }

  if (skill.toggleable && level >= 1) {
    const active = isLemegetonSkillActive(state, skill.id);
    return `
      <button class="lemegeton-skill toggleable ${active ? 'on' : 'off'}" data-skill="${skill.id}" data-skill-toggle="1">
        <span class="lemegeton-skill-fill" style="transform:scaleX(${active ? 1 : 0})"></span>
        <div class="lemegeton-skill-head">
          <span class="lemegeton-skill-name">${skill.icon} ${skill.name} <small>${active ? 'ACTIF' : 'EN PAUSE'}</small></span>
          <span class="lemegeton-skill-cost">${active ? 'ON' : 'OFF'}</span>
        </div>
        <div class="lemegeton-skill-desc">${desc}</div>
      </button>`;
  }

  const costLabel = maxed ? (skill.kind === 'unlock' ? 'ACTIF' : 'MAX') : `${fmt(cost)} F`;
  return `
    <button class="lemegeton-skill ${canBuy ? 'can-buy' : ''} ${maxed ? 'maxed' : ''}" data-skill="${skill.id}" ${canBuy ? '' : 'disabled'}>
      <span class="lemegeton-skill-fill" style="transform:scaleX(${progress})"></span>
      <div class="lemegeton-skill-head">
        <span class="lemegeton-skill-name">${skill.icon} ${skill.name} <small>${levelLabel}</small></span>
        <span class="lemegeton-skill-cost">${costLabel}</span>
      </div>
      <div class="lemegeton-skill-desc">${desc}</div>
    </button>`;
}

function bindLemegetonButtons() {
  document.querySelectorAll('[data-skill]:not(.locked)').forEach(btn => {
    btn.addEventListener('click', event => {
      if (btn.dataset.skillToggle) {
        const r = toggleLemegetonSkill(state, btn.dataset.skill);
        if (!r.ok) return;
        const sk = LEMEGETON_SKILLS.find(s => s.id === btn.dataset.skill);
        lastLemegetonSignature = '';
        renderLemegetonSkills(true);
        scheduleSave();
        toast(`LEMEGETON · ${sk?.name ?? ''} ${r.active ? 'réactivé' : 'mis en pause'}`);
        return;
      }
      const result = buyLemegetonSkill(state, btn.dataset.skill);
      if (!result.ok) {
        if (result.reason === 'maxed') return;
        playGameSound('upgrade.locked', { volume: 0.68 });
        return toast(result.reason === 'not_enough_fragments'
          ? `Fragments insuffisants (${fmt(result.cost)} F requis).`
          : 'Compétence verrouillée.');
      }
      playGameSound(result.skill.kind === 'unlock' ? 'upgrade.levelUp' : 'upgrade.buy', { volume: result.skill.kind === 'unlock' ? 0.9 : 0.78 }, 'buy');
      window.NitroLemegeton?.react?.('skill');
      spawnLightningToElement(event.currentTarget, result.skill.kind === 'unlock' ? 'ACTIF' : `Lv.${result.level}`);
      spawnEnergyBurst(event.clientX, event.clientY, 18);
      lastLemegetonSignature = '';
      renderLemegetonSkills(true);
      renderUpgrades(true);
      scheduleSave();
      toast(`LEMEGETON · ${result.skill.name} ${result.skill.kind === 'unlock' ? 'activé' : `niveau ${result.level}`}`);
    });
  });
}

// ── Boutique de boosts LEMEGETON ─────────────────────────────────────────
let lastBoostSignature = '';

function getBoostSignature() {
  return BOOSTS.map(b => `${b.id}:${getBoostLevel(state, b.id)}:${isBoostActive(state, b.id) ? 1 : 0}`).join('|')
    + `|f${Math.floor(state.fragments ?? 0)}`;
}

function renderBoostShop(force = false) {
  const root = document.getElementById('boost-shop-list');
  if (!root) return;
  const online = isLemegetonOnline(state);
  const pane = document.querySelector('[data-shop-pane="boosts"]');
  if (pane) pane.classList.toggle('locked', !online);

  const hint = document.getElementById('boost-shop-hint');
  if (hint) {
    hint.textContent = online
      ? "Effets temporaires · payés en fragments · le noyau change d'aspect pendant la durée."
      : `LEMEGETON hors-ligne · atteins 1 Md d'énergie cumulée ou le Prestige 10 pour débloquer.`;
  }

  const signature = getBoostSignature();
  if (!force && signature === lastBoostSignature && root.children.length) {
    updateBoostTimers();
    return;
  }
  lastBoostSignature = signature;
  setHtml(root, online ? BOOSTS.map(renderBoostCard).join('') : `<div class="lemegeton-skill locked"><div class="lemegeton-skill-desc">Verrouillé — nécessite LEMEGETON en ligne.</div></div>`);
  bindBoostButtons();
  updateBoostTimers();
}

function renderBoostCard(boost) {
  const level = getBoostLevel(state, boost.id);
  const maxed = isBoostUpgradeMaxed(state, boost.id);
  const upgradeCost = getBoostUpgradeCost(state, boost.id);
  const active = isBoostActive(state, boost.id);
  const held = Math.floor(state.fragments ?? 0);
  const canActivate = !active && held >= boost.activateCost;
  const canUpgrade = !maxed && held >= upgradeCost;
  const durationS = Math.round(getBoostDurationMs(state, boost.id) / 1000);
  const magnitudePct = Math.round(getBoostMagnitude(state, boost.id) * 100);

  return `
    <div class="boost-card boost-tint-${boost.tint} ${active ? 'active' : ''}" data-boost="${boost.id}">
      <div class="lemegeton-skill-head">
        <span class="lemegeton-skill-name">${boost.icon} ${boost.name} <small>Nv.${level}${maxed ? ' MAX' : ''}</small></span>
        <span class="lemegeton-skill-cost" id="boost-timer-${boost.id}">${active ? 'ACTIF' : 'INACTIF'}</span>
      </div>
      <div class="lemegeton-skill-desc">${boost.desc}</div>
      <div class="boost-card-stats">+${magnitudePct}% · ${durationS}s${level > 0 ? ` (Nv.${level})` : ''}</div>
      <div class="boost-card-actions">
        <button class="boost-activate-btn ${canActivate ? 'can-buy' : ''}" data-boost-activate="${boost.id}" ${canActivate ? '' : 'disabled'} type="button">ACTIVER · ${fmt(boost.activateCost)} F</button>
        <button class="boost-upgrade-btn ${canUpgrade ? 'can-buy' : ''}" data-boost-upgrade="${boost.id}" ${(canUpgrade && !maxed) ? '' : 'disabled'} type="button">${maxed ? 'MAX' : `AMÉLIORER · ${fmt(upgradeCost)} F`}</button>
      </div>
    </div>`;
}

function updateBoostTimers() {
  BOOSTS.forEach(boost => {
    const el = document.getElementById(`boost-timer-${boost.id}`);
    if (!el) return;
    if (isBoostActive(state, boost.id)) {
      const remaining = Math.ceil(getBoostRemainingMs(state, boost.id) / 1000);
      el.textContent = `ACTIF · ${remaining}s`;
    }
  });
}

function applyBoostCoreTint() {
  const core = document.getElementById('click-core');
  if (!core) return;
  BOOSTS.forEach(b => core.classList.toggle(`boost-tint-${b.tint}-fx`, isBoostActive(state, b.id)));
}

function bindBoostButtons() {
  document.querySelectorAll('[data-boost-activate]:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', event => {
      const id = btn.dataset.boostActivate;
      const result = activateBoost(state, id);
      if (!result.ok) {
        playGameSound('upgrade.locked', { volume: 0.68 });
        return toast(result.reason === 'not_enough_fragments' ? 'Fragments insuffisants.' : 'Boost verrouillé.');
      }
      const boost = BOOSTS.find(b => b.id === id);
      playGameSound('overdrive.trigger', { volume: 0.85 }, 'overdrive');
      applyBoostCoreTint();
      spawnEnergyBurst(event.clientX, event.clientY, 24);
      spawnSystemWave(`${boost.icon} ${boost.name} ACTIVÉ`);
      lastBoostSignature = '';
      renderBoostShop(true);
      renderUpgrades(true);
      scheduleSave();
    });
  });
  document.querySelectorAll('[data-boost-upgrade]:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', event => {
      const id = btn.dataset.boostUpgrade;
      const result = buyBoostUpgrade(state, id);
      if (!result.ok) {
        playGameSound('upgrade.locked', { volume: 0.68 });
        return toast(result.reason === 'not_enough_fragments' ? 'Fragments insuffisants.' : 'Déjà au niveau max.');
      }
      playGameSound('upgrade.buy', { volume: 0.78 }, 'buy');
      spawnLightningToElement(event.currentTarget, `Lv.${result.level}`);
      lastBoostSignature = '';
      renderBoostShop(true);
      scheduleSave();
    });
  });
}

const AUTO_PURCHASE_IDS = ['autoCore', 'autoClicker'];
function runAutoPurchase() {
  if (!isAutoPurchaseEnabled(state)) return;
  let best = null;
  for (const id of AUTO_PURCHASE_IDS) {
    const upgrade = UPGRADES.find(u => u.id === id);
    if (!upgrade || !isUpgradeUnlocked(state, upgrade)) continue;
    const cost = upgradeCost(upgrade, state.upgrades[upgrade.id] ?? 0);
    if (cost > state.energy) continue;
    if (!best || cost < best.cost) best = { id: upgrade.id, cost };
  }
  if (!best) return;
  const result = buyUpgradeAmount(state, best.id, 1);
  if (result.ok) {
    playCoreModuleSound(best.id, result.level, 1, 0.38);
    spawnModule(best.id, result.level);
    claimMilestonesAndRender();
    scheduleSave();
  }
}

function refreshUpgradesIfNeeded() {
  const previous = lastUpgradeSignature;
  const signature = getUpgradeSignature();
  if (signature === previous) {
    renderUpgradesLive();
    return;
  }

  const newlyUnlocked = previous ? signature.split('|').some((part, idx) => {
    const prev = (previous.split('|')[idx] ?? '').split(':');
    const next = part.split(':');
    return prev[1] === '0' && next[1] === '1';
  }) : false;

  renderUpgrades(true);

  if (newlyUnlocked) {
    const justUnlocked = [...document.querySelectorAll('.upgrade-btn.can-buy')].at(-1);
    triggerUnlockShimmer(justUnlocked);
  }
}

function renderUpgradesLive() {
  for (const upgrade of UPGRADES) {
    if (!isUpgradeUnlocked(state, upgrade)) continue;
    const level = state.upgrades[upgrade.id] ?? 0;
    const currency = upgrade.currency ?? 'energy';
    const held = getCurrency(state, currency);
    const singleCost = upgradeCost(upgrade, level);
    const bulkCost = upgradeBulkCost(upgrade, level, buyMultiplier);
    const btn = document.querySelector(`[data-upgrade="${upgrade.id}"]`);
    if (!btn) continue;
    setClassToggle(btn, 'can-buy', held >= singleCost);
    setClassToggle(btn, 'can-buy-bulk', held >= bulkCost);
    btn.disabled = held < bulkCost;
    setMeterNode(btn.querySelector(`[data-upgrade-fill="${upgrade.id}"]`), Math.min(1, held / Math.max(1, bulkCost)));
    setText(btn.querySelector(`[data-upgrade-cost="${upgrade.id}"]`), `${fmt(bulkCost)} ${currencyLabel(currency)}`);
    setText(btn.querySelector(`[data-upgrade-meta="${upgrade.id}"]`), `Achat ×${buyMultiplier} · unité ${fmt(singleCost)} ${currencyLabel(currency)}`);
  }
}

function renderScaleCard(force = false) {
  const layer = getScalingLayer(state);
  const signature = `${layer.id}:${layer.mult}:${state.prestige}`;
  if (!force && signature === lastScaleSignature) return;
  lastScaleSignature = signature;
  setHtml('scale-card', `
    <div class="scale-card-main">
      <span class="scale-chip">${layer.short}</span>
      <div><strong>${layer.name}</strong><p>${layer.desc}</p></div>
    </div>
    <div class="scale-card-sub">Multiplicateur d'échelle ×${layer.mult} · paliers de dézoom aux prestiges ${SCALING_LAYERS.map(l => l.prestige).filter(p => p > 0).join(' / ')}</div>
  `);
}

function renderMilestones(force = false) {
  const root = document.getElementById('milestone-list');
  if (!root) return;
  const items = getVisibleMilestones(state);
  const signature = items.map(m => `${m.id}:${state.milestones[m.id] ? 1 : 0}`).join('|');
  if (!force && signature === lastMilestoneSignature) return;
  lastMilestoneSignature = signature;
  setHtml(root, items.map(m => {
    const done = !!state.milestones[m.id];
    const reward = [];
    if (m.reward?.energy) reward.push(`+${fmt(m.reward.energy)} E`);
    if (m.reward?.fragments) reward.push(`+${fmt(m.reward.fragments)} F`);
    return `<div class="milestone ${done ? 'done' : ''}"><span>${done ? '✓' : '◇'}</span><div><strong>${m.label}</strong><small>${m.desc}</small></div><em>${reward.join(' · ')}</em></div>`;
  }).join('') || '<div class="milestone"><span>◇</span><div><strong>Aucun signal</strong><small>Continue à charger le noyau.</small></div></div>');
}

function renderModules(force = false) {
  const orbit = document.getElementById('module-orbit');
  if (!orbit) return;
  const signature = [
    `prestige:${state.prestige ?? 0}`,
    ...UPGRADES.map(upgrade => `${upgrade.id}:${state.upgrades[upgrade.id] ?? 0}`),
  ].join('|');
  if (!force && signature === lastModuleSignature) return;
  lastModuleSignature = signature;
  const coreCount = Math.floor((state.upgrades?.nitroFactory ?? 0) / 10);
  const activeGroups = CORE_MODULE_GROUPS
    .map((group, index) => {
      const entries = group.ids
        .map(id => {
          const upgrade = UPGRADES.find(item => item.id === id);
          const level = state.upgrades[id] ?? 0;
          return upgrade && level > 0 ? { upgrade, level } : null;
        })
        .filter(Boolean);
      const totalLevel = entries.reduce((sum, entry) => sum + entry.level, 0);
      if (totalLevel <= 0) return null;
      const charge = Math.min(1, totalLevel / 40);
      const width = Math.min(76, 46 + Math.min(totalLevel, 40) * 0.72);
      const lift = index % 2 ? -4 : 0;
      const title = entries.map(entry => `${entry.upgrade.name} Lv.${entry.level}`).join(' · ');
      return { ...group, entries, totalLevel, index, coreCount, charge, title, width, lift };
    })
    .filter(Boolean);

  setHtml(orbit, activeGroups.map(group => `
    <div class="spawned-module persistent module-${group.id}" data-module-group="${group.id}" style="--charge:${group.charge};--module-color:${group.color};--module-width:${group.width}px;--dock-lift:${group.lift}px;--factory-count:${group.coreCount}" title="${group.title}">
      <span class="module-code">${group.label}</span>
      <small>Lv.${group.totalLevel}</small>
      <i></i>
    </div>
  `).join(''));
}

function getCoreModuleGroup(upgradeId) {
  return CORE_MODULE_GROUPS.find(group => group.ids.includes(upgradeId));
}

function playCoreModuleSound(upgradeId, level = 1, amount = 1, volumeScale = 1) {
  const group = getCoreModuleGroup(upgradeId);
  if (!group?.sound) return;
  const levelLift = Math.min(0.18, Math.log1p(Math.max(0, Number(level) || 0)) * 0.025);
  const amountLift = Math.min(0.12, Math.max(0, Number(amount) || 0) * 0.014);
  playGameSound(group.sound, { volume: Math.min(0.86, (0.56 + levelLift + amountLift) * volumeScale) });
}

function renderFactories(force = false) {
  const field = document.getElementById('factory-field');
  if (!field) return;
  const layer = getScalingLayer(state);
  const count = Math.min(28, Math.floor((state.factoryRate ?? 0) + (layer.prestige >= 10 ? 8 : 0)));
  const signature = `${layer.id}:${count}`;
  if (!force && signature === lastFactorySignature) return;
  lastFactorySignature = signature;
  setHtml(field, Array.from({ length: count }, (_, i) => `<span class="factory-node" style="--x:${6 + (i * 17) % 88}%;--y:${12 + (i * 29) % 74}%;--d:${(i * -0.17).toFixed(2)}s">${i % 3 === 0 ? '🏡' : i % 3 === 1 ? '⚙' : '⬡'}</span>`).join(''));
}

function renderTendrils(force = false) {
  const layer = document.getElementById('tendril-layer');
  if (!layer) return;
  const totalLevels = UPGRADES.reduce((sum, upgrade) => sum + (state.upgrades[upgrade.id] ?? 0), 0);
  const count = Math.min(26, 8 + totalLevels + Math.floor(state.prestige / 2));
  const signature = `${totalLevels}:${state.prestige}:${count}`;
  if (!force && signature === lastTendrilSignature) return;
  lastTendrilSignature = signature;
  setHtml(layer, Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (i % 2 ? 8 : -8);
    const length = 112 + (i % 5) * 20 + Math.min(100, totalLevels * 3 + state.prestige * 2);
    const width = 8 + (i % 3) * 2;
    const delay = -(i * 0.23).toFixed(2);
    return `<span class="bio-tendril" style="--angle:${angle}deg;--len:${length}px;--w:${width}px;--delay:${delay}s"><i></i></span>`;
  }).join(''));
}

function setMeterNode(node, ratio) {
  if (node) setTransformScaleX(node, ratio);
}

function persist() {
  return saveAll(userId, state, currentSlot);
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const ok = persist();
    if (!ok) flushSaveErrorToast();
  }, 900);
}

function startLoop() {
  lastTick = performance.now();
  setInterval(() => {
    const now = performance.now();
    const delta = Math.min(2, (now - lastTick) / 1000);
    lastTick = now;
    if (state.passiveRate > 0) {
      const passiveResult = tickPassive(state, delta);
      if (passiveResult.shellAutoBreaks > 0) {
        playGameSound('shell.shatter', { volume: 0.9 }, 'shatter');
        pulseShell('break');
        toast(`LA SPHÈRE CÈDE SOUS LA PRESSION · +${passiveResult.shellReleased} fragments`);
        if (passiveResult.shellReleased > 0) spawnFragmentOrbs(passiveResult.shellReleased);
      }
    }
    tickBoosts(state);
    renderLive();
    refreshUpgradesIfNeeded();
    if (fxEnabled && now - lastEnergyPulse > 1800) {
      lastEnergyPulse = now;
      const panel = document.getElementById('core-panel')?.getBoundingClientRect();
      if (panel && state.passiveRate > 0) spawnBouncingBurst(panel.left + panel.width * 0.5, panel.top + panel.height * 0.5, Math.min(8, Math.ceil(state.passiveRate / 4)));
      if (state.passiveRate > 0) {
        const subCoreCount = Math.floor((state.upgrades?.nitroFactory ?? 0) / 10);
        playGameSound('core.passivePulse', { volume: Math.min(0.72, 0.26 + state.passiveRate / 140) });
        if (subCoreCount > 0) {
          setTimeout(() => playGameSound('core.subCorePulse', { volume: Math.min(0.58, 0.18 + subCoreCount * 0.026) }), 90);
        }
      }
      if (Math.random() > 0.35) zapToRandomModule();
    }
  }, 250);

  setInterval(() => {
    const claimed = checkAndClaimMilestones(state);
    if (claimed.length) claimMilestonesAndRender();
  }, 1000);

  setInterval(runAutoPurchase, 700);

  setInterval(() => {
    const ok = persist();
    if (!ok) flushSaveErrorToast();
  }, 15000);
}

async function fetchDeployBadge() {
  try {
    const r = await fetch('deploy-info.json?t=' + Date.now());
    if (!r.ok) return;
    const d = await r.json();
    const badge = document.getElementById('deploy-badge');
    if (badge) badge.textContent = `#${d.commit}`;
  } catch {}
}

// ── Séquence de démarrage vérifiée ──────────────────────────────────────────
// Remplace l'ancien texte statique "// INITIALISATION" par une liste d'étapes
// qui s'enchaînent visiblement (auth → profil → slot → save → moteur), avec
// un rendu d'échec clair ancré sur l'étape qui a bloqué au lieu de laisser le
// joueur face à un écran figé.
const BOOT_STEPS = [
  { id: 'auth', label: 'Authentification Nitro' },
  { id: 'profile', label: 'Profil chargé' },
  { id: 'slot', label: 'Sélection du slot' },
  { id: 'save', label: 'Sauvegarde validée' },
  { id: 'engine', label: 'Moteur initialisé' },
];
let bootStatuses = BOOT_STEPS.map(() => 'pending');

function renderBootScreen(extraHtml = '') {
  app.innerHTML = `
    <section class="boot-sequence">
      <div class="boot-orb">⬡</div>
      <h1 class="boot-title">NITRO <span>CLICKER</span></h1>
      <ul class="boot-steps">
        ${BOOT_STEPS.map((step, i) => {
          const status = bootStatuses[i];
          const icon = status === 'ok' ? '✓' : status === 'fail' ? '✕' : status === 'active' ? '◌' : '○';
          return `<li class="boot-step boot-step-${status}"><span class="boot-step-icon">${icon}</span><span>${step.label}</span></li>`;
        }).join('')}
      </ul>
      ${extraHtml}
    </section>
  `;
}

function bootStep(index, status) {
  bootStatuses[index] = status;
  renderBootScreen();
}

function bootFail(index, message) {
  bootStatuses[index] = 'fail';
  renderBootScreen(`
    <div class="boot-error">
      <strong>Échec : ${BOOT_STEPS[index].label}</strong>
      <p>${message}</p>
      <a class="nav-btn" href="/star/">Retour Star</a>
    </div>
  `);
}

function bootDelay(ms = 150) {
  return new Promise(r => setTimeout(r, ms));
}

// Attend le clic du joueur sur une carte de slot ; résout avec le slot choisi.
function pickSaveSlot(summaries, activeSlot) {
  return new Promise(resolve => {
    const cardsHtml = summaries.map(s => `
      <button class="nc-save-card boot-slot-card" type="button" data-slot="${s.slot}">
        <h3>Slot ${s.slot}${s.slot === activeSlot ? ' · actif' : ''}</h3>
        ${s.exists
          ? `<p>Prestige ${s.prestige} · ${fmt(s.totalEnergy)} énergie totale</p>`
          : '<p>Vide — nouvelle partie</p>'}
      </button>
    `).join('');
    renderBootScreen(`<div class="nc-save-grid boot-slot-grid">${cardsHtml}</div>`);
    document.querySelectorAll('.boot-slot-card').forEach(btn => {
      btn.addEventListener('click', () => resolve(Number(btn.dataset.slot)));
    });
  });
}

async function init() {
  renderBootScreen();
  try {
    bootStep(0, 'active');
    await bootDelay();
    auth = await requireAuth({ redirectTo: '/login.html' });
    if (!auth) return;
    bootStep(0, 'ok');

    bootStep(1, 'active');
    await bootDelay();
    userId = auth.user.id;
    profile = await getProfile(userId);
    bootStep(1, 'ok');

    bootStep(2, 'active');
    const summaries = getSlotSummaries(userId);
    const activeSlot = getActiveSlot(userId);
    const nonEmptyCount = summaries.filter(s => s.exists).length;
    if (nonEmptyCount <= 1) {
      // 0 ou 1 slot utilisé : rien à choisir, on continue directement dessus
      // (nouvelle partie sur le slot actif, ou reprise de l'unique save).
      currentSlot = summaries.find(s => s.exists)?.slot ?? activeSlot;
      await bootDelay();
    } else {
      currentSlot = await pickSaveSlot(summaries, activeSlot);
    }
    setActiveSlot(userId, currentSlot);
    bootStep(2, 'ok');

    bootStep(3, 'active');
    await bootDelay();
    const loaded = loadSave(userId, currentSlot);
    state = loaded.state;
    setLiveState(state);
    bootStep(3, 'ok');
    if (loaded.corrupted) {
      toast('⚠ Sauvegarde illisible détectée sur ce slot — une nouvelle partie a été démarrée.');
    }

    // MODE SAFE : on s'arrête AVANT tout rendu du jeu et tout démarrage de
    // boucle. Les modules périphériques (beacon, œil, objectif…) ne trouvent
    // alors aucune cible DOM à monter → ils ne tournent pas non plus. Si le
    // crash persiste dans cet état quasi-inerte, il ne peut venir que du boot
    // lui-même, du chargement des modules, ou du CSS/auth — plus du jeu.
    if (SAFE_MODE) {
      app.innerHTML = `
        <section class="boot-sequence">
          <div class="boot-orb">⬡</div>
          <h1 class="boot-title">NITRO <span>CLICKER</span></h1>
          <div class="boot-error">
            <strong>MODE SAFE — moteur arrêté</strong>
            <p>Aucun rendu de jeu, aucune boucle, aucun module. Si cette page
            fait quand même grimper le CPU / crashe, le problème n'est pas dans
            le jeu mais dans le chargement ou le CSS de base.</p>
            <a class="nav-btn" href="/clicker/">Quitter le mode safe</a>
          </div>
        </section>`;
      return;
    }

    await bootDelay();
    const offlineResult = applyOfflineProgress(state);
    const offlineGain = offlineResult?.gained ?? 0;
    const cappedAt = offlineResult?.cappedAt;

    renderShell();
    fetchDeployBadge();
    if (NOLOOP_MODE) {
      renderAll(true);
      toast('⚠ NOLOOP : jeu rendu une fois, boucle 250ms désactivée (diagnostic).');
    } else {
      startLoop();
    }

    window.NitroPrestige = {
      canDo: () => canPrestige(state),
      info: () => ({ energy: state.energy, totalEnergy: state.totalEnergy, req: prestigeRequirement(state) }),
      exec() {
        const btn = document.getElementById('prestige-btn');
        if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      },
    };

    claimMilestonesAndRender();

    if (offlineGain > 0) {
      if (cappedAt != null) {
        toast(`Hors-ligne · +${fmt(offlineGain)} E (plafonné à ${cappedAt.toFixed(1)}h).`);
      } else {
        toast(`Progression hors-ligne : +${fmt(offlineGain)} énergie.`);
      }
    }

    flushSaveErrorToast();
  } catch (error) {
    console.error('[Nitro Clicker] init failed:', error);
    const failedIndex = bootStatuses.findIndex(s => s === 'active');
    bootFail(failedIndex >= 0 ? failedIndex : bootStatuses.length - 1, error?.message ?? String(error));
  }
}

// Filet de sécurité redondant : init() capture déjà ses propres erreurs pour
// afficher l'étape en échec, mais si quelque chose s'échappe malgré tout
// (erreur dans bootFail lui-même, etc.), ne jamais laisser un écran vide.
init().catch(error => {
  console.error('[Nitro Clicker] init failed (fallback):', error);
  app.innerHTML = `<section class="auth-error-panel"><div><h1>Erreur Nitro Clicker</h1><p>${error?.message ?? error}</p><a class="nav-btn" href="/star/">Retour Star</a></div></section>`;
});
