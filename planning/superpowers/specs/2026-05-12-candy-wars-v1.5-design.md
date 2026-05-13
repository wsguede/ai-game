# Candy Wars v1.5 — Design Spec

Date: 2026-05-12
Status: Approved

## Overview

Make heat a meaningful accumulating risk. In v1.4, heat barely matters: location dominates teacher encounters, passive decay keeps heat in check without any player effort, and a teacher encounter always catches you. After v1.5, every trade session leaves a heat footprint that lingers, teacher encounters have two outcomes (caught vs. suspicious close-call), and players use Lay Low deliberately to manage exposure rather than reflexively.

---

## Feature 1: Two-Stage Teacher Resolution

Teacher encounters now have two stages: the encounter fires as before, then heat determines whether the teacher actually catches you.

### Stage 1 — Encounter trigger (unchanged)

The existing `Heat.teacherChance()` formula and the event selection logic in `EventEngine.selectEvent()` are **not changed**. The encounter fires at the same probability as today:

```
min(0.95, PATROL_CHANCE[location.patrolRisk] × (1 + heat/100 × 2))
```

### Stage 2 — Catch check (new)

After a teacher encounter is selected, a second roll determines the outcome:

```
catchChance = heat / 100
```

| Outcome | Condition | Result |
|---------|-----------|--------|
| Caught | `Math.random() < heat / 100` | Standard resolution: confiscate stash, possible principal visit |
| Suspicious | Not caught AND `heat > 0` | New flavor event fires (see below) |
| Silent | Not caught AND `heat === 0` | `pendingEvent` is set to null — no event shown |

### New suspicious event text

```
'Mrs. Henderson eyes you carefully. She knows something\'s up — but can\'t prove it.'
```

- `type: 'flavor'`
- `cssClass: 'threat'` (red border — it's a close call)
- No state mutation (no confiscation, no principal visit, no heat change)

### Implementation

Add `teacherCaught(heat)` to `heat.js`:

```js
function teacherCaught(heat) {
  return Math.random() < heat / 100;
}
```

Update the teacher resolution block in `game.js` `startTurn()`. Current block:

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

---

## Feature 2: Heat Decay Retuning

Slow passive decay so heat accumulates meaningfully across turns.

| | Before | After |
|-|--------|-------|
| Passive decay per turn | 5 | 2 |
| Library decay bonus | +10 (15/turn total) | +3 (5/turn total, ~2.5× baseline) |

**Implementation:**

In `heat.js` `decay()`, change:

```js
var amount = 5 + location.heatDecayBonus;
```

To:

```js
var amount = 2 + location.heatDecayBonus;
```

In `data/locations.js`, update the library entry:

```js
heatDecayBonus: 3,
```

And update the library tooltip to reflect the new decay rate:

```js
{ cls: 'tip-neutral', text: '~ Heat decays 2.5× faster' },
```

---

## Feature 3: Lay Low Retuning

Lay Low drops from −20 to −10. Still meaningful (5 turns of passive decay compressed into one day), but recovery from serious heat requires sustained effort rather than a single press.

**Implementation:**

In `game.js` `layLow()`, change:

```js
s.heat = Math.max(0, s.heat - 20);
```

To:

```js
s.heat = Math.max(0, s.heat - 10);
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `engine/heat.js` | Add `teacherCaught(heat)`; `decay()` base 5→2; export `teacherCaught` |
| `engine/game.js` | `startTurn()` teacher block: add two-stage catch check; `layLow()` −20→−10 |
| `data/locations.js` | Library `heatDecayBonus` 10→3; library tooltip text update |
