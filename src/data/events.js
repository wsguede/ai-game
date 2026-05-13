// Calendar events — not in the random pool; referenced directly by era calendarEvents map.
// Effects are applied BEFORE price calculation on their day (same-day visibility).
var HALLOWEEN_SPIKE = window.HALLOWEEN_SPIKE = {
  id: 'halloween_spike', type: 'market', cssClass: 'market',
  text: '!! HALLOWEEN !! Everyone wants candy. Prices surging across the board today.',
  effect: function(state) {
    state.activeEffects.push({ id: 'halloween_spike', type: 'allCandy', modifier: 1.30, turnsLeft: 1 });
  },
};
var HALLOWEEN_CRASH = window.HALLOWEEN_CRASH = {
  id: 'halloween_crash', type: 'market', cssClass: 'market',
  text: '!! POST-HALLOWEEN !! Sugar crash. Everyone is sick of candy. Prices dropping today.',
  effect: function(state) {
    state.activeEffects.push({ id: 'halloween_crash', type: 'allCandy', modifier: 0.80, turnsLeft: 1 });
  },
};
var VALENTINES_SURGE = window.VALENTINES_SURGE = {
  id: 'valentines_surge', type: 'market', cssClass: 'market',
  text: '!! VALENTINE\'S DAY !! Rich kids in a panic. Premium candy prices surge for 2 days.',
  effect: function(state) {
    state.activeEffects.push({ id: 'valentines_surge', type: 'byRisk', risk: 'high', modifier: 1.40, turnsLeft: 2 });
  },
};
var SPRING_BREAK = window.SPRING_BREAK = {
  id: 'spring_break', type: 'market', cssClass: 'market',
  text: '!! SPRING BREAK !! Energy is high and everyone is stocking up. Prices up across the board for 2 days.',
  effect: function(state) {
    state.activeEffects.push({ id: 'spring_break', type: 'allCandy', modifier: 1.25, turnsLeft: 2 });
  },
};

// Random event pool — fires with 40% chance on non-calendar days.
// Add allowOnDay1: false to any future events that shouldn't fire on turn 1.
var EVENTS = window.EVENTS = [
  {
    id: 'bulk_deal',
    type: 'market',
    cssClass: 'market',
    text: 'OPPORTUNITY: A 5th grader is moving product cheap. Bulk deal available — up to 10 units of any candy at 20% off this turn.',
    condition: function(state) { return !state.bulkDealUsed; },
    effect: function(state) { state.bulkDealActive = true; },
  },
  {
    id: 'tip_playground_spike',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Word is the playground is running low on penny candy. Prices there will be way up tomorrow.',
    condition: function(state) { return state.turn < 170 && !state.activeEffects.some(function(e) { return e.id === 'tip_playground_spike'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'tip_playground_spike', type: 'byLocation', location: 'playground', risk: 'low', modifier: 1.50, turnsLeft: 1 });
    },
  },
  {
    id: 'tip_library_spike',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Rich kids in the library are desperate for something fancy. High-end candy will go for a premium tomorrow.',
    condition: function(state) { return state.turn < 170 && !state.activeEffects.some(function(e) { return e.id === 'tip_library_spike'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'tip_library_spike', type: 'byLocation', location: 'library', risk: 'high', modifier: 1.40, turnsLeft: 1 });
    },
  },
  {
    id: 'tip_teacher_sick',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Mrs. Henderson called in sick. Patrol risk is lower everywhere tomorrow.',
    condition: function(state) { return state.turn < 170; },
    effect: function(state) { state.teacherSickNextTurn = true; },
  },
  {
    id: 'tip_black_market',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Someone whispers: "Check the bathroom tomorrow. Rare stuff coming in."',
    condition: function(state) { return state.turn < 170 && !state.activeEffects.some(function(e) { return e.id === 'tip_black_market'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'tip_black_market', type: 'byLocation', location: 'bathroom', risk: 'high', modifier: 0.70, turnsLeft: 1 });
    },
  },
  {
    id: 'flavor_tommy_caught',
    type: 'flavor',
    cssClass: 'flavor',
    text: 'Tommy got caught by Mrs. Henderson. He gives you a slow nod of respect.',
    condition: function() { return true; },
    effect: function() {},
  },
  {
    id: 'flavor_mystery_meat',
    type: 'flavor',
    cssClass: 'flavor',
    text: 'The cafeteria is serving mystery meat again. Comfort candy demand is way up.',
    condition: function() { return true; },
    effect: function() {},
  },
  {
    id: 'flavor_juice_box',
    type: 'flavor',
    cssClass: 'flavor',
    text: 'A 3rd grader offers to trade his Ferrero Rocher for a juice box. You decline.',
    condition: function() { return true; },
    effect: function() {},
  },
  {
    id: 'flavor_dentist',
    type: 'flavor',
    cssClass: 'flavor',
    text: 'The school nurse gave a speech about cavities. Business has never been better.',
    condition: function() { return true; },
    effect: function() {},
  },
];
