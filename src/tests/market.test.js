import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import '../data/candies.js';
import '../data/locations.js';
import '../data/events.js';
import '../data/eras.js';
import '../engine/market.js';
import '../engine/heat.js';
import '../engine/state.js';

describe('Market', () => {
  let Market, State, ERA_V1, LOCATIONS;

  beforeAll(() => {
    Market = window.Market;
    State = window.State;
    ERA_V1 = window.ERA_V1;
    LOCATIONS = window.LOCATIONS;
  });

  beforeEach(() => {
    State.init(ERA_V1);
  });

  it('updatePrices keeps low-volatility candy within ±8%', () => {
    let s = State.get();
    for (let i = 0; i < 20; i++) {
      const newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, []);
      const prev = s.currentPrices['smarties'];
      const next = newPrices['smarties'];
      const pct = Math.abs((next - prev) / prev);
      expect(pct).toBeLessThanOrEqual(0.101);
      s.currentPrices = newPrices;
    }
  });

  it('updatePrices never goes below 10% of base price', () => {
    let s = State.get();
    for (let i = 0; i < 50; i++) {
      const newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, []);
      ERA_V1.candies.forEach(candy => {
        const floor = candy.basePrice * 0.10;
        expect(newPrices[candy.id]).toBeGreaterThanOrEqual(floor - 0.0001);
      });
      s.currentPrices = newPrices;
    }
  });

  it('updatePrices applies allCandy modifier correctly', () => {
    const s = State.get();
    const effects = [{ id: 'test', type: 'allCandy', modifier: 1.30, turnsLeft: 1 }];
    const smartiesBase = s.currentPrices['smarties'];
    const newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, effects);
    expect(newPrices['smarties']).toBeGreaterThan(smartiesBase);
  });

  it('getLocationPrice applies byRisk modifier', () => {
    const playground = LOCATIONS.find(l => l.id === 'playground');
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const price = Market.getLocationPrice(0.25, smarties, playground, []);
    expect(price).toBeCloseTo(0.29, 1);
  });

  it('getLocationPrice applies byId override before byRisk', () => {
    const gymnasium = LOCATIONS.find(l => l.id === 'gymnasium');
    const kitkat = ERA_V1.candies.find(c => c.id === 'kitkat');
    const price = Market.getLocationPrice(3.20, kitkat, gymnasium, []);
    expect(price).toBeCloseTo(2.72, 1);
  });

  it('getLocationPrice applies all modifier in bathroom', () => {
    const bathroom = LOCATIONS.find(l => l.id === 'bathroom');
    const snickers = ERA_V1.candies.find(c => c.id === 'snickers');
    const price = Market.getLocationPrice(2.50, snickers, bathroom, []);
    expect(price).toBeCloseTo(2.25, 1);
  });

  it('getPriceTrend returns correct strings', () => {
    expect(Market.getPriceTrend(1.00, 1.00)).toBe('flat');
    expect(Market.getPriceTrend(1.00, 1.05)).toBe('up');
    expect(Market.getPriceTrend(1.00, 1.15)).toBe('upup');
    expect(Market.getPriceTrend(1.00, 0.95)).toBe('down');
    expect(Market.getPriceTrend(1.00, 0.85)).toBe('downdown');
  });

  it('getPriceBreakdown: first step is base price with null delta', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
    expect(steps[0].label).toBe('base price');
    expect(steps[0].value).toBe(0.25);
    expect(steps[0].delta).toBeNull();
  });

  it('getPriceBreakdown: second step shows market drift delta', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
    expect(steps[1].value).toBe(0.27);
    expect(steps[1].delta).toBe(0.02);
  });

  it('getPriceBreakdown: omits location step when no modifier applies', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const steps = Market.getPriceBreakdown(smarties, 0.27, cafeteria, []);
    expect(steps.length).toBe(2);
  });

  it('getPriceBreakdown: includes location step when modifier applies', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const playground = LOCATIONS.find(l => l.id === 'playground');
    const steps = Market.getPriceBreakdown(smarties, 0.27, playground, []);
    expect(steps.length).toBe(3);
    expect(steps[2].delta).toBe(0.04);
  });

  it('getPriceBreakdown: separates allCandy effect as its own step', () => {
    const smarties = ERA_V1.candies.find(c => c.id === 'smarties');
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const marketPrice = Math.round(0.27 * 1.30 * 100) / 100;
    const effects = [{ id: 'halloween_spike', type: 'allCandy', modifier: 1.30, turnsLeft: 1 }];
    const steps = Market.getPriceBreakdown(smarties, marketPrice, cafeteria, effects);
    expect(steps.length).toBe(3);
    expect(steps[2].label).toContain('halloween');
    expect(steps[2].delta).toBeGreaterThan(0);
  });
});

describe('Market.getTechIntel', () => {
  let Market, candy;

  beforeAll(() => {
    Market = window.Market;
    candy = window.ERA_V1.candies.find(c => c.id === 'smarties');
  });

  it('T0: returns all nulls', () => {
    const result = Market.getTechIntel(candy, 0.25, 0.25, 0.25, 0, {});
    expect(result).toEqual({ arrowClass: null, hlLabel: null, tooltip: null });
  });

  it('T1: up move returns arrowClass up, no hlLabel or tooltip', () => {
    const result = Market.getTechIntel(candy, 0.25, 0.20, 0.25, 1, {});
    expect(result.arrowClass).toBe('up');
    expect(result.hlLabel).toBeNull();
    expect(result.tooltip).toBeNull();
  });

  it('T1: big up move (>5%) still returns arrowClass up, not upup', () => {
    const result = Market.getTechIntel(candy, 0.35, 0.20, 0.35, 1, {});
    expect(result.arrowClass).toBe('up');
  });

  it('T1: down move returns arrowClass down', () => {
    const result = Market.getTechIntel(candy, 0.20, 0.25, 0.20, 1, {});
    expect(result.arrowClass).toBe('down');
  });

  it('T1: equal prices returns arrowClass flat', () => {
    const result = Market.getTechIntel(candy, 0.25, 0.25, 0.25, 1, {});
    expect(result.arrowClass).toBe('flat');
  });

  it('T2: small up move (<=5%) returns arrowClass up', () => {
    // locPrice 0.262 vs prevSeenPrice 0.25 → pct ≈ 4.8%
    const result = Market.getTechIntel(candy, 0.262, 0.25, 0.262, 2, {});
    expect(result.arrowClass).toBe('up');
  });

  it('T2: big up move (>5%) returns arrowClass upup', () => {
    // locPrice 0.27 vs prevSeenPrice 0.25 → pct = 8%
    const result = Market.getTechIntel(candy, 0.27, 0.25, 0.27, 2, {});
    expect(result.arrowClass).toBe('upup');
  });

  it('T2: big down move (>5%) returns arrowClass downdown', () => {
    // locPrice 0.23 vs prevSeenPrice 0.25 → pct = -8%
    const result = Market.getTechIntel(candy, 0.23, 0.25, 0.23, 2, {});
    expect(result.arrowClass).toBe('downdown');
  });

  it('T2: small down move (<=5%) returns arrowClass down', () => {
    // locPrice 0.238 vs prevSeenPrice 0.25 → pct ≈ -4.8%
    const result = Market.getTechIntel(candy, 0.238, 0.25, 0.238, 2, {});
    expect(result.arrowClass).toBe('down');
  });

  it('T3: history fewer than 3 entries → hlLabel null, tooltip null', () => {
    const history = { smarties: [0.20, 0.22] };
    const result = Market.getTechIntel(candy, 0.25, 0.24, 0.25, 3, history);
    expect(result.arrowClass).toBe('up');
    expect(result.hlLabel).toBeNull();
    expect(result.tooltip).toBeNull();
  });

  it('T3: LOW when basePrice in bottom third of range', () => {
    // history range [0.20, 0.30], third = 0.0333, LOW boundary = 0.2333
    const history = { smarties: [0.20, 0.25, 0.30] };
    const result = Market.getTechIntel(candy, 0.21, 0.20, 0.21, 3, history);
    expect(result.hlLabel).toBe('LOW');
  });

  it('T3: HIGH when basePrice in top third of range', () => {
    // HIGH boundary = 0.2667, basePrice 0.29 → HIGH
    const history = { smarties: [0.20, 0.25, 0.30] };
    const result = Market.getTechIntel(candy, 0.29, 0.28, 0.29, 3, history);
    expect(result.hlLabel).toBe('HIGH');
  });

  it('T3: MID when basePrice in middle third of range', () => {
    const history = { smarties: [0.20, 0.25, 0.30] };
    const result = Market.getTechIntel(candy, 0.25, 0.24, 0.25, 3, history);
    expect(result.hlLabel).toBe('MID');
  });

  it('T3: tooltip contains only avg', () => {
    // avg = (0.20 + 0.25 + 0.30) / 3 = 0.25
    const history = { smarties: [0.20, 0.25, 0.30] };
    const result = Market.getTechIntel(candy, 0.25, 0.24, 0.25, 3, history);
    expect(result.tooltip).toEqual({ avg: 0.25 });
  });

  it('T4: tooltip contains avg, low, high, and vsAvgPct', () => {
    // avg = 0.25, vsAvgPct for basePrice 0.30 = +20%
    const history = { smarties: [0.20, 0.25, 0.30] };
    const result = Market.getTechIntel(candy, 0.30, 0.28, 0.30, 4, history);
    expect(result.tooltip.avg).toBe(0.25);
    expect(result.tooltip.low).toBe(0.20);
    expect(result.tooltip.high).toBe(0.30);
    expect(result.tooltip.vsAvgPct).toBe(20);
  });

  it('T4: hlLabel and arrowClass still present alongside full tooltip', () => {
    const history = { smarties: [0.20, 0.25, 0.30] };
    const result = Market.getTechIntel(candy, 0.30, 0.25, 0.30, 4, history);
    expect(result.hlLabel).toBe('HIGH');
    expect(result.arrowClass).toBe('upup');
  });
});
