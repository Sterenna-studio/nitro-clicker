export const VERSION = 6;

export const BALANCE = {
  prestigeBase: 8500,
  prestigeEarlyScale: 2.18,
  prestigeLateScale: 2.42,
  passiveOfflineCapHours: 8,
  overdriveBase: 14,
  overdrivePerLevel: 2.4,
  overdrivePassiveSeconds: 7,
  fragmentBaseChance: 0.045,
  fragmentPrestigeChance: 0.004,
  fragmentOverdriveChance: 0.008,
  fragmentChanceCap: 0.28,
  shellBaseBreakCost: 3600,
  shellBreakCostScale: 1.62,
};

export const SCALING_LAYERS = [
  { id: 'core', prestige: 0, name: 'Noyau unique', short: 'CORE', desc: 'Tu stabilises un seul réacteur Nitro vivant.', mult: 1 },
  { id: 'engine_bay', prestige: 3, name: 'Baie moteur', short: 'BAY', desc: 'Plusieurs modules commencent à tourner autour du noyau.', mult: 1.28 },
  { id: 'factory', prestige: 10, name: 'Usine de moteurs Nitro', short: 'FACTORY', desc: 'Dézoom : tu ne gères plus un noyau, mais une ligne de moteurs.', mult: 2.05 },
  { id: 'district', prestige: 25, name: 'District énergétique', short: 'DISTRICT', desc: 'Le réseau alimente un quartier entier du hub Star.', mult: 4.2 },
  { id: 'orbital', prestige: 50, name: 'Anneau orbital', short: 'ORBITAL', desc: 'Production à échelle orbitale : les usines deviennent un essaim.', mult: 9.5 },
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
    autoClickRate: 0,
    prestige: 0,
    totalClicks: 0,
    surcharge: 0,
    maxSurcharge: 100,
    surchargeGain: 5,
    overdriveLevel: 0,
    factoryRate: 0,
    permanentMultiplier: 1,
    coreShellCapacity: 0,
    coreShellHardness: 0,
    coreShellReflect: 0,
    coreShellBreakBonus: 0,
    coreShell: {
      storedFragments: 0,
      cracks: 0,
      lastBreakAt: 0,
      failedBreaks: 0,
    },
    upgrades: {
      clickAmplifier: 0,
      autoCore: 0,
      autoClicker: 0,
      resonance: 0,
      surchargeCoil: 0,
      prism: 0,
      bioConduit: 0,
      coreIsolation: 0,
      reflectiveAlloy: 0,
      mirrorGel: 0,
      prismGlass: 0,
      fractureTuning: 0,
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
    id: 'clickAmplifier', name: 'Amplificateur de clic', icon: '⚡', baseCost: 18, scale: 1.34, currency: 'energy', tier: 0,
    desc: '+1 puissance de clic par niveau. Très rentable en début de run.',
    unlock: () => true,
    apply(state) { state.clickPower += 1; },
  },
  {
    id: 'autoCore', name: 'Noyau automatique', icon: '⬡', baseCost: 85, scale: 1.47, currency: 'energy', tier: 0,
    desc: '+0.42 énergie / seconde par niveau. Base du jeu idle.',
    unlock: () => true,
    apply(state) { state.passiveRate += 0.42; },
  },
  {
    id: 'autoClicker', name: 'Auto-clicker de maintien', icon: '◌', baseCost: 240, scale: 1.52, currency: 'energy', tier: 1,
    desc: 'Maintient le noyau actif : +0.16 clic automatique/sec et +0.2/s par niveau.',
    unlock: state => state.totalEnergy >= 260 || state.prestige >= 1,
    lockedText: 'Débloqué à 260 énergie totale.',
    apply(state) { state.autoClickRate += 0.16; state.passiveRate += 0.2; },
  },
  {
    id: 'resonance', name: 'Résonance Star', icon: '✦', baseCost: 360, scale: 1.58, currency: 'energy', tier: 1,
    desc: '+3 clic et +0.75/s. Débloque le réacteur vivant.',
    unlock: state => state.totalEnergy >= 420 || state.prestige >= 1,
    lockedText: 'Débloqué à 420 énergie totale.',
    apply(state) { state.clickPower += 3; state.passiveRate += 0.75; },
  },
  {
    id: 'surchargeCoil', name: 'Bobine de surcharge', icon: '🧬', baseCost: 720, scale: 1.52, currency: 'energy', tier: 1,
    desc: '+12 capacité de surcharge, +1 charge par clic.',
    unlock: state => state.totalEnergy >= 850 || state.prestige >= 1,
    lockedText: 'Débloqué à 850 énergie totale.',
    apply(state) { state.maxSurcharge += 12; state.surchargeGain += 1; state.overdriveLevel += 1; },
  },
  {
    id: 'coreIsolation', name: 'Isolation du noyau', icon: '◉', baseCost: 1180, scale: 1.5, currency: 'energy', tier: 2,
    desc: 'Crée une sphère de confinement. +1 stockage fragment, +1 dureté, +8 surcharge.',
    unlock: state => state.totalEnergy >= 1200 || state.prestige >= 1,
    lockedText: 'Débloqué à 1 200 énergie totale : première coque de confinement.',
    apply(state) { state.coreShellCapacity += 1; state.coreShellHardness += 1; state.maxSurcharge += 8; },
  },
  {
    id: 'reflectiveAlloy', name: 'Alliage réflecteur', icon: '⬣', baseCost: 3100, scale: 1.56, currency: 'energy', tier: 2,
    desc: 'Matériau miroir : reflète l’énergie dans la sphère. +1 stockage, +1 dureté, +4% rendement.',
    unlock: state => (state.upgrades?.coreIsolation ?? 0) >= 1 || state.totalEnergy >= 4500 || state.prestige >= 1,
    lockedText: 'Nécessite Isolation du noyau Lv.1.',
    apply(state) { state.coreShellCapacity += 1; state.coreShellHardness += 1; state.coreShellReflect += 0.04; state.passiveRate += 1.4; },
  },
  {
    id: 'mirrorGel', name: 'Gel miroir vivant', icon: '◍', baseCost: 9200, scale: 1.61, currency: 'energy', tier: 3,
    desc: 'Gel biopunk réflectif : +2 stockage, +1 dureté, +8% rendement, fissures plus visibles.',
    unlock: state => (state.upgrades?.reflectiveAlloy ?? 0) >= 2 || state.totalEnergy >= 16000 || state.prestige >= 2,
    lockedText: 'Nécessite Alliage réflecteur Lv.2 ou 16 000 énergie totale.',
    apply(state) { state.coreShellCapacity += 2; state.coreShellHardness += 1; state.coreShellReflect += 0.08; state.passiveRate += 4; state.clickPower += 4; },
  },
  {
    id: 'prism', name: 'Prisme Nitro', icon: '◆', baseCost: 1650, scale: 1.67, currency: 'energy', tier: 2,
    desc: '+9 clic et +2.4/s. Stabilise les flux biopunk.',
    unlock: state => state.totalEnergy >= 2200 || state.prestige >= 1,
    lockedText: 'Débloqué à 2 200 énergie totale.',
    apply(state) { state.clickPower += 9; state.passiveRate += 2.4; },
  },
  {
    id: 'prismGlass', name: 'Verre prismatique', icon: '◇', baseCost: 26000, scale: 1.64, currency: 'energy', tier: 3,
    desc: 'Couche cristalline haute réflexion : +2 stockage, +2 dureté, +12% rendement.',
    unlock: state => (state.upgrades?.mirrorGel ?? 0) >= 1 && (state.upgrades?.prism ?? 0) >= 1 || state.totalEnergy >= 52000 || state.prestige >= 3,
    lockedText: 'Nécessite Gel miroir + Prisme Nitro, ou 52 000 énergie totale.',
    apply(state) { state.coreShellCapacity += 2; state.coreShellHardness += 2; state.coreShellReflect += 0.12; state.passiveRate += 8; state.clickPower += 7; },
  },
  {
    id: 'bioConduit', name: 'Conduit organique', icon: '🫀', baseCost: 5200, scale: 1.62, currency: 'energy', tier: 2,
    desc: '+6 clic, +7.5/s, tentacules plus denses.',
    unlock: state => (state.upgrades?.prism ?? 0) >= 2 || state.totalEnergy >= 7000 || state.prestige >= 2,
    lockedText: 'Débloqué avec Prisme Nitro Lv.2 ou 7 000 énergie totale.',
    apply(state) { state.clickPower += 6; state.passiveRate += 7.5; state.maxSurcharge += 5; },
  },
  {
    id: 'fractureTuning', name: 'Accord de fracture', icon: '✧', baseCost: 6, scale: 1.72, currency: 'fragments', tier: 3, persistent: true,
    desc: 'Upgrade permanent : augmente les chances de briser la sphère et réduit les coups requis.',
    unlock: state => state.totalFragments >= 1 || state.prestige >= 1,
    lockedText: 'Nécessite au moins un Fragment Nitro découvert.',
    apply(state) { state.coreShellBreakBonus += 0.065; state.permanentMultiplier += 0.025; },
  },
  {
    id: 'fragmentCatalyst', name: 'Catalyseur de fragments', icon: '💠', baseCost: 4, scale: 1.62, currency: 'fragments', tier: 3, persistent: true,
    desc: 'Upgrade permanent : +7% multiplicateur global par niveau. Survit aux resets du noyau.',
    unlock: state => state.fragments >= 1 || state.totalFragments >= 1 || state.prestige >= 1,
    lockedText: 'Débloqué après ton premier Fragment Nitro.',
    apply(state) { state.permanentMultiplier += 0.07; },
  },
  {
    id: 'nitroFactory', name: 'Usine de moteurs Nitro', icon: '🏭', baseCost: 75000, scale: 1.48, currency: 'energy', tier: 4,
    desc: 'Dézoom Prestige 10 : +24 clic, +32/s, +1 usine.',
    unlock: state => state.prestige >= 10,
    lockedText: 'Débloqué au Prestige 10 : changement d’échelle.',
    apply(state) { state.clickPower += 24; state.passiveRate += 32; state.factoryRate += 1; },
  },
  {
    id: 'enginePlant', name: 'Chaîne de production moteur', icon: '⚙️', baseCost: 1200000, scale: 1.44, currency: 'energy', tier: 5,
    desc: 'Prestige 20 : production industrielle massive.',
    unlock: state => state.prestige >= 20,
    lockedText: 'Débloqué au Prestige 20.',
    apply(state) { state.clickPower += 110; state.passiveRate += 280; state.factoryRate += 8; },
  },
  {
    id: 'orbitalHive', name: 'Ruche orbitale Nitro', icon: '🛰️', baseCost: 7500000, scale: 1.56, currency: 'energy', tier: 6,
    desc: 'Prestige 50 : essaim orbital, scaling très haut.',
    unlock: state => state.prestige >= 50,
    lockedText: 'Débloqué au Prestige 50.',
    apply(state) { state.clickPower += 460; state.passiveRate += 1350; state.factoryRate += 30; state.maxSurcharge += 50; },
  },
];

export const MILESTONES = [
  { id: 'energy_100', label: 'Premier allumage', desc: 'Atteindre 100 énergie totale.', test: s => s.totalEnergy >= 100, reward: { energy: 45 } },
  { id: 'energy_1000', label: 'Réacteur vivant', desc: 'Atteindre 1 000 énergie totale.', test: s => s.totalEnergy >= 1000, reward: { fragments: 1 } },
  { id: 'clicks_250', label: 'Main nerveuse', desc: 'Faire 250 clics.', test: s => s.totalClicks >= 250, reward: { energy: 600 } },
  { id: 'passive_10', label: 'Flux stable', desc: 'Atteindre 10 énergie/seconde.', test: s => s.passiveRate >= 10, reward: { fragments: 2 } },
  { id: 'shell_first_stack', label: 'Fragment confiné', desc: 'Stocker un fragment dans la sphère isolante.', test: s => (s.coreShell?.storedFragments ?? 0) >= 1, reward: { energy: 1200 } },
  { id: 'shell_first_break', label: 'Brisure Nitro', desc: 'Briser la sphère de confinement.', test: s => (s.coreShell?.lastBreakAt ?? 0) > 0, reward: { fragments: 2 } },
  { id: 'first_prestige', label: 'Surcharge contrôlée', desc: 'Atteindre le Prestige 1.', test: s => s.prestige >= 1, reward: { fragments: 4 } },
  { id: 'prestige_3', label: 'Baie moteur', desc: 'Atteindre le Prestige 3.', test: s => s.prestige >= 3, reward: { fragments: 7 } },
  { id: 'prestige_10', label: 'Dézoom industriel', desc: 'Atteindre le Prestige 10.', test: s => s.prestige >= 10, reward: { fragments: 22, energy: 40000 } },
  { id: 'prestige_25', label: 'District énergétique', desc: 'Atteindre le Prestige 25.', test: s => s.prestige >= 25, reward: { fragments: 55 } },
];

export function getScalingLayer(state) {
  const prestige = state?.prestige ?? 0;
  return [...SCALING_LAYERS].reverse().find(layer => prestige >= layer.prestige) ?? SCALING_LAYERS[0];
}

export function isPersistentUpgrade(upgrade) {
  return !!upgrade?.persistent || upgrade?.currency === 'fragments';
}

export function getPersistentUpgradeLevels(state) {
  return Object.fromEntries(
    UPGRADES
      .filter(isPersistentUpgrade)
      .map(upgrade => [upgrade.id, Math.max(0, Number(state?.upgrades?.[upgrade.id] ?? 0))]),
  );
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
  merged.coreShell = { ...base.coreShell, ...(raw?.coreShell ?? {}) };
  merged.fragments = Number(merged.fragments ?? 0);
  merged.totalFragments = Number(merged.totalFragments ?? merged.fragments ?? 0);
  merged.totalClicks = Number(merged.totalClicks ?? 0);
  merged.surcharge = Number(merged.surcharge ?? 0);
  merged.autoClickRate = Number(merged.autoClickRate ?? 0);
  merged.coreShell.storedFragments = Math.max(0, Number(merged.coreShell.storedFragments ?? 0));
  merged.coreShell.cracks = Math.max(0, Number(merged.coreShell.cracks ?? 0));
  merged.userId = userId ?? merged.userId;
  recalcDerivedStats(merged);
  merged.coreShell.storedFragments = Math.min(merged.coreShell.storedFragments, getCoreShellInfo(merged).capacity);
  return merged;
}

export function recalcDerivedStats(state) {
  const layer = getScalingLayer(state);
  state.clickPower = (1 + state.prestige) * layer.mult;
  state.passiveRate = state.prestige * 0.1 * layer.mult;
  state.autoClickRate = 0;
  state.maxSurcharge = 100;
  state.surchargeGain = 5;
  state.overdriveLevel = 0;
  state.factoryRate = 0;
  state.permanentMultiplier = 1;
  state.coreShellCapacity = 0;
  state.coreShellHardness = 0;
  state.coreShellReflect = 0;
  state.coreShellBreakBonus = 0;

  for (const upgrade of UPGRADES) {
    const level = state.upgrades[upgrade.id] ?? 0;
    for (let i = 0; i < level; i++) upgrade.apply(state);
  }

  const reflectMultiplier = 1 + Math.min(1.2, state.coreShellReflect ?? 0);
  state.clickPower *= state.permanentMultiplier * reflectMultiplier;
  state.passiveRate *= state.permanentMultiplier * reflectMultiplier;
  state.autoClickRate *= state.permanentMultiplier;
  state.surcharge = Math.min(state.surcharge ?? 0, state.maxSurcharge);
}

export function getCoreGrowthLevel(state) {
  const upgradeLevels = Object.values(state?.upgrades ?? {}).reduce((sum, value) => sum + Math.max(0, Number(value ?? 0)), 0);
  const energyStage = Math.floor(Math.log10(Math.max(1, Number(state?.totalEnergy ?? 0))) / 2);
  return Math.max(0, Math.min(24, upgradeLevels + energyStage + Math.floor((state?.prestige ?? 0) / 2)));
}

export function getCoreShellInfo(state) {
  const capacity = Math.max(0, Math.floor(Number(state?.coreShellCapacity ?? 0)));
  const hardness = Math.max(0, Math.floor(Number(state?.coreShellHardness ?? 0)));
  const stored = Math.max(0, Math.floor(Number(state?.coreShell?.storedFragments ?? 0)));
  const cracks = Math.max(0, Math.floor(Number(state?.coreShell?.cracks ?? 0)));
  const breakCost = getCoreShellBreakCost(state);
  const requiredHits = getCoreShellRequiredHits(state);
  const breakChance = getCoreShellBreakChance(state);
  return {
    unlocked: capacity > 0,
    capacity,
    hardness,
    storedFragments: Math.min(stored, capacity),
    fillRatio: capacity > 0 ? Math.min(1, stored / capacity) : 0,
    cracks,
    crackRatio: requiredHits > 0 ? Math.min(1, cracks / requiredHits) : 0,
    requiredHits,
    breakCost,
    breakChance,
    reflect: Math.max(0, Number(state?.coreShellReflect ?? 0)),
  };
}

export function getCoreShellBreakCost(state) {
  const hardness = Math.max(0, Number(state?.coreShellHardness ?? 0));
  const stored = Math.max(0, Number(state?.coreShell?.storedFragments ?? 0));
  return Math.floor(BALANCE.shellBaseBreakCost * Math.pow(BALANCE.shellBreakCostScale, hardness) * Math.max(1, stored || 1));
}

export function getCoreShellRequiredHits(state) {
  const hardness = Math.max(0, Number(state?.coreShellHardness ?? 0));
  const tuning = Math.max(0, Number(state?.upgrades?.fractureTuning ?? 0));
  return Math.max(1, Math.ceil(1 + hardness * 0.55 - tuning * 0.35));
}

export function getCoreShellBreakChance(state) {
  const hardness = Math.max(0, Number(state?.coreShellHardness ?? 0));
  const tuning = Math.max(0, Number(state?.upgrades?.fractureTuning ?? 0));
  const cracks = Math.max(0, Number(state?.coreShell?.cracks ?? 0));
  const stored = Math.max(0, Number(state?.coreShell?.storedFragments ?? 0));
  const capacity = Math.max(1, Number(state?.coreShellCapacity ?? 1));
  const base = 0.17 + tuning * 0.065 + cracks * 0.055 + (stored / capacity) * 0.08 - hardness * 0.018;
  return Math.max(0.06, Math.min(0.82, base));
}

export function storeCoreShellFragments(state, amount = 1) {
  const shell = getCoreShellInfo(state);
  if (!shell.unlocked) return { stored: 0, overflow: amount };
  const incoming = Math.max(0, Math.floor(Number(amount) || 0));
  const current = Math.max(0, Math.floor(state.coreShell?.storedFragments ?? 0));
  const free = Math.max(0, shell.capacity - current);
  const stored = Math.min(free, incoming);
  if (stored > 0) {
    state.coreShell.storedFragments = current + stored;
    state.updatedAt = Date.now();
  }
  return { stored, overflow: incoming - stored };
}

export function attemptCoreShellBreak(state) {
  const shell = getCoreShellInfo(state);
  if (!shell.unlocked) return { ok: false, reason: 'locked', shell };
  if (shell.storedFragments <= 0) return { ok: false, reason: 'empty', shell };
  if (state.energy < shell.breakCost) return { ok: false, reason: 'not_enough_energy', shell };

  state.energy -= shell.breakCost;
  const chance = shell.breakChance;
  const naturalSuccess = Math.random() < chance;
  const nextCracks = shell.cracks + 1;
  const forcedSuccess = nextCracks >= shell.requiredHits;

  if (naturalSuccess || forcedSuccess) {
    const released = shell.storedFragments;
    state.coreShell.storedFragments = 0;
    state.coreShell.cracks = 0;
    state.coreShell.lastBreakAt = Date.now();
    state.coreShell.failedBreaks = Math.max(0, Number(state.coreShell.failedBreaks ?? 0));
    addFragments(state, released);
    state.updatedAt = Date.now();
    return { ok: true, released, forced: forcedSuccess && !naturalSuccess, chance, shell: getCoreShellInfo(state) };
  }

  state.coreShell.cracks = nextCracks;
  state.coreShell.failedBreaks = Math.max(0, Number(state.coreShell.failedBreaks ?? 0)) + 1;
  state.updatedAt = Date.now();
  return { ok: false, reason: 'failed', cracks: nextCracks, chance, shell: getCoreShellInfo(state) };
}

export function applyOfflineProgress(state) {
  const now = Date.now();
  const elapsed = Math.max(0, Math.min(BALANCE.passiveOfflineCapHours * 60 * 60, (now - (state.lastTickAt ?? now)) / 1000));
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
  let fragmentsStored = 0;

  state.surcharge = Math.min(state.maxSurcharge, (state.surcharge ?? 0) + state.surchargeGain);
  if (state.surcharge >= state.maxSurcharge) {
    overdrive = true;
    state.surcharge = 0;
    overdriveGain = Math.floor(state.clickPower * (BALANCE.overdriveBase + state.overdriveLevel * BALANCE.overdrivePerLevel) + state.passiveRate * BALANCE.overdrivePassiveSeconds);
    gain += overdriveGain;
    const fragmentChance = Math.min(
      BALANCE.fragmentBaseChance + state.prestige * BALANCE.fragmentPrestigeChance + state.overdriveLevel * BALANCE.fragmentOverdriveChance,
      BALANCE.fragmentChanceCap,
    );
    if (Math.random() < fragmentChance) {
      const stored = storeCoreShellFragments(state, 1);
      fragmentsStored = stored.stored;
      if (stored.overflow > 0) fragments = addFragments(state, stored.overflow);
    }
  }

  state.energy += gain;
  state.totalEnergy += gain;
  state.updatedAt = Date.now();
  return { gain, overdrive, overdriveGain, fragments, fragmentsStored };
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
  state.coreShell.storedFragments = Math.min(state.coreShell.storedFragments, getCoreShellInfo(state).capacity);
  state.updatedAt = Date.now();
  return { ok: true, cost, amount: qty, level: level + qty, currency, persistent: isPersistentUpgrade(upgrade) };
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
  if (milestone.id === 'energy_1000') return state.totalEnergy >= 180;
  if (milestone.id === 'clicks_250') return state.totalClicks >= 25;
  if (milestone.id === 'passive_10') return state.passiveRate >= 2;
  if (milestone.id === 'shell_first_stack') return (state.upgrades?.coreIsolation ?? 0) >= 1;
  if (milestone.id === 'shell_first_break') return (state.coreShell?.storedFragments ?? 0) >= 1 || (state.coreShell?.lastBreakAt ?? 0) > 0;
  if (milestone.id === 'first_prestige') return state.totalEnergy >= 3500 || state.prestige >= 1;
  if (milestone.id === 'prestige_3') return state.prestige >= 1;
  if (milestone.id === 'prestige_10') return state.prestige >= 6;
  if (milestone.id === 'prestige_25') return state.prestige >= 18;
  return false;
}

export function canPrestige(state) {
  return state.totalEnergy >= prestigeRequirement(state);
}

export function prestigeRequirement(state) {
  const prestige = Math.max(0, Number(state.prestige ?? 0));
  if (prestige <= 10) return Math.floor(BALANCE.prestigeBase * Math.pow(BALANCE.prestigeEarlyScale, prestige));
  const p10 = BALANCE.prestigeBase * Math.pow(BALANCE.prestigeEarlyScale, 10);
  return Math.floor(p10 * Math.pow(BALANCE.prestigeLateScale, prestige - 10));
}

export function doPrestige(state) {
  if (!canPrestige(state)) return { ok: false, reason: 'not_ready' };
  const userId = state.userId;
  const keptFragments = Math.max(0, Number(state.fragments ?? 0));
  const keptTotalFragments = Math.max(keptFragments, Number(state.totalFragments ?? keptFragments));
  const keptMilestones = state.milestones;
  const keptTotalClicks = state.totalClicks;
  const keptPersistentUpgrades = getPersistentUpgradeLevels(state);
  const next = createDefaultState(userId);
  next.prestige = state.prestige + 1;
  const prestigeReward = Math.floor(3 + next.prestige * 1.25 + Math.sqrt(Math.max(0, state.totalEnergy)) / 3000);
  next.fragments = keptFragments + prestigeReward;
  next.totalFragments = keptTotalFragments + prestigeReward;
  next.upgrades = { ...next.upgrades, ...keptPersistentUpgrades };
  next.milestones = keptMilestones;
  next.totalClicks = keptTotalClicks;
  recalcDerivedStats(next);
  return { ok: true, state: next, keptPersistentUpgrades, prestigeReward };
}
