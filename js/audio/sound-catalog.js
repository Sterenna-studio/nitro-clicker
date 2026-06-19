// Nitro Clicker sound catalog — design MÉLODIEUX & jouissif.
// Tout est en Do majeur / pentatonique (jamais de fausse note), timbres chauds
// (triangle + sine, attaque douce, réverb légère). Le clic MONTE la gamme.
//
// Moteur (sound-engine.js) par step :
//   freq | mul (× note de gamme si `scale` défini) ; freqTo | mulTo (glissando)
//   type 'sine'|'triangle'|'square'|'sawtooth'|'noise', gain, dur, delay, attack,
//   reverb (0..1), pan (-1..1), voices/spread (unisson), filter {type,freq,freqTo,q}.
// `scale`: gamme de notes de base qui grimpe à chaque déclenchement ; `scaleResetMs`.

export const SOUND_BANKS = [
  {
    id: 'core',
    label: 'Noyau',
    sounds: [
      {
        id: 'core.click',
        label: 'Clic noyau',
        description: 'Pluck chaud qui MONTE la gamme pentatonique à chaque clic, puis se réinitialise après une pause. Effet jouissif.',
        volume: 0.5,
        scale: [329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51],
        scaleResetMs: 650,
        synth: [
          { mul: 1, type: 'triangle', gain: 0.08, dur: 0.2, attack: 0.004, reverb: 0.14 },
          { mul: 2, type: 'sine', gain: 0.03, dur: 0.16, attack: 0.004, reverb: 0.12 },
        ],
      },
      {
        id: 'core.passivePulse',
        label: 'Pulse passif',
        description: 'Note grave très douce et chaude pour la production de fond.',
        volume: 0.18,
        synth: [
          { freq: 130.81, type: 'sine', gain: 0.025, dur: 0.2, attack: 0.03, reverb: 0.24 },
          { freq: 196.0, type: 'sine', gain: 0.015, dur: 0.22, delay: 0.04, reverb: 0.28, pan: 0.2 },
        ],
      },
    ],
  },
  {
    id: 'economy',
    label: 'Achats & upgrades',
    sounds: [
      {
        id: 'upgrade.buy',
        label: 'Achat upgrade',
        description: 'Arpège ascendant qui résout sur un accord — chaud et satisfaisant.',
        volume: 0.5,
        synth: [
          { freq: 392.0, type: 'triangle', gain: 0.06, dur: 0.16, attack: 0.005, reverb: 0.16 },
          { freq: 523.25, type: 'triangle', gain: 0.055, dur: 0.16, delay: 0.06, reverb: 0.16 },
          { freq: 659.25, type: 'sine', gain: 0.05, dur: 0.24, delay: 0.12, reverb: 0.2 },
          { freq: 783.99, type: 'sine', gain: 0.035, dur: 0.28, delay: 0.12, reverb: 0.22, pan: 0.15 },
        ],
      },
      {
        id: 'upgrade.levelUp',
        label: 'Montée de niveau',
        description: 'Accord majeur brillant, plus large — palier franchi.',
        volume: 0.6,
        synth: [
          { freq: 523.25, type: 'triangle', gain: 0.05, dur: 0.18, attack: 0.004, reverb: 0.18 },
          { freq: 659.25, type: 'triangle', gain: 0.05, dur: 0.2, delay: 0.05, reverb: 0.18 },
          { freq: 783.99, type: 'sine', gain: 0.05, dur: 0.26, delay: 0.1, reverb: 0.22 },
          { freq: 1046.5, type: 'sine', gain: 0.04, dur: 0.32, delay: 0.16, reverb: 0.26, pan: 0.15 },
        ],
      },
      {
        id: 'upgrade.locked',
        label: 'Achat impossible',
        description: 'Deux notes graves douces et descendantes — « non » sans agresser.',
        volume: 0.32,
        synth: [
          { freq: 196.0, type: 'triangle', gain: 0.04, dur: 0.12, attack: 0.01, filter: { type: 'lowpass', freq: 1200, q: 0.7 } },
          { freq: 185.0, type: 'sine', gain: 0.025, dur: 0.14, delay: 0.07 },
        ],
      },
    ],
  },
  {
    id: 'power',
    label: 'Overdrive & prestige',
    sounds: [
      {
        id: 'overdrive.trigger',
        label: 'Overdrive',
        description: 'Accord de Do majeur qui s’épanouit (sub + tierce + quinte + octave) — triomphal et chaud.',
        volume: 0.68,
        synth: [
          { freq: 130.81, type: 'triangle', gain: 0.06, dur: 0.5, attack: 0.01, reverb: 0.2 },
          { freq: 261.63, type: 'triangle', gain: 0.05, dur: 0.45, delay: 0.02, reverb: 0.2 },
          { freq: 329.63, type: 'sine', gain: 0.05, dur: 0.45, delay: 0.04, reverb: 0.22 },
          { freq: 392.0, type: 'sine', gain: 0.05, dur: 0.5, delay: 0.06, reverb: 0.24 },
          { freq: 523.25, type: 'sine', gain: 0.045, dur: 0.6, delay: 0.1, reverb: 0.3, pan: 0.15 },
        ],
      },
      {
        id: 'prestige.activate',
        label: 'Prestige',
        description: 'Montée pentatonique grandiose qui résout sur un accord — long et planant.',
        volume: 0.66,
        synth: [
          { freq: 261.63, type: 'triangle', gain: 0.045, dur: 0.12, reverb: 0.16 },
          { freq: 329.63, type: 'triangle', gain: 0.045, dur: 0.12, delay: 0.08, reverb: 0.16 },
          { freq: 392.0, type: 'triangle', gain: 0.045, dur: 0.12, delay: 0.16, reverb: 0.16 },
          { freq: 523.25, type: 'triangle', gain: 0.045, dur: 0.12, delay: 0.24, reverb: 0.18 },
          { freq: 659.25, type: 'sine', gain: 0.045, dur: 0.14, delay: 0.32, reverb: 0.2 },
          { freq: 523.25, type: 'sine', gain: 0.04, dur: 0.55, delay: 0.42, reverb: 0.32 },
          { freq: 659.25, type: 'sine', gain: 0.04, dur: 0.55, delay: 0.42, reverb: 0.32 },
          { freq: 783.99, type: 'sine', gain: 0.04, dur: 0.6, delay: 0.42, reverb: 0.36, pan: 0.2 },
        ],
      },
      {
        id: 'milestone.claim',
        label: 'Milestone',
        description: 'Petit « ta-da » de deux notes (quinte) — validation lumineuse.',
        volume: 0.58,
        synth: [
          { freq: 659.25, type: 'sine', gain: 0.055, dur: 0.2, attack: 0.004, reverb: 0.25 },
          { freq: 987.77, type: 'sine', gain: 0.05, dur: 0.3, delay: 0.1, reverb: 0.34, pan: 0.15 },
        ],
      },
    ],
  },
  {
    id: 'shell',
    label: 'Coque & fragments',
    sounds: [
      {
        id: 'shell.store',
        label: 'Fragment confiné',
        description: 'Ping cristallin haut et résonant.',
        volume: 0.48,
        synth: [
          { freq: 1318.51, type: 'sine', gain: 0.04, dur: 0.2, attack: 0.002, reverb: 0.34 },
          { freq: 1975.53, type: 'sine', gain: 0.022, dur: 0.28, delay: 0.04, reverb: 0.4, pan: 0.2 },
        ],
      },
      {
        id: 'shell.crack',
        label: 'Fissure coque',
        description: 'Deux notes graves feutrées — tension musicale, pas de bruit.',
        volume: 0.5,
        synth: [
          { freq: 174.61, type: 'triangle', gain: 0.045, dur: 0.12, attack: 0.005, filter: { type: 'lowpass', freq: 1400, q: 1 } },
          { freq: 155.56, type: 'sine', gain: 0.03, dur: 0.14, delay: 0.06 },
        ],
      },
      {
        id: 'shell.shatter',
        label: 'Sphère brisée',
        description: 'Accord descendant qui se pose sur la fondamentale + shimmer — libération satisfaisante.',
        volume: 0.7,
        synth: [
          { freq: 523.25, type: 'sine', gain: 0.05, dur: 0.3, reverb: 0.24 },
          { freq: 392.0, type: 'sine', gain: 0.05, dur: 0.34, delay: 0.04, reverb: 0.26 },
          { freq: 261.63, type: 'triangle', gain: 0.055, dur: 0.45, delay: 0.08, reverb: 0.28 },
          { freq: 130.81, type: 'triangle', gain: 0.05, dur: 0.5, delay: 0.1, reverb: 0.2 },
          { freq: 1046.5, type: 'sine', gain: 0.03, dur: 0.4, delay: 0.06, reverb: 0.36, pan: 0.2 },
        ],
      },
    ],
  },
  {
    id: 'ui',
    label: 'Interface',
    sounds: [
      {
        id: 'ui.zap',
        label: 'Arc électrique UI',
        description: 'Petit blip sinus très léger (fréquent → discret).',
        volume: 0.25,
        synth: [
          { freq: 880.0, type: 'sine', gain: 0.025, dur: 0.05, attack: 0.003, reverb: 0.1 },
        ],
      },
      {
        id: 'ui.objective',
        label: 'Nouvel objectif',
        description: 'Deux notes douces et montantes quand l’objectif change.',
        volume: 0.45,
        synth: [
          { freq: 587.33, type: 'triangle', gain: 0.04, dur: 0.14, attack: 0.008, reverb: 0.2 },
          { freq: 880.0, type: 'sine', gain: 0.035, dur: 0.2, delay: 0.08, reverb: 0.28, pan: 0.15 },
        ],
      },
    ],
  },
];

export function flattenSoundCatalog() {
  return SOUND_BANKS.flatMap(bank => bank.sounds.map(sound => ({ ...sound, bankId: bank.id, bankLabel: bank.label })));
}

export function getSoundDefinition(id) {
  return flattenSoundCatalog().find(sound => sound.id === id) ?? null;
}
