import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import '../data/candies.js';
import '../data/locations.js';
import '../data/events.js';
import '../data/eras.js';
import '../engine/market.js';
import '../engine/heat.js';
import '../engine/state.js';

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
    expect(s.stashCapacity).toBe(5);
    expect(s.ownedTiers).toEqual({ storage: 0, tech: 0 });
    expect(s.shopPurchasedThisTurn).toBe(false);
    expect(s.shopWarningCount).toBe(0);
  });

  it('State.init sets ownedTiers.tech to 0', () => {
    expect(State.get().ownedTiers.tech).toBe(0);
  });

  it('State.init sets priceHistory to empty object', () => {
    expect(State.get().priceHistory).toEqual({});
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
    expect(State.stashAvailable()).toBe(0);
    State.removeFromStash('smarties', 3);
    expect(State.stashTotal()).toBe(2);
  });

  it('State.addToStash throws when over capacity', () => {
    expect(() => State.addToStash('smarties', 6)).toThrow();
  });

  it('State.removeFromStash throws when insufficient quantity', () => {
    expect(() => State.removeFromStash('smarties', 1)).toThrow();
  });

  it('State.clearStash empties all candy', () => {
    State.addToStash('smarties', 3);
    State.addToStash('snickers', 2);
    State.clearStash();
    expect(State.stashTotal()).toBe(0);
  });
});
