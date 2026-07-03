import { createDefaultState, hydrateState, VERSION } from './clicker-state.js';

const LS_PREFIX = 'nitro-clicker.save.';
const ACTIVE_SLOT_PREFIX = 'nitro-clicker.activeSlot.';
const MIGRATION_NOTICE_KEY = 'nitro-clicker.save.migration.notice';
const SAVE_ERROR_KEY = 'nitro-clicker.save.error';
const CURRENT_MIGRATION_ID = `save-v${VERSION}`;

export const SAVE_SLOTS = [1, 2, 3];
const DEFAULT_SLOT = 1;

// Clé historique (avant l'introduction des slots) — jamais supprimée, sert
// uniquement de source pour la migration one-shot vers le Slot 1.
function legacyLocalKey(userId) {
  return `${LS_PREFIX}${userId ?? 'guest'}`;
}

export function localKey(userId, slot = DEFAULT_SLOT) {
  return `${LS_PREFIX}${userId ?? 'guest'}.slot${slot}`;
}

export function getActiveSlot(userId) {
  try {
    const raw = Number(localStorage.getItem(`${ACTIVE_SLOT_PREFIX}${userId ?? 'guest'}`));
    return SAVE_SLOTS.includes(raw) ? raw : DEFAULT_SLOT;
  } catch {
    return DEFAULT_SLOT;
  }
}

export function setActiveSlot(userId, slot) {
  if (!SAVE_SLOTS.includes(slot)) return;
  try { localStorage.setItem(`${ACTIVE_SLOT_PREFIX}${userId ?? 'guest'}`, String(slot)); } catch {}
}

// Migration one-shot : si une save legacy (pré-slots) existe et qu'aucun slot
// n'a encore été écrit pour cet utilisateur, la copier vers le Slot 1. La clé
// legacy n'est jamais supprimée (filet de sécurité).
function migrateLegacyToSlots(userId) {
  const legacyRaw = localStorage.getItem(legacyLocalKey(userId));
  if (!legacyRaw) return;
  const anySlotExists = SAVE_SLOTS.some(slot => localStorage.getItem(localKey(userId, slot)) != null);
  if (anySlotExists) return;
  try {
    localStorage.setItem(localKey(userId, DEFAULT_SLOT), legacyRaw);
    setActiveSlot(userId, DEFAULT_SLOT);
  } catch (error) {
    console.warn('[Nitro Clicker] legacy-to-slot migration failed:', error);
  }
}

export function loadLocalSave(userId, slot = DEFAULT_SLOT) {
  try {
    const raw = localStorage.getItem(localKey(userId, slot));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[Nitro Clicker] local save load failed:', error);
    return null;
  }
}

// #3 — Notifie le joueur en cas d'échec de sauvegarde localStorage
// Couvre : QuotaExceededError, SecurityError, localStorage désactivé
export function saveLocal(userId, state, slot = DEFAULT_SLOT) {
  try {
    localStorage.setItem(localKey(userId, slot), JSON.stringify(state));
    // Efface toute erreur précédente si la sauvegarde réussit
    try { sessionStorage.removeItem(SAVE_ERROR_KEY); } catch {}
    return true;
  } catch (error) {
    console.warn('[Nitro Clicker] local save failed:', error);
    // Stocke l'erreur pour affichage toast côté UI
    try {
      sessionStorage.setItem(SAVE_ERROR_KEY, JSON.stringify({
        code: error?.name ?? 'UnknownError',
        message: error?.message ?? 'Erreur inconnue',
        at: Date.now(),
      }));
    } catch {}
    return false;
  }
}

// Lit et consomme l'erreur de sauvegarde (à appeler depuis l'UI pour afficher le toast)
export function readSaveError() {
  try {
    const raw = sessionStorage.getItem(SAVE_ERROR_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SAVE_ERROR_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Résumés des 3 slots pour l'UI de sélection (boot sequence + panneau Save).
export function getSlotSummaries(userId) {
  migrateLegacyToSlots(userId);
  return SAVE_SLOTS.map(slot => {
    const raw = loadLocalSave(userId, slot);
    if (!raw) return { slot, exists: false };
    return {
      slot,
      exists: true,
      prestige: Math.max(0, Number(raw.prestige ?? 0)),
      totalEnergy: Math.max(0, Number(raw.totalEnergy ?? raw.energy ?? 0)),
      updatedAt: Number(raw.updatedAt ?? 0),
    };
  });
}

// raw === undefined : lecture localStorage normale. raw === null explicite
// (passé par l'appelant) signale une save trouvée mais illisible (JSON
// corrompu) — distinction utilisée par la séquence de boot pour avertir le
// joueur au lieu de continuer en silence avec une save neuve.
export function loadSave(userId, slot = getActiveSlot(userId)) {
  migrateLegacyToSlots(userId);
  const rawText = (() => {
    try { return localStorage.getItem(localKey(userId, slot)); } catch { return null; }
  })();
  if (!rawText) return { state: createDefaultState(userId), corrupted: false };

  let local;
  try {
    local = JSON.parse(rawText);
  } catch (error) {
    console.warn('[Nitro Clicker] save JSON corrompu:', error);
    return { state: createDefaultState(userId), corrupted: true };
  }

  const { state, migrated, notice } = migrateLegacySave(local, userId);
  if (migrated) {
    saveLocal(userId, state, slot);
    queueMigrationNotice(notice);
  }
  return { state, corrupted: false };
}

export function migrateLegacySave(raw, userId = null) {
  const rawVersion = Number(raw?.version ?? 0);
  const migrated = !rawVersion || rawVersion < VERSION || raw?.migration?.lastApplied !== CURRENT_MIGRATION_ID;
  const state = hydrateState(raw, userId);

  state.version = VERSION;
  state.migration = {
    ...(raw?.migration ?? {}),
    legacyDetected: rawVersion < VERSION,
    originalVersion: raw?.migration?.originalVersion ?? rawVersion,
    lastApplied: CURRENT_MIGRATION_ID,
    lastAppliedAt: Date.now(),
  };

  if (!migrated) return { state, migrated: false, notice: null };

  const shouldCompensate = raw?.migration?.compensationId !== CURRENT_MIGRATION_ID;
  const compensation = shouldCompensate ? computeMigrationCompensation(raw, rawVersion) : null;

  if (compensation) {
    state.energy += compensation.energy;
    state.totalEnergy += compensation.energy;
    state.fragments += compensation.fragments;
    state.totalFragments += compensation.fragments;
    state.migration.compensationId = CURRENT_MIGRATION_ID;
    state.migration.compensation = compensation;
  }

  state.migration.adapted = true;
  state.updatedAt = Date.now();

  return {
    state,
    migrated: true,
    notice: {
      fromVersion: rawVersion || 'legacy',
      toVersion: VERSION,
      compensated: !!compensation,
      compensation,
    },
  };
}

function computeMigrationCompensation(raw, rawVersion) {
  const totalEnergy = Math.max(0, Number(raw?.totalEnergy ?? raw?.energy ?? 0));
  const prestige = Math.max(0, Number(raw?.prestige ?? 0));
  const totalClicks = Math.max(0, Number(raw?.totalClicks ?? 0));
  const totalFragments = Math.max(0, Number(raw?.totalFragments ?? raw?.fragments ?? 0));
  const upgradeLevels = Object.values(raw?.upgrades ?? {}).reduce((sum, value) => sum + Math.max(0, Number(value ?? 0)), 0);

  const activityScore =
    Math.log10(Math.max(10, totalEnergy)) * 0.9 +
    Math.log10(Math.max(10, totalClicks)) * 0.45 +
    prestige * 1.4 +
    upgradeLevels * 0.18 +
    totalFragments * 0.08;

  const legacyBoost = rawVersion ? Math.max(0, VERSION - rawVersion) : 3;
  const fragments = Math.max(2, Math.min(80, Math.floor(activityScore + legacyBoost)));
  const energy = Math.max(1000, Math.min(5_000_000, Math.floor(Math.max(1, totalEnergy) * 0.08 + fragments * 850)));

  return {
    reason: 'Legacy save adapted to current balance/shell systems',
    energy,
    fragments,
    activityScore: Number(activityScore.toFixed(2)),
  };
}

function queueMigrationNotice(notice) {
  if (!notice) return;
  try {
    sessionStorage.setItem(MIGRATION_NOTICE_KEY, JSON.stringify(notice));
  } catch {}
}

export function readMigrationNotice() {
  try {
    const raw = sessionStorage.getItem(MIGRATION_NOTICE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(MIGRATION_NOTICE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAll(userId, state, slot = getActiveSlot(userId)) {
  state.version = VERSION;
  return saveLocal(userId, state, slot);
}

export function deleteLocalSave(userId, slot = getActiveSlot(userId)) {
  localStorage.removeItem(localKey(userId, slot));
}
