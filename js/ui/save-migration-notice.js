import { readMigrationNotice } from '../clicker-save.js';
import { formatValue as format } from './value-format.js';

let mounted = false;

function mountMigrationNotice() {
  if (mounted) return true;
  const app = document.getElementById('app');
  const topbar = document.querySelector('.topbar');
  if (!app || !topbar) return false;

  const notice = readMigrationNotice();
  if (!notice) {
    mounted = true;
    return true;
  }

  mounted = true;
  const compensation = notice.compensation;
  const node = document.createElement('aside');
  node.className = 'save-migration-notice';
  node.innerHTML = `
    <div class="save-migration-kicker">SAVE ADAPTER</div>
    <strong>Ancienne sauvegarde adaptée</strong>
    <p>Ta progression a été convertie vers la version actuelle pour garder tes données jouables.</p>
    ${compensation ? `<div class="save-migration-reward"><span>Compensation</span><b>+${format(compensation.energy)} E</b><b>+${format(compensation.fragments)} F</b></div>` : ''}
    <button type="button">OK</button>
  `;
  app.appendChild(node);
  node.querySelector('button')?.addEventListener('click', () => node.remove());
  setTimeout(() => node.remove(), 12000);
  return true;
}

const boot = window.NITRO_DISABLE_PERIPHERALS ? null : setInterval(() => {
  if (mountMigrationNotice()) clearInterval(boot);
}, 250);

window.NitroSaveMigrationNotice = { mount: mountMigrationNotice };
