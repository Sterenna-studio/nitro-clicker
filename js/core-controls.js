const SAVE_PREFIX = 'nitro-clicker.save.';

let mounted = false;
let autoAccumulator = 0;
let lastAutoTick = performance.now();

function mountCoreControls() {
  if (mounted) return;
  const core = document.getElementById('click-core');
  const panel = document.getElementById('core-panel');
  if (!core || !panel) return;
  mounted = true;

  core.classList.add('core-3d-ready');
  panel.classList.add('core-control-ready');
  panel.classList.remove('core-spinning');
  panel.style.removeProperty('--core-rot-z');
  panel.style.removeProperty('--spin-charge');

  requestAnimationFrame(loop);
}

function loop(now) {
  const delta = Math.min(1, (now - lastAutoTick) / 1000);
  lastAutoTick = now;
  runAutoClicker(delta);
  requestAnimationFrame(loop);
}

function runAutoClicker(delta) {
  const level = getAutoClickerLevel();
  if (level <= 0) return;
  const rate = Math.min(12, level * 0.16);
  autoAccumulator += rate * delta;
  while (autoAccumulator >= 1) {
    autoAccumulator -= 1;
    pulseAutoClick();
  }
}

// Gameplay auto-clicks are applied in clicker-state; this module is visual only.
function pulseAutoClick() {
  const core = document.getElementById('click-core');
  if (!core) return;
  core.classList.add('auto-click-pulse');
  setTimeout(() => core.classList.remove('auto-click-pulse'), 180);
}

// FIX CRASH : cette fonction est appelée à chaque frame (60 fps) par la boucle
// rAF. Quand le sélecteur DOM ne matche pas (upgrade verrouillée sur une save
// neuve → texte "Tier N" au lieu de "Lv.N", ou mode stats), elle retombait sur
// readLatestSave() qui parse en JSON TOUTES les clés de save localStorage — à
// 60 fps. Avec l'arrivée des 3 slots (+ clé legacy conservée), jusqu'à 4 blobs
// JSON parsés par frame : saturation du thread principal → hang navigateur.
// Le niveau lu depuis la save est désormais mis en cache et rafraîchi au plus
// toutes les 3 s.
let cachedSaveLevel = 0;
let cachedSaveLevelAt = 0;

function getAutoClickerLevel() {
  const live = document.querySelector('[data-upgrade="autoClicker"] [data-upgrade-level="autoClicker"]');
  const match = live?.textContent?.match(/Lv\.([0-9]+)/i);
  if (match) return Number(match[1]) || 0;

  const now = performance.now();
  if (now - cachedSaveLevelAt > 3000) {
    cachedSaveLevelAt = now;
    const save = readLatestSave();
    cachedSaveLevel = Number(save?.upgrades?.autoClicker ?? 0);
  }
  return cachedSaveLevel;
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

const boot = window.NITRO_DISABLE_PERIPHERALS ? null : setInterval(() => {
  mountCoreControls();
  if (mounted) clearInterval(boot);
}, 250);

window.NitroCoreControls = {
  autoClick() { pulseAutoClick(); },
};
