# GitHub Actions CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vitest tests, ESLint linting, and a GitHub Actions CI/CD pipeline that builds and deploys to the `pages` branch on push to `main`.

**Architecture:** Eight sequential tasks. Tasks 1–5 add Vitest (install, then one test file per task). Task 6 adds ESLint. Task 7 creates the workflow. Task 8 removes `docs/` from git tracking and updates documentation. Each task commits independently; `npm test` and `npm run lint` must pass at every commit.

**Tech Stack:** Vitest, ESLint 9+ (flat config), `globals` npm package, `peaceiris/actions-gh-pages@v4.1.0` (SHA-pinned), Node 22.

---

## File Map

**Create:**
- `src/tests/heat.test.js` — Vitest port of `tests/test-heat.js`
- `src/tests/market.test.js` — Vitest port of `tests/test-market.js`
- `src/tests/state.test.js` — Vitest port of `tests/test-state.js`
- `src/tests/event-engine.test.js` — Vitest port of `tests/test-events.js`
- `eslint.config.js` — ESLint flat config
- `.github/workflows/ci.yml` — CI/CD workflow

**Modify:**
- `package.json` — add `test`, `lint` scripts; add `vitest`, `eslint`, `globals` dev deps
- `vite.config.js` — add `test: { environment: 'jsdom' }`
- `.gitignore` — add `docs/`
- `README.md` — update Build section
- `CLAUDE.md` — update Build and Deploy section

**Remove from git tracking (not deleted from disk):**
- `docs/` — CI will produce this; no longer committed to `main`

---

### Task 1: Install Vitest and configure jsdom environment

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

**Context:** Vitest shares the Vite config. Adding `test: { environment: 'jsdom' }` to `vite.config.js` is all the config needed — no separate `vitest.config.js`. The engine files use `window.*` globals so jsdom is required.

- [ ] **Step 1: Install Vitest**

```bash
npm install --save-dev vitest
```

Expected: `vitest` appears in `package-lock.json` and `node_modules/`.

- [ ] **Step 2: Add test script to `package.json`**

In the `"scripts"` block, add `"test": "vitest run"` alongside `dev`, `build`, `preview`:

```json
{
  "name": "candy-wars",
  "version": "1.6.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "6.3.5",
    "vitest": "latest"
  }
}
```

- [ ] **Step 3: Add jsdom test environment to `vite.config.js`**

Replace the entire file with:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ai-game/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
  },
});
```

- [ ] **Step 4: Verify Vitest runs with zero tests**

```bash
npm test
```

Expected output: `No test files found` or `0 tests passed`. Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.js
git commit -m "chore: install Vitest and configure jsdom test environment"
```

---

### Task 2: Port heat tests — `src/tests/heat.test.js`

**Files:**
- Create: `src/tests/heat.test.js`

**Context:** Ports `tests/test-heat.js` to Vitest. No bugs to fix in heat tests — they all map cleanly to current behavior. `Heat` has no cross-file deps (pure functions), so only `candies.js`, `locations.js`, and `heat.js` need importing. Globals are captured in `beforeAll` after imports execute.

- [ ] **Step 1: Create `src/tests/heat.test.js`**

```js
import { describe, it, expect, beforeAll } from 'vitest';
import '../../data/candies.js';
import '../../data/locations.js';
import '../../engine/heat.js';

describe('Heat', () => {
  let Heat, CANDIES, LOCATIONS;

  beforeAll(() => {
    Heat = window.Heat;
    CANDIES = window.CANDIES;
    LOCATIONS = window.LOCATIONS;
  });

  it('generate: low-risk candy generates 0.5 per unit', () => {
    const smarties = CANDIES.find(c => c.id === 'smarties');
    expect(Heat.generate(smarties, 10)).toBe(5.0);
  });

  it('generate: high-risk candy generates 3.0 per unit', () => {
    const rpr = CANDIES.find(c => c.id === 'rarepoprocks');
    expect(Heat.generate(rpr, 5)).toBe(15.0);
  });

  it('decay: removes 2 heat by default', () => {
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    expect(Heat.decay(20, cafeteria)).toBe(18);
  });

  it('decay: library removes 5 heat (2 + 3 bonus)', () => {
    const library = LOCATIONS.find(l => l.id === 'library');
    expect(Heat.decay(20, library)).toBe(15);
  });

  it('decay: does not go below 0', () => {
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    expect(Heat.decay(1, cafeteria)).toBe(0);
  });

  it('teacherChance: zero at none patrol risk', () => {
    const bathroom = LOCATIONS.find(l => l.id === 'bathroom');
    expect(Heat.teacherChance(100, bathroom, false)).toBe(0);
  });

  it('teacherChance: zero when teacher is sick', () => {
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    expect(Heat.teacherChance(100, cafeteria, true)).toBe(0);
  });

  it('teacherChance: higher at high heat than low heat', () => {
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const low = Heat.teacherChance(10, cafeteria, false);
    const high = Heat.teacherChance(90, cafeteria, false);
    expect(high).toBeGreaterThan(low);
  });

  it('stashRiskValue: empty stash is 0', () => {
    expect(Heat.stashRiskValue({}, CANDIES, {})).toBe(0);
  });

  it('stashRiskValue: 10 smarties at base price = 10 * 1 * 0.25 = 2.5', () => {
    const prices = {};
    CANDIES.forEach(c => { prices[c.id] = c.basePrice; });
    expect(Heat.stashRiskValue({ smarties: 10 }, CANDIES, prices)).toBeCloseTo(2.5, 2);
  });

  it('stashRiskValue: 5 Ferrero Rocher at base = 5 * 4 * 10 = 200', () => {
    const prices = {};
    CANDIES.forEach(c => { prices[c.id] = c.basePrice; });
    expect(Heat.stashRiskValue({ ferrerorocher: 5 }, CANDIES, prices)).toBeCloseTo(200, 2);
  });

  it('resolveTeacherCatch: under $20 = confiscate only', () => {
    const result = Heat.resolveTeacherCatch(15);
    expect(result.confiscate).toBe(true);
    expect(result.principalVisit).toBe(false);
    expect(result.heatSpike).toBe(false);
  });

  it('resolveTeacherCatch: $20–$60 = confiscate + principal', () => {
    const result = Heat.resolveTeacherCatch(40);
    expect(result.confiscate).toBe(true);
    expect(result.principalVisit).toBe(true);
    expect(result.heatSpike).toBe(false);
  });

  it('resolveTeacherCatch: over $60 = confiscate + principal + heat spike', () => {
    const result = Heat.resolveTeacherCatch(80);
    expect(result.confiscate).toBe(true);
    expect(result.principalVisit).toBe(true);
    expect(result.heatSpike).toBe(true);
  });

  it('applyBullyRob: clears stash and reduces heat by 10', () => {
    const fakeState = { stash: { smarties: 5 }, heat: 40 };
    Heat.applyBullyRob(fakeState);
    expect(Object.keys(fakeState.stash).length).toBe(0);
    expect(fakeState.heat).toBe(30);
  });

  it('applyBullyRob: heat does not go below 0', () => {
    const fakeState = { stash: {}, heat: 5 };
    Heat.applyBullyRob(fakeState);
    expect(fakeState.heat).toBe(0);
  });

  it('teacherCaught: always false at 0 heat', () => {
    for (let i = 0; i < 20; i++) {
      expect(Heat.teacherCaught(0)).toBe(false);
    }
  });

  it('teacherCaught: always true at 100 heat', () => {
    for (let i = 0; i < 20; i++) {
      expect(Heat.teacherCaught(100)).toBe(true);
    }
  });

  it('teacherCaught: returns a boolean', () => {
    const result = Heat.teacherCaught(50);
    expect(result === true || result === false).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests and verify all pass**

```bash
npm test
```

Expected: `19 tests passed`. Zero failures.

- [ ] **Step 3: Commit**

```bash
git add src/tests/heat.test.js
git commit -m "test: port heat tests to Vitest"
```

---

### Task 3: Port market tests — `src/tests/market.test.js`

**Files:**
- Create: `src/tests/market.test.js`

**Context:** Ports `tests/test-market.js`. Some tests call `State.init(ERA_V1)` to get initial prices, so `state.js` must be imported. Import order: data files → market → state (state depends on market). `beforeEach` resets state before each test.

- [ ] **Step 1: Create `src/tests/market.test.js`**

```js
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import '../../data/candies.js';
import '../../data/locations.js';
import '../../data/events.js';
import '../../data/eras.js';
import '../../engine/market.js';
import '../../engine/state.js';

describe('Market', () => {
  let Market, State, ERA_V1, LOCATIONS;

  beforeAll(() => {
    Market = window.Market;
    State = window.State;
    ERA_V1 = window.ERA_V1;
    LOCATIONS = window.LOCATIONS;
  });

  beforeEach(() => {
    State.init(ERA_V1);
  });

  it('updatePrices keeps low-volatility candy within ±8%', () => {
    let s = State.get();
    for (let i = 0; i < 20; i++) {
      const newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, []);
      const prev = s.currentPrices['smarties'];
      const next = newPrices['smarties'];
      const pct = Math.abs((next - prev) / prev);
      expect(pct).toBeLessThanOrEqual(0.09);
      s.currentPrices = newPrices;
    }
  });

  it('updatePrices never goes below 10% of base price', () => {
    let s = State.get();
    for (let i = 0; i < 50; i++) {
      const newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, []);
      ERA_V1.candies.forEach(candy => {
        const floor = candy.basePrice * 0.10;
        expect(newPrices[candy.id]).toBeGreaterThanOrEqual(floor);
      });
      s.currentPrices = newPrices;
    }
  });

  it('updatePrices applies allCandy modifier correctly', () => {
    const s = State.get();
    const effects = [{ id: 'test', type: 'allCandy', modifier: 1.30, turnsLeft: 1 }];
    const smartiesBase = s.currentPrices['smarties'];
    const newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, effects);
    expect(newPrices['smarties']).toBeGreaterThan(smartiesBase);
  });

  it('getLocationPrice applies byRisk modifier', () => {
    const playground = LOCATIONS.find(l => l.id === 'playground');
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const price = Market.getLocationPrice(0.25, smarties, playground, []);
    expect(price).toBeCloseTo(0.29, 1);
  });

  it('getLocationPrice applies byId override before byRisk', () => {
    const gymnasium = LOCATIONS.find(l => l.id === 'gymnasium');
    const kitkat = ERA_V1.candies.find(c => c.id === 'kitkat');
    const price = Market.getLocationPrice(3.20, kitkat, gymnasium, []);
    expect(price).toBeCloseTo(2.72, 1);
  });

  it('getLocationPrice applies all modifier in bathroom', () => {
    const bathroom = LOCATIONS.find(l => l.id === 'bathroom');
    const snickers = ERA_V1.candies.find(c => c.id === 'snickers');
    const price = Market.getLocationPrice(2.50, snickers, bathroom, []);
    expect(price).toBeCloseTo(2.25, 1);
  });

  it('getPriceTrend returns correct strings', () => {
    expect(Market.getPriceTrend(1.00, 1.00)).toBe('flat');
    expect(Market.getPriceTrend(1.00, 1.05)).toBe('up');
    expect(Market.getPriceTrend(1.00, 1.15)).toBe('upup');
    expect(Market.getPriceTrend(1.00, 0.95)).toBe('down');
    expect(Market.getPriceTrend(1.00, 0.85)).toBe('downdown');
  });

  it('getPriceBreakdown: first step is base price with null delta', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
    expect(steps[0].label).toBe('base price');
    expect(steps[0].value).toBe(0.25);
    expect(steps[0].delta).toBeNull();
  });

  it('getPriceBreakdown: second step shows market drift delta', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
    expect(steps[1].value).toBe(0.27);
    expect(steps[1].delta).toBe(0.02);
  });

  it('getPriceBreakdown: omits location step when no modifier applies', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
    expect(steps.length).toBe(2);
  });

  it('getPriceBreakdown: includes location step when modifier applies', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const playground = LOCATIONS.find(l => l.id === 'playground');
    const steps = Market.getPriceBreakdown(smarties, 0.27, playground, []);
    expect(steps.length).toBe(3);
    expect(steps[2].delta).toBe(0.04);
  });

  it('getPriceBreakdown: separates allCandy effect as its own step', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const marketPrice = Math.round(0.27 * 1.30 * 100) / 100;
    const effects = [{ id: 'halloween_spike', type: 'allCandy', modifier: 1.30, turnsLeft: 1 }];
    const steps = Market.getPriceBreakdown(smarties, marketPrice, cafeteria, effects);
    expect(steps.length).toBe(3);
    expect(steps[2].label).toContain('halloween');
    expect(steps[2].delta).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests and verify all pass**

```bash
npm test
```

Expected: all prior heat tests plus 11 new market tests pass. Zero failures.

- [ ] **Step 3: Commit**

```bash
git add src/tests/market.test.js
git commit -m "test: port market tests to Vitest"
```

---

### Task 4: Port state and data tests — `src/tests/state.test.js`

**Files:**
- Create: `src/tests/state.test.js`

**Context:** Ports `tests/test-state.js`. Includes tests for CANDIES, LOCATIONS, and ERA_V1 data integrity, plus State mutation helpers. **Bug fix:** the browser test `library has heatDecayBonus 10` is stale — v1.5 changed the library bonus to 3. The Vitest port corrects this to 3.

- [ ] **Step 1: Create `src/tests/state.test.js`**

```js
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import '../../data/candies.js';
import '../../data/locations.js';
import '../../data/events.js';
import '../../data/eras.js';
import '../../engine/market.js';
import '../../engine/heat.js';
import '../../engine/state.js';

describe('Data + State', () => {
  let State, ERA_V1, CANDIES, LOCATIONS;

  beforeAll(() => {
    State = window.State;
    ERA_V1 = window.ERA_V1;
    CANDIES = window.CANDIES;
    LOCATIONS = window.LOCATIONS;
  });

  beforeEach(() => {
    State.init(ERA_V1);
  });

  // --- CANDIES ---

  it('CANDIES has exactly 9 entries', () => {
    expect(CANDIES.length).toBe(9);
  });

  it('each candy has required fields', () => {
    CANDIES.forEach(c => {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(['low', 'med', 'high']).toContain(c.risk);
      expect(['low', 'med', 'high']).toContain(c.volatility);
      expect(c.basePrice).toBeGreaterThan(0);
      expect(c.heatPerUnit).toBeGreaterThan(0);
      expect([1, 2, 4]).toContain(c.riskWeight);
    });
  });

  it('candy ids are unique', () => {
    const ids = CANDIES.map(c => c.id);
    const unique = [...new Set(ids)];
    expect(unique.length).toBe(CANDIES.length);
  });

  it('low risk candies have riskWeight 1', () => {
    CANDIES.filter(c => c.risk === 'low').forEach(c => {
      expect(c.riskWeight).toBe(1);
    });
  });

  it('high risk candies have riskWeight 4', () => {
    CANDIES.filter(c => c.risk === 'high').forEach(c => {
      expect(c.riskWeight).toBe(4);
    });
  });

  // --- LOCATIONS ---

  it('LOCATIONS has exactly 5 entries', () => {
    expect(LOCATIONS.length).toBe(5);
  });

  it('each location has required fields', () => {
    const validRisk = ['none', 'low', 'med', 'high'];
    LOCATIONS.forEach(loc => {
      expect(loc.id).toBeTruthy();
      expect(loc.name).toBeTruthy();
      expect(validRisk).toContain(loc.patrolRisk);
      expect(validRisk).toContain(loc.bullyRisk);
      expect(typeof loc.heatDecayBonus).toBe('number');
      expect(Array.isArray(loc.tooltip)).toBe(true);
    });
  });

  it('library has heatDecayBonus 3', () => {
    // v1.5 changed library bonus from 10 to 3
    const library = LOCATIONS.find(l => l.id === 'library');
    expect(library.heatDecayBonus).toBe(3);
  });

  it('bathroom has all-candy modifier 0.90', () => {
    const bathroom = LOCATIONS.find(l => l.id === 'bathroom');
    expect(bathroom.modifiers.all).toBe(0.90);
  });

  // --- ERA_V1 ---

  it('ERA_V1 references correct data arrays', () => {
    expect(ERA_V1.candies).toBe(CANDIES);
    expect(ERA_V1.locations).toBe(LOCATIONS);
    expect(ERA_V1.events).toBe(window.EVENTS);
  });

  // --- State ---

  it('State.init sets previousSeenPrices for starting location', () => {
    const s = State.get();
    // Cafeteria has no modifiers — seen prices equal base prices
    expect(s.previousSeenPrices['smarties']).toBe(0.25);
    expect(s.previousSeenPrices['rarepoprocks']).toBe(18.50);
  });

  it('State.init does not have previousPrices', () => {
    expect(State.get().previousPrices).toBeUndefined();
  });

  it('State.init has tradedThisTurn as false', () => {
    expect(State.get().tradedThisTurn).toBe(false);
  });

  it('State.init has laidLow flags as false', () => {
    const s = State.get();
    expect(s.laidLowThisTurn).toBe(false);
    expect(s.laidLowNextTurn).toBe(false);
  });

  it('State.init sets correct starting values', () => {
    const s = State.get();
    expect(s.cash).toBe(10.00);
    expect(s.turn).toBe(1);
    expect(s.heat).toBe(0);
    expect(s.principalVisits).toBe(0);
    expect(s.gamePhase).toBe('playing');
    expect(s.stashCapacity).toBe(30);
  });

  it('State.init sets current prices from base prices', () => {
    const s = State.get();
    expect(s.currentPrices['smarties']).toBe(0.25);
    expect(s.currentPrices['rarepoprocks']).toBe(18.50);
  });

  it('State.stashTotal returns 0 on fresh state', () => {
    expect(State.stashTotal()).toBe(0);
  });

  it('State.addToStash and removeFromStash work correctly', () => {
    State.addToStash('smarties', 5);
    expect(State.stashTotal()).toBe(5);
    expect(State.stashAvailable()).toBe(25);
    State.removeFromStash('smarties', 3);
    expect(State.stashTotal()).toBe(2);
  });

  it('State.addToStash throws when over capacity', () => {
    expect(() => State.addToStash('smarties', 31)).toThrow();
  });

  it('State.removeFromStash throws when insufficient quantity', () => {
    expect(() => State.removeFromStash('smarties', 1)).toThrow();
  });

  it('State.clearStash empties all candy', () => {
    State.addToStash('smarties', 5);
    State.addToStash('snickers', 3);
    State.clearStash();
    expect(State.stashTotal()).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests and verify all pass**

```bash
npm test
```

Expected: all prior tests plus 20 new state/data tests pass. Zero failures.

- [ ] **Step 3: Commit**

```bash
git add src/tests/state.test.js
git commit -m "test: port state and data tests to Vitest"
```

---

### Task 5: Port event-engine tests — `src/tests/event-engine.test.js`

**Files:**
- Create: `src/tests/event-engine.test.js`

**Context:** Ports `tests/test-events.js`. **Bug fix:** the browser test `EventEngine.selectEvent returns teacher when random is below teacher chance` is wrong — it never sets `turn` past 1, so the teacher block is skipped (v1.3 added day-1 protection). The Vitest port fixes this by setting `s.turn = 2` and adding stash. Math.random is overridden inline using the same pattern as the browser tests (save, override, restore).

- [ ] **Step 1: Create `src/tests/event-engine.test.js`**

```js
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import '../../data/candies.js';
import '../../data/locations.js';
import '../../data/events.js';
import '../../data/eras.js';
import '../../engine/market.js';
import '../../engine/heat.js';
import '../../engine/state.js';
import '../../engine/event-engine.js';

describe('EventEngine', () => {
  let EventEngine, State, ERA_V1, EVENTS, LOCATIONS;

  beforeAll(() => {
    EventEngine = window.EventEngine;
    State = window.State;
    ERA_V1 = window.ERA_V1;
    EVENTS = window.EVENTS;
    LOCATIONS = window.LOCATIONS;
  });

  beforeEach(() => {
    State.init(ERA_V1);
  });

  // --- EVENTS data ---

  it('EVENTS is a non-empty array', () => {
    expect(Array.isArray(EVENTS) && EVENTS.length > 0).toBe(true);
  });

  it('each event has required fields', () => {
    const validTypes = ['threat', 'market', 'intel', 'flavor'];
    EVENTS.forEach(e => {
      expect(e.id).toBeTruthy();
      expect(validTypes).toContain(e.type);
      expect(typeof e.text).toBe('string');
      expect(e.text.length).toBeGreaterThan(0);
      expect(typeof e.condition).toBe('function');
      expect(typeof e.effect).toBe('function');
    });
  });

  it('event ids are unique', () => {
    const ids = EVENTS.map(e => e.id);
    const unique = [...new Set(ids)];
    expect(unique.length).toBe(EVENTS.length);
  });

  it('there are at least 2 intel events', () => {
    const intel = EVENTS.filter(e => e.type === 'intel');
    expect(intel.length).toBeGreaterThanOrEqual(2);
  });

  it('bulk_deal effect sets bulkDealActive on state', () => {
    const event = EVENTS.find(e => e.id === 'bulk_deal');
    const fakeState = { bulkDealUsed: false, activeEffects: [] };
    event.effect(fakeState);
    expect(fakeState.bulkDealActive).toBe(true);
  });

  // --- EventEngine ---

  it('selectEvent returns null when no events fire (random=1)', () => {
    const s = State.get();
    s.heat = 0;
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const origRandom = Math.random;
    Math.random = () => 1;
    const event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
    Math.random = origRandom;
    expect(event).toBeNull();
  });

  it('selectEvent returns teacher when random is below teacher chance', () => {
    // Fix for browser-test bug: turn=1 + empty stash prevent teacher from firing.
    // Set turn=2 and add stash so the teacher block is reachable.
    const s = State.get();
    s.turn = 2;
    s.heat = 100;
    State.addToStash('smarties', 5);
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const origRandom = Math.random;
    Math.random = () => 0;
    const event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
    Math.random = origRandom;
    expect(event.type).toBe('teacher');
  });

  it('resolveTeacher: low stash → no principal visit', () => {
    const s = State.get();
    // 5 smarties at $0.25, riskWeight 1 → $1.25 risk value (under $20)
    s.stash = { smarties: 5 };
    const outcome = EventEngine.resolveTeacher(s);
    expect(outcome.principalVisit).toBe(false);
  });

  it('resolveTeacher: high stash → principal visit + heat spike', () => {
    const s = State.get();
    // 3 Ferrero Rocher at $10, riskWeight 4 → $120 risk value (over $60)
    s.stash = { ferrerorocher: 3 };
    const outcome = EventEngine.resolveTeacher(s);
    expect(outcome.principalVisit).toBe(true);
    expect(outcome.heatSpike).toBe(true);
  });

  it('selectEvent skips teacher when stash is empty', () => {
    const s = State.get();
    s.turn = 2;
    s.heat = 100;
    const cafeteria = ERA_V1.locations.find(l => l.id === 'cafeteria');
    const origRandom = Math.random;
    Math.random = () => 0;
    const event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
    Math.random = origRandom;
    expect(!event || event.type !== 'teacher').toBe(true);
  });

  it('selectEvent skips teacher and bully when laidLowThisTurn', () => {
    const s = State.get();
    s.turn = 2;
    s.heat = 100;
    s.laidLowThisTurn = true;
    State.addToStash('smarties', 5);
    const cafeteria = ERA_V1.locations.find(l => l.id === 'cafeteria');
    const origRandom = Math.random;
    Math.random = () => 0;
    const event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
    Math.random = origRandom;
    expect(!event || (event.type !== 'teacher' && event.type !== 'bully')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests and verify all pass**

```bash
npm test
```

Expected: all prior tests plus 11 new event-engine tests pass. Zero failures.

- [ ] **Step 3: Commit**

```bash
git add src/tests/event-engine.test.js
git commit -m "test: port event-engine tests to Vitest"
```

---

### Task 6: Install ESLint and configure

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json`

**Context:** ESLint 9+ uses flat config (`eslint.config.js`, no `.eslintrc`). The `globals` package provides browser globals. Scope is `src/` only. `no-unused-vars` is `warn` (the IIFE `var X = window.X = ...` pattern produces false positives at module level — these warn but do not block CI). `no-undef` is `error` to catch real mistakes. Test files in `src/tests/` are covered by the `src/**/*.js` pattern; since they explicitly `import` from vitest, no undef errors occur.

- [ ] **Step 1: Install ESLint and globals**

```bash
npm install --save-dev eslint globals
```

Expected: `eslint` and `globals` appear in `package-lock.json`.

- [ ] **Step 2: Add lint script to `package.json`**

Add `"lint": "eslint src/"` to the scripts block:

```json
{
  "name": "candy-wars",
  "version": "1.6.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "eslint": "latest",
    "globals": "latest",
    "vite": "6.3.5",
    "vitest": "latest"
  }
}
```

- [ ] **Step 3: Create `eslint.config.js`**

```js
import globals from 'globals';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
];
```

- [ ] **Step 4: Run lint and verify no errors**

```bash
npm run lint
```

Expected: exits with code 0. `no-unused-vars` warnings are expected (one per engine file's IIFE variable) but do not cause non-zero exit. Zero `no-undef` errors.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js package.json package-lock.json
git commit -m "chore: add ESLint with flat config"
```

---

### Task 7: Create GitHub Actions workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Context:** Single workflow, four jobs. `test` and `lint` run in parallel. `build` depends on both. `deploy` depends on `build` and only fires on push to `main`. The `peaceiris/actions-gh-pages` action is pinned to commit SHA `84c30a85c19949d7eee79c4ff27748b70285e453` (v4.1.0) for supply-chain security. The `build` job uploads `docs/` as a GitHub Actions artifact so the output is inspectable in the Actions UI even without deploying.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml` with this exact content:

```yaml
name: CI/CD

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: docs/

  deploy:
    needs: [build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@84c30a85c19949d7eee79c4ff27748b70285e453  # v4.1.0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
          publish_branch: pages
```

- [ ] **Step 2: Verify the file is valid YAML**

```bash
node -e "require('fs').readFileSync('.github/workflows/ci.yml', 'utf8'); console.log('YAML file readable')"
```

Expected: `YAML file readable`. This checks the file is not malformed UTF-8 (full YAML validation requires a YAML parser, but syntax errors will be caught by GitHub Actions on first push).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI/CD workflow — test, lint, build, deploy"
```

---

### Task 8: Remove docs/ from git tracking and update documentation

**Files:**
- Modify: `.gitignore`
- Remove from tracking: `docs/`
- Modify: `README.md`
- Modify: `CLAUDE.md`

**Context:** `docs/` is no longer committed to `main`. CI produces it on every push. The GitHub Pages source setting must be manually changed in the GitHub UI from "main branch / docs folder" to "pages branch / root" after the first deploy completes.

- [ ] **Step 1: Add `docs/` to `.gitignore`**

Open `.gitignore` and add `docs/` as a new line. The full file should now be:

```
node_modules/
.DS_Store
*.local
.vite/
docs/
```

- [ ] **Step 2: Remove `docs/` from git tracking**

```bash
git rm -r --cached docs/
```

Expected: git stages all files under `docs/` for removal (untracked going forward). Files remain on disk.

- [ ] **Step 3: Update the Build section in `README.md`**

Find the Build section:

```markdown
## Build

```bash
npm run build   # produces docs/
git add docs/
git commit -m "chore: build"
git push
```

`docs/` is committed to git and served by GitHub Pages.
```

Replace with:

```markdown
## Build

Push to `main` — GitHub Actions builds and deploys automatically.

To preview the build locally:

```bash
npm run build   # produces docs/ locally (gitignored)
npm run preview # serve at http://localhost:4173
```
```

- [ ] **Step 4: Update the Build and Deploy section in `CLAUDE.md`**

Find:

```markdown
## Build and Deploy
```bash
npm run dev      # Vite dev server with hot reload
npm run build    # builds to docs/ — commit this folder for GitHub Pages
npm run preview  # preview built output locally
```
After `npm run build`, commit `docs/` and push to deploy.
```

Replace with:

```markdown
## Build and Deploy
```bash
npm run dev      # Vite dev server with hot reload
npm run build    # builds to docs/ locally (gitignored — do not commit)
npm run preview  # preview built output locally
npm test         # run Vitest unit tests
npm run lint     # run ESLint on src/
```
Push to `main` to trigger CI/CD. GitHub Actions runs tests, lint, build, and deploys `docs/` to the `pages` branch automatically.
```

- [ ] **Step 5: Run tests and lint one final time to confirm everything still passes**

```bash
npm test && npm run lint
```

Expected: all tests pass, lint exits 0.

- [ ] **Step 6: Commit**

```bash
git add .gitignore README.md CLAUDE.md
git commit -m "chore: remove docs/ from git tracking — CI deploys to pages branch"
```

- [ ] **Step 7: Manual GitHub UI step (after pushing)**

After pushing these commits to `main` and the first CI deploy completes:

1. Go to `https://github.com/wsguede/ai-game/settings/pages`
2. Under "Build and deployment", change Source to **Deploy from a branch**
3. Set Branch to **pages**, folder to **/ (root)**
4. Save

The `pages` branch is created automatically by `peaceiris/actions-gh-pages` on first deploy.
