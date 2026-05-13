import { describe, it, expect, beforeAll } from 'vitest';
import '../data/candies.js';
import '../data/locations.js';
import '../engine/heat.js';

describe('Heat', () => {
  let Heat, CANDIES, LOCATIONS;

  beforeAll(() => {
    Heat = window.Heat;
    CANDIES = window.CANDIES;
    LOCATIONS = window.LOCATIONS;
  });

  it('generate: low-risk candy generates 0.5 per unit', () => {
    const smarties = CANDIES.find(c => c.id === 'smarties');
    expect(Heat.generate(smarties, 10)).toBe(5.0);
  });

  it('generate: high-risk candy generates 3.0 per unit', () => {
    const rpr = CANDIES.find(c => c.id === 'rarepoprocks');
    expect(Heat.generate(rpr, 5)).toBe(15.0);
  });

  it('decay: removes 2 heat by default', () => {
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    expect(Heat.decay(20, cafeteria)).toBe(18);
  });

  it('decay: library removes 5 heat (2 + 3 bonus)', () => {
    const library = LOCATIONS.find(l => l.id === 'library');
    expect(Heat.decay(20, library)).toBe(15);
  });

  it('decay: does not go below 0', () => {
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    expect(Heat.decay(1, cafeteria)).toBe(0);
  });

  it('teacherChance: zero at none patrol risk', () => {
    const bathroom = LOCATIONS.find(l => l.id === 'bathroom');
    expect(Heat.teacherChance(100, bathroom, false)).toBe(0);
  });

  it('teacherChance: zero when teacher is sick', () => {
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    expect(Heat.teacherChance(100, cafeteria, true)).toBe(0);
  });

  it('teacherChance: higher at high heat than low heat', () => {
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const low = Heat.teacherChance(10, cafeteria, false);
    const high = Heat.teacherChance(90, cafeteria, false);
    expect(high).toBeGreaterThan(low);
  });

  it('stashRiskValue: empty stash is 0', () => {
    expect(Heat.stashRiskValue({}, CANDIES, {})).toBe(0);
  });

  it('stashRiskValue: 10 smarties at base price = 10 * 1 * 0.25 = 2.5', () => {
    const prices = {};
    CANDIES.forEach(c => { prices[c.id] = c.basePrice; });
    expect(Heat.stashRiskValue({ smarties: 10 }, CANDIES, prices)).toBeCloseTo(2.5, 2);
  });

  it('stashRiskValue: 5 Ferrero Rocher at base = 5 * 4 * 10 = 200', () => {
    const prices = {};
    CANDIES.forEach(c => { prices[c.id] = c.basePrice; });
    expect(Heat.stashRiskValue({ ferrerorocher: 5 }, CANDIES, prices)).toBeCloseTo(200, 2);
  });

  it('resolveTeacherCatch: under $20 = confiscate only', () => {
    const result = Heat.resolveTeacherCatch(15);
    expect(result.confiscate).toBe(true);
    expect(result.principalVisit).toBe(false);
    expect(result.heatSpike).toBe(false);
  });

  it('resolveTeacherCatch: $20–$60 = confiscate + principal', () => {
    const result = Heat.resolveTeacherCatch(40);
    expect(result.confiscate).toBe(true);
    expect(result.principalVisit).toBe(true);
    expect(result.heatSpike).toBe(false);
  });

  it('resolveTeacherCatch: over $60 = confiscate + principal + heat spike', () => {
    const result = Heat.resolveTeacherCatch(80);
    expect(result.confiscate).toBe(true);
    expect(result.principalVisit).toBe(true);
    expect(result.heatSpike).toBe(true);
  });

  it('applyBullyRob: clears stash and reduces heat by 10', () => {
    const fakeState = { stash: { smarties: 5 }, heat: 40 };
    Heat.applyBullyRob(fakeState);
    expect(Object.keys(fakeState.stash).length).toBe(0);
    expect(fakeState.heat).toBe(30);
  });

  it('applyBullyRob: heat does not go below 0', () => {
    const fakeState = { stash: {}, heat: 5 };
    Heat.applyBullyRob(fakeState);
    expect(fakeState.heat).toBe(0);
  });

  it('teacherCaught: always false at 0 heat', () => {
    for (let i = 0; i < 20; i++) {
      expect(Heat.teacherCaught(0)).toBe(false);
    }
  });

  it('teacherCaught: always true at 100 heat', () => {
    for (let i = 0; i < 20; i++) {
      expect(Heat.teacherCaught(100)).toBe(true);
    }
  });

  it('teacherCaught: returns a boolean', () => {
    const result = Heat.teacherCaught(50);
    expect(result === true || result === false).toBe(true);
  });
});
