export const VERSION = 9;

export const BALANCE = {
  // Seuil d'énergie disponible requis pour le premier prestige (échelle exponentielle)
  prestigeBase: 18000,
  // Exposant de progression prestige early (P0->P10) — P1 vise ~25-35 min, P10 plusieurs heures
  prestigeEarlyScale: 2.05,
  // Exposant de progression prestige tardif (P10+) — progression plus lente intentionnelle
  prestigeLateScale: 2.3,
  // Cap de progression hors-ligne en heures (sans compétence offlineGrid LEMEGETON)
  passiveOfflineCapHours: 8,
  // Multiplicateur de base de l'Overdrive sur le gain de clic
  overdriveBase: 12,
  // Bonus de multiplicateur Overdrive par niveau d'overdriveLevel
  overdrivePerLevel: 1.9,
  // Secondes de production passive incluses dans le gain Overdrive
  overdrivePassiveSeconds: 5,
  // Chance de base de drop d'un fragment à chaque Overdrive
  fragmentBaseChance: 0.08,
  // Bonus de chance fragment par niveau de prestige
  fragmentPrestigeChance: 0.006,
  // Bonus de chance fragment par niveau d'overdriveLevel
  fragmentOverdriveChance: 0.014,
  // Plafond absolu de la chance de drop fragment (45%)
  fragmentChanceCap: 0.45,
  // Coût de base (en énergie) pour tenter de briser la sphère au stockage=0
  shellBaseBreakCost: 1250,
  // Facteur d'échelle du coût de brisure par niveau de dureté
  shellBreakCostScale: 1.34,
  // Bonus de chance de fragment lié à la coque (déclenchement Overdrive uniquement)
  shellFragmentBonusBase: 0.035,
  // Plafond du bonus fragment coque, indépendant de la capacité
  shellFragmentBonusMax: 0.045,
  // Bonus fragment par point de capacité de coque
  shellFragmentBonusPerCapacity: 0.004,
  // Choc infligé à la coque par clic manuel (fractionnaire, accumulé dans coreShell.cracks)
  shellShockPerClick: 0.006,
  // Choc supplémentaire infligé à la coque lors d'un Overdrive
  shellShockPerOverdrive: 0.10,
  // Choc supplémentaire infligé à la coque lors d'un Crit Overdrive (en plus du choc Overdrive)
  shellShockPerCrit: 0.30,
  // Remise max sur le coût de brisure manuelle quand la coque est déjà fissurée par les chocs
  shellBreakCostCrackDiscount: 0.70,
  // Ratio de gain d'énergie par clic auto vs clic manuel (45% = moins rentable intentionnellement)
  autoClickGainRatio: 0.45,
  // Ratio de charge de surcharge par clic auto (85% = Overdrive possible mais ralenti)
  autoClickSurchargeRatio: 0.85,
  // Nombre max de clics auto simulés par tick (évite les boucles trop longues)
  autoClickMaxBurstsPerTick: 12,
  // Limite haute pour les achats en lot — au-delà, coût cumulatif trop long à calculer
  maxBulkBuy: 10000,
  // Coût en énergie par fusion (≈ 5 « bonbonnes »), identique à chaque tier
  fusionCost: 50_000_000_000,
  // Multiplicateur global PAR TIER — appliqué de façon multiplicative : tier N = fusionTierBonus^N
  // tier1=×3 · tier2=×9 · tier3=×27 · tier4=×81 · tier5=×243
  fusionTierBonus: 3.0,
  // Durée de base d'une activation de boost LEMEGETON (ms)
  boostBaseDurationMs: 60_000,
  // Durée ajoutée par niveau d'amélioration du boost (ms)
  boostDurationPerLevel: 12_000,
  // Magnitude de base de l'effet d'un boost (interprétation dépend du boost)
  boostMagnitudeBase: 1.0,
  // Magnitude ajoutée par niveau d'amélioration
  boostMagnitudePerLevel: 0.15,
  // Coût en fragments du premier niveau d'amélioration d'un boost
  boostUpgradeBaseCost: 20,
  // Facteur d'échelle du coût d'amélioration par niveau
  boostUpgradeScale: 1.6,
  // Niveau max d'amélioration par boost
  boostUpgradeMaxLevel: 10,
};

export const SCALING_LAYERS = [
  { id: 'core', prestige: 0, name: 'Noyau unique', short: 'CORE', desc: 'Tu stabilises un seul réacteur Nitro vivant.', mult: 1 },
  { id: 'engine_bay', prestige: 3, name: 'Baie moteur', short: 'BAY', desc: 'Plusieurs modules commencent à tourner autour du noyau.', mult: 1.32 },
  { id: 'factory', prestige: 10, name: 'Multiplicateur de noyau', short: 'CORE×', desc: 'Le noyau se duplique. Copies à 10%→80% du noyau principal.', mult: 2.15 },
  { id: 'district', prestige: 25, name: 'District énergétique', short: 'DISTRICT', desc: 'Le réseau alimente un quartier entier du hub Star.', mult: 4.55 },
  { id: 'orbital', prestige: 50, name: 'Anneau orbital', short: 'ORBITAL', desc: 'Production à échelle orbitale : les usines deviennent un essaim.', mult: 10.2 },
];

export function createDefaultState(userId = null) {
  return {
    version: VERSION,
    userId,
    energy: 0,
    totalEnergy: 0,
    lifetimeEnergy: 0,
    fragments: 0,
    totalFragments: 0,
    clickPower: 1,
    passiveRate: 0,
    autoClickRate: 0,
    autoClickAccumulator: 0,
    prestige: 0,
    totalClicks: 0,
    surcharge: 0,
    maxSurcharge: 100,
    surchargeGain: 5,
    overdriveLevel: 0,
    overdriveCount: 0,
    factoryRate: 0,
    permanentMultiplier: 1,
    coreShellCapacity: 0,
    coreShellHardness: 0,
    coreShellReflect: 0,
    coreShellBreakBonus: 0,
    coreShell: { storedFragments: 0, cracks: 0, lastBreakAt: 0, failedBreaks: 0 },
    coreTier: 0,
    activeBoosts: {},
    boostLevels: {},
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
    lemegetonSkills: {},
    lemegetonToggles: {},
    lastTickAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Arbre de compétences LEMEGETON ────────────────────────────────────────
// Compétences permanentes achetées en FRAGMENTS, survivant au prestige.
// S'activent une fois LEMEGETON en ligne (1 Md énergie cumulée ou Prestige 10).
export const LEMEGETON_ONLINE_LIFETIME = 1_000_000_000;

export function isLemegetonOnline(state) {
  const lifetime = Number(state?.lifetimeEnergy ?? state?.totalEnergy ?? 0);
  return lifetime >= LEMEGETON_ONLINE_LIFETIME || Number(state?.prestige ?? 0) >= 10;
}

export const LEMEGETON_SKILLS = [
  {
    id: 'overclock', name: 'Surcadence', icon: '🌀', kind: 'leveled',
    baseCost: 10, scale: 1.5, maxLevel: 30, perLevel: 0.04,
    desc(state) {
      const lvl = lemegetonSkillLevel(state, 'overclock');
      return `+4% production globale par niveau (clic · passif · usine). Actuel : +${Math.round(lvl * 4)}%.`;
    },
    unlock: state => isLemegetonOnline(state),
    lockedText: 'Nécessite LEMEGETON en ligne (1 Md énergie cumulée ou Prestige 10).',
  },
  {
    id: 'autoPurchase', name: 'Auto-achat', icon: '🧠', kind: 'unlock', toggleable: true,
    cost: 35,
    desc: 'LEMEGETON améliore seul les systèmes automatiques : noyau automatique et auto-clicker de maintien.',
    unlock: state => isLemegetonOnline(state),
    lockedText: 'Nécessite LEMEGETON en ligne (1 Md énergie cumulée ou Prestige 10).',
  },
  {
    id: 'fragmentResonance', name: 'Résonance fragmentaire', icon: '💠', kind: 'leveled',
    baseCost: 14, scale: 1.55, maxLevel: 25, perLevel: 0.05,
    desc(state) {
      const lvl = lemegetonSkillLevel(state, 'fragmentResonance');
      return `+5% de fragments gagnés (prestige & brisure de coque) par niveau. Actuel : +${Math.round(lvl * 5)}%.`;
    },
    unlock: state => isLemegetonOnline(state) && Number(state?.prestige ?? 0) >= 3,
    lockedText: 'Nécessite LEMEGETON en ligne et Prestige 3.',
  },
  {
    id: 'critOverdrive', name: 'Surcharge critique', icon: '💥', kind: 'leveled',
    baseCost: 18, scale: 1.6, maxLevel: 12,
    desc(state) {
      const lvl = lemegetonSkillLevel(state, 'critOverdrive');
      if (lvl === 0) return 'Un overdrive sur N devient CRITIQUE (×gain massif). N diminue et le multiplicateur monte par niveau.';
      return `1 overdrive sur ${getCritOverdriveInterval(state)} est CRITIQUE ×${getCritOverdriveMultiplier(state).toFixed(1)}.`;
    },
    unlock: state => isLemegetonOnline(state) && Number(state?.prestige ?? 0) >= 5,
    lockedText: 'Nécessite LEMEGETON en ligne et Prestige 5.',
  },
  {
    id: 'offlineGrid', name: 'Grille offline', icon: '🛰️', kind: 'unlock',
    cost: 80,
    desc: 'LEMEGETON maintient le réseau hors-ligne : cap de farm offline porté de 8 h à 24 h.',
    unlock: state => isLemegetonOnline(state) && Number(state?.prestige ?? 0) >= 10,
    lockedText: 'Nécessite LEMEGETON en ligne et Prestige 10.',
  },
];

export function lemegetonSkillLevel(state, id) {
  return Math.max(0, Math.floor(Number(state?.lemegetonSkills?.[id] ?? 0)));
}

export function isLemegetonSkillUnlocked(state, skill) {
  return skill.unlock ? !!skill.unlock(state) : true;
}

export function lemegetonSkillCost(skill, level) {
  if (skill.kind === 'unlock') return skill.cost;
  return Math.floor(skill.baseCost * Math.pow(skill.scale, level));
}

export function isLemegetonSkillMaxed(state, skill) {
  const lvl = lemegetonSkillLevel(state, skill.id);
  return skill.kind === 'unlock' ? lvl >= 1 : lvl >= (skill.maxLevel ?? Infinity);
}

export function buyLemegetonSkill(state, skillId) {
  const skill = LEMEGETON_SKILLS.find(s => s.id === skillId);
  if (!skill) return { ok: false, reason: 'unknown_skill' };
  if (!isLemegetonSkillUnlocked(state, skill)) return { ok: false, reason: 'locked' };
  if (isLemegetonSkillMaxed(state, skill)) return { ok: false, reason: 'maxed' };

  const level = lemegetonSkillLevel(state, skill.id);
  const cost = lemegetonSkillCost(skill, level);
  if (Number(state.fragments ?? 0) < cost) return { ok: false, reason: 'not_enough_fragments', cost };

  state.fragments -= cost;
  if (!state.lemegetonSkills) state.lemegetonSkills = {};
  state.lemegetonSkills[skill.id] = level + 1;
  recalcDerivedStats(state);
  state.updatedAt = Date.now();
  return { ok: true, cost, level: level + 1, skill };
}

// Effets dérivés des compétences (lus par recalc, la boucle de jeu et l'offline)
export function getLemegetonProdMultiplier(state) {
  return 1 + lemegetonSkillLevel(state, 'overclock') * 0.04;
}
export function getFragmentGainMultiplier(state) {
  return 1 + lemegetonSkillLevel(state, 'fragmentResonance') * 0.05;
}
// Compétences activables/désactivables (toggleable) : actives par défaut une
// fois achetées, mises en pause si le joueur le décide.
export function isLemegetonSkillActive(state, id) {
  if (lemegetonSkillLevel(state, id) < 1) return false;
  return state?.lemegetonToggles?.[id] !== false;
}
export function toggleLemegetonSkill(state, id) {
  const skill = LEMEGETON_SKILLS.find(s => s.id === id);
  if (!skill?.toggleable || lemegetonSkillLevel(state, id) < 1) return { ok: false };
  if (!state.lemegetonToggles) state.lemegetonToggles = {};
  const next = !isLemegetonSkillActive(state, id);
  state.lemegetonToggles[id] = next;
  state.updatedAt = Date.now();
  return { ok: true, active: next };
}
export function isAutoPurchaseEnabled(state) {
  return isLemegetonSkillActive(state, 'autoPurchase');
}
export function getCritOverdriveInterval(state) {
  const lvl = lemegetonSkillLevel(state, 'critOverdrive');
  if (lvl <= 0) return 0;
  return Math.max(10, 50 - (lvl - 1) * 4); // Lv.1 : 1/50 · Lv.11+ : 1/10
}
export function getCritOverdriveMultiplier(state) {
  const lvl = lemegetonSkillLevel(state, 'critOverdrive');
  return lvl <= 0 ? 1 : 5 + lvl * 1.5; // Lv.1 : ×6.5 · Lv.12 : ×23
}
export function getOfflineCapHours(state) {
  return lemegetonSkillLevel(state, 'offlineGrid') >= 1 ? 24 : BALANCE.passiveOfflineCapHours;
}

// ── Boutique de boosts LEMEGETON ─────────────────────────────────────────
// Effets temporaires achetés en fragments (cher, à usage unique par activation),
// chacun teinte le noyau différemment le temps de la durée. Chaque boost a sa
// propre amélioration permanente (niveau) qui augmente durée + magnitude —
// survit au prestige comme les compétences LEMEGETON, mais indépendante d'elles.
export const BOOSTS = [
  {
    id: 'ionicSurge', name: 'Surcharge Ionique', icon: '⚡', tint: 'violet',
    activateCost: 40,
    desc: 'Multiplie la production globale (clic, passif, usine) pendant la durée. Le noyau vire au violet électrique.',
  },
  {
    id: 'crystalResonance', name: 'Résonance Cristalline', icon: '💎', tint: 'cyan',
    activateCost: 45,
    desc: 'Fait grimper fortement la chance de drop de fragments (Overdrive + coque) pendant la durée. Le noyau devient cristallin.',
  },
  {
    id: 'overtension', name: 'Surtension', icon: '🔥', tint: 'ember',
    activateCost: 35,
    desc: "Accélère fortement la charge de surcharge : les Overdrive s'enchaînent. Le noyau crépite en rouge-orangé.",
  },
];

export function getBoostLevel(state, boostId) {
  return Math.max(0, Math.floor(Number(state?.boostLevels?.[boostId] ?? 0)));
}

export function getBoostUpgradeCost(state, boostId) {
  const level = getBoostLevel(state, boostId);
  return Math.floor(BALANCE.boostUpgradeBaseCost * Math.pow(BALANCE.boostUpgradeScale, level));
}

export function isBoostUpgradeMaxed(state, boostId) {
  return getBoostLevel(state, boostId) >= BALANCE.boostUpgradeMaxLevel;
}

export function getBoostDurationMs(state, boostId) {
  return BALANCE.boostBaseDurationMs + getBoostLevel(state, boostId) * BALANCE.boostDurationPerLevel;
}

export function getBoostMagnitude(state, boostId) {
  return BALANCE.boostMagnitudeBase + getBoostLevel(state, boostId) * BALANCE.boostMagnitudePerLevel;
}

export function buyBoostUpgrade(state, boostId) {
  if (!isLemegetonOnline(state)) return { ok: false, reason: 'locked' };
  if (!BOOSTS.some(b => b.id === boostId)) return { ok: false, reason: 'unknown' };
  if (isBoostUpgradeMaxed(state, boostId)) return { ok: false, reason: 'maxed' };
  const cost = getBoostUpgradeCost(state, boostId);
  if (Number(state.fragments ?? 0) < cost) return { ok: false, reason: 'not_enough_fragments', cost };

  state.fragments -= cost;
  if (!state.boostLevels) state.boostLevels = {};
  state.boostLevels[boostId] = getBoostLevel(state, boostId) + 1;
  state.updatedAt = Date.now();
  return { ok: true, cost, level: state.boostLevels[boostId] };
}

export function isBoostActive(state, boostId) {
  return Number(state?.activeBoosts?.[boostId] ?? 0) > Date.now();
}

export function getBoostRemainingMs(state, boostId) {
  return Math.max(0, Number(state?.activeBoosts?.[boostId] ?? 0) - Date.now());
}

export function activateBoost(state, boostId) {
  if (!isLemegetonOnline(state)) return { ok: false, reason: 'locked' };
  const boost = BOOSTS.find(b => b.id === boostId);
  if (!boost) return { ok: false, reason: 'unknown' };
  if (Number(state.fragments ?? 0) < boost.activateCost) return { ok: false, reason: 'not_enough_fragments', cost: boost.activateCost };

  state.fragments -= boost.activateCost;
  if (!state.activeBoosts) state.activeBoosts = {};
  const expiresAt = Date.now() + getBoostDurationMs(state, boostId);
  state.activeBoosts[boostId] = expiresAt;
  state.updatedAt = Date.now();
  recalcDerivedStats(state);
  return { ok: true, expiresAt };
}

// Purge les boosts expirés et déclenche un recalc si l'ensemble actif a changé
// (les stats dérivées ne sont sinon recalculées que réactivement, sur achat).
export function tickBoosts(state) {
  let changed = false;
  for (const id of Object.keys(state.activeBoosts ?? {})) {
    if (Number(state.activeBoosts[id]) <= Date.now()) {
      delete state.activeBoosts[id];
      changed = true;
    }
  }
  if (changed) recalcDerivedStats(state);
  return changed;
}

export function getBoostProdMultiplier(state) {
  return isBoostActive(state, 'ionicSurge') ? 1 + getBoostMagnitude(state, 'ionicSurge') : 1;
}

export function getBoostFragmentBonus(state) {
  return isBoostActive(state, 'crystalResonance') ? getBoostMagnitude(state, 'crystalResonance') : 0;
}

export function getBoostSurchargeMultiplier(state) {
  return isBoostActive(state, 'overtension') ? 1 + getBoostMagnitude(state, 'overtension') : 1;
}

export const UPGRADES = [
  {
    id: 'clickAmplifier', name: 'Amplificateur de clic', icon: '⚡', baseCost: 24, scale: 1.34, currency: 'energy', tier: 0,
    desc: '+1 puissance de clic par niveau. Très rentable en début de run.',
    unlock: () => true,
    apply(state) { state.clickPower += 1; },
  },
  {
    id: 'autoCore', name: 'Noyau automatique', icon: '⬡', baseCost: 110, scale: 1.46, currency: 'energy', tier: 0,
    desc: '+0.45 énergie / seconde par niveau. Production passive stable.',
    unlock: () => true,
    apply(state) { state.passiveRate += 0.45; },
  },
  {
    id: 'autoClicker', name: 'Auto-clicker de maintien', icon: '◌', baseCost: 420, scale: 1.52, currency: 'energy', tier: 1,
    desc: 'Simule des clics automatiques : charge la surcharge, déclenche l\'Overdrive, aide LEMEGETON.',
    unlock: state => state.totalEnergy >= 220 || state.prestige >= 1,
    lockedText: 'Débloqué à 220 énergie totale.',
    apply(state) { state.autoClickRate += 0.16; state.surchargeGain += 0.12; state.overdriveLevel += 0.16; },
  },
  {
    id: 'resonance', name: 'Résonance Star', icon: '✦', baseCost: 700, scale: 1.54, currency: 'energy', tier: 1,
    desc: '+2.8 clic et +0.8/s. Débloque le réacteur vivant.',
    unlock: state => state.totalEnergy >= 360 || state.prestige >= 1,
    lockedText: 'Débloqué à 360 énergie totale.',
    apply(state) { state.clickPower += 2.8; state.passiveRate += 0.8; },
  },
  {
    id: 'surchargeCoil', name: 'Bobine de surcharge', icon: '🧬', baseCost: 1600, scale: 1.52, currency: 'energy', tier: 1,
    desc: '+8 capacité de surcharge, +1.25 charge par clic. Overdrive plus fréquent.',
    unlock: state => state.totalEnergy >= 720 || state.prestige >= 1,
    lockedText: 'Débloqué à 720 énergie totale.',
    apply(state) { state.maxSurcharge += 8; state.surchargeGain += 1.25; state.overdriveLevel += 0.6; },
  },
  {
    id: 'coreIsolation', name: 'Isolation du noyau', icon: '◉', baseCost: 2300, scale: 1.44, currency: 'energy', tier: 2,
    desc: 'Crée une sphère de confinement. +2 stockage fragment, +1 dureté, +8 surcharge.',
    unlock: state => state.totalEnergy >= 1000 || state.prestige >= 1,
    lockedText: 'Débloqué à 1 000 énergie totale : première coque de confinement.',
    apply(state) { state.coreShellCapacity += 2; state.coreShellHardness += 1; state.maxSurcharge += 8; },
  },
  {
    id: 'reflectiveAlloy', name: 'Alliage réflecteur', icon: '⬣', baseCost: 2400, scale: 1.42, currency: 'energy', tier: 2,
    desc: 'Matériau miroir : +1 stockage, +1 dureté, +4.5% rendement, +1.8/s.',
    unlock: state => (state.upgrades?.coreIsolation ?? 0) >= 1 || state.totalEnergy >= 3600 || state.prestige >= 1,
    lockedText: 'Nécessite Isolation du noyau Lv.1.',
    apply(state) { state.coreShellCapacity += 1; state.coreShellHardness += 1; state.coreShellReflect += 0.045; state.passiveRate += 1.8; },
  },
  {
    id: 'mirrorGel', name: 'Gel miroir vivant', icon: '◍', baseCost: 6800, scale: 1.48, currency: 'energy', tier: 3,
    desc: 'Gel biopunk réflectif : +2 stockage, +1 dureté, +7.5% rendement, fissures plus visibles.',
    unlock: state => (state.upgrades?.reflectiveAlloy ?? 0) >= 2 || state.totalEnergy >= 12000 || state.prestige >= 2,
    lockedText: 'Nécessite Alliage réflecteur Lv.2 ou 12 000 énergie totale.',
    apply(state) { state.coreShellCapacity += 2; state.coreShellHardness += 1; state.coreShellReflect += 0.075; state.passiveRate += 5; state.clickPower += 5; },
  },
  {
    id: 'prism', name: 'Prisme Nitro', icon: '◆', baseCost: 4200, scale: 1.58, currency: 'energy', tier: 2,
    desc: '+8 clic et +2.4/s. Stabilise les flux biopunk.',
    unlock: state => state.totalEnergy >= 1800 || state.prestige >= 1,
    lockedText: 'Débloqué à 1 800 énergie totale.',
    apply(state) { state.clickPower += 8; state.passiveRate += 2.4; },
  },
  {
    id: 'prismGlass', name: 'Verre prismatique', icon: '◇', baseCost: 18000, scale: 1.50, currency: 'energy', tier: 3,
    desc: 'Couche cristalline : +2 stockage, +1 dureté, +10% rendement.',
    unlock: state => (state.upgrades?.mirrorGel ?? 0) >= 1 && (state.upgrades?.prism ?? 0) >= 1 || state.totalEnergy >= 38000 || state.prestige >= 3,
    lockedText: 'Nécessite Gel miroir + Prisme Nitro, ou 38 000 énergie totale.',
    apply(state) { state.coreShellCapacity += 2; state.coreShellHardness += 1; state.coreShellReflect += 0.10; state.passiveRate += 10; state.clickPower += 9; },
  },
  {
    id: 'bioConduit', name: 'Conduit organique', icon: '🫀', baseCost: 9000, scale: 1.58, currency: 'energy', tier: 2,
    desc: '+6 clic, +7/s, tentacules plus denses.',
    unlock: state => (state.upgrades?.prism ?? 0) >= 2 || state.totalEnergy >= 6000 || state.prestige >= 2,
    lockedText: 'Débloqué avec Prisme Nitro Lv.2 ou 6 000 énergie totale.',
    apply(state) { state.clickPower += 6; state.passiveRate += 7; state.maxSurcharge += 4; },
  },
  {
    id: 'fractureTuning', name: 'Accord de fracture', icon: '✧', baseCost: 3, scale: 1.45, currency: 'fragments', tier: 3, persistent: true,
    desc: 'Upgrade permanent : augmente les chances de briser la sphère et réduit les coups requis.',
    unlock: state => state.totalFragments >= 1 || state.prestige >= 1,
    lockedText: 'Nécessite au moins un Fragment Nitro découvert.',
    apply(state) { state.coreShellBreakBonus += 0.085; state.permanentMultiplier += 0.03; },
  },
  {
    id: 'fragmentCatalyst', name: 'Catalyseur de fragments', icon: '💠', baseCost: 3, scale: 1.45, currency: 'fragments', tier: 3, persistent: true,
    desc: 'Upgrade permanent : +6.5% multiplicateur global par niveau. Survit aux resets du noyau.',
    unlock: state => state.fragments >= 1 || state.totalFragments >= 1 || state.prestige >= 1,
    lockedText: 'Débloqué après ton premier Fragment Nitro.',
    apply(state) { state.permanentMultiplier += 0.065; },
  },
  {
    id: 'nitroFactory', name: 'Multiplicateur de noyau', icon: '⚛️', baseCost: 62000, scale: 1.42, currency: 'energy', tier: 4,
    desc(state) {
      const lvl = state?.upgrades?.nitroFactory ?? 0;
      const orbitals = Math.floor(lvl / 10);
      if (orbitals === 0) return '+1 noyau orbital tous les 10 niveaux · chacun réfléchit l\'énergie du noyau, de 10% à 80% en grandissant.';
      const mult = state?.coreMultiplier ?? 1;
      const nextIn = lvl % 10 === 0 ? 10 : 10 - (lvl % 10);
      return `${orbitals} noyau${orbitals > 1 ? 'x' : ''} orbital${orbitals > 1 ? 'aux' : ''} · ×${mult.toFixed(2)} puissance · le prochain grandit dans ${nextIn} niveaux.`;
    },
    unlock: state => state.prestige >= 10,
    lockedText: 'Débloqué au Prestige 10 : des noyaux orbitaux gravitent autour du noyau.',
    apply(_state) { /* effet géré dans recalcDerivedStats via coreMultiplier */ },
  },
  {
    id: 'enginePlant', name: 'Duplication du noyau', icon: '⚙️', baseCost: 900000, scale: 1.38, currency: 'energy', tier: 5,
    desc(state) {
      const lvl = state?.upgrades?.enginePlant ?? 0;
      const clones = Math.min(5, Math.floor(lvl / 10));
      if (lvl === 0) return 'Duplique le noyau central tous les 10 niveaux (max 5, disposition hexagonale). Chaque clone produit comme le principal.';
      const rate = Math.round(state?.factoryRate ?? 0);
      const nextIn = clones >= 5 ? null : (lvl % 10 === 0 ? 10 : 10 - (lvl % 10));
      const tail = nextIn ? ` · prochain clone dans ${nextIn} niveaux` : ' · réseau hexagonal complet (5/5)';
      return `${clones} clone${clones > 1 ? 's' : ''} · ×${clones + 1} prod globale · ${rate.toLocaleString('fr-FR')} é/s${tail}.`;
    },
    unlock: state => state.prestige >= 20,
    lockedText: 'Débloqué au Prestige 20 : le noyau se duplique en réseau hexagonal.',
    apply(state) { state.clickPower += 140; state.passiveRate += 200; state.factoryRate += 75; },
  },
  {
    id: 'orbitalHive', name: 'Ruche orbitale Nitro', icon: '🛰️', baseCost: 6200000, scale: 1.48, currency: 'energy', tier: 6,
    desc(state) {
      const lvl = state?.upgrades?.orbitalHive ?? 0;
      if (lvl === 0) return 'Essaim orbital : +300 é/s industrielle et +10% production usine par niveau.';
      return `Essaim ×${lvl} · +${lvl * 10}% production usine · +300 é/s par niveau.`;
    },
    unlock: state => state.prestige >= 50,
    lockedText: 'Débloqué au Prestige 50.',
    apply(state) { state.clickPower += 560; state.passiveRate += 800; state.factoryRate += 300; state.factoryMult += 0.10; state.maxSurcharge += 50; },
  },
];

export const MILESTONES = [
  { id: 'energy_100', label: 'Premier allumage', desc: 'Atteindre 100 énergie totale.', test: s => s.totalEnergy >= 100, reward: { energy: 80 } },
  { id: 'energy_1000', label: 'Réacteur vivant', desc: 'Atteindre 1 000 énergie totale.', test: s => s.totalEnergy >= 1000, reward: { fragments: 2 } },
  { id: 'clicks_250', label: 'Main nerveuse', desc: 'Faire 250 clics.', test: s => s.totalClicks >= 250, reward: { energy: 900 } },
  { id: 'passive_10', label: 'Flux stable', desc: 'Atteindre 10 énergie/seconde.', test: s => s.passiveRate >= 10, reward: { fragments: 3 } },
  { id: 'shell_first_stack', label: 'Fragment confiné', desc: 'Stocker un fragment dans la sphère isolante.', test: s => (s.coreShell?.storedFragments ?? 0) >= 1, reward: { energy: 2500 } },
  { id: 'shell_first_break', label: 'Brisure Nitro', desc: 'Briser la sphère de confinement.', test: s => (s.coreShell?.lastBreakAt ?? 0) > 0, reward: { fragments: 3 } },
  { id: 'first_prestige', label: 'Surcharge contrôlée', desc: 'Atteindre le Prestige 1.', test: s => s.prestige >= 1, reward: { fragments: 5 } },
  { id: 'prestige_3', label: 'Baie moteur', desc: 'Atteindre le Prestige 3.', test: s => s.prestige >= 3, reward: { fragments: 8 } },
  { id: 'prestige_10', label: 'Dézoom industriel', desc: 'Atteindre le Prestige 10.', test: s => s.prestige >= 10, reward: { fragments: 26, energy: 70000 } },
  { id: 'prestige_25', label: 'District énergétique', desc: 'Atteindre le Prestige 25.', test: s => s.prestige >= 25, reward: { fragments: 70 } },
  { id: 'first_fusion', label: 'Résonance quantique', desc: 'Cinq clones entrent en résonance — le noyau atteint le Tier II.', hidden: true, test: s => Number(s.coreTier ?? 0) >= 1, reward: { fragments: 25 } },
];

export function getScalingLayer(state) {
  const prestige = state?.prestige ?? 0;
  return [...SCALING_LAYERS].reverse().find(layer => prestige >= layer.prestige) ?? SCALING_LAYERS[0];
}

export function isPersistentUpgrade(upgrade) {
  return !!upgrade?.persistent || upgrade?.currency === 'fragments';
}

export function getPersistentUpgradeLevels(state) {
  return Object.fromEntries(UPGRADES.filter(isPersistentUpgrade).map(upgrade => [upgrade.id, Math.max(0, Number(state?.upgrades?.[upgrade.id] ?? 0))]));
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

function addEnergy(state, amount) {
  const gain = Math.max(0, Number(amount) || 0);
  if (gain <= 0) return 0;
  state.energy += gain;
  state.totalEnergy += gain;
  state.lifetimeEnergy = Math.max(0, Number(state.lifetimeEnergy ?? 0)) + gain;
  return gain;
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
  merged.lemegetonSkills = { ...base.lemegetonSkills, ...(raw?.lemegetonSkills ?? {}) };
  merged.lemegetonToggles = { ...base.lemegetonToggles, ...(raw?.lemegetonToggles ?? {}) };
  merged.boostLevels = { ...base.boostLevels, ...(raw?.boostLevels ?? {}) };
  merged.activeBoosts = { ...(raw?.activeBoosts ?? {}) };
  merged.coreShell = { ...base.coreShell, ...(raw?.coreShell ?? {}) };
  merged.fragments = Number(merged.fragments ?? 0);
  merged.totalFragments = Number(merged.totalFragments ?? merged.fragments ?? 0);
  merged.totalClicks = Number(merged.totalClicks ?? 0);
  merged.surcharge = Number(merged.surcharge ?? 0);
  merged.autoClickRate = Number(merged.autoClickRate ?? 0);
  merged.autoClickAccumulator = Number(merged.autoClickAccumulator ?? 0);
  merged.lifetimeEnergy = Math.max(0, Number(merged.lifetimeEnergy ?? raw?.totalLifetimeEnergy ?? raw?.totalEnergy ?? raw?.energy ?? 0));
  merged.coreShell.storedFragments = Math.max(0, Number(merged.coreShell.storedFragments ?? 0));
  merged.coreShell.cracks = Math.max(0, Number(merged.coreShell.cracks ?? 0));
  merged.userId = userId ?? merged.userId;
  // ORDER MATTERS: recalcDerivedStats doit précéder le clamp storedFragments
  recalcDerivedStats(merged);
  // FIX #3 : clamp avec trace de l'overflow pour éviter perte silencieuse sur vieux saves
  const shellCapacity = getCoreShellInfo(merged).capacity;
  const shellOverflow = Math.max(0, merged.coreShell.storedFragments - shellCapacity);
  if (shellOverflow > 0) {
    merged.coreShell.storedFragments = shellCapacity;
    // Les fragments en excès sont rendus au joueur plutôt que perdus
    merged.fragments += shellOverflow;
    merged.totalFragments += shellOverflow;
  }
  return merged;
}

export const MAX_CORE_CLONES = 5;
export const MAX_FUSION_TIER = 5;

// Réflexion d'un noyau orbital donné par son rang (1-based) et le niveau nitroFactory.
// Les orbitaux d'index < décade courante sont figés à 80% ; le plus récent monte 10→80%.
export function getCoreMultiplier(state) {
  const nitroLvl = Math.max(0, Number(state?.upgrades?.nitroFactory ?? 0));
  const fullOrbitals = Math.floor(nitroLvl / 10);
  const partial = nitroLvl % 10;
  let coreMult = 1 + fullOrbitals * 0.80;
  if (partial > 0) coreMult += 0.10 + ((partial - 1) / 9) * 0.70;
  return coreMult;
}

// Nombre de noyaux centraux = principal (1) + clones (1 par 10 niveaux d'enginePlant, max 5).
export function getCoreCloneCount(state) {
  const engineLvl = Math.max(0, Number(state?.upgrades?.enginePlant ?? 0));
  return Math.min(MAX_CORE_CLONES, Math.floor(engineLvl / 10));
}

export function getCoreCount(state) {
  return 1 + getCoreCloneCount(state);
}

export function canFuseCore(state) {
  return (
    Number(state?.prestige ?? 0) >= 10 &&
    getCoreCloneCount(state) >= MAX_CORE_CLONES &&
    Number(state?.energy ?? 0) >= BALANCE.fusionCost &&
    Number(state?.coreTier ?? 0) < MAX_FUSION_TIER
  );
}

export function doFuseCore(state) {
  if (!canFuseCore(state)) return { ok: false };
  state.energy -= BALANCE.fusionCost;
  state.upgrades.enginePlant = 0;
  state.coreTier = (Number(state.coreTier ?? 0)) + 1;
  recalcDerivedStats(state);
  state.updatedAt = Date.now();
  return { ok: true, tier: state.coreTier };
}

export function getCoreTierBonus(state) {
  const tier = Math.max(0, Number(state?.coreTier ?? 0));
  return tier === 0 ? 1 : Math.pow(BALANCE.fusionTierBonus, tier);
}

export function recalcDerivedStats(state) {
  const layer = getScalingLayer(state);
  state.clickPower = (1 + state.prestige) * layer.mult;
  state.passiveRate = state.prestige * 0.14 * layer.mult;
  state.autoClickRate = 0;
  state.maxSurcharge = 100;
  state.surchargeGain = 5;
  state.overdriveLevel = 0;
  state.factoryRate = 0;
  state.factoryMult = 1;
  state.permanentMultiplier = 1;
  state.coreShellCapacity = 0;
  state.coreShellHardness = 0;
  state.coreShellReflect = 0;
  state.coreShellBreakBonus = 0;

  for (const upgrade of UPGRADES) {
    const level = state.upgrades[upgrade.id] ?? 0;
    for (let i = 0; i < level; i++) upgrade.apply(state);
  }

  // ── Multiplicateur de noyau (nitroFactory) : réflexion orbitale ─────────────
  // 1 noyau orbital / 10 niveaux. Le plus récent grandit DANS sa décade : sa
  // réflexion passe de 10% (niveau X1) à 80% au déblocage du suivant, puis se fige
  // à 80%. coreMult = 1 + somme des réflexions. (Aligné sur orbitalReflections() côté UI.)
  const coreMult = getCoreMultiplier(state);
  state.coreMultiplier = coreMult;

  // ── Duplication du noyau (enginePlant) : clones centraux ────────────────────
  // 1 clone / 10 niveaux (max 5, hexagone). Chaque clone est une copie complète
  // qui produit ×1 du système. coreCount = noyau principal + clones.
  const coreCount = getCoreCount(state);
  state.coreCount = coreCount;

  const tierBonus = getCoreTierBonus(state);
  state.coreTierBonus = tierBonus;
  const reflectMultiplier = 1 + Math.min(1.35, state.coreShellReflect ?? 0);
  state.clickPower  *= state.permanentMultiplier * reflectMultiplier * coreMult * coreCount * tierBonus;
  state.passiveRate *= state.permanentMultiplier * reflectMultiplier * coreMult * coreCount * tierBonus;
  state.autoClickRate *= state.permanentMultiplier;
  // Production industrielle : source d'énergie/s réelle (tickPassive + offline).
  // Boostée par le mult permanent, l'essaim orbital (factoryMult), la réflexion, les clones et le tier.
  state.factoryRate   *= state.permanentMultiplier * (state.factoryMult ?? 1) * coreMult * coreCount * tierBonus;

  // Surcadence (compétence LEMEGETON) : +% production globale, persistant.
  const lemeProd = getLemegetonProdMultiplier(state);
  if (lemeProd !== 1) {
    state.clickPower    *= lemeProd;
    state.passiveRate   *= lemeProd;
    state.autoClickRate *= lemeProd;
    state.factoryRate   *= lemeProd;
  }

  // Boost temporaire « Surcharge Ionique » : multiplicateur de prod, actif un temps limité.
  const boostProd = getBoostProdMultiplier(state);
  if (boostProd !== 1) {
    state.clickPower    *= boostProd;
    state.passiveRate   *= boostProd;
    state.autoClickRate *= boostProd;
    state.factoryRate   *= boostProd;
  }

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
  // FIX: Math.max(0, stored) au lieu de Math.max(1, stored || 1)
  // stored=0 et stored=1 avaient le même coût — désormais le coût croît bien dès stored=1
  const stored = Math.max(0, Number(state?.coreShell?.storedFragments ?? 0));
  const hardnessFactor = Math.pow(BALANCE.shellBreakCostScale, Math.max(0, hardness - 1));
  const storedFactor = 0.8 + Math.max(0, stored) * 0.85;
  // Remise : plus la coque est déjà fissurée par les chocs (clic/overdrive), moins
  // il coûte cher de l'achever à la main — le bouton devient un coup de grâce.
  const requiredHits = getCoreShellRequiredHits(state);
  const rawCracks = Math.max(0, Number(state?.coreShell?.cracks ?? 0));
  const crackRatio = requiredHits > 0 ? Math.min(1, rawCracks / requiredHits) : 0;
  const crackDiscount = 1 - crackRatio * BALANCE.shellBreakCostCrackDiscount;
  return Math.floor(BALANCE.shellBaseBreakCost * hardnessFactor * storedFactor * crackDiscount);
}

export function getCoreShellRequiredHits(state) {
  const hardness = Math.max(0, Number(state?.coreShellHardness ?? 0));
  const tuning = Math.max(0, Number(state?.upgrades?.fractureTuning ?? 0));
  return Math.max(1, Math.ceil(1 + hardness * 0.42 - tuning * 0.45));
}

export function getCoreShellBreakChance(state) {
  const hardness = Math.max(0, Number(state?.coreShellHardness ?? 0));
  const tuning = Math.max(0, Number(state?.upgrades?.fractureTuning ?? 0));
  const cracks = Math.max(0, Number(state?.coreShell?.cracks ?? 0));
  const stored = Math.max(0, Number(state?.coreShell?.storedFragments ?? 0));
  const capacity = Math.max(1, Number(state?.coreShellCapacity ?? 1));
  const base = 0.28 + tuning * 0.08 + cracks * 0.09 + (stored / capacity) * 0.10 - hardness * 0.012 + (state?.coreShellBreakBonus ?? 0);
  return Math.max(0.12, Math.min(0.90, base));
}

// Chance de drop de fragment à l'Overdrive uniquement (pas par clic normal)
export function getFragmentDropChanceOnOverdrive(state) {
  const shell = getCoreShellInfo(state);
  const shellBonus = shell.unlocked
    ? BALANCE.shellFragmentBonusBase + Math.min(BALANCE.shellFragmentBonusMax, shell.capacity * BALANCE.shellFragmentBonusPerCapacity)
    : 0;
  return Math.min(
    BALANCE.fragmentBaseChance
      + state.prestige * BALANCE.fragmentPrestigeChance
      + state.overdriveLevel * BALANCE.fragmentOverdriveChance
      + shellBonus
      + getBoostFragmentBonus(state),
    BALANCE.fragmentChanceCap,
  );
}

// Alias rétrocompat — à supprimer lors d'un futur nettoyage
export const getFragmentDropChance = getFragmentDropChanceOnOverdrive;

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

// Libère les fragments stockés dans la coque et remet les fissures à zéro.
// Partagé entre la brisure manuelle réussie et l'auto-brisure par choc.
function releaseCoreShellFragments(state) {
  const released = Math.max(0, Math.floor(Number(state.coreShell?.storedFragments ?? 0)));
  state.coreShell.storedFragments = 0;
  state.coreShell.cracks = 0;
  state.coreShell.lastBreakAt = Date.now();
  state.coreShell.failedBreaks = Math.max(0, Number(state.coreShell.failedBreaks ?? 0));
  const releasedGain = released > 0 ? Math.max(released, Math.floor(released * getFragmentGainMultiplier(state))) : 0;
  if (releasedGain > 0) addFragments(state, releasedGain);
  state.updatedAt = Date.now();
  return { released: releasedGain };
}

// Choc infligé à la coque par l'activité de clic (clic, overdrive, crit overdrive).
// Accumule dans coreShell.cracks (fractionnaire) ; déclenche une auto-brisure
// gratuite si le seuil de fissures requis est dépassé.
export function applyCoreShellShock(state, amount) {
  const shock = Math.max(0, Number(amount) || 0);
  if (shock <= 0) return { autoBreak: false };
  const capacity = Math.max(0, Number(state?.coreShellCapacity ?? 0));
  if (capacity <= 0) return { autoBreak: false };

  const rawCracks = Math.max(0, Number(state.coreShell?.cracks ?? 0)) + shock;
  state.coreShell.cracks = rawCracks;
  const requiredHits = getCoreShellRequiredHits(state);
  if (rawCracks >= requiredHits) {
    const { released } = releaseCoreShellFragments(state);
    return { autoBreak: true, released };
  }
  return { autoBreak: false };
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
    const { released: releasedGain } = releaseCoreShellFragments(state);
    return { ok: true, released: releasedGain, forced: forcedSuccess && !naturalSuccess, chance, shell: getCoreShellInfo(state) };
  }

  state.coreShell.cracks = nextCracks;
  state.coreShell.failedBreaks = Math.max(0, Number(state.coreShell.failedBreaks ?? 0)) + 1;
  state.updatedAt = Date.now();
  return { ok: false, reason: 'failed', cracks: nextCracks, chance, shell: getCoreShellInfo(state) };
}

export function applyOfflineProgress(state) {
  const now = Date.now();
  const rawElapsed = Math.max(0, (now - (state.lastTickAt ?? now)) / 1000);
  const capSeconds = getOfflineCapHours(state) * 60 * 60;
  const elapsed = Math.min(capSeconds, rawElapsed);
  const gained = Math.floor(elapsed * ((state.passiveRate ?? 0) + (state.factoryRate ?? 0)));
  addEnergy(state, gained);
  state.lastTickAt = now;
  state.updatedAt = now;
  // FIX #6 : retourne le temps réel, si le cap a été atteint et combien d'heures
  const cappedAt = rawElapsed > capSeconds ? getOfflineCapHours(state) : null;
  return { gained, elapsed, rawElapsed, cappedAt };
}

export function clickCore(state) {
  return applyCoreClick(state, { automatic: false });
}

export function applyCoreClick(state, { automatic = false, gainRatio = 1, surchargeRatio = 1 } = {}) {
  state.totalClicks += automatic ? 0 : 1;
  let gain = Math.max(1, Math.floor(state.clickPower * gainRatio));
  let overdrive = false;
  let overdriveGain = 0;
  let crit = false;
  let fragments = 0;
  let fragmentsStored = 0;

  // Boost temporaire « Surtension » : accélère la charge de surcharge, donc la fréquence d'Overdrive.
  state.surcharge = Math.min(state.maxSurcharge, (state.surcharge ?? 0) + state.surchargeGain * surchargeRatio * getBoostSurchargeMultiplier(state));
  if (state.surcharge >= state.maxSurcharge) {
    overdrive = true;
    state.surcharge = 0;
    state.overdriveCount = Math.max(0, Math.floor(Number(state.overdriveCount ?? 0))) + 1;
    overdriveGain = Math.floor(state.clickPower * gainRatio * (BALANCE.overdriveBase + state.overdriveLevel * BALANCE.overdrivePerLevel) + state.passiveRate * BALANCE.overdrivePassiveSeconds);
    // Surcharge critique (compétence LEMEGETON) : 1 overdrive sur N est amplifié.
    const critInterval = getCritOverdriveInterval(state);
    if (critInterval > 0 && state.overdriveCount % critInterval === 0) {
      crit = true;
      overdriveGain = Math.floor(overdriveGain * getCritOverdriveMultiplier(state));
    }
    gain += overdriveGain;
    if (Math.random() < getFragmentDropChanceOnOverdrive(state)) {
      const stored = storeCoreShellFragments(state, 1);
      fragmentsStored = stored.stored;
      if (stored.overflow > 0) fragments = addFragments(state, stored.overflow);
    }
  }

  // Choc de coque : chaque clic use un peu la sphère, l'overdrive et le crit
  // overdrive l'ébranlent davantage. Peut déclencher une auto-brisure gratuite.
  let shellShock = BALANCE.shellShockPerClick * surchargeRatio;
  if (overdrive) shellShock += BALANCE.shellShockPerOverdrive;
  if (crit) shellShock += BALANCE.shellShockPerCrit;
  const shockResult = applyCoreShellShock(state, shellShock);

  addEnergy(state, gain);
  state.updatedAt = Date.now();
  return {
    gain, overdrive, overdriveGain, crit, fragments, fragmentsStored, automatic,
    shellAutoBreak: shockResult.autoBreak, shellReleased: shockResult.released ?? 0,
  };
}

export function tickAutoClicks(state, deltaSeconds) {
  if ((state.autoClickRate ?? 0) <= 0 || deltaSeconds <= 0) return { clicks: 0, gain: 0, overdrives: 0, fragments: 0, fragmentsStored: 0 };
  state.autoClickAccumulator = Math.max(0, Number(state.autoClickAccumulator ?? 0)) + state.autoClickRate * deltaSeconds;
  const clicks = Math.min(BALANCE.autoClickMaxBurstsPerTick, Math.floor(state.autoClickAccumulator));
  if (clicks <= 0) return { clicks: 0, gain: 0, overdrives: 0, fragments: 0, fragmentsStored: 0 };
  state.autoClickAccumulator -= clicks;

  const summary = { clicks, gain: 0, overdrives: 0, fragments: 0, fragmentsStored: 0 };
  for (let i = 0; i < clicks; i++) {
    const result = applyCoreClick(state, { automatic: true, gainRatio: BALANCE.autoClickGainRatio, surchargeRatio: BALANCE.autoClickSurchargeRatio });
    summary.gain += result.gain;
    if (result.overdrive) summary.overdrives += 1;
    summary.fragments += result.fragments ?? 0;
    summary.fragmentsStored += result.fragmentsStored ?? 0;
  }
  return summary;
}

export function tickPassive(state, deltaSeconds) {
  const passiveGain = ((state.passiveRate ?? 0) + (state.factoryRate ?? 0)) * deltaSeconds;
  addEnergy(state, passiveGain);
  const auto = tickAutoClicks(state, deltaSeconds);
  state.lastTickAt = Date.now();
  state.updatedAt = Date.now();
  return passiveGain + (auto?.gain ?? 0);
}

export function buyUpgrade(state, upgradeId) {
  return buyUpgradeAmount(state, upgradeId, 1);
}

export function buyUpgradeAmount(state, upgradeId, amount = 1) {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return { ok: false, reason: 'unknown_upgrade' };
  if (!isUpgradeUnlocked(state, upgrade)) return { ok: false, reason: 'locked' };

  // #6 — Guard : rejette les valeurs non finies, négatives ou trop grandes
  if (!Number.isFinite(amount) || amount < 1) return { ok: false, reason: 'invalid_amount' };
  const qty = Math.min(Math.floor(amount), BALANCE.maxBulkBuy);

  const level = state.upgrades[upgradeId] ?? 0;
  const cost = upgradeBulkCost(upgrade, level, qty);
  const currency = upgrade.currency ?? 'energy';

  // FIX #4 : raison distincte selon la currency pour ne pas confondre énergie et fragments
  if (getCurrency(state, currency) < cost) {
    const reason = currency === 'fragments' ? 'not_enough_fragments' : 'not_enough_energy';
    return { ok: false, reason, cost, amount: qty, currency };
  }

  spendCurrency(state, currency, cost);
  state.upgrades[upgradeId] = level + qty;
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
    if (milestone.reward?.energy) addEnergy(state, milestone.reward.energy);
    if (milestone.reward?.fragments) addFragments(state, milestone.reward.fragments);
    claimed.push(milestone);
  }
  if (claimed.length) state.updatedAt = Date.now();
  return claimed;
}

export function getVisibleMilestones(state) {
  return MILESTONES.filter(m => {
    if (m.hidden) return !!state.milestones[m.id]; // succès secret : invisible jusqu'à l'accomplissement
    return state.milestones[m.id] || m.test(state) || visibleSoon(state, m);
  });
}

function visibleSoon(state, milestone) {
  if (milestone.id === 'energy_100') return true;
  if (milestone.id === 'energy_1000') return state.totalEnergy >= 160;
  if (milestone.id === 'clicks_250') return state.totalClicks >= 25;
  if (milestone.id === 'passive_10') return state.passiveRate >= 2;
  if (milestone.id === 'shell_first_stack') return (state.upgrades?.coreIsolation ?? 0) >= 1;
  if (milestone.id === 'shell_first_break') return (state.coreShell?.storedFragments ?? 0) >= 1 || (state.coreShell?.lastBreakAt ?? 0) > 0;
  if (milestone.id === 'first_prestige') return state.totalEnergy >= prestigeRequirement(state) * 0.4 || state.prestige >= 1;
  if (milestone.id === 'prestige_3') return state.prestige >= 1;
  if (milestone.id === 'prestige_10') return state.prestige >= 6;
  if (milestone.id === 'prestige_25') return state.prestige >= 18;
  return false;
}

export function canPrestige(state) {
  return Number(state.energy ?? 0) >= prestigeRequirement(state);
}

export function prestigeRequirement(state) {
  const prestige = Math.max(0, Number(state.prestige ?? 0));
  if (prestige <= 10) return Math.floor(BALANCE.prestigeBase * Math.pow(BALANCE.prestigeEarlyScale, prestige));
  const p10 = BALANCE.prestigeBase * Math.pow(BALANCE.prestigeEarlyScale, 10);
  return Math.floor(p10 * Math.pow(BALANCE.prestigeLateScale, prestige - 10));
}

export function getPrestigePreview(state) {
  const nextPrestige = Math.max(0, Number(state?.prestige ?? 0)) + 1;
  const keptFragments = Math.max(0, Number(state?.fragments ?? 0));
  const keptTotalFragments = Math.max(keptFragments, Number(state?.totalFragments ?? keptFragments));
  const baseReward = Math.floor(
    4
    + nextPrestige * 1.6
    + Math.sqrt(Math.max(0, Number(state?.totalEnergy ?? 0))) / 2200
    + keptTotalFragments * 0.02,
  );
  const minimumReward = 5 + Math.floor(nextPrestige * 1.25);
  const fragmentReward = Math.max(minimumReward, Math.floor(baseReward * getFragmentGainMultiplier(state)));
  const starterEnergy = getPrestigeStarterEnergy(nextPrestige, fragmentReward);
  return { nextPrestige, fragmentReward, starterEnergy };
}

function getPrestigeStarterEnergy(nextPrestige, fragmentReward) {
  return Math.floor(60 + nextPrestige * 22 + fragmentReward * 14);
}

export function doPrestige(state) {
  if (!canPrestige(state)) return { ok: false, reason: 'not_ready' };
  const userId = state.userId;
  const keptFragments = Math.max(0, Number(state.fragments ?? 0));
  const keptTotalFragments = Math.max(keptFragments, Number(state.totalFragments ?? keptFragments));
  const keptMilestones = state.milestones;
  const keptTotalClicks = state.totalClicks;
  const keptLifetimeEnergy = Math.max(0, Number(state.lifetimeEnergy ?? state.totalEnergy ?? 0));
  const keptPersistentUpgrades = getPersistentUpgradeLevels(state);
  const keptLemegetonSkills = { ...(state.lemegetonSkills ?? {}) };
  const keptLemegetonToggles = { ...(state.lemegetonToggles ?? {}) };
  const keptBoostLevels = { ...(state.boostLevels ?? {}) };
  const next = createDefaultState(userId);
  next.prestige = state.prestige + 1;
  const preview = getPrestigePreview(state);
  const prestigeReward = preview.fragmentReward;
  const starterEnergy = preview.starterEnergy;
  next.fragments = keptFragments + prestigeReward;
  next.totalFragments = keptTotalFragments + prestigeReward;
  next.lifetimeEnergy = keptLifetimeEnergy;
  next.upgrades = { ...next.upgrades, ...keptPersistentUpgrades };
  next.lemegetonSkills = keptLemegetonSkills;
  next.lemegetonToggles = keptLemegetonToggles;
  next.boostLevels = keptBoostLevels;
  next.milestones = keptMilestones;
  next.totalClicks = keptTotalClicks;
  recalcDerivedStats(next);
  addEnergy(next, starterEnergy);
  return { ok: true, state: next, keptPersistentUpgrades, prestigeReward, starterEnergy };
}
