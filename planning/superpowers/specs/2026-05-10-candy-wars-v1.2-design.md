# Candy Wars v1.2 — Design Spec

Date: 2026-05-10
Status: Approved

## Overview

Six cleanup and polish changes discovered during v1.1 playtesting. No new mechanics — the focus is on presentation, feel, and making the calendar-driven events structurally sound.

---

## Feature 1: Header Bar Emojis

Add emojis to each field in the status bar for visual clarity and personality.

| Field | Emoji |
|-------|-------|
| Day | 📅 |
| Cash | 💰 |
| Stash | 🎒 |
| Heat | 🔥 |
| Principal | 🚨 |

**Change:** `engine/ui.js` → `renderStatusBar()`. Prepend emoji to each label string.

---

## Feature 2: Day 1 Protection

No negative events fire on the first turn. The player gets a safe day to orient and make their first trade.

**What is blocked on day 1:**
- Events with `type === 'teacher'`
- Events with `type === 'bully'`
- Events with `allowOnDay1 === false`

**Change:** `engine/event-engine.js` → `selectEvent()`. When `state.turn === 1`, filter the candidate pool before selection. Add `allowOnDay1: false` to any negative market events in `data/events.js` for future-proofing.

---

## Feature 3: Startup Dialog

A single modal that shows on every page load. Gives world context before the player's first action.

**Content:**
- Title: ★ CANDY WARS ★
- Premise: Summer vacation is in 180 days. You want to show up with cash. Everyone loves candy — buy low, sell high.
- How it works: Move between locations, 180 days, score is your final cash.
- Watch out for: Teacher (confiscation + 3-strike principal rule) and Bully (pay $5 / run 50-50 / accept rob).
- Button: `LET'S GET TO WORK →`

**Behavior:** Modal overlay, same CSS pattern as the trade modal. Dismissed by button click only. No persistence — shows on every reload.

**Changes:**
- `index.html`: Add `#intro-modal` overlay markup and CSS
- `engine/game.js`: Call `document.getElementById('intro-modal').classList.add('active')` in `init()`. Add `closeIntro()` function that removes `active` class and calls `startTurn()`.
- `init()` no longer calls `startTurn()` directly — `closeIntro()` does.

---

## Feature 4: Days Tracker (replaces Gift Progress Bar)

The "Mom's Gift Fund" progress bar is replaced by a school-year calendar bar. No goal tracking — pure time visualization.

**Display:**
- Label: `SCHOOL YEAR`
- Progress bar: fills based on `turn / 180`
- Tick marks at calendar event days: 40 (🎃), 41, 98 (💝), 135 (🌸)
- Below bar: `DAY X / 180` on left, `SUMMER IN Y DAYS` on right

**Changes:**
- `engine/ui.js`: Rename `renderGiftProgress()` to `renderCalendarBar()`. Rewrite to render day-based bar with tick marks derived from `state.era.calendarEvents`. Update `render()` call site.
- `index.html`: Add CSS for `.cal-tick` positioned elements.

---

## Feature 5: Calendar Events System

Halloween and Valentine's Day become fixed calendar events. Spring Break is added as a fourth. All four are guaranteed to fire on their exact day, replacing random event selection for that turn.

**Calendar:**

| Day | Event ID | Effect |
|-----|----------|--------|
| 40 | `halloween_spike` | All candy +30%, `turnsLeft: 1` |
| 41 | `halloween_crash` | All candy −20%, `turnsLeft: 1` |
| 98 | `valentines_surge` | High-risk candy +40%, `turnsLeft: 2` |
| 135 | `spring_break` | All candy +25%, `turnsLeft: 2` |

**Halloween fix:** `halloween_spike` changes from `turnsLeft: 2` to `turnsLeft: 1`. This eliminates the day-41 overlap where both the spike tail and the crash were active simultaneously.

**Architecture:**
- Era config gains `calendarEvents: { 40: 'halloween_spike', 41: 'halloween_crash', 98: 'valentines_surge', 135: 'spring_break' }`.
- In `startTurn()`, before `Market.updatePrices()`, check `s.era.calendarEvents[s.turn]`. If found: look up the event by ID, call `EventEngine.executeEffect(event, s)` to push the effect into `activeEffects`, then set `s.pendingEvent = event`. Skip random event selection for that turn.
- By applying the effect before price calculation, the player sees the event notification and the updated prices on the same day.
- `halloween_spike`, `halloween_crash`, `valentines_surge` are removed from the random `EVENTS[]` array in `data/events.js`.
- New `spring_break` event added to `data/events.js` (type: `market`, cssClass: `market`).

**Changes:**
- `data/eras.js`: Add `calendarEvents` map
- `data/events.js`: Remove 3 events from pool, add `spring_break`, fix `halloween_spike` turnsLeft
- `engine/game.js`: Calendar check in `startTurn()` before price update

---

## Feature 6: Premise & Ending Changes

**Premise:** Summer vacation replaces the birthday gift goal. Framing: 180 days until summer, score is final cash.

**Game length:** `maxTurns: 180` (was 100).

**Win condition:** Day 180 always triggers `renderWin()` — no minimum cash check. Three principal visits remain the only true loss condition. The `endTurn()` check becomes:

```js
if (s.turn >= s.maxTurns) { UI.renderWin(s); return; }
```

**Win screen:** Shows final cash only. No grade loop. Simple message: "School's out. You saved $X over 180 days."

**`winGoals` array:** Removed from era config entirely.

**`lossMessage`:** Updated to summer framing.

**Allowance:** Still fires every 5 days. Over 180 days that's 36 allowance payments ($5 each = $180 total). No change needed.

**Intel event conditions:** `tip_playground_spike`, `tip_library_spike`, `tip_black_market` currently cap at `turn < 25/27/28`. Scale to match the 180-day game with a 10-day end buffer: all intel tips capped at `turn < 170`. `tip_teacher_sick` caps at `turn < 28` → `turn < 170`.

**Changes:**
- `data/eras.js`: `maxTurns: 180`, remove `winGoals`, add `calendarEvents`, update `lossMessage`
- `engine/game.js` `endTurn()`: remove cash threshold check
- `engine/ui.js` `renderWin()`: simplified end screen

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `index.html` | Intro modal markup + CSS; calendar bar tick CSS |
| `data/eras.js` | `maxTurns: 180`, remove `winGoals`, add `calendarEvents`, update messages |
| `data/events.js` | Remove 3 calendar events from pool; add `spring_break`; fix `halloween_spike` turnsLeft; `allowOnDay1` flags; scale intel conditions |
| `engine/event-engine.js` | Day 1 filter in `selectEvent()` |
| `engine/game.js` | Calendar check in `startTurn()`; `closeIntro()`; simplified `endTurn()` win check |
| `engine/ui.js` | Emojis in `renderStatusBar()`; `renderCalendarBar()` replaces `renderGiftProgress()`; simplified `renderWin()` |
