import { supabase } from '/shared/supabase-client.js';
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
  } catch (error) {
    console.warn('[Nitro Clicker] local save failed:', error);
  }
}

export async function loadCloudSave(userId) {
  try {
    const { data, error } = await supabase
      .from('nitro_clicker_saves')
      .select('save_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.save_data ?? null;
  } catch (error) {
    console.warn('[Nitro Clicker] cloud save unavailable:', error?.message ?? error);
    return null;
  }
}

export async function saveCloud(userId, state) {
  try {
    const { error } = await supabase
      .from('nitro_clicker_saves')
      .upsert({
        user_id: userId,
        save_data: state,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.warn('[Nitro Clicker] cloud save failed:', error?.message ?? error);
    return false;
  }
}

export async function loadSave(userId) {
  const cloud = await loadCloudSave(userId);
  if (cloud) return hydrateState(cloud, userId);

  const local = loadLocalSave(userId);
  if (local) return hydrateState(local, userId);

  return createDefaultState(userId);
}

export async function saveAll(userId, state) {
  saveLocal(userId, state);
  return await saveCloud(userId, state);
}
