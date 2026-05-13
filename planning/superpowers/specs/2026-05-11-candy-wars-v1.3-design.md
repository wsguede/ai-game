# Candy Wars v1.3 — Design Spec

Date: 2026-05-11
Status: Approved

## Overview

Four targeted improvements discovered during v1.2 playtesting. No new mechanics — the focus is on fixing a misleading price indicator, tightening the action UX, making events more logical, and adding a developer debug tool.

---

## Feature 1: Fix Trend Indicator

**Problem:** The trend arrow compares today's location-adjusted price against yesterday's base price with today's location modifier retroactively applied — a price the player never saw. Moving from cafeteria to playground makes a +20% real change appear as +4%.

**Fix:** Store `previousSeenPrices` in state — the actual location-adjusted prices displayed to the player at the end of each turn. Use these as the baseline for trend calculation.

**Capture timing:** At the start of `startTurn()`, before `Market.updatePrices()` runs, compute and save location-adjusted prices for all candies at `state.currentLocation` into `state.previousSeenPrices`.

**Initialization:** `State.init()` sets `previousSeenPrices` to cafeteria-adjusted prices (the starting location), so day-1 trends are meaningful.

**Tooltip text:** Change "vs yesterday" to "vs last seen" — honest that this may be across locations.

**Removal:** `previousPrices` (base price snapshot, unused elsewhere) is removed from state.

**Changes:**
- `engine/state.js`: Add `previousSeenPrices`; remove `previousPrices`
- `engine/game.js` `startTurn()`: Capture `previousSeenPrices` before price update; remove `previousPrices` save
- `engine/ui.js` `renderMarket()`: Use `state.previousSeenPrices[candy.id]` as `prevPrice`; update tooltip label

---

## Feature 2: Single Context-Sensitive Action Button

**Problem:** LAY LOW and END TURN both end the day. Having both visible is confusing — LAY LOW is strictly better when you haven't traded, meaningless once you have.

**Design:** One button, context-driven:
- Default (no trades this turn): `LAY LOW (−20 heat)` → calls `Game.layLow()`
- After any buy or sell: `END TURN →` → calls `Game.endTurn()`

Bully resolution buttons (PAY $5 / RUN / ACCEPT ROB) are unchanged.

**State flag:** `tradedThisTurn: false` — reset at the start of each turn, set to `true` in `executeBuy()` and `executeSell()` after a successful trade.

**Changes:**
- `engine/state.js`: Add `tradedThisTurn: false`
- `engine/game.js` `startTurn()`: Reset `s.tradedThisTurn = false`
- `engine/game.js` `executeBuy()` / `executeSell()`: Set `s.tradedThisTurn = true` after successful trade
- `engine/ui.js` `renderActions()`: Render single button based on `state.tradedThisTurn`

---

## Feature 3: Probable Events

Two event guards that make the world behave more logically.

**Guard 1 — No teacher when stash is empty:**
If `State.stashTotal() === 0`, the teacher check is skipped entirely. Nothing to confiscate, no reason to flag the player.

**Guard 2 — No bad events after laying low:**
If the player ended their turn with LAY LOW, neither teacher nor bully events fire on the next turn. They spent the day keeping their head down.

**Implementation:** Follows the existing `teacherSick` next/this pattern:
- `layLow()` sets `s.laidLowNextTurn = true`
- `startTurn()` per-turn reset block: `s.laidLowThisTurn = s.laidLowNextTurn; s.laidLowNextTurn = false`
- `selectEvent()` reads `s.laidLowThisTurn` to suppress teacher + bully checks

The reset runs before `selectEvent()` is called, so the copy-then-clear pattern ensures the flag is set correctly when needed.

**Changes:**
- `engine/state.js`: Add `laidLowThisTurn: false`, `laidLowNextTurn: false`
- `engine/game.js` `startTurn()`: Copy/clear laidLow flags in reset block
- `engine/game.js` `layLow()`: Set `s.laidLowNextTurn = true`
- `engine/event-engine.js` `selectEvent()`: Add empty-stash guard for teacher; add `laidLowThisTurn` guard for teacher + bully

---

## Feature 4: Debug Mode

A developer tool for inspecting price math. Active only when `?debug` is present in the URL.

**Activation:** `var DEBUG = new URLSearchParams(window.location.search).has('debug');` — one line at the top of `ui.js`, evaluated once at load. Not stored in state.

**Breakdown function:** `Market.getPriceBreakdown(candy, marketPrice, location, activeEffects)` returns an ordered array of step objects:

```js
[
  { label: 'base price',           delta: null,   value: candy.basePrice },
  { label: 'market today (+5%)',   delta: +0.03,  value: 0.63 },
  { label: 'playground (×1.15)',   delta: +0.09,  value: 0.72 },  // omitted if modifier === 1.0
  { label: '🎃 halloween (×1.30)', delta: +0.22,  value: 0.94 },
]
```

Each `delta` is the dollar difference from the previous step. The location modifier step is omitted when no modifier applies (modifier === 1.0 or no match). Active effects that don't apply to this candy are omitted.

**Tooltip display (debug mode only):**
```
PRICE BREAKDOWN
$0.60     base price
+$0.03    market today (+5%)
+$0.09    playground (×1.15)
+$0.22    🎃 halloween (×1.30)
──────────────────────────────
$0.94     you pay / receive
──────────────────────────────
$0.60     last seen · cafeteria
+57% ▲▲   change
```

In normal mode, the existing candy tooltip (risk / volatility / heat per unit) is shown unchanged.

**Changes:**
- `engine/market.js`: Add `getPriceBreakdown(candy, marketPrice, location, activeEffects)`
- `engine/ui.js`: Add `var DEBUG` constant; `renderMarket()` renders debug tooltip when `DEBUG` is true

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `engine/state.js` | Add `previousSeenPrices`, `tradedThisTurn`, `laidLowThisTurn`, `laidLowNextTurn`; remove `previousPrices` |
| `engine/game.js` | `startTurn()`: capture previousSeenPrices, reset new flags; `layLow()`: set laidLowNextTurn; `executeBuy/Sell()`: set tradedThisTurn |
| `engine/event-engine.js` | Empty-stash guard for teacher; laidLow guard for teacher + bully |
| `engine/market.js` | Add `getPriceBreakdown()` |
| `engine/ui.js` | `DEBUG` constant; `renderMarket()` previousSeenPrices + debug tooltip; `renderActions()` single context button |
