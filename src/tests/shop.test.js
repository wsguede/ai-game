import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import '../data/candies.js';
import '../data/locations.js';
import '../data/events.js';
import '../data/eras.js';
import '../data/shop.js';
import '../engine/market.js';
import '../engine/heat.js';
import '../engine/state.js';
import '../engine/shop.js';

describe('Shop', () => {
  let Shop, State, ERA_V1;

  beforeAll(() => {
    Shop  = window.Shop;
    State = window.State;
    ERA_V1 = window.ERA_V1;
  });

  beforeEach(() => {
    State.init(ERA_V1);
  });

  // --- getNextTier ---

  it('getNextTier: returns tier 1 when no tiers owned', () => {
    const next = Shop.getNextTier('storage');
    expect(next.tier).toBe(1);
    expect(next.name).toBe('Fanny Pack');
    expect(next.capacity).toBe(10);
    expect(next.price).toBe(20);
  });

  it('getNextTier: returns tier 2 when tier 1 is owned', () => {
    State.get().ownedTiers.storage = 1;
    const next = Shop.getNextTier('storage');
    expect(next.tier).toBe(2);
    expect(next.name).toBe('Satchel');
  });

  it('getNextTier: returns tier 3 when tier 2 is owned', () => {
    State.get().ownedTiers.storage = 2;
    const next = Shop.getNextTier('storage');
    expect(next.tier).toBe(3);
    expect(next.name).toBe('Backpack');
  });

  it('getNextTier: returns null when all tiers owned', () => {
    State.get().ownedTiers.storage = 3;
    expect(Shop.getNextTier('storage')).toBeNull();
  });

  // --- canBuy ---

  it('canBuy: returns true when player can afford next tier', () => {
    State.get().cash = 100;
    expect(Shop.canBuy('storage')).toBe(true);
  });

  it('canBuy: returns false when player cannot afford next tier', () => {
    State.get().cash = 5;
    expect(Shop.canBuy('storage')).toBe(false);
  });

  it('canBuy: returns false when all tiers are owned', () => {
    State.get().ownedTiers.storage = 3;
    State.get().cash = 1000;
    expect(Shop.canBuy('storage')).toBe(false);
  });

  // --- purchase ---

  it('purchase: deducts tier price from cash', () => {
    State.get().cash = 100;
    Shop.purchase('storage');
    expect(State.get().cash).toBe(80); // 100 - 20 (Fanny Pack)
  });

  it('purchase: sets ownedTiers to the purchased tier number', () => {
    State.get().cash = 100;
    Shop.purchase('storage');
    expect(State.get().ownedTiers.storage).toBe(1);
  });

  it('purchase: sets stashCapacity to new tier value, not cumulative', () => {
    State.get().cash = 200;
    Shop.purchase('storage'); // Fanny Pack: 10
    Shop.purchase('storage'); // Satchel: 20
    expect(State.get().stashCapacity).toBe(20);
  });

  it('purchase: sets shopPurchasedThisTurn to true', () => {
    State.get().cash = 100;
    Shop.purchase('storage');
    expect(State.get().shopPurchasedThisTurn).toBe(true);
  });

  it('purchase: increments shopWarningCount', () => {
    State.get().cash = 100;
    Shop.purchase('storage');
    expect(State.get().shopWarningCount).toBe(1);
  });

  it('purchase: returns true on success', () => {
    State.get().cash = 100;
    expect(Shop.purchase('storage')).toBe(true);
  });

  it('purchase: returns false when player cannot afford', () => {
    State.get().cash = 5;
    expect(Shop.purchase('storage')).toBe(false);
  });

  it('purchase: leaves state unchanged when purchase fails', () => {
    State.get().cash = 5;
    Shop.purchase('storage');
    const s = State.get();
    expect(s.ownedTiers.storage).toBe(0);
    expect(s.stashCapacity).toBe(ERA_V1.stashCapacity);
    expect(s.shopPurchasedThisTurn).toBe(false);
    expect(s.shopWarningCount).toBe(0);
  });
});
