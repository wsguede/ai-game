# v2 Extensions — Roadmap Design

## Overview

v2 adds an **extensions** system: a persistent in-game shop where the player spends cash to buy upgrades and consumables across four categories — storage, tech, defense, and stealth. Each category ships as its own version (v2.1–v2.6) with its own brainstorm, plan, and implementation cycle.

---

## Shop System

The shop is always accessible via a persistent UI button. Opening it has no penalty.

**Purchasing ends the trading day.** Once the player buys anything from the shop, they can no longer buy or sell candy that turn. The first two purchases in a game trigger a notification warning the player of this — after that, no warning.

**Tiers must be purchased in order.** The player cannot skip tiers within a category (e.g., must own storage T1 before buying T2). Prices scale up with each tier; exact prices are set per-version during playtesting.

**Consumables** can be purchased and used independently of passive tiers. Limits and stacking rules vary per consumable (see v2.5, v2.6).

State additions required (shared across all v2.x):
- `ownedTiers` — map of category → current tier owned (0 = none)
- `consumables` — map of consumable id → quantity held
- `shopPurchasedThisTurn` — boolean; blocks trading after purchase
- `shopWarningCount` — tracks how many purchase warnings have been shown
- `notesUsedLifetime` — running count of Note from Mom uses this game (drives deferred principal probability)

---

## Roadmap

| Version | Name | Contents |
|---|---|---|
| v2.1 | Storage + Shop | Shop infrastructure + 4 storage tiers |
| v2.2 | Tech | 3 tech tiers — market intelligence indicators |
| v2.3 | Defense Passive | 4-tier run-odds passive upgrade (vs bullies) |
| v2.4 | Stealth Passive | 5-tier catch-probability passive upgrade (vs teachers) |
| v2.5 | Smoke Bomb | Defense consumable |
| v2.6 | Note from Mom | Stealth consumable |

Each version gets its own brainstorm session before any code is written.

---

## v2.1 — Storage + Shop

Introduces the shop UI and the first item category.

**Storage tiers** increase `stashCapacity`:

| Tier | Name | Capacity |
|---|---|---|
| 0 (default) | Pocket | 5 |
| 1 | Fanny Pack | 10 |
| 2 | Satchel | 20 |
| 3 | Backpack | 50 |

UI design, shop layout, and exact prices to be determined in the v2.1 brainstorm.

---

## v2.2 — Tech

Three tiers of market intelligence that give the player increasingly useful price trend information.

| Tier | Item | Effect |
|---|---|---|
| 1 | Pen & Paper | Shows direction indicator (higher / lower than yesterday) |
| 2 | Calculator | Adds magnitude indicator (whether change exceeds 5%) |
| 3 | Excel | Adds average price so the player can judge whether current price is high or low historically |

Exact indicator UI and price history logic to be determined in the v2.2 brainstorm.

---

## v2.3 — Defense Passive

Five-tier passive upgrade that improves the player's run success rate during bully encounters.

| Tier | Run Success Rate |
|---|---|
| 0 (default) | 50% |
| 1 | 60% |
| 2 | 70% |
| 3 | 80% |
| 4 | 90% |

Run success never reaches 100% — consumables remain the only guaranteed escape.

Item names, flavor text, and prices to be determined in the v2.3 brainstorm.

---

## v2.4 — Stealth Passive

Five-tier passive upgrade that reduces the catch probability multiplier during teacher encounters.

| Tier | Catch Multiplier |
|---|---|
| 0 (default) | ×1.00 |
| 1 | ×0.90 |
| 2 | ×0.80 |
| 3 | ×0.70 |
| 4 | ×0.60 |
| 5 | ×0.50 |

Catch probability never reaches 0% — consumables remain necessary for high-heat situations.

Item names, flavor text, and prices to be determined in the v2.4 brainstorm.

---

## v2.5 — Smoke Bomb

A consumable that lets the player escape any bully encounter with zero immediate penalty.

**Flavor:** Vague; implies something bad may follow without stating it explicitly. Example: *"Pop it and walk away clean. Someone definitely saw something — but no one can prove it was you."*

**Mechanic:** Using a smoke bomb during a bully encounter dismisses it entirely (no cash paid, no robbery). Using it adds **+15 heat**.

The heat cost is not stated in the shop description.

Pricing, max stack size, and exact flavor text to be determined in the v2.5 brainstorm.

---

## v2.6 — Note from Mom

A consumable that dismisses a teacher encounter but carries a deferred, probabilistic consequence.

**Stack limit:** The player can hold at most 1 note at a time.

**Flavor:** Vague; implies risk without stating the mechanic. Example: *"Teachers talk. The more these notes show up, the more likely one ends up on the wrong desk."*

**Mechanic:**
1. Teacher catches the player → player uses a Note from Mom → teacher walks away (no confiscation, no immediate strike).
2. Silently roll against the notes-used probability table:

| Notes used (lifetime) | Principal triggered next turn |
|---|---|
| 1st | 0% |
| 2nd | 15% |
| 3rd | 30% |
| 4th | 50% |
| 5th+ | 70% |

3. If triggered, the principal visit fires **next turn** with no UI hint or notification beforehand.
4. When the deferred principal visit fires:
   - Player has candy → normal principal visit (confiscation + strike tick)
   - Player has no candy → no strike tick; heat spikes to `max(75, currentHeat)`

Exact item name and flavor text to be determined in the v2.6 brainstorm.

---

## Design Constraints (apply to all v2.x)

- Items never fully eliminate a threat — passive upgrades cap short of 100% effectiveness so consumables remain meaningful.
- Consumables with side effects use vague flavor text that implies consequences without naming the mechanic.
- Shop purchase locks trading for the remainder of the turn; the player is warned the first two times.
- Tiers are purchased in order within each category; no skipping.
- Exact prices are left to per-version playtesting.
