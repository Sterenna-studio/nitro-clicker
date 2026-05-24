// Tiny DOM write cache.
// Prevents repeated text/class/style writes during high-frequency refreshes.

const textCache = new WeakMap();
const htmlCache = new WeakMap();
const styleCache = new WeakMap();

export function setText(nodeOrId, value) {
  const node = resolveNode(nodeOrId);
  if (!node) return false;
  const next = String(value ?? '');
  if (textCache.get(node) === next && node.textContent === next) return false;
  node.textContent = next;
  textCache.set(node, next);
  return true;
}

export function setHtml(nodeOrId, value) {
  const node = resolveNode(nodeOrId);
  if (!node) return false;
  const next = String(value ?? '');
  if (htmlCache.get(node) === next && node.innerHTML === next) return false;
  node.innerHTML = next;
  htmlCache.set(node, next);
  return true;
}

export function setStyle(nodeOrId, prop, value) {
  const node = resolveNode(nodeOrId);
  if (!node || !prop) return false;
  let map = styleCache.get(node);
  if (!map) {
    map = new Map();
    styleCache.set(node, map);
  }
  const next = String(value ?? '');
  if (map.get(prop) === next && node.style.getPropertyValue(prop) === next) return false;
  node.style.setProperty(prop, next);
  map.set(prop, next);
  return true;
}

export function setTransformScaleX(nodeOrId, ratio) {
  const safe = Math.max(0, Math.min(1, Number(ratio) || 0));
  return setStyle(nodeOrId, 'transform', `scaleX(${safe})`);
}

export function setClassToggle(nodeOrId, className, enabled) {
  const node = resolveNode(nodeOrId);
  if (!node || !className) return false;
  const before = node.classList.contains(className);
  if (before === !!enabled) return false;
  node.classList.toggle(className, !!enabled);
  return true;
}

function resolveNode(nodeOrId) {
  if (!nodeOrId) return null;
  if (typeof nodeOrId === 'string') return document.getElementById(nodeOrId);
  return nodeOrId;
}

window.NitroRenderCache = {
  setText,
  setHtml,
  setStyle,
  setTransformScaleX,
  setClassToggle,
};
