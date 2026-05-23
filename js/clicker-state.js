export const VERSION = 1;

export function createDefaultState(userId = null) {
  return {
    version: VERSION,
    userId,
    energy: 0,
    totalEnergy: 0,
    clickPower: 1,
    passiveRate: 0,
    prestige: 0,
    upgrades: {
      clickAmplifier: 0,
      autoCore: 0,
      resonance: 0,
      prism: 0,
    },
    lastTickAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const UPGRADES = [
  {
    id: 'clickAmplifier',
    name: 'Amplificateur de clic',
    icon: '⚡',
    baseCost: 25,
    scale: 1.42,
    desc: '+1 puissance de clic par niveau.',
    apply(state) {
      state.clickPower += 1;
    },
  },
  {
    id: 'autoCore',
    name: 'Noyau automatique',
    icon: '⬡',
    baseCost: 120,
    scale: 1.55,
    desc: '+0.35 énergie / seconde par niveau.',
    apply(state) {
      state.passiveRate += 0.35;
    },
  },
  {
    id: 'resonance',
    name: 'Résonance Star',
    icon: '✦',
    baseCost: 500,
    scale: 1.7,
    desc: '+3 puissance de clic et +0.5/s par niveau.',
    apply(state) {
      state.clickPower += 3;
      state.passiveRate += 0.5;
    },
  },
  {
    id: 'prism',
    name: 'Prisme Nitro',
    icon: '◆',
    baseCost: 2200,
    scale: 1.82,
    desc: 'Gros palier : +10 clic et +2/s.',
    apply(state) {
      state.clickPower += 10;
      state.passiveRate += 2;
    },
  },
];

export function upgradeCost(upgrade, level) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.scale, level));
}

export function hydrateState(raw, userId = null) {
  const base = createDefaultState(userId);
  const merged = { ...base, ...(raw ?? {}) };
  merged.upgrades = { ...base.upgrades, ...(raw?.upgrades ?? {}) };
  merged.userId = userId ?? merged.userId;
  recalcDerivedStats(merged);
  return merged;
}

export function recalcDerivedStats(state) {
  state.clickPower = 1 + state.prestige;
  state.passiveRate = state.prestige * 0.1;
  for (const upgrade of UPGRADES) {
    const level = state.upgrades[upgrade.id] ?? 0;
    for (let i = 0; i < level; i++) upgrade.apply(state);
  }
}

export function applyOfflineProgress(state) {
  const now = Date.now();
  const elapsed = Math.max(0, Math.min(8 * 60 * 60, (now - (state.lastTickAt ?? now)) / 1000));
  const gained = Math.floor(elapsed * (state.passiveRate ?? 0));
  if (gained > 0) {
    state.energy += gained;
    state.totalEnergy += gained;
  }
  state.lastTickAt = now;
  state.updatedAt = now;
  return gained;
}

export function clickCore(state) {
  const gain = Math.max(1, Math.floor(state.clickPower));
  state.energy += gain;
  state.totalEnergy += gain;
  state.updatedAt = Date.now();
  return gain;
}

export function tickPassive(state, deltaSeconds) {
  const gain = (state.passiveRate ?? 0) * deltaSeconds;
  state.energy += gain;
  state.totalEnergy += gain;
  state.lastTickAt = Date.now();
  state.updatedAt = Date.now();
  return gain;
}

export function buyUpgrade(state, upgradeId) {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return { ok: false, reason: 'unknown_upgrade' };
  const level = state.upgrades[upgrade.id] ?? 0;
  const cost = upgradeCost(upgrade, level);
  if (state.energy < cost) return { ok: false, reason: 'not_enough_energy', cost };
  state.energy -= cost;
  state.upgrades[upgrade.id] = level + 1;
  recalcDerivedStats(state);
  state.updatedAt = Date.now();
  return { ok: true, cost, level: level + 1 };
}

export function canPrestige(state) {
  return state.totalEnergy >= prestigeRequirement(state);
}

export function prestigeRequirement(state) {
  return 10000 * Math.pow(3, state.prestige);
}

export function doPrestige(state) {
  if (!canPrestige(state)) return { ok: false, reason: 'not_ready' };
  const userId = state.userId;
  const next = createDefaultState(userId);
  next.prestige = state.prestige + 1;
  recalcDerivedStats(next);
  return { ok: true, state: next };
}
