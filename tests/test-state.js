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
