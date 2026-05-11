# Candy Wars v1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish and restructure Candy Wars with a 180-day school year, fixed calendar events, a startup dialog, emojis in the status bar, and a score-based ending.

**Architecture:** Six focused changes across data, engine, and UI layers. Data changes (eras.js, events.js) are done first since the calendar events system depends on them. Each subsequent task is independently verifiable in the browser. No build step — open `index.html` directly to test.

**Tech Stack:** Vanilla JS (IIFE modules), plain HTML/CSS, no dependencies.

---

## Task 1: Era Config — 180 days, calendar events, remove winGoals

**Files:**
- Modify: `data/eras.js`

The era config drives almost every system. Update it first so everything downstream has the right values.

- [ ] **Step 1: Replace ERA_V1 in `data/eras.js`**

Replace the entire file contents with:

```js
var ERA_V1 = {
  id: 'elementary',
  name: 'ELEMENTARY SCHOOL',
  candies: CANDIES,
  locations: LOCATIONS,
  events: EVENTS,
  maxTurns: 180,
  startingCash: 10.00,
  stashCapacity: 30,
  calendarEvents: {
    40:  HALLOWEEN_SPIKE,
    41:  HALLOWEEN_CRASH,
    98:  VALENTINES_SURGE,
    135: SPRING_BREAK,
  },
  lossMessage: "Detention. No recess for a week. Summer is going to suck.",
};
```

- [ ] **Step 2: Verify the file looks correct, then open `index.html` in a browser**

The game should still load without JS errors in the console. The win goals are gone — the game will break at day 180 in a later step, but it should boot fine for now.

- [ ] **Step 3: Commit**

```bash
git add data/eras.js
git commit -m "feat: era config for v1.2 — 180 days, calendar events map, remove winGoals"
```

---

## Task 2: Events Data — calendar events as named vars, spring break, fix halloween, scale intel

**Files:**
- Modify: `data/events.js`

The three calendar events (halloween spike/crash, Valentine's surge) move out of the random `EVENTS[]` pool and become named module-level variables that `eras.js` references directly. A new `spring_break` event is added. The halloween spike fix changes `turnsLeft` from 2 to 1 so it doesn't overlap with the crash on day 41. Intel event conditions are scaled from the original 30-day game to 180 days.

- [ ] **Step 1: Replace `data/events.js` entirely**

```js
// Calendar events — not in the random pool; referenced directly by era calendarEvents map.
// Effects are applied BEFORE price calculation on their day (same-day visibility).
var HALLOWEEN_SPIKE = {
  id: 'halloween_spike', type: 'market', cssClass: 'market',
  text: '!! HALLOWEEN !! Everyone wants candy. Prices surging across the board today.',
  effect: function(state) {
    state.activeEffects.push({ id: 'halloween_spike', type: 'allCandy', modifier: 1.30, turnsLeft: 1 });
  },
};
var HALLOWEEN_CRASH = {
  id: 'halloween_crash', type: 'market', cssClass: 'market',
  text: '!! POST-HALLOWEEN !! Sugar crash. Everyone is sick of candy. Prices dropping today.',
  effect: function(state) {
    state.activeEffects.push({ id: 'halloween_crash', type: 'allCandy', modifier: 0.80, turnsLeft: 1 });
  },
};
var VALENTINES_SURGE = {
  id: 'valentines_surge', type: 'market', cssClass: 'market',
  text: '!! VALENTINE\'S DAY !! Rich kids in a panic. Premium candy prices surge for 2 days.',
  effect: function(state) {
    state.activeEffects.push({ id: 'valentines_surge', type: 'byRisk', risk: 'high', modifier: 1.40, turnsLeft: 2 });
  },
};
var SPRING_BREAK = {
  id: 'spring_break', type: 'market', cssClass: 'market',
  text: '!! SPRING BREAK !! Energy is high and everyone is stocking up. Prices up across the board for 2 days.',
  effect: function(state) {
    state.activeEffects.push({ id: 'spring_break', type: 'allCandy', modifier: 1.25, turnsLeft: 2 });
  },
};

// Random event pool — fires with 40% chance on non-calendar days.
// Add allowOnDay1: false to any future events that shouldn't fire on turn 1.
var EVENTS = [
  {
    id: 'bulk_deal',
    type: 'market',
    cssClass: 'market',
    text: 'OPPORTUNITY: A 5th grader is moving product cheap. Bulk deal available — up to 10 units of any candy at 20% off this turn.',
    condition: function(state) { return !state.bulkDealUsed; },
    effect: function(state) { state.bulkDealActive = true; },
  },
  {
    id: 'tip_playground_spike',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Word is the playground is running low on penny candy. Prices there will be way up tomorrow.',
    condition: function(state) { return state.turn < 170 && !state.activeEffects.some(function(e) { return e.id === 'tip_playground_spike'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'tip_playground_spike', type: 'byLocation', location: 'playground', risk: 'low', modifier: 1.50, turnsLeft: 1 });
    },
  },
  {
    id: 'tip_library_spike',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Rich kids in the library are desperate for something fancy. High-end candy will go for a premium tomorrow.',
    condition: function(state) { return state.turn < 170 && !state.activeEffects.some(function(e) { return e.id === 'tip_library_spike'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'tip_library_spike', type: 'byLocation', location: 'library', risk: 'high', modifier: 1.40, turnsLeft: 1 });
    },
  },
  {
    id: 'tip_teacher_sick',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Mrs. Henderson called in sick. Patrol risk is lower everywhere tomorrow.',
    condition: function(state) { return state.turn < 170; },
    effect: function(state) { state.teacherSickNextTurn = true; },
  },
  {
    id: 'tip_black_market',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Someone whispers: "Check the bathroom tomorrow. Rare stuff coming in."',
    condition: function(state) { return state.turn < 170 && !state.activeEffects.some(function(e) { return e.id === 'tip_black_market'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'tip_black_market', type: 'byLocation', location: 'bathroom', risk: 'high', modifier: 0.70, turnsLeft: 1 });
    },
  },
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

- [ ] **Step 2: Verify in browser**

Open `index.html`. Check the browser console — no JS errors. The game should still boot. Play through a few turns to confirm random events still fire (intel tips, flavor, bulk deal). Calendar events won't work yet (that's Task 4).

- [ ] **Step 3: Commit**

```bash
git add data/events.js
git commit -m "feat: calendar events as named vars, add spring_break, fix halloween turnsLeft, scale intel to 170"
```

---

## Task 3: Day 1 Protection

**Files:**
- Modify: `engine/event-engine.js`

Add a filter at the top of `selectEvent()` that strips out teacher and bully encounters on turn 1. Also filter any event with `allowOnDay1 === false` (for future negative market events). The player's first turn should always be safe.

- [ ] **Step 1: Update `selectEvent()` in `engine/event-engine.js`**

Replace the entire `selectEvent` function:

```js
function selectEvent(state, location, era) {
  var s = state;

  // Day 1: no threats or negative events — give the player a safe first turn
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

  if (Math.random() > 0.40) return null;
  var eligible = era.events.filter(function(e) {
    if (s.turn === 1 && e.allowOnDay1 === false) return false;
    return e.type !== 'threat' && e.condition(s);
  });
  if (eligible.length === 0) return null;
  var event = eligible[Math.floor(Math.random() * eligible.length)];
  return event;
}
```

- [ ] **Step 2: Verify in browser**

Reload the game about 10 times. On turn 1, you should never see a teacher or bully event. On turn 2+, both should be possible. Check the console for errors.

- [ ] **Step 3: Commit**

```bash
git add engine/event-engine.js
git commit -m "feat: no teacher/bully events on day 1"
```

---

## Task 4: Calendar Events in Game Loop

**Files:**
- Modify: `engine/game.js`

In `startTurn()`, check the era's `calendarEvents` map before calling `Market.updatePrices()`. If today is a calendar day, apply the event's effect to `activeEffects` first — so when prices update, the modifier is already active and the player sees the boosted/reduced prices on the same day as the notification. Skip random event selection on calendar days.

- [ ] **Step 1: Replace `startTurn()` in `engine/game.js`**

Replace the entire `startTurn` function (lines 8–70):

```js
function startTurn() {
  var s = State.get();
  s.pendingNotifications = [];

  // Apply calendar event effect BEFORE price update — player sees prices and event on same day
  var calEventObj = s.era.calendarEvents ? s.era.calendarEvents[s.turn] : null;
  if (calEventObj) {
    EventEngine.executeEffect(calEventObj, s);
  }

  // Market update
  var newPrices = Market.updatePrices(s.currentPrices, s.era.candies, s.activeEffects);
  s.previousPrices = JSON.parse(JSON.stringify(s.currentPrices));
  s.currentPrices = newPrices;

  // Decay active effects
  s.activeEffects = s.activeEffects
    .map(function(e) { return Object.assign({}, e, { turnsLeft: e.turnsLeft - 1 }); })
    .filter(function(e) { return e.turnsLeft > 0; });

  // Reset per-turn flags
  s.teacherSickThisTurn = s.teacherSickNextTurn;
  s.teacherSickNextTurn = false;
  s.bulkDealActive = false;

  // Allowance: every 5 days mom gives you $5
  if (s.turn % 5 === 0) {
    s.cash = Math.round((s.cash + 5) * 100) / 100;
    s.pendingNotifications.push('<strong>ALLOWANCE DAY</strong> — Mom slips you $5 for doing your chores.');
  }

  // Travel hint: first 2 times the player moves locations
  if (s._travelHint) {
    s._travelHint = false;
    s.pendingNotifications.push('<strong>HEADS UP</strong> — Moving to a new location uses your whole day.');
  }

  // Calendar events take priority over random selection
  if (calEventObj) {
    s.pendingEvent = calEventObj;
  } else {
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    var event = EventEngine.selectEvent(s, location, s.era);
    s.pendingEvent = event;

    if (event && event.type !== 'teacher' && event.type !== 'bully') {
      EventEngine.executeEffect(event, s);
    }

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
  }

  UI.render(s);
}
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. Use browser dev tools to temporarily override the turn counter to test a calendar day. In the console:

```js
// Test Halloween on day 40
var s = State.get();
s.turn = 40;
// Then manually trigger: Game.endTurn() won't work mid-session, but you can call:
// Reload, then skip turns via endTurn until you reach day 40 — or just watch console output.
```

A simpler check: play a few turns and confirm no console errors. The full calendar test will be visible during a real playthrough on day 40.

- [ ] **Step 3: Commit**

```bash
git add engine/game.js
git commit -m "feat: calendar events fire before price update, replace random event on their day"
```

---

## Task 5: Win/Loss Screen Simplification

**Files:**
- Modify: `engine/ui.js`
- Modify: `engine/game.js`

Remove grade logic from `renderWin()` — end screen shows final cash only. Fix `endTurn()` to always call `renderWin()` at day 180 (no minimum cash check). Fix `renderLoss()` to not hardcode "Day 30".

- [ ] **Step 1: Replace `renderWin()` in `engine/ui.js`**

Replace the existing `renderWin` function:

```js
function renderWin(state) {
  document.getElementById('end-content').innerHTML =
    '<h1>SCHOOL\'S OUT</h1>' +
    '<div class="grade">★</div>' +
    '<p>Summer starts now. You hustled for 180 days and walked away with:</p>' +
    '<p class="green" style="font-size:22px;margin:16px 0;letter-spacing:2px">$' + state.cash.toFixed(2) + '</p>' +
    '<p style="color:#666;font-size:11px;">180 days · ' + state.principalVisits + '/3 principal visits</p>' +
    '<button class="action-btn" style="margin-top:20px" onclick="location.reload()">PLAY AGAIN</button>';
  document.getElementById('end-screen').classList.add('active');
}
```

- [ ] **Step 2: Replace `renderLoss()` in `engine/ui.js`**

Replace the existing `renderLoss` function:

```js
function renderLoss(state) {
  var reason = state.principalVisits >= 3
    ? 'Three strikes. Mrs. Henderson sends you to the principal one last time. Detention — indefinite.'
    : 'Time\'s up. Day ' + state.maxTurns + ' is over.';
  document.getElementById('end-content').innerHTML =
    '<h1>GAME OVER</h1>' +
    '<div class="grade fail">F</div>' +
    '<p>' + reason + '</p>' +
    '<p>' + state.era.lossMessage + '</p>' +
    '<p style="color:#666;font-size:11px;">Final cash: $' + state.cash.toFixed(2) + '</p>' +
    '<button class="action-btn" style="margin-top:20px" onclick="location.reload()">TRY AGAIN</button>';
  document.getElementById('end-screen').classList.add('active');
}
```

- [ ] **Step 3: Update `endTurn()` in `engine/game.js`**

Find this block in `endTurn()`:

```js
if (s.turn >= s.maxTurns) {
  if (s.cash >= s.era.winGoals[0].cash) UI.renderWin(s);
  else UI.renderLoss(s);
  return;
}
```

Replace it with:

```js
if (s.turn >= s.maxTurns) { UI.renderWin(s); return; }
```

- [ ] **Step 4: Verify in browser**

Open `index.html`, open the console, and run:

```js
var s = State.get(); s.turn = 180; Game.endTurn();
```

The win screen should appear showing a dollar amount and a ★ grade symbol. Run again with `s.principalVisits = 3; Game.endTurn()` — the loss screen should appear.

- [ ] **Step 5: Commit**

```bash
git add engine/ui.js engine/game.js
git commit -m "feat: score-based ending — win screen shows final cash, no grade thresholds"
```

---

## Task 6: Startup Dialog

**Files:**
- Modify: `index.html`
- Modify: `engine/game.js`

Add an intro modal overlay that shows on every page load. The player must dismiss it before the first turn starts. Same visual style as the trade modal.

- [ ] **Step 1: Add CSS to `index.html`**

Inside the `<style>` block, before the closing `</style>` tag, add:

```css
.intro-section { margin-bottom: 12px; }
.intro-label { color: #ffdd00; letter-spacing: 1px; font-size: 10px; margin-bottom: 4px; }
.intro-divider { border: none; border-top: 1px solid #2a2a2a; margin: 12px 0; }
.intro-event-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 6px; font-size: 12px; color: #bbb; }
.intro-tag { font-size: 10px; letter-spacing: 1px; padding: 1px 6px; border: 1px solid; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
.intro-tag-teacher { color: #ff4444; border-color: #662222; }
.intro-tag-bully { color: #ff8800; border-color: #663300; }
```

- [ ] **Step 2: Add intro modal markup to `index.html`**

After the closing `</div>` of the `<!-- Win/Loss Screen -->` block (after line 124), add:

```html
<!-- Intro Dialog -->
<div id="intro-modal" class="modal-overlay">
  <div class="modal">
    <h3 style="text-align:center;letter-spacing:3px;margin-bottom:16px">★ CANDY WARS ★</h3>
    <div class="intro-section">
      <div class="intro-label">THE SITUATION</div>
      <p>Summer vacation is in <strong>180 days</strong>. You want to show up with cash in your pocket. The other kids have allowances — you've got hustle. Everyone loves candy, and you know where to get it cheap.</p>
    </div>
    <div class="intro-section">
      <div class="intro-label">HOW IT WORKS</div>
      <p>Buy low, sell high. Move between locations to find the best prices. When the last bell rings, your score is whatever you've saved. Make it count.</p>
    </div>
    <hr class="intro-divider">
    <div class="intro-section">
      <div class="intro-label">WATCH OUT FOR</div>
      <div class="intro-event-row">
        <span class="intro-tag intro-tag-teacher">TEACHER</span>
        <span>Mrs. Henderson will confiscate your whole stash. Three visits to the principal and it's game over.</span>
      </div>
      <div class="intro-event-row">
        <span class="intro-tag intro-tag-bully">BULLY</span>
        <span>Tommy wants a cut. Pay him $5, make a run for it, or let him take everything — your call.</span>
      </div>
    </div>
    <button class="action-btn" style="width:100%;margin-top:16px;letter-spacing:2px" onclick="Game.closeIntro()">LET'S GET TO WORK →</button>
  </div>
</div>
```

- [ ] **Step 3: Update `engine/game.js`**

Replace the `init` function and add `closeIntro`:

```js
function init() {
  State.init(ERA_V1);
  document.getElementById('intro-modal').classList.add('active');
}

function closeIntro() {
  document.getElementById('intro-modal').classList.remove('active');
  startTurn();
}
```

Update the return object at the bottom of the IIFE to include `closeIntro`:

```js
return { init: init, endTurn: endTurn, travel: travel, layLow: layLow, openTrade: openTrade, setTradeMode: setTradeMode, fillMax: fillMax, payBully: payBully, runFromBully: runFromBully, acceptRob: acceptRob, closeIntro: closeIntro };
```

- [ ] **Step 4: Verify in browser**

Reload the page. The intro modal should appear immediately over the (uninitialized) game. Click "LET'S GET TO WORK →" — the modal should close and turn 1 should begin normally. Reload again to confirm it always shows on load.

- [ ] **Step 5: Commit**

```bash
git add index.html engine/game.js
git commit -m "feat: startup dialog with summer vacation premise and teacher/bully explainers"
```

---

## Task 7: Header Bar Emojis

**Files:**
- Modify: `engine/ui.js`

Add emojis to each field in the status bar. One-line change per field.

- [ ] **Step 1: Update `renderStatusBar()` in `engine/ui.js`**

Find this block inside `renderStatusBar`:

```js
document.getElementById('status-bar').innerHTML =
  '<div class="status-row">' +
    '<div>DAY <span>' + state.turn + '</span>/' + state.maxTurns + '</div>' +
    '<div>CASH: <span class="green">$' + state.cash.toFixed(2) + '</span></div>' +
    '<div>STASH: <span>' + State.stashTotal() + '</span>/' + state.stashCapacity + '</div>' +
    '<div>HEAT: <div class="heat-bar">' + heatPips + '</div></div>' +
    '<div>PRINCIPAL: ' + principalDots + '</div>' +
  '</div>';
```

Replace it with:

```js
document.getElementById('status-bar').innerHTML =
  '<div class="status-row">' +
    '<div>📅 DAY <span>' + state.turn + '</span>/' + state.maxTurns + '</div>' +
    '<div>💰 <span class="green">$' + state.cash.toFixed(2) + '</span></div>' +
    '<div>🎒 <span>' + State.stashTotal() + '</span>/' + state.stashCapacity + '</div>' +
    '<div>🔥 <div class="heat-bar">' + heatPips + '</div></div>' +
    '<div>🚨 ' + principalDots + '</div>' +
  '</div>';
```

- [ ] **Step 2: Verify in browser**

Reload. The status bar should show: `📅 DAY 1/180  💰 $10.00  🎒 0/30  🔥 [pips]  🚨 ■ ■ ■`

- [ ] **Step 3: Commit**

```bash
git add engine/ui.js
git commit -m "feat: emojis in status bar — day, cash, stash, heat, principal"
```

---

## Task 8: Calendar Bar (replaces Gift Progress Bar)

**Files:**
- Modify: `engine/ui.js`
- Modify: `index.html`

Replace `renderGiftProgress()` with `renderCalendarBar()`. The new section shows a 180-day school year bar with tick marks at each calendar event day, and a "SUMMER IN X DAYS" countdown.

- [ ] **Step 1: Add CSS to `index.html`**

Inside the `<style>` block (before `</style>`), add:

```css
.cal-bar-wrap { position: relative; margin-top: 4px; }
.cal-tick { position: absolute; top: 0; width: 2px; height: 8px; background: #555; transform: translateX(-50%); pointer-events: none; }
.cal-tick-label { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); font-size: 10px; white-space: nowrap; }
```

- [ ] **Step 2: Replace `renderGiftProgress()` in `engine/ui.js`**

Delete the entire `renderGiftProgress` function and replace it with:

```js
function renderCalendarBar(state) {
  var pct = Math.min(100, (state.turn / state.maxTurns) * 100);
  var daysLeft = state.maxTurns - state.turn;
  var emojiMap = {
    halloween_spike: '🎃', halloween_crash: '💀',
    valentines_surge: '💝', spring_break: '🌸',
  };
  var ticks = '';
  if (state.era.calendarEvents) {
    Object.keys(state.era.calendarEvents).forEach(function(day) {
      var evt = state.era.calendarEvents[day];
      var tickPct = (parseInt(day, 10) / state.maxTurns * 100).toFixed(1);
      var emoji = emojiMap[evt.id] || '●';
      ticks += '<div class="cal-tick" style="left:' + tickPct + '%">' +
        '<div class="cal-tick-label">' + emoji + '</div>' +
        '</div>';
    });
  }
  document.getElementById('gift-section').innerHTML =
    '<div class="section-header">SCHOOL YEAR</div>' +
    '<div class="cal-bar-wrap">' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + pct.toFixed(1) + '%"></div></div>' +
      ticks +
    '</div>' +
    '<div class="gift-label">' +
      '<span>DAY ' + state.turn + ' / ' + state.maxTurns + '</span>' +
      '<span>SUMMER IN ' + daysLeft + ' DAYS</span>' +
    '</div>';
}
```

- [ ] **Step 3: Update `render()` in `engine/ui.js` to call the new function**

Find this line in `render()`:

```js
renderGiftProgress(state);
```

Replace it with:

```js
renderCalendarBar(state);
```

- [ ] **Step 4: Verify in browser**

Reload the game. The gift section should now show "SCHOOL YEAR" with a progress bar, four emoji tick marks (🎃 💀 💝 🌸) at their respective day positions, and "DAY 1 / 180 … SUMMER IN 179 DAYS" below. Play a few turns and confirm the bar advances.

- [ ] **Step 5: Commit**

```bash
git add engine/ui.js index.html
git commit -m "feat: days tracker replaces gift progress bar — school year calendar with event ticks"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|-----------------|------|
| Header emojis: 📅 💰 🎒 🔥 🚨 | Task 7 |
| No bad events on day 1 | Task 3 |
| Startup dialog with summer vacation premise | Task 6 |
| Days tracker replaces gift progress bar | Task 8 |
| Calendar events system (fixed days 40/41/98/135) | Tasks 1, 2, 4 |
| Halloween fix (spike turnsLeft 2→1) | Task 2 |
| Same-day calendar effect visibility | Task 4 |
| 180-day game length | Task 1 |
| Win screen shows final cash only, no grades | Task 5 |
| Day 180 always triggers win (no cash minimum) | Task 5 |
| Intel conditions scaled to turn < 170 | Task 2 |
| lossMessage updated to summer framing | Task 1 |
| renderLoss uses dynamic maxTurns (not hardcoded 30) | Task 5 |
