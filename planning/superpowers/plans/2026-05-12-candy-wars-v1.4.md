# Candy Wars v1.4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant status bar and move contextual stats — cash + bag into the market table headers, heat + principal into an inline row below the calendar.

**Architecture:** All changes are in `index.html` (HTML structure + CSS) and `engine/ui.js` (rendering functions). No new state, no new data files. `renderStatusBar()` is deleted; its heat/principal logic moves into `renderCalendarBar()`. `renderMarket()` gains emoji column headers with inline cash and bag values. Visual testing only — `engine/ui.js` is not imported by the test harness.

**Tech Stack:** Vanilla JS, plain HTML/CSS, no build tools. Verify by opening `index.html` directly in a browser (or a local file server). The browser console must show zero errors.

---

### Task 1: Remove the status bar

Remove every trace of the old status row — the HTML element, its CSS rules, the JS function, and its call site.

**Files:**
- Modify: `index.html` (lines 11-12 CSS, line 122 HTML)
- Modify: `engine/ui.js` (lines 7-26 function, line 214 call)

- [ ] **Step 1: Remove the CSS rules**

In `index.html`, delete these two lines from the `<style>` block (currently lines 11-12):

```
.status-row { display: flex; justify-content: space-between; color: #aaa; border-bottom: 1px solid #222; padding-bottom: 8px; margin-bottom: 12px; }
.status-row span { color: #fff; }
```

- [ ] **Step 2: Remove the HTML element**

In `index.html`, delete this line from the `<body>` (currently line 122):

```html
    <div id="status-bar"></div>
```

- [ ] **Step 3: Delete `renderStatusBar()` from `engine/ui.js`**

Remove the entire function (currently lines 7-26):

```js
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
        '<div>📅 DAY <span>' + state.turn + '</span>/' + state.maxTurns + '</div>' +
        '<div>💰 <span class="green">$' + state.cash.toFixed(2) + '</span></div>' +
        '<div>🎒 <span>' + State.stashTotal() + '</span>/' + state.stashCapacity + '</div>' +
        '<div>🔥 <div class="heat-bar">' + heatPips + '</div></div>' +
        '<div>🚨 ' + principalDots + '</div>' +
      '</div>';
  }
```

- [ ] **Step 4: Remove the `renderStatusBar` call from `render()`**

In `engine/ui.js`, `render()` currently starts (line 212-221):

```js
  function render(state) {
    var location = state.era.locations.find(function(l) { return l.id === state.currentLocation; });
    renderStatusBar(state);
    renderCalendarBar(state);
    ...
  }
```

Remove the `renderStatusBar(state);` line so it reads:

```js
  function render(state) {
    var location = state.era.locations.find(function(l) { return l.id === state.currentLocation; });
    renderCalendarBar(state);
    renderLocations(state.era.locations, state.currentLocation);
    renderMarket(state.era.candies, state.currentPrices, state.previousSeenPrices, state.stash, location, state.activeEffects, state.cash, state.stashCapacity);
    renderNotifications(state.pendingNotifications);
    renderEvent(state.pendingEvent);
    renderActions(state, state.pendingEvent);
  }
```

- [ ] **Step 5: Verify in browser**

Open `index.html` in a browser. Start a new game. Confirm:
- No status row (DAY / CASH / BAG / HEAT / PRINCIPAL) appears at the top
- No JavaScript console errors
- Game renders normally otherwise

- [ ] **Step 6: Commit**

```bash
git add index.html engine/ui.js
git commit -m "feat: remove status bar row"
```

---

### Task 2: Market table — emoji headers with contextual cash and bag values

Update the three `<th>` elements in `renderMarket()` to include emojis and live cash/bag values.

**Files:**
- Modify: `engine/ui.js` (the header `<tr>` inside `renderMarket()`, currently line 142)

- [ ] **Step 1: Update the header row**

In `engine/ui.js`, inside `renderMarket()`, the current header `<tr>` is:

```js
      '<tr><th>CANDY</th><th>PRICE</th><th>IN BAG</th></tr>' +
```

Replace it with:

```js
      '<tr>' +
        '<th>🍬 CANDY</th>' +
        '<th>💰 PRICE &nbsp;<span style="color:#4cff72;font-weight:normal;letter-spacing:0">$' + cash.toFixed(2) + '</span></th>' +
        '<th>🎒 IN BAG &nbsp;<span style="color:#aaa;font-weight:normal;letter-spacing:0">' + stashUsed + '/' + stashCapacity + '</span></th>' +
      '</tr>' +
```

`cash`, `stashUsed`, and `stashCapacity` are already in scope: `cash` is a parameter; `stashUsed` is computed at the top of `renderMarket()` from `stash`.

- [ ] **Step 2: Verify in browser**

Open `index.html` in a browser. Start a game. Confirm:
- Market headers read: `🍬 CANDY` / `💰 PRICE $XX.XX` (cash in green `#4cff72`) / `🎒 IN BAG X/20` (muted `#aaa`)
- The cash and bag values update when you buy/sell
- No console errors

- [ ] **Step 3: Commit**

```bash
git add engine/ui.js
git commit -m "feat: market headers — emojis and contextual cash/bag values"
```

---

### Task 3: Heat + Principal inline row below the calendar with tooltips

Add the CSS classes and update `renderCalendarBar()` to append the heat/principal row with hover tooltips below the day counter.

**Files:**
- Modify: `index.html` (add CSS before closing `</style>`)
- Modify: `engine/ui.js` (`renderCalendarBar()`)

- [ ] **Step 1: Add CSS to `index.html`**

In `index.html`, just before the closing `</style>` tag (currently after line 116, the `.dbg-divider` rule), add:

```css
    .threat-row { display: flex; justify-content: flex-end; gap: 16px; font-size: 11px; color: #555; padding: 4px 0 8px; border-bottom: 1px solid #1a1a1a; margin-bottom: 2px; }
    .threat-stat { position: relative; display: inline-flex; align-items: center; gap: 5px; cursor: default; }
    .threat-label { font-size: 9px; letter-spacing: 1px; color: #444; }
    .threat-stat:hover .threat-tip { display: block; }
    .threat-tip { display: none; position: absolute; bottom: 140%; right: 0; background: #1a1a1a; border: 1px solid #555; padding: 8px 12px; width: 200px; z-index: 10; font-size: 11px; line-height: 1.6; color: #ccc; pointer-events: none; white-space: normal; }
```

- [ ] **Step 2: Update `renderCalendarBar()` in `engine/ui.js`**

Replace the entire `renderCalendarBar` function (currently lines 28-56) with:

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
    var heatPips = '';
    for (var i = 0; i < 10; i++) {
      var threshold = (i + 1) * 10;
      var cls = state.heat >= threshold ? (state.heat >= 70 ? 'active' : 'warn') : '';
      heatPips += '<div class="heat-pip ' + cls + '"></div>';
    }
    var principalDots = '';
    for (var j = 0; j < 3; j++) {
      principalDots += '<span style="color:' + (j < state.principalVisits ? '#ff4444' : '#333') + '">■</span>';
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
      '</div>' +
      '<div class="threat-row">' +
        '<span class="threat-stat">' +
          '<span class="threat-label">HEAT</span>' +
          '<span class="heat-bar">' + heatPips + '</span>' +
          '<div class="threat-tip">How much attention you\'ve drawn. High heat means teachers and bullies are more likely to target you. Decays when you move locations or lay low.</div>' +
        '</span>' +
        '<span class="threat-stat">' +
          '<span class="threat-label">PRINCIPAL</span>' +
          '<span>' + principalDots + '</span>' +
          '<div class="threat-tip">Times you\'ve been sent to the principal\'s office. Three visits and your parents get called — game over.</div>' +
        '</span>' +
      '</div>';
  }
```

- [ ] **Step 3: Verify in browser**

Open `index.html` in a browser. Start a game. Confirm:

- Below the DAY X / SUMMER IN Y DAYS label: a right-aligned row shows `HEAT [pips]` and `PRINCIPAL [dots]`
- A thin `1px solid #1a1a1a` line separates this row from the LOCATION section below
- Hovering over the HEAT stat shows: *"How much attention you've drawn. High heat means teachers and bullies are more likely to target you. Decays when you move locations or lay low."*
- Hovering over the PRINCIPAL stat shows: *"Times you've been sent to the principal's office. Three visits and your parents get called — game over."*
- Heat pips update correctly after trades and laying low (orange for < 70%, red for ≥ 70%)
- Principal dots update after a teacher event sends you to the office
- No console errors

- [ ] **Step 4: Commit**

```bash
git add index.html engine/ui.js
git commit -m "feat: heat and principal inline row below calendar with tooltips"
```
