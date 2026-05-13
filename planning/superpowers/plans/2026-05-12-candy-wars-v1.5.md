# Candy Wars v1.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make heat a meaningful accumulating risk by slowing decay, weakening Lay Low, and splitting teacher encounters into a two-stage catch/suspicious system.

**Architecture:** Three files change — `engine/heat.js` (new `teacherCaught()` function, slower `decay()`), `engine/game.js` (teacher resolution block rewrite, Lay Low tuning), `data/locations.js` (library decay bonus + tooltip). The browser test harness at `tests/index.html` imports `heat.js` directly, so logic changes there have automated tests. `game.js` changes are verified by opening `index.html` in a browser. No new state, no new data files.

**Tech Stack:** Vanilla JS, plain HTML/CSS, no build tools. Tests run by opening `tests/index.html` in a browser. Game verified by opening `index.html` in a browser. Zero console errors required.

---

### Task 1: Heat decay retuning — `engine/heat.js` + `data/locations.js`

Slow passive heat decay from 5/turn to 2/turn. Reduce library's decay bonus from +10 to +3 so library stays ~2.5× faster than baseline without being a 6× outlier.

**Files:**
- Modify: `engine/heat.js` (line 12)
- Modify: `data/locations.js` (library `heatDecayBonus` and tooltip)
- Modify: `tests/test-heat.js` (3 existing decay tests need updated expected values)

- [ ] **Step 1: Update the three existing decay tests to reflect the new values**

In `tests/test-heat.js`, replace the three decay tests (currently lines 11–24):

```js
test('Heat.decay: removes 2 heat by default', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  assertEqual(Heat.decay(20, cafeteria), 18);
});

test('Heat.decay: library removes 5 heat (2 + 3 bonus)', function() {
  var library = LOCATIONS.find(function(l) { return l.id === 'library'; });
  assertEqual(Heat.decay(20, library), 15);
});

test('Heat.decay: does not go below 0', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  assertEqual(Heat.decay(1, cafeteria), 0);
});
```

- [ ] **Step 2: Open `tests/index.html` in a browser and confirm these 3 tests now FAIL**

Expected: the three decay tests show ✗ (red). All other tests remain ✓. Browser console shows zero errors.

- [ ] **Step 3: Update `decay()` in `engine/heat.js`**

Change line 12 from:
```js
    var amount = 5 + location.heatDecayBonus;
```
To:
```js
    var amount = 2 + location.heatDecayBonus;
```

- [ ] **Step 4: Update library `heatDecayBonus` in `data/locations.js`**

In the library entry, change:
```js
    heatDecayBonus: 10,
```
To:
```js
    heatDecayBonus: 3,
```

- [ ] **Step 5: Update the library tooltip text in `data/locations.js`**

In the library entry's tooltip array, change:
```js
      { cls: 'tip-neutral', text: '~ Heat decays 2x faster' },
```
To:
```js
      { cls: 'tip-neutral', text: '~ Heat decays 2.5× faster' },
```

- [ ] **Step 6: Open `tests/index.html` and confirm all tests pass**

Expected: all tests ✓, zero failures, zero console errors.

- [ ] **Step 7: Commit**

```bash
git add engine/heat.js data/locations.js tests/test-heat.js
git commit -m "feat: slow heat decay — 2/turn base, library bonus +3"
```

---

### Task 2: Add `teacherCaught()` to `engine/heat.js`

Add the function that determines whether a teacher encounter results in an actual catch. Returns `true` with probability `heat / 100`. At 0 heat it always returns false; at 100 heat it always returns true.

**Files:**
- Modify: `engine/heat.js` (new function + export)
- Modify: `tests/test-heat.js` (3 new tests)

- [ ] **Step 1: Add 3 new tests to `tests/test-heat.js`**

Append to the end of `tests/test-heat.js`:

```js
test('Heat.teacherCaught: always false at 0 heat', function() {
  for (var i = 0; i < 20; i++) {
    assertEqual(Heat.teacherCaught(0), false);
  }
});

test('Heat.teacherCaught: always true at 100 heat', function() {
  for (var i = 0; i < 20; i++) {
    assertEqual(Heat.teacherCaught(100), true);
  }
});

test('Heat.teacherCaught: returns a boolean', function() {
  var result = Heat.teacherCaught(50);
  assertTrue(result === true || result === false, 'should return boolean');
});
```

- [ ] **Step 2: Open `tests/index.html` and confirm these 3 new tests FAIL**

Expected: 3 new tests show ✗ with "Heat.teacherCaught is not a function" (or similar). All other tests remain ✓.

- [ ] **Step 3: Add `teacherCaught()` to `engine/heat.js`**

Add the new function after `bullyChance` (after line 27):

```js
  // Whether a teacher encounter results in a catch (heat / 100 probability)
  function teacherCaught(heat) {
    return Math.random() < heat / 100;
  }
```

Then update the return statement (currently line 58) to export the new function:

```js
  return { generate: generate, decay: decay, teacherChance: teacherChance, bullyChance: bullyChance, teacherCaught: teacherCaught, stashRiskValue: stashRiskValue, resolveTeacherCatch: resolveTeacherCatch, applyTeacherCatch: applyTeacherCatch, applyBullyRob: applyBullyRob };
```

- [ ] **Step 4: Open `tests/index.html` and confirm all tests pass**

Expected: all tests ✓, zero failures, zero console errors.

- [ ] **Step 5: Commit**

```bash
git add engine/heat.js tests/test-heat.js
git commit -m "feat: teacherCaught — heat-based catch probability"
```

---

### Task 3: Two-stage teacher resolution in `engine/game.js`

**Depends on Task 2** — `Heat.teacherCaught()` must exist before this task runs.

Replace the teacher resolution block in `startTurn()` so that a teacher encounter first checks `Heat.teacherCaught(s.heat)`. If not caught and heat > 0, a suspicious event fires. If not caught and heat is 0, the event resolves silently. If caught, the existing confiscation + principal logic runs unchanged.

**Files:**
- Modify: `engine/game.js` (teacher resolution block inside `startTurn()`, currently lines 59–76)

- [ ] **Step 1: Replace the teacher resolution block in `engine/game.js`**

Find this block (inside `startTurn()`, after the bully check):

```js
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
```

Replace with:

```js
      if (event && event.type === 'teacher') {
        if (!Heat.teacherCaught(s.heat)) {
          if (s.heat > 0) {
            s.pendingEvent = { type: 'flavor', cssClass: 'threat',
              text: 'Mrs. Henderson eyes you carefully. She knows something\'s up — but can\'t prove it.' };
          } else {
            s.pendingEvent = null;
          }
        } else {
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
      }
```

- [ ] **Step 2: Open `tests/index.html` and confirm all tests still pass**

Expected: all tests ✓, zero failures, zero console errors. (No game.js tests exist — this is a sanity check that no imports broke.)

- [ ] **Step 3: Verify in browser — suspicious event path**

Open `index.html`. In the browser console, run:

```js
var s = State.get();
s.heat = 30;
```

Then end several turns without trading (to keep heat around 30). When a teacher encounter fires, you should sometimes see:

> "Mrs. Henderson eyes you carefully. She knows something's up — but can't prove it."

displayed in the red event box. The stash should be **unchanged** after this message. No principal visit counter increment.

- [ ] **Step 4: Verify in browser — caught path still works**

In the browser console, run:

```js
var s = State.get();
s.heat = 95;
s.stash = { smarties: 5 };
```

End a turn. With 95% catch probability at this heat level, a teacher encounter should very likely result in confiscation ("A teacher spots you. She confiscates everything..."). Stash empties.

- [ ] **Step 5: Verify in browser — silent path at 0 heat**

In the browser console, run:

```js
var s = State.get();
s.heat = 0;
```

End several turns in the cafeteria (high patrol). Even though encounter probability still exists, no teacher event box should appear (silent resolution). No stash change, no event message.

- [ ] **Step 6: Commit**

```bash
git add engine/game.js
git commit -m "feat: two-stage teacher resolution — caught vs suspicious"
```

---

### Task 4: Lay Low retuning — `engine/game.js`

Reduce Lay Low's heat reduction from −20 to −10. One-line change.

**Files:**
- Modify: `engine/game.js` (`layLow()` function)

- [ ] **Step 1: Update `layLow()` in `engine/game.js`**

Find (inside `layLow()`):

```js
    s.heat = Math.max(0, s.heat - 20);
```

Replace with:

```js
    s.heat = Math.max(0, s.heat - 10);
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. In the browser console, run:

```js
var s = State.get();
s.heat = 50;
```

Click LAY LOW. After the turn advances, open the console and check:

```js
State.get().heat;
```

Expected: `38` (50 − 10 Lay Low − 2 passive decay = 38). If the result is `28`, the old `−20` value is still active.

- [ ] **Step 3: Open `tests/index.html` and confirm all tests still pass**

Expected: all tests ✓, zero failures.

- [ ] **Step 4: Commit**

```bash
git add engine/game.js
git commit -m "feat: lay low heat reduction -20 → -10"
```
