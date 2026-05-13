# Candy Wars — Design Spec
**Date:** 2026-05-10
**Status:** Approved

---

## Overview

Candy Wars is a browser-based trading strategy game — a modern, humorous take on the classic Drug Wars formula. The player is a scrappy elementary school kid hustling candy through school, buying low and selling high across five locations while dodging teachers and bullies. The entire game runs in a single HTML file with no build tools, no frameworks, and no server.

**Win condition:** Accumulate enough cash to buy mom a nice gift before Day 30.
**Game over:** 3 principal visits → detention.

The v1 scope covers the elementary school era. The architecture is designed so future eras (high school, college, post-college startup, candy company, galactic candy consortium) are data swaps, not rewrites.

**Starting conditions:** Player begins with $10 allowance and a stash capacity of 30 units.

---

## Visual Style

Retro terminal aesthetic: dark background (#0d0d0d), monospace font (Courier New), yellow (#ffdd00) headers, green for positive, red for negative. The contrast between the serious retro UI and the silly candy content is intentional and central to the game's humor.

---

## Core Game Loop

A run is **30 turns** (school days). Each turn follows this sequence:

1. **Market update** — candy prices shift based on each candy's volatility. High-volatility candy can spike or crash 20–40%. Low-volatility candy drifts ±5–8%.
2. **Event check** — one event may fire: teacher patrol, bully encounter, market event, intel tip, or flavor text.
3. **Player actions** — buy and/or sell at your current location. You may then travel, which ends the turn immediately (no further buying/selling that day). You arrive at the new location on the next turn with prices already shifted. Alternatively, you can buy/sell and end the turn without traveling.
4. **Heat decay** — heat ticks down passively each turn.

---

## Locations (v1: Elementary School)

Five locations, each with candy price modifiers and patrol risk:

| Location | Specialty | Notes |
|---|---|---|
| Cafeteria | All candy, high volume | High teacher patrol risk |
| Playground | Cheap candy premium | Low patrol, bully hotspot |
| Gymnasium | Mid-tier candy +15% | Kit Kat underperforms |
| Library | High-end candy premium, heat decays 2× faster | Low volume, no cheap demand |
| Bathroom | Lowest patrol risk | All prices -10%, bully ambush possible |

Each location has a tooltip (on hover) showing its modifiers. No instructional text — the player discovers this themselves.

---

## Candy Catalog (v1)

Nine candy types arranged in a 3×3 risk × volatility matrix:

| | LOW Volatility | MED Volatility | HIGH Volatility |
|---|---|---|---|
| **LOW Risk** | Smarties ($0.25) | Dum Dums ($0.40) | Nerds ($0.60) |
| **MED Risk** | Snickers ($2.50) | Reese's XL ($4.00) | Kit Kat ($3.20) |
| **HIGH Risk** | Ferrero Rocher ($10.00) | Swiss Truffles ($12.00) | Rare Pop Rocks ($18.50) |

**Volatility ranges:**
- LOW: ±5–8% per turn
- MED: ±15–18% per turn
- HIGH: ±35–40% per turn, with occasional spike/crash events

**Playstyle archetypes:**
- LOW/LOW: grind — safe, predictable, slow
- LOW/HIGH: chaos penny — cheap to bulk, but wildly unpredictable
- HIGH/LOW: slow whale — ties up cash, barely moves, reliable
- HIGH/HIGH: moonshot — can 5× or crash to near-zero in two turns

Candy metadata (risk, volatility, heat/unit) is shown in a tooltip on the candy name in the market table. The market table itself shows only: candy name, price + trend arrow, quantity in bag.

---

## Market UI

The main screen layout (top to bottom):

1. **Title bar** — `★ CANDY WARS ★`
2. **Status row** — Day X/30, Cash, Stash (units used/capacity), Heat meter
3. **Mom's Gift Fund** — progress bar toward win goal with dollar amounts
4. **Location selector** — five location buttons, current highlighted in yellow, tooltips on hover
5. **Market table** — CANDY | PRICE (with inline trend arrow) | IN BAG
6. **Event box** — story event for this turn (red border if threat, teal border if intel)
7. **Action bar** — keyboard-driven: [B] Buy, [S] Sell, [T] Travel, situation-specific actions

---

## Heat System

**Heat meter: 0–100**, displayed as a pip bar (e.g., `▲▲░░░`).

**Heat generation per trade:**
- LOW risk candy: +0.5 heat per unit traded
- MED risk candy: +1.5 heat per unit traded
- HIGH risk candy: +3.0 heat per unit traded

**Heat decay:**
- Passive: -5 heat per turn
- Lay Low action: spend the turn doing nothing, -20 heat
- Library bonus: -10 extra heat per turn while there
- Bully robs you: -10 heat ("The staff feels bad for you")

**Teacher encounter chance** scales with current heat (low heat = rare, high heat = frequent).

**Catch outcome** is based on risk-weighted stash value: `sum(quantity × risk_weight × price)` where risk weights are LOW=1×, MED=2×, HIGH=4×:

| Stash Risk Value | Outcome |
|---|---|
| Under $20 | Confiscation only — teacher takes everything, no principal |
| $20–$60 | Confiscation + 1 principal visit |
| Over $60 | Confiscation + 1 principal visit + heat spike |

**Principal visits:** tracked visibly. 3 = game over (detention).

---

## Bully System

Bully encounters are random events (higher probability on Playground and Bathroom).

**Options:**
- **Pay off** ($5): keep your candy, heat unchanged
- **Run**: 50/50 escape, heat unchanged
- **Get robbed**: lose all candy in bag, **-10 heat**, story beat: *"Mrs. Henderson saw what happened. Even she feels bad for you today."*

Getting robbed is a legitimate strategic play when heat is high — you lose inventory but clear heat.

---

## Story Events

One event may fire per turn. Four categories:

**Threat events**
- Teacher patrol (probability scales with heat)
- Bully shakedown (higher at Playground/Bathroom)
- Principal summons (triggered at heat threshold, not random)

**Market events**
- Halloween spike: all candy +30% for 2 turns
- Post-Halloween crash: all candy -20% for 1 turn
- Valentine's Day: chocolate-tier surge
- Candy shortage at one location: prices spike for 1 turn
- Bulk deal: buy up to 10 of one candy at 20% off, one-time

**Intel tips**
- Price movement tip for a specific location/candy
- Teacher out sick (reduced patrol at one location this turn)
- Black market rumor (rare candy available tomorrow at Bathroom)

**Flavor events** (no mechanical effect)
- "Tommy got caught by Mrs. Henderson. He gives you a nod of respect."
- "The cafeteria is serving mystery meat. Everyone's buying comfort candy."
- "A 3rd grader offers to trade his Ferrero Rocher for a juice box. You decline."

---

## Win Condition

The **Mom's Gift Fund** progress bar tracks savings toward the gift goal.

**Gift tiers** reward exceeding the target:
- $100: Small gift (C ending) — "Mom seems pleased."
- $150: Nice gift (B ending) — "Mom is really happy."
- $250+: Deluxe gift (A ending) — "Mom cries. You're her favorite."

If Day 30 ends before reaching $100, the player gets a loss screen with their final cash amount and how close they came.

---

## Architecture

The game is playable by opening a local HTML file directly in a browser — no server, no build tools, no install. All JS is written inline in `index.html` using `<script>` tags, or loaded as sibling `.js` files via `<script src="...">` (both work when opened from the filesystem). Data and engine modules are kept in separate files for maintainability but require no bundler.

```
/game
  index.html             ← game shell, imports all modules
  /data
    candies.js           ← candy definitions (name, risk, volatility, base price)
    locations.js         ← location definitions (name, modifiers, patrol level)
    events.js            ← event pool (text, trigger conditions, effects)
    eras.js              ← era configs (which candies/locations/events are active)
  /engine
    market.js            ← price simulation per turn
    heat.js              ← heat generation, decay, encounter resolution
    events.js            ← event selection and execution engine
    state.js             ← game state (turn, cash, stash, heat, principal count)
    ui.js                ← all DOM rendering
```

**Era extensibility:** Each era is a config object in `eras.js` that specifies which candy catalog, location set, and event pool to use. Adding high school means writing a new era config — the engine is untouched.

**Future extension hooks (v2+):**
- Reputation/street cred meter (opt-in per era via era config)
- Upgrade system: bigger backpack (stash capacity), hall pass (reduced patrol), etc.
- Named recurring characters (Tommy the bully, Mrs. Henderson) with relationship state
- Each era's escalation unlocked by hitting the A ending

---

## Out of Scope for v1

- Multiplayer
- Persistent save across browser sessions
- Sound / music
- Mobile-specific layout (desktop-first, responsive later)
- Any era beyond elementary school
- Reputation meter and upgrade system (designed for but not built in v1)
