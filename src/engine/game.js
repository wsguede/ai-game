var Game = (function() {
  var _tradeMode  = null;  // 'buy' | 'sell'
  var _tradeCandy = null;  // candy id
  var _maxBuy     = 0;
  var _maxSell    = 0;
  var _travelHints = 0;    // show travel-ends-turn hint for first 2 travels

  function startTurn() {
    var s = State.get();
    s.pendingNotifications = [];

    // Apply calendar event effect BEFORE price update — player sees prices and event on same day
    var calEventObj = s.era.calendarEvents ? s.era.calendarEvents[s.turn] : null;
    if (calEventObj) {
      EventEngine.executeEffect(calEventObj, s);
    }

    // Market update
    var newPrices = Market.updatePrices(s.currentPrices, s.era.candies, s.activeEffects);
    s.currentPrices = newPrices;

    // Decay active effects
    s.activeEffects = s.activeEffects
      .map(function(e) { return Object.assign({}, e, { turnsLeft: e.turnsLeft - 1 }); })
      .filter(function(e) { return e.turnsLeft > 0; });

    // Reset per-turn flags
    s.teacherSickThisTurn = s.teacherSickNextTurn;
    s.teacherSickNextTurn = false;
    s.bulkDealActive = false;
    s.tradedThisTurn = false;
    s.laidLowThisTurn = s.laidLowNextTurn;
    s.laidLowNextTurn = false;

    // Allowance: every 5 days mom gives you $5
    if (s.turn % 5 === 0) {
      s.cash = Math.round((s.cash + 5) * 100) / 100;
      s.pendingNotifications.push('<strong>ALLOWANCE DAY</strong> — Mom slips you $5 for doing your chores.');
    }

    // Travel hint: first 2 times the player moves locations
    if (s._travelHint) {
      s._travelHint = false;
      s.pendingNotifications.push('<strong>HEADS UP</strong> — Moving to a new location uses your whole day.');
    }

    // Calendar events take priority over random selection
    if (calEventObj) {
      s.pendingEvent = calEventObj;
    } else {
      var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
      var event = EventEngine.selectEvent(s, location, s.era);
      s.pendingEvent = event;

      if (event && event.type !== 'teacher' && event.type !== 'bully') {
        EventEngine.executeEffect(event, s);
      }

      if (event && event.type === 'teacher') {
        if (!Heat.teacherCaught(s.heat)) {
          if (s.heat > 0) {
            s.pendingEvent = { type: 'flavor', cssClass: 'threat',
              text: 'Mrs. Henderson eyes you carefully. She knows something\'s up — but can\'t prove it.' };
          } else {
            s.pendingEvent = null;
          }
        } else {
          var outcome = EventEngine.resolveTeacher(s);
          var teacherMsg = 'A teacher spots you. ';
          if (!outcome.principalVisit) {
            teacherMsg += 'She confiscates everything but lets you off with a warning.';
          } else if (!outcome.heatSpike) {
            teacherMsg += 'She confiscates everything and sends you to the principal. (' + s.principalVisits + '/3)';
          } else {
            teacherMsg += 'She confiscates everything, sends you to the principal, and calls your parents. (' + s.principalVisits + '/3)';
          }
          s.pendingEvent = Object.assign({}, event, { text: teacherMsg });

          if (s.principalVisits >= 3) {
            UI.render(s);
            setTimeout(function() { UI.renderLoss(s); }, 800);
            return;
          }
        }
      }
    }

    UI.render(s);
  }

  function endTurn() {
    var s = State.get();
    // Bully event must be resolved before ending turn
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;

    // Capture seen prices at departing location before any travel change
    var captureLoc = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    var seenPrices = {};
    s.era.candies.forEach(function(c) {
      seenPrices[c.id] = Market.getLocationPrice(s.currentPrices[c.id], c, captureLoc, s.activeEffects);
    });
    s.previousSeenPrices = seenPrices;

    // Apply deferred travel destination
    if (s.pendingTravelDest) {
      s.currentLocation = s.pendingTravelDest;
      s.pendingTravelDest = null;
    }

    // Heat decay
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    s.heat = Heat.decay(s.heat, location);

    // Check win/loss
    if (s.principalVisits >= 3) { UI.renderLoss(s); return; }
    if (s.turn >= s.maxTurns) { UI.renderWin(s); return; }

    s.turn++;
    startTurn();
  }

  function travel(locationId) {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    s.pendingTravelDest = locationId;
    if (_travelHints < 2) {
      _travelHints++;
      s._travelHint = true;
    }
    endTurn();
  }

  function layLow() {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    s.heat = Math.max(0, s.heat - 10);
    s.laidLowNextTurn = true;
    endTurn();
  }

  function setTradeMode(mode) {
    if (mode === 'buy'  && _maxBuy  === 0) mode = 'sell';
    if (mode === 'sell' && _maxSell === 0) mode = 'buy';
    _tradeMode = mode;
    var s = State.get();
    var candy = s.era.candies.find(function(c) { return c.id === _tradeCandy; });
    document.getElementById('modal-title').textContent = (mode === 'buy' ? 'BUY ' : 'SELL ') + candy.name.toUpperCase();
    var buyBtn  = document.getElementById('modal-buy-btn');
    var sellBtn = document.getElementById('modal-sell-btn');
    buyBtn.classList.toggle('modal-btn-active', mode === 'buy');
    sellBtn.classList.toggle('modal-btn-active', mode === 'sell');
    buyBtn.disabled  = _maxBuy  === 0;
    sellBtn.disabled = _maxSell === 0;
    _clearModalError();
  }

  function fillMax() {
    var qty = _tradeMode === 'buy' ? _maxBuy : _maxSell;
    var input = document.getElementById('modal-qty');
    input.value = qty;
    _clearModalError();
    input.focus();
  }

  function openTrade(candyId) {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    var candy = s.era.candies.find(function(c) { return c.id === candyId; });
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    var price = Market.getLocationPrice(s.currentPrices[candyId], candy, location, s.activeEffects);
    var inBag = s.stash[candyId] || 0;

    _tradeCandy = candyId;
    _maxBuy  = Math.min(State.stashAvailable(), Math.floor(s.cash / price));
    _maxSell = inBag;

    document.getElementById('modal-info').innerHTML =
      'Price: <strong>$' + price.toFixed(2) + '</strong> &nbsp;|&nbsp; ' +
      'Cash: <strong>$' + s.cash.toFixed(2) + '</strong> &nbsp;|&nbsp; ' +
      'In bag: <strong>' + inBag + '</strong>';

    _clearModalError();
    document.getElementById('modal-qty').value = '';

    document.getElementById('modal-confirm').onclick = function() {
      var qty = parseInt(document.getElementById('modal-qty').value, 10);
      if (!qty || qty < 1) return;
      if (_tradeMode === 'buy') executeBuy(candyId, qty, price, candy);
      else executeSell(candyId, qty, price, candy);
    };
    document.getElementById('modal-cancel').onclick = closeModal;

    setTradeMode(inBag > 0 ? 'sell' : 'buy');
    document.getElementById('trade-modal').classList.add('active');
    document.getElementById('modal-qty').focus();
  }

  function _modalError(msg, maxQty) {
    var input = document.getElementById('modal-qty');
    var err = document.getElementById('modal-error');
    err.textContent = msg;
    input.classList.add('error');
    input.value = maxQty;
    input.select();
  }

  function _clearModalError() {
    document.getElementById('modal-error').textContent = '';
    document.getElementById('modal-qty').classList.remove('error');
  }

  function executeBuy(candyId, qty, price, candy) {
    var s = State.get();
    var maxCash = Math.floor(s.cash / price);
    var maxStash = State.stashAvailable();
    var maxBuy = Math.min(maxCash, maxStash);
    if (qty > maxCash) { _modalError('Not enough cash — max: ' + Math.min(maxCash, maxStash), maxBuy); return; }
    if (qty > maxStash) { _modalError('Not enough stash space — max: ' + maxBuy, maxBuy); return; }
    var total = price * qty;
    var discounted = total;
    if (s.bulkDealActive && !s.bulkDealUsed && qty <= 10) {
      discounted = price * 0.80 * qty;
      s.bulkDealUsed = true;
      s.bulkDealActive = false;
    }
    s.cash = Math.round((s.cash - discounted) * 100) / 100;
    State.addToStash(candyId, qty);
    s.tradedThisTurn = true;
    s.heat = Math.min(100, s.heat + Heat.generate(candy, qty));
    closeModal();
    UI.render(s);
  }

  function executeSell(candyId, qty, price, candy) {
    var s = State.get();
    var maxSell = s.stash[candyId] || 0;
    if (qty > maxSell) { _modalError('Not enough in bag — max: ' + maxSell, maxSell); return; }
    s.cash = Math.round((s.cash + price * qty) * 100) / 100;
    State.removeFromStash(candyId, qty);
    s.tradedThisTurn = true;
    s.heat = Math.min(100, s.heat + Heat.generate(candy, qty));
    closeModal();
    UI.render(s);
  }

  function closeModal() {
    _clearModalError();
    document.getElementById('trade-modal').classList.remove('active');
    _tradeMode = null;
    _tradeCandy = null;
  }

  function payBully() {
    var s = State.get();
    if (s.cash < 5) { alert('Not enough cash to pay bully.'); return; }
    s.cash = Math.round((s.cash - 5) * 100) / 100;
    s.pendingEvent = null;
    UI.render(s);
  }

  function runFromBully() {
    var s = State.get();
    if (Math.random() < 0.5) {
      s.pendingEvent = { type: 'flavor', cssClass: 'flavor', text: 'You bolt. Tommy can\'t keep up. Clean getaway.' };
    } else {
      s.pendingEvent = { type: 'flavor', cssClass: 'threat', text: 'You try to run but Tommy catches you. He takes everything.' };
      Heat.applyBullyRob(s);
    }
    UI.render(s);
  }

  function acceptRob() {
    var s = State.get();
    Heat.applyBullyRob(s);
    s.pendingEvent = { type: 'flavor', cssClass: 'flavor', text: 'Tommy takes everything. Mrs. Henderson saw the whole thing. "Are you okay, sweetie?" Your heat drops.' };
    UI.render(s);
  }

  function init() {
    State.init(ERA_V1);
    document.getElementById('intro-modal').classList.add('active');
  }

  function closeIntro() {
    document.getElementById('intro-modal').classList.remove('active');
    startTurn();
  }

  return { init: init, endTurn: endTurn, travel: travel, layLow: layLow, openTrade: openTrade, setTradeMode: setTradeMode, fillMax: fillMax, payBully: payBully, runFromBully: runFromBully, acceptRob: acceptRob, closeIntro: closeIntro };
})();


// Start the game
window.onload = function() { Game.init(); };
