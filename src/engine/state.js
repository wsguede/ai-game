var State = window.State = (function() {
  var Market = window.Market;
  var _state = {};

  function init(era) {
    var initialPrices = {};
    era.candies.forEach(function(c) { initialPrices[c.id] = c.basePrice; });

    var startLocation = era.locations[0];
    var initialSeenPrices = {};
    era.candies.forEach(function(c) {
      initialSeenPrices[c.id] = Market.getLocationPrice(initialPrices[c.id], c, startLocation, []);
    });

    _state = {
      turn: 1,
      maxTurns: era.maxTurns,
      cash: era.startingCash,
      stash: {},              // { candyId: quantity }
      stashCapacity: era.stashCapacity,
      heat: 0,
      principalVisits: 0,
      currentLocation: era.locations[0].id,
      gamePhase: 'playing',  // 'playing' | 'won' | 'lost'
      currentPrices: initialPrices,
      previousSeenPrices: initialSeenPrices,
      activeEffects: [],
      pendingNotifications: [],
      pendingEvent: null,
      bulkDealActive: false,
      bulkDealUsed: false,
      tradedThisTurn: false,
      laidLowThisTurn: false,
      laidLowNextTurn: false,
      teacherSickThisTurn: false,
      teacherSickNextTurn: false,
      pendingTravelDest: null,
      ownedTiers: { storage: 0, tech: 0 },
      priceHistory: {},
      shopPurchasedThisTurn: false,
      shopWarningCount: 0,
      era: era,
    };
    return _state;
  }

  function get() { return _state; }

  function stashTotal() {
    return Object.values(_state.stash).reduce(function(sum, qty) { return sum + qty; }, 0);
  }

  function stashAvailable() {
    return _state.stashCapacity - stashTotal();
  }

  function addToStash(candyId, qty) {
    if (stashAvailable() < qty) throw new Error('Not enough stash space');
    _state.stash[candyId] = (_state.stash[candyId] || 0) + qty;
  }

  function removeFromStash(candyId, qty) {
    var current = _state.stash[candyId] || 0;
    if (current < qty) throw new Error('Not enough ' + candyId + ' in stash');
    _state.stash[candyId] = current - qty;
    if (_state.stash[candyId] === 0) delete _state.stash[candyId];
  }

  function clearStash() {
    _state.stash = {};
  }

  return { init: init, get: get, stashTotal: stashTotal, stashAvailable: stashAvailable, addToStash: addToStash, removeFromStash: removeFromStash, clearStash: clearStash };
})();
