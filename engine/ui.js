var UI = (function() {
  var TREND_SYMBOLS = { flat: '━', up: '▲', upup: '▲▲', down: '▼', downdown: '▼▼' };
  var RISK_CLASS    = { low: 'risk-low', med: 'risk-med', high: 'risk-high' };
  var VOL_CLASS     = { low: 'vol-low',  med: 'vol-med',  high: 'vol-high' };

  function renderStatusBar(state) {
    var heatPips = '';
    for (var i = 0; i < 10; i++) {
      var threshold = (i + 1) * 10;
      var cls = state.heat >= threshold ? (state.heat >= 70 ? 'active' : 'warn') : '';
      heatPips += '<div class="heat-pip ' + cls + '"></div>';
    }
    var principalDots = '';
    for (var j = 0; j < 3; j++) {
      principalDots += '<span style="color:' + (j < state.principalVisits ? '#ff4444' : '#333') + '">■</span> ';
    }
    document.getElementById('status-bar').innerHTML =
      '<div class="status-row">' +
        '<div>DAY <span>' + state.turn + '</span>/' + state.maxTurns + '</div>' +
        '<div>CASH: <span class="green">$' + state.cash.toFixed(2) + '</span></div>' +
        '<div>STASH: <span>' + State.stashTotal() + '</span>/' + state.stashCapacity + '</div>' +
        '<div>HEAT: <div class="heat-bar">' + heatPips + '</div></div>' +
        '<div>PRINCIPAL: ' + principalDots + '</div>' +
      '</div>';
  }

  function renderGiftProgress(state) {
    var topGoal = state.era.winGoals[state.era.winGoals.length - 1].cash;
    var pct = Math.min(100, (state.cash / topGoal) * 100);
    var nextGoal = state.era.winGoals.find(function(g) { return state.cash < g.cash; });
    var goalLabel = nextGoal ? '$' + nextGoal.cash + ' 🎁' : '★ ACHIEVED ★';
    document.getElementById('gift-section').innerHTML =
      '<div class="section-header">MOM\'S GIFT FUND</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="gift-label"><span>$' + state.cash.toFixed(2) + ' saved</span><span>Goal: ' + goalLabel + '</span></div>';
  }

  function renderLocations(locations, currentLocationId) {
    var html = '<div class="section-header">LOCATION</div><div class="location-list">';
    locations.forEach(function(loc) {
      var isCurrent = loc.id === currentLocationId;
      var tips = loc.tooltip.map(function(t) {
        return '<span class="' + t.cls + '">' + t.text + '</span>';
      }).join('<br>');
      html += '<button class="location-btn' + (isCurrent ? ' current' : '') + '" ' +
        (isCurrent ? 'disabled' : 'onclick="Game.travel(\'' + loc.id + '\')"') + '>' +
        loc.name +
        '<div class="loc-tooltip"><div class="tip-title">' + loc.name + '</div>' + tips + '</div>' +
        '</button>';
    });
    html += '</div>';
    document.getElementById('location-section').innerHTML = html;
  }

  function renderMarket(candies, currentPrices, previousPrices, stash, location, activeEffects, cash, stashCapacity) {
    var stashUsed  = Object.values(stash).reduce(function(s, q) { return s + q; }, 0);
    var stashAvail = stashCapacity - stashUsed;
    var prevTier = null;
    var rows = candies.map(function(candy) {
      var basePrice = currentPrices[candy.id];
      var locPrice  = Market.getLocationPrice(basePrice, candy, location, activeEffects);
      var prevPrice = Market.getLocationPrice(previousPrices[candy.id] || basePrice, candy, location);
      var trend     = Market.getPriceTrend(prevPrice, locPrice);
      var pct       = prevPrice > 0 ? Math.round((locPrice - prevPrice) / prevPrice * 100) : 0;
      var pctLabel  = (pct > 0 ? '+' : '') + pct + '% vs yesterday';
      var inBag     = stash[candy.id] || 0;
      var canBuy    = stashAvail > 0 && cash >= locPrice;
      var canTrade  = canBuy || inBag > 0;
      var classes   = [];
      if (prevTier !== null && prevTier !== candy.risk) classes.push('tier-divider');
      if (!canTrade) classes.push('row-disabled');
      prevTier = candy.risk;
      var classAttr  = classes.length ? ' class="' + classes.join(' ') + '"' : '';
      var onClickAttr = canTrade ? ' onclick="Game.openTrade(\'' + candy.id + '\')"' : '';
      return '<tr' + classAttr + onClickAttr + '>' +
        '<td class="candy-cell">' +
          '<span class="candy-name">' + candy.name + '</span>' +
          '<div class="candy-tooltip">' +
            '<div class="ct-title">' + candy.name + '</div>' +
            '<div class="ct-row"><span class="ct-label">Risk</span><span class="' + RISK_CLASS[candy.risk] + '">' + candy.risk.toUpperCase() + '</span></div>' +
            '<div class="ct-row"><span class="ct-label">Volatility</span><span class="' + VOL_CLASS[candy.volatility] + '">' + candy.volatility.toUpperCase() + '</span></div>' +
            '<div class="ct-row"><span class="ct-label">Heat/unit</span><span>+' + candy.heatPerUnit + '</span></div>' +
          '</div>' +
        '</td>' +
        '<td class="price-cell">$' + locPrice.toFixed(2) + ' <span class="trend-wrap"><span class="trend-' + trend + '">' + TREND_SYMBOLS[trend] + '</span><div class="trend-tip">' + pctLabel + '</div></span></td>' +
        '<td>' + inBag + '</td>' +
      '</tr>';
    }).join('');
    document.getElementById('market-section').innerHTML =
      '<div class="section-header">MARKET</div>' +
      '<table class="market-table">' +
        '<tr><th>CANDY</th><th>PRICE</th><th>IN BAG</th></tr>' +
        rows +
      '</table>';
  }

  function renderNotifications(notifications) {
    var el = document.getElementById('notifications');
    if (!notifications || notifications.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = notifications.map(function(n) {
      return '<div class="notif-item">' + n + '</div>';
    }).join('');
  }

  function renderEvent(event) {
    var box = document.getElementById('event-box');
    if (!event) { box.style.display = 'none'; return; }
    box.className = 'event-box ' + (event.cssClass || 'flavor');
    box.style.display = 'block';
    var title = event.type === 'teacher' ? '!! BUSTED !!'
              : event.type === 'bully'   ? '!! BULLY ALERT !!'
              : event.type === 'market'  ? '!! MARKET EVENT !!'
              : event.type === 'intel'   ? 'STREET INTEL'
              : 'MEANWHILE...';
    var text = event.text || '';
    if (event.type === 'teacher') {
      text = 'A teacher spots your bag and demands to see what\'s inside.';
    }
    box.innerHTML = '<div class="event-title">' + title + '</div>' + text;
  }

  function renderActions(state, pendingEvent) {
    var html = '';
    if (pendingEvent && pendingEvent.type === 'bully') {
      if (state.cash >= 5) html += '<button class="action-btn" onclick="Game.payBully()">PAY $5</button>';
      html +=
        '<button class="action-btn" onclick="Game.runFromBully()">RUN (50/50)</button>' +
        '<button class="action-btn danger" onclick="Game.acceptRob()">ACCEPT ROB</button>';
    } else {
      html =
        '<button class="action-btn" onclick="Game.layLow()">LAY LOW (−20 heat)</button>' +
        '<button class="action-btn" onclick="Game.endTurn()">END TURN →</button>';
    }
    document.getElementById('action-bar').innerHTML = html;
  }

  function renderWin(state) {
    var grade = 'C';
    var message = state.era.winGoals[0].message;
    for (var i = state.era.winGoals.length - 1; i >= 0; i--) {
      if (state.cash >= state.era.winGoals[i].cash) {
        grade = state.era.winGoals[i].grade;
        message = state.era.winGoals[i].message;
        break;
      }
    }
    document.getElementById('end-content').innerHTML =
      '<h1>SCHOOL\'S OUT</h1>' +
      '<div class="grade">' + grade + '</div>' +
      '<p>' + message + '</p>' +
      '<p style="color:#666;font-size:11px;">Final cash: $' + state.cash.toFixed(2) + ' · Day ' + state.turn + '</p>' +
      '<button class="action-btn" style="margin-top:20px" onclick="location.reload()">PLAY AGAIN</button>';
    document.getElementById('end-screen').classList.add('active');
  }

  function renderLoss(state) {
    var reason = state.principalVisits >= 3
      ? 'Three strikes. Mrs. Henderson sends you to the principal one last time. Detention — indefinite.'
      : 'Time\'s up. Day 30 is over.';
    document.getElementById('end-content').innerHTML =
      '<h1>GAME OVER</h1>' +
      '<div class="grade fail">F</div>' +
      '<p>' + reason + '</p>' +
      '<p>' + state.era.lossMessage + '</p>' +
      '<p style="color:#666;font-size:11px;">Final cash: $' + state.cash.toFixed(2) + '</p>' +
      '<button class="action-btn" style="margin-top:20px" onclick="location.reload()">TRY AGAIN</button>';
    document.getElementById('end-screen').classList.add('active');
  }

  function render(state) {
    var location = state.era.locations.find(function(l) { return l.id === state.currentLocation; });
    renderStatusBar(state);
    renderGiftProgress(state);
    renderLocations(state.era.locations, state.currentLocation);
    renderMarket(state.era.candies, state.currentPrices, state.previousPrices, state.stash, location, state.activeEffects, state.cash, state.stashCapacity);
    renderNotifications(state.pendingNotifications);
    renderEvent(state.pendingEvent);
    renderActions(state, state.pendingEvent);
  }

  return { render: render, renderWin: renderWin, renderLoss: renderLoss };
})();
