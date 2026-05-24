// Nitro Clicker bootstrap
// Keep module loading order explicit and centralized.

// UI scheduling / asset cache should be available before app-side UI modules.
import './ui/window-manager.js';
import './ui/asset-cache.js';

import './app.js';

// UI extensions
import './ui/panels.js';
import './ui/svg-replacer.js';
import './ui/shared-assets.js';
import './ui/upgrade-ux.js';

// Gameplay/runtime helpers
import './engine/core-controls.js';

// Visual feedback layers
import './fx/overdrive.js';
import './fx/plasma-feedback.js';

// Lore/progression layers
import './lore/lemegeton-progression.js';

// Debug/QA tools must stay last.
import './debug/dev-tools.js';
