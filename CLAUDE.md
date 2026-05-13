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
docs/            — Vite build output (gitignored — CI deploys to pages branch)
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
npm run build    # builds to docs/ locally (gitignored — do not commit)
npm run preview  # preview built output locally
npm test         # run Vitest unit tests
npm run lint     # run ESLint on src/
```
Push to `main` to trigger CI/CD. GitHub Actions runs tests, lint, build, and deploys `docs/` to the `pages` branch automatically.

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
