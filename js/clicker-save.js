import { createDefaultState, hydrateState } from './clicker-state.js';

const LS_PREFIX = 'nitro-clicker.save.';

export function localKey(userId) {
  return `${LS_PREFIX}${userId ?? 'guest'}`;
}

export function loadLocalSave(userId) {
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[Nitro Clicker] local save load failed:', error);
    return null;
  }
}

export function saveLocal(userId, state) {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('[Nitro Clicker] local save failed:', error);
    return false;
  }
}

export function loadSave(userId) {
  const local = loadLocalSave(userId);
  if (local) return hydrateState(local, userId);
  return createDefaultState(userId);
}

export function saveAll(userId, state) {
  return saveLocal(userId, state);
}

export function deleteLocalSave(userId) {
  localStorage.removeItem(localKey(userId));
}
