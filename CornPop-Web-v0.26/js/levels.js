// Episode 1: CRYPT OF HORNT — eight maps in the style of Doom II's first maps (tech bases, yards, canyons, crushers),
// built with the level kit (js/kit.js) on a 32-unit grid.
// Episode 2: THE ROTTEN APPLE — eight storm-soaked New York street maps (js/maps/e2m*.js, built with js/nyc.js).
// Episode 3: THE PIDSER CAVE — the original Episode 1 maps up to v0.24 (js/maps/e3m*.js), big multi-level maps in the
// spirit of Arcane Dimensions. It hands out the weapons on the same schedule Episode 1 does.
import M1 from './maps/m1.js';
import M2 from './maps/m2.js';
import M3 from './maps/m3.js';
import M4 from './maps/m4.js';
import M5 from './maps/m5.js';
import M6 from './maps/m6.js';
import M7 from './maps/m7.js';
import M8 from './maps/m8.js';
import E2M1 from './maps/e2m1.js';
import E2M2 from './maps/e2m2.js';
import E2M3 from './maps/e2m3.js';
import E2M4 from './maps/e2m4.js';
import E2M5 from './maps/e2m5.js';
import E2M6 from './maps/e2m6.js';
import E2M7 from './maps/e2m7.js';
import E2M8 from './maps/e2m8.js';
import E3M1 from './maps/e3m1.js';
import E3M2 from './maps/e3m2.js';
import E3M3 from './maps/e3m3.js';
import E3M4 from './maps/e3m4.js';
import E3M5 from './maps/e3m5.js';
import E3M6 from './maps/e3m6.js';
import E3M7 from './maps/e3m7.js';
import E3M8 from './maps/e3m8.js';

const E1 = [M1, M2, M3, M4, M5, M6, M7, M8];
const E2 = [E2M1, E2M2, E2M3, E2M4, E2M5, E2M6, E2M7, E2M8];
const E3 = [E3M1, E3M2, E3M3, E3M4, E3M5, E3M6, E3M7, E3M8];

export const EPISODES = [
  { title: 'EPISODE 1: CRYPT OF HORNT', start: 0, count: E1.length, ending: 'CORNPOP CLEARED THE CRYPT OF HORNT!\nBUT THE QOQS FLED TO NEW YORK...' },
  { title: 'EPISODE 2: THE ROTTEN APPLE', start: E1.length, count: E2.length, ending: 'THE STORM BREAKS OVER MANHATTAN.\nCORNPOP SAVED NEW YORK!\nBUT THE LAST QOQS RAN HOME TO THE PIDSER CAVE...' },
  { title: 'EPISODE 3: THE PIDSER CAVE', start: E1.length + E2.length, count: E3.length, ending: 'CORNPOP CONQUERED THE PIDSER CAVE!\nTHE QOQS ARE FINISHED FOR GOOD.' },
];
export const LEVELS = [...E1, ...E2, ...E3];
// level index -> episode and map number inside it
export function episodeOf(i) { let ep = 0; while (ep + 1 < EPISODES.length && i >= EPISODES[ep + 1].start) ep++; return { ep, mi: i - EPISODES[ep].start }; }
