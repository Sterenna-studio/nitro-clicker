// Nitro Clicker sound catalog - direction cyber, organique, un peu alien.
// Palette 100% WebAudio: impulsions metalliques, membranes vivantes, bruit filtre,
// detune leger et intervalles non trop sages pour garder un noyau etrange.
//
// Moteur (sound-engine.js) par step :
//   freq | mul (x note de gamme si `scale` defini) ; freqTo | mulTo (glissando)
//   type 'sine'|'triangle'|'square'|'sawtooth'|'noise', gain, dur, delay, attack,
//   reverb (0..1), pan (-1..1), voices/spread/detune, filter {type,freq,freqTo,q}.
// `scale`: note de base qui grimpe a chaque declenchement ; `scaleResetMs`.

export const SOUND_BANKS = [
  {
    id: 'core',
    label: 'Noyau',
    sounds: [
      {
        id: 'core.click',
        label: 'Clic noyau',
        description: 'Impact court: bio-plop humide, clic cyber metallique et harmonique alien qui monte par touches.',
        volume: 0.46,
        scale: [246.94, 277.18, 329.63, 369.99, 415.30, 493.88, 554.37, 659.25, 739.99],
        scaleResetMs: 560,
        synth: [
          { type: 'noise', gain: 0.018, dur: 0.045, attack: 0.002, filter: { type: 'bandpass', freq: 1800, freqTo: 3600, q: 5.5 }, pan: -0.08 },
          { mul: 0.5, type: 'sine', gain: 0.034, dur: 0.075, attack: 0.004, filter: { type: 'lowpass', freq: 520, q: 0.8 } },
          { mul: 1, mulTo: 1.045, type: 'square', gain: 0.032, dur: 0.09, attack: 0.002, filter: { type: 'bandpass', freq: 1250, freqTo: 2100, q: 4.2 }, reverb: 0.08 },
          { mul: 1.498, type: 'triangle', gain: 0.018, dur: 0.14, delay: 0.012, attack: 0.005, reverb: 0.18, pan: 0.14 },
        ],
      },
      {
        id: 'core.passivePulse',
        label: 'Pulse passif',
        description: 'Battement organique bas, comme une pompe biologique branchee sur un bus cyber.',
        volume: 0.2,
        synth: [
          { freq: 54, freqTo: 49, type: 'sine', gain: 0.042, dur: 0.26, attack: 0.035, filter: { type: 'lowpass', freq: 360, q: 0.7 }, reverb: 0.12 },
          { freq: 108, type: 'triangle', voices: 2, spread: 9, detune: 3, gain: 0.018, dur: 0.3, delay: 0.04, attack: 0.025, filter: { type: 'lowpass', freq: 620, freqTo: 360, q: 1.2 }, reverb: 0.22, pan: -0.12 },
          { type: 'noise', gain: 0.008, dur: 0.2, delay: 0.02, attack: 0.04, filter: { type: 'lowpass', freq: 280, q: 0.9 }, pan: 0.18 },
        ],
      },
      {
        id: 'core.subCorePulse',
        label: 'Pulse sub-core',
        description: 'Echo satellite: membranes synchronisees autour du noyau, avec une reponse alien legere.',
        volume: 0.26,
        synth: [
          { freq: 73.42, freqTo: 82.41, type: 'sine', gain: 0.03, dur: 0.28, attack: 0.025, filter: { type: 'lowpass', freq: 420, q: 0.9 }, reverb: 0.2 },
          { freq: 440, freqTo: 392, type: 'triangle', gain: 0.015, dur: 0.22, delay: 0.055, attack: 0.012, filter: { type: 'bandpass', freq: 1500, q: 7 }, reverb: 0.34, pan: 0.28 },
          { type: 'noise', gain: 0.007, dur: 0.11, delay: 0.09, attack: 0.01, filter: { type: 'highpass', freq: 2400, q: 1.1 }, pan: -0.28 },
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
        description: 'Verrouillage de module: servo cyber, petite chair electrique et accord court.',
        volume: 0.42,
        synth: [
          { type: 'noise', gain: 0.016, dur: 0.055, attack: 0.002, filter: { type: 'highpass', freq: 1900, q: 1.5 }, pan: -0.16 },
          { freq: 246.94, freqTo: 329.63, type: 'square', gain: 0.032, dur: 0.11, attack: 0.004, filter: { type: 'bandpass', freq: 930, freqTo: 1700, q: 4.5 }, reverb: 0.1 },
          { freq: 369.99, type: 'triangle', gain: 0.028, dur: 0.12, delay: 0.055, attack: 0.004, reverb: 0.16 },
          { freq: 554.37, type: 'sine', gain: 0.018, dur: 0.17, delay: 0.11, attack: 0.006, reverb: 0.24, pan: 0.2 },
        ],
      },
      {
        id: 'upgrade.levelUp',
        label: 'Montée de niveau',
        description: 'Module qui s’ouvre: scan montant, membrane qui repond, shimmer alien.',
        volume: 0.55,
        synth: [
          { freq: 110, freqTo: 82.41, type: 'sine', gain: 0.045, dur: 0.28, attack: 0.01, filter: { type: 'lowpass', freq: 480, q: 0.8 }, reverb: 0.12 },
          { freq: 277.18, freqTo: 554.37, type: 'sawtooth', gain: 0.035, dur: 0.24, delay: 0.04, attack: 0.006, filter: { type: 'bandpass', freq: 720, freqTo: 2100, q: 3.8 }, reverb: 0.18 },
          { freq: 415.30, type: 'triangle', voices: 3, spread: 18, detune: 4, gain: 0.028, dur: 0.3, delay: 0.12, attack: 0.012, reverb: 0.28, pan: -0.12 },
          { freq: 1244.51, type: 'sine', gain: 0.016, dur: 0.36, delay: 0.18, attack: 0.004, reverb: 0.42, pan: 0.22 },
        ],
      },
      {
        id: 'upgrade.locked',
        label: 'Achat impossible',
        description: 'Refus organique: valve qui bloque, ton cyber descendant, sans agresser.',
        volume: 0.3,
        synth: [
          { type: 'noise', gain: 0.012, dur: 0.07, attack: 0.003, filter: { type: 'bandpass', freq: 360, q: 2 } },
          { freq: 164.81, freqTo: 123.47, type: 'triangle', gain: 0.042, dur: 0.16, attack: 0.01, filter: { type: 'lowpass', freq: 780, q: 1.1 } },
          { freq: 92.50, type: 'sine', gain: 0.02, dur: 0.16, delay: 0.08, attack: 0.012, reverb: 0.08 },
        ],
      },
    ],
  },
  {
    id: 'modules',
    label: 'Modules noyau',
    sounds: [
      {
        id: 'module.amplifier',
        label: 'Module AMP',
        description: 'Amplification nette: ping cyber lumineux, harmonique humide et queue alien.',
        volume: 0.32,
        synth: [
          { freq: 329.63, freqTo: 493.88, type: 'square', gain: 0.024, dur: 0.095, attack: 0.003, filter: { type: 'bandpass', freq: 1500, freqTo: 2700, q: 5 }, reverb: 0.12 },
          { freq: 740, type: 'sine', gain: 0.016, dur: 0.18, delay: 0.055, attack: 0.006, reverb: 0.3, pan: 0.22 },
        ],
      },
      {
        id: 'module.automation',
        label: 'Module AUTO',
        description: 'Automation vivante: double servo discret et souffle basse frequence.',
        volume: 0.3,
        synth: [
          { type: 'noise', gain: 0.01, dur: 0.04, attack: 0.002, filter: { type: 'bandpass', freq: 900, q: 4 }, pan: -0.2 },
          { freq: 196, type: 'triangle', gain: 0.022, dur: 0.09, attack: 0.004, filter: { type: 'lowpass', freq: 820, q: 1.4 } },
          { freq: 246.94, type: 'triangle', gain: 0.018, dur: 0.1, delay: 0.07, attack: 0.004, filter: { type: 'lowpass', freq: 980, q: 1.2 }, pan: 0.18 },
        ],
      },
      {
        id: 'module.overdrive',
        label: 'Module OVR',
        description: 'Overdrive contenu: growl court, scan acide et instabilite alien.',
        volume: 0.34,
        synth: [
          { freq: 82.41, freqTo: 61.74, type: 'sawtooth', gain: 0.035, dur: 0.16, attack: 0.005, filter: { type: 'lowpass', freq: 720, freqTo: 360, q: 1.6 }, reverb: 0.1 },
          { freq: 554.37, freqTo: 830.61, type: 'square', gain: 0.02, dur: 0.13, delay: 0.035, attack: 0.003, filter: { type: 'bandpass', freq: 2100, q: 6 }, reverb: 0.2, pan: -0.16 },
          { type: 'noise', gain: 0.008, dur: 0.1, delay: 0.06, filter: { type: 'highpass', freq: 2800, q: 1.3 }, pan: 0.18 },
        ],
      },
      {
        id: 'module.shell',
        label: 'Module SHELL',
        description: 'Coque qui se scelle: membrane, clic ceramique et basse contenue.',
        volume: 0.31,
        synth: [
          { freq: 98, type: 'sine', gain: 0.03, dur: 0.18, attack: 0.02, filter: { type: 'lowpass', freq: 420, q: 0.8 } },
          { freq: 622.25, freqTo: 466.16, type: 'triangle', gain: 0.018, dur: 0.14, delay: 0.04, attack: 0.006, filter: { type: 'bandpass', freq: 1200, q: 5 }, reverb: 0.26, pan: 0.16 },
        ],
      },
      {
        id: 'module.coreNetwork',
        label: 'Module COREx',
        description: 'Handshake reseau: antenne de noyau, pulse orbital et reponse distante.',
        volume: 0.33,
        synth: [
          { freq: 130.81, freqTo: 196, type: 'sine', gain: 0.026, dur: 0.22, attack: 0.018, filter: { type: 'lowpass', freq: 560, q: 0.9 }, reverb: 0.16 },
          { freq: 987.77, type: 'triangle', gain: 0.015, dur: 0.2, delay: 0.07, attack: 0.005, filter: { type: 'bandpass', freq: 2500, q: 7 }, reverb: 0.38, pan: -0.24 },
          { freq: 1174.66, type: 'sine', gain: 0.011, dur: 0.26, delay: 0.14, attack: 0.006, reverb: 0.45, pan: 0.24 },
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
        description: 'Rupture cyber-organique: sub drop, blast filtre et cri harmonique alien.',
        volume: 0.66,
        synth: [
          { type: 'noise', gain: 0.05, dur: 0.18, attack: 0.004, filter: { type: 'bandpass', freq: 1400, freqTo: 4200, q: 2.5 }, reverb: 0.18 },
          { freq: 98, freqTo: 49, type: 'sawtooth', gain: 0.065, dur: 0.45, attack: 0.008, filter: { type: 'lowpass', freq: 780, freqTo: 260, q: 1.4 }, reverb: 0.12 },
          { freq: 196, freqTo: 415.30, type: 'square', voices: 2, spread: 16, detune: 6, gain: 0.04, dur: 0.36, delay: 0.05, attack: 0.006, filter: { type: 'bandpass', freq: 900, freqTo: 2400, q: 4 }, reverb: 0.24 },
          { freq: 1108.73, type: 'sine', gain: 0.026, dur: 0.58, delay: 0.16, attack: 0.012, reverb: 0.48, pan: 0.28 },
        ],
      },
      {
        id: 'prestige.activate',
        label: 'Prestige',
        description: 'Ascension de noyau: evacuation basse, sequence cyber et halo alien long.',
        volume: 0.64,
        synth: [
          { freq: 49, freqTo: 73.42, type: 'sine', gain: 0.055, dur: 0.7, attack: 0.06, filter: { type: 'lowpass', freq: 360, q: 0.8 }, reverb: 0.2 },
          { freq: 146.83, freqTo: 220, type: 'triangle', gain: 0.035, dur: 0.16, delay: 0.08, attack: 0.01, reverb: 0.16 },
          { freq: 220, freqTo: 329.63, type: 'triangle', gain: 0.034, dur: 0.16, delay: 0.2, attack: 0.01, reverb: 0.18 },
          { freq: 329.63, freqTo: 493.88, type: 'square', gain: 0.03, dur: 0.2, delay: 0.32, attack: 0.008, filter: { type: 'bandpass', freq: 1100, freqTo: 2400, q: 4.6 }, reverb: 0.24 },
          { freq: 739.99, type: 'sine', voices: 3, spread: 22, detune: 8, gain: 0.026, dur: 0.8, delay: 0.48, attack: 0.05, reverb: 0.55, pan: 0.18 },
          { type: 'noise', gain: 0.014, dur: 0.55, delay: 0.42, attack: 0.08, filter: { type: 'highpass', freq: 2600, q: 0.9 }, reverb: 0.4, pan: -0.18 },
        ],
      },
      {
        id: 'milestone.claim',
        label: 'Milestone',
        description: 'Validation courte: ping alien propre, scan lumineux et souffle discret.',
        volume: 0.48,
        synth: [
          { freq: 659.25, type: 'triangle', gain: 0.03, dur: 0.12, attack: 0.004, filter: { type: 'bandpass', freq: 1800, q: 4 }, reverb: 0.2 },
          { freq: 987.77, type: 'sine', gain: 0.024, dur: 0.24, delay: 0.08, attack: 0.006, reverb: 0.4, pan: 0.22 },
          { type: 'noise', gain: 0.007, dur: 0.08, delay: 0.02, filter: { type: 'highpass', freq: 4200, q: 1 } },
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
        label: 'Fragment confine',
        description: 'Capture cristalline humide: le fragment colle a la membrane puis resonne.',
        volume: 0.43,
        synth: [
          { type: 'noise', gain: 0.012, dur: 0.055, attack: 0.002, filter: { type: 'bandpass', freq: 3200, q: 4 }, pan: -0.1 },
          { freq: 1479.98, freqTo: 1174.66, type: 'sine', gain: 0.028, dur: 0.22, attack: 0.003, reverb: 0.34, pan: 0.16 },
          { freq: 185, type: 'triangle', gain: 0.018, dur: 0.18, delay: 0.04, attack: 0.018, filter: { type: 'lowpass', freq: 620, q: 1.1 } },
        ],
      },
      {
        id: 'shell.crack',
        label: 'Fissure coque',
        description: 'Membrane qui cede: frottement organique, craquement filtre, grave qui tombe.',
        volume: 0.48,
        synth: [
          { type: 'noise', gain: 0.032, dur: 0.13, attack: 0.004, filter: { type: 'bandpass', freq: 620, freqTo: 1900, q: 3.2 }, reverb: 0.12 },
          { freq: 174.61, freqTo: 87.31, type: 'sawtooth', gain: 0.034, dur: 0.2, delay: 0.02, attack: 0.008, filter: { type: 'lowpass', freq: 700, freqTo: 260, q: 1.6 } },
          { freq: 740, type: 'triangle', gain: 0.014, dur: 0.16, delay: 0.08, attack: 0.004, filter: { type: 'bandpass', freq: 2100, q: 6 }, reverb: 0.26, pan: 0.2 },
        ],
      },
      {
        id: 'shell.shatter',
        label: 'Sphere brisee',
        description: 'Explosion de coque: choc bas, debris cyber et halo alien qui relache les fragments.',
        volume: 0.68,
        synth: [
          { type: 'noise', gain: 0.052, dur: 0.22, attack: 0.002, filter: { type: 'bandpass', freq: 900, freqTo: 3600, q: 2.1 }, reverb: 0.22 },
          { freq: 110, freqTo: 55, type: 'sawtooth', gain: 0.062, dur: 0.42, attack: 0.006, filter: { type: 'lowpass', freq: 820, freqTo: 280, q: 1.2 } },
          { freq: 523.25, freqTo: 392, type: 'triangle', gain: 0.034, dur: 0.32, delay: 0.08, attack: 0.006, reverb: 0.3, pan: -0.18 },
          { freq: 1318.51, type: 'sine', gain: 0.022, dur: 0.52, delay: 0.14, attack: 0.012, reverb: 0.52, pan: 0.22 },
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
        label: 'Arc electrique UI',
        description: 'Micro-zap cyber, fin et respirable pour les interactions frequentes.',
        volume: 0.22,
        synth: [
          { freq: 1320, freqTo: 880, type: 'square', gain: 0.018, dur: 0.045, attack: 0.002, filter: { type: 'bandpass', freq: 2600, q: 5 }, reverb: 0.08 },
          { type: 'noise', gain: 0.006, dur: 0.035, filter: { type: 'highpass', freq: 4500, q: 1 } },
        ],
      },
      {
        id: 'ui.objective',
        label: 'Nouvel objectif',
        description: 'Ping organique alien: discret, lisible, pas trop musical.',
        volume: 0.36,
        synth: [
          { freq: 415.30, freqTo: 554.37, type: 'triangle', gain: 0.025, dur: 0.18, attack: 0.012, filter: { type: 'bandpass', freq: 1300, q: 4 }, reverb: 0.24 },
          { freq: 830.61, type: 'sine', gain: 0.018, dur: 0.28, delay: 0.08, attack: 0.012, reverb: 0.42, pan: 0.18 },
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
