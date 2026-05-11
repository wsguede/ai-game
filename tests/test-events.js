test('EVENTS is a non-empty array', function() {
  assertTrue(Array.isArray(EVENTS) && EVENTS.length > 0);
});

test('each event has required fields', function() {
  var validTypes = ['threat', 'market', 'intel', 'flavor'];
  EVENTS.forEach(function(e) {
    assertTrue(e.id, 'missing id');
    assertTrue(validTypes.indexOf(e.type) !== -1, 'invalid type: ' + e.type + ' on ' + e.id);
    assertTrue(typeof e.text === 'string' && e.text.length > 0, 'missing text on ' + e.id);
    assertTrue(typeof e.condition === 'function', 'condition must be function on ' + e.id);
    assertTrue(typeof e.effect === 'function', 'effect must be function on ' + e.id);
  });
});

test('event ids are unique', function() {
  var ids = EVENTS.map(function(e) { return e.id; });
  var unique = ids.filter(function(id, i) { return ids.indexOf(id) === i; });
  assertEqual(unique.length, EVENTS.length);
});

test('there are at least 2 intel events', function() {
  var intel = EVENTS.filter(function(e) { return e.type === 'intel'; });
  assertTrue(intel.length >= 2);
});

test('bulk_deal effect sets bulkDealActive on state', function() {
  var event = EVENTS.find(function(e) { return e.id === 'bulk_deal'; });
  var fakeState = { bulkDealUsed: false, activeEffects: [] };
  event.effect(fakeState);
  assertEqual(fakeState.bulkDealActive, true);
});
