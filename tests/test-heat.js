test('Heat.generate: low-risk candy generates 0.5 per unit', function() {
  var smarties = CANDIES.find(function(c) { return c.id === 'smarties'; });
  assertEqual(Heat.generate(smarties, 10), 5.0);
});

test('Heat.generate: high-risk candy generates 3.0 per unit', function() {
  var rpr = CANDIES.find(function(c) { return c.id === 'rarepoprocks'; });
  assertEqual(Heat.generate(rpr, 5), 15.0);
});

test('Heat.decay: removes 2 heat by default', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  assertEqual(Heat.decay(20, cafeteria), 18);
});

test('Heat.decay: library removes 5 heat (2 + 3 bonus)', function() {
  var library = LOCATIONS.find(function(l) { return l.id === 'library'; });
  assertEqual(Heat.decay(20, library), 15);
});

test('Heat.decay: does not go below 0', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  assertEqual(Heat.decay(1, cafeteria), 0);
});

test('Heat.teacherChance: zero at none patrol risk', function() {
  var bathroom = LOCATIONS.find(function(l) { return l.id === 'bathroom'; });
  assertEqual(Heat.teacherChance(100, bathroom, false), 0);
});

test('Heat.teacherChance: zero when teacher is sick', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  assertEqual(Heat.teacherChance(100, cafeteria, true), 0);
});

test('Heat.teacherChance: higher at high heat than low heat', function() {
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  var low = Heat.teacherChance(10, cafeteria, false);
  var high = Heat.teacherChance(90, cafeteria, false);
  assertTrue(high > low, 'high heat should increase teacher chance');
});

test('Heat.stashRiskValue: empty stash is 0', function() {
  assertEqual(Heat.stashRiskValue({}, CANDIES, {}), 0);
});

test('Heat.stashRiskValue: 10 smarties at base price = 10 * 1 * 0.25 = 2.5', function() {
  var prices = {};
  CANDIES.forEach(function(c) { prices[c.id] = c.basePrice; });
  assertClose(Heat.stashRiskValue({ smarties: 10 }, CANDIES, prices), 2.5, 0.001);
});

test('Heat.stashRiskValue: 5 Ferrero Rocher at base = 5 * 4 * 10 = 200', function() {
  var prices = {};
  CANDIES.forEach(function(c) { prices[c.id] = c.basePrice; });
  assertClose(Heat.stashRiskValue({ ferrerorocher: 5 }, CANDIES, prices), 200, 0.001);
});

test('Heat.resolveTeacherCatch: under $20 = confiscate only', function() {
  var result = Heat.resolveTeacherCatch(15);
  assertEqual(result.confiscate, true);
  assertEqual(result.principalVisit, false);
  assertEqual(result.heatSpike, false);
});

test('Heat.resolveTeacherCatch: $20-$60 = confiscate + principal', function() {
  var result = Heat.resolveTeacherCatch(40);
  assertEqual(result.confiscate, true);
  assertEqual(result.principalVisit, true);
  assertEqual(result.heatSpike, false);
});

test('Heat.resolveTeacherCatch: over $60 = confiscate + principal + heat spike', function() {
  var result = Heat.resolveTeacherCatch(80);
  assertEqual(result.confiscate, true);
  assertEqual(result.principalVisit, true);
  assertEqual(result.heatSpike, true);
});

test('Heat.applyBullyRob: clears stash and reduces heat by 10', function() {
  var fakeState = { stash: { smarties: 5 }, heat: 40 };
  Heat.applyBullyRob(fakeState);
  assertEqual(Object.keys(fakeState.stash).length, 0);
  assertEqual(fakeState.heat, 30);
});

test('Heat.applyBullyRob: heat does not go below 0', function() {
  var fakeState = { stash: {}, heat: 5 };
  Heat.applyBullyRob(fakeState);
  assertEqual(fakeState.heat, 0);
});
