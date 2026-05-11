// Event shape: { id, type, text, cssClass, condition(state), effect(state, era) }
// type: 'threat' | 'market' | 'intel' | 'flavor'
// condition: function returning true if this event can fire
// effect: function that mutates state (market/intel events only; threat events handled by engine)
var EVENTS = [
  // --- MARKET EVENTS ---
  {
    id: 'halloween_spike',
    type: 'market',
    cssClass: 'market',
    text: '!! MARKET EVENT: Halloween is coming. Everyone wants candy. Prices surging for 2 days.',
    condition: function(state) { return state.turn >= 5 && !state.activeEffects.some(function(e) { return e.id === 'halloween_spike'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'halloween_spike', type: 'allCandy', modifier: 1.30, turnsLeft: 2 });
    },
  },
  {
    id: 'halloween_crash',
    type: 'market',
    cssClass: 'market',
    text: '!! MARKET EVENT: Post-Halloween sugar crash. Everyone is sick of candy. Prices dropping.',
    condition: function(state) { return !state.activeEffects.some(function(e) { return e.id === 'halloween_crash'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'halloween_crash', type: 'allCandy', modifier: 0.80, turnsLeft: 1 });
    },
  },
  {
    id: 'valentines_surge',
    type: 'market',
    cssClass: 'market',
    text: '!! MARKET EVENT: Valentine\'s Day tomorrow. Chocolate prices surging.',
    condition: function(state) { return !state.activeEffects.some(function(e) { return e.id === 'valentines_surge'; }); },
    effect: function(state) {
      state.activeEffects.push({ id: 'valentines_surge', type: 'byRisk', risk: 'high', modifier: 1.40, turnsLeft: 2 });
    },
  },
  {
    id: 'bulk_deal',
    type: 'market',
    cssClass: 'market',
    text: 'OPPORTUNITY: A 5th grader is moving product cheap. Bulk deal available — up to 10 units of any candy at 20% off this turn.',
    condition: function(state) { return !state.bulkDealUsed; },
    effect: function(state) { state.bulkDealActive = true; },
  },
  // --- INTEL TIPS ---
  {
    id: 'tip_playground_spike',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Word is the playground is running low on penny candy. Prices there will be way up tomorrow.',
    condition: function(state) { return state.turn < 25; },
    effect: function() {},
  },
  {
    id: 'tip_library_spike',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Rich kids in the library are desperate for something fancy. High-end candy will go for a premium tomorrow.',
    condition: function(state) { return state.turn < 25; },
    effect: function() {},
  },
  {
    id: 'tip_teacher_sick',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Mrs. Henderson called in sick. Patrol risk is lower everywhere tomorrow.',
    condition: function(state) { return state.turn < 28; },
    effect: function(state) { state.teacherSickNextTurn = true; },
  },
  {
    id: 'tip_black_market',
    type: 'intel',
    cssClass: 'intel',
    text: 'INTEL: Someone whispers: "Check the bathroom tomorrow. Rare stuff coming in."',
    condition: function(state) { return state.turn < 27; },
    effect: function() {},
  },
  // --- FLAVOR EVENTS ---
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
