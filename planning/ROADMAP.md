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

## v2 — Extensions

Persistent in-game shop (always accessible, purchase locks trading for the day) with upgradeable item tiers across four categories. Tiers must be bought in order; prices scale up per tier. Full design: `planning/superpowers/specs/2026-05-16-v2-extensions-roadmap-design.md`.

### v2.1 — Storage + Shop
Shop infrastructure + 4 storage tiers: pocket (5) → fanny pack (10) → satchel (20) → backpack (50).

### v2.2 — Tech
3 market intelligence tiers: pen & paper (direction indicator) → calculator (+ magnitude) → excel (+ historical average).

### v2.3 — Defense Passive
4-tier run-odds upgrade vs bullies: 50% → 60% → 70% → 80% → 90%. Never reaches 100%.

### v2.4 — Stealth Passive
5-tier catch-probability reduction vs teachers: ×1.0 → ×0.5 in 10% steps. Never reaches 0%.

### v2.5 — Smoke Bomb
Defense consumable: escape any bully encounter, +15 heat. Flavor implies consequences without stating them.

### v2.6 — Note from Mom
Stealth consumable (hold max 1): dismiss a teacher catch, but each use raises the chance the principal hears about it next turn. No candy when the principal visits → no strike, but heat spikes to max(75, current).
