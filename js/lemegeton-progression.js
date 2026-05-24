const SAVE_PREFIX = 'nitro-clicker.save.';
const TANK_STEP = 100_000_000;
const TANK_COUNT = 10;

let mounted = false;
let lastFilled = -1;
let lastStage = '';

const STAGES = [
  {
    min: 0,
    id: 'dormant',
    label: 'SYSTÈME DORMANT',
    text: 'Le Gwen Ha Star attend une source Nitro stable.',
  },
  {
    min: 1,
    id: 'charging',
    label: 'BPRD · ACCUMULATION',
    text: 'Les bonbonnes arrière-plan stockent l’énergie du noyau.',
  },
  {
    min: 10,
    id: 'lemegeton_boot',
    label: 'LEMEGETON · BOOT',
    text: 'Ordinateur de bord chargé. Lancement du programme LEMEGETON.',
  },
  {
    min: 12,
    id: 'auto_detected',
    label: 'LEMEGETON · ANOMALIE',
    text: 'Activité automatisée détectée dans les circuits. Référence auto-clicker confirmée.',
  },
  {
    min: 16,
    id: 'auto_control',
    label: 'LEMEGETON · CONTRÔLE',
    text: 'LEMEGETON prend le contrôle du maintien automatique.',
  },
  {
    min: 22,
    id: 'fusion',
    label: 'FUSION NOYAU/LEMEGETON',
    text: 'Préparation de la fusion cognitive avec le noyau Nitro.',
  },
  {
    min: 30,
    id: 'cells',
    label: 'DÉMULTIPLICATION CELLULAIRE',
    text: 'Le noyau se duplique en cellules énergétiques synchronisées.',
  },
  {
    min: 45,
    id: 'ship_power',
    label: 'GWEN HA STAR · RÉSEAU COMPLET',
    text: 'Alimentation progressive du système électrique BPRD, puis du vaisseau complet.',
  },
];

function mount() {
  if (mounted) return;
  const panel = document.getElementById('core-panel');
  if (!panel) return;
  mounted = true;

  panel.insertAdjacentHTML('afterbegin', `
    <div class="lemegeton-bg" id="lemegeton-bg" aria-hidden="true">
      ${Array.from({ length: TANK_COUNT }, (_, i) => `
        <div class="energy-tank" data-tank="${i}">
          <span class="energy-tank-fill"></span>
          <i></i>
        </div>
      `).join('')}
    </div>
    <div class="lemegeton-status" id="lemegeton-status">
      <span id="lemegeton-kicker">BPRD POWER GRID</span>
      <strong id="lemegeton-label">SYSTÈME DORMANT</strong>
      <p id="lemegeton-text">Le Gwen Ha Star attend une source Nitro stable.</p>
    </div>
    <div class="core-cell-field" id="core-cell-field" aria-hidden="true"></div>
  `);

  update();
  setInterval(update, 700);
}

function readState() {
  const keys = Object.keys(localStorage).filter(key => key.startsWith(SAVE_PREFIX));
  let best = null;
  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      if (!best || Number(parsed?.updatedAt ?? 0) > Number(best?.updatedAt ?? 0)) best = parsed;
    } catch {}
  }
  return best ?? {};
}

function update() {
  const state = readState();
  const totalEnergy = Number(state.totalEnergy ?? 0);
  const prestige = Number(state.prestige ?? 0);
  const autoLevel = Number(state.upgrades?.autoClicker ?? 0);
  const filled = Math.min(TANK_COUNT, Math.floor(totalEnergy / TANK_STEP));
  const nextProgress = Math.min(1, (totalEnergy % TANK_STEP) / TANK_STEP);

  document.querySelectorAll('.energy-tank').forEach((tank, i) => {
    const fill = tank.querySelector('.energy-tank-fill');
    const ratio = i < filled ? 1 : i === filled ? nextProgress : 0;
    tank.classList.toggle('filled', ratio >= 1);
    tank.classList.toggle('revealed', i <= filled || totalEnergy >= i * TANK_STEP * 0.7);
    if (fill) fill.style.transform = `scaleY(${ratio})`;
  });

  if (filled > lastFilled) {
    lastFilled = filled;
    pulseTank(filled - 1);
    if (filled === TANK_COUNT) dispatchLoreWave('LEMEGETON ONLINE');
  }

  const stage = getStage(filled, prestige, autoLevel);
  const panel = document.getElementById('core-panel');
  if (panel) {
    panel.dataset.lemegetonStage = stage.id;
    panel.style.setProperty('--cell-count', String(getCellCount(filled, prestige)));
  }

  document.getElementById('lemegeton-label').textContent = stage.label;
  document.getElementById('lemegeton-text').textContent = stage.text;

  if (stage.id !== lastStage) {
    lastStage = stage.id;
    dispatchLoreWave(stage.label);
  }

  renderCoreCells(filled, prestige);
}

function getStage(filled, prestige, autoLevel) {
  let powerIndex = filled;
  if (filled >= 10) powerIndex += Math.floor(prestige / 3);
  if (autoLevel > 0 && filled >= 10) powerIndex = Math.max(powerIndex, 12);
  return [...STAGES].reverse().find(stage => powerIndex >= stage.min) ?? STAGES[0];
}

function getCellCount(filled, prestige) {
  if (filled < 10) return 0;
  return Math.min(18, 2 + Math.floor(prestige / 2) + Math.floor((filled - 10) / 2));
}

function renderCoreCells(filled, prestige) {
  const field = document.getElementById('core-cell-field');
  if (!field) return;
  const target = getCellCount(filled, prestige);
  if (field.children.length === target) return;
  field.innerHTML = Array.from({ length: target }, (_, i) => `
    <span class="core-cell" style="--i:${i};--a:${(360 / Math.max(1, target)) * i}deg;--r:${112 + (i % 4) * 24}px"></span>
  `).join('');
}

function pulseTank(index) {
  const tank = document.querySelector(`[data-tank="${index}"]`);
  if (!tank) return;
  tank.classList.remove('tank-just-filled');
  void tank.offsetWidth;
  tank.classList.add('tank-just-filled');
}

function dispatchLoreWave(text) {
  const panel = document.getElementById('core-panel');
  if (!panel) return;
  const node = document.createElement('div');
  node.className = 'lemegeton-wave';
  node.textContent = text;
  panel.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

const boot = setInterval(() => {
  mount();
  if (mounted) clearInterval(boot);
}, 250);

window.NitroLemegeton = { update };
