export const VERSION = 2;

export const SCALING_LAYERS = [
  { id: 'core', prestige: 0, name: 'Noyau unique', short: 'CORE', desc: 'Tu stabilises un seul réacteur Nitro vivant.', mult: 1 },
  { id: 'engine_bay', prestige: 3, name: 'Baie moteur', short: 'BAY', desc: 'Plusieurs modules commencent à tourner autour du noyau.', mult: 1.35 },
  { id: 'factory', prestige: 10, name: 'Usine de moteurs Nitro', short: 'FACTORY', desc: 'Dézoom : tu ne gères plus un noyau, mais une ligne de moteurs.', mult: 2.4 },
  { id: 'district', prestige: 25, name: 'District énergétique', short: 'DISTRICT', desc: 'Le réseau alimente un quartier entier du hub Star.', mult: 5 },
  { id: 'orbital', prestige: 50, name: 'Anneau orbital', short: 'ORBITAL', desc: 'Production à échelle orbitale : les usines deviennent un essaim.', mult: 11 },
];

export function createDefaultState(userId = null) {
  return {
    version: VERSION,
    userId,
    energy: 0,
    totalEnergy: 0,
    fragments: 0,
    totalFragments: 0,
    clickPower: 1,
    passiveRate: 0,
    prestige: 0,
    totalClicks: 0,
    surcharge: 0,
    maxSurcharge: 100,
    surchargeGain: 5,
    overdriveLevel: 0,
    factoryRate: 0,
    permanentMultiplier: 1,
    upgrades: {
      clickAmplifier: 0,
      autoCore: 0,
      resonance: 0,
      surchargeCoil: 0,
      prism: 0,
      bioConduit: 0,
      fragmentCatalyst: 0,
      nitroFactory: 0,
      enginePlant: 0,
      orbitalHive: 0,
    },
    milestones: {},
    lastTickAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const UPGRADES = [
  {
    id: 'clickAmplifier', name: 'Amplificateur de clic', icon: '⚡', baseCost: 25, scale: 1.42, currency: 'energy', tier: 0,
    desc: '+1 puissance de clic par niveau.',
    unlock: () => true,
    apply(state) { state.clickPower += 1; },
  },
  {
    id: 'autoCore', name: 'Noyau automatique', icon: '⬡', baseCost: 120, scale: 1.55, currency: 'energy', tier: 0,
    desc: '+0.35 énergie / seconde par niveau.',
    unlock: () => true,
    apply(state) { state.passiveRate += 0.35; },
  },
  {
    id: 'resonance', name: 'Résonance Star', icon: '✦', baseCost: 500, scale: 1.7, currency: 'energy', tier: 1,
    desc: '+3 clic et +0.5/s. Débloque le réacteur vivant.',
    unlock: state => state.totalEnergy >= 500 || state.prestige >= 1,
    lockedText: 'Débloqué à 500 énergie totale.',
    apply(state) { state.clickPower += 3; state.passiveRate += 0.5; },
  },
  {
    id: 'surchargeCoil', name: 'Bobine de surcharge', icon: '🧬', baseCost: 950, scale: 1.62, currency: 'energy', tier: 1,
    desc: '+15 capacité de surcharge, +1 charge par clic.',
    unlock: state => state.totalEnergy >= 1000 || state.prestige >= 1,
    lockedText: 'Débloqué à 1 000 énergie totale.',
    apply(state) { state.maxSurcharge += 15; state.surchargeGain += 1; state.overdriveLevel += 1; },
  },
  {
    id: 'prism', name: 'Prisme Nitro', icon: '◆', baseCost: 2200, scale: 1.82, currency: 'energy', tier: 2,
    desc: '+10 clic et +2/s. Stabilise les flux biopunk.',
    unlock: state => state.totalEnergy >= 2500 || state.prestige >= 1,
    lockedText: 'Débloqué à 2 500 énergie totale.',
    apply(state) { state.clickPower += 10; state.passiveRate += 2; },
  },
  {
    id: 'bioConduit', name: 'Conduit organique', icon: '🫀', baseCost: 6200, scale: 1.7, currency: 'energy', tier: 2,
    desc: '+4 clic, +6/s, tentacules plus denses.',
    unlock: state => (state.upgrades?.prism ?? 0) >= 2 || state.totalEnergy >= 8000 || state.prestige >= 2,
    lockedText: 'Débloqué avec Prisme Nitro Lv.2 ou 8 000 énergie totale.',
    apply(state) { state.clickPower += 4; state.passiveRate += 6; state.maxSurcharge += 5; },
  },
  {
    id: 'fragmentCatalyst', name: 'Catalyseur de fragments', icon: '💠', baseCost: 3, scale: 1.55, currency: 'fragments', tier: 3,
    desc: 'Upgrade permanent : +8% multiplicateur global par niveau.',
    unlock: state => state.fragments >= 1 || state.totalFragments >= 1 || state.prestige >= 1,
    lockedText: 'Débloqué après ton premier Fragment Nitro.',
    apply(state) { state.permanentMultiplier += 0.08; },
  },
  {
    id: 'nitroFactory', name: 'Usine de moteurs Nitro', icon: '🏭', baseCost: 100000, scale: 1.55, currency: 'energy', tier: 4,
    desc: 'Dézoom Prestige 10 : +20 clic, +25/s, +1 usine.',
    unlock: state => state.prestige >= 10,
    lockedText: 'Débloqué au Prestige 10 : changement d’échelle.',
    apply(state) { state.clickPower += 20; state.passiveRate += 25; state.factoryRate += 1; },
  },
  {
    id: 'enginePlant', name: 'Chaîne de production moteur', icon: '⚙️', baseCost: 1800000, scale: 1.5, currency: 'energy', tier: 5,
    desc: 'Prestige 20 : production industrielle massive.',
    unlock: state => state.prestige >= 20,
    lockedText: 'Débloqué au Prestige 20.',
    apply(state) { state.clickPower += 100; state.passiveRate += 250; state.factoryRate += 8; },
  },
  {
    id: 'orbitalHive', name: 'Ruche orbitale Nitro', icon: '🛰️', baseCost: 9000000, scale: 1.62, currency: 'energy', tier: 6,
    desc: 'Prestige 50 : essaim orbital, scaling très haut.',
    unlock: state => state.prestige >= 50,
    lockedText: 'Débloqué au Prestige 50.',
    apply(state) { state.clickPower += 420; state.passiveRate += 1200; state.factoryRate += 30; state.maxSurcharge += 50; },
  },
];

export const MILESTONES = [
  { id: 'energy_100', label: 'Premier allumage', desc: 'Atteindre 100 énergie totale.', test: s => s.totalEnergy >= 100, reward: { energy: 50 } },
  { id: 'energy_1000', label: 'Réacteur vivant', desc: 'Atteindre 1 000 énergie totale.', test: s => s.totalEnergy >= 1000, reward: { fragments: 1 } },
  { id: 'clicks_250', label: 'Main nerveuse', desc: 'Faire 250 clics.', test: s => s.totalClicks >= 250, reward: { energy: 750 } },
  { id: 'passive_10', label: 'Flux stable', desc: 'Atteindre 10 énergie/seconde.', test: s => s.passiveRate >= 10, reward: { fragments: 2 } },
  { id: 'first_prestige', label: 'Surcharge contrôlée', desc: 'Atteindre le Prestige 1.', test: s => s.prestige >= 1, reward: { fragments: 5 } },
  { id: 'prestige_3', label: 'Baie moteur', desc: 'Atteindre le Prestige 3.', test: s => s.prestige >= 3, reward: { fragments: 8 } },
  { id: 'prestige_10', label: 'Dézoom industriel', desc: 'Atteindre le Prestige 10.', test: s => s.prestige >= 10, reward: { fragments: 25, energy: 50000 } },
  { id: 'prestige_25', label: 'District énergétique', desc: 'Atteindre le Prestige 25.', test: s => s.prestige >= 25, reward: { fragments: 60 } },
];

export function getScalingLayer(state) {
  const prestige = state?.prestige ?? 0;
  return [...SCALING_LAYERS].reverse().find(layer => prestige >= layer.prestige) ?? SCALING_LAYERS[0];
}

export function isUpgradeUnlocked(state, upgrade) {
  return upgrade.unlock ? !!upgrade.unlock(state) : true;
}

export function upgradeCost(upgrade, level) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.scale, level));
}

export function upgradeBulkCost(upgrade, level, amount = 1) {
  const qty = Math.max(1, Math.floor(Number(amount) || 1));
  let total = 0;
  for (let i = 0; i < qty; i++) total += upgradeCost(upgrade, level + i);
  return total;
}

export function getCurrency(state, currency = 'energy') {
  return currency === 'fragments' ? state.fragments : state.energy;
}

export function spendCurrency(state, currency, amount) {
  if (currency === 'fragments') state.fragments -= amount;
  else state.energy -= amount;
}

export function addFragments(state, amount) {
  const gain = Math.max(0, Math.floor(amount));
  state.fragments += gain;
  state.totalFragments += gain;
  return gain;
}

export function hydrateState(raw, userId = null) {
  const base = createDefaultState(userId);
  const merged = { ...base, ...(raw ?? {}) };
  merged.upgrades = { ...base.upgrades, ...(raw?.upgrades ?? {}) };
  merged.milestones = { ...base.milestones, ...(raw?.milestones ?? {}) };
  merged.fragments = Number(merged.fragments ?? 0);
  merged.totalFragments = Number(merged.totalFragments ?? merged.fragments ?? 0);
  merged.totalClicks = Number(merged.totalClicks ?? 0);
  merged.surcharge = Number(merged.surcharge ?? 0);
  merged.userId = userId ?? merged.userId;
  recalcDerivedStats(merged);
  return merged;
}

export function recalcDerivedStats(state) {
  const layer = getScalingLayer(state);
  state.clickPower = (1 + state.prestige) * layer.mult;
  state.passiveRate = state.prestige * 0.1 * layer.mult;
  state.maxSurcharge = 100;
  state.surchargeGain = 5;
  state.overdriveLevel = 0;
  state.factoryRate = 0;
  state.permanentMultiplier = 1;

  for (const upgrade of UPGRADES) {
    const level = state.upgrades[upgrade.id] ?? 0;
    for (let i = 0; i < level; i++) upgrade.apply(state);
  }

  state.clickPower *= state.permanentMultiplier;
  state.passiveRate *= state.permanentMultiplier;
  state.surcharge = Math.min(state.surcharge ?? 0, state.maxSurcharge);
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
  state.totalClicks += 1;
  let gain = Math.max(1, Math.floor(state.clickPower));
  let overdrive = false;
  let overdriveGain = 0;
  let fragments = 0;

  state.surcharge = Math.min(state.maxSurcharge, (state.surcharge ?? 0) + state.surchargeGain);
  if (state.surcharge >= state.maxSurcharge) {
    overdrive = true;
    state.surcharge = 0;
    overdriveGain = Math.floor(state.clickPower * (18 + state.overdriveLevel * 3) + state.passiveRate * 10);
    gain += overdriveGain;
    const fragmentChance = Math.min(0.08 + state.prestige * 0.006 + state.overdriveLevel * 0.01, 0.45);
    if (Math.random() < fragmentChance) fragments = addFragments(state, 1);
  }

  state.energy += gain;
  state.totalEnergy += gain;
  state.updatedAt = Date.now();
  return { gain, overdrive, overdriveGain, fragments };
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
  return buyUpgradeAmount(state, upgradeId, 1);
}

export function buyUpgradeAmount(state, upgradeId, amount = 1) {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return { ok: false, reason: 'unknown_upgrade' };
  if (!isUpgradeUnlocked(state, upgrade)) return { ok: false, reason: 'locked' };

  const qty = Math.max(1, Math.floor(Number(amount) || 1));
  const level = state.upgrades[upgrade.id] ?? 0;
  const cost = upgradeBulkCost(upgrade, level, qty);
  const currency = upgrade.currency ?? 'energy';

  if (getCurrency(state, currency) < cost) return { ok: false, reason: 'not_enough_energy', cost, amount: qty, currency };

  spendCurrency(state, currency, cost);
  state.upgrades[upgrade.id] = level + qty;
  recalcDerivedStats(state);
  state.updatedAt = Date.now();
  return { ok: true, cost, amount: qty, level: level + qty, currency };
}

export function checkAndClaimMilestones(state) {
  const claimed = [];
  for (const milestone of MILESTONES) {
    if (state.milestones[milestone.id]) continue;
    if (!milestone.test(state)) continue;
    state.milestones[milestone.id] = Date.now();
    if (milestone.reward?.energy) {
      state.energy += milestone.reward.energy;
      state.totalEnergy += milestone.reward.energy;
    }
    if (milestone.reward?.fragments) addFragments(state, milestone.reward.fragments);
    claimed.push(milestone);
  }
  if (claimed.length) state.updatedAt = Date.now();
  return claimed;
}

export function getVisibleMilestones(state) {
  return MILESTONES.filter(m => state.milestones[m.id] || m.test(state) || visibleSoon(state, m));
}

function visibleSoon(state, milestone) {
  if (milestone.id === 'energy_100') return true;
  if (milestone.id === 'energy_1000') return state.totalEnergy >= 200;
  if (milestone.id === 'clicks_250') return state.totalClicks >= 20;
  if (milestone.id === 'passive_10') return state.passiveRate >= 2;
  if (milestone.id === 'first_prestige') return state.totalEnergy >= 5000 || state.prestige >= 1;
  if (milestone.id === 'prestige_3') return state.prestige >= 1;
  if (milestone.id === 'prestige_10') return state.prestige >= 6;
  if (milestone.id === 'prestige_25') return state.prestige >= 18;
  return false;
}

export function canPrestige(state) {
  return state.totalEnergy >= prestigeRequirement(state);
}

export function prestigeRequirement(state) {
  return Math.floor(10000 * Math.pow(2.55, state.prestige));
}

export function doPrestige(state) {
  if (!canPrestige(state)) return { ok: false, reason: 'not_ready' };
  const userId = state.userId;
  const keptFragments = state.fragments;
  const keptTotalFragments = state.totalFragments;
  const keptMilestones = state.milestones;
  const keptTotalClicks = state.totalClicks;
  const next = createDefaultState(userId);
  next.prestige = state.prestige + 1;
  next.fragments = keptFragments + Math.floor(4 + next.prestige * 1.5);
  next.totalFragments = keptTotalFragments + Math.floor(4 + next.prestige * 1.5);
  next.milestones = keptMilestones;
  next.totalClicks = keptTotalClicks;
  recalcDerivedStats(next);
  return { ok: true, state: next };
}
