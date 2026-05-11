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

test('ERA_V1 has 3 win goal tiers', function() {
  assertEqual(ERA_V1.winGoals.length, 3);
});

test('ERA_V1 win goals are in ascending cash order', function() {
  for (var i = 1; i < ERA_V1.winGoals.length; i++) {
    assertTrue(ERA_V1.winGoals[i].cash > ERA_V1.winGoals[i-1].cash);
  }
});
