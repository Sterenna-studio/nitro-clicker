// Formatage centralisé des grandes valeurs (énergie, fragments...), pilotable
// par l'utilisateur via le panneau Paramètres (js/ui/settings-panel.js).
const MODE_KEY = 'nitro-clicker.settings.valueMode';     // 'abbreviated' | 'full' | 'scientific'
const LOCALE_KEY = 'nitro-clicker.settings.valueLocale';  // 'fr' | 'en'
const VALUE_MODES = ['abbreviated', 'full', 'scientific'];
const VALUE_LOCALES = ['fr', 'en'];

// Seuil K/k = 100 000 (pas 1 000) — comportement historique de fmt() à préserver.
const ABBR = {
  fr: [[1e12, 'Bn'], [1e9, 'Md'], [1e6, 'M'], [1e5, 'k']],
  en: [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e5, 'K']],
};

export function getValueMode() {
  const mode = localStorage.getItem(MODE_KEY);
  return VALUE_MODES.includes(mode) ? mode : 'abbreviated';
}

export function getValueLocale() {
  const locale = localStorage.getItem(LOCALE_KEY);
  return VALUE_LOCALES.includes(locale) ? locale : 'fr';
}

export function setValueMode(mode) {
  if (!VALUE_MODES.includes(mode)) return;
  localStorage.setItem(MODE_KEY, mode);
  window.dispatchEvent(new Event('nitro:value-settings-changed'));
}

export function setValueLocale(locale) {
  if (!VALUE_LOCALES.includes(locale)) return;
  localStorage.setItem(LOCALE_KEY, locale);
  window.dispatchEvent(new Event('nitro:value-settings-changed'));
}

function intlLocale(locale) {
  return locale === 'fr' ? 'fr-FR' : 'en-US';
}

export function formatValue(value) {
  const n = Math.floor(Number(value ?? 0));
  const locale = getValueLocale();
  const mode = getValueMode();

  if (mode === 'scientific' && Math.abs(n) >= 1000) return n.toExponential(2).replace('+', '');
  if (mode === 'full') return n.toLocaleString(intlLocale(locale));

  for (const [threshold, suffix] of ABBR[locale]) {
    if (Math.abs(n) >= threshold) return `${(n / threshold).toFixed(2)}${suffix}`;
  }
  return n.toLocaleString(intlLocale(locale));
}
