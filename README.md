# Nitro Clicker

Private Nitro / Gwen Ha Star clicker game deployed under:

```txt
https://nitro.sterenna.fr/clicker/
```

The game is an authenticated static web app. It runs in the browser, uses Nitro shared auth/profile modules, and stores gameplay progression locally per Nitro user.

```txt
click core -> gain energy -> buy upgrades -> automate production -> prestige -> unlock deeper systems
```

## Current Runtime

- Nitro auth is required through `/shared/guards.js`.
- Profile display data is read from `/shared/profile.js`.
- Save data is local-only through `localStorage`.
- JS is loaded as browser ES modules from `index.html`.
- CSS is bundled by `css/nitro.css` through local `@import` layers.
- Deploy metadata is written to `deploy-info.json` during GitHub Actions deployment.

## Gameplay Surface

Current systems include:

- energy, total energy and fragments
- click power and passive production
- buy multiplier controls
- offline progress with a cap
- prestige and scale layers
- core shell storage/break mechanics
- LEMEGETON permanent skills
- auto-purchase behavior
- milestones and current objective UI
- FX/audio toggles, overdrive feedback, plasma feedback and deploy badge
- layout switching for the main panels

## Architecture

```txt
nitro-clicker/
├── index.html                  browser entrypoint
├── css/
│   ├── nitro.css               local CSS entrypoint
│   └── *.css                   feature CSS layers
├── js/
│   ├── bootstrap.js            only script loaded by index.html
│   ├── app.js                  main shell, render loop and bindings
│   ├── clicker-state.js        balance, progression and rules
│   ├── clicker-save.js         local save + migration handling
│   ├── engine/                 compatibility facades + runtime helpers
│   ├── ui/                     UI helpers and panels
│   ├── fx/                     visual feedback modules
│   ├── audio/                  sound catalog, engine and panel
│   ├── lore/                   LEMEGETON progression surface
│   └── debug/                  debug/dev helpers
├── docs/
│   ├── ARCHITECTURE.md
│   └── game-design.md
├── .github/workflows/
│   └── deploy-ovh.yml
├── deploy.html                 deploy status surface
├── debug.html                  debug surface
└── lemegeton*.html             avatar/prototype lab pages
```

The module layout is still transitional. Several files under `js/engine/`, `js/ui/`, `js/fx/` and `js/lore/` are facades over older root-level modules so imports can migrate progressively without breaking browser cache/deploy behavior.

See `docs/ARCHITECTURE.md` for the current migration map.

## Save Model

Gameplay progression is saved in the browser:

```txt
localStorage key: nitro-clicker.save.<user_id>
```

The save code currently handles:

- current save version: `VERSION = 9`
- legacy save hydration
- migration notices
- compensation for older saves
- localStorage failure reporting

No game-specific Supabase table is required by the current runtime. Supabase remains part of the wider Nitro platform through shared auth/profile modules only.

## Local Tooling

The repo intentionally ignores local helper files:

```txt
/.claude/
/dev/
/dev-local.html
```

On this workstation, `.claude/launch.json` points to a no-cache Python static server on port `7654`, backed by `dev/nocache-server.py`. Those files are local development helpers and are not tracked or deployed.

## Validation

The deploy workflow validates JavaScript syntax as browser modules:

```bash
node --input-type=module --check < path/to/file.js
```

Do not use plain `node --check path/to/file.js` as the signal for this repo unless a `package.json` with `"type": "module"` is added. The project uses browser ES modules and no package manifest is currently required.

## Deployment

Deployment is handled by GitHub Actions:

```txt
push to main
-> .github/workflows/deploy-ovh.yml
-> SSH + rsync
-> ~/nitro/clicker/
-> https://nitro.sterenna.fr/clicker/
```

Required GitHub secrets:

```txt
OVH_HOST
OVH_USER
OVH_SSH_KEY
```

The workflow excludes repo metadata, GitHub workflow files, environment files, README and docs from the remote deployment.
