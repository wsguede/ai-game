# Candy Wars v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable single-session Candy Wars game (elementary school era, ~30 turns) that runs by opening index.html directly in a browser.

**Architecture:** Pure HTML + vanilla JS, no build tools, no server. Each engine concern lives in its own file as a global object (e.g. `Market`, `Heat`, `UI`). All data (candy, locations, events, era config) lives in `/data` as plain arrays/objects. The engine reads data through the era config so future eras are pure data swaps.

**Tech Stack:** HTML5, vanilla JavaScript (ES5-compatible, global scope modules), CSS (inline in index.html)

---

## File Map

```
/game
  index.html              ← game shell, game loop, player input wiring, all CSS
  /data
    candies.js            ← CANDIES array: 9 candy definitions
    locations.js          ← LOCATIONS array: 5 school locations with modifiers
    events.js             ← EVENTS array: pool of threat/market/intel/flavor events
    eras.js               ← ERA_V1 config: links candy/location/event sets to engine
  /engine
    state.js              ← State object: game state + mutation helpers
    market.js             ← Market object: price simulation + location modifiers
    heat.js               ← Heat object: generation, decay, encounter resolution
    event-engine.js       ← EventEngine object: event selection + effect execution
    ui.js                 ← UI object: all DOM rendering functions
  /tests
    index.html            ← browser test runner (open file directly, no server)
    test-state.js         ← state init and stash operation tests
    test-market.js        ← price simulation and modifier tests
    test-heat.js          ← heat generation, decay, teacher/bully resolution tests
    test-events.js        ← event pool structure and effect application tests
```

---

## Task 1: Project Scaffold + Test Runner

**Files:**
- Create: `index.html`
- Create: `tests/index.html`

- [ ] **Step 1: Create the game shell**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Candy Wars</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d0d; color: #c8c8c8; font-family: 'Courier New', Courier, monospace; font-size: 13px; padding: 20px; min-height: 100vh; }
    #game { max-width: 620px; margin: 0 auto; }
    .title-bar { text-align: center; color: #ffdd00; font-size: 15px; letter-spacing: 4px; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
    .status-row { display: flex; justify-content: space-between; color: #aaa; border-bottom: 1px solid #222; padding-bottom: 8px; margin-bottom: 12px; }
    .status-row span { color: #fff; }
    .section-header { color: #ffdd00; letter-spacing: 2px; font-size: 11px; margin-bottom: 6px; margin-top: 14px; }
    .green { color: #4cff72; } .yellow { color: #ffdd00; } .red { color: #ff4444; } .cyan { color: #4ecdc4; }
    .progress-bar { background: #222; height: 8px; margin-top: 4px; }
    .progress-fill { background: #4cff72; height: 100%; transition: width 0.3s; }
    .gift-label { color: #aaa; font-size: 11px; margin-top: 4px; display: flex; justify-content: space-between; }
    .location-list { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
    .location-btn { border: 1px solid #333; padding: 5px 12px; color: #aaa; font-size: 12px; cursor: pointer; background: none; font-family: inherit; position: relative; }
    .location-btn.current { border-color: #ffdd00; color: #ffdd00; }
    .location-btn:hover .loc-tooltip { display: block; }
    .loc-tooltip { display: none; position: absolute; bottom: 130%; left: 0; background: #1a1a1a; border: 1px solid #555; padding: 8px 12px; width: 220px; z-index: 10; color: #ccc; font-size: 11px; line-height: 1.6; pointer-events: none; text-align: left; }
    .loc-tooltip .tip-title { color: #ffdd00; letter-spacing: 1px; margin-bottom: 4px; }
    .tip-good { color: #4cff72; } .tip-bad { color: #ff4444; } .tip-neutral { color: #4ecdc4; }
    .market-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .market-table th { color: #666; font-size: 10px; text-align: left; padding: 4px 8px; letter-spacing: 1px; border-bottom: 1px solid #222; }
    .market-table td { padding: 5px 8px; border-bottom: 1px solid #1a1a1a; cursor: pointer; }
    .market-table tr:hover td { background: #161616; }
    .market-table .tier-divider td { border-top: 1px solid #2a2a2a; }
    .candy-cell { position: relative; }
    .candy-name { border-bottom: 1px dotted #555; color: #eee; }
    .candy-cell:hover .candy-tooltip { display: block; }
    .candy-tooltip { display: none; position: absolute; left: 0; bottom: 130%; background: #1a1a1a; border: 1px solid #555; padding: 10px 12px; width: 200px; z-index: 10; font-size: 11px; line-height: 1.8; pointer-events: none; }
    .candy-tooltip .ct-title { color: #ffdd00; letter-spacing: 1px; margin-bottom: 6px; font-size: 12px; }
    .ct-row { display: flex; justify-content: space-between; }
    .ct-label { color: #666; }
    .risk-low { color: #4cff72; } .risk-med { color: #ffa500; } .risk-high { color: #ff4444; }
    .vol-low { color: #4ecdc4; } .vol-med { color: #ffa500; } .vol-high { color: #ff88ff; }
    .trend-up { color: #4cff72; } .trend-upup { color: #4cff72; font-weight: bold; }
    .trend-down { color: #ff4444; } .trend-downdown { color: #ff4444; font-weight: bold; }
    .trend-flat { color: #444; }
    .event-box { border: 1px solid #ff4444; background: #1a0a0a; padding: 10px; margin-top: 14px; color: #ff8888; display: none; }
    .event-box.intel { border-color: #4ecdc4; background: #0a1a1a; color: #7ed9d4; }
    .event-box.flavor { border-color: #444; background: #141414; color: #aaa; }
    .event-box.market { border-color: #ffa500; background: #1a1400; color: #ffcc88; }
    .event-title { letter-spacing: 2px; font-size: 11px; margin-bottom: 4px; }
    .action-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; border-top: 1px solid #222; padding-top: 12px; }
    .action-btn { color: #ffdd00; background: #1a1a00; border: 1px solid #444; padding: 5px 12px; cursor: pointer; font-family: inherit; font-size: 12px; }
    .action-btn:hover { background: #2a2a00; border-color: #ffdd00; }
    .action-btn.danger { color: #ff4444; background: #1a0000; border-color: #662222; }
    .action-btn.danger:hover { border-color: #ff4444; }
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100; align-items: center; justify-content: center; }
    .modal-overlay.active { display: flex; }
    .modal { background: #111; border: 1px solid #555; padding: 20px; max-width: 360px; width: 90%; font-family: 'Courier New', monospace; }
    .modal h3 { color: #ffdd00; letter-spacing: 2px; margin-bottom: 12px; font-size: 13px; }
    .modal p { color: #aaa; margin-bottom: 10px; font-size: 12px; line-height: 1.6; }
    .modal input { background: #1a1a1a; border: 1px solid #555; color: #fff; font-family: inherit; font-size: 13px; padding: 6px 10px; width: 100%; margin-bottom: 12px; }
    .modal input:focus { outline: none; border-color: #ffdd00; }
    .modal .modal-actions { display: flex; gap: 8px; }
    .heat-bar { display: flex; gap: 2px; }
    .heat-pip { width: 12px; height: 12px; background: #222; }
    .heat-pip.active { background: #ff4444; }
    .heat-pip.warn { background: #ffa500; }
    .screen-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #0d0d0d; z-index: 200; align-items: center; justify-content: center; font-family: 'Courier New', monospace; }
    .screen-overlay.active { display: flex; }
    .end-screen { max-width: 480px; text-align: center; padding: 40px 20px; }
    .end-screen h1 { color: #ffdd00; letter-spacing: 4px; font-size: 20px; margin-bottom: 20px; }
    .end-screen p { color: #aaa; line-height: 1.8; margin-bottom: 12px; }
    .end-screen .grade { font-size: 48px; color: #4cff72; margin: 20px 0; }
    .end-screen .grade.fail { color: #ff4444; }
  </style>
</head>
<body>
  <div id="game">
    <div class="title-bar">★ CANDY WARS ★</div>
    <div id="status-bar"></div>
    <div id="gift-section"></div>
    <div id="location-section"></div>
    <div id="market-section"></div>
    <div id="event-box" class="event-box"></div>
    <div id="action-bar" class="action-bar"></div>
  </div>

  <!-- Buy/Sell Modal -->
  <div id="trade-modal" class="modal-overlay">
    <div class="modal">
      <h3 id="modal-title">BUY CANDY</h3>
      <p id="modal-info"></p>
      <input type="number" id="modal-qty" min="1" placeholder="Quantity">
      <div class="modal-actions">
        <button class="action-btn" id="modal-confirm">CONFIRM</button>
        <button class="action-btn" id="modal-cancel">CANCEL</button>
      </div>
    </div>
  </div>

  <!-- Win/Loss Screen -->
  <div id="end-screen" class="screen-overlay">
    <div class="end-screen" id="end-content"></div>
  </div>

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
</body>
</html>
```

- [ ] **Step 2: Create the browser test runner**

Create `tests/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Candy Wars Tests</title>
  <style>
    body { background: #111; color: #ccc; font-family: 'Courier New', monospace; padding: 20px; }
    h2 { color: #ffdd00; margin-bottom: 16px; }
    .pass { color: #4cff72; } .fail { color: #ff4444; }
    .summary { font-size: 14px; margin-bottom: 12px; padding: 8px; border: 1px solid #333; }
  </style>
</head>
<body>
  <h2>★ CANDY WARS — TESTS ★</h2>
  <div id="summary" class="summary"></div>
  <div id="results"></div>

  <script>
    const _results = [];
    function test(name, fn) {
      try { fn(); _results.push({ name, pass: true }); }
      catch (e) { _results.push({ name, pass: false, error: e.message }); }
    }
    function assertEqual(a, b, msg) {
      if (JSON.stringify(a) !== JSON.stringify(b))
        throw new Error(msg || 'Expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
    }
    function assertBetween(val, min, max, msg) {
      if (val < min || val > max)
        throw new Error(msg || 'Expected ' + val + ' between ' + min + ' and ' + max);
    }
    function assertTrue(val, msg) {
      if (!val) throw new Error(msg || 'Expected truthy, got ' + val);
    }
    function assertClose(a, b, delta, msg) {
      if (Math.abs(a - b) > delta)
        throw new Error(msg || 'Expected ' + a + ' close to ' + b + ' (delta ' + delta + ')');
    }
  </script>

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
  <!-- Tests -->
  <script src="test-state.js"></script>
  <script src="test-market.js"></script>
  <script src="test-heat.js"></script>
  <script src="test-events.js"></script>

  <script>
    const pass = _results.filter(r => r.pass).length;
    const fail = _results.filter(r => !r.pass).length;
    document.getElementById('summary').innerHTML =
      '<span class="' + (fail ? 'fail' : 'pass') + '">' + pass + ' passed, ' + fail + ' failed</span>';
    document.getElementById('results').innerHTML = _results.map(r =>
      '<div class="' + (r.pass ? 'pass' : 'fail') + '">' +
      (r.pass ? '✓' : '✗') + ' ' + r.name + (r.error ? ': ' + r.error : '') +
      '</div>'
    ).join('');
  </script>
</body>
</html>
```

- [ ] **Step 3: Commit scaffold**

```bash
git add index.html tests/index.html
git commit -m "feat: project scaffold and browser test runner"
```

---

## Task 2: Candy Catalog

**Files:**
- Create: `data/candies.js`
- Create: `tests/test-state.js` (partial — candy validation tests)

- [ ] **Step 1: Create candies.js**

Create `data/candies.js`:

```javascript
var CANDIES = [
  // LOW risk
  { id: 'smarties',       name: 'Smarties',       risk: 'low',  volatility: 'low',  basePrice: 0.25,  heatPerUnit: 0.5, riskWeight: 1 },
  { id: 'dumdums',        name: 'Dum Dums',        risk: 'low',  volatility: 'med',  basePrice: 0.40,  heatPerUnit: 0.5, riskWeight: 1 },
  { id: 'nerds',          name: 'Nerds',           risk: 'low',  volatility: 'high', basePrice: 0.60,  heatPerUnit: 0.5, riskWeight: 1 },
  // MED risk
  { id: 'snickers',       name: 'Snickers',        risk: 'med',  volatility: 'low',  basePrice: 2.50,  heatPerUnit: 1.5, riskWeight: 2 },
  { id: 'reesesxl',       name: "Reese's XL",      risk: 'med',  volatility: 'med',  basePrice: 4.00,  heatPerUnit: 1.5, riskWeight: 2 },
  { id: 'kitkat',         name: 'Kit Kat',         risk: 'med',  volatility: 'high', basePrice: 3.20,  heatPerUnit: 1.5, riskWeight: 2 },
  // HIGH risk
  { id: 'ferrerorocher',  name: 'Ferrero Rocher',  risk: 'high', volatility: 'low',  basePrice: 10.00, heatPerUnit: 3.0, riskWeight: 4 },
  { id: 'swisstruffles',  name: 'Swiss Truffles',  risk: 'high', volatility: 'med',  basePrice: 12.00, heatPerUnit: 3.0, riskWeight: 4 },
  { id: 'rarepoprocks',   name: 'Rare Pop Rocks',  risk: 'high', volatility: 'high', basePrice: 18.50, heatPerUnit: 3.0, riskWeight: 4 },
];
```

- [ ] **Step 2: Write candy validation tests**

Create `tests/test-state.js` with candy validation:

```javascript
test('CANDIES has exactly 9 entries', function() {
  assertEqual(CANDIES.length, 9);
});

test('each candy has required fields', function() {
  CANDIES.forEach(function(c) {
    assertTrue(c.id, 'missing id on ' + c.name);
    assertTrue(c.name, 'missing name');
    assertTrue(['low','med','high'].indexOf(c.risk) !== -1, 'invalid risk: ' + c.risk);
    assertTrue(['low','med','high'].indexOf(c.volatility) !== -1, 'invalid volatility: ' + c.volatility);
    assertTrue(c.basePrice > 0, 'basePrice must be positive');
    assertTrue(c.heatPerUnit > 0, 'heatPerUnit must be positive');
    assertTrue([1,2,4].indexOf(c.riskWeight) !== -1, 'invalid riskWeight: ' + c.riskWeight);
  });
});

test('candy ids are unique', function() {
  var ids = CANDIES.map(function(c) { return c.id; });
  var unique = ids.filter(function(id, i) { return ids.indexOf(id) === i; });
  assertEqual(unique.length, CANDIES.length);
});

test('low risk candies have riskWeight 1', function() {
  CANDIES.filter(function(c) { return c.risk === 'low'; }).forEach(function(c) {
    assertEqual(c.riskWeight, 1, c.name + ' should have riskWeight 1');
  });
});

test('high risk candies have riskWeight 4', function() {
  CANDIES.filter(function(c) { return c.risk === 'high'; }).forEach(function(c) {
    assertEqual(c.riskWeight, 4, c.name + ' should have riskWeight 4');
  });
});
```

- [ ] **Step 3: Open tests/index.html in browser — verify 5 tests pass**

- [ ] **Step 4: Commit**

```bash
git add data/candies.js tests/test-state.js
git commit -m "feat: candy catalog with 9 candy types"
```

---

## Task 3: Locations

**Files:**
- Create: `data/locations.js`

- [ ] **Step 1: Create locations.js**

Create `data/locations.js`:

```javascript
var LOCATIONS = [
  {
    id: 'cafeteria',
    name: 'CAFETERIA',
    patrolRisk: 'high',
    bullyRisk: 'low',
    modifiers: { byRisk: {}, byId: {}, all: null },
    heatDecayBonus: 0,
    tooltip: [
      { cls: 'tip-good', text: '+ All candy available' },
      { cls: 'tip-good', text: '+ High foot traffic' },
      { cls: 'tip-bad',  text: '- High teacher patrol risk' },
    ],
  },
  {
    id: 'playground',
    name: 'PLAYGROUND',
    patrolRisk: 'low',
    bullyRisk: 'high',
    modifiers: { byRisk: { low: 1.15 }, byId: {}, all: null },
    heatDecayBonus: 0,
    tooltip: [
      { cls: 'tip-good', text: '+ Cheap candy sells fast' },
      { cls: 'tip-good', text: '+ Low teacher presence' },
      { cls: 'tip-bad',  text: '- Bully hotspot' },
      { cls: 'tip-bad',  text: '- No premium on fancy candy' },
    ],
  },
  {
    id: 'gymnasium',
    name: 'GYMNASIUM',
    patrolRisk: 'med',
    bullyRisk: 'low',
    modifiers: { byRisk: { med: 1.15 }, byId: { kitkat: 0.85 }, all: null },
    heatDecayBonus: 0,
    tooltip: [
      { cls: 'tip-good', text: '+ Mid-tier candy +15%' },
      { cls: 'tip-bad',  text: '- Kit Kats underperform' },
    ],
  },
  {
    id: 'library',
    name: 'LIBRARY',
    patrolRisk: 'low',
    bullyRisk: 'none',
    modifiers: { byRisk: { high: 1.20 }, byId: {}, all: null },
    heatDecayBonus: 10,
    tooltip: [
      { cls: 'tip-good',    text: '+ High-end candy premium' },
      { cls: 'tip-neutral', text: '~ Heat decays 2x faster' },
      { cls: 'tip-bad',     text: '- Low volume, no cheap demand' },
    ],
  },
  {
    id: 'bathroom',
    name: 'BATHROOM',
    patrolRisk: 'none',
    bullyRisk: 'med',
    modifiers: { byRisk: {}, byId: {}, all: 0.90 },
    heatDecayBonus: 0,
    tooltip: [
      { cls: 'tip-good', text: '+ Lowest patrol risk' },
      { cls: 'tip-bad',  text: '- All prices -10%' },
      { cls: 'tip-bad',  text: '- Bully ambush possible' },
    ],
  },
];
```

- [ ] **Step 2: Add location tests to tests/test-state.js**

Append to `tests/test-state.js`:

```javascript
test('LOCATIONS has exactly 5 entries', function() {
  assertEqual(LOCATIONS.length, 5);
});

test('each location has required fields', function() {
  var validRisk = ['none','low','med','high'];
  LOCATIONS.forEach(function(loc) {
    assertTrue(loc.id, 'missing id');
    assertTrue(loc.name, 'missing name');
    assertTrue(validRisk.indexOf(loc.patrolRisk) !== -1, 'invalid patrolRisk: ' + loc.patrolRisk);
    assertTrue(validRisk.indexOf(loc.bullyRisk) !== -1, 'invalid bullyRisk: ' + loc.bullyRisk);
    assertTrue(typeof loc.heatDecayBonus === 'number', 'heatDecayBonus must be a number');
    assertTrue(Array.isArray(loc.tooltip), 'tooltip must be array');
  });
});

test('library has heatDecayBonus 10', function() {
  var library = LOCATIONS.find(function(l) { return l.id === 'library'; });
  assertEqual(library.heatDecayBonus, 10);
});

test('bathroom has all-candy modifier 0.90', function() {
  var bathroom = LOCATIONS.find(function(l) { return l.id === 'bathroom'; });
  assertEqual(bathroom.modifiers.all, 0.90);
});
```

- [ ] **Step 3: Open tests/index.html — verify new location tests pass**

- [ ] **Step 4: Commit**

```bash
git add data/locations.js tests/test-state.js
git commit -m "feat: location definitions with modifiers and tooltips"
```

---

## Task 4: Event Pool

**Files:**
- Create: `data/events.js`

- [ ] **Step 1: Create events.js**

Create `data/events.js`:

```javascript
// Event shape: { id, type, text, cssClass, condition(state), effect(state, era) }
// type: 'threat' | 'market' | 'intel' | 'flavor'
// condition: function returning true if this event can fire
// effect: function that mutates state (market/intel events only; threat events handled by engine)
var EVENTS = [
  // --- MARKET EVENTS ---
  {
    id: 'halloween_spike',
    type: 'market',
    cssClass: 'market',
    text: '!! MARKET EVENT: Halloween is coming. Everyone wants candy. Prices surging for 2 days.',
    condition: function(state) { return state.turn >= 5 && !state.activeEffects.some(function(e) { return e.id === 'halloween_spike'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'halloween_spike', type: 'allCandy', modifier: 1.30, turnsLeft: 2 });
    },
  },
  {
    id: 'halloween_crash',
    type: 'market',
    cssClass: 'market',
    text: '!! MARKET EVENT: Post-Halloween sugar crash. Everyone is sick of candy. Prices dropping.',
    condition: function(state) { return !state.activeEffects.some(function(e) { return e.id === 'halloween_crash'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'halloween_crash', type: 'allCandy', modifier: 0.80, turnsLeft: 1 });
    },
  },
  {
    id: 'valentines_surge',
    type: 'market',
    cssClass: 'market',
    text: '!! MARKET EVENT: Valentine\'s Day tomorrow. Chocolate prices surging.',
    condition: function(state) { return !state.activeEffects.some(function(e) { return e.id === 'valentines_surge'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'valentines_surge', type: 'byRisk', risk: 'high', modifier: 1.40, turnsLeft: 2 });
    },
  },
  {
    id: 'bulk_deal',
    type: 'market',
    cssClass: 'market',
    text: 'OPPORTUNITY: A 5th grader is moving product cheap. Bulk deal available — up to 10 units of any candy at 20% off this turn.',
    condition: function(state) { return !state.bulkDealUsed; },
    effect: function(state) { state.bulkDealActive = true; },
  },
  // --- INTEL TIPS ---
  {
    id: 'tip_playground_spike',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Word is the playground is running low on penny candy. Prices there will be way up tomorrow.',
    condition: function(state) { return state.turn < 25; },
    effect: function() {},
  },
  {
    id: 'tip_library_spike',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Rich kids in the library are desperate for something fancy. High-end candy will go for a premium tomorrow.',
    condition: function(state) { return state.turn < 25; },
    effect: function() {},
  },
  {
    id: 'tip_teacher_sick',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Mrs. Henderson called in sick. Patrol risk is lower everywhere today.',
    condition: function(state) { return state.turn < 28; },
    effect: function(state) { state.teacherSickThisTurn = true; },
  },
  {
    id: 'tip_black_market',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Someone whispers: "Check the bathroom tomorrow. Rare stuff coming in."',
    condition: function(state) { return state.turn < 27; },
    effect: function() {},
  },
  // --- FLAVOR EVENTS ---
  {
    id: 'flavor_tommy_caught',
    type: 'flavor',
    cssClass: 'flavor',
    text: 'Tommy got caught by Mrs. Henderson. He gives you a slow nod of respect.',
    condition: function() { return true; },
    effect: function() {},
  },
  {
    id: 'flavor_mystery_meat',
    type: 'flavor',
    cssClass: 'flavor',
    text: 'The cafeteria is serving mystery meat again. Comfort candy demand is way up.',
    condition: function() { return true; },
    effect: function() {},
  },
  {
    id: 'flavor_juice_box',
    type: 'flavor',
    cssClass: 'flavor',
    text: 'A 3rd grader offers to trade his Ferrero Rocher for a juice box. You decline.',
    condition: function() { return true; },
    effect: function() {},
  },
  {
    id: 'flavor_dentist',
    type: 'flavor',
    cssClass: 'flavor',
    text: 'The school nurse gave a speech about cavities. Business has never been better.',
    condition: function() { return true; },
    effect: function() {},
  },
];
```

- [ ] **Step 2: Add event pool tests to test-events.js**

Create `tests/test-events.js`:

```javascript
test('EVENTS is a non-empty array', function() {
  assertTrue(Array.isArray(EVENTS) && EVENTS.length > 0);
});

test('each event has required fields', function() {
  var validTypes = ['threat', 'market', 'intel', 'flavor'];
  EVENTS.forEach(function(e) {
    assertTrue(e.id, 'missing id');
    assertTrue(validTypes.indexOf(e.type) !== -1, 'invalid type: ' + e.type + ' on ' + e.id);
    assertTrue(typeof e.text === 'string' && e.text.length > 0, 'missing text on ' + e.id);
    assertTrue(typeof e.condition === 'function', 'condition must be function on ' + e.id);
    assertTrue(typeof e.effect === 'function', 'effect must be function on ' + e.id);
  });
});

test('event ids are unique', function() {
  var ids = EVENTS.map(function(e) { return e.id; });
  var unique = ids.filter(function(id, i) { return ids.indexOf(id) === i; });
  assertEqual(unique.length, EVENTS.length);
});

test('there are at least 2 intel events', function() {
  var intel = EVENTS.filter(function(e) { return e.type === 'intel'; });
  assertTrue(intel.length >= 2);
});

test('bulk_deal effect sets bulkDealActive on state', function() {
  var event = EVENTS.find(function(e) { return e.id === 'bulk_deal'; });
  var fakeState = { bulkDealUsed: false, activeEffects: [] };
  event.effect(fakeState);
  assertEqual(fakeState.bulkDealActive, true);
});
```

- [ ] **Step 3: Open tests/index.html — verify event tests pass**

- [ ] **Step 4: Commit**

```bash
git add data/events.js tests/test-events.js
git commit -m "feat: event pool with market, intel, and flavor events"
```

---

## Task 5: Era Config

**Files:**
- Create: `data/eras.js`

- [ ] **Step 1: Create eras.js**

Create `data/eras.js`:

```javascript
// ERA_V1: elementary school. Points engine at v1 data sets.
var ERA_V1 = {
  id: 'elementary',
  name: 'ELEMENTARY SCHOOL',
  candies: CANDIES,          // all 9 candy types
  locations: LOCATIONS,      // all 5 locations
  events: EVENTS,            // full event pool
  maxTurns: 30,
  startingCash: 10.00,
  stashCapacity: 30,
  winGoals: [
    { cash: 100, grade: 'C', message: "Mom seems pleased. \"Oh, how thoughtful.\" She sets it on the shelf." },
    { cash: 150, grade: 'B', message: "Mom is really happy. She gives you the biggest hug." },
    { cash: 250, grade: 'A', message: "Mom cries. You're her favorite. She will never admit this to your siblings." },
  ],
  lossMessage: "Detention. No recess for a week. Mom never got her gift.",
};
```

- [ ] **Step 2: Add era tests to test-state.js**

Append to `tests/test-state.js`:

```javascript
test('ERA_V1 references correct data arrays', function() {
  assertEqual(ERA_V1.candies, CANDIES);
  assertEqual(ERA_V1.locations, LOCATIONS);
  assertEqual(ERA_V1.events, EVENTS);
});

test('ERA_V1 has 3 win goal tiers', function() {
  assertEqual(ERA_V1.winGoals.length, 3);
});

test('ERA_V1 win goals are in ascending cash order', function() {
  for (var i = 1; i < ERA_V1.winGoals.length; i++) {
    assertTrue(ERA_V1.winGoals[i].cash > ERA_V1.winGoals[i-1].cash);
  }
});
```

- [ ] **Step 3: Open tests/index.html — verify era tests pass**

- [ ] **Step 4: Commit**

```bash
git add data/eras.js tests/test-state.js
git commit -m "feat: era config for elementary school"
```

---

## Task 6: Game State

**Files:**
- Create: `engine/state.js`

- [ ] **Step 1: Create state.js**

Create `engine/state.js`:

```javascript
var State = (function() {
  var _state = {};

  function init(era) {
    var initialPrices = {};
    era.candies.forEach(function(c) { initialPrices[c.id] = c.basePrice; });

    _state = {
      turn: 1,
      maxTurns: era.maxTurns,
      cash: era.startingCash,
      stash: {},              // { candyId: quantity }
      stashCapacity: era.stashCapacity,
      heat: 0,
      principalVisits: 0,
      currentLocation: era.locations[0].id,
      gamePhase: 'playing',  // 'playing' | 'won' | 'lost'
      currentPrices: initialPrices,
      previousPrices: initialPrices,
      activeEffects: [],
      pendingEvent: null,
      bulkDealActive: false,
      bulkDealUsed: false,
      teacherSickThisTurn: false,
      era: era,
    };
    return _state;
  }

  function get() { return _state; }

  function stashTotal() {
    return Object.values(_state.stash).reduce(function(sum, qty) { return sum + qty; }, 0);
  }

  function stashAvailable() {
    return _state.stashCapacity - stashTotal();
  }

  function addToStash(candyId, qty) {
    if (stashAvailable() < qty) throw new Error('Not enough stash space');
    _state.stash[candyId] = (_state.stash[candyId] || 0) + qty;
  }

  function removeFromStash(candyId, qty) {
    var current = _state.stash[candyId] || 0;
    if (current < qty) throw new Error('Not enough ' + candyId + ' in stash');
    _state.stash[candyId] = current - qty;
    if (_state.stash[candyId] === 0) delete _state.stash[candyId];
  }

  function clearStash() {
    _state.stash = {};
  }

  return { init: init, get: get, stashTotal: stashTotal, stashAvailable: stashAvailable, addToStash: addToStash, removeFromStash: removeFromStash, clearStash: clearStash };
})();
```

- [ ] **Step 2: Add state tests — append to tests/test-state.js**

```javascript
test('State.init sets correct starting values', function() {
  var s = State.init(ERA_V1);
  assertEqual(s.cash, 10.00);
  assertEqual(s.turn, 1);
  assertEqual(s.heat, 0);
  assertEqual(s.principalVisits, 0);
  assertEqual(s.gamePhase, 'playing');
  assertEqual(s.stashCapacity, 30);
});

test('State.init sets current prices from base prices', function() {
  State.init(ERA_V1);
  var s = State.get();
  assertEqual(s.currentPrices['smarties'], 0.25);
  assertEqual(s.currentPrices['rarepoprocks'], 18.50);
});

test('State.stashTotal returns 0 on fresh state', function() {
  State.init(ERA_V1);
  assertEqual(State.stashTotal(), 0);
});

test('State.addToStash and removeFromStash work correctly', function() {
  State.init(ERA_V1);
  State.addToStash('smarties', 5);
  assertEqual(State.stashTotal(), 5);
  assertEqual(State.stashAvailable(), 25);
  State.removeFromStash('smarties', 3);
  assertEqual(State.stashTotal(), 2);
});

test('State.addToStash throws when over capacity', function() {
  State.init(ERA_V1);
  var threw = false;
  try { State.addToStash('smarties', 31); }
  catch(e) { threw = true; }
  assertTrue(threw, 'should throw when exceeding stash capacity');
});

test('State.removeFromStash throws when insufficient quantity', function() {
  State.init(ERA_V1);
  var threw = false;
  try { State.removeFromStash('smarties', 1); }
  catch(e) { threw = true; }
  assertTrue(threw, 'should throw when removing candy not in stash');
});

test('State.clearStash empties all candy', function() {
  State.init(ERA_V1);
  State.addToStash('smarties', 5);
  State.addToStash('snickers', 3);
  State.clearStash();
  assertEqual(State.stashTotal(), 0);
});
```

- [ ] **Step 3: Open tests/index.html — verify all state tests pass**

- [ ] **Step 4: Commit**

```bash
git add engine/state.js tests/test-state.js
git commit -m "feat: game state with stash operations"
```

---

## Task 7: Market Simulation

**Files:**
- Create: `engine/market.js`
- Create: `tests/test-market.js`

- [ ] **Step 1: Create market.js**

Create `engine/market.js`:

```javascript
var Market = (function() {
  var VOLATILITY_RANGES = {
    low:  { min: -0.08, max: 0.08 },
    med:  { min: -0.18, max: 0.18 },
    high: { min: -0.40, max: 0.40 },
  };

  // Returns new prices object after one turn of market movement
  function updatePrices(currentPrices, candies, activeEffects) {
    var updated = {};
    candies.forEach(function(candy) {
      var range = VOLATILITY_RANGES[candy.volatility];
      var pct = range.min + Math.random() * (range.max - range.min);
      var price = currentPrices[candy.id] * (1 + pct);

      // Apply active effects
      activeEffects.forEach(function(effect) {
        if (effect.type === 'allCandy') {
          price *= effect.modifier;
        } else if (effect.type === 'byRisk' && effect.risk === candy.risk) {
          price *= effect.modifier;
        }
      });

      // Floor at 10% of base price, ceiling at 10x base price
      price = Math.max(price, candy.basePrice * 0.10);
      price = Math.min(price, candy.basePrice * 10);
      updated[candy.id] = Math.round(price * 100) / 100;
    });
    return updated;
  }

  // Returns the location-adjusted price for one candy at one location
  function getLocationPrice(basePrice, candy, location) {
    var mod = location.modifiers;
    if (mod.byId && mod.byId[candy.id] != null) return Math.round(basePrice * mod.byId[candy.id] * 100) / 100;
    if (mod.byRisk && mod.byRisk[candy.risk] != null) return Math.round(basePrice * mod.byRisk[candy.risk] * 100) / 100;
    if (mod.all != null) return Math.round(basePrice * mod.all * 100) / 100;
    return basePrice;
  }

  // Returns trend symbol class name based on price change
  function getPriceTrend(oldPrice, newPrice) {
    if (oldPrice === 0) return 'flat';
    var pct = (newPrice - oldPrice) / oldPrice;
    if (pct > 0.10) return 'upup';
    if (pct > 0)    return 'up';
    if (pct < -0.10) return 'downdown';
    if (pct < 0)    return 'down';
    return 'flat';
  }

  return { updatePrices: updatePrices, getLocationPrice: getLocationPrice, getPriceTrend: getPriceTrend };
})();
```

- [ ] **Step 2: Create test-market.js**

Create `tests/test-market.js`:

```javascript
test('updatePrices keeps low-volatility candy within ±8%', function() {
  State.init(ERA_V1);
  var s = State.get();
  for (var i = 0; i < 20; i++) {
    var newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, []);
    var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
    var prev = s.currentPrices['smarties'];
    var next = newPrices['smarties'];
    var pct = Math.abs((next - prev) / prev);
    assertTrue(pct <= 0.09, 'smarties price change ' + pct + ' exceeds low volatility range');
    s.currentPrices = newPrices;
  }
});

test('updatePrices never goes below 10% of base price', function() {
  State.init(ERA_V1);
  var s = State.get();
  // Drive price down 50 times
  for (var i = 0; i < 50; i++) {
    var newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, []);
    ERA_V1.candies.forEach(function(candy) {
      var floor = candy.basePrice * 0.10;
      assertTrue(newPrices[candy.id] >= floor, candy.id + ' price ' + newPrices[candy.id] + ' below floor ' + floor);
    });
    s.currentPrices = newPrices;
  }
});

test('updatePrices applies allCandy modifier correctly', function() {
  State.init(ERA_V1);
  var s = State.get();
  var effects = [{ id: 'test', type: 'allCandy', modifier: 1.30, turnsLeft: 1 }];
  // Run many times; average should be well above base (1.30 * ~1.0 avg drift)
  var smartiesBase = s.currentPrices['smarties'];
  var newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, effects);
  // With +30% modifier, even at worst drift (-8%) price should be ~1.196x base
  assertTrue(newPrices['smarties'] > smartiesBase, 'allCandy modifier should push price up');
});

test('getLocationPrice applies byRisk modifier', function() {
  var playground = LOCATIONS.find(function(l) { return l.id === 'playground'; });
  var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
  var price = Market.getLocationPrice(0.25, smarties, playground);
  assertClose(price, 0.29, 0.01, 'playground low-risk modifier should give ~$0.29');
});

test('getLocationPrice applies byId override before byRisk', function() {
  var gymnasium = LOCATIONS.find(function(l) { return l.id === 'gymnasium'; });
  var kitkat = ERA_V1.candies.find(function(c) { return c.id === 'kitkat'; });
  var price = Market.getLocationPrice(3.20, kitkat, gymnasium);
  assertClose(price, 2.72, 0.01, 'gymnasium kitkat override should give ~$2.72 (0.85x)');
});

test('getLocationPrice applies all modifier in bathroom', function() {
  var bathroom = LOCATIONS.find(function(l) { return l.id === 'bathroom'; });
  var snickers = ERA_V1.candies.find(function(c) { return c.id === 'snickers'; });
  var price = Market.getLocationPrice(2.50, snickers, bathroom);
  assertClose(price, 2.25, 0.01, 'bathroom all modifier should give $2.25');
});

test('getPriceTrend returns correct strings', function() {
  assertEqual(Market.getPriceTrend(1.00, 1.00), 'flat');
  assertEqual(Market.getPriceTrend(1.00, 1.05), 'up');
  assertEqual(Market.getPriceTrend(1.00, 1.15), 'upup');
  assertEqual(Market.getPriceTrend(1.00, 0.95), 'down');
  assertEqual(Market.getPriceTrend(1.00, 0.85), 'downdown');
});
```

- [ ] **Step 3: Open tests/index.html — verify all market tests pass**

- [ ] **Step 4: Commit**

```bash
git add engine/market.js tests/test-market.js
git commit -m "feat: market price simulation with volatility and location modifiers"
```

---

## Task 8: Heat System

**Files:**
- Create: `engine/heat.js`
- Create: `tests/test-heat.js`

- [ ] **Step 1: Create heat.js**

Create `engine/heat.js`:

```javascript
var Heat = (function() {
  var PATROL_CHANCE = { none: 0, low: 0.05, med: 0.15, high: 0.30 };
  var BULLY_CHANCE  = { none: 0, low: 0.05, med: 0.15, high: 0.25 };

  // How much heat a trade adds
  function generate(candy, quantity) {
    return candy.heatPerUnit * quantity;
  }

  // Heat lost at end of turn (passive + location bonus)
  function decay(currentHeat, location) {
    var amount = 5 + location.heatDecayBonus;
    return Math.max(0, currentHeat - amount);
  }

  // Probability a teacher patrol fires this turn
  function teacherChance(heat, location, teacherSick) {
    if (teacherSick) return 0;
    var base = PATROL_CHANCE[location.patrolRisk];
    var heatMultiplier = 1 + (heat / 100) * 2; // 1x at 0 heat → 3x at 100 heat
    return Math.min(0.95, base * heatMultiplier);
  }

  // Probability a bully encounter fires this turn
  function bullyChance(location) {
    return BULLY_CHANCE[location.bullyRisk];
  }

  // Risk-weighted stash value: sum(qty * riskWeight * price)
  function stashRiskValue(stash, candies, currentPrices) {
    return candies.reduce(function(total, candy) {
      var qty = stash[candy.id] || 0;
      var price = currentPrices[candy.id] || candy.basePrice;
      return total + qty * candy.riskWeight * price;
    }, 0);
  }

  // Outcome when a teacher catches you
  function resolveTeacherCatch(riskValue) {
    if (riskValue < 20) return { confiscate: true, principalVisit: false, heatSpike: false };
    if (riskValue < 60) return { confiscate: true, principalVisit: true,  heatSpike: false };
    return               { confiscate: true, principalVisit: true,  heatSpike: true  };
  }

  // Apply a teacher catch outcome to state (mutates)
  function applyTeacherCatch(state, outcome) {
    if (outcome.confiscate) state.stash = {};
    if (outcome.principalVisit) state.principalVisits += 1;
    if (outcome.heatSpike) state.heat = Math.min(100, state.heat + 30);
  }

  // Apply bully robbery outcome to state (mutates)
  function applyBullyRob(state) {
    state.stash = {};
    state.heat = Math.max(0, state.heat - 10);
  }

  return { generate: generate, decay: decay, teacherChance: teacherChance, bullyChance: bullyChance, stashRiskValue: stashRiskValue, resolveTeacherCatch: resolveTeacherCatch, applyTeacherCatch: applyTeacherCatch, applyBullyRob: applyBullyRob };
})();
```

- [ ] **Step 2: Create test-heat.js**

Create `tests/test-heat.js`:

```javascript
test('Heat.generate: low-risk candy generates 0.5 per unit', function() {
  var smarties = CANDIES.find(function(c) { return c.id === 'smarties'; });
  assertEqual(Heat.generate(smarties, 10), 5.0);
});

test('Heat.generate: high-risk candy generates 3.0 per unit', function() {
  var rpr = CANDIES.find(function(c) { return c.id === 'rarepoprocks'; });
  assertEqual(Heat.generate(rpr, 5), 15.0);
});

test('Heat.decay: removes 5 heat by default', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  assertEqual(Heat.decay(20, cafeteria), 15);
});

test('Heat.decay: library removes 15 heat (5 + 10 bonus)', function() {
  var library = LOCATIONS.find(function(l) { return l.id === 'library'; });
  assertEqual(Heat.decay(20, library), 5);
});

test('Heat.decay: does not go below 0', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  assertEqual(Heat.decay(3, cafeteria), 0);
});

test('Heat.teacherChance: zero at none patrol risk', function() {
  var bathroom = LOCATIONS.find(function(l) { return l.id === 'bathroom'; });
  assertEqual(Heat.teacherChance(100, bathroom, false), 0);
});

test('Heat.teacherChance: zero when teacher is sick', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  assertEqual(Heat.teacherChance(100, cafeteria, true), 0);
});

test('Heat.teacherChance: higher at high heat than low heat', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  var low = Heat.teacherChance(10, cafeteria, false);
  var high = Heat.teacherChance(90, cafeteria, false);
  assertTrue(high > low, 'high heat should increase teacher chance');
});

test('Heat.stashRiskValue: empty stash is 0', function() {
  assertEqual(Heat.stashRiskValue({}, CANDIES, {}), 0);
});

test('Heat.stashRiskValue: 10 smarties at base price = 10 * 1 * 0.25 = 2.5', function() {
  var prices = {};
  CANDIES.forEach(function(c) { prices[c.id] = c.basePrice; });
  assertClose(Heat.stashRiskValue({ smarties: 10 }, CANDIES, prices), 2.5, 0.001);
});

test('Heat.stashRiskValue: 5 Ferrero Rocher at base = 5 * 4 * 10 = 200', function() {
  var prices = {};
  CANDIES.forEach(function(c) { prices[c.id] = c.basePrice; });
  assertClose(Heat.stashRiskValue({ ferrerorocher: 5 }, CANDIES, prices), 200, 0.001);
});

test('Heat.resolveTeacherCatch: under $20 = confiscate only', function() {
  var result = Heat.resolveTeacherCatch(15);
  assertEqual(result.confiscate, true);
  assertEqual(result.principalVisit, false);
  assertEqual(result.heatSpike, false);
});

test('Heat.resolveTeacherCatch: $20-$60 = confiscate + principal', function() {
  var result = Heat.resolveTeacherCatch(40);
  assertEqual(result.confiscate, true);
  assertEqual(result.principalVisit, true);
  assertEqual(result.heatSpike, false);
});

test('Heat.resolveTeacherCatch: over $60 = confiscate + principal + heat spike', function() {
  var result = Heat.resolveTeacherCatch(80);
  assertEqual(result.confiscate, true);
  assertEqual(result.principalVisit, true);
  assertEqual(result.heatSpike, true);
});

test('Heat.applyBullyRob: clears stash and reduces heat by 10', function() {
  var fakeState = { stash: { smarties: 5 }, heat: 40 };
  Heat.applyBullyRob(fakeState);
  assertEqual(Object.keys(fakeState.stash).length, 0);
  assertEqual(fakeState.heat, 30);
});

test('Heat.applyBullyRob: heat does not go below 0', function() {
  var fakeState = { stash: {}, heat: 5 };
  Heat.applyBullyRob(fakeState);
  assertEqual(fakeState.heat, 0);
});
```

- [ ] **Step 3: Open tests/index.html — verify all heat tests pass**

- [ ] **Step 4: Commit**

```bash
git add engine/heat.js tests/test-heat.js
git commit -m "feat: heat system with generation, decay, and encounter resolution"
```

---

## Task 9: Event Engine

**Files:**
- Create: `engine/event-engine.js`

- [ ] **Step 1: Create event-engine.js**

Create `engine/event-engine.js`:

```javascript
var EventEngine = (function() {
  // Select the event for this turn. Returns event object or null.
  // Teacher and bully are checked first (probability-based).
  // Pool events fire with 40% base chance from eligible events.
  function selectEvent(state, location, era) {
    var s = state;

    // Teacher patrol check
    var tChance = Heat.teacherChance(s.heat, location, s.teacherSickThisTurn);
    if (Math.random() < tChance) {
      return { type: 'teacher', cssClass: 'threat', id: 'teacher' };
    }

    // Bully encounter check
    var bChance = Heat.bullyChance(location);
    if (Math.random() < bChance) {
      return { type: 'bully', cssClass: 'threat', id: 'bully',
        text: 'Tommy steps out from behind the lockers. He wants what\'s in your bag.',
      };
    }

    // Pool event check
    if (Math.random() > 0.40) return null;
    var eligible = era.events.filter(function(e) {
      return e.type !== 'threat' && e.condition(s);
    });
    if (eligible.length === 0) return null;
    var event = eligible[Math.floor(Math.random() * eligible.length)];
    return event;
  }

  // Execute a non-threat event effect on state
  function executeEffect(event, state) {
    if (typeof event.effect === 'function') event.effect(state);
  }

  // Resolve a teacher catch against current state (mutates)
  function resolveTeacher(state) {
    var s = state;
    var riskVal = Heat.stashRiskValue(s.stash, s.era.candies, s.currentPrices);
    var outcome = Heat.resolveTeacherCatch(riskVal);
    Heat.applyTeacherCatch(s, outcome);
    return outcome;
  }

  return { selectEvent: selectEvent, executeEffect: executeEffect, resolveTeacher: resolveTeacher };
})();
```

- [ ] **Step 2: Add event engine tests to test-events.js**

Append to `tests/test-events.js`:

```javascript
test('EventEngine.selectEvent returns null when no events fire (mocked random=1)', function() {
  State.init(ERA_V1);
  var s = State.get();
  s.heat = 0;
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  // Override Math.random to always return 1 (no events fire)
  var origRandom = Math.random;
  Math.random = function() { return 1; };
  var event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
  Math.random = origRandom;
  assertEqual(event, null);
});

test('EventEngine.selectEvent returns teacher when random is below teacher chance', function() {
  State.init(ERA_V1);
  var s = State.get();
  s.heat = 100;
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  var origRandom = Math.random;
  Math.random = function() { return 0.0; }; // always fires
  var event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
  Math.random = origRandom;
  assertEqual(event.type, 'teacher');
});

test('EventEngine.resolveTeacher: low stash → no principal visit', function() {
  State.init(ERA_V1);
  var s = State.get();
  // 5 smarties at $0.25, riskWeight 1 → $1.25 risk value (well under $20)
  s.stash = { smarties: 5 };
  var outcome = EventEngine.resolveTeacher(s);
  assertEqual(outcome.principalVisit, false);
});

test('EventEngine.resolveTeacher: high stash → principal visit', function() {
  State.init(ERA_V1);
  var s = State.get();
  // 3 Ferrero Rocher at $10, riskWeight 4 → $120 risk value (over $60)
  s.stash = { ferrerorocher: 3 };
  var outcome = EventEngine.resolveTeacher(s);
  assertEqual(outcome.principalVisit, true);
  assertEqual(outcome.heatSpike, true);
});
```

- [ ] **Step 3: Open tests/index.html — verify all event engine tests pass**

- [ ] **Step 4: Commit**

```bash
git add engine/event-engine.js tests/test-events.js
git commit -m "feat: event engine with teacher, bully, and pool event selection"
```

---

## Task 10: UI Rendering

**Files:**
- Create: `engine/ui.js`

- [ ] **Step 1: Create ui.js**

Create `engine/ui.js`:

```javascript
var UI = (function() {
  var TREND_SYMBOLS = { flat: '━', up: '▲', upup: '▲▲', down: '▼', downdown: '▼▼' };
  var RISK_CLASS    = { low: 'risk-low', med: 'risk-med', high: 'risk-high' };
  var VOL_CLASS     = { low: 'vol-low',  med: 'vol-med',  high: 'vol-high' };

  function renderStatusBar(state) {
    var heatPips = '';
    for (var i = 0; i < 10; i++) {
      var threshold = (i + 1) * 10;
      var cls = state.heat >= threshold ? (state.heat >= 70 ? 'active' : 'warn') : '';
      heatPips += '<div class="heat-pip ' + cls + '"></div>';
    }
    var principalDots = '';
    for (var j = 0; j < 3; j++) {
      principalDots += '<span style="color:' + (j < state.principalVisits ? '#ff4444' : '#333') + '">■</span> ';
    }
    document.getElementById('status-bar').innerHTML =
      '<div class="status-row">' +
        '<div>DAY <span>' + state.turn + '</span>/' + state.maxTurns + '</div>' +
        '<div>CASH: <span class="green">$' + state.cash.toFixed(2) + '</span></div>' +
        '<div>STASH: <span>' + State.stashTotal() + '</span>/' + state.stashCapacity + '</div>' +
        '<div>HEAT: <div class="heat-bar">' + heatPips + '</div></div>' +
        '<div>PRINCIPAL: ' + principalDots + '</div>' +
      '</div>';
  }

  function renderGiftProgress(state) {
    var topGoal = state.era.winGoals[state.era.winGoals.length - 1].cash;
    var pct = Math.min(100, (state.cash / topGoal) * 100);
    var nextGoal = state.era.winGoals.find(function(g) { return state.cash < g.cash; });
    var goalLabel = nextGoal ? '$' + nextGoal.cash + ' 🎁' : '★ ACHIEVED ★';
    document.getElementById('gift-section').innerHTML =
      '<div class="section-header">MOM\'S GIFT FUND</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="gift-label"><span>$' + state.cash.toFixed(2) + ' saved</span><span>Goal: ' + goalLabel + '</span></div>';
  }

  function renderLocations(locations, currentLocationId) {
    var html = '<div class="section-header">LOCATION</div><div class="location-list">';
    locations.forEach(function(loc) {
      var isCurrent = loc.id === currentLocationId;
      var tips = loc.tooltip.map(function(t) {
        return '<span class="' + t.cls + '">' + t.text + '</span>';
      }).join('<br>');
      html += '<button class="location-btn' + (isCurrent ? ' current' : '') + '" ' +
        (isCurrent ? 'disabled' : 'onclick="Game.travel(\'' + loc.id + '\')"') + '>' +
        loc.name +
        '<div class="loc-tooltip"><div class="tip-title">' + loc.name + '</div>' + tips + '</div>' +
        '</button>';
    });
    html += '</div>';
    document.getElementById('location-section').innerHTML = html;
  }

  function renderMarket(candies, currentPrices, previousPrices, stash, location) {
    var prevTier = null;
    var rows = candies.map(function(candy) {
      var basePrice = currentPrices[candy.id];
      var locPrice  = Market.getLocationPrice(basePrice, candy, location);
      var prevPrice = Market.getLocationPrice(previousPrices[candy.id] || basePrice, candy, location);
      var trend     = Market.getPriceTrend(prevPrice, locPrice);
      var inBag     = stash[candy.id] || 0;
      var tierClass = prevTier !== null && prevTier !== candy.risk ? ' class="tier-divider"' : '';
      prevTier = candy.risk;
      return '<tr' + tierClass + ' onclick="Game.openTrade(\'' + candy.id + '\')">' +
        '<td class="candy-cell">' +
          '<span class="candy-name">' + candy.name + '</span>' +
          '<div class="candy-tooltip">' +
            '<div class="ct-title">' + candy.name + '</div>' +
            '<div class="ct-row"><span class="ct-label">Risk</span><span class="' + RISK_CLASS[candy.risk] + '">' + candy.risk.toUpperCase() + '</span></div>' +
            '<div class="ct-row"><span class="ct-label">Volatility</span><span class="' + VOL_CLASS[candy.volatility] + '">' + candy.volatility.toUpperCase() + '</span></div>' +
            '<div class="ct-row"><span class="ct-label">Heat/unit</span><span>+' + candy.heatPerUnit + '</span></div>' +
          '</div>' +
        '</td>' +
        '<td class="price-cell">$' + locPrice.toFixed(2) + ' <span class="trend-' + trend + '">' + TREND_SYMBOLS[trend] + '</span></td>' +
        '<td>' + inBag + '</td>' +
      '</tr>';
    }).join('');
    document.getElementById('market-section').innerHTML =
      '<div class="section-header">MARKET</div>' +
      '<table class="market-table">' +
        '<tr><th>CANDY</th><th>PRICE</th><th>IN BAG</th></tr>' +
        rows +
      '</table>';
  }

  function renderEvent(event) {
    var box = document.getElementById('event-box');
    if (!event) { box.style.display = 'none'; return; }
    box.className = 'event-box ' + (event.cssClass || 'flavor');
    box.style.display = 'block';
    var title = event.type === 'teacher' ? '!! BUSTED !!'
              : event.type === 'bully'   ? '!! BULLY ALERT !!'
              : event.type === 'market'  ? '!! MARKET EVENT !!'
              : event.type === 'intel'   ? 'STREET INTEL'
              : 'MEANWHILE...';
    var text = event.text || '';
    if (event.type === 'teacher') {
      text = 'A teacher spots your bag and demands to see what\'s inside.';
    }
    box.innerHTML = '<div class="event-title">' + title + '</div>' + text;
  }

  function renderActions(state, pendingEvent) {
    var html = '';
    if (pendingEvent && pendingEvent.type === 'bully') {
      html =
        '<button class="action-btn" onclick="Game.payBully()">PAY $5</button>' +
        '<button class="action-btn" onclick="Game.runFromBully()">RUN (50/50)</button>' +
        '<button class="action-btn danger" onclick="Game.acceptRob()">ACCEPT ROB</button>';
    } else {
      html =
        '<button class="action-btn" onclick="Game.layLow()">LAY LOW (−20 heat)</button>' +
        '<button class="action-btn" onclick="Game.endTurn()">END TURN →</button>';
    }
    document.getElementById('action-bar').innerHTML = html;
  }

  function renderWin(state) {
    var grade = 'C';
    var message = state.era.winGoals[0].message;
    for (var i = state.era.winGoals.length - 1; i >= 0; i--) {
      if (state.cash >= state.era.winGoals[i].cash) {
        grade = state.era.winGoals[i].grade;
        message = state.era.winGoals[i].message;
        break;
      }
    }
    document.getElementById('end-content').innerHTML =
      '<h1>SCHOOL\'S OUT</h1>' +
      '<div class="grade">' + grade + '</div>' +
      '<p>' + message + '</p>' +
      '<p style="color:#666;font-size:11px;">Final cash: $' + state.cash.toFixed(2) + ' · Day ' + state.turn + '</p>' +
      '<button class="action-btn" style="margin-top:20px" onclick="location.reload()">PLAY AGAIN</button>';
    document.getElementById('end-screen').classList.add('active');
  }

  function renderLoss(state) {
    var reason = state.principalVisits >= 3
      ? 'Three strikes. Mrs. Henderson sends you to the principal one last time. Detention — indefinite.'
      : 'Time\'s up. Day 30 is over.';
    document.getElementById('end-content').innerHTML =
      '<h1>GAME OVER</h1>' +
      '<div class="grade fail">F</div>' +
      '<p>' + reason + '</p>' +
      '<p>' + state.era.lossMessage + '</p>' +
      '<p style="color:#666;font-size:11px;">Final cash: $' + state.cash.toFixed(2) + '</p>' +
      '<button class="action-btn" style="margin-top:20px" onclick="location.reload()">TRY AGAIN</button>';
    document.getElementById('end-screen').classList.add('active');
  }

  function render(state) {
    var location = state.era.locations.find(function(l) { return l.id === state.currentLocation; });
    renderStatusBar(state);
    renderGiftProgress(state);
    renderLocations(state.era.locations, state.currentLocation);
    renderMarket(state.era.candies, state.currentPrices, state.previousPrices, state.stash, location);
    renderEvent(state.pendingEvent);
    renderActions(state, state.pendingEvent);
  }

  return { render: render, renderWin: renderWin, renderLoss: renderLoss };
})();
```

- [ ] **Step 2: Open index.html in browser — page should load without JS errors (game won't work yet, but no red console errors)**

- [ ] **Step 3: Commit**

```bash
git add engine/ui.js
git commit -m "feat: UI rendering for all game screens"
```

---

## Task 11: Game Loop + Player Actions

**Files:**
- Create: `engine/game.js`

- [ ] **Step 1: Create game.js**

Create `engine/game.js`:

```javascript
var Game = (function() {
  var _tradeMode = null;   // 'buy' | 'sell'
  var _tradeCandy = null;  // candy id

  function startTurn() {
    var s = State.get();

    // Market update
    var newPrices = Market.updatePrices(s.currentPrices, s.era.candies, s.activeEffects);
    s.previousPrices = JSON.parse(JSON.stringify(s.currentPrices));
    s.currentPrices = newPrices;

    // Decay active effects
    s.activeEffects = s.activeEffects
      .map(function(e) { return Object.assign({}, e, { turnsLeft: e.turnsLeft - 1 }); })
      .filter(function(e) { return e.turnsLeft > 0; });

    // Reset per-turn flags
    s.teacherSickThisTurn = false;
    s.bulkDealActive = false;

    // Select event
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    var event = EventEngine.selectEvent(s, location, s.era);
    s.pendingEvent = event;

    // Execute non-interactive event effects immediately
    if (event && event.type !== 'teacher' && event.type !== 'bully') {
      EventEngine.executeEffect(event, s);
    }

    // Resolve teacher immediately (no player choice)
    if (event && event.type === 'teacher') {
      var outcome = EventEngine.resolveTeacher(s);
      var teacherMsg = 'A teacher spots you. ';
      if (!outcome.principalVisit) {
        teacherMsg += 'She confiscates everything but lets you off with a warning.';
      } else if (!outcome.heatSpike) {
        teacherMsg += 'She confiscates everything and sends you to the principal. (' + s.principalVisits + '/3)';
      } else {
        teacherMsg += 'She confiscates everything, sends you to the principal, and calls your parents. (' + s.principalVisits + '/3)';
      }
      s.pendingEvent = Object.assign({}, event, { text: teacherMsg });

      if (s.principalVisits >= 3) {
        UI.render(s);
        setTimeout(function() { UI.renderLoss(s); }, 800);
        return;
      }
    }

    UI.render(s);
  }

  function endTurn() {
    var s = State.get();
    // Bully event must be resolved before ending turn
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;

    // Heat decay
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    s.heat = Heat.decay(s.heat, location);

    // Check win/loss
    if (s.principalVisits >= 3) { UI.renderLoss(s); return; }
    if (s.turn >= s.maxTurns) {
      if (s.cash >= s.era.winGoals[0].cash) UI.renderWin(s);
      else UI.renderLoss(s);
      return;
    }

    s.turn++;
    startTurn();
  }

  function travel(locationId) {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    s.currentLocation = locationId;
    endTurn();
  }

  function layLow() {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    s.heat = Math.max(0, s.heat - 20);
    endTurn();
  }

  function openTrade(candyId) {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    var candy = s.era.candies.find(function(c) { return c.id === candyId; });
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    var price = Market.getLocationPrice(s.currentPrices[candyId], candy, location);
    var inBag = s.stash[candyId] || 0;

    _tradeCandy = candyId;
    var maxBuy = Math.min(State.stashAvailable(), Math.floor(s.cash / price));
    var maxSell = inBag;

    document.getElementById('modal-title').textContent = candy.name.toUpperCase();
    document.getElementById('modal-info').innerHTML =
      'Price: <strong>$' + price.toFixed(2) + '</strong> &nbsp;|&nbsp; ' +
      'Cash: <strong>$' + s.cash.toFixed(2) + '</strong> &nbsp;|&nbsp; ' +
      'In bag: <strong>' + inBag + '</strong><br>' +
      '[B] Max buy: ' + maxBuy + ' &nbsp;|&nbsp; [S] Max sell: ' + maxSell;

    document.getElementById('modal-qty').value = '';
    document.getElementById('modal-qty').placeholder = 'Quantity';

    document.getElementById('modal-confirm').onclick = function() {
      var qty = parseInt(document.getElementById('modal-qty').value, 10);
      if (!qty || qty < 1) return;
      if (_tradeMode === 'buy') executeBuy(candyId, qty, price, candy);
      else executeSell(candyId, qty, price, candy);
    };

    document.getElementById('modal-cancel').onclick = closeModal;

    // Default to buy if has space, sell if has inventory
    _tradeMode = inBag > 0 ? 'sell' : 'buy';
    document.getElementById('modal-title').textContent =
      (_tradeMode === 'buy' ? 'BUY ' : 'SELL ') + candy.name.toUpperCase();

    document.getElementById('trade-modal').classList.add('active');
    document.getElementById('modal-qty').focus();
  }

  function executeBuy(candyId, qty, price, candy) {
    var s = State.get();
    var total = price * qty;
    if (total > s.cash) { alert('Not enough cash.'); return; }
    if (qty > State.stashAvailable()) { alert('Not enough stash space.'); return; }
    var discounted = s.bulkDealActive && !s.bulkDealUsed ? total * 0.80 : total;
    if (s.bulkDealActive && !s.bulkDealUsed && qty <= 10) {
      s.bulkDealUsed = true;
      s.bulkDealActive = false;
      discounted = price * 0.80 * qty;
    }
    s.cash = Math.round((s.cash - discounted) * 100) / 100;
    State.addToStash(candyId, qty);
    s.heat = Math.min(100, s.heat + Heat.generate(candy, qty));
    closeModal();
    UI.render(s);
  }

  function executeSell(candyId, qty, price, candy) {
    var s = State.get();
    if ((s.stash[candyId] || 0) < qty) { alert('Not enough ' + candy.name + ' in bag.'); return; }
    s.cash = Math.round((s.cash + price * qty) * 100) / 100;
    State.removeFromStash(candyId, qty);
    s.heat = Math.min(100, s.heat + Heat.generate(candy, qty));
    closeModal();
    UI.render(s);
  }

  function closeModal() {
    document.getElementById('trade-modal').classList.remove('active');
    _tradeMode = null;
    _tradeCandy = null;
  }

  function payBully() {
    var s = State.get();
    if (s.cash < 5) { alert('Not enough cash to pay bully.'); return; }
    s.cash = Math.round((s.cash - 5) * 100) / 100;
    s.pendingEvent = null;
    UI.render(s);
  }

  function runFromBully() {
    var s = State.get();
    if (Math.random() < 0.5) {
      s.pendingEvent = { type: 'flavor', cssClass: 'flavor', text: 'You bolt. Tommy can\'t keep up. Clean getaway.' };
    } else {
      s.pendingEvent = { type: 'flavor', cssClass: 'threat', text: 'You try to run but Tommy catches you. He takes everything.' };
      Heat.applyBullyRob(s);
    }
    UI.render(s);
  }

  function acceptRob() {
    var s = State.get();
    Heat.applyBullyRob(s);
    s.pendingEvent = { type: 'flavor', cssClass: 'flavor', text: 'Tommy takes everything. Mrs. Henderson saw the whole thing. "Are you okay, sweetie?" Your heat drops.' };
    UI.render(s);
  }

  function init() {
    State.init(ERA_V1);
    startTurn();
  }

  return { init: init, endTurn: endTurn, travel: travel, layLow: layLow, openTrade: openTrade, payBully: payBully, runFromBully: runFromBully, acceptRob: acceptRob };
})();

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (document.getElementById('trade-modal').classList.contains('active')) {
    if (e.key === 'Escape') Game.openTrade && document.getElementById('modal-cancel').click();
    return;
  }
  if (e.key === 'Enter') Game.endTurn();
  if (e.key === 'l' || e.key === 'L') Game.layLow();
});

// Start the game
window.onload = function() { Game.init(); };
```

- [ ] **Step 2: Open index.html in browser — game should be playable end to end**

Verify:
- Title bar shows ★ CANDY WARS ★
- Status bar shows Day 1/30, $10.00 cash
- All 5 locations render with tooltips on hover
- Market table shows 9 candies with prices and trend arrows
- Candy tooltips show Risk, Volatility, Heat/unit on hover
- Clicking a candy row opens the trade modal
- END TURN advances the day and updates prices
- LAY LOW reduces heat by 20
- Clicking a location travels there and ends the turn

- [ ] **Step 3: Commit**

```bash
git add engine/game.js
git commit -m "feat: game loop with buy/sell/travel/lay-low actions"
```

---

## Task 12: Balance Pass

**Files:**
- No new files — manual testing and tuning of values in existing files

- [ ] **Step 1: Play a full 30-turn game**

Open index.html. Play through focusing on:
- Does $10 starting cash feel right? (Should be tight but enough for 5-6 Smarties)
- Does the gift goal ($100 by day 30) feel achievable but not trivial?
- Does heat accumulate at a satisfying pace with heavy trading?
- Does the teacher fire too often or too rarely at high heat?

- [ ] **Step 2: Tune starting cash if needed**

If $10 feels too tight (can't buy anything meaningful) raise to $15 in `data/eras.js`:
```javascript
startingCash: 15.00,  // adjust based on playtest
```

- [ ] **Step 3: Verify win conditions trigger correctly**

Play to $100, $150, and $250 to confirm grade C, B, A messages appear.
Play to day 30 under $100 to confirm loss screen appears.
Get caught 3 times with a high-value stash to confirm detention loss screen.

- [ ] **Step 4: Verify bully encounter**

On Playground or Bathroom, wait for a bully event. Test all 3 options:
- Pay $5 → cash decreases, bully resolves
- Run → 50/50 escape or robbery
- Accept Rob → stash clears, heat drops 10, flavor message shows

- [ ] **Step 5: Commit final balance**

```bash
git add data/eras.js
git commit -m "balance: tune starting cash and win goal thresholds after playtest"
```

---

## Task 13: Final Polish

**Files:**
- `index.html` (minor CSS tweaks only)

- [ ] **Step 1: Open tests/index.html — all tests must pass before shipping**

Expected: all tests green. Fix any failures before continuing.

- [ ] **Step 2: Check browser console for errors**

Open index.html, open browser DevTools (F12), check Console tab. Fix any JS errors.

- [ ] **Step 3: Verify tooltips don't clip off screen**

Hover the first candy row and the Cafeteria location button. Tooltip should be fully visible. If clipping, change `bottom: 130%` to `top: 130%` for the last few items in ui.js.

- [ ] **Step 4: Add .gitignore**

Create `.gitignore`:
```
.superpowers/
```

- [ ] **Step 5: Final commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore for brainstorm session files"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task(s) |
|---|---|
| HTML-only, no server | Task 1 (scaffold), Task 11 (game.js uses no fetch/server calls) |
| Retro terminal aesthetic | Task 1 (CSS in index.html) |
| 30 turns, 30-min session | Task 6 (ERA_V1.maxTurns), Task 11 (startTurn/endTurn) |
| 9 candy types, 3×3 matrix | Task 2 (candies.js) |
| 5 school locations with modifiers | Task 3 (locations.js), Task 7 (Market.getLocationPrice) |
| Location tooltips, no hint text | Task 10 (ui.js renderLocations — no "hover for intel" text) |
| Candy tooltips with risk/vol/heat | Task 10 (ui.js renderMarket) |
| Price + inline trend arrow | Task 7 (Market.getPriceTrend), Task 10 (renderMarket) |
| Heat generation per trade | Task 8 (Heat.generate), Task 11 (executeBuy/executeSell) |
| Heat decay per turn | Task 8 (Heat.decay), Task 11 (endTurn) |
| Lay Low: -20 heat | Task 11 (Game.layLow) |
| Library: -10 extra heat decay | Task 3 (heatDecayBonus:10), Task 8 (Heat.decay) |
| Teacher encounter scales with heat | Task 8 (Heat.teacherChance) |
| Teacher catch outcome by stash value | Task 8 (Heat.resolveTeacherCatch), Task 11 (resolveTeacher in startTurn) |
| Bully: pay/run/accept-rob options | Task 10 (renderActions), Task 11 (payBully/runFromBully/acceptRob) |
| Bully rob gives -10 heat | Task 8 (Heat.applyBullyRob), Task 11 (acceptRob) |
| 3 principal visits = detention | Task 11 (endTurn win/loss check) |
| Mom's gift progress bar | Task 10 (renderGiftProgress) |
| 3 gift tiers (C/B/A ending) | Task 5 (ERA_V1.winGoals), Task 10 (renderWin) |
| Loss screen if day 30 under $100 | Task 10 (renderLoss), Task 11 (endTurn) |
| Story events (market/intel/flavor) | Task 4 (events.js), Task 9 (event-engine.js) |
| Bulk deal at 20% off | Task 4 (bulk_deal event), Task 11 (executeBuy bulk logic) |
| Teacher sick tip reduces patrol | Task 4 (tip_teacher_sick effect), Task 8 (teacherChance teacherSick param) |
| Era config for extensibility | Task 5 (eras.js), all engine code reads from era param |
| Keyboard shortcuts | Task 11 (keydown listener) |
| Starting cash $10, stash capacity 30 | Task 5 (ERA_V1 startingCash/stashCapacity) |
| Travel ends turn | Task 11 (Game.travel calls endTurn) |
| Buy/sell generates heat | Task 11 (executeBuy/executeSell call Heat.generate) |
