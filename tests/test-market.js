test('updatePrices keeps low-volatility candy within ±8%', function() {
  State.init(ERA_V1);
  var s = State.get();
  for (var i = 0; i < 20; i++) {
    var newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, []);
    var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
    var prev = s.currentPrices['smarties'];
    var next = newPrices['smarties'];
    var pct = Math.abs((next - prev) / prev);
    assertTrue(pct <= 0.09, 'smarties price change ' + pct + ' exceeds low volatility range');
    s.currentPrices = newPrices;
  }
});

test('updatePrices never goes below 10% of base price', function() {
  State.init(ERA_V1);
  var s = State.get();
  // Drive price down 50 times
  for (var i = 0; i < 50; i++) {
    var newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, []);
    ERA_V1.candies.forEach(function(candy) {
      var floor = candy.basePrice * 0.10;
      assertTrue(newPrices[candy.id] >= floor, candy.id + ' price ' + newPrices[candy.id] + ' below floor ' + floor);
    });
    s.currentPrices = newPrices;
  }
});

test('updatePrices applies allCandy modifier correctly', function() {
  State.init(ERA_V1);
  var s = State.get();
  var effects = [{ id: 'test', type: 'allCandy', modifier: 1.30, turnsLeft: 1 }];
  // Run many times; average should be well above base (1.30 * ~1.0 avg drift)
  var smartiesBase = s.currentPrices['smarties'];
  var newPrices = Market.updatePrices(s.currentPrices, ERA_V1.candies, effects);
  // With +30% modifier, even at worst drift (-8%) price should be ~1.196x base
  assertTrue(newPrices['smarties'] > smartiesBase, 'allCandy modifier should push price up');
});

test('getLocationPrice applies byRisk modifier', function() {
  var playground = LOCATIONS.find(function(l) { return l.id === 'playground'; });
  var smarties = ERA_V1.candies.find(function(c) { return c.id === 'smarties'; });
  var price = Market.getLocationPrice(0.25, smarties, playground);
  assertClose(price, 0.29, 0.01, 'playground low-risk modifier should give ~$0.29');
});

test('getLocationPrice applies byId override before byRisk', function() {
  var gymnasium = LOCATIONS.find(function(l) { return l.id === 'gymnasium'; });
  var kitkat = ERA_V1.candies.find(function(c) { return c.id === 'kitkat'; });
  var price = Market.getLocationPrice(3.20, kitkat, gymnasium);
  assertClose(price, 2.72, 0.01, 'gymnasium kitkat override should give ~$2.72 (0.85x)');
});

test('getLocationPrice applies all modifier in bathroom', function() {
  var bathroom = LOCATIONS.find(function(l) { return l.id === 'bathroom'; });
  var snickers = ERA_V1.candies.find(function(c) { return c.id === 'snickers'; });
  var price = Market.getLocationPrice(2.50, snickers, bathroom);
  assertClose(price, 2.25, 0.01, 'bathroom all modifier should give $2.25');
});

test('getPriceTrend returns correct strings', function() {
  assertEqual(Market.getPriceTrend(1.00, 1.00), 'flat');
  assertEqual(Market.getPriceTrend(1.00, 1.05), 'up');
  assertEqual(Market.getPriceTrend(1.00, 1.15), 'upup');
  assertEqual(Market.getPriceTrend(1.00, 0.95), 'down');
  assertEqual(Market.getPriceTrend(1.00, 0.85), 'downdown');
});
