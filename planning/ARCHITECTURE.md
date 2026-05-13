# Architecture

## Module Structure

The game uses the IIFE (Immediately Invoked Function Expression) pattern with explicit `window` globals. Each file defines its module once, closes over private state, and exposes a public API via its return value. The dual-assignment pattern makes each export available both locally (for same-file references) and globally (for `onclick=` handlers and cross-module calls):

```js
var Heat = window.Heat = (function() {
  // private state and helpers
  function decay(currentHeat, location) { ... }
  return { decay: decay, ... };
})();
```

Cross-file dependencies are captured at the top of each IIFE so function bodies don't need `window.X` prefixes:

```js
var Game = window.Game = (function() {
  var State = window.State;
  var Heat  = window.Heat;
  // function bodies reference State and Heat directly — no window. needed
})();
```

## Load Order

Modules must load in dependency order. `src/main.js` enforces this:

```
data/candies.js       → CANDIES (no deps)
data/locations.js     → LOCATIONS (no deps)
data/events.js        → EVENTS, calendar event objects (no deps)
data/eras.js          → ERA_V1 (depends on CANDIES, LOCATIONS, EVENTS, calendar objects)
engine/state.js       → State (depends on Market at call time)
engine/market.js      → Market (no deps — pure functions)
engine/heat.js        → Heat (no deps — pure functions)
engine/event-engine.js → EventEngine (depends on State, Heat)
engine/ui.js          → UI (depends on Market)
engine/game.js        → Game (depends on all of the above + ERA_V1)
```

## Layer Separation

**Data layer** (`src/data/`): Static configuration only. Plain objects and arrays. No behavior. Loaded first.

**Engine layer** (`src/engine/`): All game logic. Clear single responsibilities:

| Module | Responsibility |
|--------|---------------|
| `state.js` | Single source of truth for all mutable game state. Mutation helpers (addToStash, removeFromStash, etc.) |
| `market.js` | Price calculation: volatility drift, location modifiers, active effects, price breakdown for debug mode |
| `heat.js` | Heat generation (per trade), decay (per turn), teacher/bully encounter probability, outcome resolution |
| `event-engine.js` | Event selection (probability + eligibility filter) and effect execution |
| `ui.js` | All DOM rendering. Reads state, produces HTML. Never mutates state. |
| `game.js` | Player action handlers (endTurn, travel, layLow, openTrade, etc.). Orchestrates engine calls and triggers UI.render(). |

**Entry point** (`index.html`): All CSS lives here. Game HTML structure. `onclick=` handlers call into `window.Game.*`.

## Data Flow

```
Player action (onclick=)
  → Game.action()
    → mutates State via State.* or direct property assignment
    → calls Heat.* / Market.* / EventEngine.* as needed
    → calls UI.render(State.get())
      → reads state, writes DOM
```

## Test Harness

`tests/index.html` loads engine and data files via individual `<script src="../src/...">` tags (not via `src/main.js`) and runs synchronous unit tests in the browser. Test helpers (`test`, `assertEqual`, `assertTrue`, `assertClose`) are defined inline. Tests for Heat, Market, State, and EventEngine exist. UI and Game have no automated tests — verified manually in the browser.
