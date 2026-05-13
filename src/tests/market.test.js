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
      expect(pct).toBeLessThanOrEqual(0.09);
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
