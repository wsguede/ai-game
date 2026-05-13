# Candy Wars v1.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul project structure — Vite build pipeline, src/ layout, semantic HTML, and full documentation — so the game deploys to GitHub Pages and is ready for v2 development.

**Architecture:** Ten sequential tasks. Tasks 1–3 are scaffolding and file moves. Tasks 4–6 wire up the Vite module system (window global pattern + barrel entry point). Task 7 produces and verifies the build output. Tasks 8–10 are documentation and HTML polish. Each task commits independently; the game stays playable throughout.

**Tech Stack:** Vanilla JS, IIFE + window globals, plain HTML/CSS, Vite 6.x (dev dependency only). No framework, no TypeScript.

---

### Task 1: Project scaffolding — package.json, vite.config.js, .nvmrc, .gitignore

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `.nvmrc`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

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

Note: use exact version, no `^`. If `6.3.5` is not available, use the current latest stable Vite 6.x patch (`npm info vite version` to check).

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 3: Create `.nvmrc`**

```
22
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
.DS_Store
*.local
.vite/
```

`docs/` is intentionally NOT listed — it must be committed for GitHub Pages.

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` created.

- [ ] **Step 6: Verify Vite is installed**

```bash
npx vite --version
```

Expected: prints `vite/6.x.x` (or similar). Any `6.x.x` is fine.

- [ ] **Step 7: Commit**

```bash
git add package.json vite.config.js .nvmrc .gitignore package-lock.json
git commit -m "chore: add Vite build pipeline and project scaffolding"
```

---

### Task 2: Move source files into src/ and update script paths

**Files:**
- Move: `engine/*` → `src/engine/*`
- Move: `data/*` → `src/data/*`
- Modify: `index.html` (script src paths)
- Modify: `tests/index.html` (script src paths)

- [ ] **Step 1: Create src/ and move engine and data**

```bash
mkdir src
git mv engine src/engine
git mv data src/data
```

Expected: `src/engine/` and `src/data/` now exist; old `engine/` and `data/` are gone.

- [ ] **Step 2: Update script paths in `index.html`**

Find the script block at the bottom of `index.html` (currently `<!-- Data -->` and `<!-- Engine -->`). Replace:

```html
  <!-- Data -->
  <script src="data/candies.js"></script>
  <script src="data/locations.js"></script>
  <script src="data/events.js"></script>
  <script src="data/eras.js"></script>
  <!-- Engine -->
  <script src="engine/state.js"></script>
  <script src="engine/market.js"></script>
  <script src="engine/heat.js"></script>
  <script src="engine/event-engine.js"></script>
  <script src="engine/ui.js"></script>
  <!-- Game loop -->
  <script src="engine/game.js"></script>
```

With:

```html
  <!-- Data -->
  <script src="src/data/candies.js"></script>
  <script src="src/data/locations.js"></script>
  <script src="src/data/events.js"></script>
  <script src="src/data/eras.js"></script>
  <!-- Engine -->
  <script src="src/engine/state.js"></script>
  <script src="src/engine/market.js"></script>
  <script src="src/engine/heat.js"></script>
  <script src="src/engine/event-engine.js"></script>
  <script src="src/engine/ui.js"></script>
  <!-- Game loop -->
  <script src="src/engine/game.js"></script>
```

- [ ] **Step 3: Update script paths in `tests/index.html`**

Replace the data and engine script blocks:

```html
  <!-- Data -->
  <script src="../data/candies.js"></script>
  <script src="../data/locations.js"></script>
  <script src="../data/events.js"></script>
  <script src="../data/eras.js"></script>
  <!-- Engine (no ui.js — DOM not needed for logic tests) -->
  <script src="../engine/state.js"></script>
  <script src="../engine/market.js"></script>
  <script src="../engine/heat.js"></script>
  <script src="../engine/event-engine.js"></script>
```

With:

```html
  <!-- Data -->
  <script src="../src/data/candies.js"></script>
  <script src="../src/data/locations.js"></script>
  <script src="../src/data/events.js"></script>
  <script src="../src/data/eras.js"></script>
  <!-- Engine (no ui.js — DOM not needed for logic tests) -->
  <script src="../src/engine/state.js"></script>
  <script src="../src/engine/market.js"></script>
  <script src="../src/engine/heat.js"></script>
  <script src="../src/engine/event-engine.js"></script>
```

- [ ] **Step 4: Verify game works in browser**

Open `index.html` directly in a browser (double-click or `file://` URL). Start a new game. Click through the intro. Make a trade. End a turn. Browser console must show zero errors.

- [ ] **Step 5: Verify tests pass**

Open `tests/index.html` in a browser. All tests must show ✓. Zero console errors.

- [ ] **Step 6: Commit**

```bash
git add src/ index.html tests/index.html
git commit -m "refactor: move engine and data files into src/"
```

---

### Task 3: Move planning docs out of docs/

**Files:**
- Move: `docs/superpowers/` → `planning/superpowers/`

This frees `docs/` for exclusive use as Vite's build output directory.

- [ ] **Step 1: Move planning docs**

```bash
git mv docs/superpowers planning/superpowers
```

Expected: `planning/superpowers/plans/` and `planning/superpowers/specs/` now exist. `docs/` is now empty (or absent).

- [ ] **Step 2: Verify**

```bash
ls planning/superpowers/plans/
ls planning/superpowers/specs/
```

Expected: plan and spec files are present under `planning/`.

- [ ] **Step 3: Commit**

```bash
git add planning/ docs/
git commit -m "refactor: move planning docs from docs/superpowers to planning/superpowers"
```

---

### Task 4: Window global pattern — data files

**Context:** In the next task we switch `index.html` to a `type="module"` entry point. In module context, `var X = ...` is module-scoped — not `window.X`. The game's `onclick=` handlers call `Game.travel()`, `Game.endTurn()` etc. which requires `window.Game`. We also have cross-file references in `eras.js` that need `window.X`. This task updates all data files to use `var X = window.X = ...` (dual assignment: local scope + window).

**Files:**
- Modify: `src/data/candies.js`
- Modify: `src/data/locations.js`
- Modify: `src/data/events.js`
- Modify: `src/data/eras.js`

- [ ] **Step 1: Update `src/data/candies.js`**

Change the first line from:
```js
var CANDIES = [
```
To:
```js
var CANDIES = window.CANDIES = [
```

The rest of the file is unchanged.

- [ ] **Step 2: Update `src/data/locations.js`**

Change the first line from:
```js
var LOCATIONS = [
```
To:
```js
var LOCATIONS = window.LOCATIONS = [
```

The rest of the file is unchanged.

- [ ] **Step 3: Update `src/data/events.js`**

Five globals need the dual assignment. Change each declaration:

```js
// Line 2
var HALLOWEEN_SPIKE = window.HALLOWEEN_SPIKE = {
// Line 10
var HALLOWEEN_CRASH = window.HALLOWEEN_CRASH = {
// Line 17
var VALENTINES_SURGE = window.VALENTINES_SURGE = {
// Line 24
var SPRING_BREAK = window.SPRING_BREAK = {
// Line 33
var EVENTS = window.EVENTS = [
```

Each change is just adding `window.X = ` between `var X` and `= {` or `= [`. The rest of the file (object contents, function bodies inside events) is unchanged.

- [ ] **Step 4: Update `src/data/eras.js`**

`eras.js` references `CANDIES`, `LOCATIONS`, `EVENTS`, and the four calendar event objects from `events.js`. In module context these cross-file names are not in scope — they must be `window.X`. Replace the entire file with:

```js
var ERA_V1 = window.ERA_V1 = {
  id: 'elementary',
  name: 'ELEMENTARY SCHOOL',
  candies: window.CANDIES,
  locations: window.LOCATIONS,
  events: window.EVENTS,
  maxTurns: 180,
  startingCash: 10.00,
  stashCapacity: 30,
  calendarEvents: {
    40:  window.HALLOWEEN_SPIKE,
    41:  window.HALLOWEEN_CRASH,
    98:  window.VALENTINES_SURGE,
    135: window.SPRING_BREAK,
  },
  lossMessage: "Detention. No recess for a week. Summer is going to suck.",
};
```

- [ ] **Step 5: Verify game still works**

Open `index.html` in a browser. The script tags still load files individually (module switch happens in Task 6), so `var X = window.X = ...` is backward-compatible. Game must load and play without console errors.

- [ ] **Step 6: Verify tests still pass**

Open `tests/index.html`. All tests ✓, zero console errors.

- [ ] **Step 7: Commit**

```bash
git add src/data/
git commit -m "refactor: add window globals to data files for Vite module compatibility"
```

---

### Task 5: Window global pattern — engine files

**Context:** Same as Task 4 but for engine files. Engine IIFEs have cross-file dependencies (e.g. `game.js` calls `State.get()`, `Heat.decay()` etc.). In module context these names are not in scope. The fix: add a capture block at the top of each IIFE that grabs each dependency from `window` once, at IIFE execution time. All existing function bodies remain unchanged.

**Files:**
- Modify: `src/engine/state.js`
- Modify: `src/engine/market.js`
- Modify: `src/engine/heat.js`
- Modify: `src/engine/event-engine.js`
- Modify: `src/engine/ui.js`
- Modify: `src/engine/game.js`

- [ ] **Step 1: Update `src/engine/state.js`**

Change the first line from:
```js
var State = (function() {
```
To:
```js
var State = window.State = (function() {
  var Market = window.Market;
```

`Market` is used inside `State.init()` to compute `initialSeenPrices`. No other cross-file references exist in this file.

- [ ] **Step 2: Update `src/engine/market.js`**

Change the first line from:
```js
var Market = (function() {
```
To:
```js
var Market = window.Market = (function() {
```

`market.js` has no cross-file dependencies — it's pure functions. No capture block needed.

- [ ] **Step 3: Update `src/engine/heat.js`**

Change the first line from:
```js
var Heat = (function() {
```
To:
```js
var Heat = window.Heat = (function() {
```

`heat.js` has no cross-file dependencies. No capture block needed.

- [ ] **Step 4: Update `src/engine/event-engine.js`**

Change the first line from:
```js
var EventEngine = (function() {
```
To:
```js
var EventEngine = window.EventEngine = (function() {
  var State = window.State;
  var Heat = window.Heat;
```

`event-engine.js` calls `State.stashTotal()`, `Heat.teacherChance()`, `Heat.bullyChance()`, `Heat.stashRiskValue()`, `Heat.resolveTeacherCatch()`, and `Heat.applyTeacherCatch()`. All are captured via the two lines above — no other changes needed in the function bodies.

- [ ] **Step 5: Update `src/engine/ui.js`**

Change the first line from:
```js
var UI = (function() {
```
To:
```js
var UI = window.UI = (function() {
  var Market = window.Market;
```

`ui.js` calls `Market.getPriceBreakdown()`, `Market.getLocationPrice()`, and `Market.getPriceTrend()`. All captured via the one line above.

- [ ] **Step 6: Update `src/engine/game.js`**

Change the first line from:
```js
var Game = (function() {
```
To:
```js
var Game = window.Game = (function() {
  var State = window.State;
  var Market = window.Market;
  var Heat = window.Heat;
  var EventEngine = window.EventEngine;
  var UI = window.UI;
  var ERA_V1 = window.ERA_V1;
```

`game.js` references all other modules plus `ERA_V1` (in `init()`). The capture block above covers everything. The `window.onload` line at the bottom of the file stays unchanged — `Game` is still a local `var` in the file scope so `Game.init()` works.

- [ ] **Step 7: Verify game still works**

Open `index.html` in a browser. The individual `<script src="src/...">` tags are still in place, so the game runs without Vite. Play a full turn. Zero console errors.

- [ ] **Step 8: Verify tests still pass**

Open `tests/index.html`. All tests ✓.

- [ ] **Step 9: Commit**

```bash
git add src/engine/
git commit -m "refactor: add window globals to engine files for Vite module compatibility"
```

---

### Task 6: Create src/main.js and switch index.html to Vite module entry

**Files:**
- Create: `src/main.js`
- Modify: `index.html` (replace individual script tags with single module entry)

- [ ] **Step 1: Create `src/main.js`**

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

Order is the dependency order: data first, then engine in ascending dependency level. `eras.js` depends on the other data files; `state.js` depends on `market.js`; `event-engine.js` depends on `state.js` and `heat.js`; `game.js` depends on everything.

- [ ] **Step 2: Update `index.html` to use the module entry**

Find the script block at the bottom of `index.html` and replace all script tags with a single module entry:

```html
  <!-- Data -->
  <script src="src/data/candies.js"></script>
  <script src="src/data/locations.js"></script>
  <script src="src/data/events.js"></script>
  <script src="src/data/eras.js"></script>
  <!-- Engine -->
  <script src="src/engine/state.js"></script>
  <script src="src/engine/market.js"></script>
  <script src="src/engine/heat.js"></script>
  <script src="src/engine/event-engine.js"></script>
  <script src="src/engine/ui.js"></script>
  <!-- Game loop -->
  <script src="src/engine/game.js"></script>
```

Replace with:

```html
  <script type="module" src="src/main.js"></script>
```

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Expected: Vite starts, prints a local URL (typically `http://localhost:5173`).

Open the URL in a browser. Click through the intro. Make a trade. End a turn. Browser console must show zero errors.

Note: `tests/index.html` still loads files via individual `<script src="../src/...">` tags and is unaffected by this change.

- [ ] **Step 4: Commit**

```bash
git add src/main.js index.html
git commit -m "chore: wire Vite entry point — src/main.js barrel, single module script tag"
```

---

### Task 7: Build and commit docs/

**Files:**
- Generated: `docs/` (Vite build output)

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: `docs/` folder created containing `index.html` and `assets/` subfolder. Zero build errors.

- [ ] **Step 2: Verify the built output works**

Open `docs/index.html` directly in a browser using a `file://` URL (double-click the file or drag it into the browser). No server needed.

Click through the intro. Make a trade. End a turn. Browser console must show zero errors.

- [ ] **Step 3: Commit docs/**

```bash
git add docs/
git commit -m "chore: initial build output — docs/ for GitHub Pages"
```

---

### Task 8: HTML semantics and UI text fix

**Files:**
- Modify: `index.html`
- Modify: `src/engine/ui.js`

**Context:** Light semantic HTML pass — no visual or layout changes. Also fixing a text bug: the LAY LOW button label still says "−20 heat" but v1.5 changed the reduction to −10.

- [ ] **Step 1: Fix LAY LOW button label in `src/engine/ui.js`**

In `renderActions()`, find:
```js
      html = '<button class="action-btn" onclick="Game.layLow()">LAY LOW (−20 heat)</button>';
```

Change to:
```js
      html = '<button class="action-btn" onclick="Game.layLow()">LAY LOW (−10 heat)</button>';
```

- [ ] **Step 2: Update `index.html` — game wrapper**

Find:
```html
    <div id="game">
```
Change to:
```html
    <main id="game">
```

And find the matching closing tag:
```html
    </div>

  <!-- Buy/Sell Modal -->
```
Change to:
```html
    </main>

  <!-- Buy/Sell Modal -->
```

- [ ] **Step 3: Update `index.html` — title bar**

Find:
```html
    <div class="title-bar">★ CANDY WARS ★</div>
```
Change to:
```html
    <header class="title-bar">★ CANDY WARS ★</header>
```

- [ ] **Step 4: Update `index.html` — modal dialog roles**

For each of the three modal overlays, add `role="dialog"` and `aria-modal="true"`.

Find:
```html
  <div id="trade-modal" class="modal-overlay">
```
Change to:
```html
  <div id="trade-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Trade candy">
```

Find:
```html
  <div id="end-screen" class="screen-overlay">
```
Change to:
```html
  <div id="end-screen" class="screen-overlay" role="dialog" aria-modal="true" aria-label="Game over">
```

Find:
```html
  <div id="intro-modal" class="modal-overlay">
```
Change to:
```html
  <div id="intro-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Welcome to Candy Wars">
```

- [ ] **Step 5: Update `index.html` — modal cancel button aria-label**

Find:
```html
        <button class="action-btn" id="modal-cancel">CANCEL</button>
```
Change to:
```html
        <button class="action-btn" id="modal-cancel" aria-label="Cancel trade">CANCEL</button>
```

- [ ] **Step 6: Verify in browser**

```bash
npm run dev
```

Open the dev URL. Confirm:
- No visual changes whatsoever
- LAY LOW button now reads "LAY LOW (−10 heat)"
- Zero console errors

- [ ] **Step 7: Commit**

```bash
git add index.html src/engine/ui.js
git commit -m "fix: LAY LOW label -20 → -10; semantic HTML pass on index.html"
```

---

### Task 9: Root documentation — README, LICENSE, CLAUDE.md, CHANGELOG

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `CLAUDE.md`
- Create: `CHANGELOG.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Candy Wars

A browser-based trading game. Buy candy cheap, sell it high, and don't let Mrs. Henderson catch you. You've got 180 school days to make as much cash as possible before summer.

## Play

Open `docs/index.html` directly in your browser — no server needed.

## Develop

```bash
node --version  # should be 22.x (fnm/nvm auto-switch via .nvmrc)
npm install
npm run dev     # http://localhost:5173, hot reload
```

## Build

```bash
npm run build   # produces docs/
git add docs/
git commit -m "chore: build"
git push
```

`docs/` is committed to git and served by GitHub Pages.

## Test

Open `tests/index.html` in a browser. No CLI runner — tests run directly in the page. All tests must show ✓.

## Project Structure

```
src/
  data/          — static game data (candies, locations, events, eras)
  engine/        — game logic (state, market, heat, event-engine, ui, game)
  main.js        — barrel: imports all source files in dependency order
index.html       — Vite entry point; all HTML + CSS; onclick= handlers call window.Game.*
tests/           — browser-only test harness
docs/            — Vite build output, committed for GitHub Pages
planning/        — design specs, implementation plans, architecture and workflow docs
```

See `planning/ARCHITECTURE.md` for codebase internals and `planning/WORKFLOW.md` for git conventions.

## License

MIT — see `LICENSE`.
```

- [ ] **Step 2: Create `LICENSE`**

```
MIT License

Copyright (c) 2026 wsguede

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Create `CLAUDE.md`**

```markdown
# Candy Wars — Claude Context

## Project
Browser-based trading game. Buy low, sell high, avoid teachers and bullies across 180 school days. Score = final cash at the end of the school year.

## Tech Stack
- Vanilla JS — no framework, no TypeScript, no runtime npm dependencies
- IIFE + window globals — each module: `var X = window.X = (function() { ... })()`
- HTML/CSS — all styles inline in `index.html`; no preprocessors
- Vite — build tool only (`npm run dev` for dev, `npm run build` → `docs/`)

## Source Layout
```
src/
  data/          — static config (CANDIES, LOCATIONS, EVENTS, ERA_V1)
  engine/        — game logic (State, Market, Heat, EventEngine, UI, Game)
  main.js        — barrel: imports all source files in dependency order
index.html       — Vite entry point; all HTML + CSS
tests/           — browser-only test harness (open tests/index.html, no CLI runner)
docs/            — Vite build output; committed to git; served by GitHub Pages
planning/        — design specs, implementation plans, architecture docs
```

## Window Global Pattern
Each source file uses dual assignment so the binding is available both in the module's own scope and on `window`:
```js
var Heat = window.Heat = (function() { ... })();
```
Cross-file dependencies are captured at the top of each IIFE:
```js
var Game = window.Game = (function() {
  var State = window.State;
  var Heat  = window.Heat;
  // rest of Game unchanged — function bodies reference State and Heat directly
})();
```
Data file `eras.js` uses `window.CANDIES`, `window.LOCATIONS` etc. directly since it's a plain object, not an IIFE.

## Load Order (enforced by src/main.js)
`candies → locations → events → eras → state → market → heat → event-engine → ui → game`

## Test Harness
Open `tests/index.html` in a browser. No CLI runner. Helpers: `test()`, `assertEqual()`, `assertTrue()`, `assertClose()`. Heat, Market, State, and EventEngine have automated tests. UI and Game are verified manually in the browser.

## Build and Deploy
```bash
npm run dev      # Vite dev server with hot reload
npm run build    # builds to docs/ — commit this folder for GitHub Pages
npm run preview  # preview built output locally
```
After `npm run build`, commit `docs/` and push to deploy.

## Git Workflow
GitHub Flow: feature branches off `main`, merge via PR (or direct commit for solo/trivial work). `main` is always deployable.

Conventional Commits: `feat:` `fix:` `docs:` `chore:` `refactor:` `test:`
Subject line: imperative mood, ≤72 chars, no trailing period.

## Planning Docs
- Design specs: `planning/superpowers/specs/YYYY-MM-DD-<name>-design.md`
- Implementation plans: `planning/superpowers/plans/YYYY-MM-DD-<name>.md`
- Architecture: `planning/ARCHITECTURE.md`
- Design system: `planning/DESIGN.md`
- Workflow: `planning/WORKFLOW.md`
- Roadmap: `planning/ROADMAP.md`
```

- [ ] **Step 4: Create `CHANGELOG.md`**

```markdown
# Changelog

## v1.6 — 2026-05-12 — Infrastructure
- Vite build pipeline: `npm run build` → `docs/` for GitHub Pages
- Source files moved to `src/engine/` and `src/data/`
- Planning docs moved from `docs/superpowers/` to `planning/superpowers/`
- Semantic HTML: `<main>`, `<header>`, `role="dialog"`, `aria-modal`, `aria-label`
- Fixed: LAY LOW button label corrected from −20 to −10 (v1.5 regression)
- Added: `CLAUDE.md`, `README.md`, `LICENSE`, `CHANGELOG.md`
- Added: `planning/ARCHITECTURE.md`, `planning/DESIGN.md`, `planning/WORKFLOW.md`, `planning/ROADMAP.md`
- Added: `.nvmrc` (Node 22), `.gitignore`

## v1.5 — 2026-05-12 — Heat Reform
- Passive heat decay slowed: 5 → 2 per turn
- Library heat decay bonus: +10 → +3 (~2.5× baseline instead of 6×)
- Two-stage teacher resolution: encounter fires as before, then `heat/100` determines catch
- Suspicious close-call event when teacher fires but doesn't catch (heat > 0)
- Silent resolution when teacher fires at heat = 0
- Lay Low heat reduction: −20 → −10

## v1.4 — 2026-05-12 — UI Overhaul
- Removed top status bar row
- Market table headers: emoji labels + live cash and bag-used values
- Heat pips and principal dots moved inline below calendar bar with hover tooltips

## v1.3 — 2026-05-11 — Market Polish
- Fixed trend indicator: now compares vs actual last-seen location-adjusted price
- Single context-sensitive action button: LAY LOW before trading, END TURN after
- Probable events: no teacher when stash is empty; no threats after laying low
- Debug mode: price breakdown tooltip on hover via `?debug` query param

## v1.2 — 2026-05-10 — Polish
- Emoji labels in status bar
- Day 1 protection: no negative events on the first turn
- Startup intro dialog with game premise and rules

## v1.1 — 2026-05-10 — QoL + Balance
- Quality-of-life improvements and balance tuning from playtesting
- Various bug fixes

## v1.0 — 2026-05-10 — Initial Release
- Core trading loop: buy and sell candy across 5 school locations over 180 turns
- 9 candy types across 3 risk tiers (low/med/high volatility)
- Heat system: accumulates on trades, affects teacher and bully encounter probability
- Teacher events: confiscation + principal visit counter (3 strikes → game over)
- Bully events: pay $5 / run (50-50) / accept rob
- Calendar events: Halloween spike/crash, Valentine's Day surge, Spring Break
- Random event pool: bulk deals, intel tips, flavor events
- Allowance: $5 every 5 days
```

- [ ] **Step 5: Commit**

```bash
git add README.md LICENSE CLAUDE.md CHANGELOG.md
git commit -m "docs: add README, LICENSE, CLAUDE.md, CHANGELOG"
```

---

### Task 10: Planning documentation — ARCHITECTURE, DESIGN, WORKFLOW, ROADMAP

**Files:**
- Create: `planning/ARCHITECTURE.md`
- Create: `planning/DESIGN.md`
- Create: `planning/WORKFLOW.md`
- Create: `planning/ROADMAP.md`

- [ ] **Step 1: Create `planning/ARCHITECTURE.md`**

```markdown
# Architecture

## Module Structure

The game uses the IIFE (Immediately Invoked Function Expression) pattern with explicit `window` globals. Each file defines its module once, closes over private state, and exposes a public API via its return value. The dual-assignment pattern makes each export available both locally (for same-file references) and globally (for `onclick=` handlers and cross-module calls):

```js
var Heat = window.Heat = (function() {
  // private state and helpers
  function decay(currentHeat, location) { ... }
  return { decay: decay, ... };
})();
```

Cross-file dependencies are captured at the top of each IIFE so function bodies don't need `window.X` prefixes:

```js
var Game = window.Game = (function() {
  var State = window.State;
  var Heat  = window.Heat;
  // function bodies reference State and Heat directly — no window. needed
})();
```

## Load Order

Modules must load in dependency order. `src/main.js` enforces this:

```
data/candies.js       → CANDIES (no deps)
data/locations.js     → LOCATIONS (no deps)
data/events.js        → EVENTS, calendar event objects (no deps)
data/eras.js          → ERA_V1 (depends on CANDIES, LOCATIONS, EVENTS, calendar objects)
engine/state.js       → State (depends on Market at call time)
engine/market.js      → Market (no deps — pure functions)
engine/heat.js        → Heat (no deps — pure functions)
engine/event-engine.js → EventEngine (depends on State, Heat)
engine/ui.js          → UI (depends on Market)
engine/game.js        → Game (depends on all of the above + ERA_V1)
```

## Layer Separation

**Data layer** (`src/data/`): Static configuration only. Plain objects and arrays. No behavior. Loaded first.

**Engine layer** (`src/engine/`): All game logic. Clear single responsibilities:

| Module | Responsibility |
|--------|---------------|
| `state.js` | Single source of truth for all mutable game state. Mutation helpers (addToStash, removeFromStash, etc.) |
| `market.js` | Price calculation: volatility drift, location modifiers, active effects, price breakdown for debug mode |
| `heat.js` | Heat generation (per trade), decay (per turn), teacher/bully encounter probability, outcome resolution |
| `event-engine.js` | Event selection (probability + eligibility filter) and effect execution |
| `ui.js` | All DOM rendering. Reads state, produces HTML. Never mutates state. |
| `game.js` | Player action handlers (endTurn, travel, layLow, openTrade, etc.). Orchestrates engine calls and triggers UI.render(). |

**Entry point** (`index.html`): All CSS lives here. Game HTML structure. `onclick=` handlers call into `window.Game.*`.

## Data Flow

```
Player action (onclick=)
  → Game.action()
    → mutates State via State.* or direct property assignment
    → calls Heat.* / Market.* / EventEngine.* as needed
    → calls UI.render(State.get())
      → reads state, writes DOM
```

## Test Harness

`tests/index.html` loads engine and data files via individual `<script src="../src/...">` tags (not via `src/main.js`) and runs synchronous unit tests in the browser. Test helpers (`test`, `assertEqual`, `assertTrue`, `assertClose`) are defined inline. Tests for Heat, Market, State, and EventEngine exist. UI and Game have no automated tests — verified manually in the browser.
```

- [ ] **Step 2: Create `planning/DESIGN.md`**

```markdown
# Frontend Design

## Color Palette

| Role | Value | Usage |
|------|-------|-------|
| Background | `#0d0d0d` | Page background |
| Primary accent | `#ffdd00` | Section headers, borders, buttons, highlights |
| Positive / green | `#4cff72` | Cash, gains, passing tests |
| Negative / red | `#ff4444` | Heat (high), teacher events, failures |
| Neutral / cyan | `#4ecdc4` | Intel events, neutral info |
| Warning / orange | `#ffa500` | Market events, mid-heat warning |
| Muted text | `#aaa` | Secondary labels, inactive states |
| Subtle borders | `#333` / `#222` | Dividers, container edges |
| Card backgrounds | `#1a1a1a` / `#141414` | Modals, tooltips, event boxes |

## Typography

- Font: `'Courier New', Courier, monospace` — everywhere, no exceptions
- Base: 13px body
- Labels and section headers: 10–11px, `letter-spacing: 2–4px`, ALL CAPS
- No font-weight variation except bold for notification strong tags

## Event Box Types

Each event type uses a distinct color scheme via the `cssClass` property:

| cssClass | Border | Background | Text | Use case |
|----------|--------|------------|------|----------|
| *(default/threat)* | `#ff4444` | `#1a0a0a` | `#ff8888` | Teacher caught, bully alert, suspicious close-call |
| `intel` | `#4ecdc4` | `#0a1a1a` | `#7ed9d4` | Tips and advance intel |
| `flavor` | `#444` | `#141414` | `#aaa` | Flavor text, neutral outcomes |
| `market` | `#ffa500` | `#1a1400` | `#ffcc88` | Calendar market events |

## Tooltip Pattern

CSS-only hover tooltips — no JavaScript. Parent has `position: relative`. Tooltip child has `display: none; position: absolute`. Parent `:hover` sibling rule sets `display: block`. Pointer events disabled on tooltip so hovering the tooltip itself doesn't cause flicker.

## Heat Display

10 pips (`div.heat-pip`). Each pip activates when `state.heat >= (i+1) * 10`. Color:
- `heat >= 70`: `.active` → `#ff4444` (red)
- `heat < 70`: `.warn` → `#ffa500` (orange)
- No heat: `#222` (dark)

## Button Conventions

- Standard: `.action-btn` — `#ffdd00` text, `#1a1a00` background, `#444` border
- Danger: `.action-btn.danger` — `#ff4444` text, `#1a0000` background
- Disabled: `opacity: 0.3; cursor: not-allowed`
- Active/selected: `.modal-btn-active` — `#2a2a00` background, `#ffdd00` border
```

- [ ] **Step 3: Create `planning/WORKFLOW.md`**

```markdown
# Git Workflow

## Branching — GitHub Flow

`main` is always deployable. All new work goes on a short-lived feature branch.

```
main
 └── feat/teacher-reform      ← branch off main
      └── [commits]
      └── merge → main        ← PR or direct merge
```

**Branch naming:**
- `feat/<name>` — new feature
- `fix/<name>` — bug fix
- `chore/<name>` — tooling, deps, build
- `docs/<name>` — documentation only

Delete the branch after merge.

## Commit Standard — Conventional Commits

Format:
```
<type>: <short description>

[optional body]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Allowed types:**

| Type | Use |
|------|-----|
| `feat:` | New feature or gameplay change |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Tooling, dependencies, build, config |
| `refactor:` | Code change with no behavior change |
| `test:` | Adding or updating tests |

**Subject line rules:**
- ≤72 characters
- Imperative mood: "add", "fix", "update" — not "added", "fixed", "updated"
- No trailing period
- Lowercase after the type prefix

**Examples:**
```
feat: two-stage teacher resolution — caught vs suspicious
fix: trend indicator shows change vs last seen price
docs: add v1.6 design spec — project structure overhaul
chore: add Vite build pipeline
refactor: move engine and data files into src/
test: add teacherCaught boundary tests
```

## PR Description Template

```markdown
## Summary
- [bullet describing what changed]
- [bullet describing why]

## Test Plan
- [ ] Open tests/index.html — all tests pass
- [ ] Open game in browser — plays correctly, zero console errors
- [ ] npm run build — docs/ produced, opens via file://

🤖 Generated with Claude Code
```

## Build Before Pushing

Always run `npm run build` and commit `docs/` before pushing a release to `main`. GitHub Pages serves from `docs/`.
```

- [ ] **Step 4: Create `planning/ROADMAP.md`**

```markdown
# Roadmap

## Released

### v1.0 — Core Game
Buy, sell, and move candy between 5 school locations over 180 turns to maximize cash before summer. 9 candy types across 3 risk tiers. Heat system affects teacher and bully encounter probability. Teacher events: confiscation + 3-strike principal system (game over). Bully events: pay $5 / run (50-50) / accept rob. Calendar events: Halloween spike/crash, Valentine's Day surge, Spring Break. Random pool: bulk deals, intel tips, flavor events. Allowance: $5 every 5 days.

### v1.1 — QoL + Balance
Playtesting fixes: balance tuning, quality-of-life improvements, bug fixes.

### v1.2 — Polish
Emoji labels in status bar. Day 1 protection (no negative events on the first turn). Startup intro dialog with game premise and rules.

### v1.3 — Market Polish
Fixed trend indicator: compares vs actual last-seen location-adjusted price instead of a synthetic baseline the player never saw. Single context-sensitive action button: LAY LOW before any trade, END TURN after. Probable events: no teacher when stash is empty; no threats after laying low. Debug mode: price breakdown tooltip on hover via `?debug` query param.

### v1.4 — UI Overhaul
Removed standalone status bar. Cash and bag-used moved into market table headers. Heat pips and principal dot counter moved inline below the calendar bar with hover tooltips.

### v1.5 — Heat Reform
Passive heat decay slowed: 5 → 2 per turn. Library bonus scaled down: +10 → +3 (~2.5× baseline). Two-stage teacher resolution: encounter fires at existing probability, then `heat/100` determines whether teacher actually catches you. Suspicious close-call flavor event when not caught at heat > 0. Silent resolution at heat = 0. Lay Low: −20 → −10.

### v1.6 — Infrastructure
Vite build pipeline (`npm run build` → `docs/` for GitHub Pages). Source into `src/`. Planning docs into `planning/`. Semantic HTML pass. CLAUDE.md, README, LICENSE, CHANGELOG, architecture/design/workflow docs.

---

## v2 — TBD

Direction to be defined in the next brainstorm session.
```

- [ ] **Step 5: Commit**

```bash
git add planning/ARCHITECTURE.md planning/DESIGN.md planning/WORKFLOW.md planning/ROADMAP.md
git commit -m "docs: add architecture, design, workflow, and roadmap to planning/"
```
