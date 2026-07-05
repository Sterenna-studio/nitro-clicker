import { getValueMode, getValueLocale, setValueMode, setValueLocale } from './value-format.js';

let mounted = false;
let open = false;

const MODES = [
  { id: 'abbreviated', label: 'ABRÉGÉ' },
  { id: 'full', label: 'COMPLET' },
  { id: 'scientific', label: 'SCIENTIFIQUE' },
];
const LOCALES = [
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
];

function mountSettingsPanel() {
  if (mounted) return true;
  const app = document.getElementById('app');
  const topActions = document.querySelector('.top-actions');
  if (!app || !topActions) return false;

  if (!document.getElementById('settings-panel-toggle')) {
    topActions.insertAdjacentHTML('afterbegin', '<button class="nav-btn settings-panel-toggle" id="settings-panel-toggle" type="button">⚙ PARAMÈTRES</button>');
  }

  app.insertAdjacentHTML('beforeend', `
    <aside class="settings-panel" id="settings-panel" aria-hidden="true">
      <header class="settings-panel-head">
        <div>
          <span>SYSTEM CONFIG</span>
          <strong>PARAMÈTRES</strong>
        </div>
        <button type="button" id="settings-panel-close">×</button>
      </header>

      <section class="settings-section">
        <h3>Format des valeurs</h3>
        <div class="settings-toggle-row" id="settings-mode-row" role="group" aria-label="Mode d'affichage">
          ${MODES.map(m => `<button class="settings-toggle-btn" data-value-mode="${m.id}" type="button">${m.label}</button>`).join('')}
        </div>
        <div class="settings-toggle-row" id="settings-locale-row" role="group" aria-label="Langue des abréviations">
          ${LOCALES.map(l => `<button class="settings-toggle-btn" data-value-locale="${l.id}" type="button">${l.label}</button>`).join('')}
        </div>
      </section>
    </aside>
  `);

  bindSettingsPanel();
  syncSettingsPanel();
  mounted = true;
  return true;
}

function bindSettingsPanel() {
  document.getElementById('settings-panel-toggle')?.addEventListener('click', () => setOpen(!open));
  document.getElementById('settings-panel-close')?.addEventListener('click', () => setOpen(false));

  document.querySelectorAll('[data-value-mode]').forEach(btn => {
    btn.addEventListener('click', () => { setValueMode(btn.dataset.valueMode); syncSettingsPanel(); });
  });
  document.querySelectorAll('[data-value-locale]').forEach(btn => {
    btn.addEventListener('click', () => { setValueLocale(btn.dataset.valueLocale); syncSettingsPanel(); });
  });
}

function syncSettingsPanel() {
  const mode = getValueMode();
  const locale = getValueLocale();
  document.querySelectorAll('[data-value-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.valueMode === mode));
  document.querySelectorAll('[data-value-locale]').forEach(btn => btn.classList.toggle('active', btn.dataset.valueLocale === locale));
}

function setOpen(value) {
  open = !!value;
  const panel = document.getElementById('settings-panel');
  const btn = document.getElementById('settings-panel-toggle');
  panel?.classList.toggle('open', open);
  panel?.setAttribute('aria-hidden', String(!open));
  btn?.classList.toggle('active', open);
}

const boot = setInterval(() => {
  if (mountSettingsPanel()) clearInterval(boot);
}, 250);

window.NitroSettingsPanel = { open: () => setOpen(true), close: () => setOpen(false), sync: syncSettingsPanel };
