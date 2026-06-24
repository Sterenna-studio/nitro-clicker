# Core FX inventory

Runtime source of truth: `js/app.js` renders the core DOM, then the CSS layers in `css/nitro.css` style it through imported feature files.

## Core 3D and status layers

- `click-core`: main clickable 3D sphere. Styled across `css/clicker.css`, `css/biopunk-fx.css`, `css/core-3d.css`, and `css/core-shell.css`.
- `core-rings`: inner rotating ring layer inside `click-core`. Styled in `css/clicker.css` and `css/core-3d.css`.
- `core-glyph`: center glyph slot, later replaced/augmented by SVG/shared assets. Styled in `css/core-3d.css`, `css/svg-icons.css`, and `css/shared-assets.css`.
- `shared-core-center-asset`: shared center asset injected by `js/shared-assets.js`. Styled in `css/shared-assets.css` and `css/core-3d.css`.
- `core-state-aura`: energy/passive/surcharge/shell status circle. Disabled for now in `css/core-3d.css`.
- `core-shell-visual`: shell/isolation bubble around the core, including shell fill, reflect, crack and break pulses. Styled in `css/core-shell.css`.
- `core-hit-zone`: transparent click target around the sphere. Runtime helper, not visual by itself. Styled in `css/progression.css`.

## Core field layers

- `scale-radar`: background radar/scale rings in the core panel. Styled in `css/progression.css`.
- `sub-core-field`: duplicated core orbit field from Nitro Factory progression. Styled in `css/progression.css`.
- `sub-core-link`: conduit/rail from the main core to each duplicated sub-core.
- `energy-field`: transient energy particle container from older click feedback. Styled in `css/clicker.css`.
- `module-orbit`: grouped core augmentation network. Runtime nodes are generated from upgrade families rather than one icon per upgrade.
- `module-link`: conduit/rail connecting an augmentation group to the core.
- `spawned-module`: grouped augmentation node (`AMP`, `AUTO`, `OVR`, `SHELL`, `COREx`) with a level meter. Styled in `css/clicker.css`, `css/biopunk-fx.css`, `css/svg-icons.css`, and responsive CSS.
- `tendril-layer` / `bio-tendril`: biopunk tendrils generated from total upgrade levels. Styled in `css/biopunk-fx.css`.

## Click, burst and feedback layers

- `float-pop`: click gain text inside the core.
- `bounce-canvas`: canvas particles that bounce inside the core on clicks.
- `dopamine-burst-layer`: fixed overlay used by energy sparks and reward badges.
- `dopamine-badge` / `dopamine-spark`: reward burst elements from `js/app.js` and `js/plasma-feedback.js`.
- `plasma-arc-layer` / `plasma-arc-svg`: plasma click arcs mounted by `js/plasma-feedback.js`.
- `lightning-layer`: global SVG lightning overlay from `js/app.js`.
- `lightning-bolt` / `zap-label`: line and label elements used by lightning feedback.
- `system-wave`: big text wave in the core panel for milestones, overdrive and shell states.
- `fragment-orb` / `fragment-orb-ghost`: collectible fragment visuals and their flight to the fragment stat.

## Overdrive layers

- `overdrive-shard-layer`: fixed overdrive FX layer from `js/overdrive-fx.js`.
- `overdrive-core-nova`: central nova flash.
- `overdrive-nova-beam`: radial beam from the core.
- `overdrive-core-splinter`: core fracture splinters.
- `overdrive-energy-shard`: escaping energy shards.
- `overdrive-shock-ring`: shockwave rings.
- `overdrive-window-flash`: screen/panel flash.
- `click-core.overdrive-fracture`: class applied to the core during fracture.
- `core-panel.overdrive-window-blast`: class applied to the panel during impact.

## Control and state classes

- `fx-disabled`: disables several decorative layers.
- `pulse-hit`: core click pulse.
- `auto-click-pulse`: auto-clicker pulse.
- `spin-click-pulse`: spin/boost pulse.
- `plasma-click-hit`: plasma click hit on the panel/core.
- `shell-store-hit`, `shell-crack-hit`, `shell-break-hit`: shell feedback states.
- `scale-shift`: page/core scale transition feedback.
