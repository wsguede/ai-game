var Game = (function() {
  var _tradeMode = null;   // 'buy' | 'sell'
  var _tradeCandy = null;  // candy id

  function startTurn() {
    var s = State.get();

    // Market update
    var newPrices = Market.updatePrices(s.currentPrices, s.era.candies, s.activeEffects);
    s.previousPrices = JSON.parse(JSON.stringify(s.currentPrices));
    s.currentPrices = newPrices;

    // Decay active effects
    s.activeEffects = s.activeEffects
      .map(function(e) { return Object.assign({}, e, { turnsLeft: e.turnsLeft - 1 }); })
      .filter(function(e) { return e.turnsLeft > 0; });

    // Reset per-turn flags (promote next-turn flags before rolling events)
    s.teacherSickThisTurn = s.teacherSickNextTurn;
    s.teacherSickNextTurn = false;
    s.bulkDealActive = false;

    // Select event
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    var event = EventEngine.selectEvent(s, location, s.era);
    s.pendingEvent = event;

    // Execute non-interactive event effects immediately
    if (event && event.type !== 'teacher' && event.type !== 'bully') {
      EventEngine.executeEffect(event, s);
    }

    // Resolve teacher immediately (no player choice)
    if (event && event.type === 'teacher') {
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

    UI.render(s);
  }

  function endTurn() {
    var s = State.get();
    // Bully event must be resolved before ending turn
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;

    // Heat decay
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    s.heat = Heat.decay(s.heat, location);

    // Check win/loss
    if (s.principalVisits >= 3) { UI.renderLoss(s); return; }
    if (s.turn >= s.maxTurns) {
      if (s.cash >= s.era.winGoals[0].cash) UI.renderWin(s);
      else UI.renderLoss(s);
      return;
    }

    s.turn++;
    startTurn();
  }

  function travel(locationId) {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    s.currentLocation = locationId;
    endTurn();
  }

  function layLow() {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    s.heat = Math.max(0, s.heat - 20);
    endTurn();
  }

  function openTrade(candyId) {
    var s = State.get();
    if (s.pendingEvent && s.pendingEvent.type === 'bully') return;
    var candy = s.era.candies.find(function(c) { return c.id === candyId; });
    var location = s.era.locations.find(function(l) { return l.id === s.currentLocation; });
    var price = Market.getLocationPrice(s.currentPrices[candyId], candy, location);
    var inBag = s.stash[candyId] || 0;

    _tradeCandy = candyId;
    var maxBuy = Math.min(State.stashAvailable(), Math.floor(s.cash / price));
    var maxSell = inBag;

    document.getElementById('modal-title').textContent = candy.name.toUpperCase();
    document.getElementById('modal-info').innerHTML =
      'Price: <strong>$' + price.toFixed(2) + '</strong> &nbsp;|&nbsp; ' +
      'Cash: <strong>$' + s.cash.toFixed(2) + '</strong> &nbsp;|&nbsp; ' +
      'In bag: <strong>' + inBag + '</strong><br>' +
      '[B] Max buy: ' + maxBuy + ' &nbsp;|&nbsp; [S] Max sell: ' + maxSell;

    document.getElementById('modal-qty').value = '';
    document.getElementById('modal-qty').placeholder = 'Quantity';

    document.getElementById('modal-confirm').onclick = function() {
      var qty = parseInt(document.getElementById('modal-qty').value, 10);
      if (!qty || qty < 1) return;
      if (_tradeMode === 'buy') executeBuy(candyId, qty, price, candy);
      else executeSell(candyId, qty, price, candy);
    };

    document.getElementById('modal-cancel').onclick = closeModal;

    // Default to buy if has space, sell if has inventory
    _tradeMode = inBag > 0 ? 'sell' : 'buy';
    document.getElementById('modal-title').textContent =
      (_tradeMode === 'buy' ? 'BUY ' : 'SELL ') + candy.name.toUpperCase();

    document.getElementById('trade-modal').classList.add('active');
    document.getElementById('modal-qty').focus();
  }

  function executeBuy(candyId, qty, price, candy) {
    var s = State.get();
    var total = price * qty;
    if (total > s.cash) { alert('Not enough cash.'); return; }
    if (qty > State.stashAvailable()) { alert('Not enough stash space.'); return; }
    var discounted = total;
    if (s.bulkDealActive && !s.bulkDealUsed && qty <= 10) {
      discounted = price * 0.80 * qty;
      s.bulkDealUsed = true;
      s.bulkDealActive = false;
    }
    s.cash = Math.round((s.cash - discounted) * 100) / 100;
    State.addToStash(candyId, qty);
    s.heat = Math.min(100, s.heat + Heat.generate(candy, qty));
    closeModal();
    UI.render(s);
  }

  function executeSell(candyId, qty, price, candy) {
    var s = State.get();
    if ((s.stash[candyId] || 0) < qty) { alert('Not enough ' + candy.name + ' in bag.'); return; }
    s.cash = Math.round((s.cash + price * qty) * 100) / 100;
    State.removeFromStash(candyId, qty);
    s.heat = Math.min(100, s.heat + Heat.generate(candy, qty));
    closeModal();
    UI.render(s);
  }

  function closeModal() {
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
    startTurn();
  }

  return { init: init, endTurn: endTurn, travel: travel, layLow: layLow, openTrade: openTrade, payBully: payBully, runFromBully: runFromBully, acceptRob: acceptRob };
})();

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (document.getElementById('trade-modal').classList.contains('active')) {
    if (e.key === 'Escape') Game.openTrade && document.getElementById('modal-cancel').click();
    return;
  }
  if (e.key === 'Enter') Game.endTurn();
  if (e.key === 'l' || e.key === 'L') Game.layLow();
});

// Start the game
window.onload = function() { Game.init(); };
