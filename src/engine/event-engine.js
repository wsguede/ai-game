var EventEngine = window.EventEngine = (function() {
  var State = window.State;
  var Heat = window.Heat;
  // Select the event for this turn. Returns event object or null.
  // Teacher and bully are checked first (probability-based).
  // Pool events fire with 40% base chance from eligible events.
  function selectEvent(state, location, era) {
    var s = state;

    // Day 1: no threats or negative events — give the player a safe first turn
    if (s.turn !== 1 && !s.laidLowThisTurn) {
      if (State.stashTotal() > 0) {
        var tChance = Heat.teacherChance(s.heat, location, s.teacherSickThisTurn);
        if (Math.random() < tChance) {
          return { type: 'teacher', cssClass: 'threat', id: 'teacher' };
        }
      }

      var bChance = Heat.bullyChance(location);
      if (Math.random() < bChance) {
        return { type: 'bully', cssClass: 'threat', id: 'bully',
          text: 'Tommy steps out from behind the lockers. He wants what\'s in your bag.',
        };
      }
    }

    if (Math.random() > 0.40) return null;
    var eligible = era.events.filter(function(e) {
      if (s.turn === 1 && e.allowOnDay1 === false) return false;
      return e.type !== 'threat' && e.condition(s);
    });
    if (eligible.length === 0) return null;
    var event = eligible[Math.floor(Math.random() * eligible.length)];
    return event;
  }

  // Execute a non-threat event effect on state
  function executeEffect(event, state) {
    if (typeof event.effect === 'function') event.effect(state);
  }

  // Resolve a teacher catch against current state (mutates)
  function resolveTeacher(state) {
    var s = state;
    var riskVal = Heat.stashRiskValue(s.stash, s.era.candies, s.currentPrices);
    var outcome = Heat.resolveTeacherCatch(riskVal);
    Heat.applyTeacherCatch(s, outcome);
    return outcome;
  }

  return { selectEvent: selectEvent, executeEffect: executeEffect, resolveTeacher: resolveTeacher };
})();
