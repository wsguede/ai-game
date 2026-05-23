var Market = window.Market = (function() {
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
  function getLocationPrice(basePrice, candy, location, activeEffects) {
    var mod = location.modifiers;
    var price = basePrice;
    if (mod.byId && mod.byId[candy.id] != null) price = price * mod.byId[candy.id];
    else if (mod.byRisk && mod.byRisk[candy.risk] != null) price = price * mod.byRisk[candy.risk];
    else if (mod.all != null) price = price * mod.all;

    // Apply location-specific active effects (e.g. intel tips)
    if (activeEffects) {
      activeEffects.forEach(function(effect) {
        if (effect.type === 'byLocation' && effect.location === location.id) {
          if (!effect.risk || effect.risk === candy.risk) price *= effect.modifier;
        }
      });
    }

    return Math.round(price * 100) / 100;
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

  function getPriceBreakdown(candy, marketPrice, location, activeEffects) {
    var steps = [];
    var running = candy.basePrice;
    steps.push({ label: 'base price', delta: null, value: running });

    var globalEffects = (activeEffects || []).filter(function(e) {
      return e.type === 'allCandy' || (e.type === 'byRisk' && e.risk === candy.risk);
    });
    var globalProduct = globalEffects.reduce(function(p, e) { return p * e.modifier; }, 1);

    var pureDrift = globalProduct > 0 ? Math.round((marketPrice / globalProduct) * 100) / 100 : marketPrice;
    var driftDelta = Math.round((pureDrift - running) * 100) / 100;
    var driftPct   = running > 0 ? Math.round((pureDrift - running) / running * 100) : 0;
    running = pureDrift;
    steps.push({
      label: 'market today (' + (driftPct >= 0 ? '+' : '') + driftPct + '%)',
      delta: driftDelta,
      value: running,
    });

    globalEffects.forEach(function(effect) {
      var delta = Math.round((running * effect.modifier - running) * 100) / 100;
      running   = Math.round(running * effect.modifier * 100) / 100;
      steps.push({
        label: effect.id.replace(/_/g, ' ') + ' (\xd7' + effect.modifier.toFixed(2) + ')',
        delta: delta,
        value: running,
      });
    });

    var mod    = location.modifiers;
    var locMod = null;
    if (mod.byId && mod.byId[candy.id] != null)             locMod = mod.byId[candy.id];
    else if (mod.byRisk && mod.byRisk[candy.risk] != null)  locMod = mod.byRisk[candy.risk];
    else if (mod.all != null)                                locMod = mod.all;

    if (locMod !== null) {
      var locDelta = Math.round((running * locMod - running) * 100) / 100;
      running      = Math.round(running * locMod * 100) / 100;
      steps.push({
        label: location.name.toLowerCase() + ' (\xd7' + locMod.toFixed(2) + ')',
        delta: locDelta,
        value: running,
      });
    }

    (activeEffects || []).forEach(function(effect) {
      if (effect.type !== 'byLocation' || effect.location !== location.id) return;
      if (effect.risk && effect.risk !== candy.risk) return;
      var delta = Math.round((running * effect.modifier - running) * 100) / 100;
      running   = Math.round(running * effect.modifier * 100) / 100;
      steps.push({
        label: effect.id.replace(/_/g, ' ') + ' (\xd7' + effect.modifier.toFixed(2) + ')',
        delta: delta,
        value: running,
      });
    });

    return steps;
  }

  function getTechIntel(candy, currentBasePrice, prevSeenPrice, locPrice, techTier, priceHistory) {
    if (techTier === 0) return { arrowClass: null, hlLabel: null, tooltip: null };

    var pct = prevSeenPrice > 0 ? (locPrice - prevSeenPrice) / prevSeenPrice : 0;
    var arrowClass;
    if (techTier >= 2) {
      if      (pct >  0.05) arrowClass = 'upup';
      else if (pct >  0)    arrowClass = 'up';
      else if (pct < -0.05) arrowClass = 'downdown';
      else if (pct <  0)    arrowClass = 'down';
      else                  arrowClass = 'flat';
    } else {
      if      (pct > 0) arrowClass = 'up';
      else if (pct < 0) arrowClass = 'down';
      else              arrowClass = 'flat';
    }

    if (techTier < 3) return { arrowClass: arrowClass, hlLabel: null, tooltip: null };

    var history = priceHistory[candy.id] || [];
    if (history.length < 3) return { arrowClass: arrowClass, hlLabel: null, tooltip: null };

    var low   = Math.min.apply(null, history);
    var high  = Math.max.apply(null, history);
    var range = high - low;

    var hlLabel = null;
    if (range > 0) {
      var third = range / 3;
      if      (currentBasePrice <= low  + third) hlLabel = 'LOW';
      else if (currentBasePrice >= high - third) hlLabel = 'HIGH';
      else                                        hlLabel = 'MID';
    }

    var sum = history.reduce(function(acc, p) { return acc + p; }, 0);
    var avg = Math.round(sum / history.length * 100) / 100;

    var tooltip;
    if (techTier === 3) {
      tooltip = { avg: avg };
    } else {
      var vsAvgPct = avg > 0 ? Math.round((currentBasePrice - avg) / avg * 100) : 0;
      tooltip = {
        avg:       avg,
        low:       Math.round(low  * 100) / 100,
        high:      Math.round(high * 100) / 100,
        vsAvgPct:  vsAvgPct,
      };
    }

    return { arrowClass: arrowClass, hlLabel: hlLabel, tooltip: tooltip };
  }

  return { updatePrices: updatePrices, getLocationPrice: getLocationPrice, getPriceTrend: getPriceTrend, getPriceBreakdown: getPriceBreakdown, getTechIntel: getTechIntel };
})();
