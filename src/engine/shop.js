var Shop = window.Shop = (function() {
  var State = window.State;
  var SHOP  = window.SHOP;

  function getNextTier(category) {
    var s = State.get();
    var currentTier = s.ownedTiers[category] || 0;
    var tiers = SHOP[category].tiers;
    return tiers.find(function(t) { return t.tier === currentTier + 1; }) || null;
  }

  function canBuy(category) {
    var next = getNextTier(category);
    if (!next) return false;
    return State.get().cash >= next.price;
  }

  function purchase(category) {
    var s = State.get();
    var next = getNextTier(category);
    if (!next || s.cash < next.price) return false;
    s.cash                  = Math.round((s.cash - next.price) * 100) / 100;
    s.ownedTiers[category] = next.tier;
    if (next.capacity != null) s.stashCapacity = next.capacity;
    s.shopPurchasedThisTurn = true;
    s.shopWarningCount++;
    return true;
  }

  return { getNextTier: getNextTier, canBuy: canBuy, purchase: purchase };
})();
