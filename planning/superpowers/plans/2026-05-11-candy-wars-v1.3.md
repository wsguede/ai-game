# Candy Wars v1.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the misleading price trend indicator, consolidate the action buttons, make events logically probable, and add a developer debug tooltip.

**Architecture:** Five targeted changes across five files. No new files. Each task is independent after Task 1 (state foundation). Tests run in-browser at `tests/index.html` using the existing custom harness (`test()`, `assertEqual()`, `assertTrue()`, `assertClose()`).

**Tech Stack:** Vanilla JS (IIFE modules), no build tools, browser-based test runner.

---

### Task 1: State — new flags, fix stale tests

**Files:**
- Modify: `engine/state.js`
- Modify: `tests/test-state.js`

- [ ] **Step 1: Write failing tests for new state shape**

Add to `tests/test-state.js` — replace the two stale `winGoals` tests (lines 67–75) and append new ones:

```js
// Replace these two stale tests (ERA_V1.winGoals was removed in v1.2):
test('ERA_V1 has maxTurns 180', function() {
  assertEqual(ERA_V1.maxTurns, 180);
});
test('ERA_V1 has calendarEvents with 4 days mapped', function() {
  var days = Object.keys(ERA_V1.calendarEvents);
  assertEqual(days.length, 4);
});

// New v1.3 state shape tests:
test('State.init sets previousSeenPrices for starting location', function() {
  State.init(ERA_V1);
  var s = State.get();
  // Cafeteria has no modifiers — seen prices equal base prices
  assertEqual(s.previousSeenPrices['smarties'], 0.25);
  assertEqual(s.previousSeenPrices['rarepoprocks'], 18.50);
});

test('State.init does not have previousPrices', function() {
  State.init(ERA_V1);
  assertEqual(State.get().previousPrices, undefined);
});

test('State.init has tradedThisTurn as false', function() {
  State.init(ERA_V1);
  assertEqual(State.get().tradedThisTurn, false);
});

test('State.init has laidLow flags as false', function() {
  State.init(ERA_V1);
  var s = State.get();
  assertEqual(s.laidLowThisTurn, false);
  assertEqual(s.laidLowNextTurn, false);
});
```

- [ ] **Step 2: Open `tests/index.html` in a browser and verify the new tests fail**

Expected: the 4 new v1.3 tests fail; the 2 stale winGoals tests also fail.

- [ ] **Step 3: Update `engine/state.js`**

Replace the entire `init` function:

```js
function init(era) {
  var initialPrices = {};
  era.candies.forEach(function(c) { initialPrices[c.id] = c.basePrice; });

  var startLocation = era.locations[0];
  var initialSeenPrices = {};
  era.candies.forEach(function(c) {
    initialSeenPrices[c.id] = Market.getLocationPrice(initialPrices[c.id], c, startLocation, []);
  });

  _state = {
    turn: 1,
    maxTurns: era.maxTurns,
    cash: era.startingCash,
    stash: {},
    stashCapacity: era.stashCapacity,
    heat: 0,
    principalVisits: 0,
    currentLocation: era.locations[0].id,
    gamePhase: 'playing',
    currentPrices: initialPrices,
    previousSeenPrices: initialSeenPrices,
    activeEffects: [],
    pendingNotifications: [],
    pendingEvent: null,
    bulkDealActive: false,
    bulkDealUsed: false,
    tradedThisTurn: false,
    laidLowThisTurn: false,
    laidLowNextTurn: false,
    teacherSickThisTurn: false,
    teacherSickNextTurn: false,
    era: era,
  };
  return _state;
}
```

- [ ] **Step 4: Reload `tests/index.html` and verify all tests pass**

Expected: all previously-passing tests still pass; the 4 new tests now pass; the 2 stale winGoals tests are replaced and pass.

- [ ] **Step 5: Commit**

```bash
git add engine/state.js tests/test-state.js
git commit -m "feat: state flags for v1.3 — previousSeenPrices, tradedThisTurn, laidLow"
```

---

### Task 2: Fix trend indicator

**Files:**
- Modify: `engine/game.js`
- Modify: `engine/ui.js`

The bug: `renderMarket` computed `prevPrice` by applying today's location modifier to yesterday's base price — a number the player never saw. Fix: capture the actual location-adjusted price the player observes at the start of each turn and store it as `previousSeenPrices`.

- [ ] **Step 1: Update `startTurn()` in `engine/game.js`**

Find the Market update section (currently around line 20) and replace:

```js
// Market update
var newPrices = Market.updatePrices(s.currentPrices, s.era.candies, s.activeEffects);
s.previousPrices = JSON.parse(JSON.stringify(s.currentPrices));
s.currentPrices = newPrices;
```

With:

```js
// Capture what the player last saw (location-adjusted) before prices update
var currentLoc = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
var seenPrices = {};
s.era.candies.forEach(function(c) {
  seenPrices[c.id] = Market.getLocationPrice(s.currentPrices[c.id], c, currentLoc, s.activeEffects);
});
s.previousSeenPrices = seenPrices;

// Market update
var newPrices = Market.updatePrices(s.currentPrices, s.era.candies, s.activeEffects);
s.currentPrices = newPrices;
```

- [ ] **Step 2: Update `renderMarket()` in `engine/ui.js`**

Change the function signature (replace `previousPrices` with `previousSeenPrices`):

```js
function renderMarket(candies, currentPrices, previousSeenPrices, stash, location, activeEffects, cash, stashCapacity) {
```

Change the `prevPrice` and `pctLabel` lines inside the `candies.map` callback:

```js
// Old:
var prevPrice = Market.getLocationPrice(previousPrices[candy.id] || basePrice, candy, location);
var pct       = prevPrice > 0 ? Math.round((locPrice - prevPrice) / prevPrice * 100) : 0;
var pctLabel  = (pct > 0 ? '+' : '') + pct + '% vs yesterday';

// New:
var prevPrice = previousSeenPrices[candy.id] || basePrice;
var pct       = prevPrice > 0 ? Math.round((locPrice - prevPrice) / prevPrice * 100) : 0;
var pctLabel  = (pct > 0 ? '+' : '') + pct + '% vs last seen';
```

- [ ] **Step 3: Update the `render()` call site in `engine/ui.js`**

Find the `renderMarket(...)` call inside `render()` and change `state.previousPrices` to `state.previousSeenPrices`:

```js
renderMarket(state.era.candies, state.currentPrices, state.previousSeenPrices, state.stash, location, state.activeEffects, state.cash, state.stashCapacity);
```

- [ ] **Step 4: Verify in the browser**

Open `index.html`. Move from cafeteria to playground. The trend arrows should now reflect the % change from the price you actually saw, not a synthetic recalculated value. The trend tooltip should say "vs last seen" instead of "vs yesterday".

- [ ] **Step 5: Commit**

```bash
git add engine/game.js engine/ui.js
git commit -m "fix: trend indicator shows change vs last seen price, not retroactive calculation"
```

---

### Task 3: Single context-sensitive action button

**Files:**
- Modify: `engine/game.js`
- Modify: `engine/ui.js`

Default: LAY LOW. After any successful buy or sell: switches to END TURN. Bully resolution buttons unchanged.

- [ ] **Step 1: Reset `tradedThisTurn` each turn in `engine/game.js`**

In `startTurn()`, find the per-turn flag reset block (the block with `s.teacherSickThisTurn = ...`) and add:

```js
s.tradedThisTurn = false;
```

- [ ] **Step 2: Set `tradedThisTurn` after a successful buy in `engine/game.js`**

In `executeBuy()`, after `State.addToStash(candyId, qty)`:

```js
State.addToStash(candyId, qty);
s.tradedThisTurn = true;
s.heat = Math.min(100, s.heat + Heat.generate(candy, qty));
```

- [ ] **Step 3: Set `tradedThisTurn` after a successful sell in `engine/game.js`**

In `executeSell()`, after `State.removeFromStash(candyId, qty)`:

```js
State.removeFromStash(candyId, qty);
s.tradedThisTurn = true;
s.heat = Math.min(100, s.heat + Heat.generate(candy, qty));
```

- [ ] **Step 4: Update `renderActions()` in `engine/ui.js`**

Replace the entire `else` branch (the non-bully path):

```js
function renderActions(state, pendingEvent) {
  var html = '';
  if (pendingEvent && pendingEvent.type === 'bully') {
    if (state.cash >= 5) html += '<button class="action-btn" onclick="Game.payBully()">PAY $5</button>';
    html +=
      '<button class="action-btn" onclick="Game.runFromBully()">RUN (50/50)</button>' +
      '<button class="action-btn danger" onclick="Game.acceptRob()">ACCEPT ROB</button>';
  } else if (state.tradedThisTurn) {
    html = '<button class="action-btn" onclick="Game.endTurn()">END TURN →</button>';
  } else {
    html = '<button class="action-btn" onclick="Game.layLow()">LAY LOW (−20 heat)</button>';
  }
  document.getElementById('action-bar').innerHTML = html;
}
```

- [ ] **Step 5: Verify in the browser**

Open `index.html`. On a fresh turn the button should say LAY LOW. Buy or sell something — button should switch to END TURN. Start a new turn — button should revert to LAY LOW.

- [ ] **Step 6: Commit**

```bash
git add engine/game.js engine/ui.js
git commit -m "feat: single context-sensitive action button — lay low until first trade"
```

---

### Task 4: Probable events

**Files:**
- Modify: `engine/event-engine.js`
- Modify: `engine/game.js`
- Modify: `tests/test-events.js`

Two guards: (1) no teacher if stash is empty, (2) no teacher or bully if player laid low last turn.

- [ ] **Step 1: Write failing tests in `tests/test-events.js`**

Append to `tests/test-events.js`:

```js
test('EventEngine.selectEvent skips teacher when stash is empty', function() {
  State.init(ERA_V1);
  var s = State.get();
  s.turn = 2; // must be > 1 for threats to fire
  s.heat = 100;
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  var origRandom = Math.random;
  Math.random = function() { return 0.0; };
  var event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
  Math.random = origRandom;
  // bully may still fire; teacher must not
  assertTrue(!event || event.type !== 'teacher', 'teacher should not fire with empty stash');
});

test('EventEngine.selectEvent skips teacher and bully when laidLowThisTurn', function() {
  State.init(ERA_V1);
  var s = State.get();
  s.turn = 2;
  s.heat = 100;
  s.laidLowThisTurn = true;
  State.addToStash('smarties', 5);
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  var origRandom = Math.random;
  Math.random = function() { return 0.0; };
  var event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
  Math.random = origRandom;
  assertTrue(!event || (event.type !== 'teacher' && event.type !== 'bully'), 'no threats when laidLow');
});
```

- [ ] **Step 2: Open `tests/index.html` and verify the two new tests fail**

- [ ] **Step 3: Update `selectEvent()` in `engine/event-engine.js`**

Replace the threat-check block:

```js
// Old:
if (s.turn !== 1) {
  var tChance = Heat.teacherChance(s.heat, location, s.teacherSickThisTurn);
  if (Math.random() < tChance) {
    return { type: 'teacher', cssClass: 'threat', id: 'teacher' };
  }

  var bChance = Heat.bullyChance(location);
  if (Math.random() < bChance) {
    return { type: 'bully', cssClass: 'threat', id: 'bully',
      text: 'Tommy steps out from behind the lockers. He wants what\'s in your bag.',
    };
  }
}

// New:
if (s.turn !== 1 && !s.laidLowThisTurn) {
  if (State.stashTotal() > 0) {
    var tChance = Heat.teacherChance(s.heat, location, s.teacherSickThisTurn);
    if (Math.random() < tChance) {
      return { type: 'teacher', cssClass: 'threat', id: 'teacher' };
    }
  }

  var bChance = Heat.bullyChance(location);
  if (Math.random() < bChance) {
    return { type: 'bully', cssClass: 'threat', id: 'bully',
      text: 'Tommy steps out from behind the lockers. He wants what\'s in your bag.',
    };
  }
}
```

- [ ] **Step 4: Wire up the laidLow flags in `engine/game.js`**

In `startTurn()`, in the per-turn flag reset block, add:

```js
s.laidLowThisTurn = s.laidLowNextTurn;
s.laidLowNextTurn = false;
```

In `layLow()`, set the flag before calling `endTurn()`:

```js
function layLow() {
  var s = State.get();
  if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
  s.heat = Math.max(0, s.heat - 20);
  s.laidLowNextTurn = true;
  endTurn();
}
```

- [ ] **Step 5: Reload `tests/index.html` and verify all tests pass**

- [ ] **Step 6: Verify in the browser**

Open `index.html`. Empty stash — click LAY LOW several times at cafeteria (high patrol risk). No teacher should appear. Buy something, then lay low — the next turn should be threat-free.

- [ ] **Step 7: Commit**

```bash
git add engine/event-engine.js engine/game.js tests/test-events.js
git commit -m "feat: probable events — no teacher with empty stash, no threats after laying low"
```

---

### Task 5: Debug mode — price breakdown tooltip

**Files:**
- Modify: `engine/market.js`
- Modify: `engine/ui.js`
- Modify: `index.html`
- Modify: `tests/test-market.js`

Active only when `?debug` is in the URL. Hovering a price cell shows the full math: base → market drift → global effects → location modifier → location effects → final price.

- [ ] **Step 1: Write failing tests for `getPriceBreakdown` in `tests/test-market.js`**

Append:

```js
test('getPriceBreakdown: first step is base price with null delta', function() {
  var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  var steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
  assertEqual(steps[0].label, 'base price');
  assertEqual(steps[0].value, 0.25);
  assertEqual(steps[0].delta, null);
});

test('getPriceBreakdown: second step shows market drift delta', function() {
  var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  var steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
  assertEqual(steps[1].value, 0.27);
  assertEqual(steps[1].delta, 0.02);
});

test('getPriceBreakdown: omits location step when no modifier applies', function() {
  var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  // cafeteria has no modifier for low-risk candy
  var steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
  assertEqual(steps.length, 2);
});

test('getPriceBreakdown: includes location step when modifier applies', function() {
  var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
  var playground = LOCATIONS.find(function(l) { return l.id === 'playground'; });
  // playground has byRisk low: 1.15
  var steps = Market.getPriceBreakdown(smarties, 0.27, playground, []);
  assertEqual(steps.length, 3);
  assertEqual(steps[2].delta, 0.04);
});

test('getPriceBreakdown: separates allCandy effect as its own step', function() {
  var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  // marketPrice has the 1.30 effect baked in: 0.27 * 1.30 = 0.35
  var marketPrice = Math.round(0.27 * 1.30 * 100) / 100;
  var effects = [{ id: 'halloween_spike', type: 'allCandy', modifier: 1.30, turnsLeft: 1 }];
  var steps = Market.getPriceBreakdown(smarties, marketPrice, cafeteria, effects);
  // base + market drift + halloween = 3 steps
  assertEqual(steps.length, 3);
  assertTrue(steps[2].label.indexOf('halloween') !== -1, 'step label should include effect id');
  assertTrue(steps[2].delta > 0, 'halloween effect adds positive delta');
});
```

- [ ] **Step 2: Open `tests/index.html` and confirm the 5 new tests fail**

- [ ] **Step 3: Add `getPriceBreakdown()` to `engine/market.js`**

Add before the `return` statement:

```js
// Returns ordered breakdown steps for the debug tooltip.
// marketPrice = currentPrices[candy.id] (may include allCandy/byRisk effects).
// Each step: { label, delta (null for base), value (running total) }.
function getPriceBreakdown(candy, marketPrice, location, activeEffects) {
  var steps = [];
  var running = candy.basePrice;
  steps.push({ label: 'base price', delta: null, value: running });

  // Separate global effects (allCandy/byRisk) from the market price so they show as distinct steps
  var globalEffects = (activeEffects || []).filter(function(e) {
    return e.type === 'allCandy' || (e.type === 'byRisk' && e.risk === candy.risk);
  });
  var globalProduct = globalEffects.reduce(function(p, e) { return p * e.modifier; }, 1);

  // Reverse out global effects to get the pure drift price
  var pureDrift = globalProduct > 0 ? Math.round((marketPrice / globalProduct) * 100) / 100 : marketPrice;
  var driftDelta = Math.round((pureDrift - running) * 100) / 100;
  var driftPct   = running > 0 ? Math.round((pureDrift - running) / running * 100) : 0;
  running = pureDrift;
  steps.push({
    label: 'market today (' + (driftPct >= 0 ? '+' : '') + driftPct + '%)',
    delta: driftDelta,
    value: running,
  });

  // Global effects as individual steps
  globalEffects.forEach(function(effect) {
    var delta = Math.round((running * effect.modifier - running) * 100) / 100;
    running   = Math.round(running * effect.modifier * 100) / 100;
    steps.push({
      label: effect.id.replace(/_/g, ' ') + ' (\xd7' + effect.modifier.toFixed(2) + ')',
      delta: delta,
      value: running,
    });
  });

  // Location modifier (omit if no modifier applies)
  var mod    = location.modifiers;
  var locMod = null;
  if (mod.byId && mod.byId[candy.id] != null)         locMod = mod.byId[candy.id];
  else if (mod.byRisk && mod.byRisk[candy.risk] != null) locMod = mod.byRisk[candy.risk];
  else if (mod.all != null)                             locMod = mod.all;

  if (locMod !== null) {
    var locDelta = Math.round((running * locMod - running) * 100) / 100;
    running      = Math.round(running * locMod * 100) / 100;
    steps.push({
      label: location.name.toLowerCase() + ' (\xd7' + locMod.toFixed(2) + ')',
      delta: locDelta,
      value: running,
    });
  }

  // byLocation effects
  (activeEffects || []).forEach(function(effect) {
    if (effect.type !== 'byLocation' || effect.location !== location.id) return;
    if (effect.risk && effect.risk !== candy.risk) return;
    var delta = Math.round((running * effect.modifier - running) * 100) / 100;
    running   = Math.round(running * effect.modifier * 100) / 100;
    steps.push({
      label: effect.id.replace(/_/g, ' ') + ' (\xd7' + effect.modifier.toFixed(2) + ')',
      delta: delta,
      value: running,
    });
  });

  return steps;
}
```

Update the `return` at the bottom of market.js:

```js
return { updatePrices: updatePrices, getLocationPrice: getLocationPrice, getPriceTrend: getPriceTrend, getPriceBreakdown: getPriceBreakdown };
```

- [ ] **Step 4: Reload `tests/index.html` and confirm all 5 new tests pass**

- [ ] **Step 5: Add debug CSS to `index.html`**

Find the closing `</style>` tag and insert before it:

```css
/* Debug price tooltip */
.price-cell { position: relative; }
.dbg-tip {
  display: none; position: absolute; left: 0; top: 100%; z-index: 100;
  background: #111; border: 1px solid rgba(255,221,0,0.4);
  padding: 10px 12px; min-width: 220px; font-size: 11px;
  line-height: 1.9; white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,0.6); pointer-events: none;
}
.price-cell:hover .dbg-tip { display: block; }
.dbg-label { font-size: 9px; letter-spacing: 2px; color: #ffdd00; margin-bottom: 4px; }
.dbg-row { display: flex; justify-content: space-between; gap: 20px; }
.dbg-amt { min-width: 55px; text-align: right; }
.dbg-lbl { color: #555; }
.dbg-base { color: #ccc; }
.dbg-up   { color: #4cff72; }
.dbg-down { color: #ff4444; }
.dbg-muted { color: #888; }
.dbg-total .dbg-amt { color: #ffdd00; font-weight: bold; }
.dbg-total .dbg-lbl { color: #aaa; }
.dbg-divider { border: none; border-top: 1px solid #1e1e1e; margin: 4px 0; }
```

- [ ] **Step 6: Add `DEBUG` constant and `_renderDebugTooltip()` to `engine/ui.js`**

At the very top of the `UI` IIFE body (first line inside `var UI = (function() {`), add:

```js
var DEBUG = new URLSearchParams(window.location.search).has('debug');
```

Then add a private helper function anywhere before `renderMarket`:

```js
function _renderDebugTooltip(candy, marketPrice, locPrice, location, activeEffects, previousSeenPrices) {
  var steps    = Market.getPriceBreakdown(candy, marketPrice, location, activeEffects);
  var lastSeen = previousSeenPrices[candy.id] || candy.basePrice;
  var changePct = lastSeen > 0 ? Math.round((locPrice - lastSeen) / lastSeen * 100) : 0;
  var changeCls  = changePct > 0 ? 'dbg-up' : changePct < 0 ? 'dbg-down' : '';
  var changeSign = changePct > 0 ? '+' : '';
  var TSYM = { flat: '━', up: '▲', upup: '▲▲', down: '▼', downdown: '▼▼' };
  var sym  = TSYM[Market.getPriceTrend(lastSeen, locPrice)] || '';

  var html = '<div class="dbg-tip"><div class="dbg-label">PRICE BREAKDOWN</div>';
  steps.forEach(function(step) {
    if (step.delta === null) {
      html += '<div class="dbg-row"><span class="dbg-amt dbg-base">$' + step.value.toFixed(2) + '</span><span class="dbg-lbl">' + step.label + '</span></div>';
    } else {
      var cls  = step.delta >= 0 ? 'dbg-up' : 'dbg-down';
      var sign = step.delta >= 0 ? '+' : '';
      html += '<div class="dbg-row"><span class="dbg-amt ' + cls + '">' + sign + '$' + Math.abs(step.delta).toFixed(2) + '</span><span class="dbg-lbl">' + step.label + '</span></div>';
    }
  });
  html += '<div class="dbg-divider"></div>';
  html += '<div class="dbg-row dbg-total"><span class="dbg-amt">$' + locPrice.toFixed(2) + '</span><span class="dbg-lbl">you pay / receive</span></div>';
  html += '<div class="dbg-divider"></div>';
  html += '<div class="dbg-row"><span class="dbg-amt dbg-muted">$' + lastSeen.toFixed(2) + '</span><span class="dbg-lbl">last seen</span></div>';
  html += '<div class="dbg-row"><span class="dbg-amt ' + changeCls + '">' + changeSign + changePct + '% ' + sym + '</span><span class="dbg-lbl">change</span></div>';
  html += '</div>';
  return html;
}
```

- [ ] **Step 7: Wire the debug tooltip into `renderMarket()` in `engine/ui.js`**

Inside the `candies.map` callback, the price cell currently ends with:

```js
'<td class="price-cell">$' + locPrice.toFixed(2) + ' <span class="trend-wrap">...</span></td>'
```

Add the conditional debug tooltip before `</td>`:

```js
'<td class="price-cell">$' + locPrice.toFixed(2) + ' <span class="trend-wrap"><span class="trend-' + trend + '">' + TREND_SYMBOLS[trend] + '</span><div class="trend-tip">' + pctLabel + '</div></span>' +
(DEBUG ? _renderDebugTooltip(candy, basePrice, locPrice, location, activeEffects, previousSeenPrices) : '') +
'</td>'
```

- [ ] **Step 8: Verify in the browser**

Open `index.html` (no query param) — hover a price, tooltip should show the normal candy info (risk/volatility/heat), no debug content.

Open `index.html?debug` — hover a price cell. The debug tooltip should appear showing the full math breakdown. Verify:
- Cafeteria: only 2 steps (base + market drift), no location line
- Playground: 3 steps (base + market drift + location ×1.15)
- On a halloween day: 3 steps (base + market drift + halloween ×1.30)
- Last seen and % change shown below the divider

- [ ] **Step 9: Commit**

```bash
git add engine/market.js engine/ui.js index.html tests/test-market.js
git commit -m "feat: debug mode — price breakdown tooltip on hover with ?debug query param"
```
