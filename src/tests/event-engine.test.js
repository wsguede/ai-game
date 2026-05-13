import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import '../data/candies.js';
import '../data/locations.js';
import '../data/events.js';
import '../data/eras.js';
import '../engine/market.js';
import '../engine/heat.js';
import '../engine/state.js';
import '../engine/event-engine.js';

describe('EventEngine', () => {
  let EventEngine, State, ERA_V1, EVENTS, LOCATIONS;

  beforeAll(() => {
    EventEngine = window.EventEngine;
    State = window.State;
    ERA_V1 = window.ERA_V1;
    EVENTS = window.EVENTS;
    LOCATIONS = window.LOCATIONS;
  });

  beforeEach(() => {
    State.init(ERA_V1);
  });

  // --- EVENTS data ---

  it('EVENTS is a non-empty array', () => {
    expect(Array.isArray(EVENTS) && EVENTS.length > 0).toBe(true);
  });

  it('each event has required fields', () => {
    const validTypes = ['threat', 'market', 'intel', 'flavor'];
    EVENTS.forEach(e => {
      expect(e.id).toBeTruthy();
      expect(validTypes).toContain(e.type);
      expect(typeof e.text).toBe('string');
      expect(e.text.length).toBeGreaterThan(0);
      expect(typeof e.condition).toBe('function');
      expect(typeof e.effect).toBe('function');
    });
  });

  it('event ids are unique', () => {
    const ids = EVENTS.map(e => e.id);
    const unique = [...new Set(ids)];
    expect(unique.length).toBe(EVENTS.length);
  });

  it('there are at least 2 intel events', () => {
    const intel = EVENTS.filter(e => e.type === 'intel');
    expect(intel.length).toBeGreaterThanOrEqual(2);
  });

  it('bulk_deal effect sets bulkDealActive on state', () => {
    const event = EVENTS.find(e => e.id === 'bulk_deal');
    const fakeState = { bulkDealUsed: false, activeEffects: [] };
    event.effect(fakeState);
    expect(fakeState.bulkDealActive).toBe(true);
  });

  // --- EventEngine ---

  it('selectEvent returns null when no events fire (random=1)', () => {
    const s = State.get();
    s.heat = 0;
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const origRandom = Math.random;
    Math.random = () => 1;
    const event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
    Math.random = origRandom;
    expect(event).toBeNull();
  });

  it('selectEvent returns teacher when random is below teacher chance', () => {
    // Fix for browser-test bug: turn=1 + empty stash prevent teacher from firing.
    // Set turn=2 and add stash so the teacher block is reachable.
    const s = State.get();
    s.turn = 2;
    s.heat = 100;
    State.addToStash('smarties', 5);
    const cafeteria = LOCATIONS.find(l => l.id === 'cafeteria');
    const origRandom = Math.random;
    Math.random = () => 0;
    const event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
    Math.random = origRandom;
    expect(event.type).toBe('teacher');
  });

  it('resolveTeacher: low stash → no principal visit', () => {
    const s = State.get();
    // 5 smarties at $0.25, riskWeight 1 → $1.25 risk value (under $20)
    s.stash = { smarties: 5 };
    const outcome = EventEngine.resolveTeacher(s);
    expect(outcome.principalVisit).toBe(false);
  });

  it('resolveTeacher: high stash → principal visit + heat spike', () => {
    const s = State.get();
    // 3 Ferrero Rocher at $10, riskWeight 4 → $120 risk value (over $60)
    s.stash = { ferrerorocher: 3 };
    const outcome = EventEngine.resolveTeacher(s);
    expect(outcome.principalVisit).toBe(true);
    expect(outcome.heatSpike).toBe(true);
  });

  it('selectEvent skips teacher when stash is empty', () => {
    const s = State.get();
    s.turn = 2;
    s.heat = 100;
    const cafeteria = ERA_V1.locations.find(l => l.id === 'cafeteria');
    const origRandom = Math.random;
    Math.random = () => 0;
    const event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
    Math.random = origRandom;
    expect(!event || event.type !== 'teacher').toBe(true);
  });

  it('selectEvent skips teacher and bully when laidLowThisTurn', () => {
    const s = State.get();
    s.turn = 2;
    s.heat = 100;
    s.laidLowThisTurn = true;
    State.addToStash('smarties', 5);
    const cafeteria = ERA_V1.locations.find(l => l.id === 'cafeteria');
    const origRandom = Math.random;
    Math.random = () => 0;
    const event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
    Math.random = origRandom;
    expect(!event || (event.type !== 'teacher' && event.type !== 'bully')).toBe(true);
  });
});
