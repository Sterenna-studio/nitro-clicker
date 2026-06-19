import { flattenSoundCatalog, getSoundDefinition, SOUND_BANKS } from './sound-catalog.js';

const SETTINGS_KEY = 'nitro-clicker.sound.settings.v1';
const DEFAULT_SETTINGS = {
  enabled: true,
  masterVolume: 0.75,
  mutedSounds: {},
  volumes: {},
};

let audioCtx = null;
let settings = loadSettings();

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') ?? {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('nitro:sound-settings-changed', { detail: getSettings() }));
}

let master = null;       // bus -> compresseur -> sortie
let reverbNode = null;   // réverb (convolution)
let noiseBuffer = null;
const ladderState = {};  // index de gamme par son (clic mélodique qui monte)

// Renvoie la note de base courante pour un son à gamme (0 si non concerné).
// L'index monte à chaque appel et se remet à zéro après une pause.
function ladderNote(id, sound) {
  if (!Array.isArray(sound.scale) || !sound.scale.length) return 0;
  const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const st = ladderState[id] || { idx: 0, last: 0 };
  if (nowMs - st.last > Number(sound.scaleResetMs ?? 700)) st.idx = 0;
  const note = Number(sound.scale[st.idx % sound.scale.length]);
  st.idx += 1;
  st.last = nowMs;
  ladderState[id] = st;
  return note;
}

function ctx() {
  if (!settings.enabled) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Bus master : compresseur (glue + anti-clip) + retour de réverb, montés une fois.
function ensureBus(context) {
  if (master) return;
  const comp = context.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 28; comp.ratio.value = 2.5;
  comp.attack.value = 0.004; comp.release.value = 0.22;
  comp.connect(context.destination);

  master = context.createGain();
  master.gain.value = 1.15;       // makeup gain doux (évite la dureté)
  master.connect(comp);

  reverbNode = context.createConvolver();
  reverbNode.buffer = makeImpulse(context, 0.9, 3.4);   // réverb courte et douce (chaleur)
  const reverbReturn = context.createGain();
  reverbReturn.gain.value = 0.7;
  reverbNode.connect(reverbReturn);
  reverbReturn.connect(comp);
}

function makeImpulse(context, seconds, decay) {
  const rate = context.sampleRate;
  const len = Math.max(1, Math.floor(seconds * rate));
  const buf = context.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function getNoise(context) {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(context.sampleRate * 1.2);
  noiseBuffer = context.createBuffer(1, len, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// Joue une "voix" (un step) : oscillateur(s) OU bruit, filtre optionnel avec
// balayage, glissando de hauteur, enveloppe douce, panoramique, envoi réverb.
function playStep(context, step, volume, now, base = 0) {
  const start = now + Number(step.delay ?? 0);
  const dur = Number(step.dur ?? 0.1);
  const peak = Math.max(0.0002, volume * Number(step.gain ?? 0.04));
  const atk = Number(step.attack ?? 0.008);

  const env = context.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(peak, start + atk);
  env.gain.exponentialRampToValueAtTime(0.0001, start + atk + dur);

  // sortie : pan -> master (dry) + envoi réverb (wet)
  let tail = env;
  if (step.pan != null && context.createStereoPanner) {
    const pan = context.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, step.pan));
    env.connect(pan); tail = pan;
  }
  tail.connect(master);
  if (step.reverb) {
    const send = context.createGain();
    send.gain.value = Number(step.reverb);
    tail.connect(send); send.connect(reverbNode);
  }

  // entrée : filtre optionnel devant l'enveloppe
  let input = env;
  if (step.filter) {
    const f = context.createBiquadFilter();
    f.type = step.filter.type ?? 'lowpass';
    f.Q.value = Number(step.filter.q ?? 1);
    const f0 = Math.max(40, Number(step.filter.freq ?? 1200));
    f.frequency.setValueAtTime(f0, start);
    if (step.filter.freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, Number(step.filter.freqTo)), start + dur);
    f.connect(env); input = f;
  }

  if (step.type === 'noise') {
    const src = context.createBufferSource();
    src.buffer = getNoise(context);
    src.loop = true;
    src.connect(input);
    src.start(start); src.stop(start + dur + 0.05);
    return;
  }

  const voices = Math.max(1, Math.floor(step.voices ?? 1));
  // En mode gamme (base > 0), `mul` donne la fréquence en ratio de la note courante.
  const baseFreq = Math.max(20, base && step.mul != null ? base * Number(step.mul) : Number(step.freq ?? 440));
  const toFreq = base && step.mulTo != null ? base * Number(step.mulTo) : (step.freqTo != null ? Number(step.freqTo) : null);
  for (let v = 0; v < voices; v++) {
    const osc = context.createOscillator();
    osc.type = step.type ?? 'sine';
    osc.frequency.setValueAtTime(baseFreq, start);
    if (toFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, toFreq), start + dur);
    const spread = voices > 1 ? (v / (voices - 1) - 0.5) * 2 : 0;
    const rand = step.detune ? (Math.random() * 2 - 1) * Number(step.detune) : 0;
    osc.detune.setValueAtTime(spread * Number(step.spread ?? 14) + rand, start);
    osc.connect(input);
    osc.start(start); osc.stop(start + dur + 0.05);
  }
}

function playSound(id, options = {}) {
  if (!settings.enabled || settings.mutedSounds?.[id]) return false;
  const sound = getSoundDefinition(id);
  if (!sound) return false;

  if (sound.src) {
    playFile(sound, options);
    return true;
  }

  const context = ctx();
  if (!context) return false;
  ensureBus(context);
  const soundVolume = settings.volumes?.[id] ?? sound.volume ?? 1;
  const volume = clamp01((options.volume ?? 1) * settings.masterVolume * soundVolume);
  const now = context.currentTime;

  // Mode gamme : la note de base grimpe à chaque déclenchement (clic mélodique),
  // et se réinitialise après une pause → effet « jouissif » qui monte.
  const base = ladderNote(id, sound);

  for (const step of sound.synth ?? []) {
    try { playStep(context, step, volume, now, base); } catch { /* un step défaillant ne casse ni le son ni le jeu */ }
  }

  return true;
}

function playFile(sound, options = {}) {
  const audio = new Audio(sound.src);
  audio.volume = clamp01((options.volume ?? 1) * settings.masterVolume * (settings.volumes?.[sound.id] ?? sound.volume ?? 1));
  audio.play().catch(() => {});
}

function setEnabled(enabled) {
  settings.enabled = !!enabled;
  saveSettings();
}

function setMasterVolume(value) {
  settings.masterVolume = clamp01(Number(value));
  saveSettings();
}

function setSoundVolume(id, value) {
  settings.volumes = { ...(settings.volumes ?? {}), [id]: clamp01(Number(value)) };
  saveSettings();
}

function setSoundMuted(id, muted) {
  settings.mutedSounds = { ...(settings.mutedSounds ?? {}), [id]: !!muted };
  saveSettings();
}

function resetSound(id) {
  const { [id]: _v, ...volumes } = settings.volumes ?? {};
  const { [id]: _m, ...mutedSounds } = settings.mutedSounds ?? {};
  settings.volumes = volumes;
  settings.mutedSounds = mutedSounds;
  saveSettings();
}

function resetAll() {
  settings = { ...DEFAULT_SETTINGS };
  saveSettings();
}

function getSettings() {
  return JSON.parse(JSON.stringify(settings));
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

window.NitroSound = {
  banks: SOUND_BANKS,
  sounds: flattenSoundCatalog,
  play: playSound,
  get: getSoundDefinition,
  settings: getSettings,
  setEnabled,
  setMasterVolume,
  setSoundVolume,
  setSoundMuted,
  resetSound,
  resetAll,
};
