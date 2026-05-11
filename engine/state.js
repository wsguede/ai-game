var State = (function() {
  var _state = {};

  function init(era) {
    var initialPrices = {};
    era.candies.forEach(function(c) { initialPrices[c.id] = c.basePrice; });

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
      previousPrices: initialPrices,
      activeEffects: [],
      pendingEvent: null,
      bulkDealActive: false,
      bulkDealUsed: false,
      teacherSickThisTurn: false,
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
