// Nitro Clicker sound catalog
// Every gameplay sound should be declared here with a stable id, label and default synth pattern.
// Le moteur (sound-engine.js) supporte par step : type 'noise', filter {type,freq,freqTo,q},
// freqTo (glissando), voices/spread (unisson), attack, reverb (0..1), pan (-1..1).
// Un son peut aussi être remplacé par un fichier via `src: './assets/sfx/your-file.webm'`.

export const SOUND_BANKS = [
  {
    id: 'core',
    label: 'Noyau',
    sounds: [
      {
        id: 'core.click',
        label: 'Clic noyau',
        description: 'Clic électrique charnu : petit transitoire de bruit + corps filtré qui descend.',
        volume: 0.5,
        synth: [
          { type: 'noise', gain: 0.06, dur: 0.022, attack: 0.001, filter: { type: 'highpass', freq: 1600, q: 0.6 } },
          { freq: 560, freqTo: 300, type: 'triangle', gain: 0.075, dur: 0.06, attack: 0.002, filter: { type: 'lowpass', freq: 2800, freqTo: 900, q: 3 }, reverb: 0.05 },
        ],
      },
      {
        id: 'core.passivePulse',
        label: 'Pulse passif',
        description: 'Pulsation grave et spatiale, discrète, pour la production de fond.',
        volume: 0.22,
        synth: [
          { freq: 160, type: 'sine', gain: 0.03, dur: 0.16, attack: 0.02, reverb: 0.18 },
          { freq: 320, type: 'sine', gain: 0.018, dur: 0.18, delay: 0.03, reverb: 0.22, pan: 0.2 },
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
        description: 'Arpège juteux qui claque : tick de bruit + accord en unisson + réverb.',
        volume: 0.6,
        synth: [
          { type: 'noise', gain: 0.035, dur: 0.02, filter: { type: 'bandpass', freq: 2400, q: 1 } },
          { freq: 392, type: 'triangle', gain: 0.07, dur: 0.1, voices: 2, spread: 8, filter: { type: 'lowpass', freq: 3000, q: 1 }, reverb: 0.1 },
          { freq: 523, type: 'triangle', gain: 0.065, dur: 0.1, delay: 0.05, voices: 2, spread: 8, reverb: 0.1 },
          { freq: 784, type: 'sine', gain: 0.06, dur: 0.14, delay: 0.1, reverb: 0.16, pan: 0.15 },
        ],
      },
      {
        id: 'upgrade.levelUp',
        label: 'Montée de niveau',
        description: 'Effet plus large et brillant, avec balayage de filtre ascendant.',
        volume: 0.72,
        synth: [
          { type: 'noise', gain: 0.04, dur: 0.025, filter: { type: 'highpass', freq: 1200, q: 0.7 } },
          { freq: 523, type: 'sawtooth', gain: 0.05, dur: 0.12, voices: 3, spread: 10, filter: { type: 'lowpass', freq: 1600, freqTo: 4000, q: 2 }, reverb: 0.1 },
          { freq: 784, type: 'triangle', gain: 0.06, dur: 0.13, delay: 0.06, reverb: 0.12 },
          { freq: 1175, type: 'sine', gain: 0.05, dur: 0.2, delay: 0.13, reverb: 0.2, pan: 0.2 },
        ],
      },
      {
        id: 'upgrade.locked',
        label: 'Achat impossible',
        description: 'Petit « thunk » mat et grave, court, pas agressif.',
        volume: 0.4,
        synth: [
          { type: 'noise', gain: 0.03, dur: 0.05, filter: { type: 'lowpass', freq: 500, q: 1 } },
          { freq: 150, freqTo: 90, type: 'square', gain: 0.05, dur: 0.09, filter: { type: 'lowpass', freq: 700, q: 1 } },
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
        description: 'Explosion juteuse : boom sub + whoosh de bruit balayé + zap montant + traîne.',
        volume: 0.85,
        synth: [
          { freq: 120, freqTo: 45, type: 'sine', gain: 0.12, dur: 0.32, attack: 0.002, reverb: 0.12 },
          { type: 'noise', gain: 0.09, dur: 0.22, attack: 0.001, filter: { type: 'lowpass', freq: 6000, freqTo: 400, q: 1 }, reverb: 0.2 },
          { freq: 220, type: 'sawtooth', gain: 0.06, dur: 0.16, delay: 0.02, voices: 3, spread: 14, filter: { type: 'lowpass', freq: 1200, freqTo: 3500, q: 3 }, reverb: 0.12 },
          { freq: 1320, freqTo: 2640, type: 'square', gain: 0.05, dur: 0.18, delay: 0.06, filter: { type: 'bandpass', freq: 2000, q: 4 }, reverb: 0.18, pan: 0.1 },
          { freq: 1760, type: 'sine', gain: 0.04, dur: 0.3, delay: 0.14, reverb: 0.3, pan: -0.15 },
        ],
      },
      {
        id: 'prestige.activate',
        label: 'Prestige',
        description: 'Montée longue et grandiose : sweep ascendant + shimmer + longue réverb.',
        volume: 0.78,
        synth: [
          { freq: 90, freqTo: 180, type: 'sine', gain: 0.07, dur: 0.4, reverb: 0.18 },
          { freq: 262, freqTo: 1047, type: 'sawtooth', gain: 0.04, dur: 0.5, voices: 3, spread: 12, filter: { type: 'lowpass', freq: 600, freqTo: 5000, q: 2 }, reverb: 0.25 },
          { freq: 784, type: 'triangle', gain: 0.05, dur: 0.16, delay: 0.28, reverb: 0.2 },
          { freq: 1568, type: 'sine', gain: 0.045, dur: 0.4, delay: 0.36, reverb: 0.4, pan: 0.2 },
        ],
      },
      {
        id: 'milestone.claim',
        label: 'Milestone',
        description: 'Cloche brillante et satisfaisante, validation claire d’un palier.',
        volume: 0.66,
        synth: [
          { freq: 880, type: 'sine', gain: 0.06, dur: 0.16, attack: 0.002, reverb: 0.25 },
          { freq: 1318, type: 'sine', gain: 0.05, dur: 0.2, delay: 0.07, reverb: 0.3, pan: 0.15 },
          { freq: 1760, type: 'triangle', gain: 0.035, dur: 0.26, delay: 0.13, reverb: 0.35, pan: -0.15 },
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
        description: 'Ping cristallin résonant quand un fragment est stocké dans la sphère.',
        volume: 0.6,
        synth: [
          { freq: 1480, type: 'sine', gain: 0.05, dur: 0.14, attack: 0.001, filter: { type: 'bandpass', freq: 1480, q: 6 }, reverb: 0.3 },
          { freq: 2960, type: 'triangle', gain: 0.022, dur: 0.2, delay: 0.03, reverb: 0.4, pan: 0.25 },
        ],
      },
      {
        id: 'shell.crack',
        label: 'Fissure coque',
        description: 'Craquement : éclat de bruit filtré qui descend + thunk grave.',
        volume: 0.7,
        synth: [
          { type: 'noise', gain: 0.08, dur: 0.06, attack: 0.001, filter: { type: 'bandpass', freq: 2200, freqTo: 600, q: 3 }, reverb: 0.12 },
          { freq: 200, freqTo: 120, type: 'sawtooth', gain: 0.05, dur: 0.1, delay: 0.02, filter: { type: 'lowpass', freq: 900, q: 1.5 } },
          { freq: 520, type: 'square', gain: 0.03, dur: 0.05, delay: 0.05, filter: { type: 'highpass', freq: 400, q: 1 } },
        ],
      },
      {
        id: 'shell.shatter',
        label: 'Sphère brisée',
        description: 'Impact majeur juteux : boom + burst de bruit balayé + débris de verre + traîne.',
        volume: 0.88,
        synth: [
          { freq: 140, freqTo: 50, type: 'sine', gain: 0.11, dur: 0.3, attack: 0.001, reverb: 0.12 },
          { type: 'noise', gain: 0.11, dur: 0.28, attack: 0.001, filter: { type: 'lowpass', freq: 7000, freqTo: 300, q: 0.8 }, reverb: 0.25 },
          { type: 'noise', gain: 0.05, dur: 0.18, delay: 0.04, filter: { type: 'highpass', freq: 3000, q: 0.7 }, reverb: 0.3, pan: 0.2 },
          { freq: 1760, type: 'triangle', gain: 0.04, dur: 0.3, delay: 0.1, reverb: 0.4, pan: -0.2 },
          { freq: 880, type: 'sine', gain: 0.04, dur: 0.36, delay: 0.18, reverb: 0.4 },
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
        description: 'Zap électrique court et net : bruit bandpass balayé + saw désaccordé.',
        volume: 0.38,
        synth: [
          { type: 'noise', gain: 0.04, dur: 0.03, filter: { type: 'bandpass', freq: 3000, freqTo: 1200, q: 4 } },
          { freq: 1100, freqTo: 1800, type: 'sawtooth', gain: 0.03, dur: 0.05, detune: 60, filter: { type: 'highpass', freq: 800, q: 1 }, pan: 0.1 },
        ],
      },
      {
        id: 'ui.objective',
        label: 'Nouvel objectif',
        description: 'Deux notes douces et spatiales quand l’objectif change.',
        volume: 0.5,
        synth: [
          { freq: 660, type: 'triangle', gain: 0.04, dur: 0.12, attack: 0.01, reverb: 0.2 },
          { freq: 990, type: 'sine', gain: 0.035, dur: 0.18, delay: 0.08, reverb: 0.28, pan: 0.2 },
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
