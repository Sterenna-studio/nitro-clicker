const PROFILE_LIMITS = {
  reduced: { renderFps: 8, panelRefreshMs: 500, ambienceMs: 3600, clickPop: 120, clickBurst: 120, corePulse: 140, cloneFeedback: 180, moduleZap: 240, bouncePerBurst: 3, passiveBouncePerBurst: 2, energyBurst: 8, activeBounce: 12 },
  low: { renderFps: 12, panelRefreshMs: 400, ambienceMs: 3000, clickPop: 80, clickBurst: 90, corePulse: 100, cloneFeedback: 140, moduleZap: 190, bouncePerBurst: 5, passiveBouncePerBurst: 3, energyBurst: 12, activeBounce: 24 },
  medium: { renderFps: 20, panelRefreshMs: 300, ambienceMs: 2200, clickPop: 45, clickBurst: 55, corePulse: 65, cloneFeedback: 100, moduleZap: 140, bouncePerBurst: 8, passiveBouncePerBurst: 5, energyBurst: 20, activeBounce: 40 },
  high: { renderFps: 30, panelRefreshMs: 250, ambienceMs: 1800, clickPop: 24, clickBurst: 32, corePulse: 40, cloneFeedback: 70, moduleZap: 100, bouncePerBurst: 12, passiveBouncePerBurst: 8, energyBurst: 32, activeBounce: 64 },
};

function detectProfileName() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'reduced';
  const cores = Number(navigator.hardwareConcurrency ?? 4);
  const memory = Number(navigator.deviceMemory ?? 4);
  if (navigator.connection?.saveData === true || cores <= 2 || memory <= 2) return 'low';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'medium';
}

export function createVisualRuntime() {
  const profileName = detectProfileName();
  const limits = PROFILE_LIMITS[profileName];
  const lastEffectAt = new Map();
  let frameId = 0;
  let lastRenderAt = 0;
  let lastPanelAt = 0;
  let lastAmbienceAt = 0;

  function shouldRun(effect, cooldownMs = limits[effect] ?? 0) {
    if (document.hidden) return false;
    const now = performance.now();
    const previous = lastEffectAt.get(effect) ?? -Infinity;
    if (now - previous < cooldownMs) return false;
    lastEffectAt.set(effect, now);
    return true;
  }

  function capCount(effect, requested) {
    const cap = Math.max(0, Number(limits[effect] ?? requested) || 0);
    return Math.max(0, Math.min(cap, Math.floor(Number(requested) || 0)));
  }

  function trimActive(effect, items) {
    const cap = Math.max(0, Number(limits[effect] ?? items.length) || 0);
    if (items.length > cap) items.splice(0, items.length - cap);
  }

  function start({ render, panels, ambience }) {
    if (frameId) return;
    const renderInterval = 1000 / limits.renderFps;
    const frame = now => {
      frameId = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (now - lastRenderAt >= renderInterval) {
        lastRenderAt = now;
        render?.();
      }
      if (now - lastPanelAt >= limits.panelRefreshMs) {
        lastPanelAt = now;
        panels?.();
      }
      if (now - lastAmbienceAt >= limits.ambienceMs) {
        lastAmbienceAt = now;
        ambience?.(now);
      }
    };
    frameId = requestAnimationFrame(frame);
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  }

  return { profileName, limits, shouldRun, capCount, trimActive, start, stop };
}
