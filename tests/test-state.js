test('CANDIES has exactly 9 entries', function() {
  assertEqual(CANDIES.length, 9);
});

test('each candy has required fields', function() {
  CANDIES.forEach(function(c) {
    assertTrue(c.id, 'missing id on ' + c.name);
    assertTrue(c.name, 'missing name');
    assertTrue(['low','med','high'].indexOf(c.risk) !== -1, 'invalid risk: ' + c.risk);
    assertTrue(['low','med','high'].indexOf(c.volatility) !== -1, 'invalid volatility: ' + c.volatility);
    assertTrue(c.basePrice > 0, 'basePrice must be positive');
    assertTrue(c.heatPerUnit > 0, 'heatPerUnit must be positive');
    assertTrue([1,2,4].indexOf(c.riskWeight) !== -1, 'invalid riskWeight: ' + c.riskWeight);
  });
});

test('candy ids are unique', function() {
  var ids = CANDIES.map(function(c) { return c.id; });
  var unique = ids.filter(function(id, i) { return ids.indexOf(id) === i; });
  assertEqual(unique.length, CANDIES.length);
});

test('low risk candies have riskWeight 1', function() {
  CANDIES.filter(function(c) { return c.risk === 'low'; }).forEach(function(c) {
    assertEqual(c.riskWeight, 1, c.name + ' should have riskWeight 1');
  });
});

test('high risk candies have riskWeight 4', function() {
  CANDIES.filter(function(c) { return c.risk === 'high'; }).forEach(function(c) {
    assertEqual(c.riskWeight, 4, c.name + ' should have riskWeight 4');
  });
});

test('LOCATIONS has exactly 5 entries', function() {
  assertEqual(LOCATIONS.length, 5);
});

test('each location has required fields', function() {
  var validRisk = ['none','low','med','high'];
  LOCATIONS.forEach(function(loc) {
    assertTrue(loc.id, 'missing id');
    assertTrue(loc.name, 'missing name');
    assertTrue(validRisk.indexOf(loc.patrolRisk) !== -1, 'invalid patrolRisk: ' + loc.patrolRisk);
    assertTrue(validRisk.indexOf(loc.bullyRisk) !== -1, 'invalid bullyRisk: ' + loc.bullyRisk);
    assertTrue(typeof loc.heatDecayBonus === 'number', 'heatDecayBonus must be a number');
    assertTrue(Array.isArray(loc.tooltip), 'tooltip must be array');
  });
});

test('library has heatDecayBonus 10', function() {
  var library = LOCATIONS.find(function(l) { return l.id === 'library'; });
  assertEqual(library.heatDecayBonus, 10);
});

test('bathroom has all-candy modifier 0.90', function() {
  var bathroom = LOCATIONS.find(function(l) { return l.id === 'bathroom'; });
  assertEqual(bathroom.modifiers.all, 0.90);
});

test('ERA_V1 references correct data arrays', function() {
  assertEqual(ERA_V1.candies, CANDIES);
  assertEqual(ERA_V1.locations, LOCATIONS);
  assertEqual(ERA_V1.events, EVENTS);
});

test('State.init sets previousSeenPrices for starting location', function() {
  State.init(ERA_V1);
  var s = State.get();
  // Cafeteria has no modifiers — seen prices equal base prices
  assertEqual(s.previousSeenPrices['smarties'], 0.25);
  assertEqual(s.previousSeenPrices['rarepoprocks'], 18.50);
});

test('State.init does not have previousPrices', function() {
  State.init(ERA_V1);
  assertEqual(State.get().previousPrices, undefined);
});

test('State.init has tradedThisTurn as false', function() {
  State.init(ERA_V1);
  assertEqual(State.get().tradedThisTurn, false);
});

test('State.init has laidLow flags as false', function() {
  State.init(ERA_V1);
  var s = State.get();
  assertEqual(s.laidLowThisTurn, false);
  assertEqual(s.laidLowNextTurn, false);
});

test('State.init sets correct starting values', function() {
  var s = State.init(ERA_V1);
  assertEqual(s.cash, 10.00);
  assertEqual(s.turn, 1);
  assertEqual(s.heat, 0);
  assertEqual(s.principalVisits, 0);
  assertEqual(s.gamePhase, 'playing');
  assertEqual(s.stashCapacity, 30);
});

test('State.init sets current prices from base prices', function() {
  State.init(ERA_V1);
  var s = State.get();
  assertEqual(s.currentPrices['smarties'], 0.25);
  assertEqual(s.currentPrices['rarepoprocks'], 18.50);
});

test('State.stashTotal returns 0 on fresh state', function() {
  State.init(ERA_V1);
  assertEqual(State.stashTotal(), 0);
});

test('State.addToStash and removeFromStash work correctly', function() {
  State.init(ERA_V1);
  State.addToStash('smarties', 5);
  assertEqual(State.stashTotal(), 5);
  assertEqual(State.stashAvailable(), 25);
  State.removeFromStash('smarties', 3);
  assertEqual(State.stashTotal(), 2);
});

test('State.addToStash throws when over capacity', function() {
  State.init(ERA_V1);
  var threw = false;
  try { State.addToStash('smarties', 31); }
  catch(e) { threw = true; }
  assertTrue(threw, 'should throw when exceeding stash capacity');
});

test('State.removeFromStash throws when insufficient quantity', function() {
  State.init(ERA_V1);
  var threw = false;
  try { State.removeFromStash('smarties', 1); }
  catch(e) { threw = true; }
  assertTrue(threw, 'should throw when removing candy not in stash');
});

test('State.clearStash empties all candy', function() {
  State.init(ERA_V1);
  State.addToStash('smarties', 5);
  State.addToStash('snickers', 3);
  State.clearStash();
  assertEqual(State.stashTotal(), 0);
});
