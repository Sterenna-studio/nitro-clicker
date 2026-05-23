import { VERSION, createDefaultState, hydrateState, recalcDerivedStats } from './clicker-state.js';

const SAVE_PREFIX = 'nitro-clicker.save.';
const DEV_ENABLED_KEY = 'nitro-clicker.dev.enabled';
const LOG_KEY = 'nitro-clicker.log';
const params = new URLSearchParams(location.search);

if (params.get('debug') === '1') localStorage.setItem(DEV_ENABLED_KEY, '1');
if (params.get('debug') === '0') localStorage.removeItem(DEV_ENABLED_KEY);

const devEnabled = localStorage.getItem(DEV_ENABLED_KEY) === '1';
let ready = false;

function saveKey() {
  const keys = Object.keys(localStorage).filter(key => key.startsWith(SAVE_PREFIX));
  return keys[0] || `${SAVE_PREFIX}guest`;
}

function readSave() {
  const key = saveKey();
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    return hydrateState(raw, raw.userId || key.replace(SAVE_PREFIX, '') || 'guest');
  } catch {
    return createDefaultState('guest');
  }
}

function writeSave(state) {
  state.version = VERSION;
  state.updatedAt = Date.now();
  recalcDerivedStats(state);
  localStorage.setItem(saveKey(), JSON.stringify(state));
  setTimeout(() => location.reload(), 100);
}

function log(type, title, detail = '') {
  const list = readLog();
  list.unshift({ type, title, detail, at: Date.now() });
  localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, 60)));
  renderLog();
}

function readLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mount() {
  if (ready || !document.querySelector('.clicker-shell')) return;
  ready = true;
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="dev-log" id="dev-log">
      <button class="dev-log-toggle" id="dev-log-toggle" type="button">▤ LOG</button>
      <div class="dev-log-body">
        <header><strong>EVENT LOG</strong><button id="dev-log-clear" type="button">CLEAR</button></header>
        <div id="dev-log-list" class="dev-log-list"></div>
      </div>
    </aside>
    ${devEnabled ? `
      <aside class="dev-panel" id="dev-panel">
        <button class="dev-panel-toggle" id="dev-panel-toggle" type="button">⚙ DEBUG</button>
        <div class="dev-panel-body">
          <strong>DEBUG TOOLS</strong>
          <small>?debug=0 pour masquer</small>
          <button data-dev="e1k">+1K énergie</button>
          <button data-dev="e100k">+100K énergie</button>
          <button data-dev="e10m">+10M énergie</button>
          <button data-dev="f10">+10 fragments</button>
          <button data-dev="p1">+1 prestige</button>
          <button data-dev="p10">set prestige 10</button>
          <button data-dev="unlock">unlock early</button>
          <button data-dev="repair">repair save</button>
        </div>
      </aside>` : ''}
  `);

  document.getElementById('dev-log-toggle')?.addEventListener('click', () => document.getElementById('dev-log')?.classList.toggle('open'));
  document.getElementById('dev-log-clear')?.addEventListener('click', () => { localStorage.removeItem(LOG_KEY); renderLog(); });
  document.getElementById('dev-panel-toggle')?.addEventListener('click', () => document.getElementById('dev-panel')?.classList.toggle('open'));
  document.querySelectorAll('[data-dev]').forEach(button => button.addEventListener('click', () => runDev(button.dataset.dev)));
  document.addEventListener('click', event => {
    if (event.target.closest?.('#click-core') && Math.random() < 0.08) log('core', 'Pulsation du noyau');
    const up = event.target.closest?.('[data-upgrade]');
    if (up && !up.classList.contains('locked')) log('upgrade', 'Achat upgrade', up.querySelector('.upgrade-name')?.textContent?.trim() || up.dataset.upgrade);
    if (event.target.closest?.('#prestige-btn')) log('prestige', 'Tentative prestige');
  }, true);
  log('system', devEnabled ? 'Session lancée · debug actif' : 'Session lancée');
}

function runDev(action) {
  const s = readSave();
  if (action === 'e1k') { s.energy += 1000; s.totalEnergy += 1000; }
  if (action === 'e100k') { s.energy += 100000; s.totalEnergy += 100000; }
  if (action === 'e10m') { s.energy += 10000000; s.totalEnergy += 10000000; }
  if (action === 'f10') { s.fragments += 10; s.totalFragments += 10; }
  if (action === 'p1') s.prestige += 1;
  if (action === 'p10') s.prestige = Math.max(10, s.prestige);
  if (action === 'unlock') { s.energy += 10000; s.totalEnergy = Math.max(s.totalEnergy, 10000); s.fragments += 3; s.totalFragments += 3; s.upgrades.prism = Math.max(s.upgrades.prism || 0, 2); }
  log('debug', `Action ${action}`);
  writeSave(s);
}

function renderLog() {
  const root = document.getElementById('dev-log-list');
  if (!root) return;
  const list = readLog();
  root.innerHTML = list.length ? list.map(item => `
    <article class="dev-log-item">
      <div><span>${item.type}</span><time>${new Date(item.at).toLocaleTimeString('fr-FR')}</time></div>
      <strong>${item.title}</strong>
      ${item.detail ? `<p>${item.detail}</p>` : ''}
    </article>
  `).join('') : '<div class="dev-log-empty">Aucun événement.</div>';
}

setInterval(mount, 250);
