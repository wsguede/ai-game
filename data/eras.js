// ERA_V1: elementary school. Points engine at v1 data sets.
// Balance verified: $10 start lets player buy 30 Smarties or 4 Snickers on turn 1.
// At 15%/turn compound margin, C($100)~turn17, B($150)~turn20, A($250)~turn23 — all achievable in 30.
var ERA_V1 = {
  id: 'elementary',
  name: 'ELEMENTARY SCHOOL',
  candies: CANDIES,          // all 9 candy types
  locations: LOCATIONS,      // all 5 locations
  events: EVENTS,            // full event pool
  maxTurns: 30,
  startingCash: 10.00,
  stashCapacity: 30,
  winGoals: [
    { cash: 100, grade: 'C', message: "Mom seems pleased. \"Oh, how thoughtful.\" She sets it on the shelf." },
    { cash: 150, grade: 'B', message: "Mom is really happy. She gives you the biggest hug." },
    { cash: 250, grade: 'A', message: "Mom cries. You're her favorite. She will never admit this to your siblings." },
  ],
  lossMessage: "Detention. No recess for a week. Mom never got her gift.",
};
