// Simulation headless de la progression — audit de balance sans jeu manuel.
// Joue une stratégie "bot agressif" (achat le moins cher en premier, prestige dès
// que possible) et rapporte l'état du jeu à des paliers de prestige clés.
// Usage : node scripts/sim-progression.mjs
import {
  createDefaultState,
  recalcDerivedStats,
  tickPassive,
  clickCore,
  buyUpgradeAmount,
  upgradeBulkCost,
  UPGRADES,
  canPrestige,
  doPrestige,
  prestigeRequirement,
  isUpgradeUnlocked,
  LEMEGETON_SKILLS,
  buyLemegetonSkill,
  isLemegetonOnline,
  isLemegetonSkillUnlocked,
  isLemegetonSkillMaxed,
  lemegetonSkillCost,
  lemegetonSkillLevel,
  BOOSTS,
  buyBoostUpgrade,
  activateBoost,
  isBoostActive,
  tickBoosts,
  getBoostUpgradeCost,
  isBoostUpgradeMaxed,
  canFuseCore,
  doFuseCore,
  getCoreMultiplier,
  getCoreCloneCount,
  getCoreShellInfo,
} from '../js/clicker-state.js';

const CLICKS_PER_SEC = 4;
const DT = 1; // secondes simulées par tick
const MAX_TICKS = 3_000_000; // ~34 jours simulés, garde-fou anti boucle infinie
const TARGET_PRESTIGE = 50;
const REPORT_PRESTIGES = new Set([1, 3, 5, 10, 15, 20, 25, 30, 40, 50]);

let state = createDefaultState('sim');
recalcDerivedStats(state);

const reports = [];
let ticks = 0;

function buyUpgradesGreedy() {
  let progressed = true;
  while (progressed) {
    progressed = false;

    // Phase 1 : rush des systèmes jamais entamés (niveau 0) — un "moins cher
    // toujours" pur laisse mourir les upgrades à coût de base élevé (Isolation
    // du noyau, Multiplicateur de noyau…) au profit d'un spam sans fin des
    // upgrades bon marché qui compoundent lentement. On priorise l'ouverture
    // de nouveaux systèmes avant de remplir l'économie.
    let firstBuy = null;
    for (const u of UPGRADES) {
      if (!isUpgradeUnlocked(state, u)) continue;
      if ((state.upgrades[u.id] ?? 0) > 0) continue;
      const cost = upgradeBulkCost(u, 0, 1);
      const currency = u.currency ?? 'energy';
      const held = currency === 'fragments' ? state.fragments : state.energy;
      if (held < cost) continue;
      if (!firstBuy || cost < firstBuy.cost) firstBuy = { id: u.id, cost };
    }
    if (firstBuy) {
      const r = buyUpgradeAmount(state, firstBuy.id, 1);
      if (r.ok) { progressed = true; continue; }
    }

    // Phase 2 : sinon, le moins cher parmi les upgrades déjà entamés.
    let best = null;
    for (const u of UPGRADES) {
      if (!isUpgradeUnlocked(state, u)) continue;
      const level = state.upgrades[u.id] ?? 0;
      const cost = upgradeBulkCost(u, level, 1);
      const currency = u.currency ?? 'energy';
      const held = currency === 'fragments' ? state.fragments : state.energy;
      if (held < cost) continue;
      if (!best || cost < best.cost) best = { id: u.id, cost };
    }
    if (best) {
      const r = buyUpgradeAmount(state, best.id, 1);
      if (r.ok) progressed = true;
    }
  }
}

function buyLemegetonGreedy() {
  if (!isLemegetonOnline(state)) return;
  let bought = true;
  while (bought) {
    bought = false;
    let best = null;
    for (const skill of LEMEGETON_SKILLS) {
      if (!isLemegetonSkillUnlocked(state, skill)) continue;
      if (isLemegetonSkillMaxed(state, skill)) continue;
      const level = lemegetonSkillLevel(state, skill.id);
      const cost = lemegetonSkillCost(skill, level);
      if (state.fragments < cost) continue;
      if (!best || cost < best.cost) best = { id: skill.id, cost };
    }
    if (best) {
      const r = buyLemegetonSkill(state, best.id);
      if (r.ok) bought = true;
    }
  }
}

function buyBoostUpgradesGreedy() {
  if (!isLemegetonOnline(state)) return;
  let bought = true;
  while (bought) {
    bought = false;
    let best = null;
    for (const b of BOOSTS) {
      if (isBoostUpgradeMaxed(state, b.id)) continue;
      const cost = getBoostUpgradeCost(state, b.id);
      if (state.fragments < cost) continue;
      if (!best || cost < best.cost) best = { id: b.id, cost };
    }
    if (best) {
      const r = buyBoostUpgrade(state, best.id);
      if (r.ok) bought = true;
    }
  }
}

function maybeActivateBoost() {
  if (!isLemegetonOnline(state)) return;
  if (BOOSTS.some(b => isBoostActive(state, b.id))) return;
  for (const id of ['ionicSurge', 'crystalResonance', 'overtension']) {
    const boost = BOOSTS.find(b => b.id === id);
    if (state.fragments >= boost.activateCost) {
      activateBoost(state, id);
      return;
    }
  }
}

function maybeFuse() {
  if (canFuseCore(state)) doFuseCore(state);
}

function snapshot(label) {
  const shell = getCoreShellInfo(state);
  return {
    label,
    prestige: state.prestige,
    simDays: (ticks * DT / 86400).toFixed(2),
    totalEnergy: Math.round(state.totalEnergy),
    fragments: Math.round(state.fragments),
    totalFragments: Math.round(state.totalFragments),
    clickPower: Math.round(state.clickPower),
    passiveRate: Math.round(state.passiveRate),
    factoryRate: Math.round(state.factoryRate),
    coreIsolationLvl: state.upgrades.coreIsolation ?? 0,
    nitroFactoryLvl: state.upgrades.nitroFactory ?? 0,
    enginePlantLvl: state.upgrades.enginePlant ?? 0,
    orbitalHiveLvl: state.upgrades.orbitalHive ?? 0,
    coreMultiplier: Number(getCoreMultiplier(state).toFixed(2)),
    clones: getCoreCloneCount(state),
    coreTier: state.coreTier,
    lemegetonOnline: isLemegetonOnline(state),
    shellUnlocked: shell.unlocked,
    shellHardness: shell.hardness,
  };
}

const startedAt = Date.now();
while (ticks < MAX_TICKS && state.prestige < TARGET_PRESTIGE) {
  ticks++;

  for (let i = 0; i < CLICKS_PER_SEC * DT; i++) clickCore(state);
  if (state.passiveRate > 0 || state.factoryRate > 0 || state.autoClickRate > 0) tickPassive(state, DT);
  tickBoosts(state);

  buyUpgradesGreedy();
  buyLemegetonGreedy();
  buyBoostUpgradesGreedy();
  maybeActivateBoost();
  maybeFuse();

  if (canPrestige(state)) {
    const nextPrestige = state.prestige + 1;
    // Snapshot AVANT le reset : montre le pic accumulé de ce palier (upgrades,
    // coque…) — juste après le reset, tout non-persistant retombe à 0.
    if (REPORT_PRESTIGES.has(nextPrestige)) {
      reports.push(snapshot(`Avant Prestige ${nextPrestige}`));
    }
    const result = doPrestige(state);
    if (result.ok) state = result.state;
  }

  if (ticks % 200_000 === 0) {
    process.stderr.write(`… tick ${ticks.toLocaleString('fr-FR')} · prestige ${state.prestige} · ${(ticks * DT / 86400).toFixed(1)}j simulés\n`);
  }
}

const elapsedMs = Date.now() - startedAt;
console.log(`\n=== Simulation terminée en ${(elapsedMs / 1000).toFixed(1)}s réelles (${ticks.toLocaleString('fr-FR')} ticks, ${(ticks * DT / 86400).toFixed(1)} jours simulés) ===`);
if (state.prestige < TARGET_PRESTIGE) {
  console.log(`⚠ N'a pas atteint Prestige ${TARGET_PRESTIGE} (bloqué à Prestige ${state.prestige} après le budget de ticks).`);
}
console.table(reports);
