# Candy Wars v1.6 — Design Spec

Date: 2026-05-12
Status: Approved

## Overview

Finalize v1 with a proper build pipeline, project conventions, and documentation. After v1.6 the game deploys to GitHub Pages from the `docs/` folder, new contributors (human or AI) have everything they need in structured docs, and the source tree follows standard Vite conventions.

No gameplay changes. No visual changes. All existing tests pass unchanged (path updates only).

---

## Feature 1: Vite Build Pipeline

### Goal

`npm run build` produces a self-contained `docs/` folder that GitHub Pages can serve directly. `npm run dev` gives hot-reload during development. No server required to play the built output.

### package.json

```json
{
  "name": "candy-wars",
  "version": "1.6.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "6.3.5"
  }
}
```

Pin the exact Vite version (no `^`) for reproducible builds.

### vite.config.js

```js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
```

`emptyOutDir: true` ensures `docs/` is clean before each build. The `docs/` folder is committed to git so GitHub Pages can serve it.

### src/main.js — barrel entry point

All source files are imported in dependency order. Each source file sets its export on `window` so the existing `onclick=` attribute handlers in `index.html` continue to work.

```js
import './data/candies.js';
import './data/locations.js';
import './data/events.js';
import './data/eras.js';
import './engine/state.js';
import './engine/market.js';
import './engine/heat.js';
import './engine/event-engine.js';
import './engine/ui.js';
import './engine/game.js';
```

### Window global pattern

Each source file must expose its top-level binding on `window` AND keep a local `var` so that same-file references (like `window.onload` in `game.js`) still work. Use the dual-assignment form for every declaration:

**Data files** (currently `var X = [...]` or `var X = {...}`):
```js
// Before
var CANDIES = [...];

// After
var CANDIES = window.CANDIES = [...];
```

**Engine files** (currently `var X = (function() { ... })()`):
```js
// Before
var Heat = (function() { ... })();

// After
var Heat = window.Heat = (function() { ... })();
```

**Cross-file references** — In module context, names from other files are not in scope. Any reference to another file's global must go through `window`:

```js
// eras.js referencing events.js globals
calendarEvents: {
  60: window.HALLOWEEN_SPIKE,
  61: window.HALLOWEEN_CRASH,
  ...
}
```

The import order in `main.js` guarantees each file's `window.X` is set before any file that depends on it runs.

Files to update:
- `src/data/candies.js` — `var CANDIES = window.CANDIES = [...]`
- `src/data/locations.js` — `var LOCATIONS = window.LOCATIONS = [...]`
- `src/data/events.js` — `var HALLOWEEN_SPIKE = window.HALLOWEEN_SPIKE = {...}` (and HALLOWEEN_CRASH, VALENTINES_SURGE, SPRING_BREAK, EVENTS)
- `src/data/eras.js` — `var ERA_V1 = window.ERA_V1 = {...}` + all `calendarEvents` references use `window.X`
- `src/engine/state.js` — `var State = window.State = (function() {...})()`
- `src/engine/market.js` — `var Market = window.Market = (function() {...})()`
- `src/engine/heat.js` — `var Heat = window.Heat = (function() {...})()`
- `src/engine/event-engine.js` — `var EventEngine = window.EventEngine = (function() {...})()`
- `src/engine/ui.js` — `var UI = window.UI = (function() {...})()`
- `src/engine/game.js` — `var Game = window.Game = (function() {...})()`

### index.html script tag change

Replace all individual `<script src="...">` tags with a single module entry:

```html
<!-- Remove these -->
<script src="data/candies.js"></script>
<script src="data/locations.js"></script>
<!-- ... all current script tags ... -->

<!-- Replace with -->
<script type="module" src="src/main.js"></script>
```

### tests/index.html path updates

The test harness references engine and data files directly. Update paths from `../engine/` and `../data/` to `../src/engine/` and `../src/data/`.

### .nvmrc

```
22
```

Node 22 LTS. fnm and nvm read this file and auto-switch on `cd`.

### .gitignore

```
node_modules/
.DS_Store
*.local
.vite/
```

`docs/` is intentionally NOT gitignored — it must be committed for GitHub Pages.

---

## Feature 2: HTML Semantics

Light structural pass on `index.html`. No visual or layout changes.

| Element | Change |
|---------|--------|
| `<div id="game">` | Wrap contents in `<main>` |
| `.title-bar` div | Change to `<header>` |
| `#trade-modal`, `#end-screen`, `#intro-modal` overlays | Add `role="dialog"` and `aria-modal="true"` |
| Modal close/cancel buttons | Add `aria-label="Close"` |
| LAY LOW, END TURN action buttons | Add descriptive `aria-label` where the label text alone isn't sufficient |

---

## Feature 3: Directory Restructure

### Source files move into src/

```
engine/ → src/engine/
data/   → src/data/
```

`index.html` stays at the repo root (Vite entry point).

### Planning docs move out of docs/

`docs/superpowers/` moves to `planning/superpowers/` so Vite can cleanly own `docs/`.

```
docs/superpowers/plans/  → planning/superpowers/plans/
docs/superpowers/specs/  → planning/superpowers/specs/
```

### Final directory layout

```
/
├── index.html
├── src/
│   ├── main.js
│   ├── engine/
│   │   ├── event-engine.js
│   │   ├── game.js
│   │   ├── heat.js
│   │   ├── market.js
│   │   ├── state.js
│   │   └── ui.js
│   └── data/
│       ├── candies.js
│       ├── eras.js
│       ├── events.js
│       └── locations.js
├── tests/
│   ├── index.html
│   └── test-heat.js
├── docs/                        ← Vite build output, GitHub Pages
├── planning/
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── ROADMAP.md
│   ├── WORKFLOW.md
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── .gitignore
├── .nvmrc
├── CHANGELOG.md
├── CLAUDE.md
├── LICENSE
├── README.md
├── package.json
└── vite.config.js
```

---

## Feature 4: Documentation

### README.md

Covers: what the game is, how to open it (double-click `docs/index.html`), dev setup (`npm install` + `npm run dev`), build (`npm run build` → commits `docs/`), and GitHub Pages deploy instructions.

### LICENSE

MIT license. Copyright wsguede.

### CLAUDE.md

AI-assistant context file covering:
- Tech stack: vanilla JS, IIFE + `window` globals, plain HTML/CSS, Vite build
- Source layout: `src/engine/`, `src/data/`, `index.html` at root
- Test harness: open `tests/index.html` in a browser — no CLI test runner
- Build: `npm run build` → `docs/` → commit for GitHub Pages
- Git workflow: GitHub Flow (feature branches off `main`, merge via PR)
- Commit standard: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
- Planning docs: `planning/superpowers/specs/` for design specs, `planning/superpowers/plans/` for implementation plans
- No framework, no bundler assumptions beyond Vite, no TypeScript

### CHANGELOG.md

Root-level changelog with entries for v1.0 through v1.6 summarising what each version delivered.

### planning/ARCHITECTURE.md

Covers: module structure, IIFE + window global pattern and why it exists, load order requirements, data/engine/ui layer separation, data flow (State → Market → Heat → EventEngine → UI), test harness design (direct import of engine files, browser-only).

### planning/DESIGN.md

Covers: color palette (`#0d0d0d` background, `#ffdd00` primary accent, `#4cff72` green/positive, `#ff4444` red/negative, `#4ecdc4` cyan/neutral, `#aaa` muted), typography (Courier New monospace throughout, 13px base), CSS conventions (no framework, BEM-lite class names, tooltip pattern via `:hover + .tooltip`), event box types and their color meanings.

### planning/WORKFLOW.md

Covers: GitHub Flow branching (feature branches off `main`, short-lived, merge via PR or direct merge for solo work), Conventional Commits spec with allowed types and examples, commit message rules (imperative mood, ≤72 chars subject line), PR description template.

### planning/ROADMAP.md

Covers: v1.x feature history (v1.0 core game, v1.1 QoL/balance, v1.2 events, v1.3 market depth, v1.4 UI overhaul, v1.5 heat reform, v1.6 infrastructure), v2 direction (to be defined in brainstorm).

---

## Files Changed Summary

| Action | File |
|--------|------|
| Create | `package.json` |
| Create | `vite.config.js` |
| Create | `src/main.js` |
| Create | `.nvmrc` |
| Create | `.gitignore` |
| Create | `LICENSE` |
| Create | `README.md` |
| Create | `CLAUDE.md` |
| Create | `CHANGELOG.md` |
| Create | `planning/ARCHITECTURE.md` |
| Create | `planning/DESIGN.md` |
| Create | `planning/WORKFLOW.md` |
| Create | `planning/ROADMAP.md` |
| Move | `engine/*` → `src/engine/*` |
| Move | `data/*` → `src/data/*` |
| Move | `docs/superpowers/` → `planning/superpowers/` |
| Modify | `index.html` (script tag + semantics) |
| Modify | `tests/index.html` (path updates) |
| Modify | All 11 source files (`window.X =` prefix) |
