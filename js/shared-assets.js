const SHARED_BASE = '/shared';

const SHARED_ASSETS = {
  starLogo: [
    `${SHARED_BASE}/logos/star_logo/star_logo_color_set/star_logo_white_silver.png`,
    `${SHARED_BASE}/logos/star_logo/star_logo_color_set/star_logo_cyan_magenta.png`,
    `${SHARED_BASE}/logos/star_logo/star_logo.png`,
  ],
};

const loaded = new Map();
let mounted = false;

function resolveImage(candidates) {
  const key = candidates.join('|');
  if (loaded.has(key)) return loaded.get(key);

  const promise = new Promise(resolve => {
    let index = 0;
    const tryNext = () => {
      const src = candidates[index];
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => {
        index += 1;
        tryNext();
      };
      img.src = src;
    };
    tryNext();
  });

  loaded.set(key, promise);
  return promise;
}

function setImage(node, src) {
  if (!node || !src) return;
  node.style.setProperty('--shared-star-logo', `url("${src}")`);
  node.dataset.sharedAssetReady = 'true';
}

function mountSharedAssets() {
  if (mounted) return;
  const shell = document.querySelector('.clicker-shell');
  const corePanel = document.getElementById('core-panel');
  const clickCore = document.getElementById('click-core');
  const brandTitle = document.querySelector('.brand-title');
  if (!shell || !corePanel || !clickCore || !brandTitle) return;
  mounted = true;

  if (!document.getElementById('shared-brand-mark')) {
    brandTitle.insertAdjacentHTML('beforebegin', '<div class="shared-brand-mark" id="shared-brand-mark" aria-hidden="true"></div>');
  }

  if (!document.getElementById('shared-reactor-watermark')) {
    corePanel.insertAdjacentHTML('afterbegin', '<div class="shared-reactor-watermark" id="shared-reactor-watermark" aria-hidden="true"></div>');
  }

  if (!document.getElementById('shared-bg-sigil')) {
    shell.insertAdjacentHTML('afterbegin', '<div class="shared-bg-sigil" id="shared-bg-sigil" aria-hidden="true"></div>');
  }

  if (!document.getElementById('shared-core-center-asset')) {
    clickCore.insertAdjacentHTML('beforeend', '<span class="shared-core-center-asset" id="shared-core-center-asset" aria-hidden="true"></span>');
  }

  resolveImage(SHARED_ASSETS.starLogo).then(src => {
    if (!src) return;
    document.documentElement.style.setProperty('--shared-star-logo', `url("${src}")`);
    setImage(document.getElementById('shared-brand-mark'), src);
    setImage(document.getElementById('shared-reactor-watermark'), src);
    setImage(document.getElementById('shared-bg-sigil'), src);
    setImage(document.getElementById('shared-core-center-asset'), src);
    updateFavicon(src);
  });
}

function updateFavicon(src) {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = src;
  link.type = 'image/png';
}

const boot = setInterval(() => {
  mountSharedAssets();
  if (mounted) clearInterval(boot);
}, 250);

window.NitroSharedAssets = {
  base: SHARED_BASE,
  assets: SHARED_ASSETS,
  resolveImage,
};
