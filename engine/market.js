var Market = (function() {
  var VOLATILITY_RANGES = {
    low:  { min: -0.08, max: 0.08 },
    med:  { min: -0.18, max: 0.18 },
    high: { min: -0.40, max: 0.40 },
  };

  // Returns new prices object after one turn of market movement
  function updatePrices(currentPrices, candies, activeEffects) {
    var updated = {};
    candies.forEach(function(candy) {
      var range = VOLATILITY_RANGES[candy.volatility];
      var pct = range.min + Math.random() * (range.max - range.min);
      var price = currentPrices[candy.id] * (1 + pct);

      // Apply active effects
      activeEffects.forEach(function(effect) {
        if (effect.type === 'allCandy') {
          price *= effect.modifier;
        } else if (effect.type === 'byRisk' && effect.risk === candy.risk) {
          price *= effect.modifier;
        }
      });

      // Floor at 10% of base price, ceiling at 10x base price
      price = Math.max(price, candy.basePrice * 0.10);
      price = Math.min(price, candy.basePrice * 10);
      updated[candy.id] = Math.round(price * 100) / 100;
    });
    return updated;
  }

  // Returns the location-adjusted price for one candy at one location
  function getLocationPrice(basePrice, candy, location) {
    var mod = location.modifiers;
    if (mod.byId && mod.byId[candy.id] != null) return Math.round(basePrice * mod.byId[candy.id] * 100) / 100;
    if (mod.byRisk && mod.byRisk[candy.risk] != null) return Math.round(basePrice * mod.byRisk[candy.risk] * 100) / 100;
    if (mod.all != null) return Math.round(basePrice * mod.all * 100) / 100;
    return basePrice;
  }

  // Returns trend symbol class name based on price change
  function getPriceTrend(oldPrice, newPrice) {
    if (oldPrice === 0) return 'flat';
    var pct = (newPrice - oldPrice) / oldPrice;
    if (pct > 0.10) return 'upup';
    if (pct > 0)    return 'up';
    if (pct < -0.10) return 'downdown';
    if (pct < 0)    return 'down';
    return 'flat';
  }

  return { updatePrices: updatePrices, getLocationPrice: getLocationPrice, getPriceTrend: getPriceTrend };
})();
