var Heat = (function() {
  var PATROL_CHANCE = { none: 0, low: 0.05, med: 0.15, high: 0.30 };
  var BULLY_CHANCE  = { none: 0, low: 0.05, med: 0.15, high: 0.25 };

  // How much heat a trade adds
  function generate(candy, quantity) {
    return candy.heatPerUnit * quantity;
  }

  // Heat lost at end of turn (passive + location bonus)
  function decay(currentHeat, location) {
    var amount = 5 + location.heatDecayBonus;
    return Math.max(0, currentHeat - amount);
  }

  // Probability a teacher patrol fires this turn
  function teacherChance(heat, location, teacherSick) {
    if (teacherSick) return 0;
    var base = PATROL_CHANCE[location.patrolRisk];
    var heatMultiplier = 1 + (heat / 100) * 2; // 1x at 0 heat → 3x at 100 heat
    return Math.min(0.95, base * heatMultiplier);
  }

  // Probability a bully encounter fires this turn
  function bullyChance(location) {
    return BULLY_CHANCE[location.bullyRisk];
  }

  // Risk-weighted stash value: sum(qty * riskWeight * price)
  function stashRiskValue(stash, candies, currentPrices) {
    return candies.reduce(function(total, candy) {
      var qty = stash[candy.id] || 0;
      var price = currentPrices[candy.id] || candy.basePrice;
      return total + qty * candy.riskWeight * price;
    }, 0);
  }

  // Outcome when a teacher catches you
  function resolveTeacherCatch(riskValue) {
    if (riskValue < 20) return { confiscate: true, principalVisit: false, heatSpike: false };
    if (riskValue < 60) return { confiscate: true, principalVisit: true,  heatSpike: false };
    return               { confiscate: true, principalVisit: true,  heatSpike: true  };
  }

  // Apply a teacher catch outcome to state (mutates)
  function applyTeacherCatch(state, outcome) {
    if (outcome.confiscate) state.stash = {};
    if (outcome.principalVisit) state.principalVisits += 1;
    if (outcome.heatSpike) state.heat = Math.min(100, state.heat + 30);
  }

  // Apply bully robbery outcome to state (mutates)
  function applyBullyRob(state) {
    state.stash = {};
    state.heat = Math.max(0, state.heat - 10);
  }

  return { generate: generate, decay: decay, teacherChance: teacherChance, bullyChance: bullyChance, stashRiskValue: stashRiskValue, resolveTeacherCatch: resolveTeacherCatch, applyTeacherCatch: applyTeacherCatch, applyBullyRob: applyBullyRob };
})();
