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

test('EventEngine.selectEvent returns null when no events fire (mocked random=1)', function() {
  State.init(ERA_V1);
  var s = State.get();
  s.heat = 0;
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  // Override Math.random to always return 1 (no events fire)
  var origRandom = Math.random;
  Math.random = function() { return 1; };
  var event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
  Math.random = origRandom;
  assertEqual(event, null);
});

test('EventEngine.selectEvent returns teacher when random is below teacher chance', function() {
  State.init(ERA_V1);
  var s = State.get();
  s.heat = 100;
  var cafeteria = LOCATIONS.find(function(l) { return l.id === 'cafeteria'; });
  var origRandom = Math.random;
  Math.random = function() { return 0.0; }; // always fires
  var event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
  Math.random = origRandom;
  assertEqual(event.type, 'teacher');
});

test('EventEngine.resolveTeacher: low stash → no principal visit', function() {
  State.init(ERA_V1);
  var s = State.get();
  // 5 smarties at $0.25, riskWeight 1 → $1.25 risk value (well under $20)
  s.stash = { smarties: 5 };
  var outcome = EventEngine.resolveTeacher(s);
  assertEqual(outcome.principalVisit, false);
});

test('EventEngine.resolveTeacher: high stash → principal visit', function() {
  State.init(ERA_V1);
  var s = State.get();
  // 3 Ferrero Rocher at $10, riskWeight 4 → $120 risk value (over $60)
  s.stash = { ferrerorocher: 3 };
  var outcome = EventEngine.resolveTeacher(s);
  assertEqual(outcome.principalVisit, true);
  assertEqual(outcome.heatSpike, true);
});

test('EventEngine.selectEvent skips teacher when stash is empty', function() {
  State.init(ERA_V1);
  var s = State.get();
  s.turn = 2;
  s.heat = 100;
  var cafeteria = ERA_V1.locations.find(function(l) { return l.id === 'cafeteria'; });
  var origRandom = Math.random;
  Math.random = function() { return 0.0; };
  var event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
  Math.random = origRandom;
  assertTrue(!event || event.type !== 'teacher', 'teacher should not fire with empty stash');
});

test('EventEngine.selectEvent skips teacher and bully when laidLowThisTurn', function() {
  State.init(ERA_V1);
  var s = State.get();
  s.turn = 2;
  s.heat = 100;
  s.laidLowThisTurn = true;
  State.addToStash('smarties', 5);
  var cafeteria = ERA_V1.locations.find(function(l) { return l.id === 'cafeteria'; });
  var origRandom = Math.random;
  Math.random = function() { return 0.0; };
  var event = EventEngine.selectEvent(s, cafeteria, ERA_V1);
  Math.random = origRandom;
  assertTrue(!event || (event.type !== 'teacher' && event.type !== 'bully'), 'no threats when laidLow');
});
