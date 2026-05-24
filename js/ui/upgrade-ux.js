const GUIDE_KEY = 'nitro-clicker.guide.v1.seen';

const GROUPS = [
  {
    id: 'core',
    title: 'UP DU NOYAU',
    subtitle: 'Puissance directe, flux stable et modules organiques.',
    upgrades: ['clickAmplifier', 'autoCore', 'resonance', 'prism', 'bioConduit'],
  },
  {
    id: 'overdrive',
    title: 'OVERDRIVE',
    subtitle: 'Surcharge, explosion énergétique et rendement des pics.',
    upgrades: ['surchargeCoil'],
  },
  {
    id: 'automation',
    title: 'AUTO-CLICKER',
    subtitle: 'Maintien automatique du noyau, futur point d’entrée de LEMEGETON.',
    upgrades: ['autoClicker'],
  },
  {
    id: 'fragments',
    title: 'BOUTIQUE FRAGMENTS',
    subtitle: 'Bonus permanents conservés entre les prestiges.',
    upgrades: ['fragmentCatalyst'],
  },
  {
    id: 'infrastructure',
    title: 'INFRASTRUCTURE',
    subtitle: 'Dézoom : usines, chaînes moteur et réseau orbital.',
    upgrades: ['nitroFactory', 'enginePlant', 'orbitalHive'],
  },
];

const UPGRADE_INFO = {
  clickAmplifier: {
    tip: 'Augmente la valeur de chaque clic manuel. C’est ton meilleur achat au tout début.',
    stat: '+ puissance / clic',
  },
  autoCore: {
    tip: 'Génère de l’énergie même sans cliquer. C’est la base de la progression idle.',
    stat: '+ énergie / seconde',
  },
  autoClicker: {
    tip: 'Simule un maintien automatique sur le noyau. Plus tard, LEMEGETON pourra en prendre le contrôle.',
    stat: '+ clics automatiques',
  },
  resonance: {
    tip: 'Améliore à la fois le clic et le flux passif. Très bon upgrade hybride.',
    stat: '+ clic + passif',
  },
  surchargeCoil: {
    tip: 'Augmente la capacité de surcharge et accélère l’accès à l’Overdrive.',
    stat: '+ surcharge / overdrive',
  },
  prism: {
    tip: 'Stabilise le noyau et apporte un gros gain de puissance global.',
    stat: '+ gros bonus hybride',
  },
  bioConduit: {
    tip: 'Renforce les conduits organiques autour du noyau. Gros gain passif.',
    stat: '+ passif + stabilité',
  },
  fragmentCatalyst: {
    tip: 'Utilise les fragments Nitro. Le bonus est permanent et survit aux prestiges.',
    stat: '+ multiplicateur permanent',
  },
  nitroFactory: {
    tip: 'Premier vrai dézoom industriel. Tu ne gères plus seulement un noyau, mais une usine.',
    stat: '+ usine + production',
  },
  enginePlant: {
    tip: 'Transforme la production en chaîne moteur massive.',
    stat: '+ production industrielle',
  },
  orbitalHive: {
    tip: 'Fin de palier actuel : le réseau devient orbital et prépare le vaisseau complet.',
    stat: '+ réseau orbital',
  },
};

let organizing = false;
let lastLevels = new Map();
let guideStep = 0;
let guideActive = false;

function mountUpgradeUx() {
  const root = document.getElementById('upgrade-list');
  if (!root || root.dataset.upgradeUxMounted) return;
  root.dataset.upgradeUxMounted = 'true';

  const observer = new MutationObserver(() => organizeUpgradeList());
  observer.observe(root, { childList: true });
  organizeUpgradeList();

  document.addEventListener('click', event => {
    const info = event.target.closest?.('[data-upgrade-info]');
    if (info) {
      event.preventDefault();
      event.stopPropagation();
      showInfoBubble(info, info.dataset.upgradeInfo);
      return;
    }

    const upgradeButton = event.target.closest?.('[data-upgrade]');
    if (upgradeButton && !upgradeButton.classList.contains('locked')) {
      setTimeout(() => detectUpgradeStatChanges(), 80);
      maybeAdvanceGuide(upgradeButton.dataset.upgrade);
    }
  }, true);

  setTimeout(showInitialGuide, 800);
}

function organizeUpgradeList() {
  if (organizing) return;
  const root = document.getElementById('upgrade-list');
  if (!root) return;
  const rawButtons = [...root.children].filter(node => node.matches?.('.upgrade-btn'));
  if (!rawButtons.length) return;

  organizing = true;
  const buttonsById = new Map(rawButtons.map(button => [button.dataset.upgrade, button]));
  const fragment = document.createDocumentFragment();

  for (const group of GROUPS) {
    const groupButtons = group.upgrades.map(id => buttonsById.get(id)).filter(Boolean);
    if (!groupButtons.length) continue;

    const section = document.createElement('section');
    section.className = `upgrade-group upgrade-group-${group.id}`;
    section.dataset.upgradeGroup = group.id;
    section.innerHTML = `
      <header class="upgrade-group-head">
        <div><strong>${group.title}</strong><small>${group.subtitle}</small></div>
      </header>
    `;
    const list = document.createElement('div');
    list.className = 'upgrade-group-list';

    groupButtons.forEach(button => {
      enhanceUpgradeButton(button);
      list.appendChild(button);
      buttonsById.delete(button.dataset.upgrade);
    });

    section.appendChild(list);
    fragment.appendChild(section);
  }

  for (const button of buttonsById.values()) {
    enhanceUpgradeButton(button);
    fragment.appendChild(button);
  }

  root.replaceChildren(fragment);
  organizing = false;
  detectUpgradeStatChanges(true);
}

function enhanceUpgradeButton(button) {
  const id = button.dataset.upgrade;
  if (!id || button.dataset.upgradeUxEnhanced) return;
  button.dataset.upgradeUxEnhanced = 'true';
  button.classList.add(`upgrade-type-${getGroupForUpgrade(id)}`);

  const info = UPGRADE_INFO[id];
  const desc = button.querySelector('.upgrade-desc');
  if (desc && info) {
    desc.innerHTML = `${desc.textContent}<span class="upgrade-effect-line">${info.stat}</span>`;
  }

  const head = button.querySelector('.upgrade-head');
  if (head && info && !button.classList.contains('locked')) {
    const bubble = document.createElement('span');
    bubble.className = 'upgrade-info-dot';
    bubble.dataset.upgradeInfo = id;
    bubble.textContent = 'i';
    bubble.setAttribute('role', 'button');
    bubble.setAttribute('tabindex', '0');
    bubble.setAttribute('aria-label', `Info ${id}`);
    head.appendChild(bubble);
  }
}

function getGroupForUpgrade(id) {
  return GROUPS.find(group => group.upgrades.includes(id))?.id ?? 'misc';
}

function showInfoBubble(anchor, upgradeId) {
  const info = UPGRADE_INFO[upgradeId];
  if (!info) return;
  document.querySelector('.upgrade-info-pop')?.remove();
  const rect = anchor.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'upgrade-info-pop';
  pop.innerHTML = `<strong>${info.stat}</strong><p>${info.tip}</p>`;
  pop.style.left = `${Math.min(window.innerWidth - 260, rect.left - 210)}px`;
  pop.style.top = `${rect.bottom + 8}px`;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 4200);
}

function detectUpgradeStatChanges(initial = false) {
  document.querySelectorAll('[data-upgrade]:not(.locked)').forEach(button => {
    const id = button.dataset.upgrade;
    const levelNode = button.querySelector(`[data-upgrade-level="${id}"]`);
    const level = Number(levelNode?.textContent?.match(/Lv\.([0-9]+)/)?.[1] ?? 0);
    const previous = lastLevels.get(id);
    lastLevels.set(id, level);
    if (initial || previous === undefined || level <= previous) return;
    triggerStatMutation(button, level - previous);
  });
}

function triggerStatMutation(button, delta = 1) {
  button.classList.remove('upgrade-stat-mutated');
  void button.offsetWidth;
  button.classList.add('upgrade-stat-mutated');

  const tag = document.createElement('span');
  tag.className = 'upgrade-mutation-tag';
  tag.textContent = delta > 1 ? `+${delta} LV` : '+STAT';
  button.appendChild(tag);
  setTimeout(() => tag.remove(), 980);
  setTimeout(() => button.classList.remove('upgrade-stat-mutated'), 980);
}

function showInitialGuide() {
  if (localStorage.getItem(GUIDE_KEY) === '1' || guideActive) return;
  guideActive = true;
  showGuideCard({
    title: 'Bienvenue dans Nitro Clicker',
    text: 'Clique le noyau pour produire de l’énergie. Achète ensuite un upgrade du noyau pour accélérer la production.',
    action: 'Compris',
  });
}

function maybeAdvanceGuide(upgradeId) {
  if (localStorage.getItem(GUIDE_KEY) === '1') return;
  guideStep += 1;

  if (guideStep === 1) {
    showGuideCard({
      title: 'Premier upgrade installé',
      text: 'Les upgrades sont séparés par rôle : noyau, Overdrive, auto-clicker, fragments et infrastructure. Survole ou clique les bulles “i” pour comprendre chaque effet.',
      action: 'Continuer',
    });
  }

  if (upgradeId === 'autoClicker' || guideStep >= 3) {
    showGuideCard({
      title: 'Automatisation détectée',
      text: 'L’auto-clicker maintient le noyau actif. Plus tard, LEMEGETON pourra prendre le contrôle de cette automatisation.',
      action: 'OK',
      done: true,
    });
  }
}

function showGuideCard({ title, text, action = 'OK', done = false }) {
  document.querySelector('.guide-pop')?.remove();
  const node = document.createElement('aside');
  node.className = 'guide-pop';
  node.innerHTML = `
    <div class="guide-pop-kicker">ASSISTANT DE BORD</div>
    <strong>${title}</strong>
    <p>${text}</p>
    <button type="button">${action}</button>
  `;
  document.body.appendChild(node);
  node.querySelector('button').addEventListener('click', () => {
    node.remove();
    if (done) localStorage.setItem(GUIDE_KEY, '1');
  });
}

const boot = setInterval(() => {
  mountUpgradeUx();
  if (document.getElementById('upgrade-list')?.dataset.upgradeUxMounted) clearInterval(boot);
}, 250);

window.NitroUpgradeUx = {
  resetGuide() { localStorage.removeItem(GUIDE_KEY); guideStep = 0; showInitialGuide(); },
};
