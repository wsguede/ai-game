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
