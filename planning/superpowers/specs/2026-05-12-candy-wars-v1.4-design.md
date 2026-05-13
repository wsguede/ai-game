# Candy Wars v1.4 — Design Spec

Date: 2026-05-12
Status: Approved

## Overview

One focused improvement: move contextual stats to where they're relevant and eliminate the redundant status row. Cash belongs near prices. Bag capacity belongs near the bag count. Heat and principal stay visible but live below the school year calendar where they don't compete for top-bar real estate. The day counter is already shown in the calendar row — no data is lost.

---

## What Changes

### Remove the status row

The `.status-row` flex row (📅 DAY / 💰 CASH / 🎒 BAG / 🔥 HEAT / 🚨 PRINCIPAL) is removed entirely. The `#status-bar` div is removed from `index.html`. `renderStatusBar()` is removed from `engine/ui.js` and its call site in `render()`.

The `.status-row` CSS rule is removed from `index.html`.

---

### Market table — emoji headers with contextual stats

The three column headers gain emojis and inline contextual values:

| Before | After |
|--------|-------|
| `CANDY` | `🍬 CANDY` |
| `PRICE` | `💰 PRICE   $24.50` (cash in green, same `#4cff72`) |
| `IN BAG` | `🎒 IN BAG   7/20` (used/capacity in muted `#aaa`) |

The cash and bag values update every render alongside the prices. Cash is formatted as `$X.XX`. Bag is formatted as `used/capacity`.

**Implementation:** In `renderMarket()`, the `<th>` elements are updated. Cash and stashUsed/stashCapacity are already available as parameters.

---

### Heat + Principal — inline row below the calendar

Heat pips and principal dots move to a right-aligned row that sits between the calendar label and the location section. A thin `border-bottom: 1px solid #1a1a1a` line below it separates the header cluster from the interactive sections.

**Layout:**
```
[progress bar]
DAY 42 / 180 ..................... SUMMER IN 138 DAYS
                    HEAT [■■■■■■□□□□]   PRINCIPAL ■ □ □
──────────────────────────────────────────────────────
LOCATION
```

**Tooltips:** Both stats get a CSS hover tooltip (same pattern as `.loc-tooltip` and `.candy-tooltip`). The tooltip appears above the element.

- **Heat tooltip:** "How much attention you've drawn. High heat means teachers and bullies are more likely to target you. Decays when you move locations or lay low."
- **Principal tooltip:** "Times you've been sent to the principal's office. Three visits and your parents get called — game over."

**HTML structure for the heat/principal row:**
```html
<div class="threat-row">
  <span class="threat-stat">
    <span class="threat-label">HEAT</span>
    <span class="heat-bar">...pips...</span>
    <div class="threat-tip">How much attention you've drawn...</div>
  </span>
  <span class="threat-stat">
    <span class="threat-label">PRINCIPAL</span>
    <span>■ □ □</span>
    <div class="threat-tip">Times you've been sent to the principal's office...</div>
  </span>
</div>
```

**New CSS classes:**
```css
.threat-row {
  display: flex; justify-content: flex-end; gap: 16px;
  font-size: 11px; color: #555;
  padding: 4px 0 8px;
  border-bottom: 1px solid #1a1a1a;
  margin-bottom: 2px;
}
.threat-stat { position: relative; display: inline-flex; align-items: center; gap: 5px; cursor: default; }
.threat-label { font-size: 9px; letter-spacing: 1px; color: #444; }
.threat-stat:hover .threat-tip { display: block; }
.threat-tip {
  display: none; position: absolute; bottom: 140%; right: 0;
  background: #1a1a1a; border: 1px solid #555;
  padding: 8px 12px; width: 200px; z-index: 10;
  font-size: 11px; line-height: 1.6; color: #ccc;
  pointer-events: none; white-space: normal;
}
```

**Implementation:** `renderCalendarBar(state)` already receives the full state object, so `state.heat` and `state.principalVisits` are available. The heat pips and principal dots logic moves from `renderStatusBar()` into `renderCalendarBar()`.

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `index.html` | Remove `#status-bar` div; remove `.status-row` CSS; add `.threat-row`, `.threat-stat`, `.threat-label`, `.threat-tip` CSS |
| `engine/ui.js` | Remove `renderStatusBar()`; remove its call in `render()`; add heat/principal row to `renderCalendarBar()`; update `renderMarket()` column headers with emojis and contextual stats |
