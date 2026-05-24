const SAVE_PREFIX = 'nitro-clicker.save.';

let mounted = false;
let spinVelocity = 0;
let spinCharge = 0;
let rotX = -12;
let rotY = 18;
let autoAccumulator = 0;
let lastAutoTick = performance.now();
let lastSpinPulse = 0;

function mountCoreControls() {
  if (mounted) return;
  const core = document.getElementById('click-core');
  const panel = document.getElementById('core-panel');
  if (!core || !panel) return;
  mounted = true;

  core.classList.add('core-3d-ready');
  panel.classList.add('core-control-ready');
  panel.style.setProperty('--core-rot-x', `${rotX}deg`);
  panel.style.setProperty('--core-rot-y', `${rotY}deg`);

  injectSpinHud(panel);

  panel.addEventListener('wheel', event => {
    if (!event.target.closest?.('#core-panel')) return;
    event.preventDefault();
    const delta = -event.deltaY;
    rotateCore(delta * 0.28, event.deltaX * 0.08, Math.abs(delta) * 0.28);
  }, { passive: false });

  requestAnimationFrame(loop);
}

function rotateCore(dx, dy, force) {
  const panel = document.getElementById('core-panel');
  if (!panel) return;
  rotY += dx * 0.5;
  rotX = clamp(rotX - dy * 0.22, -34, 34);
  spinVelocity = Math.min(140, spinVelocity + force * 0.08);
  spinCharge = Math.min(100, spinCharge + force * 0.05);
  panel.style.setProperty('--core-rot-x', `${rotX.toFixed(2)}deg`);
  panel.style.setProperty('--core-rot-y', `${rotY.toFixed(2)}deg`);
  panel.style.setProperty('--spin-charge', `${spinCharge.toFixed(1)}%`);
  panel.classList.add('core-spinning');
  updateSpinHud();
}

function loop(now) {
  const delta = Math.min(1, (now - lastAutoTick) / 1000);
  lastAutoTick = now;

  rotY += spinVelocity * delta * 0.26;
  spinVelocity *= Math.pow(0.9, delta * 10);
  spinCharge *= Math.pow(0.968, delta * 10);
  const panel = document.getElementById('core-panel');
  if (panel) {
    panel.style.setProperty('--core-rot-x', `${rotX.toFixed(2)}deg`);
    panel.style.setProperty('--core-rot-y', `${rotY.toFixed(2)}deg`);
    panel.style.setProperty('--spin-charge', `${spinCharge.toFixed(1)}%`);
    panel.classList.toggle('core-spinning', spinCharge > 4);
  }

  runAutoClicker(delta);
  runSpinGenerator(now);
  updateSpinHud();
  requestAnimationFrame(loop);
}

function runAutoClicker(delta) {
  const level = getAutoClickerLevel();
  if (level <= 0) return;
  const rate = Math.min(12, level * 0.16);
  autoAccumulator += rate * delta;
  while (autoAccumulator >= 1) {
    autoAccumulator -= 1;
    syntheticCoreClick('auto');
  }
}

function runSpinGenerator(now) {
  const level = getAutoClickerLevel();
  const minDelay = Math.max(420, 1200 - level * 30);
  if (spinCharge < 20 || now - lastSpinPulse < minDelay) return;
  lastSpinPulse = now;
  syntheticCoreClick('spin');
  pulseSpinHud();
}

function syntheticCoreClick(mode = 'auto') {
  const core = document.getElementById('click-core');
  if (!core) return;
  const rect = core.getBoundingClientRect();
  const jitter = mode === 'spin' ? 22 : 8;
  const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * jitter;
  const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * jitter;
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  core.classList.toggle('auto-click-pulse', mode === 'auto');
  core.classList.toggle('spin-click-pulse', mode === 'spin');
  core.dispatchEvent(event);
  setTimeout(() => {
    core.classList.remove('auto-click-pulse');
    core.classList.remove('spin-click-pulse');
  }, 180);
}

function getAutoClickerLevel() {
  const live = document.querySelector('[data-upgrade="autoClicker"] [data-upgrade-level="autoClicker"]');
  const match = live?.textContent?.match(/Lv\.([0-9]+)/i);
  if (match) return Number(match[1]) || 0;

  const save = readLatestSave();
  return Number(save?.upgrades?.autoClicker ?? 0);
}

function readLatestSave() {
  const keys = Object.keys(localStorage).filter(key => key.startsWith(SAVE_PREFIX));
  let best = null;
  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      if (!best || Number(parsed?.updatedAt ?? 0) > Number(best?.updatedAt ?? 0)) best = parsed;
    } catch {}
  }
  return best;
}

function injectSpinHud(panel) {
  if (document.getElementById('spin-hud')) return;
  panel.insertAdjacentHTML('beforeend', `
    <div class="spin-hud" id="spin-hud" aria-hidden="true">
      <div class="spin-hud-top"><span>SPIN BOOST</span><strong id="spin-hud-value">0%</strong></div>
      <div class="spin-hud-meter"><i id="spin-hud-meter"></i></div>
      <small>Molette sur la fenêtre du noyau pour faire tourner la sphère et maintenir la génération.</small>
    </div>
  `);
}

function updateSpinHud() {
  const value = document.getElementById('spin-hud-value');
  const meter = document.getElementById('spin-hud-meter');
  if (!value || !meter) return;
  const pct = Math.floor(spinCharge);
  value.textContent = `${pct}%`;
  meter.style.transform = `scaleX(${clamp(spinCharge / 100, 0, 1)})`;
}

function pulseSpinHud() {
  const hud = document.getElementById('spin-hud');
  if (!hud) return;
  hud.classList.remove('pulse');
  void hud.offsetWidth;
  hud.classList.add('pulse');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const boot = setInterval(() => {
  mountCoreControls();
  if (mounted) clearInterval(boot);
}, 250);

window.NitroCoreControls = {
  spin(amount = 50) { rotateCore(amount, 0, Math.abs(amount)); },
  autoClick() { syntheticCoreClick('auto'); },
};
