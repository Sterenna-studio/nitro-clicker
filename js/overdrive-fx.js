const MAX_SHARDS = 96;
let running = false;

function triggerOverdriveFracture() {
  if (running) return;
  const core = document.getElementById('click-core');
  const panel = document.getElementById('core-panel');
  if (!core || !panel) return;

  running = true;
  core.classList.remove('overdrive-fracture');
  panel.classList.remove('overdrive-window-blast');
  void core.offsetWidth;
  core.classList.add('overdrive-fracture');
  panel.classList.add('overdrive-window-blast');

  const coreRect = core.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const origin = {
    x: coreRect.left + coreRect.width / 2,
    y: coreRect.top + coreRect.height / 2,
  };

  spawnCoreSplinters(origin, coreRect);
  spawnEscapingShards(origin, panelRect);
  spawnShockRings(origin, panelRect);

  setTimeout(() => {
    core.classList.remove('overdrive-fracture');
    panel.classList.remove('overdrive-window-blast');
    running = false;
  }, 1600);
}

function getLayer() {
  let layer = document.getElementById('overdrive-shard-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'overdrive-shard-layer';
    layer.className = 'overdrive-shard-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  while (layer.children.length > MAX_SHARDS) layer.firstElementChild?.remove();
  return layer;
}

function spawnCoreSplinters(origin, coreRect) {
  const layer = getLayer();
  const count = 22;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
    const distance = 44 + Math.random() * (coreRect.width * 0.34);
    const shard = document.createElement('span');
    shard.className = 'overdrive-core-splinter';
    shard.style.left = `${origin.x}px`;
    shard.style.top = `${origin.y}px`;
    shard.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    shard.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    shard.style.setProperty('--rot', `${Math.random() * 480 - 240}deg`);
    shard.style.setProperty('--scale', `${0.72 + Math.random() * 0.85}`);
    shard.style.setProperty('--delay', `${Math.random() * 70}ms`);
    layer.appendChild(shard);
    setTimeout(() => shard.remove(), 1150);
  }
}

function spawnEscapingShards(origin, panelRect) {
  const layer = getLayer();
  const count = 34;
  for (let i = 0; i < count; i++) {
    const side = i % 4;
    const target = getExitTarget(side, panelRect);
    const dx = target.x - origin.x + (Math.random() - 0.5) * 160;
    const dy = target.y - origin.y + (Math.random() - 0.5) * 160;
    const shard = document.createElement('span');
    shard.className = `overdrive-energy-shard shard-side-${side}`;
    shard.style.left = `${origin.x}px`;
    shard.style.top = `${origin.y}px`;
    shard.style.setProperty('--dx', `${dx}px`);
    shard.style.setProperty('--dy', `${dy}px`);
    shard.style.setProperty('--rot', `${Math.random() * 900 - 450}deg`);
    shard.style.setProperty('--len', `${28 + Math.random() * 58}px`);
    shard.style.setProperty('--delay', `${Math.random() * 120}ms`);
    layer.appendChild(shard);
    setTimeout(() => shard.remove(), 1450);
  }
}

function spawnShockRings(origin, panelRect) {
  const layer = getLayer();
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('span');
    ring.className = 'overdrive-shock-ring';
    ring.style.left = `${origin.x}px`;
    ring.style.top = `${origin.y}px`;
    ring.style.setProperty('--size', `${Math.max(panelRect.width, panelRect.height) * (0.34 + i * 0.22)}px`);
    ring.style.setProperty('--delay', `${i * 90}ms`);
    layer.appendChild(ring);
    setTimeout(() => ring.remove(), 1200);
  }

  const flash = document.createElement('span');
  flash.className = 'overdrive-window-flash';
  flash.style.left = `${panelRect.left}px`;
  flash.style.top = `${panelRect.top}px`;
  flash.style.width = `${panelRect.width}px`;
  flash.style.height = `${panelRect.height}px`;
  layer.appendChild(flash);
  setTimeout(() => flash.remove(), 900);
}

function getExitTarget(side, rect) {
  const pad = 120;
  if (side === 0) return { x: rect.left + Math.random() * rect.width, y: rect.top - pad - Math.random() * 120 };
  if (side === 1) return { x: rect.right + pad + Math.random() * 160, y: rect.top + Math.random() * rect.height };
  if (side === 2) return { x: rect.left + Math.random() * rect.width, y: rect.bottom + pad + Math.random() * 120 };
  return { x: rect.left - pad - Math.random() * 160, y: rect.top + Math.random() * rect.height };
}

const observer = new MutationObserver(records => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.classList.contains('system-wave') && /OVERDRIVE/i.test(node.textContent ?? '')) {
        triggerOverdriveFracture();
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

window.NitroOverdriveFX = { trigger: triggerOverdriveFracture };
