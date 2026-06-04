/**
 * prestige-beacon.js
 * Bouton prestige flottant — indépendant du panel pause.
 * Visible uniquement quand le prestige est disponible.
 * L'overcharge (0→1) module la couleur/intensité rouge.
 */
import {
  createDefaultState,
  hydrateState,
  prestigeRequirement,
} from './clicker-state.js';

const SNAPSHOT_PREFIX = 'nitro-clicker.save.';

// ── Helpers ──────────────────────────────────────────────────
function readSnapshot() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(SNAPSHOT_PREFIX));
  let best = null;
  for (const key of keys) {
    try {
      const d = JSON.parse(localStorage.getItem(key));
      if (!best || (d?.updatedAt ?? 0) > (best?.updatedAt ?? 0)) best = d;
    } catch {}
  }
  return best ?? {};
}

function fmt(n) {
  const v = Math.floor(Number(n ?? 0));
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 100_000)       return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString('fr-FR');
}

function safeState(raw) {
  try {
    const s = hydrateState(
      raw && typeof raw === 'object' ? raw : createDefaultState('guest'),
      raw?.userId ?? 'guest'
    );
    return s;
  } catch { return createDefaultState('guest'); }
}

// ── DOM bootstrap ────────────────────────────────────────────
function injectBeacon() {
  if (document.getElementById('prestige-beacon')) return;

  // Vignette d'ambiance rouge (z-index bas)
  const vig = document.createElement('div');
  vig.id = 'prestige-vignette';
  document.body.appendChild(vig);

  // Beacon principal
  document.body.insertAdjacentHTML('beforeend', `
    <div id="prestige-beacon" role="complementary" aria-label="Prestige disponible" data-overloaded="false" data-critical="false">
      <div class="pb-meter-wrap">
        <div class="pb-meter">
          <div class="pb-meter-fill" id="pb-meter-fill"></div>
        </div>
        <span class="pb-meter-label" id="pb-meter-label">SEUIL 0%</span>
      </div>
      <button
        class="pb-btn"
        id="pb-btn"
        type="button"
        aria-label="Lancer le prestige"
      >
        <span class="pb-icon" id="pb-icon">✦</span>
        <span class="pb-text">
          <span class="pb-title" id="pb-title">LANCER LE PRESTIGE</span>
          <span class="pb-sub"  id="pb-sub">Reset run · fragments permanents</span>
        </span>
        <span class="pb-badge">SURCHARGE</span>
      </button>
    </div>
  `);

  document.getElementById('pb-btn').addEventListener('click', () => {
    if (confirm('Lancer le prestige ?\nTon énergie et tes upgrades seront réinitialisés.\nTu gagneras des fragments Nitro permanents.')) {
      document.getElementById('reset-btn')?.click();
    }
  });
}

// ── Update loop ──────────────────────────────────────────────
function updateBeacon() {
  const beacon = document.getElementById('prestige-beacon');
  if (!beacon) return;

  const raw   = readSnapshot();
  const state = safeState(raw);
  const req   = prestigeRequirement(state);
  const total = state.totalEnergy ?? 0;
  const rawP  = Math.min(total / Math.max(1, req), 2); // cap 200%
  const isReady     = rawP >= 1;
  const overcharge  = isReady ? Math.min(rawP - 1, 1) : 0;
  const isOverloaded = isReady && overcharge > 0.05;
  const isCritical   = isReady && overcharge > 0.70;
  const pct = Math.round(rawP * 100);
  const nextFrag = Math.max(1, Math.floor(Math.sqrt(total / 1000)));

  // Visibility
  beacon.classList.toggle('visible', isReady);
  beacon.dataset.overloaded = String(isOverloaded);
  beacon.dataset.critical   = String(isCritical);

  // CSS var --oc sur le beacon ET la vignette
  const ocStr = overcharge.toFixed(4);
  beacon.style.setProperty('--oc', ocStr);

  // Vignette rouge ambiante
  const vig = document.getElementById('prestige-vignette');
  if (vig) {
    const alpha = (overcharge * 0.18).toFixed(4);
    vig.style.background = `radial-gradient(
      ellipse at 50% 100%,
      oklch(0.40 0.22 25 / ${alpha}) 0%,
      oklch(0.30 0.22 25 / ${(overcharge * 0.08).toFixed(4)}) 100%
    )`;
  }

  // Jauge
  const fill = document.getElementById('pb-meter-fill');
  if (fill) {
    // On ne touche pas à transform inline ici — on passe par scaleX via CSS
    // mais on évite le style inline en boucle en gérant via custom prop
    fill.style.transform = `scaleX(${Math.min(rawP, 1).toFixed(4)})`;
  }

  const label = document.getElementById('pb-meter-label');
  if (label) label.textContent = `${fmt(total)} / ${fmt(req)} · ${pct}%`;

  // Icone + textes
  const icon  = document.getElementById('pb-icon');
  const title = document.getElementById('pb-title');
  const sub   = document.getElementById('pb-sub');

  if (icon)  icon.textContent  = isOverloaded ? '🔴' : '✦';
  if (title) title.textContent = 'LANCER LE PRESTIGE';
  if (sub)   sub.textContent   = isOverloaded
    ? `Surcharge ${Math.round(overcharge * 100)}% — noyau instable · +${nextFrag} frag${nextFrag > 1 ? 's' : ''}`
    : `Reset run · +${nextFrag} fragment${nextFrag > 1 ? 's' : ''} permanent${nextFrag > 1 ? 's' : ''}`;
}

// ── Boot ─────────────────────────────────────────────────────
const boot = setInterval(() => {
  if (!document.body) return;
  injectBeacon();
  clearInterval(boot);
}, 100);

// Mise à jour toutes les 800ms — assez fréquent sans spammer le DOM
setInterval(updateBeacon, 800);
// Premier tick rapide
setTimeout(updateBeacon, 400);
